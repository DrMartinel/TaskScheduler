'use client';

import { useState, useTransition } from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { TodoWithSubtasks } from '@/lib/types';
import { toggleTodo, deleteTodo, updateTodo } from '@/lib/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface TodoItemProps {
  todo: TodoWithSubtasks;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
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
      hour12: true 
    });
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
          <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 ${
            todo.completed
              ? 'bg-green-500 border-green-600'
              : 'border-white'
          }`}>
            {todo.completed && (
              <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-white text-base sm:text-lg mb-1.5 ${
              todo.completed ? 'line-through' : ''
            }`}>
              {todo.text}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
              {taskStart && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(taskStart)}
                </span>
              )}
              {taskEnd && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(taskEnd)}
                </span>
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
        </div>
      )}

      {/* Main Todo Item */}
      <div className={`flex items-center gap-2 sm:gap-3 ${hasTimeInfo ? 'bg-white/10 dark:bg-black/20 rounded-lg p-2' : ''}`}>
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
        
        <div className="flex items-center gap-2">
          {hasTimeInfo && (
            <Checkbox
              checked={todo.completed}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="w-5 h-5 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
            />
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className={`px-2 py-2 sm:px-3 sm:py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 touch-manipulation hover:scale-105 ${
              hasTimeInfo
                ? 'text-white hover:bg-white/20'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
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

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 py-1">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="w-4 h-4 sm:w-5 sm:h-5"
      />
      
      {subtask.scheduled_time && (
        <span className={`text-xs font-mono min-w-[3rem] sm:min-w-[3.5rem] flex-shrink-0 ${
          hasTimeInfo ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {subtask.scheduled_time}
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
