'use client';

import { useState, useTransition } from 'react';
import { addTodo } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type TaskType = 'scheduled' | 'duration' | 'no-time';

export default function AddTodo() {
  const [text, setText] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('scheduled');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(''); // Duration in minutes
  const [durationDate, setDurationDate] = useState(''); // Date for duration task (YYYY-MM-DD)
  const [note, setNote] = useState('');
  const [shouldBreakdown, setShouldBreakdown] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    const formData = new FormData();
    formData.append('text', text.trim());
    formData.append('task_type', taskType);
    
    // Handle different task types
    if (taskType === 'scheduled') {
      // Convert datetime-local values to ISO strings (treating them as local time)
      if (startTime) {
        const localDate = new Date(startTime);
        if (!isNaN(localDate.getTime())) {
          formData.append('start_time', localDate.toISOString());
        } else {
          formData.append('start_time', startTime);
        }
      }
      
      if (endTime) {
        const localDate = new Date(endTime);
        if (!isNaN(localDate.getTime())) {
          formData.append('end_time', localDate.toISOString());
        } else {
          formData.append('end_time', endTime);
        }
      }
    } else if (taskType === 'duration') {
      // Duration task - send duration in minutes and optional date
      if (duration) {
        formData.append('duration', duration);
      }
      if (durationDate) {
        formData.append('duration_date', durationDate);
      }
    }
    // For 'no-time' type, don't send any time information
    
    if (note) formData.append('note', note.trim());
    formData.append('should_breakdown', shouldBreakdown.toString());

    startTransition(async () => {
      await addTodo(formData);
      setText('');
      setTaskType('scheduled');
      setStartTime('');
      setEndTime('');
      setDuration('');
      setDurationDate('');
      setNote('');
      setIsOpen(false);
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

  // Get today's date in YYYY-MM-DD format for date input
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg hover:shadow-xl transition-all bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
          size="icon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 sm:h-7 sm:w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="sr-only">Add new todo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task with optional scheduling and automatic breakdown
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Name
              </label>
              <Input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a new todo..."
                required
                disabled={isPending}
                className="w-full"
              />
            </div>

            {/* Task Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Type
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTaskType('scheduled')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    taskType === 'scheduled'
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  disabled={isPending}
                >
                  Scheduled
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType('duration')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    taskType === 'duration'
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  disabled={isPending}
                >
                  Duration
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType('no-time')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    taskType === 'no-time'
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  disabled={isPending}
                >
                  No Time
                </button>
              </div>
            </div>

            {/* Scheduled Task: Start/End Time */}
            {taskType === 'scheduled' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-full overflow-hidden">
                <div className="w-full min-w-0 space-y-2 max-w-full overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={getTodayDateTime()}
                    disabled={isPending}
                    className="w-full text-sm h-9 touch-manipulation max-w-full box-border"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  />
                </div>
                <div className="w-full min-w-0 space-y-2 max-w-full overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    min={startTime || getTodayDateTime()}
                    disabled={isPending}
                    className="w-full text-sm h-9 touch-manipulation max-w-full box-border"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Duration Task: Duration and Date Input */}
            {taskType === 'duration' && (
              <div className="space-y-4">
                <div className="w-full min-w-0 space-y-2 max-w-full overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={durationDate}
                    onChange={(e) => setDurationDate(e.target.value)}
                    min={getTodayDate()}
                    disabled={isPending}
                    className="w-full text-sm h-9 touch-manipulation max-w-full box-border"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to use today's date
                  </p>
                </div>
                <div className="w-full min-w-0 space-y-2 max-w-full overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 60 for 1 hour"
                    min="1"
                    disabled={isPending}
                    className="w-full text-sm h-9 touch-manipulation max-w-full box-border"
                    style={{
                      fontSize: '16px',
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    AI will determine the best start and end time based on your schedule for the selected date
                  </p>
                </div>
              </div>
            )}

            <div className="w-full min-w-0 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Note (optional)
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Travelling to school takes 30 mins"
                disabled={isPending}
                className="w-full text-base sm:text-sm h-11 sm:h-9"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Additional context for task breakdown (e.g., travel time, special requirements)
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="should-breakdown"
                checked={shouldBreakdown}
                onCheckedChange={(checked) => setShouldBreakdown(checked === true)}
                disabled={isPending}
                className="flex-shrink-0"
              />
              <label
                htmlFor="should-breakdown"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                Automatically break down into smaller tasks
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !text.trim()}
            >
              {isPending 
                ? (taskType === 'duration' 
                    ? (shouldBreakdown ? 'Finding time & generating subtasks...' : 'Finding optimal time...')
                    : (shouldBreakdown ? 'Creating task & generating subtasks...' : 'Creating task...'))
                : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
