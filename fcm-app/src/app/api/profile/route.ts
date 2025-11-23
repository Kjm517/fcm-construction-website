import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET user profile
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    // Return mock profile for fallback
    return NextResponse.json({
      id: userId,
      username: 'admin',
      full_name: 'Administrator',
      position: 'System Administrator',
      contact_number: '',
      email: '',
      bio: '',
      address: '',
      employee_id: '',
      department: '',
      hire_date: null,
    });
  }

  try {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error fetching profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...profileData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // Return updated profile for fallback
      return NextResponse.json({
        id: userId,
        ...profileData,
      });
    }

    const updateData: { [key: string]: any } = {};

    // Map frontend fields to database fields
    // Note: employee_id and position are not editable, so we don't update them here
    if (profileData.fullName !== undefined && profileData.fullName !== null) {
      updateData.full_name = profileData.fullName;
    }
    if (profileData.contactNumber !== undefined && profileData.contactNumber !== null) {
      updateData.contact_number = profileData.contactNumber;
    }
    if (profileData.email !== undefined && profileData.email !== null) {
      updateData.email = profileData.email;
    }
    if (profileData.address !== undefined && profileData.address !== null) {
      updateData.address = profileData.address;
    }
    
    // Handle password change - requires both old and new password
    if (profileData.oldPassword && profileData.newPassword) {
      // First, verify the old password
      const { data: currentUser } = await supabase!
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();
      
      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Compare old password (in production, use proper password hashing comparison)
      if (currentUser.password !== profileData.oldPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      // If old password matches, update to new password
      updateData.password = profileData.newPassword; // In production, this should be hashed
      updateData.password_hash = profileData.newPassword; // Also update password_hash for backward compatibility
    } else if (profileData.oldPassword || profileData.newPassword) {
      // If only one password field is provided, return error
      return NextResponse.json(
        { error: 'Please provide both current password and new password to change your password' },
        { status: 400 }
      );
    }

    // If no fields to update, return current profile
    if (Object.keys(updateData).length === 0) {
      const { data: currentData } = await supabase!
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      return NextResponse.json(currentData);
    }

    console.log('Updating profile with data:', updateData);
    console.log('User ID:', userId);

    const { data, error } = await supabase!
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating profile:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      return NextResponse.json(
        { 
          error: 'Failed to update profile',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

