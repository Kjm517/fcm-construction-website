import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET all projects
export async function GET() {
  if (!isSupabaseConfigured()) {
    // Return empty array instead of error to allow localStorage fallback
    return NextResponse.json([])
  }

  try {
    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    // Return empty array on error to allow localStorage fallback
    return NextResponse.json([])
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Return the created data to allow localStorage fallback
    const body = await request.json()
    return NextResponse.json({ 
      id: `temp-${Date.now()}`,
      project_name: body.projectName,
      client_name: body.clientName,
      client_contact: body.clientContact || null,
      building_address: body.buildingAddress,
      work_type: body.workType,
      scope_of_work: body.scopeOfWork,
      project_cost: body.projectCost || null,
      deadline_date: body.deadlineDate,
      files: body.files || null,
      tasks: body.tasks || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }

  try {
    const body = await request.json()
    
    const { data, error } = await supabase!
      .from('projects')
      .insert([
        {
          project_name: body.projectName,
          client_name: body.clientName,
          client_contact: body.clientContact || null,
          building_address: body.buildingAddress,
          work_type: body.workType,
          scope_of_work: body.scopeOfWork,
          project_cost: body.projectCost || null,
          deadline_date: body.deadlineDate,
          files: body.files || null,
          tasks: body.tasks || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}

