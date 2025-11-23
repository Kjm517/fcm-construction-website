import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET single quote request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const requestId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(null);
  }

  try {
    const { data, error } = await supabase!
      .from('quote_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(null, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching quote request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quote request' },
      { status: 500 }
    );
  }
}

// PUT update quote request (e.g., change status, assign reviewer)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const requestId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    const body = await request.json();
    return NextResponse.json({
      id: requestId,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }

  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id');

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;
      
      // If status is being changed from pending, set reviewed_by and reviewed_at
      if (body.status !== 'pending' && userId) {
        updateData.reviewed_by = userId;
        updateData.reviewed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase!
      .from('quote_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating quote request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quote request' },
      { status: 500 }
    );
  }
}

// DELETE quote request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const requestId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  try {
    const { error } = await supabase!
      .from('quote_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting quote request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quote request' },
      { status: 500 }
    );
  }
}

