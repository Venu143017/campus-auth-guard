-- Fix the handle_new_student function to handle duplicate roll numbers
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.students (user_id, roll_number, name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'roll_number',
    new.raw_user_meta_data->>'name',
    new.email
  )
  ON CONFLICT (roll_number) 
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN new;
END;
$function$;