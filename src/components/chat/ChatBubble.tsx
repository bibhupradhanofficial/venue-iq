import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatPanel } from "./ChatPanel";
import { useFan, saveFan, seatToZone, type FanProfile } from "@/lib/fan-session";

const HIDDEN_PREFIXES = ["/ops", "/auth"];

export function ChatBubble() {
  const loc = useLocation();
  const fan = useFan();
  const [open, setOpen] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");

  // Hide on ops/auth routes
  const hidden = HIDDEN_PREFIXES.some((p) => loc.pathname.startsWith(p));

  useEffect(() => {
    if (!open) setHandleDraft("");
  }, [open]);

  if (hidden) return null;

  const startChat = () => {
    const handle = handleDraft.trim().slice(0, 32);
    if (!handle) return;
    const profile: FanProfile = {
      handle,
      seatCode: fan?.seatCode ?? null,
      zoneId: fan?.zoneId ?? seatToZone(fan?.seatCode ?? null),
      persona: fan?.persona ?? "casual",
    };
    saveFan(profile);
  };

  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full shadow-lg"
        aria-label="Open venue chat"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-4 sm:max-w-md"
        >
          <SheetHeader className="pb-3">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Venue Chat
            </SheetTitle>
            <SheetDescription>
              Live chat for everyone in the venue. Ops messages are tagged.
            </SheetDescription>
          </SheetHeader>

          {!fan?.handle ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
              <p className="text-sm text-muted-foreground">
                Pick a display name to join the chat.
              </p>
              <Input
                autoFocus
                value={handleDraft}
                onChange={(e) => setHandleDraft(e.target.value)}
                placeholder="e.g. Alex from N5"
                maxLength={32}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startChat();
                }}
              />
              <Button onClick={startChat} disabled={!handleDraft.trim()}>
                Join chat
              </Button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <ChatPanel
                identity={{
                  sender_handle: fan.handle,
                  sender_role: "fan",
                  seat_code: fan.seatCode,
                  zone_id: fan.zoneId ?? seatToZone(fan.seatCode),
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
