import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Loader2, Shield, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

const gradients = [
  { v: "from-indigo-500 via-purple-500 to-pink-500", label: "Ungu Pink" },
  { v: "from-emerald-500 via-teal-500 to-cyan-500", label: "Hijau Cyan" },
  { v: "from-amber-500 via-orange-500 to-rose-500", label: "Oranye" },
  { v: "from-blue-500 via-sky-500 to-cyan-400", label: "Biru Langit" },
  { v: "from-fuchsia-500 via-pink-500 to-rose-500", label: "Fuchsia" },
];

function AdminPage() {
  const { isAdmin, checked } = useIsAdmin();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [b, setB] = useState({ title: "", subtitle: "", gradient: gradients[0].v });
  const [saving, setSaving] = useState(false);

  const load = () => supabase.from("banners").select("*").order("order_idx").then(({ data }) => setBanners(data ?? []));
  useEffect(() => { load(); }, []);

  if (checked && !isAdmin) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-bold">Halaman Admin</p>
          <p className="text-sm text-muted-foreground">Hanya admin yang bisa mengakses.</p>
        </div>
      </AppShell>
    );
  }

  async function add() {
    if (!b.title) return toast.error("Judul banner wajib");
    setSaving(true);
    const { error } = await supabase.from("banners").insert({ ...b, order_idx: banners.length });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Banner ditambahkan"); setB({ title: "", subtitle: "", gradient: gradients[0].v }); load();
  }
  async function remove(id: string) {
    await supabase.from("banners").delete().eq("id", id); load();
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("banners").update({ active: !active }).eq("id", id); load();
  }

  return (
    <AppShell>
      <div className="bg-gradient-accent text-accent-foreground px-5 pt-8 pb-8 rounded-b-[2rem]">
        <button onClick={() => navigate({ to: "/home" })} className="inline-flex items-center gap-1 text-sm opacity-90"><ArrowLeft className="h-4 w-4" />Kembali</button>
        <div className="mt-3 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <p className="text-2xl font-extrabold">Panel Admin</p>
        </div>
        <p className="text-sm opacity-90 mt-1">Kelola banner & konten aplikasi</p>
      </div>

      <div className="px-5 mt-5 space-y-4">
        <Card className="p-5 rounded-2xl shadow-card space-y-3">
          <p className="font-bold text-sm flex items-center gap-2"><ImageIcon className="h-4 w-4" />Banner Slide Baru</p>
          <div><Label>Judul</Label><Input value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} /></div>
          <div><Label>Subjudul</Label><Input value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} /></div>
          <div>
            <Label>Warna Gradient</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {gradients.map((g) => (
                <button key={g.v} onClick={() => setB({ ...b, gradient: g.v })} className={`h-10 rounded-xl bg-gradient-to-br ${g.v} ring-2 transition ${b.gradient === g.v ? "ring-primary scale-110" : "ring-transparent"}`} />
              ))}
            </div>
          </div>
          <Button onClick={add} disabled={saving} className="w-full bg-gradient-card shadow-glow">
            {saving ? <Loader2 className="animate-spin" /> : (<><Plus className="h-4 w-4 mr-1" />Tambah Banner</>)}
          </Button>
        </Card>

        <div className="space-y-2">
          <p className="font-bold text-sm">Banner Aktif ({banners.length})</p>
          {banners.map((x) => (
            <Card key={x.id} className={`p-3 flex items-center gap-3 shadow-card ${!x.active && "opacity-50"}`}>
              <div className={`h-12 w-16 rounded-xl bg-gradient-to-br ${x.gradient} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{x.title}</p>
                <p className="text-xs text-muted-foreground truncate">{x.subtitle}</p>
              </div>
              <button onClick={() => toggle(x.id, x.active)} className="text-xs font-semibold text-primary">{x.active ? "Nonaktifkan" : "Aktifkan"}</button>
              <button onClick={() => remove(x.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
