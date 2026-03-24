CREATE TABLE public.ec_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  granted_to uuid NOT NULL,
  granted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ec_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Top heads manage ec grants" ON public.ec_access_grants
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'patron'::app_role) OR
  has_role(auth.uid(), 'chairperson'::app_role) OR
  has_role(auth.uid(), 'speaker'::app_role) OR
  has_role(auth.uid(), 'electoral_commission'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'patron'::app_role) OR
  has_role(auth.uid(), 'chairperson'::app_role) OR
  has_role(auth.uid(), 'speaker'::app_role) OR
  has_role(auth.uid(), 'electoral_commission'::app_role)
);

CREATE POLICY "Users view own ec grants" ON public.ec_access_grants
FOR SELECT TO authenticated
USING (granted_to = auth.uid());