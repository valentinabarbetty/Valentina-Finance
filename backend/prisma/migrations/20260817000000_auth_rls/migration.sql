-- Link Supabase Auth users to public profiles without storing credentials.
-- `public.users.id` intentionally receives the exact auth.users UUID.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@auth.local'),
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      SPLIT_PART(COALESCE(NEW.email, NEW.id::text), '@', 1)
    )
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- These policies protect requests that reach PostgREST/Supabase with an
-- authenticated JWT. Prisma's database role does not automatically carry this
-- JWT context, so API services must also constrain every query by userId.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subgoals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY transaction_types_own_data ON public.transaction_types
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY categories_own_data ON public.categories
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY goals_own_data ON public.goals
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY subgoals_own_data ON public.subgoals
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY goal_contributions_own_data ON public.goal_contributions
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY expenses_own_data ON public.expenses
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY incomes_own_data ON public.incomes
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY budgets_own_data ON public.budgets
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY recurring_expenses_own_data ON public.recurring_expenses
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY debts_own_data ON public.debts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");

CREATE POLICY debt_payments_own_data ON public.debt_payments
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = "userId")
  WITH CHECK ((SELECT auth.uid()) = "userId");
