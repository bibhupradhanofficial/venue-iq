-- Backfill ops_staff role for all existing authenticated users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'ops_staff'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- Ensure unique constraint to prevent duplicate role rows
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key
  ON public.user_roles (user_id, role);

-- Trigger function: assign ops_staff to every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user_ops_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ops_staff'::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_ops_role ON auth.users;
CREATE TRIGGER on_auth_user_created_ops_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_ops_role();