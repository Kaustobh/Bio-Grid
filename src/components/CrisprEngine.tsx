"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBiometricStore } from "@/store/useBiometricStore";
import { Dna } from "lucide-react";

interface GeneInfo {
  id: string;
  name: string;
  baseline: string;
  description: string;
  healthyDelta: number;
  helixSection: number;
}

const GENES: GeneInfo[] = [
  { id: "apoe4", name: "APOE4", baseline: "Active",    description: "Apolipoprotein E variant. Silencing expression reduces neurodegenerative risk.", healthyDelta: 4.8, helixSection: 20 },
  { id: "foxo3", name: "FOXO3", baseline: "Suppressed",description: "Longevity gene. Activating enhances cellular repair and stress resistance.",       healthyDelta: 6.2, helixSection: 45 },
  { id: "sirt1", name: "SIRT1", baseline: "Standard",  description: "Aging regulator. Up-regulation promotes mitochondrial efficiency and DNA stability.", healthyDelta: 3.5, helixSection: 70 },
  { id: "brca1", name: "BRCA1", baseline: "Deficient", description: "Tumor suppressor. Repairing mutations restores genome-wide cancer resistance.",       healthyDelta: 5.1, helixSection: 90 },
];

const API_BASE = "http://localhost:8000";

export default function CrisprEngine() {
  const { user } = useBiometricStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [switches, setSwitches] = useState<Record<string, boolean>>({ apoe4: false, foxo3: false, sirt1: false, brca1: false });
  const [activeGene, setActiveGene]       = useState("apoe4");
  const [healthspanDelta, setHealthspanDelta] = useState(0);

  /* ── Fetch genetics ── */
  useEffect(() => {
    if (!user) return;
    const fetchGenetics = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/users/${user.id}/genetic`);
        if (res.ok) {
          const d = await res.json();
          setSwitches({ apoe4: d.apoe4, foxo3: d.foxo3, sirt1: d.sirt1, brca1: d.brca1 });
        }
      } catch { /* silent */ }
    };
    fetchGenetics();
  }, [user]);

  /* ── Healthspan spring target delta calculation ── */
  const targetDelta = React.useMemo(() => {
    let sum = 0;
    GENES.forEach((g) => { if (switches[g.id]) sum += g.healthyDelta; });
    return sum;
  }, [switches]);

  useEffect(() => {
    let id: number;
    let val = healthspanDelta;
    const tick = () => {
      const diff = targetDelta - val;
      if (Math.abs(diff) > 0.01) {
        val += diff * 0.15;
        setHealthspanDelta(val);
        id = requestAnimationFrame(tick);
      } else {
        setHealthspanDelta(targetDelta);
      }
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [targetDelta, healthspanDelta]);

  /* ── Toggle ── */
  const handleToggle = async (geneId: string) => {
    const next = !switches[geneId];
    setSwitches((prev) => ({ ...prev, [geneId]: next }));
    if (user) {
      try {
        await fetch(`${API_BASE}/v1/users/${user.id}/genetic`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [geneId]: next }),
        });
      } catch { /* silent */ }
    }
  };

  /* ── Canvas helix (calm colors) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      const cY = H / 2, amp = 28, n = 22, step = W / n;
      const currentGene = GENES.find((g) => g.id === activeGene);
      const focusX = ((currentGene?.helixSection ?? 50) / 100) * W;

      // Subtle grid line
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cY); ctx.lineTo(W, cY); ctx.stroke();

      // Focus scan box (calm blue, no neon glow)
      ctx.strokeStyle = "rgba(96,165,250,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(focusX - 24, cY - 42, 48, 84);

      for (let i = 0; i < n; i++) {
        const x = i * step;
        const theta = (x / W) * Math.PI * 4 + phase;
        const y1 = cY + Math.sin(theta) * amp;
        const y2 = cY + Math.sin(theta + Math.PI) * amp;
        const focused = Math.abs(x - focusX) < 28;

        // Base pair
        ctx.strokeStyle = focused ? "rgba(74,222,128,0.4)" : "rgba(148,163,184,0.12)";
        ctx.lineWidth   = focused ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();

        // Strand A — mint
        ctx.fillStyle = focused ? "var(--accent-mint)" : "rgba(74,222,128,0.35)";
        ctx.beginPath(); ctx.arc(x, y1, focused ? 5 : 3, 0, Math.PI * 2); ctx.fill();

        // Strand B — blue
        ctx.fillStyle = focused ? "var(--accent-blue)" : "rgba(96,165,250,0.35)";
        ctx.beginPath(); ctx.arc(x, y2, focused ? 5 : 3, 0, Math.PI * 2); ctx.fill();
      }

      phase += 0.035;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeGene]);

  return (
    <div className="cyber-card p-5 flex flex-col gap-4 min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <Dna size={15} style={{ color: "var(--accent-violet)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Gene Expression Panel</h3>
        </div>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Epigenetic simulator</span>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch flex-1">

        {/* Left: Gene switches */}
        <div className="md:col-span-5 flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
          {GENES.map((gene) => {
            const isActive  = activeGene === gene.id;
            const isEnabled = switches[gene.id];
            return (
              <div
                key={gene.id}
                onMouseEnter={() => setActiveGene(gene.id)}
                className="p-3 rounded-xl cursor-pointer transition-smooth"
                style={{
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(74,222,128,0.15)" : "var(--border-subtle)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{gene.name}</span>

                  {/* iOS-style toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggle(gene.id); }}
                    className="w-9 h-5 rounded-full relative transition-smooth shrink-0"
                    style={{ background: isEnabled ? "var(--accent-mint)" : "var(--bg-elevated)", border: "none" }}
                    aria-label={`Toggle ${gene.name}`}
                  >
                    <span
                      className="w-4 h-4 rounded-full absolute top-0.5 transition-all duration-200"
                      style={{
                        left: isEnabled ? "calc(100% - 18px)" : "2px",
                        background: "white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                  </button>
                </div>

                {isActive && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{gene.description}</p>
                    <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <span>Baseline: {gene.baseline}</span>
                      <span style={{ color: "var(--accent-mint)" }}>+{gene.healthyDelta} yr healthspan</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Helix canvas + healthspan delta */}
        <div
          className="md:col-span-7 flex flex-col justify-between md:pl-4 pl-0 md:border-l border-t md:border-t-0 pt-4 md:pt-0 min-h-[220px]"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="relative w-full h-[120px] rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}
          >
            <canvas ref={canvasRef} width="360" height="110" className="w-full h-full" />
          </div>

          {/* Healthspan output */}
          <div
            className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Projected healthspan</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Based on active switches</p>
            </div>
            <div className="flex items-baseline gap-1" style={{ color: "var(--accent-mint)" }}>
              <span className="text-2xl font-bold">+{healthspanDelta.toFixed(1)}</span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>years</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
