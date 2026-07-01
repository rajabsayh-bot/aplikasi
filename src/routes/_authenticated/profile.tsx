import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, LogOut, Shield, Loader2, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [p, setP] = useState({ username: "", full_name: "", whatsapp: "", bio: "", avatar_url: "" });
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setP({
        username: data.username ?? "", full_name: data.full_name ?? "",
        whatsapp: data.whatsapp ?? "", bio: data.bio ?? "", avatar_url: data.avatar_url ?? "",
      });
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: p.username, full_name: p.full_name, whatsapp: p.whatsapp, bio: p.bio, updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil disimpan");
  }

  async function changePw() {
    if (pw.length < 6) return toast.error("Password minimal 6 karakter");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    setPw(""); toast.success("Password diubah");
  }

  async function uploadAvatar(f: File) {
    if (!user) return;
    setUploading(true);
    const ext = f.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? "";
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setP({ ...p, avatar_url: url });
    setUploading(false);
    toast.success("Foto profil diperbarui");
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-16 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-extrabold">Profil Saya</p>
          {isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold"><Shield className="h-3 w-3" />Admin</span>}
        </div>
      </div>

      <div className="px-5 -mt-10">
        <Card className="p-5 shadow-card rounded-2xl">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-card grid place-items-center text-primary-foreground text-3xl font-bold overflow-hidden ring-4 ring-background">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : (p.full_name || user?.email || "?")[0]?.toUpperCase()}
              </div>
              <label className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-accent text-accent-foreground grid place-items-center shadow-glow cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </label>
            </div>
            <p className="mt-3 font-bold">{p.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </Card>

        <Card className="mt-4 p-5 rounded-2xl shadow-card space-y-3">
          <p className="font-bold text-sm">Data Diri</p>
          <div><Label>Username</Label><Input value={p.username} onChange={(e) => setP({ ...p, username: e.target.value })} /></div>
          <div><Label>Nama lengkap</Label><Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></div>
          <div><Label>Nomor WhatsApp</Label><Input value={p.whatsapp} onChange={(e) => setP({ ...p, whatsapp: e.target.value })} placeholder="628xxxxxxxx" /></div>
          <div><Label>Bio</Label><Textarea value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} placeholder="Ceritakan sedikit tentang Anda..." /></div>
          <Button onClick={save} disabled={saving} className="w-full bg-gradient-card shadow-glow">
            {saving ? <Loader2 className="animate-spin" /> : (<><Save className="h-4 w-4 mr-1" />Simpan Perubahan</>)}
          </Button>
        </Card>

        <Card className="mt-4 p-5 rounded-2xl shadow-card space-y-3">
          <p className="font-bold text-sm flex items-center gap-2"><KeyRound className="h-4 w-4" />Ubah Password</p>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password baru (min 6 karakter)" />
          <Button onClick={changePw} variant="secondary" className="w-full">Perbarui Password</Button>
        </Card>

        <Button onClick={logout} variant="outline" className="w-full mt-4 text-destructive border-destructive/40 hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" />Keluar
        </Button>
      </div>
    </AppShell>
  );
}
