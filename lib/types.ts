export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  parent_id: string | null;
  order_index: number;
  scheduled_time: string | null;
  start_time: string | null;
  end_time: string | null;
  should_breakdown: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoWithSubtasks extends Todo {
  subtasks?: Todo[];
}

export type TodoInsert = Omit<Todo, 'id' | 'created_at' | 'updated_at'>;
export type TodoUpdate = Partial<Pick<Todo, 'text' | 'completed' | 'start_time' | 'end_time'>>;

export interface SubtaskBreakdown {
  text: string;
  start_time: string; // ISO 8601 format datetime string
  end_time: string; // ISO 8601 format datetime string
  order_index: number;
}

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}
