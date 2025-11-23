import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET all tags for a reminder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const reminderId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const { data, error } = await supabase!
      .from('task_reminder_tags')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          username,
          position
        )
      `)
      .eq('task_reminder_id', reminderId);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching reminder tags:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminder tags' },
      { status: 500 }
    );
  }
}

// POST add tags to a reminder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const reminderId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await request.json();
    const { userIds, positions } = body;

    const tagsToInsert: any[] = [];

    // Add user tags
    if (userIds && Array.isArray(userIds)) {
      for (const userId of userIds) {
        if (userId) {
          tagsToInsert.push({
            task_reminder_id: reminderId,
            user_id: userId,
            position: null,
          });
        }
      }
    }

    // Add position tags
    if (positions && Array.isArray(positions)) {
      for (const position of positions) {
        if (position) {
          tagsToInsert.push({
            task_reminder_id: reminderId,
            user_id: null,
            position: position,
          });
        }
      }
    }

    if (tagsToInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'No tags to add' });
    }

    const { error } = await supabase!
      .from('task_reminder_tags')
      .insert(tagsToInsert);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding reminder tags:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add reminder tags' },
      { status: 500 }
    );
  }
}

// DELETE remove tags from a reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const reminderId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await request.json();
    const { userIds, positions } = body;

    let query = supabase!
      .from('task_reminder_tags')
      .delete()
      .eq('task_reminder_id', reminderId);

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    if (positions && Array.isArray(positions) && positions.length > 0) {
      query = query.in('position', positions);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing reminder tags:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove reminder tags' },
      { status: 500 }
    );
  }
}

