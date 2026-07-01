import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/members/add")({
  component: AddMemberPage,
});

function AddMemberPage() {
  const { isAdmin, checked } = useIsAdmin();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [m, setM] = useState({ name: "", whatsapp: "", address: "", role_in_org: "", notes: "" });

  async function submit() {
    if (!m.name) return toast.error("Nama wajib diisi");
    setSaving(true);
    const { error } = await supabase.from("members").insert(m);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Anggota ditambahkan");
    navigate({ to: "/members" });
  }

  if (checked && !isAdmin) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="font-bold">Akses ditolak</p>
          <p className="text-sm text-muted-foreground">Hanya admin yang bisa menambah anggota.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-8 rounded-b-[2rem]">
        <button onClick={() => navigate({ to: "/members" })} className="inline-flex items-center gap-1 text-sm opacity-90"><ArrowLeft className="h-4 w-4" />Kembali</button>
        <p className="text-2xl font-extrabold mt-3">Tambah Anggota</p>
      </div>
      <div className="px-5 mt-5">
        <Card className="p-5 rounded-2xl shadow-card space-y-3">
          <div><Label>Nama lengkap *</Label><Input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></div>
          <div><Label>Nomor WhatsApp</Label><Input value={m.whatsapp} onChange={(e) => setM({ ...m, whatsapp: e.target.value })} /></div>
          <div><Label>Alamat</Label><Input value={m.address} onChange={(e) => setM({ ...m, address: e.target.value })} /></div>
          <div><Label>Jabatan</Label><Input value={m.role_in_org} onChange={(e) => setM({ ...m, role_in_org: e.target.value })} placeholder="Ketua / Bendahara / Anggota" /></div>
          <div><Label>Catatan</Label><Textarea value={m.notes} onChange={(e) => setM({ ...m, notes: e.target.value })} /></div>
          <Button onClick={submit} disabled={saving} className="w-full bg-gradient-card shadow-glow">
            {saving ? <Loader2 className="animate-spin" /> : (<><UserPlus className="h-4 w-4 mr-1" />Simpan Anggota</>)}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
