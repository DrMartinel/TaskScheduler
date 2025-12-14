'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Todo } from '@/lib/types';

export default function TaskNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isNotificationSupported, setIsNotificationSupported] = useState(false);
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support and current permission status
  useEffect(() => {
    // Check if we're in the browser environment and if Notification API is supported
    const isBrowser = typeof window !== 'undefined';
    const supported = isBrowser && 'Notification' in window;
    setIsNotificationSupported(supported);
    
    // Check if the browser supports the Notification API
    if (!supported) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    // Set initial permission state
    setPermission(Notification.permission);

    // Note: We don't automatically request permission here.
    // Permission should be requested in response to a user gesture (via NotificationSettings component).
    // This follows MDN best practices: https://developer.mozilla.org/en-US/docs/Web/API/Notification
  }, []);

  // Check for upcoming tasks
  useEffect(() => {
    // Check browser support
    if (!isNotificationSupported) {
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    if (currentPermission !== 'granted') {
      setPermission(currentPermission);
      return;
    }

    setPermission('granted');

    const checkUpcomingTasks = async () => {
      try {
        const now = new Date();

        // Fetch all incomplete tasks (both parent tasks with start_time and subtasks with scheduled_time)
        const { data: todos, error } = await supabase
          .from('todos')
          .select('*')
          .eq('completed', false)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching todos for notifications:', error);
          return;
        }

        if (!todos) return;

        // Create a map of parent tasks for subtask date lookup
        const parentMap = new Map<string, Todo>();
        todos.forEach(todo => {
          if (!todo.parent_id) {
            parentMap.set(todo.id, todo);
          }
        });

        // Process all tasks (parent and subtasks)
        todos.forEach((todo: Todo) => {
          let taskStartTime: Date | null = null;
          let taskId = todo.id;

          // For parent tasks with start_time
          if (todo.start_time) {
            taskStartTime = new Date(todo.start_time);
          }
          // For subtasks with scheduled_time
          else if (todo.parent_id && todo.scheduled_time) {
            const parent = parentMap.get(todo.parent_id);
            let baseDate: Date;
            
            if (parent?.start_time) {
              // Use parent's date
              baseDate = new Date(parent.start_time);
            } else {
              // Use today's date
              baseDate = new Date(now);
              baseDate.setHours(0, 0, 0, 0);
            }
            
            // Parse scheduled_time (HH:MM format)
            const [hours, minutes] = todo.scheduled_time.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
              baseDate.setHours(hours, minutes, 0, 0);
              taskStartTime = baseDate;
            }
          }

          if (!taskStartTime) return;

          // Check if task starts between now and 30 seconds from now
          // Allow a 5-second window to account for timing variations
          const timeUntilStart = taskStartTime.getTime() - now.getTime();
          
          if (
            timeUntilStart >= 25000 && // At least 25 seconds away
            timeUntilStart <= 35000 && // At most 35 seconds away
            !notifiedTasksRef.current.has(taskId)
          ) {
            // Show notification
            showNotification(todo, taskStartTime);
            notifiedTasksRef.current.add(taskId);
          }

          // Clean up old notifications (tasks that have already started)
          if (taskStartTime.getTime() < now.getTime() - 60000) {
            // Remove from notified set if task started more than 1 minute ago
            notifiedTasksRef.current.delete(taskId);
          }
        });
      } catch (error) {
        console.error('Error checking upcoming tasks:', error);
      }
    };

    // Check immediately
    checkUpcomingTasks();

    // Check every 5 seconds for accurate timing
    checkIntervalRef.current = setInterval(checkUpcomingTasks, 5000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [permission, isNotificationSupported]);

  const showNotification = (todo: Todo, taskStartTime?: Date) => {
    // Double-check permission before showing notification
    if (!isNotificationSupported) {
      return;
    }

    // Check current permission (it might have changed)
    const currentPermission = Notification.permission;
    if (currentPermission !== 'granted') {
      setPermission(currentPermission);
      return;
    }

    const startTime = taskStartTime || (todo.start_time ? new Date(todo.start_time) : null);
    const timeString = startTime
      ? startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '';

    // Determine if this is a subtask
    const isSubtask = !!todo.parent_id;
    const prefix = isSubtask ? 'Subtask: ' : '';

    try {
      // Create notification using the Notifications Web API
      // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notification
      const notification = new Notification('Task Starting Soon!', {
        body: `${prefix}${todo.text}${timeString ? ` at ${timeString}` : ''}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `task-${todo.id}`, // Prevent duplicate notifications with the same tag
        requireInteraction: false, // Notification will auto-close
        silent: false, // Allow notification sounds
      });

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click event on notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      // Handle error event
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      // Handle close event (optional, for logging)
      notification.onclose = () => {
        // Notification was closed
      };
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Don't render anything visible
  return null;
}
