export const STYLE_TAGS = [
  "Minimal",
  "Feminine",
  "Elegant",
  "Casual",
  "Old Money",
  "Trendy",
  "Romantic",
  "Chic",
] as const;

export type StyleTag = (typeof STYLE_TAGS)[number];

export type Look = {
  vibe: string;
  title: string;
  item_ids: string[];
  notes: string;
};

const NEUTRALS = ["Black", "White", "Grey", "Beige", "Cream", "Ivory", "Camel", "Tan", "Stone", "Charcoal", "Navy", "Brown", "Chocolate", "Khaki"];

/** Plain-language reading of the wardrobe: most worn category, tones, signature accent. */
export function describeWardrobe(items: { category: string; color: string | null }[]) {
  if (items.length === 0) return null;
  const byCategory = new Map<string, number>();
  const byColor = new Map<string, number>();
  for (const i of items) {
    byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
    if (i.color) byColor.set(i.color, (byColor.get(i.color) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  const neutralCount = items.filter((i) => i.color && NEUTRALS.includes(i.color)).length;
  const neutralShare = neutralCount / items.length;

  return {
    categories: top(byCategory, 2),
    colors: top(byColor, 3),
    tone: neutralShare >= 0.5 ? "neutral tones" : "colour-led pieces",
    counts: byCategory,
  };
}
