# SafeMed Frontend UI Redesign Tracker

Date: 2026-03-30
Owner: GitHub Copilot (GPT-5.3-Codex)
Design direction: Minimal monochrome (black/white), high readability, consistent spacing, cleaner information hierarchy.

## 1. Redesign Goals

- Move from mixed gradients/colors to a focused black/white visual system.
- Improve layout consistency: predictable headers, card spacing, and content width.
- Clarify screen intent at first glance for each route.
- Reduce visual clutter by standardizing chips, tables, buttons, and form fields.
- Keep all existing functionality unchanged while redesigning presentation.

## 2. Screen Intent + Component Context

### Auth

| Screen | Intent | Key Components | Current Layout Risk | Target Redesign |
|---|---|---|---|---|
| Login | Authenticate patient/doctor quickly | Hero header, demo account chips, login form, register CTA | Heavy gradients and mixed emphasis | Calm monochrome split card; clear hierarchy; compact demo helper |
| Registration | Guided account creation | Stepper, role selection, role-specific forms, review screen | Dense form sections and weak visual grouping | Minimal sectional surfaces with stronger spacing and step cues |

### Patient

| Screen | Intent | Key Components | Current Layout Risk | Target Redesign |
|---|---|---|---|---|
| Home | Quick patient landing with actions | Welcome panel, action cards, recent activity, safety notice | Competing cards and multiple visual styles | One primary summary band, restrained action grid, consistent cards |
| Report | Submit ADR report accurately | 3-step form, medication search, media upload, duplicate warning, speech input | Long dense form and inconsistent control emphasis | Structured step surfaces, clear labels, quieter controls |
| Reports | Review all submitted reports | Filter/search controls, status/severity cards, report list | Mixed chip styles and uneven section hierarchy | Unified list cards, cleaner filter rail, standardized status badges |
| ReportDetail | Understand one report status/outcome | Report summary, AI guidance, status timeline, doctor review, export/print | Many sections with similar visual weight | Clear section ranking: status -> guidance -> details -> actions |

### Doctor

| Screen | Intent | Key Components | Current Layout Risk | Target Redesign |
|---|---|---|---|---|
| DoctorHome | High-level monitoring and triage | KPI cards, charts, review queue, quick actions | Heavy gradients and dense color usage | Monochrome KPI surfaces with clear urgency accents |
| Dashboard | Analytics + report table | Search/filters, stats, charts, report table, export | Data-dense and visually noisy | Cleaner analytic grid, tighter table rhythm, simplified controls |
| ReviewRequests | Triage and submit doctor opinions | Review request cards, AI context accordion, review modal | High content density with weak grouping | Two-level grouping: request summary + expandable clinical detail |
| MedicationManagement | Manage medication catalog | Stats, tabs, filters, table, verify/delete dialogs | Inconsistent card/table rhythm | Cohesive admin table shell and cleaner action hierarchy |
| AddMedication | Create/update medication | Metadata form, strengths, tags, preview panel | Long form with many equal-emphasis blocks | Sectioned form flow with concise block headers |

### Shared

| Surface | Intent | Key Components | Current Layout Risk | Target Redesign |
|---|---|---|---|---|
| Global Theme | Design system foundation | Palette, typography, component overrides | Blue/red-heavy theme and mixed shadows | Strict monochrome tokens, subtle borders, minimal shadows |
| Navigation | Route orientation | Sidebar list, active state, user badge | Busy badges and mixed semantics | Cleaner icon/text rhythm, stronger active indicator |
| App Bar | Context + account controls | Title, user menu, notifications, theme/lang toggles | Gradient-heavy header competing with content | Low-noise utility header with minimal controls |
| Settings | Account preferences | Tabs, profile/security/notifications/appearance sections | Dense control surfaces with uneven spacing | Consistent settings section cards and cleaner switches |

## 3. Phase Plan

### Phase A - Discovery and planning
- [x] Map all screens and identify intent/components.
- [x] Define minimal monochrome redesign direction.
- [x] Create tracker with phase checklist and context map.

### Phase B - Design system foundation
- [x] Rewrite theme tokens for black/white first.
- [x] Standardize typography, shape, elevation, field and table styles.
- [x] Tighten global CSS baseline and surface background treatment.

### Phase C - Shared layout shell
- [x] Redesign Navigation.
- [x] Redesign App Bar.
- [x] Polish App content shell spacing on desktop/mobile.

### Phase D - Page redesign rollout
- [x] Auth screens: Login, Registration.
- [x] Patient screens: Home, Report, Reports, ReportDetail.
- [x] Doctor screens: DoctorHome, Dashboard, ReviewRequests.
- [x] Medication screens: MedicationManagement, AddMedication.
- [x] Settings screen.

### Phase E - Validation and polish
- [x] Run frontend build and resolve UI compile issues.
- [ ] Spot-check route rendering and responsive behavior.
- [x] Update tracker completion and summarize final deltas.

## 4. Progress Log

- 2026-03-30: Tracker created with full screen intent/context mapping.
- 2026-03-30: Implemented monochrome theme system in theme and global CSS (typography, borders, component defaults).
- 2026-03-30: Redesigned shared shell (Navigation, App Bar, main app content container) for consistent layout and hierarchy.
- 2026-03-30: Rolled out page-level redesign updates across auth, patient, doctor, medication, and settings screens.
- 2026-03-30: Build validation completed successfully; remaining warnings are limited to existing hook files outside redesign scope.
- 2026-03-31: Applied redesign correction pass: restored full semantic color palette and consistent component accents after over-monochrome feedback.
