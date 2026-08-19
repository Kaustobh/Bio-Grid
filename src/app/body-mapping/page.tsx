"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBiometricStore } from "@/store/useBiometricStore";
import DetailedAnatomyGrid, { ANATOMICAL_ORGANS } from "@/components/DetailedAnatomyGrid";
import { ArrowLeft, Sliders, Info, X } from "lucide-react";
import Link from "next/link";

type AnatomySystem = "all" | "cardiovascular" | "nervous" | "digestive" | "lymphatic";

export default function BodyMapping() {
  const { selectedAnomalyNode, setSelectedAnomalyNode } = useBiometricStore();
  const [activeSystem, setActiveSystem] = useState<AnatomySystem>("all");
  const [activeTab, setActiveTab]       = useState<"simulation" | "dissector">("simulation");

  const [sympatheticTone, setSympatheticTone] = useState(25);
  const [hydrationLevel,  setHydrationLevel]  = useState(80);
  const [toxinLoad,       setToxinLoad]       = useState(15);

  useEffect(() => {
    if (selectedAnomalyNode) {
      const t = setTimeout(() => setActiveTab("dissector"), 0);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setActiveTab("simulation"), 0);
      return () => clearTimeout(t);
    }
  }, [selectedAnomalyNode]);

  const simulatedVitals = React.useMemo(() => ({
    hr:        Math.round(65 + sympatheticTone * 0.75 + (100 - hydrationLevel) * 0.2),
    sbp:       Math.round(115 + sympatheticTone * 0.65 + toxinLoad * 0.15),
    dbp:       Math.round(75  + sympatheticTone * 0.35 + toxinLoad * 0.1),
    rr:        Math.round(12  + sympatheticTone * 0.18),
    temp:      (36.5 + sympatheticTone * 0.012 + toxinLoad * 0.008).toFixed(1),
    gfr:       Math.round(45  + hydrationLevel * 0.65 - toxinLoad * 0.15),
    gastricpH: (2.2  - sympatheticTone * 0.008 + (100 - hydrationLevel) * 0.004).toFixed(2),
    lymphFlow: Math.round(90  + toxinLoad * 1.8 + sympatheticTone * 0.4),
  }), [sympatheticTone, hydrationLevel, toxinLoad]);

  const simulatedStrains = React.useMemo(() => ({
    brain:          Math.min(100, sympatheticTone * 0.8  + toxinLoad * 0.3),
    heart:          Math.min(100, sympatheticTone * 0.95 + (100 - hydrationLevel) * 0.2),
    lungs:          Math.min(100, sympatheticTone * 0.7  + Math.max(0, simulatedVitals.sbp - 120) * 0.4),
    liver:          Math.min(100, toxinLoad * 0.9        + sympatheticTone * 0.1),
    kidneys:        Math.min(100, (100 - hydrationLevel) * 0.8 + toxinLoad * 0.4),
    stomach:        Math.min(100, sympatheticTone * 0.85 + (100 - hydrationLevel) * 0.2),
    "lymph-cervical": Math.min(100, toxinLoad * 0.7 + 10),
    "lymph-axillary": Math.min(100, toxinLoad * 0.6 + 8),
    "lymph-inguinal": Math.min(100, toxinLoad * 0.8 + 6),
  }), [sympatheticTone, hydrationLevel, toxinLoad, simulatedVitals]);

  const [dispatching, setDispatching] = useState<string | null>(null);
  const handleDispatch = (type: string) => {
    setDispatching(type);
    setTimeout(() => {
      setDispatching(null);
      if (type === "hydration") setHydrationLevel((p) => Math.min(100, p + 25));
      else if (type === "beta")  setSympatheticTone((p) => Math.max(10, p - 30));
      else if (type === "detox") setToxinLoad((p) => Math.max(5, p - 25));
    }, 1500);
  };

  const selectedNodeInfo = ANATOMICAL_ORGANS.find((n) => n.id === selectedAnomalyNode);

  const systemFilters: { id: AnatomySystem; label: string }[] = [
    { id: "all",            label: "All Systems" },
    { id: "cardiovascular", label: "Cardiovascular" },
    { id: "nervous",        label: "Nervous" },
    { id: "digestive",      label: "Digestive" },
    { id: "lymphatic",      label: "Lymphatic" },
  ];

  const sliders = [
    { label: "Sympathetic Tone",  val: sympatheticTone, set: setSympatheticTone, warn: sympatheticTone > 80 },
    { label: "Hydration Index",   val: hydrationLevel,  set: setHydrationLevel,  warn: hydrationLevel < 35 },
    { label: "Metabolic Toxin Load", val: toxinLoad,    set: setToxinLoad,       warn: toxinLoad > 80 },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="p-6 pb-28 flex-1 flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Body Mapping</h1>
          <p className="text-base font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>Physiology simulation & organ dissector</p>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold transition-smooth hover:text-white" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">

        {/* Left: 3D model + system filter */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-[400px] md:h-[500px] lg:h-[640px]">
          <div className="flex-1 cyber-card flex flex-col overflow-hidden relative">
            {/* Canvas header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0 z-10"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Somatic Map</h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Vitals telemetry stable</span>
            </div>

            {/* 3D viewport */}
            <div className="flex-1 w-full relative z-0">
              <DetailedAnatomyGrid activeSystem={activeSystem} simulatedStrains={simulatedStrains} simulatedVitals={simulatedVitals} />
            </div>

            {/* System filter dock */}
            <div
              className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 justify-center p-2 rounded-xl"
              style={{ background: "rgba(15,17,23,0.92)", border: "1px solid var(--border-default)" }}
            >
              {systemFilters.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveSystem(id); setSelectedAnomalyNode(null); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth"
                  style={{
                    background:  activeSystem === id ? "var(--bg-elevated)"  : "transparent",
                    color:       activeSystem === id ? "var(--text-primary)"  : "var(--text-tertiary)",
                    border:      activeSystem === id ? "1px solid var(--border-default)" : "1px solid transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: tabbed side panel */}
        <div className="lg:col-span-4 cyber-card flex flex-col h-auto lg:h-[640px] overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
            {(["simulation", "dissector"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab === "simulation") setSelectedAnomalyNode(null); }}
                className="flex-1 py-3 text-xs font-bold transition-smooth border-b-2"
                style={{
                  borderBottomColor: activeTab === tab ? "var(--accent-mint)" : "transparent",
                  color:             activeTab === tab ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {tab === "simulation" ? "Simulation" : `Dissector${selectedAnomalyNode ? ` [${selectedAnomalyNode}]` : ""}`}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-5 overflow-y-auto no-scrollbar flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeTab === "simulation" ? (
                <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} className="flex flex-col gap-5 flex-1 justify-between"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
                      <Sliders size={13} style={{ color: "var(--accent-blue)" }} />
                      <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Physiological Parameters</span>
                    </div>

                    {sliders.map(({ label, val, set, warn }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                          <span className="font-bold" style={{ color: warn ? "var(--accent-amber)" : "var(--text-primary)" }}>
                            {val}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) => (set as (v: number) => void)(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Simulated vitals grid (Elaborate animated KPIs) */}
                  <div className="grid grid-cols-3 gap-2.5 text-center my-3">
                    {/* Heart Rate Card */}
                    <div className="p-3 rounded-xl flex flex-col items-center justify-between min-h-[105px] relative overflow-hidden bg-black/40 border border-white/10">
                      <p className="text-xs uppercase tracking-wider font-mono font-bold text-tertiary">Heart Rate</p>
                      <div className="w-full h-8 flex items-center justify-center my-1">
                        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full">
                          <path d="M 0 12 L 30 12 L 33 6 L 36 18 L 39 12 L 60 12 L 63 6 L 66 18 L 69 12 L 100 12"
                                fill="transparent" stroke="var(--accent-red)" strokeWidth="2" className="animate-ecg"
                                style={{ animationDuration: `${60 / simulatedVitals.hr}s` }} />
                        </svg>
                      </div>
                      <p className="text-xs font-bold animate-pulse" style={{ color: simulatedVitals.hr > 100 ? "var(--accent-amber)" : "var(--text-primary)" }}>{simulatedVitals.hr} bpm</p>
                    </div>

                    {/* Blood Pressure Card */}
                    <div className="p-3 rounded-xl flex flex-col items-center justify-between min-h-[105px] relative overflow-hidden bg-black/40 border border-white/10">
                      <p className="text-xs uppercase tracking-wider font-mono font-bold text-tertiary">Pressure</p>
                      <div className="w-full h-8 flex items-end gap-[3px] justify-center my-1">
                        <div className="w-1.5 bg-accent-blue rounded-t" style={{ height: "65%", boxShadow: "0 0 4px var(--accent-blue)" }} />
                        <div className="w-1.5 bg-accent-blue rounded-t animate-pulse" style={{ height: "85%", boxShadow: "0 0 4px var(--accent-blue)", animationDuration: "1.2s" }} />
                        <div className="w-1.5 bg-accent-blue rounded-t" style={{ height: "50%", boxShadow: "0 0 4px var(--accent-blue)" }} />
                      </div>
                      <p className="text-xs font-bold text-primary">{simulatedVitals.sbp}/{simulatedVitals.dbp}</p>
                    </div>

                    {/* Renal GFR Card */}
                    <div className="p-3 rounded-xl flex flex-col items-center justify-between min-h-[105px] relative overflow-hidden bg-black/40 border border-white/10">
                      <p className="text-xs uppercase tracking-wider font-mono font-bold text-tertiary">Renal GFR</p>
                      <div className="w-full h-8 flex flex-col justify-center gap-1 my-1 px-1">
                        <div className="h-3 w-full rounded bg-white/10 border border-white/20 relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-red-500/20 w-1/3" />
                          <div className="absolute inset-y-0 left-1/3 bg-yellow-500/20 w-1/3" />
                          <div className="absolute inset-y-0 left-2/3 bg-green-500/20 w-1/3" />
                          <div className="h-full bg-accent-mint transition-all duration-500" 
                               style={{ 
                                 width: `${Math.min(100, (simulatedVitals.gfr / 120) * 100)}%`, 
                                 boxShadow: "0 0 5px var(--accent-mint)" 
                               }} />
                        </div>
                      </div>
                      <p className="text-xs font-bold text-primary">{simulatedVitals.gfr} GFR</p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-tertiary">
                    Click a node in the 3D view to inspect organ details.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="dissect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} className="flex flex-col gap-4 flex-1 justify-between"
                >
                  {selectedNodeInfo ? (
                    <>
                      <div className="flex flex-col gap-4">
                        {/* Node header */}
                        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: selectedNodeInfo.color }} />
                            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selectedNodeInfo.name}</span>
                          </div>
                          <button onClick={() => setSelectedAnomalyNode(null)} style={{ color: "var(--text-tertiary)" }} className="transition-smooth hover:opacity-70">
                            <X size={14} />
                          </button>
                        </div>

                        {/* Strain bar */}
                        <div>
                          <div className="flex justify-between mb-1.5 text-xs">
                            <span style={{ color: "var(--text-secondary)" }}>Current Strain</span>
                            <span className="font-semibold" style={{
                              color: (simulatedStrains[selectedNodeInfo.id as keyof typeof simulatedStrains] ?? 0) > 80
                                ? "var(--accent-red)" : "var(--text-primary)"
                            }}>
                              {(simulatedStrains[selectedNodeInfo.id as keyof typeof simulatedStrains] ?? 0).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: "6px", background: "var(--bg-elevated)" }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{
                              width: `${simulatedStrains[selectedNodeInfo.id as keyof typeof simulatedStrains] ?? 0}%`,
                              background: (simulatedStrains[selectedNodeInfo.id as keyof typeof simulatedStrains] ?? 0) > 80
                                ? "var(--accent-red)" : "var(--accent-mint)",
                            }} />
                          </div>
                        </div>

                        {/* Details */}
                        <p className="text-xs leading-relaxed p-3 rounded-xl"
                          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                          {selectedNodeInfo.details}
                        </p>

                        {/* Organ-specific metrics */}
                        <div className="flex flex-col gap-2 text-xs">
                          {selectedNodeInfo.id === "heart" && <>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Stroke Output</span><span style={{ color: "var(--text-primary)" }}>{(simulatedVitals.hr * 0.07).toFixed(1)} L/min</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Rhythm</span><span style={{ color: "var(--text-primary)" }}>Sinus stable</span></div>
                          </>}
                          {selectedNodeInfo.id === "lungs" && <>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Resp. Rate</span><span style={{ color: "var(--text-primary)" }}>{simulatedVitals.rr} br/min</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Alveolar Ventilation</span><span style={{ color: "var(--text-primary)" }}>{(simulatedVitals.rr * 350).toFixed(0)} ml/min</span></div>
                          </>}
                          {selectedNodeInfo.id === "kidneys" && <>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>GFR</span><span style={{ color: "var(--text-primary)" }}>{simulatedVitals.gfr} ml/min</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Electrolyte Balance</span><span style={{ color: "var(--text-primary)" }}>{(simulatedVitals.gfr * 0.9).toFixed(0)}%</span></div>
                          </>}
                          {selectedNodeInfo.id === "liver" && <>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Detox Index</span><span style={{ color: "var(--text-primary)" }}>{(100 - toxinLoad * 0.75).toFixed(0)}%</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>ALT/AST</span><span style={{ color: "var(--text-primary)" }}>{Math.round(20 + toxinLoad * 0.6)} U/L</span></div>
                          </>}
                          {selectedNodeInfo.id === "brain" && <>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>Neural Freq.</span><span style={{ color: "var(--text-primary)" }}>{(12 + sympatheticTone * 0.1).toFixed(1)} Hz</span></div>
                            <div className="flex justify-between"><span style={{ color: "var(--text-tertiary)" }}>CNS Stress</span><span style={{ color: "var(--text-primary)" }}>{simulatedStrains.brain.toFixed(0)}%</span></div>
                          </>}
                        </div>
                      </div>

                      {/* Intervention */}
                      <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                        {selectedNodeInfo.id === "heart" && (
                          <button onClick={() => handleDispatch("beta")} disabled={!!dispatching} className="btn-secondary w-full text-sm font-bold py-2" style={{ color: "var(--accent-amber)" }}>
                            {dispatching === "beta" ? "Applying Beta Blockers…" : "Apply Beta Blockers"}
                          </button>
                        )}
                        {selectedNodeInfo.id === "kidneys" && (
                          <button onClick={() => handleDispatch("hydration")} disabled={!!dispatching} className="btn-secondary w-full text-sm font-bold py-2" style={{ color: "var(--accent-blue)" }}>
                            {dispatching === "hydration" ? "Infusing saline…" : "Infuse IV Hydration"}
                          </button>
                        )}
                        {selectedNodeInfo.id === "liver" && (
                          <button onClick={() => handleDispatch("detox")} disabled={!!dispatching} className="btn-secondary w-full text-sm font-bold py-2" style={{ color: "var(--accent-violet)" }}>
                            {dispatching === "detox" ? "Clearing metabolic load…" : "Hepatic Detox Protocol"}
                          </button>
                        )}
                        {!["heart", "kidneys", "liver"].includes(selectedNodeInfo.id) && (
                          <p className="text-center text-xs font-semibold p-2.5 rounded-xl" style={{ background: "var(--bg-elevated)", color: "var(--text-tertiary)" }}>
                            Metrics stable — no intervention needed.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
                        <Info size={16} style={{ color: "var(--text-tertiary)" }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>No Organ Selected</h4>
                        <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                          Click a node on the 3D model to inspect metrics and apply interventions.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
