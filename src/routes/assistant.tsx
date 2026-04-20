import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useFan } from "@/lib/fan-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Stadium Assistant · VenueIQ" },
      { name: "description", content: "Ask anything about the stadium — queues, food, navigation, your seat." },
      { property: "og:title", content: "AI Stadium Assistant · VenueIQ" },
      { property: "og:description", content: "Ask anything about the stadium — queues, food, navigation, your seat." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Where is the shortest food queue right now?",
  "How crowded is my zone?",
  "Best route to a restroom from my seat?",
  "Any premium seat upgrades available?",
];

function AssistantPage() {
  const fan = useFan();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const resp = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          fan: { handle: fan?.handle, seatCode: fan?.seatCode, zoneId: fan?.zoneId, persona: fan?.persona },
        }),
      });
      if (!resp.ok || !resp.body) {
        const errBody = await resp.text().catch(() => "");
        let friendly = "Assistant unavailable. Please try again.";
        if (resp.status === 429) friendly = "Slow down — too many requests. Try again shortly.";
        if (resp.status === 402) friendly = "AI credits exhausted. Add funds in workspace settings.";
        setMessages((prev) => [...prev, { role: "assistant", content: friendly + (errBody ? `\n\n(${errBody.slice(0, 120)})` : "") }]);
        setStreaming(false);
        return;
      }

      let acc = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — please retry." }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-120px)] max-w-2xl flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">VenueIQ Assistant</h1>
          <p className="text-xs text-muted-foreground">
            Knows your seat, the queues, and the match.
          </p>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              <div className="grid gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the stadium…"
            disabled={streaming}
          />
          <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </main>
  );
}
