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

export const COLORS = [
  "Black", "White", "Grey", "Beige", "Cream", "Brown", "Navy", "Blush pink",
  "Dusty rose", "Mauve", "Lavender", "Burgundy", "Wine", "Red", "Coral", "Peach",
  "Orange", "Mustard", "Yellow", "Olive", "Sage", "Forest green", "Emerald",
  "Teal", "Sky blue", "Baby blue", "Royal blue", "Denim", "Lilac", "Plum",
  "Fuchsia", "Hot pink", "Gold", "Silver", "Bronze", "Copper", "Tan", "Camel",
  "Chocolate", "Charcoal", "Ivory", "Mint", "Turquoise", "Cobalt", "Salmon",
  "Terracotta", "Rust", "Ochre", "Khaki", "Stone",
] as const;

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from("wardrobe").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}
