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
  head: () => ({ meta: [{ title: "Wardrobe — MyWeekly Wardrobe" }] }),
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

type PendingItem = {
  id: string;
  file: File;
  preview: string;
  category: string;
  color: string;
  season: string;
  notes: string;
};

function AddItemDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    pending.forEach((p) => URL.revokeObjectURL(p.preview));
    setPending([]);
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: PendingItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      category: "Tops",
      color: COLORS[0],
      season: "All year",
      notes: "",
    }));
    setPending((p) => [...p, ...next]);
  };

  const updateItem = (id: string, patch: Partial<PendingItem>) => {
    setPending((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setPending((p) => {
      const found = p.find((it) => it.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return p.filter((it) => it.id !== id);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.length === 0) { toast.error("Pick at least one photo"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      let ok = 0;
      for (const it of pending) {
        const ext = it.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("wardrobe").upload(path, it.file, { contentType: it.file.type });
        if (up.error) { toast.error(`${it.file.name}: ${up.error.message}`); continue; }
        const { error } = await supabase.from("clothing_items").insert({
          user_id: user.id, image_url: path, category: it.category,
          color: it.color || null, season: it.season, notes: it.notes || null,
        });
        if (error) { toast.error(`${it.file.name}: ${error.message}`); continue; }
        ok++;
      }
      if (ok > 0) toast.success(`Added ${ok} ${ok === 1 ? "piece" : "pieces"} to your wardrobe`);
      setOpen(false); reset(); onAdded();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full h-10 shadow-soft"><Plus className="h-4 w-4 mr-1" /> Add pieces</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add pieces</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div
            className="rounded-2xl border-2 border-dashed border-border bg-muted/40 p-6 text-center cursor-pointer hover:bg-muted transition"
            onClick={() => fileRef.current?.click()}
          >
            <ImageIcon className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload photos — pick several at once
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { addFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }}
            />
          </div>

          {pending.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{pending.length} {pending.length === 1 ? "photo" : "photos"} — set a category for each</p>
              {pending.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-2xl border bg-card p-3">
                  <img src={it.preview} alt="" className="h-28 w-24 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Select value={it.category} onValueChange={(v) => updateItem(it.id, { category: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Colour</Label>
                      <Select value={it.color} onValueChange={(v) => updateItem(it.id, { color: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Season</Label>
                      <Select value={it.season} onValueChange={(v) => updateItem(it.id, { season: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-3 flex items-end gap-2">
                      <Input
                        value={it.notes}
                        onChange={(e) => updateItem(it.id, { notes: e.target.value })}
                        placeholder="notes (brand, fabric...)"
                        className="h-9"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(it.id)} aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" disabled={submitting || pending.length === 0} className="w-full rounded-full h-11 shadow-soft">
            {submitting ? "Uploading..." : pending.length > 1 ? `Add ${pending.length} pieces` : "Add to wardrobe"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
