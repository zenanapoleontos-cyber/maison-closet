import { supabase } from "@/integrations/supabase/client";

export type ClothingItem = {
  id: string;
  user_id: string;
  image_url: string;
  category: string;
  color: string | null;
  season: string | null;
  notes: string | null;
  created_at: string;
};

export const CATEGORIES = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Bags",
] as const;

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "All year"] as const;

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from("wardrobe").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}
