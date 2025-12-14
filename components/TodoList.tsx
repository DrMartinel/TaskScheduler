'use client';

import { useState, useMemo } from 'react';
import { TodoWithSubtasks } from '@/lib/types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: TodoWithSubtasks[];
}

type FilterType = 'all' | 'today' | 'pending' | 'completed';

export default function TodoList({ todos }: TodoListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter and group todos by date
  const groupedTodos = useMemo(() => {
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

    // Group by date
    const grouped = new Map<string, TodoWithSubtasks[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered.forEach(todo => {
      let dateKey: string;
      let dateForSorting: Date;
      
      if (todo.start_time) {
        const taskDate = new Date(todo.start_time);
        taskDate.setHours(0, 0, 0, 0);
        dateForSorting = taskDate;
        
        // Format date key
        const dayDiff = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 0) {
          dateKey = 'Today';
        } else if (dayDiff === 1) {
          dateKey = 'Tomorrow';
        } else if (dayDiff === -1) {
          dateKey = 'Yesterday';
        } else if (dayDiff > 1 && dayDiff <= 7) {
          dateKey = taskDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        } else {
          dateKey = taskDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
      } else {
        // Tasks without start_time go to "No date"
        const createdDate = new Date(todo.created_at);
        createdDate.setHours(0, 0, 0, 0);
        dateForSorting = createdDate;
        dateKey = 'No date';
      }
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(todo);
    });

    // Sort todos within each group
    grouped.forEach((tasks, dateKey) => {
      tasks.sort((a, b) => {
        if (a.start_time && b.start_time) {
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        }
        if (a.start_time) return -1;
        if (b.start_time) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    // Convert to array and sort by date (closest first)
    const sortedGroups = Array.from(grouped.entries()).sort(([dateKeyA, tasksA], [dateKeyB, tasksB]) => {
      // Get the earliest date from each group for sorting
      const getEarliestDate = (tasks: TodoWithSubtasks[]): Date => {
        const dates = tasks
          .map(t => t.start_time ? new Date(t.start_time) : new Date(t.created_at))
          .filter(d => !isNaN(d.getTime()));
        return dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
      };
      
      const dateA = getEarliestDate(tasksA);
      const dateB = getEarliestDate(tasksB);
      
      // Special handling for "No date" - put it at the end
      if (dateKeyA === 'No date') return 1;
      if (dateKeyB === 'No date') return -1;
      
      return dateA.getTime() - dateB.getTime();
    });

    return sortedGroups;
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
      {groupedTodos.length === 0 ? (
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
        <div className="space-y-6 px-4 pb-4">
          {groupedTodos.map(([dateKey, tasks]) => (
            <div key={dateKey} className="space-y-3 sm:space-y-4">
              {/* Date Header */}
              <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-950 py-2 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {dateKey}
                </h3>
              </div>
              
              {/* Tasks for this date */}
              {tasks.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
