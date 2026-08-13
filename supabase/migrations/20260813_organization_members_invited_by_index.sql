-- ============================================================================
-- Section 2 — organization_members invited_by lookup index
--
-- This is deliberately catalog-guarded: organization_members is a pre-existing
-- live relation whose canonical CREATE TABLE is not in this repository. The
-- migration makes no schema, grant, policy, or function-definition changes.
-- ============================================================================

DO $index$
BEGIN
  IF to_regclass('public.organization_members') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_attribute
       WHERE attrelid = 'public.organization_members'::regclass
         AND attname = 'invited_by'
         AND NOT attisdropped
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = 'organization_members'
         AND indexdef ~* E'\\(invited_by(?:[ ,\\)])'
     ) THEN
    CREATE INDEX organization_members_invited_by_idx
      ON public.organization_members (invited_by);
  END IF;
END
$index$;
