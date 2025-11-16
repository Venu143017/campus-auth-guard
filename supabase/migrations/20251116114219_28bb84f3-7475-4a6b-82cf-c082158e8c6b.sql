-- Create login attempts tracking table for rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email or roll_number
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time 
ON public.login_attempts(identifier, attempt_time DESC);

-- Policy: Users can only view their own attempts
CREATE POLICY "Users can view their own login attempts"
ON public.login_attempts
FOR SELECT
USING (identifier IN (
  SELECT email FROM public.students WHERE user_id = auth.uid()
  UNION
  SELECT roll_number FROM public.students WHERE user_id = auth.uid()
));

-- Policy: Allow inserting attempts (public for login tracking)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Cleanup function to remove old attempts (keep last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.login_attempts 
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
$$;

-- Add comment explaining the security model
COMMENT ON TABLE public.login_attempts IS 'Tracks login attempts for rate limiting. Failed attempts are logged to prevent brute force attacks. Old records are automatically cleaned up after 24 hours.';