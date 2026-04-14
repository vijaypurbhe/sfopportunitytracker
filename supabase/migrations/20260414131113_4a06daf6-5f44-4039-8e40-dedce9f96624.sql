-- Attach opportunity notification trigger
CREATE TRIGGER trg_notify_opportunity_changes
  AFTER INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_opportunity_changes();

-- Attach gate notification trigger
CREATE TRIGGER trg_notify_gate_changes
  AFTER INSERT OR UPDATE ON public.gate_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_gate_changes();