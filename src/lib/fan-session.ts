// Lightweight client-side fan profile (no auth)
import { useEffect, useState } from "react";

export type FanProfile = {
  handle: string;
  seatCode: string | null;
  zoneId: string | null;
  persona: "casual" | "foodie" | "vip" | "family";
};

const KEY = "venueiq.fan";

export function loadFan(): FanProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FanProfile) : null;
  } catch {
    return null;
  }
}

export function saveFan(p: FanProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("venueiq.fan.update"));
}

export function clearFan() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("venueiq.fan.update"));
}

export function useFan(): FanProfile | null {
  const [fan, setFan] = useState<FanProfile | null>(null);
  useEffect(() => {
    setFan(loadFan());
    const onUpdate = () => setFan(loadFan());
    window.addEventListener("venueiq.fan.update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("venueiq.fan.update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);
  return fan;
}

// Map a seat code like "N5-A12" to its zone id (the part before "-").
export function seatToZone(seat: string | null): string | null {
  if (!seat) return null;
  const m = seat.match(/^([A-Z]+\d+)/);
  return m ? m[1] : null;
}
