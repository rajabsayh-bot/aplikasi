import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminUser } from "@/lib/admin.functions";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Shield, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const ensureAdmin = useServerFn(ensureAdminUser);
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", username: "", full_name: "", adminUser: "admin", adminPass: "" });

  async function loginUser() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Selamat datang!");
    navigate({ to: "/home" });
  }

  async function registerUser() {
    if (!form.email || form.password.length < 6) return toast.error("Email valid & password minimal 6 karakter");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username: form.username || form.email.split("@")[0], full_name: form.full_name || form.username },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Registrasi berhasil, silakan login");
    setTab("login");
  }

  async function loginAdmin() {
    setLoading(true);
    try {
      const { email } = await ensureAdmin();
      const { error } = await supabase.auth.signInWithPassword({ email, password: form.adminPass });
      if (error) throw error;
      toast.success("Login admin berhasil");
      navigate({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Login admin gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col p-6">
      <div className="pt-8 pb-10 text-primary-foreground">
        <Logo size="lg" />
        <p className="mt-6 text-2xl font-bold leading-tight">Kelola komunitas <br/>lebih rapi & modern.</p>
        <p className="mt-2 text-sm opacity-90">Anggota • Tagihan • Jadwal • Diskusi</p>
      </div>

      <Card className="mt-auto p-5 rounded-3xl shadow-glow">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setMode("user")} className={`flex items-center gap-2 justify-center rounded-xl py-2.5 text-sm font-semibold transition-all ${mode === "user" ? "bg-gradient-card text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
            <UserIcon className="h-4 w-4" /> Pengguna
          </button>
          <button onClick={() => setMode("admin")} className={`flex items-center gap-2 justify-center rounded-xl py-2.5 text-sm font-semibold transition-all ${mode === "admin" ? "bg-gradient-accent text-accent-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
            <Shield className="h-4 w-4" /> Admin
          </button>
        </div>

        {mode === "user" ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
              <Button onClick={loginUser} disabled={loading} className="w-full bg-gradient-card shadow-glow">{loading ? <Loader2 className="animate-spin" /> : "Masuk"}</Button>
            </TabsContent>
            <TabsContent value="register" className="space-y-3 mt-4">
              <div><Label>Nama lengkap</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nama Anda" /></div>
              <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 karakter" /></div>
              <Button onClick={registerUser} disabled={loading} className="w-full bg-gradient-card shadow-glow">{loading ? <Loader2 className="animate-spin" /> : "Daftar"}</Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-3 mt-2">
            <div>
              <Label>Username Admin</Label>
              <Input value={form.adminUser} disabled />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={form.adminPass} onChange={(e) => setForm({ ...form, adminPass: e.target.value })} placeholder="Password admin" />
            </div>
            <Button onClick={loginAdmin} disabled={loading} className="w-full bg-gradient-accent shadow-glow">
              {loading ? <Loader2 className="animate-spin" /> : "Masuk sebagai Admin"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Login admin dengan password yang telah ditetapkan.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
