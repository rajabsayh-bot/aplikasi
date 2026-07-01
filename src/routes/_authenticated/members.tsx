import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MapPin, UserPlus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/members")({
  component: MembersPage,
});

type M = { id: string; name: string; whatsapp: string | null; address: string | null; role_in_org: string | null; join_date: string | null; photo_url: string | null };

function MembersPage() {
  const { isAdmin } = useIsAdmin();
  const [list, setList] = useState<M[]>([]);
  const [q, setQ] = useState("");

  const load = () => supabase.from("members").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Hapus anggota ini?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus"); load();
  }

  const filtered = list.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-8 rounded-b-[2rem]">
        <p className="text-xs opacity-80 uppercase tracking-widest">Data</p>
        <p className="text-2xl font-extrabold mt-1">Anggota Komunitas</p>
        <p className="text-sm opacity-90 mt-1">{list.length} anggota terdaftar</p>
      </div>

      <div className="px-5 mt-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {isAdmin && (
          <Link to="/members/add">
            <Button className="w-full bg-gradient-card shadow-glow"><UserPlus className="h-4 w-4 mr-1" />Tambah Anggota</Button>
          </Link>
        )}

        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada anggota.</p>}
        {filtered.map((m) => (
          <Card key={m.id} className="p-4 flex gap-3 shadow-card">
            <div className="h-12 w-12 rounded-full bg-gradient-card grid place-items-center text-primary-foreground font-bold shrink-0 overflow-hidden">
              {m.photo_url ? <img src={m.photo_url} alt="" className="h-full w-full object-cover" /> : m.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold truncate">{m.name}</p>
                {m.role_in_org && <span className="text-[10px] rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 font-semibold shrink-0">{m.role_in_org}</span>}
              </div>
              {m.whatsapp && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{m.whatsapp}</p>}
              {m.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{m.address}</p>}
            </div>
            {isAdmin && (
              <button onClick={() => remove(m.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded-lg shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
