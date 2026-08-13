-- ============================================================================
-- Nexora — Lock down direct proposal-review RPC execution
-- Date: 2026-08-13
-- Shared project: qwaehqsmodekbgvnaavz
--
-- public.review_salon_setup has an in-function active-owner check.  This
-- migration additionally removes PostgreSQL's default PUBLIC EXECUTE grant so
-- anonymous callers cannot invoke the RPC at all. Authenticated callers remain
-- subject to the function's auth.uid() and ownership checks.
-- ============================================================================

revoke all on function public.review_salon_setup(uuid, text, text) from public, anon;
grant execute on function public.review_salon_setup(uuid, text, text) to authenticated;
