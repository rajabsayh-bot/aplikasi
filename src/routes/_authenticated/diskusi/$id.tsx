import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/diskusi/$id")({
  component: DiskusiRoom,
});

type Msg = { id: string; user_id: string; content: string; created_at: string; profile?: { full_name: string | null; avatar_url: string | null } };

function DiskusiRoom() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("discussion_groups").select("*").eq("id", id).maybeSingle().then(({ data }) => setGroup(data));
    load();
    const ch = supabase
      .channel(`grp-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "discussion_messages", filter: `group_id=eq.${id}` },
        (payload) => setMsgs((prev) => [...prev, payload.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [id]);

  const load = async () => {
    const { data } = await supabase.from("discussion_messages").select("*").eq("group_id", id).order("created_at");
    setMsgs(data ?? []);
    const uids = Array.from(new Set((data ?? []).map((m: any) => m.user_id)));
    if (uids.length) {
      const { data: p } = await supabase.from("profiles").select("id,full_name,avatar_url,username").in("id", uids);
      const map: Record<string, any> = {};
      (p ?? []).forEach((x: any) => { map[x.id] = x; });
      setProfiles(map);
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText("");
    await supabase.from("discussion_messages").insert({ group_id: id, user_id: user.id, content });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-hero text-primary-foreground px-5 pt-8 pb-4 rounded-b-3xl shadow-glow">
        <div className="mx-auto max-w-md flex items-center gap-3">
          <button onClick={() => navigate({ to: "/kegiatan" })}><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <p className="font-bold">{group?.name ?? "Diskusi"}</p>
            <p className="text-xs opacity-80">{group?.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 mx-auto w-full max-w-md space-y-2">
        {msgs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Belum ada pesan. Mulai diskusi!</p>}
        {msgs.map((m) => {
          const own = m.user_id === user?.id;
          const p = profiles[m.user_id];
          return (
            <div key={m.id} className={`flex gap-2 ${own ? "flex-row-reverse" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-card grid place-items-center text-primary-foreground text-xs font-bold overflow-hidden shrink-0">
                {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : (p?.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${own ? "bg-gradient-card text-primary-foreground rounded-tr-sm" : "bg-card shadow-card rounded-tl-sm"}`}>
                {!own && <p className="text-[10px] font-bold opacity-70 mb-0.5">{p?.full_name || "Anggota"}</p>}
                <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${own ? "opacity-70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-card p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="mx-auto max-w-md flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Tulis pesan..." />
          <Button onClick={send} className="bg-gradient-card shadow-glow"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
