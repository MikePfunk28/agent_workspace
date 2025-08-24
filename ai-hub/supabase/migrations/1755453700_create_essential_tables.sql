-- Ensure gen_random_uuid() is available for UUID defaults
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text,
  is_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- If the table already existed without user_id, add it (and FK) now
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN user_id uuid;
  END IF;

  -- Add FK if missing
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'todos_user_id_fkey'
      AND conrelid = 'public.todos'::regclass
  ) THEN
    ALTER TABLE public.todos
      ADD CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Helpful index for RLS and joins
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'todos' AND indexname = 'idx_todos_user'
  ) THEN
    CREATE INDEX idx_todos_user ON public.todos(user_id);
  END IF;

  -- Ensure created_at exists; backfill from inserted_at if present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN created_at timestamptz DEFAULT now();
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'inserted_at'
    ) THEN
      UPDATE public.todos SET created_at = inserted_at WHERE created_at IS NULL;
    END IF;
  END IF;

  -- Ensure text exists; backfill from content or title if present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'text'
  ) THEN
    ALTER TABLE public.todos ADD COLUMN text text;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'content'
    ) THEN
      UPDATE public.todos SET text = content WHERE text IS NULL;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'todos' AND column_name = 'title'
    ) THEN
      UPDATE public.todos SET text = title WHERE text IS NULL;
    END IF;
  END IF;
END$$;

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Recreate policy safely
DROP POLICY IF EXISTS "Users own todos" ON public.todos;
CREATE POLICY "Users own todos"
  ON public.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);