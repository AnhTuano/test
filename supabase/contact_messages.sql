-- Create contact_messages table in Supabase
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  student_code TEXT,
  full_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, read, replied
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert own messages"
ON public.contact_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can read their own messages
CREATE POLICY "Users can read own messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Admin can read all messages
CREATE POLICY "Admin can read all messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Policy: Admin can update all messages
CREATE POLICY "Admin can update all messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
