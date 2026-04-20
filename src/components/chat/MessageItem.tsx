import { ShieldCheck, User } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageItem({ msg }: { msg: ChatMessage }) {
  const isOps = msg.sender_role === "ops";
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        isOps
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-card/40",
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        {isOps ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            <ShieldCheck className="h-3 w-3" /> Official
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
            <User className="h-3 w-3" /> Fan
            {msg.zone_id ? ` · ${msg.zone_id}` : ""}
          </span>
        )}
        <span
          className={cn(
            "text-xs font-medium",
            isOps ? "text-foreground" : "text-foreground/80",
          )}
        >
          {msg.sender_handle}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {formatTime(msg.created_at)}
        </span>
      </div>
      <div className="whitespace-pre-wrap break-words text-foreground">{msg.body}</div>
    </div>
  );
}
