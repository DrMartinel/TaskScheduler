'use client';

import { supabase } from './supabase';
import { breakDownTask } from './gemini';

export async function addTodoClient(formData: FormData) {
  const text = formData.get('text') as string;
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const note = formData.get('note') as string;
  const shouldBreakdown = formData.get('should_breakdown') === 'true';
  
  if (!text || !text.trim()) {
    return;
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    
    // Parse dates if provided
    const startTimeISO = startTime ? new Date(startTime).toISOString() : null;
    const endTimeISO = endTime ? new Date(endTime).toISOString() : null;
    
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
        should_breakdown: shouldBreakdown,
        user_id: user.id
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
      const subtasks = await breakDownTask(text.trim(), startTimeISO, endTimeISO, note || null);
      console.log('[Actions] Received', subtasks.length, 'subtasks');
      
      if (subtasks.length > 0 && mainTodo) {
        const subtasksToInsert = subtasks.map(subtask => ({
          text: subtask.text,
          completed: false,
          parent_id: mainTodo.id,
          order_index: subtask.order_index,
          scheduled_time: subtask.scheduled_time,
          user_id: user.id
        }));

        const { error: subtasksError } = await supabase
          .from('todos')
          .insert(subtasksToInsert);

        if (subtasksError) {
          console.error('Error adding subtasks:', subtasksError);
        }
      }
    }
    
    // Trigger a custom event to refresh the todos list
    window.dispatchEvent(new CustomEvent('todos-updated'));
  } catch (error) {
    console.error('Error adding todo:', error);
  }
}

export async function toggleTodoClient(formData: FormData) {
  const id = formData.get('id') as string;
  const completed = formData.get('completed') === 'true';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling todo:', error);
      return;
    }
    
    window.dispatchEvent(new CustomEvent('todos-updated'));
  } catch (error) {
    console.error('Error toggling todo:', error);
  }
}

export async function deleteTodoClient(formData: FormData) {
  const id = formData.get('id') as string;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting todo:', error);
      return;
    }
    
    window.dispatchEvent(new CustomEvent('todos-updated'));
  } catch (error) {
    console.error('Error deleting todo:', error);
  }
}

export async function updateTodoClient(formData: FormData) {
  const id = formData.get('id') as string;
  const text = formData.get('text') as string;

  if (!text || !text.trim()) {
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const { error } = await supabase
      .from('todos')
      .update({ text: text.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating todo:', error);
      return;
    }
    
    window.dispatchEvent(new CustomEvent('todos-updated'));
  } catch (error) {
    console.error('Error updating todo:', error);
  }
}

export async function updateTodoTimeClient(formData: FormData) {
  const id = formData.get('id') as string;
  const startTime = formData.get('start_time') as string | null;
  const endTime = formData.get('end_time') as string | null;
  const scheduledTime = formData.get('scheduled_time') as string | null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    if (startTime !== null) {
      updateData.start_time = startTime ? new Date(startTime).toISOString() : null;
    }
    if (endTime !== null) {
      updateData.end_time = endTime ? new Date(endTime).toISOString() : null;
    }
    if (scheduledTime !== null) {
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
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating todo time:', error);
      return;
    }
    
    window.dispatchEvent(new CustomEvent('todos-updated'));
  } catch (error) {
    console.error('Error updating todo time:', error);
  }
}

