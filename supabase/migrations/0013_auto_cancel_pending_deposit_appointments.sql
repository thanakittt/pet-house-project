CREATE EXTENSION IF NOT EXISTS pg_cron;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_deposit_appointments()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cancelled_count integer;
BEGIN
  UPDATE public.appointments
  SET
    status = 'CANCELLED',
    updated_at = now()
  WHERE status = 'PENDING_DEPOSIT'
    AND deleted_at IS NULL
    AND created_at <= now() - interval '15 minutes';

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;

  RETURN cancelled_count;
END;
$$;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.cancel_expired_pending_deposit_appointments()
FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cancel-expired-pending-deposit-appointments'
  ) THEN
    PERFORM cron.unschedule('cancel-expired-pending-deposit-appointments');
  END IF;
END;
$$;
--> statement-breakpoint
SELECT cron.schedule(
  'cancel-expired-pending-deposit-appointments',
  '* * * * *',
  $$SELECT public.cancel_expired_pending_deposit_appointments();$$
);
