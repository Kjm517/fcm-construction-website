import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET single task reminder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const reminderId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(null);
  }

  try {
    const { data, error } = await supabase!
      .from('task_reminders')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          client_name,
          building_address
        ),
        creator:created_by (
          id,
          full_name,
          username
        ),
        tags:task_reminder_tags (
          id,
          user_id,
          position,
          user:user_id (
            id,
            full_name,
            username,
            position
          )
        ),
        completions:task_reminder_completions (
          id,
          user_id,
          completed_at,
          user:user_id (
            id,
            full_name,
            username
          )
        )
      `)
      .eq('id', reminderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(null, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching task reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task reminder' },
      { status: 500 }
    );
  }
}

// PUT update task reminder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const reminderId = resolvedParams.id;

  if (!isSupabaseConfigured()) {
    const body = await request.json();
    return NextResponse.json({
      id: reminderId,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }

  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id');

    // Check ownership before allowing update
    const { data: existingReminder, error: fetchError } = await supabase!
      .from('task_reminders')
      .select('created_by')
      .eq('id', reminderId)
      .single();

    if (fetchError) throw fetchError;

    if (userId && existingReminder.created_by !== userId) {
      return NextResponse.json(
        { error: 'You can only edit reminders you created' },
        { status: 403 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.reminderDate !== undefined && body.reminderTime !== undefined) {
      const reminderDateTime = new Date(`${body.reminderDate}T${body.reminderTime}`);
      updateData.reminder_date = reminderDateTime.toISOString();
      updateData.reminder_time = body.reminderTime;
    }
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline).toISOString() : null;
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.projectId !== undefined) updateData.project_id = body.projectId || null;

    const { data, error } = await supabase!
      .from('task_reminders')
      .update(updateData)
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;

    // Update tags if provided
    if (body.userIds !== undefined || body.positions !== undefined) {
      // Delete existing tags
      await supabase!
        .from('task_reminder_tags')
        .delete()
        .eq('task_reminder_id', reminderId);

      // Insert new tags
      const tagsToInsert: any[] = [];

      if (body.userIds && Array.isArray(body.userIds)) {
        for (const tagUserId of body.userIds) {
          if (tagUserId) {
            tagsToInsert.push({
              task_reminder_id: reminderId,
              user_id: tagUserId,
              position: null,
            });
          }
        }
      }

      if (body.positions && Array.isArray(body.positions)) {
        for (const position of body.positions) {
          if (position) {
            tagsToInsert.push({
              task_reminder_id: reminderId,
              user_id: null,
              position: position,
            });
          }
        }
      }

      if (tagsToInsert.length > 0) {
        const { error: tagError } = await supabase!
          .from('task_reminder_tags')
          .insert(tagsToInsert);
        
        if (tagError) {
          console.error('Error updating tags (non-fatal):', tagError);
        }
      }
    }

    // Fetch updated reminder with relations
    const { data: fullData, error: fetchFullError } = await supabase!
      .from('task_reminders')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          client_name,
          building_address
        ),
        creator:created_by (
          id,
          full_name,
          username
        ),
        tags:task_reminder_tags (
          id,
          user_id,
          position,
          user:user_id (
            id,
            full_name,
            username,
            position
          )
        ),
        completions:task_reminder_completions (
          id,
          user_id,
          completed_at,
          user:user_id (
            id,
            full_name,
            username
          )
        )
      `)
      .eq('id', reminderId)
      .single();

    if (fetchFullError) {
      console.error('Error fetching updated reminder (non-fatal):', fetchFullError);
      return NextResponse.json(data);
    }

    return NextResponse.json(fullData || data);
  } catch (error: any) {
    console.error('Error updating task reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update task reminder' },
      { status: 500 }
    );
  }
}

// DELETE task reminder
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

    // Check ownership before allowing delete
    const { data: existingReminder, error: fetchError } = await supabase!
      .from('task_reminders')
      .select('created_by')
      .eq('id', reminderId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Task reminder not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    if (userId && existingReminder.created_by !== userId) {
      return NextResponse.json(
        { error: 'You can only delete reminders you created' },
        { status: 403 }
      );
    }

    // Delete the reminder (cascading deletes will handle tags and completions)
    const { error } = await supabase!
      .from('task_reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete task reminder' },
      { status: 500 }
    );
  }
}

