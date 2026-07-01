import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/diskusi/")({
  component: DiskusiList,
});

function DiskusiList() {
  const [g, setG] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("discussion_groups").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setG(data ?? []));
  }, []);
  return (
    <AppShell>
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-8 rounded-b-[2rem]">
        <p className="text-2xl font-extrabold">Grup Diskusi</p>
      </div>
      <div className="px-5 mt-5 space-y-3">
        {g.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada grup. Buat lewat menu Kegiatan.</p>}
        {g.map((x) => (
          <Link key={x.id} to="/diskusi/$id" params={{ id: x.id }}>
            <Card className="p-4 flex items-center gap-3 shadow-card hover:shadow-glow">
              <div className="h-12 w-12 rounded-2xl bg-gradient-accent grid place-items-center text-accent-foreground"><MessagesSquare className="h-5 w-5" /></div>
              <div><p className="font-bold">{x.name}</p>{x.description && <p className="text-xs text-muted-foreground">{x.description}</p>}</div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
