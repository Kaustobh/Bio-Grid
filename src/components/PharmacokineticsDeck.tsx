"use client";

import React, { useState, useEffect } from "react";
import { useBiometricStore } from "@/store/useBiometricStore";
import { FlaskConical, PlusCircle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:8000";

export default function PharmacokineticsDeck() {
  const { user, supplements, setSupplements, addSupplement } = useBiometricStore();
  const [modalOpen, setModalOpen]     = useState(false);
  const [compoundName, setCompoundName] = useState("");
  const [dosage, setDosage]           = useState("100");
  const [halfLife, setHalfLife]       = useState("6");
  const [loading, setLoading]         = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ── Fetch supplements on mount ── */
  useEffect(() => {
    if (!user) return;
    const fetchSupps = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/users/${user.id}/supplements`);
        if (res.ok) setSupplements(await res.json());
      } catch { /* silent */ }
    };
    fetchSupps();
  }, [user, setSupplements]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !compoundName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/users/${user.id}/supplements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compound_name: compoundName.trim(), dosage_mg: parseFloat(dosage), half_life_hours: parseFloat(halfLife) }),
      });
      if (res.ok) {
        addSupplement(await res.json());
        setCompoundName("");
        setModalOpen(false);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  /* ── Decay calculation ── */
  const getRemainingPercent = (intakeTimeISO: string, halfLifeHours: number, now: number) => {
    try {
      const elapsed = (now - new Date(intakeTimeISO).getTime()) / 3_600_000;
      return Math.max(0, Math.min(100, 0.5 ** (elapsed / halfLifeHours) * 100));
    } catch { return 50; }
  };

  return (
    <div className="cyber-card p-5 flex flex-col gap-4 min-h-[300px] justify-between">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b pb-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={15} style={{ color: "var(--accent-mint)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Supplement Tracker</h3>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
        >
          <PlusCircle size={12} />
          <span>Add</span>
        </button>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto no-scrollbar flex-1">
        <table className="w-full border-collapse text-xs text-left">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-wider"
              style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}
            >
              <th className="pb-2 font-medium">Supplement</th>
              <th className="pb-2 font-medium">Half-life</th>
              <th className="pb-2 font-medium">Active dose</th>
              <th className="pb-2 font-medium text-right w-1/3">Clearance</th>
            </tr>
          </thead>
          <tbody>
            {supplements.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No supplements logged yet
                </td>
              </tr>
            ) : (
              supplements.map((supp) => {
                const pct = getRemainingPercent(supp.intake_time, supp.half_life_hours, currentTime);
                const barColor = pct < 25 ? "var(--accent-red)" : pct < 60 ? "var(--accent-amber)" : "var(--accent-mint)";
                return (
                  <tr
                    key={supp.id}
                    className="border-b last:border-0 transition-colors"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <td className="py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{supp.compound_name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{supp.half_life_hours} hr</td>
                    <td style={{ color: "var(--text-secondary)" }}>{(supp.dosage_mg * pct / 100).toFixed(1)} / {supp.dosage_mg} mg</td>
                    <td className="py-2.5 text-right">
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: "6px", background: "var(--bg-elevated)" }}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: barColor }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="text-[10px] pt-2 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
        Clearance based on exponential decay formula (N₀ × 0.5^(t/T½))
      </p>

      {/* Add Supplement Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0"
              style={{ background: "rgba(15,17,23,0.75)", backdropFilter: "blur(6px)" }}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-full max-w-sm p-6 rounded-2xl flex flex-col gap-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Supplement</h4>
                <button
                  onClick={() => setModalOpen(false)}
                  className="transition-smooth"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {[
                  { id: "compound", label: "Name", type: "text", placeholder: "e.g. Magnesium", val: compoundName, set: setCompoundName },
                  { id: "dosage",   label: "Dosage (mg)", type: "number", placeholder: "150", val: dosage, set: setDosage },
                  { id: "halflife", label: "Half-life (hours)", type: "number", placeholder: "6.0", val: halfLife, set: setHalfLife },
                ].map(({ id, label, type, placeholder, val, set }) => (
                  <div key={id} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
                    <input
                      id={id}
                      type={type}
                      placeholder={placeholder}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      required
                      className="px-3 py-2.5 rounded-xl text-sm"
                      style={{
                        background: "var(--bg-inset)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                >
                  {loading ? <><Loader2 size={12} className="animate-spin" /><span>Saving…</span></> : <span>Add Supplement</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
