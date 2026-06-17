
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Clothing items
CREATE TABLE public.clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  season TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clothing_items TO authenticated;
GRANT ALL ON public.clothing_items TO service_role;
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own clothing select" ON public.clothing_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own clothing insert" ON public.clothing_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own clothing update" ON public.clothing_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own clothing delete" ON public.clothing_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_clothing_user ON public.clothing_items(user_id);

-- Outfits
CREATE TABLE public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  occasion TEXT,
  item_ids UUID[] NOT NULL DEFAULT '{}',
  notes TEXT,
  generated_by_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outfits TO authenticated;
GRANT ALL ON public.outfits TO service_role;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own outfits select" ON public.outfits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own outfits insert" ON public.outfits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own outfits update" ON public.outfits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own outfits delete" ON public.outfits FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_outfits_user ON public.outfits(user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies for wardrobe bucket (users upload to their own folder: <user_id>/...)
CREATE POLICY "Wardrobe public read" ON storage.objects FOR SELECT USING (bucket_id = 'wardrobe');
CREATE POLICY "Wardrobe owner insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Wardrobe owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Wardrobe owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
