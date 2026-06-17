import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateOutfit } from "@/lib/outfits.functions";
import { type ClothingItem, getSignedImageUrl } from "@/lib/wardrobe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Trash2 } from "lucide-react";

type Outfit = {
  id: string;
  user_id: string;
  title: string;
  occasion: string | null;
  item_ids: string[];
  notes: string | null;
  generated_by_ai: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_app/outfits")({
  head: () => ({ meta: [{ title: "Outfits — Maison" }] }),
  component: OutfitsPage,
});

function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<Record<string, ClothingItem>>({});
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const callGenerate = useServerFn(generateOutfit);

  const load = async () => {
    setLoading(true);
    const [o, i] = await Promise.all([
      supabase.from("outfits").select("*").order("created_at", { ascending: false }),
      supabase.from("clothing_items").select("*"),
    ]);
    if (o.error) toast.error(o.error.message);
    if (i.error) toast.error(i.error.message);
    setOutfits((o.data as Outfit[]) ?? []);
    const map: Record<string, ClothingItem> = {};
    for (const item of (i.data as ClothingItem[]) ?? []) map[item.id] = item;
    setItems(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occasion.trim()) return;
    setGenerating(true);
    try {
      await callGenerate({ data: { occasion: occasion.trim() } });
      toast.success("New outfit styled!");
      setOccasion("");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't style an outfit");
    } finally { setGenerating(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this outfit?")) return;
    const { error } = await supabase.from("outfits").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-5xl">Outfits</h1>
        <p className="mt-1 text-sm text-muted-foreground">Looks styled from your own wardrobe.</p>
      </div>

      <div className="rounded-3xl border bg-card/70 backdrop-blur p-6 shadow-card mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-feminine text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-display text-2xl">Style me an outfit</h2>
        </div>
        <form onSubmit={generate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="occasion" className="sr-only">Occasion</Label>
            <Input
              id="occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g. brunch in spring, a wedding guest, casual workday..."
              className="h-12 rounded-full"
            />
          </div>
          <Button type="submit" disabled={generating} className="h-12 rounded-full px-7 shadow-soft">
            {generating ? "Styling..." : "Generate"}
          </Button>
        </form>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : outfits.length === 0 ? (
        <div className="rounded-3xl border bg-card/60 p-12 text-center">
          <h3 className="font-display text-2xl">No outfits yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Describe an occasion above and Maison will build a look from your wardrobe.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {outfits.map((o) => <OutfitCard key={o.id} outfit={o} items={items} onDelete={() => remove(o.id)} />)}
        </div>
      )}
    </div>
  );
}

function OutfitCard({ outfit, items, onDelete }: { outfit: Outfit; items: Record<string, ClothingItem>; onDelete: () => void }) {
  const pieces = outfit.item_ids.map((id) => items[id]).filter(Boolean);
  return (
    <div className="rounded-3xl border bg-card/80 backdrop-blur p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-2xl">{outfit.title}</h3>
            {outfit.generated_by_ai && (
              <span className="inline-flex items-center gap-1 rounded-full bg-feminine px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            )}
          </div>
          {outfit.occasion && <p className="text-sm text-muted-foreground mt-0.5">{outfit.occasion}</p>}
        </div>
        <button onClick={onDelete} className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-3">
        {pieces.map((p) => <PieceThumb key={p.id} item={p} />)}
      </div>

      {outfit.notes && (
        <p className="mt-5 italic text-sm text-muted-foreground border-l-2 border-primary/40 pl-4">
          {outfit.notes}
        </p>
      )}
    </div>
  );
}

function PieceThumb({ item }: { item: ClothingItem }) {
  const [url, setUrl] = useState("");
  useEffect(() => { getSignedImageUrl(item.image_url).then(setUrl); }, [item.image_url]);
  return (
    <div className="rounded-2xl overflow-hidden border bg-muted aspect-[3/4]">
      {url ? <img src={url} alt={item.category} className="h-full w-full object-cover" />
           : <div className="h-full w-full animate-pulse bg-muted" />}
    </div>
  );
}
