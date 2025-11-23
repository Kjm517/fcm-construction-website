import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// PUT update single task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> | { id: string; taskId: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id
  const taskId = resolvedParams.taskId

  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({
      id: taskId,
      name: body.name,
      isFinished: body.isFinished,
      orderIndex: body.orderIndex || 0,
    })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase!
      .from('project_tasks')
      .update({
        name: body.name,
        is_finished: body.isFinished,
        order_index: body.orderIndex || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) throw error

    // Update project's last_edited_by and updated_at when task is modified
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

    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> | { id: string; taskId: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id
  const taskId = resolvedParams.taskId

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  try {
    const { error } = await supabase!
      .from('project_tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', projectId)

    if (error) throw error

    // Update project's last_edited_by and updated_at when task is deleted
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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete task' },
      { status: 500 }
    )
  }
}

