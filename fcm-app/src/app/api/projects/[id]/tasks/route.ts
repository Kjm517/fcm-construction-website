import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET all tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    return NextResponse.json([])
  }

  try {
    const { data, error } = await supabase!
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) throw error

    // Transform to frontend format
    const tasks = (data || []).map((task: any) => ({
      id: task.id,
      name: task.name,
      isFinished: task.is_finished,
      orderIndex: task.order_index,
    }))

    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST create new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({
      id: `temp-${Date.now()}`,
      name: body.name,
      isFinished: false,
      orderIndex: body.orderIndex || 0,
    }, { status: 201 })
  }

  try {
    const body = await request.json()

    // Get the max order_index for this project
    const { data: existingTasks } = await supabase!
      .from('project_tasks')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = existingTasks && existingTasks.length > 0
      ? (existingTasks[0].order_index || 0) + 1
      : 0

    const { data, error } = await supabase!
      .from('project_tasks')
      .insert([
        {
          project_id: projectId,
          name: body.name,
          is_finished: false,
          order_index: nextOrderIndex,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Update project's last_edited_by and updated_at when task is created
    try {
      const currentUser = request.headers.get('x-user-id') || 'Admin';
      const username = request.headers.get('x-username') || currentUser;
      
      await supabase!
        .from('projects')
        .update({
          updated_at: new Date().toISOString(),
          last_edited_by: username,
        })
        .eq('id', projectId);
    } catch (updateError) {
      // Log but don't fail if project update fails
      console.warn('Failed to update project timestamp:', updateError);
    }

    // Transform to frontend format
    const task = {
      id: data.id,
      name: data.name,
      isFinished: data.is_finished,
      orderIndex: data.order_index,
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}

// PUT update multiple tasks (for batch updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({ success: true })
  }

  try {
    const body = await request.json()
    const tasks = body.tasks || []

    if (tasks.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Update each task
    const updates = tasks.map((task: any) =>
      supabase!
        .from('project_tasks')
        .update({
          name: task.name,
          is_finished: task.isFinished,
          order_index: task.orderIndex || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('project_id', projectId)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update tasks' },
      { status: 500 }
    )
  }
}

