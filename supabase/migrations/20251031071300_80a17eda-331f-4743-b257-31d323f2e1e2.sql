-- Create students table for authentication and profile
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  face_embedding text, -- Store face recognition data
  voice_sample text, -- Store voice verification data
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  roll_number text NOT NULL,
  name text NOT NULL,
  marked_at timestamptz DEFAULT now(),
  gps_latitude decimal(10, 8),
  gps_longitude decimal(11, 8),
  verification_status text CHECK (verification_status IN ('passed', 'failed')),
  verification_method text, -- 'face+voice', 'face_only', etc.
  notes text
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY "Students can view their own profile"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile"
  ON public.students FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for attendance_records
CREATE POLICY "Students can view their own attendance"
  ON public.attendance_records FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own attendance"
  ON public.attendance_records FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.students (user_id, roll_number, name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'roll_number',
    new.raw_user_meta_data->>'name',
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to auto-create student profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();

-- Create index for faster queries
CREATE INDEX idx_attendance_student_id ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_marked_at ON public.attendance_records(marked_at DESC);