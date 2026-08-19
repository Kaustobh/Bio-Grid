"use client";

import React from "react";
import { Mail, Globe } from "lucide-react";

/** Inline LinkedIn icon — lucide-react in this build doesn't export Linkedin */
function LinkedInIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const LINKS = [
  {
    label: "Portfolio",
    href: "https://kaustobh.github.io/portfolio/",
    icon: Globe,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/kaustobh-bhattacharya-tech/",
    icon: LinkedInIcon,
  },
  {
    label: "Kaustobh1920@gmail.com",
    href: "mailto:Kaustobh1920@gmail.com",
    icon: Mail,
  },
] as const;

export default function AppFooter() {
  return (
    <footer
      className="w-full shrink-0 mt-auto"
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-base)",
      }}
    >
      <div
        className="mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ maxWidth: "1600px" }}
      >
        {/* Copyright */}
        <p
          className="text-xs font-mono"
          style={{ color: "var(--text-tertiary)" }}
        >
          Copyright © 2026 Kaustobh Bhattacharya
        </p>

        {/* Links */}
        <nav className="flex items-center gap-1">
          {LINKS.map(({ label, href, icon: Icon }, idx) => (
            <React.Fragment key={href}>
              {idx > 0 && (
                <span
                  className="text-xs select-none"
                  style={{ color: "var(--border-default)", margin: "0 4px" }}
                  aria-hidden="true"
                >
                  ·
                </span>
              )}
              <a
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel={href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                className="footer-link inline-flex items-center gap-1 text-xs rounded-md px-2 py-1 transition-smooth"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Icon size={11} strokeWidth={1.8} />
                <span>{label}</span>
              </a>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </footer>
  );
}
