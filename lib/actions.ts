'use server';

import { createServerClient } from './supabase';
import { revalidatePath } from 'next/cache';
import { breakDownTask } from './gemini';

export async function addTodo(formData: FormData) {
  const text = formData.get('text') as string;
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const note = formData.get('note') as string;
  const shouldBreakdown = formData.get('should_breakdown') === 'true';
  
  if (!text || !text.trim()) {
    return;
  }

  try {
    const supabase = createServerClient();
    
    // Parse dates if provided
    // If startTime/endTime is already an ISO string (contains 'Z' or timezone offset), use it directly
    // Otherwise, parse it as datetime-local format (shouldn't happen if client sends ISO strings)
    const isISOString = (dateString: string): boolean => {
      // ISO 8601 format: contains 'Z' (UTC) or timezone offset (+HH:MM or -HH:MM)
      return dateString.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateString) || /[+-]\d{4}$/.test(dateString);
    };
    
    const startTimeISO = startTime 
      ? (isISOString(startTime) ? startTime : new Date(startTime).toISOString())
      : null;
    const endTimeISO = endTime 
      ? (isISOString(endTime) ? endTime : new Date(endTime).toISOString())
      : null;
    
    // Insert the main todo
    const { data: mainTodo, error: mainError } = await supabase
      .from('todos')
      .insert([{ 
        text: text.trim(), 
        completed: false,
        parent_id: null,
        order_index: 0,
        start_time: startTimeISO,
        end_time: endTimeISO,
        should_breakdown: shouldBreakdown
      }])
      .select()
      .single();

    if (mainError) {
      console.error('Error adding todo:', mainError);
      return;
    }

    // Automatically break down the task into subtasks if enabled
    if (shouldBreakdown) {
      console.log('[Actions] Breaking down task:', text.trim());
      console.log('[Actions] Start time:', startTimeISO);
      console.log('[Actions] End time:', endTimeISO);
      console.log('[Actions] Note:', note || '(none)');
      const subtasks = await breakDownTask(text.trim(), startTimeISO, endTimeISO, note || null);
      console.log('[Actions] Received', subtasks.length, 'subtasks');
      
      if (subtasks.length > 0 && mainTodo) {
        console.log('[Actions] Inserting subtasks for todo:', mainTodo.id);
        // Insert subtasks
        const subtasksToInsert = subtasks.map(subtask => ({
          text: subtask.text,
          completed: false,
          parent_id: mainTodo.id,
          order_index: subtask.order_index,
          scheduled_time: subtask.scheduled_time,
        }));

        const { error: subtasksError } = await supabase
          .from('todos')
          .insert(subtasksToInsert);

        if (subtasksError) {
          console.error('Error adding subtasks:', subtasksError);
        }
      }
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error adding todo:', error);
  }
}

export async function toggleTodo(formData: FormData) {
  const id = formData.get('id') as string;
  const completed = formData.get('completed') === 'true';

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error toggling todo:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error toggling todo:', error);
  }
}

export async function deleteTodo(formData: FormData) {
  const id = formData.get('id') as string;

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
}

export async function updateTodo(formData: FormData) {
  const id = formData.get('id') as string;
  const text = formData.get('text') as string;

  if (!text || !text.trim()) {
    return;
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('todos')
      .update({ text: text.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating todo:', error);
  }
}

export async function updateTodoTime(formData: FormData) {
  const id = formData.get('id') as string;
  const startTime = formData.get('start_time') as string | null;
  const endTime = formData.get('end_time') as string | null;
  const scheduledTime = formData.get('scheduled_time') as string | null;

  try {
    const supabase = createServerClient();
    const updateData: any = { updated_at: new Date().toISOString() };

    // Helper to check if a string is already an ISO string
    const isISOString = (dateString: string): boolean => {
      // ISO 8601 format: contains 'Z' (UTC) or timezone offset (+HH:MM or -HH:MM)
      return dateString.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateString) || /[+-]\d{4}$/.test(dateString);
    };
    
    if (startTime !== null) {
      // If startTime is already an ISO string, use it directly
      // Otherwise, parse it (shouldn't happen if client sends ISO strings)
      updateData.start_time = startTime 
        ? (isISOString(startTime) ? startTime : new Date(startTime).toISOString())
        : null;
    }
    if (endTime !== null) {
      // If endTime is already an ISO string, use it directly
      updateData.end_time = endTime 
        ? (isISOString(endTime) ? endTime : new Date(endTime).toISOString())
        : null;
    }
    if (scheduledTime !== null) {
      // scheduled_time is stored as HH:MM string, validate format
      if (scheduledTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(scheduledTime)) {
          console.error('Invalid scheduled_time format:', scheduledTime);
          return;
        }
      }
      updateData.scheduled_time = scheduledTime || null;
    }

    const { error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating todo time:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error updating todo time:', error);
  }
}

// ============================================
// Reminder Actions
// ============================================

export async function addReminder(formData: FormData) {
  const text = formData.get('text') as string;

  if (!text || !text.trim()) {
    return;
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('reminders')
      .insert([{ 
        text: text.trim(), 
        completed: false
      }]);

    if (error) {
      console.error('Error adding reminder:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error adding reminder:', error);
  }
}

export async function toggleReminder(formData: FormData) {
  const id = formData.get('id') as string;
  const completed = formData.get('completed') === 'true';

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('reminders')
      .update({ completed: !completed, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error toggling reminder:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error toggling reminder:', error);
  }
}

export async function deleteReminder(formData: FormData) {
  const id = formData.get('id') as string;

  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reminder:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error deleting reminder:', error);
  }
}

export async function deleteAllReminders() {
  try {
    const supabase = createServerClient();
    // Delete all reminders by selecting all and deleting them
    const { data: allReminders, error: fetchError } = await supabase
      .from('reminders')
      .select('id');

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      return;
    }

    if (!allReminders || allReminders.length === 0) {
      return; // No reminders to delete
    }

    // Delete all reminders
    const { error } = await supabase
      .from('reminders')
      .delete()
      .in('id', allReminders.map(r => r.id));

    if (error) {
      console.error('Error deleting all reminders:', error);
      return;
    }
    
    revalidatePath('/');
  } catch (error) {
    console.error('Error deleting all reminders:', error);
  }
}
