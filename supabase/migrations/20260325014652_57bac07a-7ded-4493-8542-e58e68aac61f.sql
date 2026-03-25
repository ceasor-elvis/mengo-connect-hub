
-- Allow top heads to also insert, update, delete rotas
CREATE POLICY "Top heads manage rotas insert" ON public.rotas FOR INSERT TO public
WITH CHECK (
  has_role(auth.uid(), 'patron'::app_role) OR
  has_role(auth.uid(), 'chairperson'::app_role) OR
  has_role(auth.uid(), 'speaker'::app_role)
);

CREATE POLICY "Top heads manage rotas update" ON public.rotas FOR UPDATE TO public
USING (
  has_role(auth.uid(), 'patron'::app_role) OR
  has_role(auth.uid(), 'chairperson'::app_role) OR
  has_role(auth.uid(), 'speaker'::app_role)
);

CREATE POLICY "Top heads manage rotas delete" ON public.rotas FOR DELETE TO public
USING (
  has_role(auth.uid(), 'patron'::app_role) OR
  has_role(auth.uid(), 'chairperson'::app_role) OR
  has_role(auth.uid(), 'speaker'::app_role)
);
