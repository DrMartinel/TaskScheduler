'use client';

import { useState, useMemo, useEffect } from 'react';
import { Todo } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CalendarProps {
  todos: Todo[];
}

type ViewMode = 'day' | 'week';

export default function Calendar({ todos }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get date range for current view (needed for subtask date calculation)
  const getDateRangeForMemo = () => {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);

    if (viewMode === 'day') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  // Get parent tasks with time information (exclude subtasks)
  const tasksWithTime = useMemo(() => {
    return todos.filter(todo => {
      // Only show parent tasks (no parent_id)
      if (todo.parent_id) return false;
      // Only show tasks with start_time or end_time
      return todo.start_time || todo.end_time;
    }).sort((a, b) => {
      const aTime = a.start_time ? new Date(a.start_time).getTime() : 0;
      const bTime = b.start_time ? new Date(b.start_time).getTime() : 0;
      return aTime - bTime;
    });
  }, [todos]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'day') {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      } else {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get date range for current view
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const { start, end } = getDateRange();

  // Filter tasks within the date range
  const tasksInRange = tasksWithTime.filter(todo => {
    // All tasks in tasksWithTime should have start_time now (we convert scheduled_time to start_time)
    const taskStart = todo.start_time ? new Date(todo.start_time) : null;
    const taskEnd = todo.end_time ? new Date(todo.end_time) : null;

    if (!taskStart) return false;

    // For day view, check if task is on the current date
    if (viewMode === 'day') {
      const taskDate = taskStart.toDateString();
      const currentDateStr = currentDate.toDateString();
      return taskDate === currentDateStr;
    }

    // For week view, check if task falls within the week range
    if (taskStart && taskEnd) {
      return (taskStart <= end && taskEnd >= start);
    } else if (taskStart) {
      return taskStart >= start && taskStart <= end;
    }
    return false;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return `${Math.round(diffMs / (1000 * 60))} minutes`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours * 10) / 10} hours`;
    } else {
      const days = Math.round(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  // Get subtasks for a task
  const getSubtasks = (taskId: string) => {
    return todos
      .filter(todo => todo.parent_id === taskId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  // Generate hours for the timeline (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get tasks that overlap with a specific hour
  const getTasksForHour = (hour: number) => {
    return tasksInRange.filter(todo => {
      if (!todo.start_time) return false;
      const taskStart = new Date(todo.start_time);
      const taskEnd = todo.end_time ? new Date(todo.end_time) : new Date(taskStart.getTime() + 60 * 60 * 1000); // Default 1 hour
      
      const hourStart = new Date(taskStart);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);
      
      // Check if task overlaps with this hour
      return taskStart < hourEnd && taskEnd > hourStart;
    });
  };

  // Calculate position for current time indicator
  const getCurrentTimePosition = () => {
    if (viewMode === 'day') {
      const today = new Date();
      const isToday = today.toDateString() === currentDate.toDateString();
      if (!isToday) return null;

      const hours = today.getHours();
      const minutes = today.getMinutes();
      return hours + minutes / 60;
    }
    return null;
  };

  const currentTimePos = getCurrentTimePosition();

  // Get week days for week view
  const getWeekDays = () => {
    const days = [];
    const startDay = new Date(start);
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = viewMode === 'week' ? getWeekDays() : [];

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 sm:px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-md"
          >
            Today
          </button>
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Previous"
          >
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Next"
          >
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          {viewMode === 'day' 
            ? formatDate(currentDate)
            : `${formatDate(start)} - ${formatDate(end)}`
          }
        </h2>
      </div>

      {/* Week Header for Week View */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
              const weekDay = weekDays[idx];
              const isToday = weekDay && weekDay.toDateString() === new Date().toDateString();
              const isWeekend = day === 'Sat' || day === 'Sun';
              return (
                <div 
                  key={day} 
                  className={`text-center p-2 rounded-lg transition-colors ${
                    isToday 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400' 
                      : isWeekend
                      ? 'bg-gray-50 dark:bg-gray-800/50'
                      : 'bg-transparent'
                  }`}
                >
                  <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                    isToday
                      ? 'text-blue-700 dark:text-blue-300'
                      : isWeekend
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {day}
                  </div>
                  <div className={`text-base sm:text-lg font-bold ${
                    isToday
                      ? 'text-blue-900 dark:text-blue-200'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {weekDay ? weekDay.getDate() : ''}
                  </div>
                  {weekDay && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {weekDay.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline View */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-visible">
        <div className="relative overflow-visible">
          {viewMode === 'day' ? (
            /* Day View Layout */
            <div className="flex overflow-visible">
              {/* Time Column */}
              <div className="w-16 sm:w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 sm:h-20 border-b border-gray-100 dark:border-gray-800 flex items-start justify-end pr-2 pt-1"
                  >
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Schedule Area */}
              <div className="flex-1 relative">
                {/* Hour containers for borders only */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 sm:h-20 border-b border-gray-100 dark:border-gray-800 relative z-0 pointer-events-none"
                  />
                ))}

                {/* Tasks rendered in a single container spanning all hours */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {tasksInRange.map((task) => {
                    const taskStart = task.start_time ? new Date(task.start_time) : null;
                    const taskEnd = task.end_time ? new Date(task.end_time) : new Date(taskStart!.getTime() + 60 * 60 * 1000);
                    if (!taskStart) return null;

                    // Get the day start (00:00) for the current view
                    const dayStart = new Date(currentDate);
                    dayStart.setHours(0, 0, 0, 0);
                    
                    // Calculate position from start of day
                    const taskStartMs = taskStart.getTime();
                    const taskEndMs = taskEnd.getTime();
                    const dayStartMs = dayStart.getTime();
                    const dayEndMs = dayStartMs + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
                    
                    // Calculate position as percentage of the full day (0-100%)
                    const startPercent = ((taskStartMs - dayStartMs) / (dayEndMs - dayStartMs)) * 100;
                    const endPercent = ((taskEndMs - dayStartMs) / (dayEndMs - dayStartMs)) * 100;
                    const heightPercent = endPercent - startPercent;

                    // Only show if task is within the visible day
                    if (endPercent < 0 || startPercent > 100) return null;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`absolute left-1 right-1 rounded-lg p-2 shadow-sm pointer-events-auto border-2 cursor-pointer hover:opacity-90 transition-opacity ${
                          task.completed
                            ? 'bg-gray-300 dark:bg-gray-700 opacity-60 border-gray-400 dark:border-gray-600'
                            : 'bg-blue-500 dark:bg-blue-600 border-blue-700 dark:border-blue-500'
                        }`}
                        style={{
                          top: `${Math.max(0, startPercent)}%`,
                          height: `${Math.min(100 - Math.max(0, startPercent), heightPercent)}%`,
                          minHeight: '20px'
                        }}
                      >
                        <div className="text-xs sm:text-sm font-medium text-white truncate">
                          {task.text} <span className="text-[10px] text-white/80 font-normal">({formatTime(taskStart)})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current time indicator - separate container to ensure it's above tasks */}
                {currentTimePos !== null && viewMode === 'day' && (() => {
                  const today = new Date();
                  const isToday = today.toDateString() === currentDate.toDateString();
                  if (!isToday) return null;

                  const currentMinute = currentTime.getMinutes();
                  const currentHour = currentTime.getHours();
                  
                  return (
                    <div
                      className="absolute inset-0 z-50 pointer-events-none"
                    >
                      <div
                        className="absolute left-0 right-0 flex items-center pointer-events-auto"
                        style={{
                          top: `${((currentHour * 60 + currentMinute) / (24 * 60)) * 100}%`
                        }}
                      >
                        <div className="flex items-center w-full">
                          {/* Animated dot with shadow */}
                          <div className="relative flex-shrink-0 animate-pulse">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-400 animate-ping opacity-75"></div>
                          </div>
                          
                          {/* Line with gradient - starts from dot center, same animation */}
                          <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent relative -ml-1.5 animate-pulse">
                            <div className="absolute inset-0 bg-red-500/30 blur-sm"></div>
                          </div>
                          
                          {/* Time badge with better styling */}
                          <span className="ml-3 flex-shrink-0 text-xs font-semibold text-white bg-red-500 dark:bg-red-600 px-2 py-1 rounded-md shadow-md border border-red-600 dark:border-red-700 whitespace-nowrap">
                            {formatTime(currentTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* Week View Layout */
            <div className="flex overflow-visible">
              {/* Time Column */}
              <div className="w-16 sm:w-20 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 sm:h-20 border-b border-gray-100 dark:border-gray-800 flex items-start justify-end pr-2 pt-1"
                  >
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Week Columns */}
              <div className="flex-1 grid grid-cols-7 border-l border-gray-200 dark:border-gray-800">
                {weekDays.map((day, dayIdx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isWeekend = dayIdx === 0 || dayIdx === 6;
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`relative border-r border-gray-200 dark:border-gray-800 last:border-r-0 ${
                        isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : isWeekend ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                      }`}
                    >
                      {/* Hour containers */}
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="h-16 sm:h-20 border-b border-gray-100 dark:border-gray-800 relative z-0 pointer-events-none"
                        />
                      ))}

                      {/* Tasks for this day */}
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        {tasksInRange.map((task) => {
                          const taskStart = task.start_time ? new Date(task.start_time) : null;
                          const taskEnd = task.end_time ? new Date(task.end_time) : new Date(taskStart!.getTime() + 60 * 60 * 1000);
                          if (!taskStart) return null;

                          // Check if task is on this day
                          const taskDay = taskStart.toDateString();
                          if (taskDay !== day.toDateString()) return null;

                          // Calculate position within the day
                          const dayStart = new Date(day);
                          dayStart.setHours(0, 0, 0, 0);
                          
                          const taskStartMs = taskStart.getTime();
                          const taskEndMs = taskEnd.getTime();
                          const dayStartMs = dayStart.getTime();
                          const dayEndMs = dayStartMs + (24 * 60 * 60 * 1000);
                          
                          const startPercent = ((taskStartMs - dayStartMs) / (dayEndMs - dayStartMs)) * 100;
                          const endPercent = ((taskEndMs - dayStartMs) / (dayEndMs - dayStartMs)) * 100;
                          const heightPercent = endPercent - startPercent;

                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className={`absolute left-0.5 right-0.5 rounded-lg p-1.5 sm:p-2 shadow-sm pointer-events-auto border-2 cursor-pointer hover:opacity-90 transition-opacity ${
                                task.completed
                                  ? 'bg-gray-300 dark:bg-gray-700 opacity-60 border-gray-400 dark:border-gray-600'
                                  : 'bg-blue-500 dark:bg-blue-600 border-blue-700 dark:border-blue-500'
                              }`}
                              style={{
                                top: `${Math.max(0, startPercent)}%`,
                                height: `${Math.min(100 - Math.max(0, startPercent), heightPercent)}%`,
                                minHeight: '18px'
                              }}
                            >
                              <div className="text-[10px] sm:text-xs font-medium text-white truncate leading-tight">
                                {task.text}
                              </div>
                              <div className="text-[9px] text-white/80 mt-0.5">
                                {formatTime(taskStart)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {tasksInRange.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No scheduled tasks</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add tasks with start and end times to see them here</p>
          </div>
        )}
      </div>

      {/* Task Details Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={selectedTask.completed ? 'line-through opacity-60' : ''}>
                    {selectedTask.text}
                  </span>
                  {selectedTask.completed && (
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      Completed
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Task details and information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Time Information */}
                {(selectedTask.start_time || selectedTask.end_time) && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Schedule</h3>
                    <div className="space-y-2">
                      {selectedTask.start_time && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Start Time</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDateTime(new Date(selectedTask.start_time))}
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedTask.end_time && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">End Time</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDateTime(new Date(selectedTask.end_time))}
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedTask.start_time && selectedTask.end_time && (
                        <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getDuration(new Date(selectedTask.start_time), new Date(selectedTask.end_time))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {(() => {
                  const subtasks = getSubtasks(selectedTask.id);
                  if (subtasks.length > 0) {
                    return (
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Subtasks ({subtasks.length})
                        </h3>
                        <div className="space-y-2">
                          {subtasks.map((subtask, idx) => (
                            <div
                              key={subtask.id}
                              className={`flex items-start gap-3 p-2 rounded ${
                                subtask.completed
                                  ? 'bg-gray-100 dark:bg-gray-700/50 opacity-60'
                                  : 'bg-white dark:bg-gray-900'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                subtask.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {subtask.completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm ${subtask.completed ? 'line-through opacity-60' : 'font-medium'} text-gray-900 dark:text-white`}>
                                  {subtask.text}
                                </div>
                                {subtask.scheduled_time && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Scheduled: {subtask.scheduled_time}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Additional Info */}
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedTask.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    {selectedTask.should_breakdown && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Auto-breakdown</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Enabled ✨
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
