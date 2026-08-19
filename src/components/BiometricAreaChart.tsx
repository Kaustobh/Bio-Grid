"use client";

import React, { useRef, useState, useEffect } from "react";
import { useBiometricStore, TelemetryData } from "@/store/useBiometricStore";

const BASELINE = 72;
const pad = { top: 12, right: 12, bottom: 22, left: 32 };

export default function BiometricAreaChart() {
  const { telemetryStream } = useBiometricStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex]   = useState<number | null>(null);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions]   = useState({ width: 500, height: 180 });

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDimensions({ width: e.contentRect.width || 500, height: e.contentRect.height || 180 });
      }
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  const points = React.useMemo(() => {
    if (telemetryStream.length >= 8) return telemetryStream;
    const mock: TelemetryData[] = [];
    const now = 1782054000000; // Deterministic timestamp for render purity
    for (let i = 24; i >= 0; i--) {
      mock.push({
        timestamp: new Date(now - i * 60000).toISOString(),
        heart_rate:       Math.round(70 + Math.sin(i * 0.4) * 8 + (i % 3 === 0 ? 4 : -2)),
        blood_oxygen:     98.5 + (i % 5 === 0 ? -0.4 : 0.2),
        core_temperature: 36.8,
        glucose_level:    102,
        stress_index:     35 + Math.cos(i * 0.3) * 15,
      });
    }
    return mock;
  }, [telemetryStream]);

  const gW    = dimensions.width  - pad.left - pad.right;
  const gH    = dimensions.height - pad.top  - pad.bottom;
  const maxV  = 140, minV = 50;

  const coord = React.useCallback((index: number, value: number) => ({
    x: pad.left + (index / Math.max(points.length - 1, 1)) * gW,
    y: pad.top  + gH - ((value - minV) / (maxV - minV)) * gH,
  }), [points.length, gW, gH]);

  const linePath = React.useMemo(() =>
    points.map((p, i) => { const { x, y } = coord(i, p.heart_rate); return `${i === 0 ? "M" : "L"} ${x} ${y}`; }).join(" "),
  [points, coord]);

  const areaPath = React.useMemo(() => {
    if (!linePath) return "";
    const f = coord(0, minV);
    const l = coord(points.length - 1, minV);
    return `${linePath} L ${l.x} ${l.y} L ${f.x} ${f.y} Z`;
  }, [linePath, coord, points.length]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mX   = e.clientX - rect.left;
    let best = 0, minD = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(coord(i, p.heart_rate).x - mX);
      if (d < minD) { minD = d; best = i; }
    });
    const c = coord(best, points[best].heart_rate);
    setHoverIndex(best);
    setCrosshairPos(c);
  };

  const selected = hoverIndex !== null ? points[hoverIndex] : null;
  const delta    = selected ? selected.heart_rate - BASELINE : 0;
  const fmtTime  = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent-mint)" }} />
          <span>Heart Rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--border-default)" }} />
          <span>Baseline ({BASELINE} bpm)</span>
        </div>
      </div>

      {/* Chart area */}
      <div
        className="w-full relative rounded-xl"
        style={{ height: "176px", background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent-mint)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent-mint)" stopOpacity="0"   />
            </linearGradient>
          </defs>

          {/* Y-axis gridlines */}
          {[60, 80, 100, 120].map((val) => {
            const c = coord(0, val);
            return (
              <g key={val}>
                <line
                  x1={pad.left} y1={c.y}
                  x2={dimensions.width - pad.right} y2={c.y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="3 5"
                />
                <text x={pad.left - 6} y={c.y + 3.5} textAnchor="end"
                  fill="rgba(255,255,255,0.25)" fontSize="9"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Baseline dashed */}
          {points.length > 0 && (
            <line
              x1={pad.left} y1={coord(0, BASELINE).y}
              x2={dimensions.width - pad.right} y2={coord(0, BASELINE).y}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
            />
          )}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* Line */}
          {linePath && (
            <path d={linePath} fill="transparent" stroke="var(--accent-mint)" strokeWidth="1.5" />
          )}

          {/* Crosshair + dot */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={crosshairPos.x} y1={pad.top}
                x2={crosshairPos.x} y2={dimensions.height - pad.bottom}
                stroke="rgba(255,255,255,0.12)" strokeDasharray="2 2"
              />
              <line
                x1={pad.left} y1={crosshairPos.y}
                x2={dimensions.width - pad.right} y2={crosshairPos.y}
                stroke="rgba(255,255,255,0.12)" strokeDasharray="2 2"
              />
              <circle
                cx={crosshairPos.x} cy={crosshairPos.y}
                r="4" fill="var(--accent-mint)"
                stroke="var(--bg-inset)" strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoverIndex !== null && selected && (
          <div
            className="absolute pointer-events-none z-20 rounded-lg px-2.5 py-2"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              left: `${Math.min(dimensions.width - 120, Math.max(pad.left, crosshairPos.x - 55))}px`,
              top:  `${Math.max(pad.top, crosshairPos.y - 52)}px`,
            }}
          >
            <p className="text-[10px] mb-0.5" style={{ color: "var(--text-tertiary)" }}>{fmtTime(selected.timestamp)}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{selected.heart_rate} bpm</p>
            <p className="text-[10px]" style={{ color: delta >= 0 ? "var(--accent-amber)" : "var(--accent-mint)" }}>
              {delta >= 0 ? "+" : ""}{delta} vs baseline
            </p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px]" style={{ color: "var(--text-tertiary)" }}>
        <span>−24 min</span>
        <span>−12 min</span>
        <span>Now</span>
      </div>
    </div>
  );
}
