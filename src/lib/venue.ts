// Venue domain types & helpers

export type Zone = {
  id: string;
  name: string;
  kind: "stand" | "concourse" | "plaza";
  stand: string | null;
  capacity: number;
  svg_x: number;
  svg_y: number;
  svg_w: number;
  svg_h: number;
};

export type Facility = {
  id: string;
  zone_id: string | null;
  kind: "gate" | "stall" | "restroom" | "merch";
  name: string;
  servers: number;
  service_rate: number;
  is_open: boolean;
  svg_x: number;
  svg_y: number;
};

export type ZoneDensity = {
  zone_id: string;
  density: number;
  head_count: number;
  trend: number;
  manual_override: number | null;
  updated_at: string;
};

export type QueueState = {
  facility_id: string;
  arrivals_per_min: number;
  queue_length: number;
  wait_minutes: number;
  updated_at: string;
};

export type MatchPhase =
  | "pre_game"
  | "first_half"
  | "half_time"
  | "second_half"
  | "full_time";

export type MatchState = {
  id: number;
  phase: MatchPhase;
  minute: number;
  home_score: number;
  away_score: number;
  home_team: string;
  away_team: string;
  updated_at: string;
};

export const PHASE_LABEL: Record<MatchPhase, string> = {
  pre_game: "Pre-game",
  first_half: "1st Half",
  half_time: "Half-time",
  second_half: "2nd Half",
  full_time: "Full-time",
};

// Color for density 0..1 — green → yellow → red
export function densityColor(d: number): string {
  const x = Math.max(0, Math.min(1, d));
  // Interpolate hue 145 (green) -> 80 (yellow) -> 25 (red)
  const hue = x < 0.5 ? 145 - (x / 0.5) * 65 : 80 - ((x - 0.5) / 0.5) * 55;
  const lightness = 0.55 + (1 - x) * 0.1;
  const chroma = 0.16 + x * 0.08;
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

export function densityLabel(d: number): string {
  if (d < 0.3) return "Quiet";
  if (d < 0.55) return "Steady";
  if (d < 0.75) return "Busy";
  if (d < 0.9) return "Crowded";
  return "Critical";
}

// M/M/c queue wait estimate (minutes).
// arrivals (per min), servers c, service_rate per server (per min).
export function estimateWaitMinutes(
  arrivalsPerMin: number,
  servers: number,
  serviceRate: number,
): number {
  if (servers <= 0 || serviceRate <= 0) return 99;
  const rho = arrivalsPerMin / (servers * serviceRate);
  if (rho >= 0.99) return 30; // saturated → cap at 30 min
  // Approximation: average wait ≈ rho^c / (c * serviceRate * (1 - rho))
  const w = Math.pow(rho, servers) / (servers * serviceRate * (1 - rho));
  return Math.max(0, Math.min(45, w));
}
