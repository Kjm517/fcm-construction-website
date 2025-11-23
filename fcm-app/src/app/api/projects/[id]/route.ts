import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both Next.js 15+ (Promise) and older versions
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id

  console.log('=== PROJECT API CALL ===')
  console.log('Project ID:', projectId)
  console.log('Supabase configured:', isSupabaseConfigured())
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
  console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning null for project:', projectId)
    return NextResponse.json(null)
  }

  try {
    console.log('Querying Supabase for project:', projectId)
    
    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    console.log('Supabase query result:', { data: data ? 'FOUND' : 'NULL', error: error ? error.message : 'NONE' })

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Check if it's a "not found" error
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
        console.log('Project not found in database (PGRST116)')
        return NextResponse.json(null)
      }
      
      // For other errors, return error details for debugging
      console.log('Supabase error (not PGRST116), returning error details')
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    if (!data) {
      console.log('No data returned from database (data is null)')
      return NextResponse.json(null)
    }

    // Fetch tasks from project_tasks table
    let tasks: any[] = []
    try {
      const { data: tasksData, error: tasksError } = await supabase!
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (!tasksError && tasksData) {
        tasks = tasksData.map((task: any) => ({
          id: task.id,
          name: task.name,
          isFinished: task.is_finished,
          orderIndex: task.order_index,
        }))
      }
    } catch (tasksErr) {
      console.warn('Error fetching tasks (table might not exist yet):', tasksErr)
      // Continue without tasks if table doesn't exist
    }

    // Add tasks to project data
    const projectWithTasks = {
      ...data,
      tasks: tasks,
    }

    console.log('✅ Project found in database:', {
      id: data.id,
      project_name: data.project_name,
      client_name: data.client_name,
      tasks_count: tasks.length
    })
    return NextResponse.json(projectWithTasks)
  } catch (error: any) {
    console.error('Unexpected error fetching project:', error)
    return NextResponse.json(
      { error: error.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    // Return the updated data to allow localStorage fallback
    const body = await request.json()
    // Transform back to frontend format for localStorage
    const updatedData = {
      id: projectId,
      projectName: body.projectName,
      clientName: body.clientName,
      clientContact: body.clientContact || '',
      buildingAddress: body.buildingAddress,
      workType: body.workType,
      scopeOfWork: body.scopeOfWork,
      projectCost: body.projectCost || '',
      deadlineDate: body.deadlineDate,
      lastEditedBy: body.lastEditedBy || 'Admin',
      files: body.files || null,
      tasks: body.tasks || [], // Tasks are handled separately
      updatedAt: Date.now(),
      createdAt: Date.now(), // Will be preserved from original
    }
    return NextResponse.json(updatedData)
  }

  try {
    const body = await request.json()
    
    console.log('Project update request body:', body);
    console.log('lastEditedBy value:', body.lastEditedBy);
    
    // Build update object - only include last_edited_by if it's provided
    // This allows the update to work even if the column doesn't exist yet
    const updateData: any = {
      project_name: body.projectName,
      client_name: body.clientName,
      client_contact: body.clientContact || null,
      building_address: body.buildingAddress,
      work_type: body.workType,
      scope_of_work: body.scopeOfWork,
      project_cost: body.projectCost || null,
      deadline_date: body.deadlineDate,
      files: body.files || null,
      // Tasks are handled separately via /api/projects/[id]/tasks
      updated_at: new Date().toISOString(),
    };
    
    // Only add last_edited_by if provided (will fail gracefully if column doesn't exist)
    if (body.lastEditedBy !== undefined) {
      updateData.last_edited_by = body.lastEditedBy || null;
    }
    
    const { data, error } = await supabase!
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error);
      // If error is about missing column, try update without last_edited_by
      if (error.message?.includes('last_edited_by') || error.message?.includes('column')) {
        console.warn('last_edited_by column not found, updating without it');
        const { data: dataWithoutColumn, error: errorWithoutColumn } = await supabase!
          .from('projects')
          .update({
            project_name: body.projectName,
            client_name: body.clientName,
            client_contact: body.clientContact || null,
            building_address: body.buildingAddress,
            work_type: body.workType,
            scope_of_work: body.scopeOfWork,
            project_cost: body.projectCost || null,
            deadline_date: body.deadlineDate,
            // Tasks are handled separately via /api/projects/[id]/tasks
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .select()
          .single();
        
        if (errorWithoutColumn) {
          throw errorWithoutColumn;
        }
        
        // Manually add lastEditedBy to the response for frontend
        const responseData = {
          ...dataWithoutColumn,
          last_edited_by: body.lastEditedBy || null,
        };
        console.log('Updated project data (without last_edited_by column):', responseData);
        return NextResponse.json(responseData);
      }
      throw error;
    }

    console.log('Updated project data:', data);
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const projectId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    // Return success to allow localStorage fallback
    return NextResponse.json({ success: true })
  }

  try {
    const { error } = await supabase!
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    )
  }
}

