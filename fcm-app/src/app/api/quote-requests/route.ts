import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET all quote requests
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase!
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching quote requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quote requests' },
      { status: 500 }
    );
  }
}

// POST create new quote request
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const body = await request.json();
    return NextResponse.json({
      id: `temp-${Date.now()}`,
      ...body,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.fullName || !body.email || !body.phoneNumber || !body.projectType || !body.projectLocation || !body.projectDetails) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase!
      .from('quote_requests')
      .insert([
        {
          full_name: body.fullName,
          email: body.email,
          phone_number: body.phoneNumber,
          project_type: body.projectType,
          project_location: body.projectLocation,
          estimated_budget: body.estimatedBudget || null,
          project_details: body.projectDetails,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quote request' },
      { status: 500 }
    );
  }
}

