import { createServerClient } from '@/lib/supabase';
import { Todo, TodoWithSubtasks } from '@/lib/types';
import AddTodo from '@/components/AddTodo';
import TodoList from '@/components/TodoList';
import Calendar from '@/components/Calendar';
import ViewToggle from '@/components/ViewToggle';
import NotificationSettings from '@/components/NotificationSettings';

export default async function Page() {
  const supabase = createServerClient();
  
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  const todosList: Todo[] = todos || [];

  if (error) {
    console.error('Error fetching todos:', error);
  }

  // Organize todos into parent-child structure
  const parentTodos = todosList.filter(todo => !todo.parent_id);
  const todosWithSubtasks: TodoWithSubtasks[] = parentTodos.map(parent => {
    const subtasks = todosList
      .filter(todo => todo.parent_id === parent.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    return {
      ...parent,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    };
  });

  const allTodos = todosList;
  const completedCount = allTodos.filter((todo) => todo.completed).length;
  const totalCount = allTodos.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  My Todo App
                </h1>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {totalCount > 0
                    ? `${completedCount} of ${totalCount} completed`
                    : 'Get things done!'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="text-lg">✨</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Auto-breakdown enabled
                </span>
              </div>
              <NotificationSettings />
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <AddTodo />
          </div>
        </div>

        {/* View Toggle and Content */}
        <ViewToggle
          calendarView={<Calendar todos={todosList} />}
          listView={<TodoList todos={todosWithSubtasks} />}
        />
      </div>
    </div>
  );
}
