
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_owner', 'presales', 'bid_manager', 'reviewer');

-- Create enum for gate status
CREATE TYPE public.gate_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for gate type
CREATE TYPE public.gate_type AS ENUM ('deal_qualification', 'presales_assignment', 'proposal_review');

-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id TEXT UNIQUE,
  parent_opportunity_id TEXT,
  account_sbu TEXT,
  account_ibg TEXT,
  account_ibu TEXT,
  account_id TEXT,
  account_name TEXT,
  account_owner TEXT,
  account_category TEXT,
  bid_manager TEXT,
  primary_industry TEXT,
  secondary_industry TEXT,
  city TEXT,
  country TEXT,
  opportunity_name TEXT NOT NULL,
  opportunity_owner TEXT,
  opportunity_owner_gid TEXT,
  user_sbu TEXT,
  user_ibg TEXT,
  user_ibu TEXT,
  manager_alias TEXT,
  type_of_business TEXT,
  sales_stage TEXT,
  stage TEXT,
  win_probability INTEGER DEFAULT 0,
  hibernated_by_system TEXT,
  expected_close_date DATE,
  currency TEXT DEFAULT 'USD',
  opportunity_created_date DATE,
  opportunity_modified_date DATE,
  bid_submission_date DATE,
  booked_month TEXT,
  billing_start_date DATE,
  billing_end_date DATE,
  opportunity_category TEXT,
  reason_for_win TEXT,
  reason_for_loss TEXT,
  abort_reason TEXT,
  competitor_name TEXT,
  sales_channel TEXT,
  pricing_model TEXT,
  prime_status TEXT,
  ebitda_percent NUMERIC,
  contract_tenure_months INTEGER,
  overall_booking_value_tcv NUMERIC,
  overall_tcv NUMERIC,
  total_resources INTEGER,
  acv_fy_23_24 NUMERIC,
  acv_fy_24_25 NUMERIC,
  acv_fy_25_26 NUMERIC,
  acv_fy_26_27 NUMERIC,
  acv_fy_27_28 NUMERIC,
  remaining_years_projection NUMERIC,
  quarter TEXT,
  sales_specialist_name TEXT,
  delivery_line TEXT,
  ibu TEXT,
  financial_details JSONB DEFAULT '{}',
  account_details JSONB DEFAULT '{}',
  alliance_details JSONB DEFAULT '{}',
  duns_details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view opportunities" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert opportunities" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete opportunities" ON public.opportunities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_opportunities_stage ON public.opportunities(sales_stage);
CREATE INDEX idx_opportunities_account ON public.opportunities(account_name);
CREATE INDEX idx_opportunities_owner ON public.opportunities(opportunity_owner);
CREATE INDEX idx_opportunities_industry ON public.opportunities(primary_industry);
CREATE INDEX idx_opportunities_country ON public.opportunities(country);

-- Gate approvals table
CREATE TABLE public.gate_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  gate_type gate_type NOT NULL,
  status gate_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  checklist JSONB DEFAULT '[]',
  comments TEXT,
  assigned_resources JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gate_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view gate approvals" ON public.gate_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create gate approvals" ON public.gate_approvals FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Approvers can update gate approvals" ON public.gate_approvals FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_gate_approvals_updated_at BEFORE UPDATE ON public.gate_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  related_gate_id UUID REFERENCES public.gate_approvals(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
