"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBiometricStore } from "@/store/useBiometricStore";
import ThreeOrganModel, { ANOMALIES } from "@/components/ThreeOrganModel";
import { Brain, ArrowLeft, AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export default function DiagnosticLab() {
  const { selectedAnomalyNode, setSelectedAnomalyNode } = useBiometricStore();
  const selectedNodeInfo = ANOMALIES.find((n) => n.id === selectedAnomalyNode);

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
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Diagnostic Lab</h1>
          <p className="text-base font-semibold mt-0.5" style={{ color: "var(--text-tertiary)" }}>3D neural scan — click any node to inspect</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold transition-smooth hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-[500px]">

        {/* 3D Viewport */}
        <div
          className="lg:col-span-8 cyber-card flex flex-col h-[550px]"
        >
          <div
            className="p-4 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <Brain size={15} style={{ color: "var(--accent-blue)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Neural Scan</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent-mint)" }}>
              <span className="w-1.5 h-1.5 rounded-full status-dot-breathe" style={{ background: "var(--accent-mint)" }} />
              <span>Sensor active</span>
            </div>
          </div>
          <div className="flex-1 w-full h-full relative">
            <ThreeOrganModel />
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:col-span-4 flex flex-col h-[550px]">
          <AnimatePresence mode="wait">
            {selectedNodeInfo ? (
              <motion.div
                key={selectedNodeInfo.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="cyber-card p-5 flex flex-col justify-between h-full"
                style={{ border: "1px solid rgba(251,191,36,0.4)" }}
              >
                <div className="flex flex-col gap-4">
                  {/* Panel header */}
                  <div
                    className="flex items-center justify-between border-b pb-3"
                    style={{ borderColor: "rgba(251,191,36,0.3)" }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} style={{ color: "var(--accent-amber)" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Anomaly Detected</span>
                    </div>
                    <button
                      onClick={() => setSelectedAnomalyNode(null)}
                      style={{ color: "var(--text-secondary)" }}
                      className="transition-smooth hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-4 text-sm">
                    <div>
                      <p className="text-xs mb-1 uppercase tracking-wider font-bold" style={{ color: "var(--text-tertiary)" }}>Node</p>
                      <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{selectedNodeInfo.name}</p>
                    </div>

                    <div>
                      <p className="text-xs mb-1 uppercase tracking-wider font-bold" style={{ color: "var(--text-tertiary)" }}>Pathology</p>
                      <span
                        className="inline-block px-2.5 py-1 rounded-md text-xs font-bold"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                      >
                        {selectedNodeInfo.type}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs mb-2 uppercase tracking-wider font-bold" style={{ color: "var(--text-tertiary)" }}>Diagnostic Confidence</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-full relative overflow-hidden h-3 bg-white/10 border border-white/20">
                          <div
                            className="h-full rounded-full relative overflow-hidden"
                            style={{
                              width: `${selectedNodeInfo.confidence}%`,
                              background: selectedNodeInfo.confidence > 70 ? "var(--accent-red)" : "var(--accent-amber)",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
                          </div>
                        </div>
                        <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          {selectedNodeInfo.confidence}%
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
                      <p className="text-xs mb-1 uppercase tracking-wider font-bold" style={{ color: "var(--text-tertiary)" }}>Observation</p>
                      <p className="text-sm leading-relaxed text-secondary">
                        {selectedNodeInfo.details}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <Link
                    href="/metabolic-log"
                    className="btn-primary w-full block text-center text-sm font-bold"
                  >
                    View Nutrition Log →
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cyber-card p-5 flex flex-col items-center justify-center text-center h-full gap-4 relative overflow-hidden bg-black/40"
              >
                {/* Live Scanning Radial Grid */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-1">
                  {/* Crosshairs guidelines for clinical looks */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-full h-0.5 bg-accent-blue/30" />
                    <div className="h-full w-0.5 bg-accent-blue/30 absolute" />
                  </div>
                  
                  <div className="absolute inset-0 rounded-full border-2 border-accent-blue/40 animate-ping opacity-60" style={{ borderColor: "rgba(96,165,250,0.4)" }} />
                  <div className="absolute inset-2 rounded-full border border-accent-blue/50" style={{ borderColor: "rgba(96,165,250,0.5)" }} />
                  <div className="absolute inset-6 rounded-full border border-accent-blue/60 border-dashed" style={{ borderColor: "rgba(96,165,250,0.6)" }} />
                  <div className="absolute inset-0 rounded-full border-t-2 border-r border-accent-blue animate-spin" 
                       style={{ 
                         borderColor: "transparent", 
                         borderTopColor: "var(--accent-blue)", 
                         borderRightColor: "rgba(96,165,250,0.4)",
                         animationDuration: '2.2s',
                         filter: "drop-shadow(0 0 5px var(--accent-blue))" 
                       }} />
                  <div className="w-18 h-18 rounded-full flex items-center justify-center relative bg-deep-space border-2 border-white/20">
                    <Brain size={24} style={{ color: "var(--accent-blue)", filter: "drop-shadow(0 0 6px var(--accent-blue))" }} className="relative z-10 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold mb-1.5 text-primary">Active Neural Scanner</h4>
                  <p className="text-xs leading-relaxed max-w-[240px] text-tertiary">
                    Scanner live. Rotate the 3D model and select any anomaly node to pull clinical telemetry.
                  </p>
                </div>
                
                {/* Floating active coordinate locator readouts */}
                <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[11px] font-mono text-tertiary select-none pointer-events-none opacity-60">
                  <span>LAT: 42.895</span>
                  <span>LNG: -12.404</span>
                  <span>ALT: 104m</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
