import type { Facility, Zone } from "@/lib/venue";
import { pathToPoints } from "@/lib/routing";

type Props = {
  path: string[];
  zones: Zone[];
  destFacility?: Facility | null;
};

export function RouteOverlay({ path, zones, destFacility }: Props) {
  if (!path || path.length === 0) return null;
  const pts = pathToPoints(path, zones);
  if (pts.length === 0) return null;

  // Append facility as final waypoint if provided.
  const finalPts = destFacility
    ? [...pts, { id: destFacility.id, x: destFacility.svg_x, y: destFacility.svg_y }]
    : pts;

  const d = finalPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <g pointerEvents="none">
      <path
        d={d}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={4}
        strokeOpacity={0.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 6"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-24"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
      {finalPts.map((p, i) => (
        <circle
          key={`${p.id}-${i}`}
          cx={p.x}
          cy={p.y}
          r={i === 0 || i === finalPts.length - 1 ? 6 : 3}
          fill="var(--color-primary)"
          stroke="var(--color-background)"
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}
