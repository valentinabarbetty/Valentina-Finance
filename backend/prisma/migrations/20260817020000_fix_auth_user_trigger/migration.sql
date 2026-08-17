-- public.users.updatedAt is NOT NULL and Prisma's @updatedAt is client-side,
-- so the Auth trigger must explicitly provide it for raw SQL inserts.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, "updatedAt")
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@auth.local'),
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      SPLIT_PART(COALESCE(NEW.email, NEW.id::text), '@', 1)
    ),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
