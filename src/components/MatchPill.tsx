import { PHASE_LABEL, type MatchState } from "@/lib/venue";

export function MatchPill({ match }: { match: MatchState | null }) {
  if (!match) {
    return (
      <div className="rounded-full glass px-3 py-1 text-xs text-muted-foreground border border-border/40">
        Connecting…
      </div>
    );
  }
  const live = match.phase === "first_half" || match.phase === "second_half";
  return (
    <div className="flex items-center gap-2 rounded-full glass px-3 py-1 text-xs shadow-sm border border-border/40 hover:border-primary/30 transition-all">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          live ? "bg-success animate-pulse shadow-[0_0_8px_rgba(var(--color-success),0.5)]" : "bg-muted-foreground/30"
        }`}
      />
      <span className="font-medium text-foreground">{PHASE_LABEL[match.phase]}</span>
      {live && <span className="text-muted-foreground">{match.minute}'</span>}
      <span className="text-muted-foreground">·</span>
      <span className={`font-mono ${live ? "text-primary font-bold" : "text-foreground"}`}>
        {match.home_team.split(" ")[0]} {match.home_score}–{match.away_score}{" "}
        {match.away_team.split(" ")[0]}
      </span>
    </div>
  );
}
