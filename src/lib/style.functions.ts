import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ itemId: z.string().uuid() });

type Item = {
  id: string; category: string; color: string | null; season: string | null; notes: string | null;
};

export const completeTheLook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: items, error }, { data: profile }] = await Promise.all([
      supabase.from("clothing_items").select("id,category,color,season,notes").eq("user_id", userId),
      supabase.from("profiles").select("style_tags").eq("id", userId).maybeSingle(),
    ]);
    if (error) throw new Error(error.message);
    const list = (items ?? []) as Item[];
    const anchor = list.find((i) => i.id === data.itemId);
    if (!anchor) throw new Error("That piece is no longer in your wardrobe.");
    if (list.length < 3) throw new Error("Add at least 3 pieces to your wardrobe first.");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Styling is not available right now.");

    const describe = (i: Item) =>
      `- id:${i.id} | ${i.category}${i.color ? ` · ${i.color}` : ""}${i.season ? ` · ${i.season}` : ""}${i.notes ? ` · ${i.notes}` : ""}`;

    const styleTags = (profile?.style_tags as string[] | undefined) ?? [];

    const system = `You are a luxury personal stylist for a private wardrobe app. Given ONE anchor piece and the client's own wardrobe, propose exactly 3 distinct ways to style the anchor piece. Use ONLY item ids from the wardrobe list, and ALWAYS include the anchor piece id in every look. Each look uses 3-5 pieces total. Give each look a short vibe word (e.g. Elegant, Evening, Casual, Daytime, Romantic) and a one-sentence styling note. Respond ONLY as strict JSON: {"looks":[{"vibe":"string","title":"string","item_ids":["uuid"],"notes":"string"}]}`;
    const user = `Client style words: ${styleTags.length ? styleTags.join(", ") : "not set"}\n\nAnchor piece:\n${describe(anchor)}\n\nWardrobe:\n${list.map(describe).join("\n")}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!res.ok) throw new Error(`Styling error: ${res.status}`);

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty styling response");

    let parsed: { looks?: { vibe?: string; title?: string; item_ids?: string[]; notes?: string }[] };
    try { parsed = JSON.parse(content); } catch { throw new Error("Styling response was unreadable"); }

    const valid = new Set(list.map((i) => i.id));
    const looks = (parsed.looks ?? [])
      .map((l) => {
        const ids = (l.item_ids ?? []).filter((id) => valid.has(id));
        if (!ids.includes(anchor.id)) ids.unshift(anchor.id);
        return {
          vibe: l.vibe || "Styled",
          title: l.title || "A way to wear it",
          item_ids: [...new Set(ids)].slice(0, 6),
          notes: l.notes || "",
        };
      })
      .filter((l) => l.item_ids.length >= 2)
      .slice(0, 3);

    if (looks.length === 0) throw new Error("Couldn't build a look from your pieces — try again.");
    return { looks };
  });
