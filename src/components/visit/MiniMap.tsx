"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EXHIBITION_MAP } from "@/data/exhibitionModules";
import { ENTRANCE_SPAWN } from "@/data/visit";
import { formatModuleNumber, spreadPoints, type ExhibitionModule } from "@/lib/visit/exhibitionModules";
import { mapHeadingDeg, mapSize, worldToMap, type Point } from "@/lib/visit/mapGeometry";

import type { VisitorTracker } from "./useVisitorTracker";

const B = EXHIBITION_MAP.bounds;
const [W, H] = mapSize(B);
const ENTRANCE = worldToMap(B, ENTRANCE_SPAWN.position[0], ENTRANCE_SPAWN.position[2]);

/** Tamanhos em metros (o SVG usa `viewBox` em metros). */
const SIZES = {
  compact: { marker: 0.2, visitor: 0.2, cone: 1.1, path: 0.09 },
  large: { marker: 0.15, visitor: 0.15, cone: 0.85, path: 0.06 },
} as const;

/** Cores dos pontos: bege (não explorado), verde-sálvia (explorado), amarelo (destino). */
export const MARKER_COLORS = {
  pending: "#d2c5b5",
  explored: "#8fcf9f",
  target: "#FFD54A",
} as const;

type MiniMapProps = {
  modules: ExhibitionModule[];
  explored: ReadonlySet<string>;
  /** Destino atual (visita guiada ou orientação): amarelo, com o percurso. */
  targetId: string | null;
  /** Módulo escolhido no painel (ainda sem orientação): anel amarelo. */
  selectedId?: string | null;
  path: Point[] | null;
  tracker: VisitorTracker;
  variant: "compact" | "large";
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * Planta da exposição vista de cima, com a entrada embaixo (ver `mapGeometry.ts`): piso livre e
 * móveis derivados da colisão (`exhibitionMap.json`), um ponto por módulo disponível e o
 * visitante (ponto amarelo com o cone do olhar), movido direto no DOM a cada quadro.
 */
export default function MiniMap({
  modules,
  explored,
  targetId,
  selectedId = null,
  path,
  tracker,
  variant,
  onSelect,
  className = "",
}: MiniMapProps) {
  const s = SIZES[variant];
  const visitorRef = useRef<SVGGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(
    () =>
      tracker.subscribe(({ x, z, yawDeg }) => {
        const g = visitorRef.current;
        if (!g) return;
        const [u, v] = worldToMap(B, x, z);
        g.setAttribute("transform", `translate(${u.toFixed(3)} ${v.toFixed(3)}) rotate(${mapHeadingDeg(yawDeg).toFixed(1)})`);
        g.style.opacity = "1";
      }),
    [tracker],
  );

  // Pontos do mapa, afastados quando dois módulos ficam no mesmo móvel.
  const placed = useMemo(() => {
    const withPos = modules.filter((m) => m.position);
    const pts = spreadPoints(
      withPos.map((m) => m.position!),
      s.marker * 2.6,
    );
    return new Map(withPos.map((m, j) => [m.id, worldToMap(B, pts[j][0], pts[j][1])]));
  }, [modules, s.marker]);

  const tooltip = modules.find((m) => m.id === hovered);
  const tooltipAt = tooltip ? (placed.get(tooltip.id) ?? null) : null;
  const pathPoints = path?.map(([x, z]) => worldToMap(B, x, z).map((n) => n.toFixed(2)).join(",")).join(" ");
  const coneHalf = s.cone * 0.55;

  return (
    <div className={`relative ${className}`} onPointerLeave={() => setHovered(null)}>
      <svg
        viewBox={`0 0 ${W.toFixed(2)} ${H.toFixed(2)}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Planta da exposição com a sua posição e os módulos"
      >
        <defs>
          <radialGradient id={`cone-${variant}`} cx="0" cy="0" r={s.cone} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFD54A" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFD54A" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Piso livre em bege claro; móveis em laranja-terra (tons da logo). */}
        <path d={EXHIBITION_MAP.floorPath} fill="rgba(224,211,194,0.16)" stroke="rgba(224,211,194,0.42)" strokeWidth={0.035} fillRule="evenodd" />
        <path d={EXHIBITION_MAP.furniturePath} fill="rgba(255,186,95,0.24)" fillRule="evenodd" />

        {/* Entrada */}
        <g transform={`translate(${ENTRANCE[0]} ${ENTRANCE[1] + 0.42})`} opacity={0.75}>
          <path d="M-0.35 0h0.7" stroke="#ffba5f" strokeWidth={0.07} strokeLinecap="round" />
          {variant === "large" && (
            <text y={0.36} textAnchor="middle" fontSize={0.3} fill="#e0d3c2" style={{ letterSpacing: "0.02em" }}>
              entrada
            </text>
          )}
        </g>

        {pathPoints && (
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#FFD54A"
            strokeOpacity={0.85}
            strokeWidth={s.path}
            strokeDasharray={`${s.path * 2} ${s.path * 1.6}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {modules.map((m) => {
          const at = placed.get(m.id);
          if (!at) return null;
          const [u, v] = at;
          const isTarget = m.id === targetId;
          const isSelected = m.id === selectedId;
          const fill = isTarget ? MARKER_COLORS.target : explored.has(m.id) ? MARKER_COLORS.explored : MARKER_COLORS.pending;
          const label = `${formatModuleNumber(m.number)} · ${m.title}${explored.has(m.id) ? " (explorado)" : ""}`;
          return (
            <g
              key={m.id}
              transform={`translate(${u.toFixed(3)} ${v.toFixed(3)})`}
              className={onSelect ? "cursor-pointer" : undefined}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={onSelect ? label : undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(m.id)}
              onPointerLeave={() => setHovered((h) => (h === m.id ? null : h))}
              onClick={() => onSelect?.(m.id)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(m.id);
                }
              }}
            >
              <title>{label}</title>
              {/* Área de toque maior que o ponto. */}
              <circle r={s.marker * 2.4} fill="transparent" />
              {(isTarget || isSelected) && (
                <circle r={s.marker * 2} fill="none" stroke="#FFD54A" strokeOpacity={0.7} strokeWidth={s.marker * 0.45} />
              )}
              <circle r={s.marker} fill={fill} stroke="rgba(23,20,17,0.75)" strokeWidth={s.marker * 0.3} />
            </g>
          );
        })}

        <g ref={visitorRef} style={{ opacity: 0 }} pointerEvents="none">
          <path
            d={`M0 0L${-coneHalf} ${-s.cone}A${s.cone} ${s.cone} 0 0 1 ${coneHalf} ${-s.cone}Z`}
            fill={`url(#cone-${variant})`}
          />
          <circle r={s.visitor} fill="#FFD54A" stroke="rgba(0,0,0,0.7)" strokeWidth={s.visitor * 0.35} />
        </g>
      </svg>

      {tooltip && tooltipAt && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-md border border-white/10 bg-stone-950/90 px-2 py-1 text-[11px] font-medium text-stone-100 shadow-lg"
          style={{ left: `${(tooltipAt[0] / W) * 100}%`, top: `${(tooltipAt[1] / H) * 100}%` }}
        >
          {formatModuleNumber(tooltip.number)} · {tooltip.title}
        </div>
      )}
    </div>
  );
}
