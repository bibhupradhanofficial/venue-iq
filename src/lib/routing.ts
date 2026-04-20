// Zone graph + Dijkstra path finding for indoor routing.
// Stands connect to their nearest concourse; concourses chain along their side.
import type { Facility, Zone, ZoneDensity } from "@/lib/venue";

// Hand-built adjacency for the demo venue layout.
// Each edge is bidirectional with a base "walk" cost in arbitrary units (~ meters/3).
const RAW_EDGES: Array<[string, string, number]> = [
  // North stands → North concourse
  ["N1", "CN", 4], ["N2", "CN", 4], ["N3", "CN", 4], ["N4", "CN", 4], ["N5", "CN", 4],
  // South stands → South concourse
  ["S1", "CS", 4], ["S2", "CS", 4], ["S3", "CS", 4], ["S4", "CS", 4], ["S5", "CS", 4],
  // West stands → West concourse
  ["W1", "CW", 4], ["W2", "CW", 4], ["W3", "CW", 4],
  // East stands → East concourse
  ["E1", "CE", 4], ["E2", "CE", 4], ["E3", "CE", 4],
  // Concourse ring
  ["CN", "CW", 6], ["CN", "CE", 6], ["CS", "CW", 6], ["CS", "CE", 6],
];

export function buildGraph(): Map<string, Array<{ to: string; w: number }>> {
  const g = new Map<string, Array<{ to: string; w: number }>>();
  for (const [a, b, w] of RAW_EDGES) {
    if (!g.has(a)) g.set(a, []);
    if (!g.has(b)) g.set(b, []);
    g.get(a)!.push({ to: b, w });
    g.get(b)!.push({ to: a, w });
  }
  return g;
}

const GRAPH = buildGraph();

// Density-weighted Dijkstra. Crowded zones cost ~3x more to traverse.
export function findPath(
  origin: string,
  dest: string,
  density: Record<string, ZoneDensity> = {},
): { path: string[]; cost: number } | null {
  if (origin === dest) return { path: [origin], cost: 0 };
  if (!GRAPH.has(origin) || !GRAPH.has(dest)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  for (const k of GRAPH.keys()) {
    dist.set(k, Infinity);
    prev.set(k, null);
  }
  dist.set(origin, 0);

  while (visited.size < GRAPH.size) {
    let u: string | null = null;
    let best = Infinity;
    for (const [k, v] of dist) {
      if (!visited.has(k) && v < best) {
        best = v;
        u = k;
      }
    }
    if (u === null || best === Infinity) break;
    if (u === dest) break;
    visited.add(u);
    for (const { to, w } of GRAPH.get(u) ?? []) {
      if (visited.has(to)) continue;
      const d = density[to]?.density ?? 0;
      const penalty = 1 + d * 2; // 1x to 3x
      const alt = best + w * penalty;
      if (alt < (dist.get(to) ?? Infinity)) {
        dist.set(to, alt);
        prev.set(to, u);
      }
    }
  }

  if ((dist.get(dest) ?? Infinity) === Infinity) return null;
  const path: string[] = [];
  let cur: string | null = dest;
  while (cur) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return { path, cost: dist.get(dest)! };
}

// Convert path cost to an approx walk-time in minutes (~ 80 m/min, 3 m per cost unit).
export function costToMinutes(cost: number): number {
  return Math.max(1, Math.round((cost * 3) / 80 * 10) / 10);
}

// SVG centers for polyline rendering on the map.
export function pathToPoints(
  path: string[],
  zones: Zone[],
): Array<{ x: number; y: number; id: string }> {
  const byId = new Map(zones.map((z) => [z.id, z]));
  return path
    .map((id) => {
      const z = byId.get(id);
      if (!z) return null;
      return { id, x: z.svg_x + z.svg_w / 2, y: z.svg_y + z.svg_h / 2 };
    })
    .filter((p): p is { x: number; y: number; id: string } => p !== null);
}

// Find the best facility of a given kind for a fan, optimizing walk + wait.
export type RankedFacility = {
  facility: Facility;
  walkMin: number;
  waitMin: number;
  totalMin: number;
};

export function rankFacilitiesForFan(
  fanZoneId: string | null,
  facilities: Facility[],
  zones: Zone[],
  density: Record<string, ZoneDensity>,
  queues: Record<string, { wait_minutes: number }>,
  kind: Facility["kind"],
): RankedFacility[] {
  const candidates = facilities.filter((f) => f.kind === kind && f.is_open);
  return candidates
    .map((f) => {
      const wait = queues[f.id]?.wait_minutes ?? 0;
      let walk = 1;
      if (fanZoneId && f.zone_id) {
        const r = findPath(fanZoneId, f.zone_id, density);
        walk = r ? costToMinutes(r.cost) : 5;
      }
      return { facility: f, walkMin: walk, waitMin: wait, totalMin: walk + wait };
    })
    .sort((a, b) => a.totalMin - b.totalMin);
}
