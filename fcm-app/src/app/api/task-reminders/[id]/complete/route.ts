import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// POST mark reminder as done for a specific user
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
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Insert completion record (UNIQUE constraint prevents duplicates)
    const { data, error } = await supabase!
      .from('task_reminder_completions')
      .insert([
        {
          task_reminder_id: reminderId,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      // If it's a unique constraint violation, the user already marked it as done
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already marked as done' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error marking reminder as done:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark reminder as done' },
      { status: 500 }
    );
  }
}

// DELETE unmark reminder as done for a specific user
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
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase!
      .from('task_reminder_completions')
      .delete()
      .eq('task_reminder_id', reminderId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error unmarking reminder as done:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unmark reminder as done' },
      { status: 500 }
    );
  }
}

