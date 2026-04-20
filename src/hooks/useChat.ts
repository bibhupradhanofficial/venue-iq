import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  body: string;
  sender_handle: string;
  sender_role: "fan" | "ops";
  seat_code: string | null;
  zone_id: string | null;
  created_at: string;
};

export type SendInput = {
  body: string;
  sender_handle: string;
  sender_role: "fan" | "ops";
  seat_code?: string | null;
  zone_id?: string | null;
};

const MAX_MESSAGES = 100;
const RATE_LIMIT_MS = 2000;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSendRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!mounted) return;
      if (error) setError(error.message);
      else setMessages(((data ?? []) as ChatMessage[]).reverse());
      setLoading(false);
    })();

    const channel = supabase
      .channel(`chat_messages_live_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const next = [...prev, msg];
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const send = useCallback(async (input: SendInput) => {
    const body = input.body.trim();
    if (body.length === 0) return { ok: false, error: "Message is empty" };
    if (body.length > 500) return { ok: false, error: "Max 500 characters" };

    const now = Date.now();
    if (now - lastSendRef.current < RATE_LIMIT_MS) {
      return { ok: false, error: "Slow down — wait a moment before sending again" };
    }
    lastSendRef.current = now;

    const { error } = await supabase.from("chat_messages").insert({
      body,
      sender_handle: input.sender_handle.slice(0, 64),
      sender_role: input.sender_role,
      seat_code: input.seat_code ?? null,
      zone_id: input.zone_id ?? null,
    });
    if (error) {
      lastSendRef.current = 0;
      return { ok: false, error: error.message };
    }
    return { ok: true as const };
  }, []);

  return { messages, loading, error, send };
}
