import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const employeeId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    return NextResponse.json(null)
  }

  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

// PUT update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const employeeId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({
      id: employeeId,
      ...body,
      updated_at: new Date().toISOString(),
    })
  }

  try {
    const body = await request.json()
    
    const updateData: any = {}
    
    // Map frontend fields to database fields
    if (body.username !== undefined) updateData.username = body.username
    if (body.password !== undefined && body.password.trim() !== '') {
      updateData.password = body.password // In production, this should be hashed
      updateData.password_hash = body.password // Also update password_hash for backward compatibility
    }
    if (body.fullName !== undefined) updateData.full_name = body.fullName
    if (body.position !== undefined) updateData.position = body.position
    if (body.contactNumber !== undefined) updateData.contact_number = body.contactNumber
    if (body.email !== undefined) updateData.email = body.email
    if (body.employeeId !== undefined) updateData.employee_id = body.employeeId
    if (body.address !== undefined) updateData.address = body.address

    // If username is being updated, check if it already exists
    if (body.username) {
      const { data: existingUser } = await supabase!
        .from('users')
        .select('id')
        .eq('username', body.username)
        .neq('id', employeeId)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase!
      .from('users')
      .update(updateData)
      .eq('id', employeeId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const employeeId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  try {
    // Prevent deleting yourself
    const currentUserId = request.headers.get('x-user-id')
    if (currentUserId === employeeId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const { error } = await supabase!
      .from('users')
      .delete()
      .eq('id', employeeId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

