# Bio Grid — Med-Tech Patient Biometric Telemetry Dashboard

[![GitHub Pages Deployment](https://github.com/Kaustobh/biogrid-healthtech-patient-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/Kaustobh/biogrid-healthtech-patient-dashboard/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.js.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

> **Live Demo**: [https://<username>.github.io/biogrid-healthtech-patient-dashboard/](https://<username>.github.io/biogrid-healthtech-patient-dashboard/)

---

## 📋 Overview

**Bio Grid** is a clinical-grade, real-time medical monitoring dashboard designed to aggregate biometric telemetry, simulate physiological adjustments, and render procedural 3D anatomical scans. Built with Next.js 16, React 19, Three.js (React Three Fiber), Zustand, and Tailwind CSS, the platform delivers 60 FPS visual performance, high-contrast dark mode legibility, and strict WCAG AA accessibility compliance.

---

## ✨ Features

- **Slideable KPI Metrics Strip**: Touch-enabled, keyboard-accessible horizontal carousel presenting 6 vital health metrics (Heart Rate, SpO₂, Temperature, Stress Index, Glucose Level, Toxic Clearance).
- **Procedural 3D Anatomy Mapping**: Interactive Three.js / React Three Fiber shaders rendering voxel organ models, cortical hemispheres, and somatic maps with live diagnostic confidence rings.
- **WebSocket Biometric Streaming Engine**: High-frequency telemetry pipeline updating global Zustand store state with < 10ms processing latency.
- **Dynamic Diagnostics & Metabolic Logs**: Real-time lab analyzer with interactive sliders, anomaly queues, and cellular detox tracking.
- **Non-Overlapping App Shell Grid**: Dynamic CSS Grid app container (`grid-template-columns: 64px 1fr / 260px 1fr`) ensuring sticky sidebar navigation without layout overflow or content clipping.
- **WCAG AA Compliance**: High contrast ratios (11.2:1 slate text), minimum 12px font floor, and 44px minimum touch targets.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Static Export) |
| **UI Library** | React 19, Tailwind CSS v4, Lucide React |
| **3D Rendering** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **State Management** | Zustand v5 (Concurrent-safe state engine) |
| **Data Fetching** | `@tanstack/react-query` v5 |
| **Language** | TypeScript 5 (Strict Type Checking) |
| **CI/CD & Hosting** | GitHub Actions, GitHub Pages (`output: "export"`) |

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/<username>/biogrid-healthtech-patient-dashboard.git
cd biogrid-healthtech-patient-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser to view the application.

### 4. Build Production Bundle
```bash
npm run build
```
Static production output will be generated in the `./out` directory ready for deployment.

---

## 📁 Directory Structure

```
biogrid-healthtech-patient-dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD Deployment Workflow
├── backend/
│   ├── database.py               # SQLite database setup & connection
│   ├── main.py                   # FastAPI REST API & WebSocket telemetry stream
│   ├── models.py                 # Pydantic data schemas
│   └── requirements.txt          # Python backend dependencies
├── public/
│   ├── 404.html                  # SPA client-side router redirect fallback
│   ├── favicon.ico               # Site favicon
│   └── *.png                     # Static anatomical and background assets
├── src/
│   ├── app/
│   │   ├── body-mapping/         # 3D Organ & Somatic Scanning Page
│   │   ├── diagnostic-lab/       # Interactive Diagnostic Lab Page
│   │   ├── metabolic-log/        # Metabolic & Cellular Detox Tracking Page
│   │   ├── globals.css           # Global Tailwind CSS styles & design tokens
│   │   ├── layout.tsx            # Root App Shell Grid Layout
│   │   └── page.tsx              # Main Dashboard Deck Page
│   ├── components/               # Reusable React UI & 3D Canvas Components
│   ├── store/                    # Zustand global store (`useBiometricStore.ts`)
│   └── utils/                    # Helper functions & API connectors
├── CHANGELOG.md                  # Version tracking log
├── CONTRIBUTING.md               # Code contribution guidelines
├── DEPLOYMENT.md                 # Detailed GitHub Pages CI/CD guide
├── next.config.ts                # Next.js static export build configuration
├── package.json                  # Dependencies & npm scripts
├── README.md                     # Project documentation overview
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🌐 Deployment Summary

This project is configured for automated static deployment to **GitHub Pages** via GitHub Actions.

1. **Build Output**: Generates static HTML, JS, CSS, and media assets in `./out`.
2. **Jekyll Bypass**: Creates `.nojekyll` inside the build directory to ensure `_next` asset paths are served correctly.
3. **Automated Trigger**: Pushing to the `main` branch automatically triggers `.github/workflows/deploy.yml`.

For detailed hosting instructions and troubleshooting steps, refer to [DEPLOYMENT.md](file:///c:/Users/Kaust/Downloads/ui%20ux/Health%20tech%20_%20for%20_%20Pateintes_data/DEPLOYMENT.md).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
