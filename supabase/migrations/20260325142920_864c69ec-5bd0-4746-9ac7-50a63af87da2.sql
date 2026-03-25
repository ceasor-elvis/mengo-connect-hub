
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Councillors insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (is_councillor(auth.uid()));

-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Councillors insert own logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (is_councillor(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Patron views all logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'patron'));

CREATE POLICY "Top heads view logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'chairperson') OR
    has_role(auth.uid(), 'speaker') OR
    has_role(auth.uid(), 'electoral_commission')
  );

CREATE POLICY "Users view own logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
