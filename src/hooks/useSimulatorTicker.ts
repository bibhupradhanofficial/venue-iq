import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { tickSimulator } from "@/server/simulator";

/**
 * Drives the crowd simulator at a fixed cadence.
 * Mounted on any page that wants the demo to feel alive.
 * Multiple tabs are fine — last-write-wins.
 */
export function useSimulatorTicker(intervalMs = 5000) {
  const tick = useServerFn(tickSimulator);
  const running = useRef(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (running.current || !mounted) return;
      running.current = true;
      try {
        await tick();
      } catch (err) {
        // Swallow errors — simulator is best-effort
        console.warn("[simulator] tick failed", err);
      } finally {
        running.current = false;
      }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tick, intervalMs]);
}
