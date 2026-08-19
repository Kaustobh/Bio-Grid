"use client";

import React, { useEffect } from "react";
import { useBiometricStore } from "@/store/useBiometricStore";
import { Sun, Moon } from "lucide-react";

export default function CircadianFlow() {
  const { circadianScrubTime, setCircadianScrubTime } = useBiometricStore();

  /* ── Circadian background tint (subtle) ── */
  useEffect(() => {
    const root = document.documentElement;
    const isNight     = circadianScrubTime >= 21 || circadianScrubTime < 5;
    const isTwilight  = (circadianScrubTime >= 18 && circadianScrubTime < 21) ||
                        (circadianScrubTime >= 5  && circadianScrubTime < 7);

    if (isNight) {
      root.style.setProperty("--bg-base", "#0b0e16");
    } else if (isTwilight) {
      root.style.setProperty("--bg-base", "#0e1119");
    } else {
      root.style.setProperty("--bg-base", "#0f1117");
    }
  }, [circadianScrubTime]);

  /* ── Wave paths ── */
  const w = 600, h = 90;

  const getSplinePath = (type: "cortisol" | "melatonin") => {
    const pts: string[] = [];
    for (let hour = 0; hour <= 24; hour++) {
      const x = (hour / 24) * w;
      let y = h / 2;
      if (type === "cortisol") {
        const diff = hour - 8;
        y = h - 15 - Math.exp(-(diff * diff) / 16) * 50;
      } else {
        const diff = hour < 4 ? hour + 1 : hour - 23;
        y = h - 15 - Math.exp(-(diff * diff) / 20) * 55;
      }
      pts.push(`${hour === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return pts.join(" ");
  };

  const cortisolPath  = React.useMemo(() => getSplinePath("cortisol"),  []);
  const melatoninPath = React.useMemo(() => getSplinePath("melatonin"), []);

  /* ── Phase labels (plain language) ── */
  const getPhase = (hour: number) => {
    if (hour >= 5  && hour < 8)  return { name: "Dawn — Wake Cycle",           desc: "Cortisol rising. Good time for light exercise.", color: "var(--accent-amber)" };
    if (hour >= 8  && hour < 17) return { name: "Daytime — Peak Performance",  desc: "Optimal focus and cognitive output window.",     color: "var(--accent-mint)" };
    if (hour >= 17 && hour < 21) return { name: "Evening — Wind Down",         desc: "Melatonin preparing. Reduce screen brightness.", color: "var(--accent-violet)" };
    return { name: "Night — Deep Recovery",   desc: "Melatonin dominant. Prioritize sleep quality.",  color: "var(--accent-blue)" };
  };

  const phase = getPhase(circadianScrubTime);

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Wave chart */}
      <div
        className="w-full h-28 rounded-xl relative overflow-hidden"
        style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Phase column tints */}
        <div className="absolute inset-0 grid h-full pointer-events-none" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
          {Array.from({ length: 24 }).map((_, hour) => {
            let bg = "transparent";
            if (hour >= 5  && hour < 8)  bg = "rgba(251,191,36,0.04)";
            if (hour >= 8  && hour < 17) bg = "rgba(74,222,128,0.03)";
            if (hour >= 17 && hour < 21) bg = "rgba(167,139,250,0.04)";
            if (hour >= 21 || hour < 5)  bg = "rgba(96,165,250,0.03)";
            return <div key={hour} className="h-full border-r" style={{ background: bg, borderColor: "rgba(255,255,255,0.01)" }} />;
          })}
        </div>

        <svg viewBox="0 0 600 90" className="w-full h-full absolute top-0 left-0">
          {/* Cortisol — mint */}
          <path d={cortisolPath} fill="transparent" stroke="var(--accent-mint)" strokeWidth="1.5" />
          {/* Melatonin — blue */}
          <path d={melatoninPath} fill="transparent" stroke="var(--accent-blue)" strokeWidth="1.5" />
          {/* Scrubber */}
          <line
            x1={(circadianScrubTime / 24) * w}
            y1="0"
            x2={(circadianScrubTime / 24) * w}
            y2={h}
            stroke="var(--text-primary)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs" style={{ color: "var(--text-secondary)" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent-mint)" }} />
          <span>Cortisol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent-blue)" }} />
          <span>Melatonin</span>
        </div>
      </div>

      {/* Scrubber */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>Drag to explore time of day</span>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
          >
            {circadianScrubTime >= 21 || circadianScrubTime < 5
              ? <Moon size={11} style={{ color: "var(--accent-blue)" }} />
              : <Sun size={11} style={{ color: "var(--accent-amber)" }} />
            }
            <span>{circadianScrubTime.toString().padStart(2, "0")}:00</span>
          </div>
        </div>

        <input
          type="range"
          min="0" max="23" step="1"
          value={circadianScrubTime}
          onChange={(e) => setCircadianScrubTime(parseInt(e.target.value))}
          className="w-full"
        />

        <div className="flex justify-between text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          <span>Midnight</span>
          <span>6 AM</span>
          <span>Noon</span>
          <span>6 PM</span>
          <span>Midnight</span>
        </div>
      </div>

      {/* Phase callout */}
      <div
        className="rounded-xl p-3 flex flex-col gap-1"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <span className="text-xs font-semibold" style={{ color: phase.color }}>{phase.name}</span>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{phase.desc}</span>
      </div>
    </div>
  );
}
