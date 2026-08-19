"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBiometricStore } from "@/store/useBiometricStore";
import { Apple, Droplet, Flame, Save, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

const API_BASE = "http://localhost:8000";

export default function NutritionLog() {
  const { user, metabolicLog, setMetabolicLog } = useBiometricStore();

  const [calories,   setCalories]   = useState(2200);
  const [hydration,  setHydration]  = useState(2.8);
  const [protein,    setProtein]    = useState(135);
  const [carbs,      setCarbs]      = useState(240);
  const [fat,        setFat]        = useState(65);
  const [glucoseStr, setGlucoseStr] = useState("95,98,102,105,108,110,105,100,98,96,95,94");
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState("");

  useEffect(() => {
    if (metabolicLog) {
      const t = setTimeout(() => {
        setCalories(metabolicLog.calories);
        setHydration(metabolicLog.hydration);
        setProtein(metabolicLog.protein);
        setCarbs(metabolicLog.carbs);
        setFat(metabolicLog.fat);
        setGlucoseStr(metabolicLog.glucose_curve.join(","));
      }, 0);
      return () => clearTimeout(t);
    }
  }, [metabolicLog]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/v1/users/${user.id}/metabolic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calories, hydration: parseFloat(hydration.toString()), protein, carbs, fat, glucose_curve: glucoseStr }),
      });
      if (!res.ok) throw new Error("Failed to save changes.");
      const data = await res.json();
      const glucose_arr = data.glucose_curve
        ? data.glucose_curve.split(",").map((v: string) => parseFloat(v))
        : [95, 98, 102, 105, 108, 110, 105, 100, 98, 96, 95, 94];
      setMetabolicLog({ calories: data.calories, hydration: parseFloat(data.hydration), protein: data.protein, carbs: data.carbs, fat: data.fat, glucose_curve: glucose_arr });
      setMessage("Changes saved successfully.");
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const glucosePoints = React.useMemo(() => {
    const list = glucoseStr.split(",").map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    if (list.length < 2) return "";
    return list.map((val, idx) => {
      const x = (idx / (list.length - 1)) * 400;
      const y = 80 - ((val - 60) / (180 - 60)) * 80;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  }, [glucoseStr]);

  const lastGlucoseVal = React.useMemo(() => {
    const list = glucoseStr.split(",").map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    return list[list.length - 1] ?? 100;
  }, [glucoseStr]);

  const lastY = 80 - ((lastGlucoseVal - 60) / 120) * 80;

  const sliders = [
    { label: "Daily Calories",    icon: Flame,   iconColor: "var(--accent-red)",   min: 1200, max: 4000, step: 50,  val: calories,  set: setCalories,  unit: "kcal" },
    { label: "Hydration",         icon: Droplet, iconColor: "var(--accent-blue)",  min: 1.0,  max: 6.0,  step: 0.1, val: hydration, set: setHydration, unit: "L" },
    { label: "Protein",           icon: Apple,   iconColor: "var(--accent-mint)",  min: 50,   max: 250,  step: 5,   val: protein,   set: setProtein,   unit: "g" },
    { label: "Carbohydrates",     icon: Apple,   iconColor: "var(--accent-amber)", min: 50,   max: 450,  step: 5,   val: carbs,     set: setCarbs,     unit: "g" },
    { label: "Dietary Fat",       icon: Apple,   iconColor: "var(--accent-violet)",min: 20,   max: 150,  step: 5,   val: fat,       set: setFat,       unit: "g" },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 pb-28 flex-1 flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Nutrition Log</h1>
          <p className="text-base font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>Track macros, hydration, and glucose</p>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold transition-smooth hover:text-white" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">

        {/* Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 cyber-card p-6 flex flex-col justify-between"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
              <Apple size={15} style={{ color: "var(--accent-mint)" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Daily Intake</h2>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-5">
              {sliders.map(({ label, icon: Icon, iconColor, min, max, step, val, set, unit }) => (
                <div key={label} className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-4 flex items-center gap-1.5 text-sm font-semibold text-secondary">
                    <Icon size={12} style={{ color: iconColor }} />
                    <span>{label}</span>
                  </label>
                  <div className="col-span-6">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={val}
                      onChange={(e) => (set as (v: number) => void)(
                        step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value)
                      )}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {val}{unit}
                  </div>
                </div>
              ))}

              {/* Glucose input */}
              <div className="flex flex-col gap-1.5 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                <label htmlFor="glucoseStr" className="text-sm font-bold text-secondary">
                  Glucose readings (comma-separated, mg/dL)
                </label>
                <input
                  id="glucoseStr"
                  type="text"
                  value={glucoseStr}
                  onChange={(e) => setGlucoseStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono"
                  style={{
                    background: "var(--bg-inset)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Save area */}
          <div className="flex flex-col gap-3 mt-6">
            {message && (
              <div
                className="px-3 py-2.5 rounded-xl text-xs text-center font-bold animate-pulse"
                style={{
                  background: message.startsWith("Error") ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.08)",
                  color:      message.startsWith("Error") ? "var(--accent-red)"    : "var(--accent-mint)",
                  border:     `1px solid ${message.startsWith("Error") ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.3)"}`,
                }}
              >
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold py-2.5"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /><span>Saving…</span></>
              ) : (
                <><Save size={14} /><span>Save Changes</span></>
              )}
            </button>
          </div>
        </form>

        {/* Preview panel */}
        <div className="lg:col-span-5 cyber-card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <RefreshCw size={14} style={{ color: "var(--accent-blue)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Glucose Curve</h2>
          </div>

          {/* Glucose chart */}
          <div>
            <p className="text-xs mb-2 text-tertiary">Blood sugar over the day (60–180 mg/dL)</p>
            <div className="w-full h-24 rounded-xl relative overflow-visible bg-black/40 border border-white/10"
              style={{ background: "var(--bg-inset)" }}
            >
              {glucosePoints ? (
                <svg width="100%" height="100%" viewBox="0 0 400 80" preserveAspectRatio="none" className="absolute inset-0 px-2 overflow-visible">
                  <defs>
                    <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--accent-blue)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0"   />
                    </linearGradient>
                  </defs>
                  
                  {/* Background grid lines */}
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const xVal = 50 + idx * 50;
                    return (
                      <line key={idx} x1={xVal} y1="0" x2={xVal} y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    );
                  })}
                  
                  {/* Target Bounds: Ceiling 140 mg/dL (y=26.6) & Floor 70 mg/dL (y=73.3) */}
                  <line x1="0" y1="26.6" x2="400" y2="26.6" stroke="rgba(251,191,36,0.35)" strokeDasharray="3 3" strokeWidth="1.2" />
                  <text x="5" y="22" fill="rgba(251,191,36,0.7)" className="text-[10px] font-mono font-bold select-none">Ceiling (140)</text>

                  <line x1="0" y1="73.3" x2="400" y2="73.3" stroke="rgba(96,165,250,0.35)" strokeDasharray="3 3" strokeWidth="1.2" />
                  <text x="5" y="69" fill="rgba(96,165,250,0.7)" className="text-[10px] font-mono font-bold select-none">Floor (70)</text>

                  <path d={`${glucosePoints} L 400 80 L 0 80 Z`} fill="url(#glucoseGrad)" />
                  <path d={glucosePoints} fill="transparent" stroke="var(--accent-blue)" strokeWidth="3" style={{ filter: "drop-shadow(0 0 4px var(--accent-blue))" }} />
                  
                  {/* Pulsing endpoint dot */}
                  <circle
                    cx="400"
                    cy={lastY}
                    r="4.5"
                    fill="#ffffff"
                    stroke="var(--accent-blue)"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                  <circle
                    cx="400"
                    cy={lastY}
                    r="8.5"
                    fill="transparent"
                    stroke="var(--accent-blue)"
                    strokeWidth="1.2"
                    className="animate-pulse-ring"
                  />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-accent-amber font-bold">
                  Invalid glucose data
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2.5 text-[11px] font-mono text-tertiary">
              <span>8 AM (Fasting)</span>
              <span>2 PM (Post-meal)</span>
              <span>8 PM</span>
            </div>
          </div>

          {/* Macro breakdown */}
          <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-sm font-bold text-secondary">Macro Breakdown</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Protein", value: `${protein}g`, target: "150g", pct: Math.min(100, (protein / 150) * 100), color: "var(--accent-mint)" },
                { label: "Carbs",   value: `${carbs}g`,   target: "300g", pct: Math.min(100, (carbs / 300) * 100), color: "var(--accent-blue)" },
                { label: "Fat",     value: `${fat}g`,     target: "90g",  pct: Math.min(100, (fat / 90) * 100), color: "var(--accent-amber)" },
              ].map(({ label, value, target, pct, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl flex flex-col justify-between min-h-[90px] transition-smooth bg-black/35 border border-white/10"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-tertiary">{label}</span>
                    <span className="text-base font-black" style={{ color }}>{value}</span>
                    <span className="text-[11px] font-mono text-tertiary">Target: {target}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 border border-white/20 rounded-full overflow-hidden mt-2 relative">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-tertiary mt-auto border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
            Data updates your metabolic profile in real-time. Changes are saved to the server on submit.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
