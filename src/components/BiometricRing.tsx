"use client";

import React from "react";
import { useBiometricStore } from "@/store/useBiometricStore";
import { AlertTriangle } from "lucide-react";

export default function BiometricRing() {
  const { latestTelemetry, alerts } = useBiometricStore();

  // Fallback defaults if WebSocket telemetry hasn't streamed yet
  const hr = latestTelemetry?.heart_rate ?? 72;
  const o2 = latestTelemetry?.blood_oxygen ?? 98.8;
  const stress = latestTelemetry?.stress_index ?? 42.5;
  const temp = latestTelemetry?.core_temperature ?? 36.8;

  // SVG parameters
  const size = 260;
  const strokeWidth = 10;
  const center = size / 2;

  // Radii for three rings
  const rOuter = 100;
  const rMiddle = 80;
  const rInner = 60;

  const getCircumference = (r: number) => 2 * Math.PI * r;

  // Calculating dashoffsets
  const cOuter = getCircumference(rOuter);
  const valOuter = Math.min(100, (hr / 180) * 100);
  const offsetOuter = cOuter - (valOuter / 100) * cOuter;

  const cMiddle = getCircumference(rMiddle);
  const valMiddle = Math.min(100, ((o2 - 80) / 20) * 100); // map SpO2 80%-100% to 0-100
  const offsetMiddle = cMiddle - (valMiddle / 100) * cMiddle;

  const cInner = getCircumference(rInner);
  const valInner = Math.min(100, stress);
  const offsetInner = cInner - (valInner / 100) * cInner;

  // Colors based on status – calm palette
  const hrColor = "var(--accent-red)"; // critical if out of range (handled elsewhere)
  const o2Color = o2 < 95 ? "var(--accent-red)" : o2 < 97 ? "var(--accent-amber)" : "var(--accent-mint)";
  const stressColor = stress > 80 ? "var(--accent-red)" : "var(--accent-amber)";

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circles */}
        <svg width={size} height={size} className="hud-progress-ring">
          <circle cx={center} cy={center} r={rOuter} fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeWidth} />
          <circle cx={center} cy={center} r={rMiddle} fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeWidth} />
          <circle cx={center} cy={center} r={rInner} fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeWidth} />

          {/* Outer Ring: Heart Rate */}
          <circle cx={center} cy={center} r={rOuter} fill="transparent" stroke={hrColor} strokeWidth={strokeWidth} strokeDasharray={cOuter} strokeDashoffset={offsetOuter} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s ease" }} />

          {/* Middle Ring: SpO2 */}
          <circle cx={center} cy={center} r={rMiddle} fill="transparent" stroke={o2Color} strokeWidth={strokeWidth} strokeDasharray={cMiddle} strokeDashoffset={offsetMiddle} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s ease" }} />

          {/* Inner Ring: Stress */}
          <circle cx={center} cy={center} r={rInner} fill="transparent" stroke={stressColor} strokeWidth={strokeWidth} strokeDasharray={cInner} strokeDashoffset={offsetInner} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s ease" }} />
        </svg>

        {/* Central HUD text – using sans-serif */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-sans">
          {alerts.length > 0 ? (
            <div className="flex flex-col items-center animate-pulse text-accent-red">
              <AlertTriangle size={24} className="mb-1" />
              <span className="text-[9px] uppercase tracking-widest font-semibold">ANOMALY DETECTED</span>
              <span className="text-2xl font-bold mt-1">{hr}</span>
              <span className="text-[8px] text-text-muted mt-0.5">HR (BPM)</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-text-muted tracking-widest uppercase mb-1">VITAL INDEX</span>
              <div className="flex items-baseline justify-center gap-0.5 text-accent-red">
                <span className="text-4xl font-bold tracking-tighter">{hr}</span>
                <span className="text-[10px] text-text-muted">BPM</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[9px] text-text-muted">
                <span className="text-accent-mint">{o2}% SpO₂</span>
                <span>•</span>
                <span>{temp}°C</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend – simplified */}
      <div className="w-full grid grid-cols-3 gap-2 mt-6 text-[9px] border-t border-white/5 pt-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hrColor }} />
            <span className="text-text-muted uppercase">HEART RATE</span>
          </div>
          <span className="text-text-pure font-bold text-[10px]">{hr} bpm</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: o2Color }} />
            <span className="text-text-muted uppercase">SpO₂</span>
          </div>
          <span className="text-text-pure font-bold text-[10px]">{o2}%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stressColor }} />
            <span className="text-text-muted uppercase">STRESS</span>
          </div>
          <span className="text-text-pure font-bold text-[10px]">{stress} idx</span>
        </div>
      </div>
    </div>
  );
}
