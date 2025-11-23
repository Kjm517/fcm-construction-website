import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET all task reminders (optionally filtered by date)
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const status = searchParams.get('status'); // pending, completed, cancelled
    const userId = searchParams.get('userId'); // Filter by tagged user
    const userPosition = searchParams.get('userPosition'); // Filter by tagged position

    let query = supabase!
      .from('task_reminders')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          client_name
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
      .order('reminder_date', { ascending: true })
      .order('reminder_time', { ascending: true });

    // Filter by date if provided (optional - if not provided, get all)
    if (date) {
      // Parse the date string (YYYY-MM-DD) and create date range in UTC
      const dateObj = new Date(date + 'T00:00:00Z');
      const startOfDay = new Date(dateObj);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setUTCHours(23, 59, 59, 999);

      console.log('Filtering by date:', date, 'Range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

      query = query
        .gte('reminder_date', startOfDay.toISOString())
        .lte('reminder_date', endOfDay.toISOString());
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to only pending reminders
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by user/position tags if provided (client-side filtering for now)
    let filteredData = data || [];
    
    console.log('Raw reminders from DB:', filteredData.length);
    console.log('Filtering with userId:', userId, 'userPosition:', userPosition);
    
    if (userId || userPosition) {
      filteredData = filteredData.filter((reminder: any) => {
        // Always include if user created it (regardless of tags)
        if (userId && reminder.created_by === userId) {
          console.log('✓ Including reminder (created by user):', reminder.id, reminder.title, 'created_by:', reminder.created_by, 'userId:', userId);
          return true;
        }
        
        // If no tags, only show if user created it
        if (!reminder.tags || reminder.tags.length === 0) {
          const shouldInclude = userId && reminder.created_by === userId;
          if (!shouldInclude) {
            console.log('✗ Excluding reminder (no tags, not created by user):', reminder.id, reminder.title, 'created_by:', reminder.created_by, 'userId:', userId);
          }
          return shouldInclude;
        }
        
        // Check tags
        for (const tag of reminder.tags) {
          if (userId && tag.user_id === userId) {
            console.log('✓ Including reminder (tagged user):', reminder.id, reminder.title);
            return true;
          }
          if (userPosition && tag.position === userPosition) {
            console.log('✓ Including reminder (tagged position):', reminder.id, reminder.title);
            return true;
          }
        }
        
        console.log('✗ Excluding reminder (no matching tags):', reminder.id, reminder.title);
        return false;
      });
    } else {
      // If no user/position filter, show all reminders (for admin view)
      console.log('No user/position filter - showing all reminders');
      filteredData = data || [];
    }
    
    console.log('Filtered reminders:', filteredData.length);

    // Filter out reminders that the current user has already marked as done
    if (userId) {
      filteredData = filteredData.filter((reminder: any) => {
        // Check if current user has completed this reminder
        if (reminder.completions && reminder.completions.length > 0) {
          const userCompletion = reminder.completions.find((c: any) => c.user_id === userId);
          return !userCompletion; // Exclude if user has completed it
        }
        return true; // Include if no completions
      });
    }

    return NextResponse.json(filteredData);
  } catch (error: any) {
    console.error('Error fetching task reminders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task reminders' },
      { status: 500 }
    );
  }
}

// POST create new task reminder
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const body = await request.json();
    return NextResponse.json({
      id: `temp-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 });
  }

  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id');

    // Validate required fields
    if (!body.title || !body.reminderDate || !body.reminderTime) {
      return NextResponse.json(
        { error: 'Title, reminder date, and reminder time are required' },
        { status: 400 }
      );
    }

    // Combine date and time into a timestamp
    // reminder_date is TIMESTAMP WITH TIME ZONE, reminder_time is TIME
    const reminderDateStr = body.reminderDate;
    const reminderTimeStr = body.reminderTime;
    
    // Validate the date format
    if (!reminderDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(reminderDateStr)) {
      return NextResponse.json(
        { error: 'Invalid reminder date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate reminder time format (should be HH:MM or HH:MM:SS)
    if (!reminderTimeStr || !/^\d{2}:\d{2}(:\d{2})?$/.test(reminderTimeStr)) {
      return NextResponse.json(
        { error: 'Invalid reminder time format. Expected HH:MM or HH:MM:SS' },
        { status: 400 }
      );
    }

    // Combine date and time into a timestamp
    const reminderDateTime = new Date(`${reminderDateStr}T${reminderTimeStr}`);
    
    // Validate the combined datetime
    if (isNaN(reminderDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid reminder date or time combination' },
        { status: 400 }
      );
    }

    const insertData: any = {
      project_id: body.projectId || null,
      title: body.title,
      description: body.description || null,
      reminder_date: reminderDateTime.toISOString(), // TIMESTAMP WITH TIME ZONE
      reminder_time: reminderTimeStr, // TIME column
      priority: body.priority || 'medium',
      status: 'pending',
      created_by: userId || null,
    };

    // Only add deadline if provided and valid
    if (body.deadline) {
      const deadlineDate = new Date(body.deadline);
      if (!isNaN(deadlineDate.getTime())) {
        insertData.deadline = deadlineDate.toISOString();
      }
    }

    const { data, error } = await supabase!
      .from('task_reminders')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating reminder:', error);
      throw error;
    }

    // Add tags if provided
    if (body.userIds || body.positions) {
      const tagsToInsert: any[] = [];

      if (body.userIds && Array.isArray(body.userIds)) {
        for (const tagUserId of body.userIds) {
          if (tagUserId) {
            tagsToInsert.push({
              task_reminder_id: data.id,
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
              task_reminder_id: data.id,
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
          console.error('Error inserting tags (non-fatal):', tagError);
          // Don't fail the entire request if tags fail, but log it
        }
      }
    }

    // Fetch the created reminder with all relations
    const { data: fullData, error: fetchError } = await supabase!
      .from('task_reminders')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          client_name
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
        )
      `)
      .eq('id', data.id)
      .single();

    if (fetchError) {
      console.error('Error fetching created reminder (non-fatal):', fetchError);
      // Return the basic data if fetch fails
      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json(fullData || data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create task reminder' },
      { status: 500 }
    );
  }
}

