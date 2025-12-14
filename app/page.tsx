import { createServerClient } from '@/lib/supabase';
import { Todo, TodoWithSubtasks, Reminder } from '@/lib/types';
import AddTodo from '@/components/AddTodo';
import TodoList from '@/components/TodoList';
import Calendar from '@/components/Calendar';
import ViewToggle from '@/components/ViewToggle';
import HeaderCard from '@/components/HeaderCard';
import Reminders from '@/components/Reminders';

export default async function Page() {
  const supabase = createServerClient();
  
  // Fetch todos
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch reminders
  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('*')
    .order('created_at', { ascending: false });

  const todosList: Todo[] = todos || [];
  const remindersList: Reminder[] = reminders || [];

  if (error) {
    console.error('Error fetching todos:', error);
  }

  if (remindersError) {
    console.error('Error fetching reminders:', remindersError);
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
  const pendingCount = totalCount - completedCount;
  
  // Count parent tasks only
  const parentTodosCount = parentTodos.length;
  const completedParentCount = parentTodos.filter((todo) => todo.completed).length;
  const pendingParentCount = parentTodosCount - completedParentCount;
  
  // Count tasks with scheduled times
  const scheduledTasksCount = parentTodos.filter((todo) => todo.start_time || todo.end_time).length;
  
  // Count tasks for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTasksCount = parentTodos.filter((todo) => {
    if (!todo.start_time) return false;
    const taskDate = new Date(todo.start_time);
    return taskDate >= today && taskDate <= todayEnd;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Card */}
        <HeaderCard
          totalCount={totalCount}
          completedCount={completedCount}
          parentTodosCount={parentTodosCount}
          completedParentCount={completedParentCount}
          pendingParentCount={pendingParentCount}
          todayTasksCount={todayTasksCount}
        />

        {/* View Toggle and Content */}
        <ViewToggle
          calendarView={<Calendar todos={todosList} />}
          listView={<TodoList todos={todosWithSubtasks} />}
          remindersView={<Reminders reminders={remindersList} />}
        />
      </div>
    </div>
  );
}
