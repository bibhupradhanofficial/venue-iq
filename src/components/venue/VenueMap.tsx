import { useMemo } from "react";
import type { Facility, Zone, ZoneDensity } from "@/lib/venue";
import { densityColor } from "@/lib/venue";

type Props = {
  zones: Zone[];
  facilities: Facility[];
  density: Record<string, ZoneDensity>;
  highlightZone?: string | null;
  onZoneClick?: (zoneId: string) => void;
  onFacilityClick?: (facilityId: string) => void;
  showLabels?: boolean;
  compact?: boolean;
  routeOverlay?: React.ReactNode;
};

const FACILITY_GLYPH: Record<Facility["kind"], string> = {
  gate: "G",
  stall: "F",
  restroom: "R",
  merch: "M",
};

const FACILITY_TINT: Record<Facility["kind"], string> = {
  gate: "var(--color-primary)",
  stall: "var(--color-accent)",
  restroom: "var(--color-chart-5)",
  merch: "var(--color-chart-4)",
};

export function VenueMap({
  zones,
  facilities,
  density,
  highlightZone,
  onZoneClick,
  onFacilityClick,
  showLabels = true,
  compact = false,
  routeOverlay,
}: Props) {
  const { width, height } = useMemo(() => ({ width: 800, height: 560 }), []);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full h-auto"
        style={{ background: "var(--color-background)" }}
        role="img"
        aria-label="Stadium map"
      >
        {/* Pitch */}
        <rect
          x={220}
          y={170}
          width={360}
          height={220}
          rx={20}
          fill="var(--color-pitch)"
          stroke="var(--color-border)"
        />
        <line x1={400} y1={170} x2={400} y2={390} stroke="var(--color-foreground)" strokeOpacity={0.3} />
        <circle cx={400} cy={280} r={32} fill="none" stroke="var(--color-foreground)" strokeOpacity={0.3} />

        {/* Zones */}
        {zones.map((z) => {
          const d = density[z.id]?.density ?? 0;
          const isHighlight = highlightZone === z.id;
          return (
            <g
              key={z.id}
              onClick={() => onZoneClick?.(z.id)}
              style={{ cursor: onZoneClick ? "pointer" : "default" }}
            >
              <rect
                className="density-cell"
                x={z.svg_x}
                y={z.svg_y}
                width={z.svg_w}
                height={z.svg_h}
                rx={6}
                fill={densityColor(d)}
                fillOpacity={z.kind === "concourse" ? 0.55 : 0.85}
                stroke={isHighlight ? "var(--color-primary)" : "var(--color-border)"}
                strokeWidth={isHighlight ? 2.5 : 1}
              />
              {showLabels && z.kind === "stand" && (
                <text
                  x={z.svg_x + z.svg_w / 2}
                  y={z.svg_y + z.svg_h / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--color-primary-foreground)"
                  pointerEvents="none"
                >
                  {z.id}
                </text>
              )}
            </g>
          );
        })}

        {/* Facilities */}
        {!compact &&
          facilities.map((f) => (
            <g
              key={f.id}
              onClick={() => onFacilityClick?.(f.id)}
              style={{ cursor: onFacilityClick ? "pointer" : "default" }}
            >
              <circle
                cx={f.svg_x}
                cy={f.svg_y}
                r={8}
                fill={f.is_open ? FACILITY_TINT[f.kind] : "var(--color-muted)"}
                stroke="var(--color-background)"
                strokeWidth={1.5}
                opacity={f.is_open ? 1 : 0.5}
              />
              <text
                x={f.svg_x}
                y={f.svg_y + 3}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fill="var(--color-primary-foreground)"
                pointerEvents="none"
              >
                {FACILITY_GLYPH[f.kind]}
              </text>
            </g>
          ))}

        {routeOverlay}
      </svg>
    </div>
  );
}
