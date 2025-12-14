'use client';

import { useState } from 'react';
import AddTodo from './AddTodo';
import Settings from './Settings';

interface ViewToggleProps {
  calendarView: React.ReactNode;
  listView: React.ReactNode;
  remindersView: React.ReactNode;
}

export default function ViewToggle({ calendarView, listView, remindersView }: ViewToggleProps) {
  const [view, setView] = useState<'calendar' | 'list' | 'reminders' | 'settings'>('calendar');

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm mb-20 sm:mb-24">
        {view === 'calendar' ? calendarView : view === 'list' ? listView : view === 'reminders' ? remindersView : <Settings />}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50 pb-safe">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-center justify-around h-16 sm:h-20">
            {/* Timeline Button */}
            <button
              onClick={() => setView('calendar')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-manipulation ${
                view === 'calendar'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 sm:h-6 sm:w-6 ${view === 'calendar' ? 'text-gray-900 dark:text-white' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">Timeline</span>
            </button>

            {/* List Button */}
            <button
              onClick={() => setView('list')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-manipulation ${
                view === 'list'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 sm:h-6 sm:w-6 ${view === 'list' ? 'text-gray-900 dark:text-white' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">List</span>
            </button>

            {/* Add Button (Center) */}
            <div className="flex-shrink-0 -mt-6 sm:-mt-8">
              <AddTodo />
            </div>

            {/* Reminders Button */}
            <button
              onClick={() => setView('reminders')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-manipulation ${
                view === 'reminders'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 sm:h-6 sm:w-6 ${view === 'reminders' ? 'text-gray-900 dark:text-white' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-medium">Reminders</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setView('settings')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors touch-manipulation ${
                view === 'settings'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 sm:h-6 sm:w-6 ${view === 'settings' ? 'text-gray-900 dark:text-white' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

