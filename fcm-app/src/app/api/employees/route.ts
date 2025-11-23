import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET all employees
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([])
  }

  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST create new employee
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({
      id: `temp-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }

  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const { data: existingUser } = await supabase!
      .from('users')
      .select('id')
      .eq('username', body.username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase!
      .from('users')
      .insert([
        {
          username: body.username,
          password: body.password, // In production, this should be hashed
          password_hash: body.password, // Also set password_hash for backward compatibility
          full_name: body.fullName || null,
          position: body.position || null,
          contact_number: body.contactNumber || null,
          email: body.email || null,
          employee_id: body.employeeId || null,
          address: body.address || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    )
  }
}

