"use client";

import React, { useEffect, useState } from "react";
import { useBiometricStore, TelemetryData } from "@/store/useBiometricStore";
import { Wifi, WifiOff, AlertTriangle, ShieldCheck } from "lucide-react";

const API_BASE = "http://localhost:8000";
const WS_BASE  = "ws://localhost:8000";

const FALLBACK_USER = {
  id: "1a3b9774-075a-44ce-b9d1-a1fc88b2f55a",
  username: "operator.01",
  created_at: "2026-08-20T00:00:00.000Z",
};

export default function BiometricProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, addTelemetryFrame, setMetabolicLog, wsConnected, setWsConnected } = useBiometricStore();
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus]     = useState("Connecting to services...");
  const [bootError, setBootError]       = useState("");

  /* ── Synthetic Offline Telemetry Generator ── */
  useEffect(() => {
    if (!user || wsConnected) return;

    // Stream realistic jittered telemetry when offline/unconnected
    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(" ")[0];

      const syntheticFrame: TelemetryData = {
        timestamp,
        heart_rate: Math.floor(72 + (Math.random() * 8 - 4)),
        blood_oxygen: parseFloat((98.2 + (Math.random() * 0.8 - 0.4)).toFixed(1)),
        core_temperature: parseFloat((36.7 + (Math.random() * 0.3 - 0.15)).toFixed(2)),
        stress_index: Math.floor(24 + (Math.random() * 6 - 3)),
        glucose_level: Math.floor(104 + (Math.random() * 6 - 3)),
        toxic_load: Math.floor(88 + (Math.random() * 4 - 2)),
        organ_strain: {
          brain: 12,
          heart: 18,
          lungs: 14,
          liver: 22,
          kidneys: 15,
          stomach: 10,
        },
      };

      addTelemetryFrame(syntheticFrame);
    }, 1000);

    return () => clearInterval(interval);
  }, [user, wsConnected, addTelemetryFrame]);

  /* ── WebSocket Stream ── */
  useEffect(() => {
    if (!user) return;
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWS = () => {
      try {
        ws = new WebSocket(`${WS_BASE}/v1/biometrics/stream`);
        ws.onopen    = () => setWsConnected(true);
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.heart_rate) addTelemetryFrame(data as TelemetryData);
          } catch { /* ignore non-JSON */ }
        };
        ws.onclose = () => { setWsConnected(false); reconnectTimer = setTimeout(connectWS, 4000); };
        ws.onerror = () => { ws.close(); };
      } catch {
        setWsConnected(false);
      }
    };

    connectWS();
    return () => { if (ws) ws.close(); clearTimeout(reconnectTimer); };
  }, [user, addTelemetryFrame, setWsConnected]);

  /* ── Metabolic Log Fetch ── */
  useEffect(() => {
    if (!user) return;
    const fetchMetabolic = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${API_BASE}/v1/users/${user.id}/metabolic`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const glucose_arr = data.glucose_curve
            ? data.glucose_curve.split(",").map((v: string) => parseFloat(v))
            : [95, 98, 102, 105, 108, 110, 105, 100, 98, 96, 95, 94];
          setMetabolicLog({ calories: data.calories, hydration: parseFloat(data.hydration), protein: data.protein, carbs: data.carbs, fat: data.fat, glucose_curve: glucose_arr });
        }
      } catch {
        // Fallback default metabolic values
        setMetabolicLog({ calories: 2150, hydration: 2.8, protein: 145, carbs: 210, fat: 65, glucose_curve: [95, 98, 102, 105, 108, 110, 105, 100, 98, 96, 95, 94] });
      }
    };
    fetchMetabolic();
  }, [user, setMetabolicLog]);

  /* ── Auto Boot Handshake ── */
  useEffect(() => {
    if (user) return;
    let isMounted = true;
    let progressVal = 0;
    let interval: NodeJS.Timeout;

    const startBoot = async () => {
      let activeUser = FALLBACK_USER;
      try {
        setBootStatus("Connecting to services...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE}/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "operator.01" }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          activeUser = await res.json();
        }
      } catch {
        // Quiet fallback to offline demo mode
      }

      interval = setInterval(() => {
        if (!isMounted) return;
        progressVal += Math.floor(Math.random() * 8) + 6;
        if (progressVal >= 100) {
          progressVal = 100;
          clearInterval(interval);
          setTimeout(() => { if (isMounted) setUser(activeUser); }, 300);
        }
        setBootProgress(progressVal);
        if      (progressVal < 25) setBootStatus("Loading your health profile...");
        else if (progressVal < 50) setBootStatus("Syncing metabolic data...");
        else if (progressVal < 75) setBootStatus("Preparing your dashboard...");
        else if (progressVal < 95) setBootStatus("Almost ready...");
        else                       setBootStatus("Welcome back.");
      }, 80);
    };

    const startTimer = setTimeout(startBoot, 300);
    return () => { isMounted = false; clearTimeout(startTimer); if (interval) clearInterval(interval); };
  }, [user, setUser]);

  /* ── Error Screen ── */
  if (bootError) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
        <div
          className="w-full max-w-sm flex flex-col gap-5 rounded-2xl p-6 shadow-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
              <AlertTriangle size={18} style={{ color: "var(--accent-red)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Connection Notice</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Unable to reach live backend port 8000</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {bootError} You can launch the Python backend (`python -m uvicorn backend.main:app --port 8000`) or proceed directly in offline demo mode.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setBootError("");
                setUser(FALLBACK_USER);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ShieldCheck size={14} />
              Continue in Offline Demo Mode
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 text-xs rounded-xl transition-all"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading Screen ── */
  if (!user) {
    return (
      <div
        className="min-h-screen w-screen flex items-center justify-center p-6 select-none"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="flex flex-col items-center gap-8 w-full max-w-xs text-center">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="var(--accent-mint)" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="var(--accent-mint)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="var(--border-default)" strokeWidth="1" />
              </svg>
            </div>
            <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Bio Grid</h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Loading your health dashboard…</p>
          </div>

          {/* Thin spinner */}
          <div className="relative w-10 h-10">
            <div
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-mint)" }}
            />
          </div>

          {/* Progress */}
          <div className="w-full flex flex-col items-center gap-3">
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: "4px", background: "var(--bg-elevated)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${bootProgress}%`, background: "var(--accent-mint)" }}
              />
            </div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{bootStatus}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main App Shell ── */
  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Top Header Bar */}
      <header
        className="h-14 px-6 flex items-center justify-between z-30 relative"
        style={{
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Left: Brand + username */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="var(--accent-mint)" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="var(--accent-mint)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Bio Grid</span>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            <span>Patient:</span>
            <span className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>{user.username}</span>
          </div>
        </div>

        {/* Right: WebSocket status */}
        <div className="flex items-center gap-2 text-xs">
          {wsConnected ? (
            <div className="flex items-center gap-1.5" style={{ color: "var(--accent-mint)" }}>
              <span
                className="w-1.5 h-1.5 rounded-full status-dot-breathe"
                style={{ background: "var(--accent-mint)" }}
              />
              <Wifi size={12} />
              <span className="hidden sm:block">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 animate-pulse" style={{ color: "var(--accent-amber)" }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent-amber)" }}
              />
              <WifiOff size={12} />
              <span className="hidden sm:block">Reconnecting…</span>
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 relative z-10 flex flex-col">{children}</main>
    </div>
  );
}
