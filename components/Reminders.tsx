'use client';

import { useState, useTransition } from 'react';
import { Reminder } from '@/lib/types';
import { addReminder, toggleReminder, deleteReminder, deleteAllReminders } from '@/lib/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RemindersProps {
  reminders: Reminder[];
}

export default function Reminders({ reminders: initialReminders }: RemindersProps) {
  const [quickText, setQuickText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // Sort reminders by completed status (pending first), then by created_at
  const reminders = [...initialReminders].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isPending) return;

    const formData = new FormData();
    formData.append('text', quickText.trim());

    startTransition(async () => {
      await addReminder(formData);
      setQuickText('');
    });
  };

  const handleToggle = async (reminder: Reminder) => {
    if (isPending) return;
    
    const formData = new FormData();
    formData.append('id', reminder.id);
    formData.append('completed', reminder.completed.toString());

    startTransition(async () => {
      await toggleReminder(formData);
    });
  };

  const handleDelete = async (reminderId: string) => {
    if (isPending) return;
    
    const formData = new FormData();
    formData.append('id', reminderId);

    startTransition(async () => {
      await deleteReminder(formData);
    });
  };

  const handleDeleteAll = async () => {
    if (isPending) return;

    startTransition(async () => {
      await deleteAllReminders();
      setShowDeleteAllDialog(false);
    });
  };

  const pendingReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="min-h-[400px]">
      {/* Header Section */}
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Reminders</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {pendingReminders.length} pending • {completedReminders.length} completed
              </p>
            </div>
          </div>
          {reminders.length > 0 && (
            <Button
              onClick={() => setShowDeleteAllDialog(true)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              disabled={isPending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete All
            </Button>
          )}
        </div>

        {/* Quick Add Input */}
        <form onSubmit={handleQuickAdd} className="mt-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="Add a quick reminder..."
                required
                disabled={isPending}
                className="w-full pl-10 pr-4 h-11 sm:h-12 text-base"
                autoFocus
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <Button
              type="submit"
              disabled={isPending || !quickText.trim()}
              className="h-11 sm:h-12 px-6 font-medium"
            >
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </div>

      {/* Reminders List */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {reminders.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
              <svg className="w-10 h-10 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold mb-1">No reminders yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Add a quick reminder to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending Reminders */}
            {pendingReminders.length > 0 && (
              <div className="space-y-2">
                {pendingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700/50 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleToggle(reminder)}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        reminder.completed
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
                      }`}>
                        {reminder.completed && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="flex-1 text-base font-medium text-gray-900 dark:text-white">
                      {reminder.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(reminder.id);
                      }}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label="Delete reminder"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                ))}
              </div>
            )}

            {/* Completed Reminders */}
            {completedReminders.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Completed ({completedReminders.length})
                </h3>
                <div className="space-y-2">
                  {completedReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 opacity-75 hover:opacity-100 transition-all cursor-pointer"
                      onClick={() => handleToggle(reminder)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-orange-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="flex-1 text-base font-medium line-through text-gray-400 dark:text-gray-500">
                        {reminder.text}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(reminder.id);
                        }}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Delete reminder"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete All Reminders?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

