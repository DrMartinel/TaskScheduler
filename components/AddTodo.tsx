'use client';

import { useState, useTransition } from 'react';
import { addTodo } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function AddTodo() {
  const [text, setText] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [shouldBreakdown, setShouldBreakdown] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    const formData = new FormData();
    formData.append('text', text.trim());
    if (startTime) formData.append('start_time', startTime);
    if (endTime) formData.append('end_time', endTime);
    formData.append('should_breakdown', shouldBreakdown.toString());

    startTransition(async () => {
      await addTodo(formData);
      setText('');
      setStartTime('');
      setEndTime('');
      setIsExpanded(false);
    });
  };

  // Get today's date in YYYY-MM-DDTHH:mm format for datetime-local input
  const getTodayDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a new todo..."
            required
            disabled={isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isPending || !text.trim()}
          >
            {isPending ? 'Adding...' : 'Add'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {isExpanded ? 'Less options' : 'More options'}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={getTodayDateTime()}
                  disabled={isPending}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || getTodayDateTime()}
                  disabled={isPending}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="should-breakdown"
                checked={shouldBreakdown}
                onCheckedChange={(checked) => setShouldBreakdown(checked === true)}
                disabled={isPending}
              />
              <label
                htmlFor="should-breakdown"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Automatically break down into smaller tasks
              </label>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
