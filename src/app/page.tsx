"use client";

import React, { useState, useRef } from "react";
import { useBiometricStore } from "@/store/useBiometricStore";
import BiometricRing from "@/components/BiometricRing";
import BiometricAreaChart from "@/components/BiometricAreaChart";
import OrganMatrix from "@/components/OrganMatrix";
import CircadianFlow from "@/components/CircadianFlow";
import PharmacokineticsDeck from "@/components/PharmacokineticsDeck";
import CrisprEngine from "@/components/CrisprEngine";
import AiTerminal from "@/components/AiTerminal";
import { Activity, Heart, Thermometer, Wind, RefreshCw, AlertTriangle, X, Droplet, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden:  { opacity: 0, y: 14, scale: 0.99 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

export default function Dashboard() {
  const { latestTelemetry, telemetryStream, alerts, clearAlerts } = useBiometricStore();
  const [calibrating, setCalibrating] = useState(false);
  const [ecgTab, setEcgTab]           = useState<"ecg" | "circadian">("circadian");

  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hr      = latestTelemetry?.heart_rate      ?? 76;
  const o2      = latestTelemetry?.blood_oxygen     ?? 98.4;
  const temp    = latestTelemetry?.core_temperature ?? 36.88;
  const stress  = latestTelemetry?.stress_index     ?? 82.1;
  const glucose = latestTelemetry?.glucose_level   ?? 100;
  const toxic   = latestTelemetry?.toxic_load      ?? 12.4;

  const handleCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => setCalibrating(false), 2000);
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour12: false }); }
    catch { return "00:00:00"; }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardWidth = container.clientWidth / (container.clientWidth > 1024 ? 3 : container.clientWidth > 640 ? 2 : 1);
      container.scrollBy({ left: -cardWidth, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardWidth = container.clientWidth / (container.clientWidth > 1024 ? 3 : container.clientWidth > 640 ? 2 : 1);
      container.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const activeIdx = Math.round(scrollLeft / (scrollWidth / 6));
    setActiveDot(Math.min(5, Math.max(0, activeIdx)));
  };

  return (
    <div className="p-6 pb-28 flex-1 flex flex-col gap-6">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="text-base font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>Real-time health monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="btn-secondary flex items-center gap-1.5 text-sm px-3.5 py-2 font-bold"
              style={{ color: "var(--accent-amber)", borderColor: "rgba(251,191,36,0.3)" }}
            >
              <X size={13} />
              <span>Clear {alerts.length} alert{alerts.length > 1 ? "s" : ""}</span>
            </button>
          )}
          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="btn-secondary flex items-center gap-1.5 text-sm px-3.5 py-2 font-bold"
          >
            <RefreshCw size={13} className={calibrating ? "animate-spin" : ""} />
            <span>{calibrating ? "Calibrating…" : "Calibrate"}</span>
          </button>
        </div>
      </motion.div>

      {/* ── Summary Metrics Strip (Slideable Carousel) ── */}
      <div className="relative w-full group">
        {/* Navigation Arrows */}
        <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-20 pointer-events-none md:block hidden">
          <button
            type="button"
            onClick={scrollLeft}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black/85 border border-white/20 text-white pointer-events-auto hover:bg-black hover:border-white/45 transition-smooth shadow-xl active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20 pointer-events-none md:block hidden">
          <button
            type="button"
            onClick={scrollRight}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black/85 border border-white/20 text-white pointer-events-auto hover:bg-black hover:border-white/45 transition-smooth shadow-xl active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Swipeable track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-1 -mx-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {[
            {
              label: "Heart Rate",
              value: hr,
              unit: "bpm",
              icon: Heart,
              color: "var(--accent-red)",
              warn: hr > 100 || hr < 50,
              subLabel: "HRV (SDNN)",
              subVal: "54 ms",
              status: "Resting Zone",
              desc: "Normal Sinus Rhythm",
              visual: (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                  <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-[60px]">
                    {/* Grid lines for clinical look */}
                    <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(239,68,68,0.25)" strokeDasharray="2 4" />
                    <line x1="50" y1="0" x2="50" y2="60" stroke="rgba(239,68,68,0.25)" strokeDasharray="2 4" />
                    <line x1="100" y1="0" x2="100" y2="60" stroke="rgba(239,68,68,0.25)" strokeDasharray="2 4" />
                    <line x1="150" y1="0" x2="150" y2="60" stroke="rgba(239,68,68,0.25)" strokeDasharray="2 4" />
                    
                    <path d="M 0 30 L 50 30 L 55 15 L 60 45 L 65 30 L 100 30 L 105 15 L 110 45 L 115 30 L 150 30 L 155 15 L 160 45 L 165 30 L 200 30"
                          fill="transparent" stroke="var(--accent-red)" strokeWidth="2.5" className="animate-ecg"
                          style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.9))" }} />
                  </svg>
                  <div className="absolute right-3 top-3 w-3 h-3 rounded-full bg-accent-red animate-pulse-ring animate-pulse" style={{ boxShadow: "0 0 8px var(--accent-red)" }} />
                </div>
              ),
            },
            {
              label: "SpO₂",
              value: o2,
              unit: "%",
              icon: Wind,
              color: "var(--accent-mint)",
              warn: o2 < 95,
              subLabel: "Perfusion Index",
              subVal: "4.8%",
              status: "Optimal Saturation",
              desc: "Oxygenation stable",
              visual: (
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                  <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-[200%] h-full animate-wave">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(74,222,128,0.15)" strokeDasharray="2 4" />
                    <line x1="50" y1="0" x2="50" y2="40" stroke="rgba(74,222,128,0.15)" strokeDasharray="2 4" />
                    <line x1="150" y1="0" x2="150" y2="40" stroke="rgba(74,222,128,0.15)" strokeDasharray="2 4" />
                    
                    <path d="M 0 20 Q 25 32 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20 T 400 20 L 400 40 L 0 40 Z" 
                          fill="rgba(74,222,128,0.22)" stroke="var(--accent-mint)" strokeWidth="2.5"
                          style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.8))" }} />
                  </svg>
                </div>
              ),
            },
            {
              label: "Temperature",
              value: temp,
              unit: "°C",
              icon: Thermometer,
              color: "var(--accent-amber)",
              warn: temp > 37.5 || temp < 36.0,
              subLabel: "Skin Temp",
              subVal: "34.2 °C",
              status: "Normothermia",
              desc: "Thermal homeostasis",
              visual: (
                <div className="w-full h-full flex flex-col justify-center px-4 gap-2">
                  <div className="flex justify-between text-[12px] font-mono text-tertiary">
                    <span>Hypo</span>
                    <span>Norm</span>
                    <span>Fever</span>
                  </div>
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--accent-amber)" }}>35°C</span>
                    <div className="flex-1 h-3 rounded-full bg-white/10 border border-white/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-400 to-red-500 opacity-25" />
                      <div className="h-full rounded-full transition-all duration-500 ease-out" 
                           style={{ 
                             width: `${Math.min(100, Math.max(0, ((temp - 35) / 5) * 100))}%`, 
                             background: temp > 37.5 ? "var(--accent-red)" : temp < 36.0 ? "var(--accent-blue)" : "var(--accent-amber)",
                             boxShadow: "0 0 8px currentColor"
                           }} />
                    </div>
                    <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--accent-amber)" }}>40°C</span>
                  </div>
                </div>
              ),
            },
            {
              label: "Stress Index",
              value: stress,
              unit: "idx",
              icon: Activity,
              color: "var(--accent-blue)",
              warn: stress > 70,
              subLabel: "Autonomic Bal",
              subVal: "LF/HF 1.2",
              status: "Low ANS Load",
              desc: "Balanced parasympathetic",
              visual: (
                <div className="w-full h-full flex items-center justify-center px-4">
                  <div className="w-full flex gap-1.5 justify-between">
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const isActive = (stress / 8.3) >= idx;
                      return (
                        <div key={idx} className="flex-1 h-6 rounded-md transition-all duration-300"
                             style={{
                               background: isActive ? "var(--accent-blue)" : "rgba(255,255,255,0.12)",
                               border: `1px solid ${isActive ? "var(--accent-blue)" : "rgba(255,255,255,0.18)"}`,
                               boxShadow: isActive ? "0 0 8px rgba(96,165,250,0.8)" : "none"
                             }} />
                      );
                    })}
                  </div>
                </div>
              ),
            },
            {
              label: "Glucose Level",
              value: glucose,
              unit: "mg/dL",
              icon: Droplet,
              color: "var(--accent-violet)",
              warn: glucose > 140 || glucose < 70,
              subLabel: "Estimated HbA1c",
              subVal: "5.4%",
              status: "Euglycemic Range",
              desc: "Glycemic stability",
              visual: (
                <div className="w-full h-full flex flex-col justify-center px-4 gap-2">
                  <div className="flex justify-between text-[12px] font-mono text-tertiary">
                    <span>50 mg/dL</span>
                    <span className="text-accent-violet">Target (70-140)</span>
                    <span>160 mg/dL</span>
                  </div>
                  <div className="h-3.5 w-full rounded-full bg-white/10 border border-white/20 relative">
                    <div className="absolute top-0 bottom-0 left-[18%] right-[27%] bg-accent-violet/30 border-l border-r border-accent-violet/50" />
                    <div className="absolute top-[-2px] w-4 h-4 rounded-full transition-all duration-500"
                         style={{ 
                           left: `${Math.min(92, Math.max(2, ((glucose - 50) / 110) * 100))}%`, 
                           background: "var(--accent-violet)",
                           boxShadow: "0 0 10px var(--accent-violet)",
                           border: "2px solid #ffffff"
                         }} />
                  </div>
                </div>
              ),
            },
            {
              label: "Toxic Load",
              value: toxic,
              unit: "%",
              icon: Shield,
              color: "var(--accent-mint)",
              warn: toxic > 35,
              subLabel: "Cellular Detox",
              subVal: "98% Clearance",
              status: "Optimal Clearance",
              desc: "Systemic load low",
              visual: (
                <div className="w-full h-full flex flex-col justify-center px-4 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono font-semibold text-secondary">Clearance Level:</span>
                    <span className="text-[14px] font-bold text-accent-mint">{Math.round(100 - toxic)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 border border-white/20 overflow-hidden relative">
                    <div className="h-full rounded-full transition-all duration-500" 
                         style={{ 
                           width: `${100 - toxic}%`, 
                           background: "var(--accent-mint)",
                           boxShadow: "0 0 8px var(--accent-mint)" 
                         }} />
                  </div>
                </div>
              ),
            },
          ].map(({ label, value, unit, icon: Icon, color, warn, subLabel, subVal, status, desc, visual }) => (
            <div
              key={label}
              className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start cyber-card kpi-card-grid relative"
            >
              {/* Row 1: Top Row */}
              <div className="w-full flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-1 items-start text-left">
                  <span className="text-xs tracking-wider font-mono font-bold uppercase text-tertiary">
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-secondary">
                    {status}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-smooth" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>

              {/* Row 2: Centered high-contrast dashboard telemetry panel */}
              <div className="w-full h-[120px] bg-black/50 rounded-xl relative overflow-hidden border border-white/10 flex items-center justify-center p-2 z-10">
                {visual}
              </div>

              {/* Row 3: Centered primary metric zone */}
              <div className="flex items-baseline justify-center gap-1.5 relative z-10">
                <span
                  className="text-4.5xl font-black tracking-tight"
                  style={{ color: warn ? "var(--accent-amber)" : "var(--text-primary)" }}
                >
                  {value}
                </span>
                <span className="text-base font-semibold text-secondary">
                  {unit}
                </span>
              </div>

              {/* Row 4: Centered footer metadata row */}
              <div className="w-full border-t border-subtle pt-3 flex flex-col items-center gap-1.5 mt-auto relative z-10">
                <div className="flex justify-between w-full text-xs font-mono px-1">
                  <span className="text-tertiary">{subLabel}</span>
                  <span className="font-semibold text-secondary">{subVal}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold" style={{ color: warn ? "var(--accent-amber)" : "var(--text-tertiary)" }}>
                  {warn ? (
                    <>
                      <AlertTriangle size={12} style={{ color: "var(--accent-amber)" }} />
                      <span style={{ color: "var(--accent-amber)" }}>Outside normal range</span>
                    </>
                  ) : (
                    <span className="truncate max-w-[220px]">{desc}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: 6 }).map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => {
                if (scrollRef.current) {
                  const cardEl = scrollRef.current.children[dotIdx] as HTMLElement;
                  if (cardEl) {
                    scrollRef.current.scrollTo({ left: cardEl.offsetLeft - 12, behavior: "smooth" });
                  }
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeDot === dotIdx ? "w-6 bg-accent-mint" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">

        {/* Left column */}
        <div className="md:col-span-6 lg:col-span-4 flex flex-col gap-5">
          {/* Bio-Feed */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}
            className="cyber-card p-5 flex flex-col gap-3 h-[290px]"
          >
            <div className="flex items-center justify-between border-b pb-2.5 shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "var(--accent-mint)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Live Feed</h2>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(74,222,128,0.1)", color: "var(--accent-mint)" }}
              >
                Live
              </span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1.5 rounded-xl p-2"
              style={{ background: "var(--bg-inset)" }}
            >
              {telemetryStream.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Waiting for data…</span>
                </div>
              ) : (
                [...telemetryStream].reverse().slice(0, 10).map((frame, idx) => {
                  const isAnomaly = frame.is_anomalous || frame.heart_rate > 120 || frame.blood_oxygen < 95;
                  return (
                    <motion.div
                      key={`${frame.timestamp}-${idx}`}
                      initial={idx === 0 ? { opacity: 0, x: -6 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                      style={{
                        background: idx === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                        border: `1px solid ${idx === 0 ? "var(--border-default)" : "transparent"}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--text-tertiary)" }}>{formatTime(frame.timestamp)}</span>
                        <span
                          className="font-semibold"
                          style={{ color: isAnomaly ? "var(--accent-amber)" : "var(--accent-mint)" }}
                        >
                          HR {frame.heart_rate}
                        </span>
                        <span style={{ color: "var(--text-tertiary)" }}>SpO₂ {frame.blood_oxygen}%</span>
                      </div>
                      <span style={{ color: "var(--text-tertiary)" }}>{frame.core_temperature}°C</span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Supplements */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
            <PharmacokineticsDeck />
          </motion.div>
        </div>

        {/* Centre column */}
        <div className="md:col-span-6 lg:col-span-4 flex flex-col gap-5">
          {/* Vitals Ring */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}
            className="cyber-card p-5 flex flex-col items-center gap-4 h-auto"
          >
            <div className="w-full flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Vitals Ring</h2>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Live biometrics</span>
            </div>
            <BiometricRing />
          </motion.div>

          {/* Circadian / ECG tab */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}
            className="cyber-card p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex gap-1">
                {(["circadian", "ecg"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEcgTab(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth"
                    style={{
                      background: ecgTab === tab ? "var(--bg-elevated)" : "transparent",
                      color: ecgTab === tab ? "var(--text-primary)" : "var(--text-tertiary)",
                      border: ecgTab === tab ? "1px solid var(--border-default)" : "1px solid transparent",
                    }}
                  >
                    {tab === "circadian" ? "Circadian" : "Heart Rate ECG"}
                  </button>
                ))}
              </div>
            </div>
            {ecgTab === "circadian" ? <CircadianFlow /> : <BiometricAreaChart />}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-5">
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
            <OrganMatrix />
          </motion.div>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5}>
            <AiTerminal />
          </motion.div>
        </div>

        {/* Bottom full-width row */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={6}
          className="md:col-span-12"
        >
          <CrisprEngine />
        </motion.div>
      </div>
    </div>
  );
}
