"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Brain, Apple, Power, Pin, PinOff, Accessibility } from "lucide-react";
import { useBiometricStore } from "@/store/useBiometricStore";

export default function CollapsibleSidebar() {
  const pathname = usePathname();
  const { user, setUser, setSidebarCollapsed, sidebarCollapsed } = useBiometricStore();

  const navItems = [
    { href: "/",              icon: Activity,    label: "Dashboard" },
    { href: "/diagnostic-lab", icon: Brain,       label: "Diagnostic Lab" },
    { href: "/body-mapping",   icon: Accessibility, label: "Body Mapping" },
    { href: "/metabolic-log",  icon: Apple,       label: "Nutrition Log" },
  ];

  const handleTogglePin = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!user) return null;

  return (
    <aside
      className="h-screen sticky top-0 left-0 flex flex-col items-center py-5 justify-between z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full"
      style={{
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      {/* Top: Logo + Pin */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Logo & Title */}
        <Link 
          href="/" 
          className={`relative flex items-center rounded-xl transition-smooth ${
            sidebarCollapsed ? "w-10 h-10 justify-center" : "w-[calc(100%-24px)] h-12 px-3 gap-3"
          }`}
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="12" cy="12" r="3" fill="var(--accent-mint)" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="var(--accent-mint)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
          {!sidebarCollapsed && (
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap animate-fade-up">
              Bio Grid
            </span>
          )}
        </Link>

        {/* Pin/Collapse button */}
        <button
          onClick={handleTogglePin}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`rounded-lg flex items-center transition-smooth ${
            sidebarCollapsed ? "w-7 h-7 justify-center" : "w-[calc(100%-24px)] h-8 px-3 gap-2 justify-start text-xs font-semibold"
          }`}
          style={{
            color: "var(--text-tertiary)",
            background: "transparent",
            border: "none",
          }}
        >
          {sidebarCollapsed ? (
            <PinOff size={13} />
          ) : (
            <>
              <Pin size={13} />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>

        {/* Nav */}
        <nav className="flex flex-col gap-3 mt-3 w-full px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 rounded-xl transition-smooth group px-3 ${
                  sidebarCollapsed ? "w-10 h-10 justify-center" : "w-full h-11 justify-start"
                }`}
                style={{
                  color: isActive ? "var(--accent-mint)" : "var(--text-secondary)",
                  background: isActive ? "rgba(74,222,128,0.08)" : "transparent",
                  border: isActive ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                }}
              >
                {/* Active left-edge indicator */}
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: "var(--accent-mint)" }}
                  />
                )}

                <Icon size={18} className="shrink-0" />

                {!sidebarCollapsed && (
                  <span className="text-sm font-semibold whitespace-nowrap animate-fade-up">
                    {item.label}
                  </span>
                )}

                {/* Tooltip */}
                {sidebarCollapsed && (
                  <div
                    className="absolute left-14 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 shadow-lg"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Logout */}
      <div className="w-full flex justify-center px-3">
        {user && (
          <button
            onClick={() => setUser(null)}
            title={sidebarCollapsed ? "Sign Out" : undefined}
            className={`rounded-xl flex items-center transition-smooth text-left ${
              sidebarCollapsed ? "w-10 h-10 justify-center" : "w-full h-11 px-3 gap-3 justify-start"
            }`}
            style={{
              color: "var(--text-tertiary)",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--accent-red)";
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Power size={16} className="shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold whitespace-nowrap">
                Sign Out
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
