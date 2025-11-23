import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // If Supabase is not configured, fallback to hardcoded admin
    if (!isSupabaseConfigured()) {
      if (username === 'admin' && password === '123') {
        return NextResponse.json({
          success: true,
          user: {
            username: 'admin',
            id: 'default-admin'
          }
        })
      }
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Query the database for the user
    // Check for both password and password_hash columns for compatibility
    const { data, error } = await supabase!
      .from('users')
      .select('id, username, password, password_hash')
      .eq('username', username)
      .single()

    if (error || !data) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // For now, we'll store passwords in plain text for simplicity
    // In production, you should use proper password hashing (bcrypt, etc.)
    // Check password (try password column first, then password_hash for backward compatibility)
    const userPassword = data.password || data.password_hash;
    
    if (userPassword === password) {
      return NextResponse.json({
        success: true,
        user: {
          id: data.id,
          username: data.username
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

