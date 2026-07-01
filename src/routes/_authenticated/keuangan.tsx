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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wallet, Receipt, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/keuangan")({
  component: KeuanganPage,
});

type Tx = { id: string; kind: string; title: string; amount: number; tx_date: string; note: string | null; status: string | null };

function KeuanganPage() {
  const { isAdmin } = useIsAdmin();
  const [list, setList] = useState<Tx[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ kind: "tagihan", title: "", amount: "", tx_date: new Date().toISOString().slice(0, 10), note: "" });

  const load = () => supabase.from("transactions").select("*").order("tx_date", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  const totals = {
    tagihan: list.filter((t) => t.kind === "tagihan").reduce((s, t) => s + Number(t.amount), 0),
    pengeluaran: list.filter((t) => t.kind === "pengeluaran").reduce((s, t) => s + Number(t.amount), 0),
    pemasukan: list.filter((t) => t.kind === "pemasukan").reduce((s, t) => s + Number(t.amount), 0),
  };

  async function save() {
    if (!f.title || !f.amount) return toast.error("Judul & nominal wajib");
    setSaving(true);
    const { error } = await supabase.from("transactions").insert({ ...f, amount: Number(f.amount) });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan"); setOpen(false);
    setF({ kind: "tagihan", title: "", amount: "", tx_date: new Date().toISOString().slice(0, 10), note: "" });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus catatan ini?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus"); load();
  }

  const render = (filter: string) => {
    const items = list.filter((t) => t.kind === filter);
    if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Belum ada catatan.</p>;
    return items.map((t) => (
      <Card key={t.id} className="p-4 flex items-center gap-3 shadow-card">
        <div className={`h-11 w-11 rounded-2xl grid place-items-center text-white shrink-0 ${
          t.kind === "tagihan" ? "bg-gradient-to-br from-pink-500 to-rose-500" :
          t.kind === "pengeluaran" ? "bg-gradient-to-br from-amber-500 to-orange-500" :
          "bg-gradient-to-br from-emerald-500 to-teal-500"
        }`}>
          {t.kind === "tagihan" ? <Receipt className="h-5 w-5" /> : t.kind === "pengeluaran" ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{t.title}</p>
          <p className="text-xs text-muted-foreground">{new Date(t.tx_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm">Rp {Number(t.amount).toLocaleString("id-ID")}</p>
          {isAdmin && <button onClick={() => remove(t.id)} className="text-destructive text-xs mt-1"><Trash2 className="h-3 w-3 inline" /></button>}
        </div>
      </Card>
    ));
  };

  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-16 rounded-b-[2rem]">
        <p className="text-xs opacity-80 uppercase tracking-widest">Keuangan</p>
        <p className="text-2xl font-extrabold mt-1">Tagihan & Pengeluaran</p>
      </div>

      <div className="px-5 -mt-10 grid grid-cols-3 gap-2">
        <Card className="p-3 rounded-2xl shadow-card"><p className="text-[10px] text-muted-foreground">Tagihan</p><p className="text-sm font-extrabold text-pink-600 mt-1">Rp {(totals.tagihan/1000).toFixed(0)}k</p></Card>
        <Card className="p-3 rounded-2xl shadow-card"><p className="text-[10px] text-muted-foreground">Pemasukan</p><p className="text-sm font-extrabold text-emerald-600 mt-1">Rp {(totals.pemasukan/1000).toFixed(0)}k</p></Card>
        <Card className="p-3 rounded-2xl shadow-card"><p className="text-[10px] text-muted-foreground">Pengeluaran</p><p className="text-sm font-extrabold text-amber-600 mt-1">Rp {(totals.pengeluaran/1000).toFixed(0)}k</p></Card>
      </div>

      <div className="px-5 mt-5">
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-card shadow-glow mb-3"><Plus className="h-4 w-4 mr-1" />Tambah Catatan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Catatan Baru</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Jenis</Label>
                  <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tagihan">Tagihan</SelectItem>
                      <SelectItem value="pemasukan">Pemasukan</SelectItem>
                      <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Judul</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Iuran Bulanan, dsb." /></div>
                <div><Label>Nominal (Rp)</Label><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
                <div><Label>Tanggal</Label><Input type="date" value={f.tx_date} onChange={(e) => setF({ ...f, tx_date: e.target.value })} /></div>
                <div><Label>Catatan</Label><Textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
                <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="animate-spin" /> : "Simpan"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Tabs defaultValue="tagihan">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
            <TabsTrigger value="pemasukan">Masuk</TabsTrigger>
            <TabsTrigger value="pengeluaran">Keluar</TabsTrigger>
          </TabsList>
          <TabsContent value="tagihan" className="mt-4 space-y-3">{render("tagihan")}</TabsContent>
          <TabsContent value="pemasukan" className="mt-4 space-y-3">{render("pemasukan")}</TabsContent>
          <TabsContent value="pengeluaran" className="mt-4 space-y-3">{render("pengeluaran")}</TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
