# Mobile vs Web Parity Tracker

Created: 2026-04-20
Scope: Compare mobile app behavior with web app and close functional gaps.

## Audit Summary

This tracker focuses on feature parity gaps that impact user behavior (not visual styling).

## Gap Register

| ID | Area | Web Behavior | Mobile Behavior (Before) | Gap | Priority | Status |
|---|---|---|---|---|---|---|
| G1 | Patient report duplicate pre-check | Duplicate pre-check includes patient context before submit | Duplicate pre-check payload omitted patient id | Lower duplicate matching accuracy and inconsistent warning behavior | High | Completed |
| G2 | Patient duplicate warning UX | Duplicate warning dialog shows candidate details (date/similarity) and explicit continue/edit flow | Alert-only warning with count, no candidate details | Missing context for patient decision before submit | High | Completed |
| G3 | Staff duplicate action safety | Duplicate candidate actions are disabled when already flagged/merged and while action is in-flight | Actions could be tapped repeatedly and did not enforce reviewState-based disabling | Risk of repeated operations and inconsistent UX | High | Completed |
| G4 | Staff analytics parity | Web exposes dedicated dashboard route for analytics and operational insight | Mobile had no dedicated analytics screen in staff stack | Missing equivalent analytics entry point on mobile | Medium | Completed |

## Implementation Plan

1. Fix duplicate pre-check payload parity in patient report submission flow.
2. Add detailed duplicate warning modal in mobile report flow with top candidate summary and explicit continue/edit actions.
3. Add action-state and review-state guards for duplicate candidate actions in doctor review flow.
4. Add a mobile staff analytics screen and navigation entry to mirror web dashboard capability.
5. Run file-level error checks and smoke validations.

## Validation Checklist

- [x] Duplicate check payload contains medicine + patient + sideEffects + reportDetails.
- [x] Duplicate warning modal appears with candidate list and allows safe cancel/continue.
- [x] Flag/Merge buttons are disabled for flagged/merged candidates and while request in progress.
- [x] Staff can open analytics screen from dashboard stack.
- [x] No new errors in modified files.
- [x] Partial or invalid date filter input no longer sends invalid date query parameters.
- [x] AI processing failure reason is visible in mobile review details when analysis fails.
- [x] Remaining medication verification and severity labels are localized across staff screens.

## Change Log

- 2026-04-20: Tracker created; gap audit captured; implementation started.
- 2026-04-20: G1 + G2 completed in mobile patient report flow.
	Files: src/screens/patient/ReportScreen.js
	Notes: Added patient id to duplicate payload and replaced alert-only warning with detailed modal list + explicit continue/edit handlers.
- 2026-04-20: G3 completed in staff duplicate workflow.
	Files: src/screens/doctor/ReviewRequestsScreen.js
	Notes: Added in-flight and review-state button guards, loading indicators, and duplicate analysis source display.
- 2026-04-20: G4 completed with new staff analytics route.
	Files: src/screens/doctor/AnalyticsScreen.js, src/navigation/MainNavigator.js, src/screens/doctor/DoctorHomeScreen.js, src/screens/doctor/index.js, src/i18n/translations.js
	Notes: Added dedicated analytics screen and wired admin quick action + navigation stack entry.
- 2026-04-20: Validation complete.
	Files checked: src/screens/patient/ReportScreen.js, src/screens/doctor/ReviewRequestsScreen.js, src/screens/doctor/DoctorHomeScreen.js, src/navigation/MainNavigator.js, src/screens/doctor/AnalyticsScreen.js, src/i18n/translations.js
	Notes: VS Code Problems check reports no new errors in modified files.
- 2026-04-20: Second-pass parity hardening completed after re-audit.
	Files: src/screens/doctor/ReviewRequestsScreen.js, src/screens/doctor/DoctorHomeScreen.js, src/screens/doctor/AnalyticsScreen.js, src/i18n/translations.js
	Notes: Date filters now sanitize to valid ISO dates before request; AI failed-processing reason is rendered in review details; hardcoded medication verification labels and severity text were replaced with i18n keys.
