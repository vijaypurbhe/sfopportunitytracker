
-- Helper function to create notifications (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _related_opportunity_id uuid DEFAULT NULL,
  _related_gate_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_opportunity_id, related_gate_id)
  VALUES (_user_id, _title, _message, _type, _related_opportunity_id, _related_gate_id);
END;
$$;

-- Trigger function: opportunity created or stage changed or presales assigned
CREATE OR REPLACE FUNCTION public.notify_opportunity_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- New opportunity created
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NOT NULL THEN
      PERFORM create_notification(
        NEW.created_by,
        'Opportunity Created',
        'New opportunity "' || NEW.opportunity_name || '" has been created.',
        'info',
        NEW.id
      );
    END IF;
    RETURN NEW;
  END IF;

  -- Updates
  IF TG_OP = 'UPDATE' THEN
    -- Stage changed
    IF OLD.stage IS DISTINCT FROM NEW.stage AND NEW.created_by IS NOT NULL THEN
      PERFORM create_notification(
        NEW.created_by,
        'Stage Changed',
        'Opportunity "' || NEW.opportunity_name || '" moved from ' || COALESCE(OLD.stage, 'N/A') || ' to ' || COALESCE(NEW.stage, 'N/A') || '.',
        'info',
        NEW.id
      );
    END IF;

    -- Presales assignment changed
    IF OLD.assigned_presales_id IS DISTINCT FROM NEW.assigned_presales_id AND NEW.assigned_presales_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.assigned_presales_id,
        'Pre-Sales Assignment',
        'You have been assigned to opportunity "' || NEW.opportunity_name || '".',
        'info',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function: gate approval events
CREATE OR REPLACE FUNCTION public.notify_gate_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  opp_name text;
  gate_label text;
BEGIN
  SELECT opportunity_name INTO opp_name FROM public.opportunities WHERE id = NEW.opportunity_id;
  gate_label := replace(NEW.gate_type::text, '_', ' ');

  -- New gate request
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      NEW.requested_by,
      'Gate Request Submitted',
      'Your ' || gate_label || ' gate request for "' || COALESCE(opp_name, 'Unknown') || '" has been submitted and is pending approval.',
      'gate',
      NEW.opportunity_id,
      NEW.id
    );
    RETURN NEW;
  END IF;

  -- Gate status changed (approved/rejected)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pending' THEN
    PERFORM create_notification(
      NEW.requested_by,
      'Gate ' || initcap(NEW.status::text),
      'Your ' || gate_label || ' gate for "' || COALESCE(opp_name, 'Unknown') || '" has been ' || NEW.status::text || '.' || CASE WHEN NEW.comments IS NOT NULL THEN ' Comment: ' || NEW.comments ELSE '' END,
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'warning' END,
      NEW.opportunity_id,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_opportunity_notifications
  AFTER INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_opportunity_changes();

CREATE TRIGGER trg_gate_notifications
  AFTER INSERT OR UPDATE ON public.gate_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_gate_changes();
