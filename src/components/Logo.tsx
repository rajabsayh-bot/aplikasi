import { Users } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const t = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <div className="flex items-center gap-3">
      <div className={`${s} rounded-2xl bg-gradient-card grid place-items-center shadow-glow`}>
        <Users className="text-primary-foreground" />
      </div>
      <div>
        <div className={`${t} font-extrabold leading-none tracking-tight`}>Komunitas<span className="text-primary">Kita</span></div>
        {size !== "sm" && <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Portal Anggota</div>}
      </div>
    </div>
  );
}
