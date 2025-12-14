'use client';

import { useState, useTransition } from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { TodoWithSubtasks } from '@/lib/types';
import { toggleTodo, deleteTodo, updateTodo, updateTodoTime } from '@/lib/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface TodoItemProps {
  todo: TodoWithSubtasks;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [isEditingEndTime, setIsEditingEndTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showSubtasks, setShowSubtasks] = useState(true);

  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const taskStart = todo.start_time ? new Date(todo.start_time) : null;
  const taskEnd = todo.end_time ? new Date(todo.end_time) : null;
  const hasTimeInfo = !!(taskStart || taskEnd);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Convert Date to datetime-local input format (YYYY-MM-DDTHH:mm)
  const dateToInputValue = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialize edit times when entering edit mode
  const handleStartTimeEdit = () => {
    if (taskStart) {
      setEditStartTime(dateToInputValue(taskStart));
      setIsEditingStartTime(true);
    }
  };

  const handleEndTimeEdit = () => {
    if (taskEnd) {
      setEditEndTime(dateToInputValue(taskEnd));
      setIsEditingEndTime(true);
    }
  };

  const handleStartTimeSave = () => {
    if (!editStartTime || isPending) {
      setIsEditingStartTime(false);
      return;
    }

    // Convert datetime-local to ISO string (treating it as local time)
    const localDate = new Date(editStartTime);
    const isoString = !isNaN(localDate.getTime()) ? localDate.toISOString() : editStartTime;

    const formData = new FormData();
    formData.append('id', todo.id);
    formData.append('start_time', isoString);

    startTransition(async () => {
      await updateTodoTime(formData);
      setIsEditingStartTime(false);
    });
  };

  const handleEndTimeSave = () => {
    if (!editEndTime || isPending) {
      setIsEditingEndTime(false);
      return;
    }

    // Convert datetime-local to ISO string (treating it as local time)
    const localDate = new Date(editEndTime);
    const isoString = !isNaN(localDate.getTime()) ? localDate.toISOString() : editEndTime;

    const formData = new FormData();
    formData.append('id', todo.id);
    formData.append('end_time', isoString);

    startTransition(async () => {
      await updateTodoTime(formData);
      setIsEditingEndTime(false);
    });
  };

  const handleStartTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStartTimeSave();
    } else if (e.key === 'Escape') {
      setIsEditingStartTime(false);
      if (taskStart) {
        setEditStartTime(dateToInputValue(taskStart));
      }
    }
  };

  const handleEndTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEndTimeSave();
    } else if (e.key === 'Escape') {
      setIsEditingEndTime(false);
      if (taskEnd) {
        setEditEndTime(dateToInputValue(taskEnd));
      }
    }
  };

  const getDuration = () => {
    if (taskStart && taskEnd) {
      const diffMs = taskEnd.getTime() - taskStart.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return `${Math.round(diffMs / (1000 * 60))} min`;
      } else if (diffHours < 24) {
        return `${Math.round(diffHours * 10) / 10}h`;
      } else {
        const days = Math.round(diffHours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
      }
    }
    return null;
  };

  const duration = getDuration();

  const handleToggle = (checked: CheckedState) => {
    if (isPending) return;
    
    const formData = new FormData();
    formData.append('id', todo.id);
    formData.append('completed', todo.completed.toString());

    startTransition(async () => {
      await toggleTodo(formData);
    });
  };

  const handleDelete = async () => {
    if (isPending) return;
    
    const formData = new FormData();
    formData.append('id', todo.id);

    startTransition(async () => {
      await deleteTodo(formData);
    });
  };

  const handleEdit = async () => {
    if (!editText.trim() || isPending) {
      setIsEditing(false);
      setEditText(todo.text);
      return;
    }

    const formData = new FormData();
    formData.append('id', todo.id);
    formData.append('text', editText.trim());

    startTransition(async () => {
      await updateTodo(formData);
      setIsEditing(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(todo.text);
    }
  };

  return (
    <div
      className={`group relative rounded-lg p-4 border transition-all ${
        todo.completed
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-70'
          : hasTimeInfo
          ? 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header with time info */}
      {hasTimeInfo && (
        <div className="flex items-start gap-3 mb-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            disabled={isPending}
            className="w-5 h-5 mt-0.5 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-white text-base sm:text-lg mb-1.5 ${
              todo.completed ? 'line-through' : ''
            }`}>
              {todo.text}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
              {taskStart && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isEditingStartTime ? (
                    <Input
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      onBlur={handleStartTimeSave}
                      onKeyDown={handleStartTimeKeyDown}
                      autoFocus
                      disabled={isPending}
                      className="w-auto min-w-[140px] h-7 text-xs bg-white/20 border-white/30 text-white placeholder-white/70"
                      style={{ fontSize: '12px' }}
                    />
                  ) : (
                    <span
                      onClick={handleStartTimeEdit}
                      className="cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
                      title="Click to edit time"
                    >
                      {formatTime(taskStart)}
                    </span>
                  )}
                </div>
              )}
              {taskEnd && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isEditingEndTime ? (
                    <Input
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      onBlur={handleEndTimeSave}
                      onKeyDown={handleEndTimeKeyDown}
                      autoFocus
                      disabled={isPending}
                      min={taskStart ? dateToInputValue(taskStart) : undefined}
                      className="w-auto min-w-[140px] h-7 text-xs bg-white/20 border-white/30 text-white placeholder-white/70"
                      style={{ fontSize: '12px' }}
                    />
                  ) : (
                    <span
                      onClick={handleEndTimeEdit}
                      className="cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
                      title="Click to edit time"
                    >
                      {formatTime(taskEnd)}
                    </span>
                  )}
                </div>
              )}
              {duration && (
                <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {duration}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-white hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed p-2 touch-manipulation"
              aria-label="Delete todo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Todo Item */}
      <div className={`flex items-center gap-2 sm:gap-3 ${hasTimeInfo ? '' : ''}`}>
        {!hasTimeInfo && (
          <>
            {hasSubtasks && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation p-1 -ml-1"
                aria-label={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${showSubtasks ? 'rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            
            <Checkbox
              checked={todo.completed}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </>
        )}
        
        {isEditing ? (
          <Input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isPending}
            className={`flex-1 min-w-0 ${
              hasTimeInfo ? 'text-white placeholder-white/70 bg-white/20 border-white/30' : ''
            }`}
            placeholder={hasTimeInfo ? 'Edit task...' : ''}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`flex-1 min-w-0 cursor-pointer text-sm sm:text-base break-words transition-colors ${
              todo.completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : hasTimeInfo
                ? 'text-white/90 hover:text-white'
                : 'text-gray-900 dark:text-gray-100 font-semibold hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            {!hasTimeInfo && todo.text}
          </span>
        )}
        
        {!hasTimeInfo && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed p-2 flex-shrink-0 touch-manipulation"
            aria-label="Delete todo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Subtasks */}
      {hasSubtasks && showSubtasks && (
        <div className={`mt-3 rounded-lg ${
          hasTimeInfo 
            ? 'bg-white/10 dark:bg-black/20' 
            : 'bg-gray-50 dark:bg-gray-800'
        } border-t border-gray-200 dark:border-gray-700`}>
          <div className="pl-4 sm:pl-8 pr-2 sm:pr-4 py-3 space-y-2">
            {todo.subtasks!.map((subtask) => (
              <SubtaskItem key={subtask.id} subtask={subtask} hasTimeInfo={hasTimeInfo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for subtasks
function SubtaskItem({ subtask, hasTimeInfo }: { subtask: any; hasTimeInfo: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subtask.text);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTime, setEditTime] = useState(subtask.scheduled_time || '');
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: CheckedState) => {
    if (isPending) return;
    
    const formData = new FormData();
    formData.append('id', subtask.id);
    formData.append('completed', subtask.completed.toString());

    startTransition(async () => {
      await toggleTodo(formData);
    });
  };

  const handleDelete = async () => {
    if (isPending) return;
    
    const formData = new FormData();
    formData.append('id', subtask.id);

    startTransition(async () => {
      await deleteTodo(formData);
    });
  };

  const handleEdit = async () => {
    if (!editText.trim() || isPending) {
      setIsEditing(false);
      setEditText(subtask.text);
      return;
    }

    const formData = new FormData();
    formData.append('id', subtask.id);
    formData.append('text', editText.trim());

    startTransition(async () => {
      await updateTodo(formData);
      setIsEditing(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(subtask.text);
    }
  };

  const handleTimeEdit = () => {
    setEditTime(subtask.scheduled_time || '');
    setIsEditingTime(true);
  };

  const handleTimeSave = () => {
    if (isPending) {
      setIsEditingTime(false);
      return;
    }

    const formData = new FormData();
    formData.append('id', subtask.id);
    formData.append('scheduled_time', editTime.trim() || '');

    startTransition(async () => {
      await updateTodoTime(formData);
      setIsEditingTime(false);
    });
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeSave();
    } else if (e.key === 'Escape') {
      setIsEditingTime(false);
      setEditTime(subtask.scheduled_time || '');
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 py-1">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="w-4 h-4 sm:w-5 sm:h-5"
      />
      
      {isEditingTime ? (
        <Input
          type="time"
          value={editTime}
          onChange={(e) => setEditTime(e.target.value)}
          onBlur={handleTimeSave}
          onKeyDown={handleTimeKeyDown}
          autoFocus
          disabled={isPending}
          className={`text-xs font-mono min-w-[3rem] sm:min-w-[3.5rem] flex-shrink-0 h-6 ${
            hasTimeInfo 
              ? 'text-white bg-white/20 border-white/30 placeholder-white/70' 
              : 'text-gray-900 dark:text-gray-100'
          }`}
          style={{ fontSize: '12px' }}
        />
      ) : (
        <span
          onClick={handleTimeEdit}
          className={`text-xs font-mono min-w-[3rem] sm:min-w-[3.5rem] flex-shrink-0 cursor-pointer hover:bg-white/10 px-1 py-0.5 rounded transition-colors ${
            hasTimeInfo ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}
          title={subtask.scheduled_time ? "Click to edit time" : "Click to add time"}
        >
          {subtask.scheduled_time || '--:--'}
        </span>
      )}
      
      {isEditing ? (
        <Input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isPending}
          className={`flex-1 min-w-0 text-xs sm:text-sm ${
            hasTimeInfo ? 'text-white placeholder-white/70 bg-white/20 border-white/30' : ''
          }`}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 min-w-0 text-xs sm:text-sm cursor-pointer break-words ${
            subtask.completed
              ? 'line-through text-gray-500 dark:text-gray-400'
              : hasTimeInfo
              ? 'text-white/90'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {subtask.text}
        </span>
      )}
      
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 touch-manipulation ${
          hasTimeInfo
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
        aria-label="Delete subtask"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
