BEGIN;

CREATE OR REPLACE FUNCTION public.log_transfer_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.transfer_status_history (transfer_id, status, created_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_transfer_status_change ON public.transfers;
CREATE TRIGGER log_transfer_status_change
  AFTER INSERT OR UPDATE OF status ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.log_transfer_status();

DROP TRIGGER IF EXISTS transfer_updated_at_trigger ON public.transfers;
CREATE TRIGGER transfer_updated_at_trigger
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
