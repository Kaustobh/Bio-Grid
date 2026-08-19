# Changelog

All notable changes to the **Bio Grid** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-19

### Added
- Initial production release of Bio Grid Clinical Med-Tech Patient Dashboard.
- Slideable 6-card KPI biometrics strip with horizontal scroll-snap, mouse drag, and keyboard navigation.
- 3D Organ & Brain Cortex scanning engine utilizing Three.js and React Three Fiber.
- FastAPI Python backend with high-frequency WebSocket biometric streaming and SQLite telemetry database (`biogrid.db`).
- Interactive Diagnostic Lab analyzer with dynamic parameter sliders and real-time confidence scores.
- Non-overlapping CSS Grid App Shell Layout (`grid-template-columns: 64px 1fr / 260px 1fr`).
- Full WCAG AA accessibility compliance with 11.2:1 contrast ratios, 12px typographic floor, and 44px touch targets.
- Automated GitHub Actions deployment pipeline (`.github/workflows/deploy.yml`) for hosting on GitHub Pages.
- SPA router fallback handling (`public/404.html`) and `.nojekyll` static export configuration.
- Comprehensive Markdown documentation (`README.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`).
