import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import {
  Carousel, CarouselContent, CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Users, Wallet, CalendarDays, MessagesSquare, UserPlus, Shield, Receipt, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

type Banner = { id: string; title: string; subtitle: string | null; gradient: string | null; image_url: string | null };

function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState({ members: 0, tagihan: 0, pengeluaran: 0, events: 0 });
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: b }, { count: m }, { data: tx }, { count: ev }] = await Promise.all([
        supabase.from("banners").select("*").eq("active", true).order("order_idx"),
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("kind,amount"),
        supabase.from("events").select("*", { count: "exact", head: true }),
      ]);
      const tagihan = (tx ?? []).filter((t: any) => t.kind === "tagihan").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const pengeluaran = (tx ?? []).filter((t: any) => t.kind === "pengeluaran").reduce((s: number, t: any) => s + Number(t.amount), 0);
      setBanners(b ?? []);
      setStats({ members: m ?? 0, tagihan, pengeluaran, events: ev ?? 0 });
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const menu = [
    { to: "/members", label: "Anggota", icon: Users, color: "from-indigo-500 to-purple-500" },
    { to: "/keuangan", label: "Tagihan", icon: Receipt, color: "from-pink-500 to-rose-500" },
    { to: "/keuangan", label: "Pengeluaran", icon: Wallet, color: "from-amber-500 to-orange-500" },
    { to: "/events", label: "Acara", icon: CalendarDays, color: "from-emerald-500 to-teal-500" },
    { to: "/diskusi", label: "Diskusi", icon: MessagesSquare, color: "from-blue-500 to-cyan-500" },
    { to: "/members/add", label: "Tambah", icon: UserPlus, color: "from-violet-500 to-fuchsia-500" },
  ] as const;

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-24 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Selamat datang,</p>
            <p className="text-lg font-bold">{profile?.full_name || user?.email?.split("@")[0]}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-3 py-1.5 text-xs font-semibold">
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link to="/profile">
              <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur grid place-items-center overflow-hidden ring-2 ring-white/40">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <span className="font-bold">{(profile?.full_name || user?.email || "?")[0]?.toUpperCase()}</span>}
              </div>
            </Link>
          </div>
        </div>

        {/* Saldo card */}
        <Card className="mt-5 p-4 bg-white/10 backdrop-blur border-white/20 text-primary-foreground rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Total Tagihan Aktif</p>
              <p className="text-2xl font-extrabold mt-1">Rp {stats.tagihan.toLocaleString("id-ID")}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Pengeluaran</p>
              <p className="text-lg font-bold mt-1 flex items-center gap-1"><TrendingUp className="h-4 w-4" />Rp {stats.pengeluaran.toLocaleString("id-ID")}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="opacity-80">{stats.members} anggota</span>
            <span className="opacity-80">•</span>
            <span className="opacity-80">{stats.events} acara</span>
          </div>
        </Card>
      </div>

      {/* Banner carousel */}
      <div className="px-5 -mt-16 relative z-10">
        {banners.length > 0 ? (
          <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3800 })]}>
            <CarouselContent>
              {banners.map((b) => (
                <CarouselItem key={b.id}>
                  <div className={`bg-gradient-to-br ${b.gradient || "from-indigo-500 via-purple-500 to-pink-500"} rounded-2xl p-5 h-32 flex flex-col justify-between text-white shadow-card`}>
                    <p className="text-xs uppercase tracking-widest opacity-90">Info</p>
                    <div>
                      <p className="font-bold text-lg leading-tight">{b.title}</p>
                      {b.subtitle && <p className="text-sm opacity-90">{b.subtitle}</p>}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="bg-gradient-card rounded-2xl p-5 h-32 text-primary-foreground shadow-card">
            <p className="text-xs uppercase tracking-widest opacity-90">Selamat datang</p>
            <p className="mt-2 font-bold text-lg">Komunitas Kita — kelola semua dari satu tempat.</p>
          </div>
        )}
      </div>

      {/* Menu grid */}
      <div className="px-5 mt-6">
        <p className="font-bold text-sm mb-3">Menu Utama</p>
        <div className="grid grid-cols-3 gap-3">
          {menu.map((m) => (
            <Link key={m.label} to={m.to} className="flex flex-col items-center gap-2 rounded-2xl p-3 bg-card shadow-card hover:shadow-glow transition-all active:scale-95">
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${m.color} grid place-items-center text-white shadow-md`}>
                <m.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-center">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Promo strip */}
      <div className="px-5 mt-6">
        <Card className="p-4 bg-gradient-accent text-accent-foreground rounded-2xl flex items-center gap-3">
          <CalendarDays className="h-8 w-8" />
          <div>
            <p className="font-bold text-sm">Jadwal acara terdekat</p>
            <p className="text-xs opacity-90">Cek di menu Kegiatan.</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
