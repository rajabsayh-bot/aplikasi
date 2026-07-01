import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { CalendarDays, MapPin, Plus, MessagesSquare, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kegiatan")({
  component: KegiatanPage,
});

type Ev = { id: string; title: string; description: string | null; event_date: string; location: string | null };
type Grp = { id: string; name: string; description: string | null };

function KegiatanPage() {
  const { isAdmin } = useIsAdmin();
  const [events, setEvents] = useState<Ev[]>([]);
  const [groups, setGroups] = useState<Grp[]>([]);
  const [openE, setOpenE] = useState(false);
  const [openG, setOpenG] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ev, setEv] = useState({ title: "", description: "", event_date: "", location: "" });
  const [gr, setGr] = useState({ name: "", description: "" });

  const load = async () => {
    const [{ data: e }, { data: g }] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("discussion_groups").select("*").order("created_at", { ascending: false }),
    ]);
    setEvents(e ?? []);
    setGroups(g ?? []);
  };
  useEffect(() => { load(); }, []);

  async function addEvent() {
    if (!ev.title || !ev.event_date) return toast.error("Judul & tanggal wajib");
    setSaving(true);
    const { error } = await supabase.from("events").insert({ ...ev });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Acara ditambahkan"); setOpenE(false); setEv({ title: "", description: "", event_date: "", location: "" }); load();
  }
  async function addGroup() {
    if (!gr.name) return toast.error("Nama grup wajib");
    setSaving(true);
    const { error } = await supabase.from("discussion_groups").insert(gr);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Grup diskusi dibuat"); setOpenG(false); setGr({ name: "", description: "" }); load();
  }

  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-8 rounded-b-[2rem]">
        <p className="text-xs opacity-80 uppercase tracking-widest">Kegiatan</p>
        <p className="text-2xl font-extrabold mt-1">Acara & Diskusi</p>
      </div>

      <div className="px-5 mt-5">
        <Tabs defaultValue="events">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="events"><CalendarDays className="h-4 w-4 mr-1" />Jadwal Acara</TabsTrigger>
            <TabsTrigger value="groups"><MessagesSquare className="h-4 w-4 mr-1" />Grup Diskusi</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4 space-y-3">
            {isAdmin && (
              <Dialog open={openE} onOpenChange={setOpenE}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-card shadow-glow"><Plus className="h-4 w-4 mr-1" />Tambah Acara</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Acara Baru</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Judul</Label><Input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} /></div>
                    <div><Label>Tanggal & Waktu</Label><Input type="datetime-local" value={ev.event_date} onChange={(e) => setEv({ ...ev, event_date: e.target.value })} /></div>
                    <div><Label>Lokasi</Label><Input value={ev.location} onChange={(e) => setEv({ ...ev, location: e.target.value })} /></div>
                    <div><Label>Deskripsi</Label><Textarea value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} /></div>
                    <Button onClick={addEvent} disabled={saving} className="w-full">{saving ? <Loader2 className="animate-spin" /> : "Simpan"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada jadwal acara.</p>}
            {events.map((e) => (
              <Card key={e.id} className="p-4 flex gap-3 shadow-card">
                <div className="h-14 w-14 rounded-2xl bg-gradient-card grid place-items-center text-primary-foreground shrink-0">
                  <div className="text-center leading-tight">
                    <div className="text-[10px] uppercase">{new Date(e.event_date).toLocaleString("id-ID", { month: "short" })}</div>
                    <div className="font-bold text-lg">{new Date(e.event_date).getDate()}</div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "long" })}</p>
                  {e.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{e.location}</p>}
                  {e.description && <p className="text-xs mt-2 line-clamp-2">{e.description}</p>}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="groups" className="mt-4 space-y-3">
            {isAdmin && (
              <Dialog open={openG} onOpenChange={setOpenG}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-card shadow-glow"><Plus className="h-4 w-4 mr-1" />Buat Grup Diskusi</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Grup Diskusi Baru</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nama grup</Label><Input value={gr.name} onChange={(e) => setGr({ ...gr, name: e.target.value })} /></div>
                    <div><Label>Deskripsi</Label><Textarea value={gr.description} onChange={(e) => setGr({ ...gr, description: e.target.value })} /></div>
                    <Button onClick={addGroup} disabled={saving} className="w-full">{saving ? <Loader2 className="animate-spin" /> : "Buat"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada grup diskusi.</p>}
            {groups.map((g) => (
              <Link key={g.id} to="/diskusi/$id" params={{ id: g.id }}>
                <Card className="p-4 flex items-center gap-3 shadow-card hover:shadow-glow transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-accent grid place-items-center text-accent-foreground">
                    <MessagesSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground line-clamp-1">{g.description}</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
