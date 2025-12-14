'use server';

import { createServerClient } from './supabase';
import { revalidatePath } from 'next/cache';
import { breakDownTask } from './gemini';

export async function addTodo(formData: FormData) {
  const text = formData.get('text') as string;
  const startTime = formData.get('start_time') as string;
  const endTime = formData.get('end_time') as string;
  const shouldBreakdown = formData.get('should_breakdown') === 'true';
  
  if (!text || !text.trim()) {
    return;
  }

  try {
    const supabase = createServerClient();
    
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
      const subtasks = await breakDownTask(text.trim(), startTimeISO, endTimeISO);
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
