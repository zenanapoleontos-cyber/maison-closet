import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  occasion: z.string().min(1).max(200),
});

type Item = {
  id: string; category: string; color: string | null; season: string | null; notes: string | null;
};

type AiOutfit = {
  title: string;
  item_ids: string[];
  notes: string;
};

export const generateOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: items, error } = await supabase
      .from("clothing_items")
      .select("id,category,color,season,notes")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    if (!items || items.length < 2) {
      throw new Error("Add at least 2 pieces to your wardrobe first.");
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const wardrobeText = (items as Item[]).map((i) =>
      `- id:${i.id} | ${i.category}${i.color ? ` · ${i.color}` : ""}${i.season ? ` · ${i.season}` : ""}${i.notes ? ` · ${i.notes}` : ""}`
    ).join("\n");

    const system = `You are a personal stylist. From the user's wardrobe items, compose ONE cohesive outfit for the requested occasion. Use ONLY ids that appear in the list. Choose 3-5 complementary pieces (typically one top + one bottom OR a dress, plus shoes and optional outerwear/accessory). Respond ONLY as strict JSON: {"title": "string", "item_ids": ["uuid", ...], "notes": "1-2 sentence styling tip"}.`;
    const user = `Occasion: ${data.occasion}\n\nWardrobe:\n${wardrobeText}`;

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
    if (!res.ok) throw new Error(`AI error: ${res.status}`);

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let parsed: AiOutfit;
    try { parsed = JSON.parse(content); }
    catch { throw new Error("AI returned invalid JSON"); }

    const validIds = new Set(items.map((i) => i.id));
    const chosen = (parsed.item_ids || []).filter((id) => validIds.has(id));
    if (chosen.length === 0) throw new Error("AI couldn't pick items from your wardrobe — try again.");

    const { data: inserted, error: insErr } = await supabase
      .from("outfits")
      .insert({
        user_id: userId,
        title: parsed.title || "AI Outfit",
        occasion: data.occasion,
        item_ids: chosen,
        notes: parsed.notes ?? null,
        generated_by_ai: true,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    return inserted;
  });
