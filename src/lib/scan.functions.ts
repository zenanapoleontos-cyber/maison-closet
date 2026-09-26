import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ image: z.string().startsWith("data:image/").max(8_000_000) });
const result = z.object({ category: z.string(), color: z.string(), season: z.string(), notes: z.string() });

export const scanClothing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => input.parse(value))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("Photo scanning is unavailable right now.");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra", stream: true, store: false,
        reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"],
        input: [{ role: "user", content: [
          { type: "input_text", text: 'Identify the main clothing item in this image. Return ONLY a JSON object with category (one of Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories, Bags), color (simple color name), season (Spring, Summer, Autumn, Winter, or All year), and notes (brief recognizable garment description). No markdown.' },
          { type: "input_image", image_url: data.image },
        ] }],
      }),
    });
    if (!response.ok) {
      let message = `Photo scanning unavailable (${response.status}).`;
      try { const body = await response.json(); message = body?.message ?? body?.error?.message ?? message; } catch { /* retain status */ }
      throw new Error(message);
    }
    if (!response.body) throw new Error("No scan result returned.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const payload = frame.split("\n").filter(line => line.startsWith("data: ")).map(line => line.slice(6)).join("\n");
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event.type === "response.output_text.delta") text += event.delta ?? "";
          if (event.type === "response.failed" || event.type === "error") throw new Error(event.error?.message ?? "Photo scanning failed.");
        } catch (error) { if (error instanceof SyntaxError) continue; throw error; }
      }
      if (done) break;
    }
    if (!text.trim()) throw new Error("The photo could not be recognized. Set its details manually.");
    try { return result.parse(JSON.parse(text.replace(/^```json\s*|```$/g, "").trim())); }
    catch { throw new Error("The photo details were unclear. Set them manually."); }
  });