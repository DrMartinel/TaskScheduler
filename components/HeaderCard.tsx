'use client';

import { useState } from 'react';
import NotificationSettings from './NotificationSettings';

interface HeaderCardProps {
  totalCount: number;
  completedCount: number;
  parentTodosCount: number;
  completedParentCount: number;
  pendingParentCount: number;
  todayTasksCount: number;
}

export default function HeaderCard({
  totalCount,
  completedCount,
  parentTodosCount,
  completedParentCount,
  pendingParentCount,
  todayTasksCount,
}: HeaderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 md:p-8">
      {/* Header with collapse button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-900 dark:bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Welcome to AIDone!
            </h1>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {totalCount > 0
                  ? `${completedCount} of ${totalCount} completed`
                  : 'Get things done!'}
              </span>
            </div>
            <NotificationSettings />
          </div>

          {/* Task Summary Header */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Task Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Total Tasks
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {parentTodosCount}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  Completed
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300">
                  {completedParentCount}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 sm:p-4 border border-orange-200 dark:border-orange-800">
                <div className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                  Pending
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {pendingParentCount}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                  Today
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {todayTasksCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

