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
            const timeParts = todo.scheduled_time.split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0], 10);
              const minutes = parseInt(timeParts[1], 10);
              
              if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                // Set the time on the base date
                baseDate.setHours(hours, minutes, 0, 0);
                taskStartTime = baseDate;
                
                // If the time has already passed today and we're using today's date, try tomorrow
                if (!parent?.start_time && taskStartTime.getTime() < now.getTime()) {
                  baseDate.setDate(baseDate.getDate() + 1);
                  taskStartTime = baseDate;
                }
              }
            }
          }

          if (!taskStartTime) return;

          // Check if task starts between now and 30 seconds from now
          // Expand window for mobile devices (check every 5 seconds, so need wider window)
          const timeUntilStart = taskStartTime.getTime() - now.getTime();
          
          // Expanded window: 20-40 seconds to account for mobile timing and 5-second check interval
          if (
            timeUntilStart >= 20000 && // At least 20 seconds away
            timeUntilStart <= 40000 && // At most 40 seconds away
            !notifiedTasksRef.current.has(taskId)
          ) {
            // Show notification
            console.log(`[Notifications] Triggering notification for ${todo.parent_id ? 'subtask' : 'task'}: ${todo.text}, time until start: ${Math.round(timeUntilStart / 1000)}s`);
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

    // Check more frequently for better mobile support (every 3 seconds)
    checkIntervalRef.current = setInterval(checkUpcomingTasks, 3000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [permission, isNotificationSupported]);

  const showNotification = (todo: Todo, taskStartTime?: Date) => {
    // Double-check permission before showing notification
    if (!isNotificationSupported) {
      console.warn('[Notifications] Notifications not supported');
      return;
    }

    // Check current permission (it might have changed)
    const currentPermission = Notification.permission;
    if (currentPermission !== 'granted') {
      console.warn('[Notifications] Permission not granted:', currentPermission);
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
      const notificationBody = `${prefix}${todo.text}${timeString ? ` at ${timeString}` : ''}`;
      console.log(`[Notifications] Creating notification: ${notificationBody}`);
      
      // Create notification using the Notifications Web API
      // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notification
      const notification = new Notification('Task Starting Soon!', {
        body: notificationBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `task-${todo.id}`, // Prevent duplicate notifications with the same tag
        requireInteraction: false,
        silent: false, // Allow notification sounds
      });

      console.log(`[Notifications] Notification created successfully for ${isSubtask ? 'subtask' : 'task'}: ${todo.text}`);

      // Handle click event on notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      // Handle error event
      notification.onerror = (error) => {
        console.error(`[Notifications] Notification error for ${isSubtask ? 'subtask' : 'task'} "${todo.text}":`, error);
      };

      // Handle close event (optional, for logging)
      notification.onclose = () => {
        console.log(`[Notifications] Notification closed for ${isSubtask ? 'subtask' : 'task'}: ${todo.text}`);
      };
    } catch (error) {
      console.error(`[Notifications] Error creating notification for ${isSubtask ? 'subtask' : 'task'} "${todo.text}":`, error);
    }
  };

  // Don't render anything visible
  return null;
}
