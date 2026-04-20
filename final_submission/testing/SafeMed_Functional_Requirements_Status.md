# SafeMed Functional Requirements Status

Date: April 15, 2026

Wiki URL: <https://github.com/ImadeddinOuahidi/GDP-Group5/wiki>

Burndown Entry: <https://github.com/ImadeddinOuahidi/GDP-Group5/wiki/Burndown-Entry-Functional-Requirements-Status>

Functional Requirements Page: <https://github.com/ImadeddinOuahidi/GDP-Group5/wiki/Functional-Requirements-List---Final---Group-5>

## Automated Test Summary

- Backend command: `cd final_submission/demo/backend && npm test`
  - Result on April 15, 2026: `41` passing tests, `1` skipped integration test
  - Skip reason: the local backend runtime is missing the installed `amqplib` package required to load `app.js` for `app.integration.test.js`
- Frontend command: `cd final_submission/demo/frontend && npm test -- --watchAll=false --runInBand`
  - Result on April 15, 2026: `28` passing tests
- Mobile command: `cd final_submission/demo/mobile && npm test -- --runInBand`
  - Result on April 15, 2026: `13` passing tests

## Completed (Completely Tested and Working)

- None at this time.

## Completed (Has Tests but Needs More Tests or Fixes)

- `SHALL-1`: allow patients to submit adverse drug reaction reports through an online form.
  - Tests: [frontend report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/reportService.test.js), [mobile report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/services/reportService.test.js)
  - Notes: current coverage verifies service-layer submission paths, but not a full UI-to-database end-to-end submission flow.
- `SHALL-2`: validate submitted reports and required fields.
  - Tests: [frontend validation utility tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/utils/validation.test.js), [backend validation helper tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/validationHelper.test.js)
- `SHALL-4`: allow healthcare staff to view ADR reports through a secure login.
  - Tests: [frontend auth service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/authService.test.js), [mobile auth service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/services/authService.test.js), [frontend report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/reportService.test.js), [dashboard UI tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/pages/dashboard/Dashboard.test.js)
  - Notes: the automated coverage verifies authenticated login/profile behavior and report-access service calls, but not full dashboard UI workflows.
- `SHALL-7`: provide a secure method for uploading text reports, images, or voice recordings.
  - Tests: [backend upload validation tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/fileUpload.test.js), [frontend report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/reportService.test.js), [mobile upload service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/services/uploadService.test.js)
  - Notes: current coverage verifies upload validation, upload request building, and upload fallback behavior, but not a full MinIO-backed end-to-end upload flow.
- `SHALL-8`: restrict unauthorized access to patient reports.
  - Tests: [backend auth middleware tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/authMiddleware.test.js), [backend role authorization tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/roleAuth.test.js), [frontend API client tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/apiClient.test.js)
- `SHALL-9`: track the date and time of each report submission.
  - Tests: [backend report timestamp tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/reportSideEffect.test.js)
  - Notes: the model-level tests verify timestamp defaults and initial save behavior, but they do not yet prove end-to-end persistence across the full submission pipeline.
- `SHALL-10`: not store user passwords in plain text in the database.
  - Tests: [backend user password tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/userPassword.test.js)
  - Notes: the automated coverage verifies hashing and schema-level password exclusion, but not a full database inspection in a live deployment.
- `SHALL-11`: provide role-based access for patients, doctors, and administrators.
  - Tests: [backend auth middleware tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/authMiddleware.test.js), [backend role authorization tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/roleAuth.test.js), [frontend auth service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/authService.test.js)
- `SHALL-12`: provide error messages when validation fails.
  - Tests: [backend response helper tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/responseHelper.test.js), [frontend validation utility tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/utils/validation.test.js), [backend validation helper tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/validationHelper.test.js)
- `SHOULD-1`: allow staff to filter reports by severity, date, or drug name.
  - Tests: [dashboard UI tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/pages/dashboard/Dashboard.test.js)
  - Notes: the automated coverage now verifies severity, date-range, and drug-name filtering in the dashboard UI, but broader workflow and edge-case coverage is still limited.
- `SHOULD-2`: generate summary statistics.
  - Tests: [frontend report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/reportService.test.js), [mobile report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/services/reportService.test.js)
- `SHOULD-4`: allow patients to check the status of their report submission.
  - Tests: [frontend report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/reportService.test.js), [mobile report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/services/reportService.test.js), [patient report detail UI tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/pages/patient/ReportDetail.test.js)
  - Notes: current coverage verifies report retrieval, doctor review visibility, and status-related UI behavior, but not every status transition path.
- `SHOULD-5`: provide a printable summary of individual reports.
  - Tests: [frontend export and print utility tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/utils/exportUtils.test.js)
- `MAY-1`: allow exporting reports in standard formats.
  - Tests: [frontend export and print utility tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/utils/exportUtils.test.js)
  - Notes: current automated coverage verifies client-side CSV and JSON export helpers; backend export routes still need dedicated integration coverage.
- `MAY-2`: allow visualization of trends with charts and graphs.
  - Tests: [dashboard UI tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/pages/dashboard/Dashboard.test.js)
  - Notes: the automated coverage verifies that the chart sections render with expected trend and summary data, but it does not yet cover every visualization state or data edge case.

## Completed (Untestable)

- `SHALL-3`: store ADR reports securely in a database.
  - Rationale: the feature is implemented, but verifying the word `securely` accurately would require infrastructure and security validation beyond the current local test setup.
- `SHALL-14`: support both web and mobile clients.
  - Rationale: the project includes both clients and both now have passing automated tests, but a proper cross-platform verification still requires device and browser matrix testing that is not present in this repo.

## Completed (Untested)

- None at this time.

## Uncompleted

- `SHALL-5`: identify duplicate ADR reports using AI (ChatGPT) for review and merge them into a unique report.
  - Current state: duplicate detection and merge workflows exist and have automated coverage, but the final requirement explicitly calls for AI/ChatGPT-based duplicate identification and the full end-to-end review workflow is still not fully aligned.
  - Supporting tests for the partial implementation: [backend duplicate detection tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/duplicateDetectionService.test.js), [frontend report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/services/reportService.test.js), [mobile report service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/services/reportService.test.js)
- `SHALL-6`: mark reports with severity using AI.
  - Current state: automated tests cover the heuristic AI fallback path, but the full asynchronous AI severity pipeline still depends on external services and remains partially implemented.
  - Supporting tests for the partial implementation: [backend AI service tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/aiService.test.js)
- `SHALL-13`: provide English and multilingual support.
  - Current state: the repo now has automated coverage for translation resources in both web and mobile, but multilingual support is still incomplete across the full product surface.
  - Supporting tests for the partial implementation: [frontend locale coverage tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/frontend/src/i18n/locales.test.js), [mobile translation resource tests](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/mobile/src/i18n/translations.test.js)
- `SHOULD-3`: notify staff when a new urgent report is submitted.
  - Current state: notification infrastructure exists, but urgent-trigger delivery remains partial and environment-dependent.

## Notes

- This classification is based on the final functional requirements page in the wiki, the current implementation inside `final_submission/demo`, and the passing automated tests verified locally on April 15, 2026.
- For the tested categories, every listed requirement includes direct links to the repository source files that contain the automated tests being claimed.
- The backend also contains a skipped app-level integration test file for future use: [backend app integration test](https://github.com/ImadeddinOuahidi/GDP-Group5/blob/main/final_submission/demo/backend/test/unit/app.integration.test.js). It is currently skipped because the local backend runtime is missing `amqplib`.
