"use client";

import React, { useState } from "react";
import { useBiometricStore } from "@/store/useBiometricStore";
import { Activity, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:8000";

interface AIResult {
  probable_illness: string;
  probability_percent: number;
  risk_factors: string[];
  chrono_recs: string;
  clinical_actions: string[];
  affected_organs?: string[];
}

export default function AiTerminal() {
  const { user, setSelectedAnomalyNode } = useBiometricStore();
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading]   = useState(false);
  const [logs, setLogs]         = useState<string[]>([]);
  const [result, setResult]     = useState<AIResult | null>(null);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !symptoms.trim()) return;

    setLoading(true);
    setResult(null);
    setLogs([]);

    const steps = [
      "Connecting to health analysis service…",
      "Reading your current biometric data…",
      "Checking gene expression settings…",
      "Running symptom analysis…",
      "Generating recommendations…",
    ];

    for (let i = 0; i < steps.length; i++) {
      setLogs((prev) => [...prev, steps[i]]);
      await new Promise((r) => setTimeout(r, 280));
    }

    try {
      const res = await fetch(`${API_BASE}/v1/users/${user.id}/ai/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symptoms.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setLogs((prev) => [...prev, "Analysis complete."]);
        if (data.affected_organs?.length) setSelectedAnomalyNode(data.affected_organs[0]);
      } else {
        throw new Error("Analysis service unavailable. Please try again.");
      }
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${(err as Error).message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-card p-5 flex flex-col gap-4 h-[270px] justify-between">
      <div className="flex flex-col gap-3 w-full h-full overflow-y-auto no-scrollbar">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b pb-2.5 shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <Activity size={15} style={{ color: "var(--accent-blue)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Health Analysis</h3>
          </div>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>AI-powered</span>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-2.5 min-h-[110px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col justify-end gap-1.5 text-xs leading-tight p-3 rounded-xl"
                style={{ background: "var(--bg-inset)", color: "var(--text-secondary)" }}
              >
                <div className="flex items-center gap-2 mb-1 font-medium" style={{ color: "var(--accent-mint)" }}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Analyzing…</span>
                </div>
                {logs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    ✓ {log}
                  </motion.div>
                ))}
              </motion.div>
            ) : result ? (
              <motion.div
                key="diagnose-result"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col gap-3 text-xs"
              >
                {/* Diagnosis headline */}
                <div className="p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>Probable condition</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result.probable_illness}</span>
                    <span className="text-xs font-medium" style={{ color: result.probability_percent > 70 ? "var(--accent-red)" : "var(--accent-amber)" }}>
                      {result.probability_percent}% confidence
                    </span>
                  </div>
                </div>

                {/* Grid: risks + actions */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--text-tertiary)" }}>Risk factors</p>
                    <ul className="flex flex-col gap-0.5" style={{ color: "var(--text-secondary)" }}>
                      {result.risk_factors.map((rf, i) => <li key={i} className="text-[11px]">• {rf}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] mb-1 font-medium" style={{ color: "var(--text-tertiary)" }}>Recommended actions</p>
                    <ul className="flex flex-col gap-0.5" style={{ color: "var(--text-secondary)" }}>
                      {result.clinical_actions.slice(0, 2).map((ca, i) => <li key={i} className="text-[11px]">• {ca}</li>)}
                    </ul>
                  </div>
                </div>

                <p className="text-[11px] pt-1" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>Nutrition note: </span>{result.chrono_recs}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="input-form"
                onSubmit={handleDiagnose}
                className="flex-1 flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="symptomText" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Describe your symptoms
                  </label>
                  <textarea
                    id="symptomText"
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Fatigue, dry mouth, difficulty concentrating…"
                    className="w-full px-3 py-2 rounded-xl text-xs resize-none font-sans"
                    style={{
                      background: "var(--bg-inset)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!symptoms.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={12} />
                  <span>Analyze</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
