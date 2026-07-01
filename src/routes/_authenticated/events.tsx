import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, MapPin, Plus, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

function EventsPage() {
  const { isAdmin } = useIsAdmin();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ title: "", description: "", event_date: "", location: "" });

  const load = () => supabase.from("events").select("*").order("event_date").then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!f.title || !f.event_date) return toast.error("Judul & tanggal wajib");
    setSaving(true);
    const { error } = await supabase.from("events").insert(f);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Acara ditambahkan"); setOpen(false); setF({ title: "", description: "", event_date: "", location: "" }); load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus?")) return;
    await supabase.from("events").delete().eq("id", id); load();
  }

  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-8 rounded-b-[2rem]">
        <p className="text-xs opacity-80 uppercase tracking-widest">Jadwal</p>
        <p className="text-2xl font-extrabold mt-1">Acara Komunitas</p>
      </div>
      <div className="px-5 mt-5 space-y-3">
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="w-full bg-gradient-card shadow-glow"><Plus className="h-4 w-4 mr-1" />Tambah Acara</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Acara Baru</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Judul</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
                <div><Label>Tanggal & Waktu</Label><Input type="datetime-local" value={f.event_date} onChange={(e) => setF({ ...f, event_date: e.target.value })} /></div>
                <div><Label>Lokasi</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
                <div><Label>Deskripsi</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
                <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="animate-spin" /> : "Simpan"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada acara.</p>}
        {list.map((e) => (
          <Card key={e.id} className="p-4 flex gap-3 shadow-card">
            <div className="h-14 w-14 rounded-2xl bg-gradient-card grid place-items-center text-primary-foreground shrink-0">
              <div className="text-center leading-tight">
                <div className="text-[10px] uppercase">{new Date(e.event_date).toLocaleString("id-ID", { month: "short" })}</div>
                <div className="font-bold text-lg">{new Date(e.event_date).getDate()}</div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{e.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
              {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{e.location}</p>}
            </div>
            {isAdmin && <button onClick={() => remove(e.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
