import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useChat, type SendInput } from "@/hooks/useChat";
import { MessageItem } from "./MessageItem";

type Props = {
  identity: Omit<SendInput, "body">;
  emptyHint?: string;
};

export function ChatPanel({ identity, emptyHint }: Props) {
  const { messages, loading, send } = useChat();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await send({ ...identity, body: text });
    setSending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Failed to send");
      return;
    }
    setText("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="flex-1 min-h-0 pr-2">
        <div className="flex flex-col gap-2 py-2">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              {emptyHint ?? "No messages yet — say hi!"}
            </div>
          ) : (
            messages.map((m) => <MessageItem key={m.id} msg={m} />)
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          placeholder={
            identity.sender_role === "ops"
              ? "Send an official message…"
              : "Message the venue…"
          }
          maxLength={500}
          disabled={sending}
        />
        <Button onClick={onSend} disabled={sending || !text.trim()} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>
          Posting as <strong>{identity.sender_handle}</strong>{" "}
          ({identity.sender_role === "ops" ? "Official" : "Fan"})
        </span>
        <span>{text.length}/500</span>
      </div>
    </div>
  );
}
