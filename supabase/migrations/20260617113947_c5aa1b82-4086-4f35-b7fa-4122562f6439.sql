CREATE TABLE public.outfit_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outfit_schedule TO authenticated;
GRANT ALL ON public.outfit_schedule TO service_role;

ALTER TABLE public.outfit_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own schedule select" ON public.outfit_schedule
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own schedule insert" ON public.outfit_schedule
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own schedule update" ON public.outfit_schedule
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own schedule delete" ON public.outfit_schedule
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_outfit_schedule_updated_at
  BEFORE UPDATE ON public.outfit_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();