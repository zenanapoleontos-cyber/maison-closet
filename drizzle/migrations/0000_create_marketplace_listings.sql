CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  clothing_item_id uuid NOT NULL REFERENCES public.clothing_items(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price > 0),
  currency text NOT NULL DEFAULT 'EUR',
  condition text NOT NULL DEFAULT 'Good',
  size text,
  image_path text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clothing_item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT SELECT ON public.marketplace_listings TO anon;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Browse active listings" ON public.marketplace_listings FOR SELECT TO anon, authenticated USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Create own listing" ON public.marketplace_listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND EXISTS (SELECT 1 FROM public.clothing_items i WHERE i.id = clothing_item_id AND i.user_id = auth.uid()) AND image_path LIKE auth.uid()::text || '/%');
CREATE POLICY "Update own listing" ON public.marketplace_listings FOR UPDATE TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid() AND EXISTS (SELECT 1 FROM public.clothing_items i WHERE i.id = clothing_item_id AND i.user_id = auth.uid()) AND image_path LIKE auth.uid()::text || '/%');
CREATE POLICY "Delete own listing" ON public.marketplace_listings FOR DELETE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Marketplace owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Marketplace owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Marketplace owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'marketplace' AND auth.uid()::text = (storage.foldername(name))[1]);