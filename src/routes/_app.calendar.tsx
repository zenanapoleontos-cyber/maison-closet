import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type ClothingItem, getSignedImageUrl } from "@/lib/wardrobe";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Outfit = { id: string; title: string; occasion: string | null; item_ids: string[] };
type ScheduleRow = { id: string; date: string; outfit_id: string };

export const Route = createFileRoute("/_app/calendar")({
  head: () => ({ meta: [{ title: "Calendar — MyWeekly Wardrobe" }] }),
  component: CalendarPage,
});

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<Record<string, ClothingItem>>({});
  const [schedule, setSchedule] = useState<Record<string, ScheduleRow>>({});
  const [loading, setLoading] = useState(true);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const [o, i, s] = await Promise.all([
      supabase.from("outfits").select("id,title,occasion,item_ids").order("created_at", { ascending: false }),
      supabase.from("clothing_items").select("*"),
      supabase.from("outfit_schedule").select("id,date,outfit_id"),
    ]);
    if (o.error) toast.error(o.error.message);
    if (s.error) toast.error(s.error.message);
    setOutfits((o.data as Outfit[]) ?? []);
    const map: Record<string, ClothingItem> = {};
    for (const it of (i.data as ClothingItem[]) ?? []) map[it.id] = it;
    setItems(map);
    const sm: Record<string, ScheduleRow> = {};
    for (const row of (s.data as ScheduleRow[]) ?? []) sm[row.date] = row;
    setSchedule(sm);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startPad = first.getDay();
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const outfitsById = useMemo(() => Object.fromEntries(outfits.map((o) => [o.id, o])), [outfits]);

  const openDay = (date: Date) => {
    const iso = toISO(date);
    setOpenDate(iso);
    setPicked(schedule[iso]?.outfit_id ?? "");
  };

  const save = async () => {
    if (!openDate || !picked) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const existing = schedule[openDate];
    if (existing) {
      const { error } = await supabase.from("outfit_schedule").update({ outfit_id: picked }).eq("id", existing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("outfit_schedule").insert({ user_id: u.user.id, date: openDate, outfit_id: picked });
      if (error) return toast.error(error.message);
    }
    toast.success("Outfit scheduled");
    setOpenDate(null);
    load();
  };

  const removeDay = async () => {
    if (!openDate) return;
    const existing = schedule[openDate];
    if (!existing) { setOpenDate(null); return; }
    const { error } = await supabase.from("outfit_schedule").delete().eq("id", existing.id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    setOpenDate(null);
    load();
  };

  const todayISO = toISO(today);
  const dialogOutfit = openDate && schedule[openDate] ? outfitsById[schedule[openDate].outfit_id] : null;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-5xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plan what you'll wear, day by day.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px] text-center font-display text-xl">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <Button variant="outline" size="icon" className="rounded-full"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/70 backdrop-blur p-4 sm:p-6 shadow-card">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {DOW.map((d) => (
            <div key={d} className="text-center text-[11px] uppercase tracking-wider text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} className="aspect-square sm:aspect-[4/5]" />;
            const iso = toISO(date);
            const row = schedule[iso];
            const outfit = row ? outfitsById[row.outfit_id] : null;
            const isToday = iso === todayISO;
            return (
              <button
                key={idx}
                onClick={() => openDay(date)}
                className={cn(
                  "aspect-square sm:aspect-[4/5] rounded-2xl border p-1.5 sm:p-2 text-left transition hover:border-primary hover:bg-accent/30 flex flex-col gap-1 overflow-hidden",
                  isToday && "border-primary ring-1 ring-primary/40",
                  outfit && "bg-feminine/10"
                )}
              >
                <span className={cn("text-xs font-medium", isToday && "text-primary")}>{date.getDate()}</span>
                {outfit && (
                  <div className="flex-1 min-h-0 flex flex-col gap-1">
                    <span className="text-[10px] sm:text-xs font-display leading-tight line-clamp-2">{outfit.title}</span>
                    <div className="hidden sm:flex gap-0.5 mt-auto">
                      {outfit.item_ids.slice(0, 3).map((id) => (
                        <Thumb key={id} item={items[id]} />
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {loading && <p className="text-muted-foreground text-sm mt-4">Loading...</p>}
      </div>

      <Dialog open={!!openDate} onOpenChange={(v) => !v && setOpenDate(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {openDate && new Date(openDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </DialogTitle>
          </DialogHeader>

          {outfits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Create an outfit first to schedule it.</p>
          ) : (
            <div className="space-y-3 py-2">
              <Select value={picked} onValueChange={setPicked}>
                <SelectTrigger className="h-12 rounded-full"><SelectValue placeholder="Choose an outfit" /></SelectTrigger>
                <SelectContent>
                  {outfits.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}{o.occasion ? ` — ${o.occasion}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dialogOutfit && (
                <p className="text-xs text-muted-foreground">Currently scheduled: {dialogOutfit.title}</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {openDate && schedule[openDate] && (
              <Button variant="outline" onClick={removeDay} className="rounded-full">
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
            <Button onClick={save} disabled={!picked} className="rounded-full">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Thumb({ item }: { item?: ClothingItem }) {
  const [url, setUrl] = useState("");
  useEffect(() => { if (item) getSignedImageUrl(item.image_url).then(setUrl); }, [item]);
  if (!item) return null;
  return (
    <div className="h-6 w-6 rounded-md overflow-hidden bg-muted border">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}
