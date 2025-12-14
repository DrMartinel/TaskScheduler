# Todo App with Supabase

A modern, full-featured todo application built with Next.js, React, TypeScript, and Supabase.

## Features

- ✅ Add, edit, and delete todos
- ✅ Mark todos as complete/incomplete
- ✅ **Automatic task breakdown** - Tasks are automatically broken down into smaller, time-specific subtasks using Google Gemini AI
- ✅ Hierarchical display of parent tasks and subtasks
- ✅ Real-time updates using Supabase subscriptions
- ✅ Beautiful, responsive UI with dark mode support
- ✅ Type-safe with TypeScript

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Go to your project settings and copy your:
   - Project URL
   - Anon (public) key

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

   - Get Supabase credentials from: https://app.supabase.com/project/_/settings/api
   - Get Gemini API key from: https://makersuite.google.com/app/apikey

### 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL from `supabase-schema.sql` to create the `todos` table with support for parent-child relationships and set up the necessary policies

**Note:** If you already have a `todos` table, you'll need to add the new columns:
- `parent_id UUID REFERENCES todos(id) ON DELETE CASCADE`
- `order_index INTEGER DEFAULT 0`
- `scheduled_time TEXT`

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Project Structure

```
my-app/
├── app/
│   ├── page.tsx          # Main todo app page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── AddTodo.tsx       # Component for adding new todos
│   ├── TodoItem.tsx      # Individual todo item component
│   └── TodoList.tsx      # List of todos component
├── lib/
│   ├── supabase.ts       # Supabase client configuration
│   ├── gemini.ts         # Gemini AI client for task breakdown
│   └── types.ts          # TypeScript type definitions
└── supabase-schema.sql   # Database schema SQL
```

## Security Notes

The current setup uses a permissive RLS policy that allows all operations. For production use, you should:

1. Implement user authentication
2. Update the RLS policies to restrict access based on user IDs
3. Consider using authenticated Supabase clients

## Technologies Used

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Supabase** - Backend and database
- **Google Gemini AI** - Task breakdown and AI assistance
- **Tailwind CSS** - Styling
