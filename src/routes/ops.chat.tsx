import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatPanel } from "@/components/chat/ChatPanel";

export const Route = createFileRoute("/ops/chat")({
  head: () => ({
    meta: [
      { title: "Ops Chat · VenueIQ" },
      { name: "description", content: "Live venue chat with fans." },
    ],
  }),
  component: OpsChatPage,
});

function OpsChatPage() {
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "ops";
      setHandle(email.split("@")[0] || "ops");
    });
  }, []);

  if (!handle) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4" style={{ height: "calc(100vh - 60px)" }}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Venue Chat</h1>
        <span className="ml-2 text-xs text-muted-foreground">
          Messages you send are tagged as Official.
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card/30 p-3">
        <ChatPanel
          identity={{
            sender_handle: handle,
            sender_role: "ops",
          }}
          emptyHint="No messages yet."
        />
      </div>
    </div>
  );
}
