'use client';

import { useState, useMemo } from 'react';
import { TodoWithSubtasks } from '@/lib/types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: TodoWithSubtasks[];
}

type FilterType = 'all' | 'today' | 'pending' | 'completed';

export default function TodoList({ todos }: TodoListProps) {
  const [filter, setFilter] = useState<FilterType>('today');

  // Filter todos based on selected filter
  const filteredTodos = useMemo(() => {
    let filtered = [...todos];

    switch (filter) {
      case 'today': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(todo => {
          if (!todo.start_time) return false;
          const taskDate = new Date(todo.start_time);
          return taskDate >= today && taskDate <= todayEnd;
        });
        break;
      }
      case 'pending':
        filtered = filtered.filter(todo => !todo.completed);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.completed);
        break;
      case 'all':
      default:
        // Show all
        break;
    }

    // Sort todos by start_time if available, otherwise by created_at
    return filtered.sort((a, b) => {
      if (a.start_time && b.start_time) {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [todos, filter]);

  if (todos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No todos yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'today'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'pending'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'completed'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Filtered Todos List */}
      {filteredTodos.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-600 dark:text-gray-400">
            No {filter === 'today' ? 'tasks for today' : filter === 'pending' ? 'pending tasks' : filter === 'completed' ? 'completed tasks' : 'tasks'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {filter === 'today' ? 'Try selecting a different filter' : 'Try a different filter or add new tasks'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 px-4 pb-4">
          {filteredTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}
