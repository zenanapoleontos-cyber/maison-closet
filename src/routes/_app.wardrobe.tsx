import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, SEASONS, COLORS, type ClothingItem, getSignedImageUrl } from "@/lib/wardrobe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_app/wardrobe")({
  head: () => ({ meta: [{ title: "Wardrobe — Maison" }] }),
  component: WardrobePage,
});

function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as ClothingItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-5xl">Your wardrobe</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? "piece" : "pieces"} catalogued</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 rounded-full bg-card/70"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <AddItemDialog onAdded={load} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => <ItemCard key={item.id} item={item} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border bg-card/60 backdrop-blur p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-feminine text-primary-foreground">
        <ImageIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-6 font-display text-2xl">Your closet is empty</h3>
      <p className="mt-2 text-sm text-muted-foreground">Start by uploading the first piece — a favourite top, dress, or pair of shoes.</p>
    </div>
  );
}

function ItemCard({ item, onChange }: { item: ClothingItem; onChange: () => void }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => { getSignedImageUrl(item.image_url).then(setUrl); }, [item.image_url]);

  const remove = async () => {
    if (!confirm("Remove this piece?")) return;
    await supabase.storage.from("wardrobe").remove([item.image_url]);
    const { error } = await supabase.from("clothing_items").delete().eq("id", item.id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); onChange(); }
  };

  return (
    <div className="group relative rounded-3xl border bg-card overflow-hidden shadow-card transition hover:shadow-soft">
      <div className="aspect-[3/4] bg-muted overflow-hidden">
        {url ? <img src={url} alt={item.category} className="h-full w-full object-cover" loading="lazy" />
             : <div className="h-full w-full animate-pulse bg-muted" />}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{item.category}</p>
            <p className="text-xs text-muted-foreground">
              {[item.color, item.season].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <button onClick={remove} className="opacity-0 group-hover:opacity-100 transition rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [category, setCategory] = useState<string>("Tops");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [season, setSeason] = useState<string>("All year");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setPreview(""); setCategory("Tops"); setColor(COLORS[0]); setSeason("All year"); setNotes("");
  };

  const onFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Pick a photo first"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("wardrobe").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("clothing_items").insert({
        user_id: user.id, image_url: path, category, color: color || null, season, notes: notes || null,
      });
      if (error) throw error;
      toast.success("Added to your wardrobe");
      setOpen(false); reset(); onAdded();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full h-10 shadow-soft"><Plus className="h-4 w-4 mr-1" /> Add piece</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">Add a piece</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-muted/40 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-muted transition"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                Click to upload a photo
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Season</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="brand, fabric, fit..." />
          </div>

          <Button type="submit" disabled={submitting} className="w-full rounded-full h-11 shadow-soft">
            {submitting ? "Adding..." : "Add to wardrobe"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
