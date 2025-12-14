import { TodoWithSubtasks } from '@/lib/types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: TodoWithSubtasks[];
}

export default function TodoList({ todos }: TodoListProps) {
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

  // Sort todos by start_time if available, otherwise by created_at
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.start_time && b.start_time) {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    }
    if (a.start_time) return -1;
    if (b.start_time) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {sortedTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
