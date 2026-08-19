# Contributing Guidelines

Thank you for your interest in contributing to **Bio Grid**! We welcome contributions from developers, UX designers, and medical telemetry enthusiasts. Follow these guidelines to ensure a smooth collaboration workflow.

---

## 🌿 Branch Naming Conventions

Create focused feature or fix branches branching off `main`. Follow this naming standard:

| Branch Pattern | Description | Example |
|---|---|---|
| `feature/<short-desc>` | New UI component, route, or telemetry capability | `feature/ecg-waveform-shader` |
| `fix/<issue-desc>` | Bug fix or visual alignment correction | `fix/sidebar-collapse-overlap` |
| `docs/<doc-name>` | Documentation updates or architecture notes | `docs/update-deployment-guide` |
| `chore/<task-name>` | Dependency updates, tooling, or CI config | `chore/upgrade-tailwind-v4` |
| `refactor/<scope>` | Code refactoring without functionality changes | `refactor/zustand-store-slices` |

---

## 📝 Conventional Commit Standards

All commit messages must adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Supported Commit Types

- `feat`: A new feature for the user or application.
- `fix`: A bug fix or patch.
- `docs`: Documentation changes only.
- `style`: Formatting, missing semi-colons, whitespace fixes.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code performance optimization.
- `test`: Adding missing unit/integration tests or updating existing tests.
- `chore`: Tooling, workflow, or build dependency changes.

### Examples

```bash
git commit -m "feat(telemetry): add double-stroke ECG waveform canvas renderer"
git commit -m "fix(grid): correct CSS grid column template for collapsed sidebar"
git commit -m "docs(readme): add GitHub Pages live demo link and badge status"
```

---

## 🚀 Pull Request (PR) Submission Workflow

### 1. Pre-Commit Checklist
Before submitting a PR, verify local build status and lint checks:

```bash
# Check code formatting and ESLint rules
npm run lint

# Verify clean static export build
npm run build
```

### 2. Submitting Your PR
1. Push your branch to GitHub: `git push -u origin feature/your-feature-name`
2. Open a Pull Request against the `main` branch.
3. Provide a clear summary of changes, screenshot previews for UI alterations, and testing verification.
4. Ensure all GitHub Actions status checks pass cleanly.
