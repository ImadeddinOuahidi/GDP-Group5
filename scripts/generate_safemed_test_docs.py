#!/usr/bin/env python3
from __future__ import annotations

import html
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "final_submission" / "testing"
TEST_PLAN_TEMPLATE = Path("/Users/ S580723/Downloads/Test plan Template.docx")
TEST_CASE_TEMPLATE = Path("/Users/ S580723/Downloads/TestCase.xlsx")

REPO_URL = "https://github.com/ImadeddinOuahidi/GDP-Group5"
FR_URL = f"{REPO_URL}/wiki/Functional-Requirements-List---Final---Group-5"
WIKI_URL = f"{REPO_URL}/wiki"

TEAM_MEMBERS = [
    "Imadeddin Ouahidi",
    "Anji Reddy Modugula",
    "Lohitha Vodnala",
]

AUTHORS = TEAM_MEMBERS[:]


FEATURES_TO_BE_TESTED = [
    (
        "Authentication and account lifecycle",
        "Patient/doctor registration, sign-in, email verification, password change, profile updates, and secured session handling.",
        "FR4, FR8, FR10, FR11, FR12",
    ),
    (
        "Medication discovery and management",
        "Search, popular/category browsing, patient-created medications, and doctor/admin medication CRUD.",
        "FR1, FR2, FR11, FR12",
    ),
    (
        "Patient ADR report submission",
        "Manual ADR reporting with medicine, dosage, symptoms, severity, onset, and submission timestamps on web and mobile.",
        "FR1, FR2, FR3, FR9, FR14",
    ),
    (
        "Voice, photo, and file-assisted reporting",
        "Voice-to-text capture, media attachment upload, upload validation, and secure file handling.",
        "FR1, FR6, FR7, FR12, FR14",
    ),
    (
        "Doctor review and report status workflow",
        "Pending review queue, patient review requests, doctor review submission, report status updates, and doctor assignment.",
        "FR4, FR8, FR11, SHOULD4",
    ),
    (
        "AI analysis and prioritization",
        "AI-assisted extraction endpoints, async severity analysis, AI metadata, patient guidance, and prioritization flags.",
        "FR5, FR6",
    ),
    (
        "Duplicate detection",
        "Pre-submission duplicate checks, staff duplicate flagging, and duplicate statistics.",
        "FR5 (merge remains partial)",
    ),
    (
        "Notifications",
        "Unread counts, notification listing, mark-read flows, and web SSE/mobile polling behavior.",
        "SHOULD3 (partial in current demo)",
    ),
    (
        "Export and printable summaries",
        "Report exports in JSON/CSV and printable single-report detail views.",
        "SHOULD5, MAY1",
    ),
    (
        "Symptom progression tracking",
        "Progression creation, progression entries, patient/provider lookup, and status updates via API.",
        "Implemented enhancement beyond final FR list",
    ),
    (
        "Cross-platform and multilingual smoke coverage",
        "SafeMed web and mobile parity checks, with English default and partial French/Spanish UI verification where supported.",
        "FR13, FR14",
    ),
]

FEATURES_NOT_TO_BE_TESTED = [
    (
        "Full duplicate report merging",
        "The wiki/client notes and codebase show duplicate scoring and flagging, but not complete merge behavior.",
    ),
    (
        "Full multilingual translation coverage",
        "Language support is present only on selected screens and remains incomplete for the whole system.",
    ),
    (
        "Visualization and graph analytics UI",
        "Client meeting notes mark visualization/statistics UI work as pending.",
    ),
    (
        "Formal performance and 500-user load validation",
        "This requires a dedicated load-testing environment and deployment instrumentation.",
    ),
    (
        "Infrastructure failover, disaster recovery, and uptime SLA proof",
        "These are deployment-level checks and are not fully verifiable from the local demo repository alone.",
    ),
    (
        "Formal security penetration testing, TLS/AES deployment verification, and virus scanning",
        "These controls depend on runtime infrastructure and security tooling outside the checked-in demo stack.",
    ),
    (
        "Custom print/PDF layout design",
        "The current project supports browser/mobile print/export flows, but the customized print layout is not finished.",
    ),
    (
        "MFA for staff",
        "It appears in non-functional goals but is not implemented as a completed demo workflow in the codebase.",
    ),
]


def case(
    case_id: str,
    title: str,
    prerequisites: list[str],
    test_data: list[str],
    scenario: str,
    steps: list[tuple[str, str]],
) -> dict:
    idx = int(case_id.split("_")[-1]) - 1
    return {
        "id": case_id,
        "title": title,
        "created_by": AUTHORS[idx % len(AUTHORS)],
        "reviewed_by": AUTHORS[(idx + 1) % len(AUTHORS)],
        "tester": "QA Team",
        "date_tested": "TBD",
        "status": "Not Executed",
        "version": "V1",
        "prerequisites": prerequisites[:4],
        "test_data": test_data[:4],
        "scenario": scenario,
        "steps": steps[:8],
    }


TEST_CASES = [
    case(
        "SM_TC_001",
        "Patient Registration",
        [
            "SafeMed web or mobile registration screen is reachable.",
            "The backend auth service is running.",
            "A unique patient email and phone number are available.",
            "Required patient demographics and address data are prepared.",
        ],
        [
            'Email: "patient.new@test.com"',
            'Password: "SafeMed123"',
            'Role: "patient"',
            'Emergency Contact: "Sam Doe / +1-555-111-2222"',
        ],
        "Verify that a patient can create an account with valid data and that invalid or duplicate registration data is rejected with clear feedback.",
        [
            ("Open the registration form.", "The registration screen loads successfully."),
            ("Enter valid patient information and submit the form.", "The form accepts the values without client-side errors."),
            ("Complete registration with all required fields.", "A success response is returned and the patient account is created."),
            ("Repeat registration with the same email address.", "The system rejects the duplicate account and shows an explanatory error."),
            ("Submit the form with a required field missing.", "Validation blocks submission and highlights the missing data."),
        ],
    ),
    case(
        "SM_TC_002",
        "Doctor Registration",
        [
            "SafeMed registration screen is reachable.",
            "The backend auth service is running.",
            "A unique doctor email is available.",
            "Doctor license and specialization details are prepared.",
        ],
        [
            'Email: "doctor.new@test.com"',
            'Password: "SafeMed123"',
            'Role: "doctor"',
            'License: "DOC-654321 / General Medicine"',
        ],
        "Verify that a doctor account can be created only when required doctor-specific information is supplied.",
        [
            ("Open the registration form and select the doctor role.", "Doctor-specific fields become available."),
            ("Enter valid identity, address, and doctor profile details.", "The form accepts the doctor information."),
            ("Submit the completed form.", "A new doctor account is created successfully."),
            ("Retry submission without a license number or specialization.", "The request is rejected with validation errors for doctor fields."),
        ],
    ),
    case(
        "SM_TC_003",
        "Valid Sign-In and Role Routing",
        [
            "Seeded demo patient and doctor accounts exist.",
            "SafeMed web or mobile login page is reachable.",
            "Backend auth service is running.",
            "Local storage/secure storage is available for token persistence.",
        ],
        [
            'Patient: "patient@demo.com / Demo@123"',
            'Doctor: "doctor@demo.com / Demo@123"',
            'Expected patient landing: patient home',
            'Expected doctor landing: doctor dashboard/review shell',
        ],
        "Verify that valid users can sign in and are routed to the correct experience for their role.",
        [
            ("Log in with the patient demo account.", "Authentication succeeds and the patient home/reporting experience loads."),
            ("Sign out, then log in with the doctor demo account.", "Authentication succeeds and the doctor dashboard/review experience loads."),
            ("Refresh the active session.", "The authenticated session remains available until logout/token expiry."),
            ("Inspect stored auth state after login.", "A valid user profile and token are persisted for the session."),
        ],
    ),
    case(
        "SM_TC_004",
        "Invalid Sign-In and Error Feedback",
        [
            "The SafeMed login screen is reachable.",
            "At least one real user account exists.",
            "Backend auth service is running.",
        ],
        [
            'Known user: "patient@demo.com"',
            'Wrong password: "WrongPass123"',
            'Unknown user: "missing@test.com"',
            'Blank password input',
        ],
        "Verify that the login flow rejects invalid credentials and returns clear error feedback without authenticating the user.",
        [
            ("Attempt login with a valid email and wrong password.", "The system rejects the request and shows an invalid credentials message."),
            ("Attempt login with an unknown email address.", "The system rejects the request and does not create a session."),
            ("Attempt login without a password.", "Client/server validation blocks the request and displays a required-field error."),
            ("Inspect the application after each failed attempt.", "The user remains unauthenticated and protected pages stay inaccessible."),
        ],
    ),
    case(
        "SM_TC_005",
        "Email Verification Token Validation",
        [
            "An unverified account with a valid verification token is available.",
            "The verify-email endpoint is reachable.",
            "Mail/token generation is enabled in the environment or test fixtures.",
        ],
        [
            'Valid token from a newly registered account',
            'Invalid token: "bad-token"',
            'Expired token fixture',
        ],
        "Verify that email verification succeeds only for a valid active token and fails safely for bad or expired tokens.",
        [
            ("Open the verification flow using a valid token.", "The account is marked verified and a success message is returned."),
            ("Repeat the flow with an invalid token.", "The system rejects the token and returns a clear failure response."),
            ("Repeat the flow with an expired token.", "The system rejects the expired token and keeps the account unverified."),
        ],
    ),
    case(
        "SM_TC_006",
        "Resend Verification Email",
        [
            "An unverified SafeMed account exists.",
            "The resend verification endpoint is reachable.",
            "SMTP or an email test stub is configured.",
        ],
        [
            'Unverified email: "unverified@test.com"',
            'Verified email: "patient@demo.com"',
            'Unknown email: "missing@test.com"',
        ],
        "Verify that verification emails can be reissued for valid unverified accounts and are handled safely for other cases.",
        [
            ("Submit a resend request for a valid unverified account.", "The system accepts the request and queues/sends a verification email."),
            ("Submit a resend request for an already verified account.", "The system returns a controlled response without creating duplicate verification state."),
            ("Submit a resend request for an unknown account.", "The system handles the request safely without exposing sensitive account details."),
        ],
    ),
    case(
        "SM_TC_007",
        "View and Update Profile",
        [
            "A patient or doctor account is logged in.",
            "The profile/settings screen is reachable.",
            "Auth and profile APIs are available.",
        ],
        [
            'Phone: "+1-555-800-1000"',
            'First Name: "Updated"',
            'Last Name: "Profile"',
            'Profile picture file (optional)',
        ],
        "Verify that authenticated users can view their profile data and update supported profile fields successfully.",
        [
            ("Open the profile or settings screen.", "The current user information is displayed."),
            ("Edit supported text fields such as first name, last name, or phone number.", "The form accepts the changes."),
            ("Save the updated profile.", "The backend persists the updates and the UI refreshes with the new values."),
            ("Reload the screen or sign in again.", "The updated profile data is retained."),
        ],
    ),
    case(
        "SM_TC_008",
        "Profile Picture Upload",
        [
            "An authenticated user is on a profile/settings screen.",
            "Image upload permission is available on the device/browser.",
            "The profile picture update endpoint is reachable.",
        ],
        [
            "Valid JPG profile image",
            "Unsupported file type fixture",
            "Large image file fixture",
        ],
        "Verify that profile picture upload works for a supported image and fails gracefully for invalid inputs.",
        [
            ("Choose a valid image as the profile picture.", "The file picker accepts the image."),
            ("Submit the profile picture update.", "The image uploads successfully and the new avatar is displayed."),
            ("Attempt to upload an unsupported or corrupt file.", "The upload is rejected with a clear error."),
            ("Refresh the profile screen.", "The successfully uploaded profile image remains associated with the account."),
        ],
    ),
    case(
        "SM_TC_009",
        "Change Password",
        [
            "An authenticated SafeMed user exists.",
            "The change-password feature is reachable.",
            "The user knows the current password.",
        ],
        [
            'Current password: "Demo@123"',
            'New password: "NewDemo@123"',
            'Mismatched confirmation value',
        ],
        "Verify that a user can change the password with valid credentials and that invalid password-change requests are blocked.",
        [
            ("Open the change-password screen.", "The password change form loads successfully."),
            ("Enter the correct current password and a valid new password.", "Client-side validation accepts the new password."),
            ("Submit the password change request.", "The backend updates the password and returns success."),
            ("Log out and sign in with the new password.", "Authentication succeeds with the new password."),
            ("Retry with mismatched confirmation or wrong current password.", "The request is rejected with an explanatory error."),
        ],
    ),
    case(
        "SM_TC_010",
        "Medication Search and Category Browsing",
        [
            "An authenticated patient or doctor session is active.",
            "Medication seed data is present.",
            "Medication search/popular/category endpoints are reachable.",
        ],
        [
            'Exact query: "ibuprofen"',
            'Fuzzy query: "acetaminofen"',
            'Category: "Cardiovascular"',
            'Popular medication request',
        ],
        "Verify that authenticated users can browse popular medications, search by name, and use category filtering successfully.",
        [
            ("Open the medication selection/search experience.", "Popular medications load without error."),
            ("Search using an exact medication name.", "Matching medications are returned."),
            ("Search using a misspelled medication name.", "Relevant fuzzy suggestions or matches are returned."),
            ("Browse a medication category.", "Only medications for the selected category are displayed."),
        ],
    ),
    case(
        "SM_TC_011",
        "Patient-Created Medication",
        [
            "A patient account is logged in.",
            "The report form or patient medication creation flow is reachable.",
            "The target medication does not already exist in the catalog.",
        ],
        [
            'Medication name: "Herbal Calm Plus"',
            'Generic name: "Unknown"',
            'Category: "Supplement"',
            'Dosage Form: "Capsule"',
        ],
        "Verify that a patient can create a custom medication entry when the medicine is not found in the predefined catalog.",
        [
            ("Open the medication search flow and confirm the medicine is not listed.", "No existing catalog match is selected."),
            ("Choose the option to add a patient medication.", "A new medication form opens."),
            ("Enter valid custom medication details and submit.", "The system creates a patient-sourced medication successfully."),
            ("Return to the report form.", "The new medication is selectable and linked to the report flow."),
        ],
    ),
    case(
        "SM_TC_012",
        "Doctor Medication Create and Update",
        [
            "A doctor or admin account is logged in.",
            "Medication management pages are reachable.",
            "Medication API endpoints are available.",
        ],
        [
            'Medication name: "TestMed XR"',
            'Category: "Neurological"',
            'Dosage Form: "Tablet"',
            'Strengths: "10mg, 20mg"',
        ],
        "Verify that a doctor can create and update medication records used by patients during ADR reporting.",
        [
            ("Open the medication management screen.", "Existing medications are listed."),
            ("Create a new medication with valid details.", "The medication is added successfully and becomes visible in the list."),
            ("Edit the newly created medication.", "The edit form loads the saved medication data."),
            ("Update fields such as description or common strengths and save.", "The medication record is updated successfully."),
        ],
    ),
    case(
        "SM_TC_013",
        "Web Manual ADR Report Submission",
        [
            "A patient is logged into the SafeMed web client.",
            "At least one medication is available.",
            "Report submission APIs are reachable.",
        ],
        [
            'Medication: "Aspirin"',
            'Dosage: "100mg once daily"',
            'Side effect: "Severe stomach pain"',
            'Onset: "Within days"',
        ],
        "Verify that a patient can submit a complete ADR report through the web stepper flow and receive a persisted report.",
        [
            ("Open the web report submission page.", "The report stepper loads successfully."),
            ("Complete the basic medication and usage information step.", "The form accepts the medication and dosage details."),
            ("Complete the symptom description step.", "The symptom data is accepted."),
            ("Complete the final details and submit the report.", "The report is created successfully and a success message is shown."),
            ("Open the patient report history.", "The new report appears with a timestamp and status."),
        ],
    ),
    case(
        "SM_TC_014",
        "Mobile ADR Report Submission with Attachments",
        [
            "A patient is logged into the mobile app.",
            "Camera/gallery permissions are granted.",
            "Upload and report APIs are reachable.",
            "At least one medication is available.",
        ],
        [
            'Medication: "Amoxicillin"',
            'Attachment: valid rash photo',
            'Symptoms: "Itchy red rash on arms"',
            'Start date: valid incident date',
        ],
        "Verify that the mobile report flow supports attachments and creates a report successfully.",
        [
            ("Open the mobile report screen and select a medication.", "The selected medication is stored in the form."),
            ("Attach a valid image from the camera or gallery.", "The attachment preview is shown in the report form."),
            ("Complete the remaining report fields and submit.", "The app uploads the attachment and creates the report successfully."),
            ("Open the report detail/history screen.", "The report is visible and linked to the submitted data."),
        ],
    ),
    case(
        "SM_TC_015",
        "Voice-to-Text Symptom Capture",
        [
            "A report form is open on a supported web browser or supported mobile dev build.",
            "Microphone permission is granted.",
            "Speech recognition is available in the current environment.",
        ],
        [
            'Spoken phrase: "I took aspirin and developed dizziness and nausea"',
            "Microphone permission grant",
        ],
        "Verify that speech input populates the symptom description field and can be used in the report flow.",
        [
            ("Start voice capture from the report form.", "The UI shows that speech recognition is active."),
            ("Speak a symptom description clearly.", "The spoken text is transcribed into the symptoms field."),
            ("Stop voice capture.", "The microphone session ends cleanly."),
            ("Continue the report flow using the transcribed text.", "The captured text remains editable and usable for submission."),
        ],
    ),
    case(
        "SM_TC_016",
        "Upload API Validation and File Limits",
        [
            "An authenticated session is available.",
            "The upload service is configured or can report its status.",
            "Valid and invalid sample files are available.",
        ],
        [
            "Valid JPG file",
            "Valid PDF/audio file",
            "Unsupported EXE file",
            "Oversized or too-many-files upload request",
        ],
        "Verify that the upload API accepts supported file types and rejects disallowed types or limit violations with clear errors.",
        [
            ("Check upload service availability.", "The upload status endpoint reports service availability clearly."),
            ("Upload a supported single file.", "The API stores the file and returns file metadata."),
            ("Upload multiple supported files within limits.", "The API returns success and a file summary."),
            ("Attempt to upload an unsupported file type or exceed limits.", "The API rejects the request with a validation error."),
        ],
    ),
    case(
        "SM_TC_017",
        "Report Validation and Error Messages",
        [
            "A patient is logged in.",
            "The report form is reachable.",
            "Client- and server-side validation are enabled.",
        ],
        [
            "Missing medication value",
            "Missing symptoms text",
            "Missing start/incident date",
            "Empty dosage/frequency fields",
        ],
        "Verify that incomplete or invalid ADR report submissions are blocked and produce meaningful validation messages.",
        [
            ("Attempt to move past the medication step without selecting a medication.", "The UI shows a required-field validation message."),
            ("Attempt to continue without symptom text.", "The user is prompted to describe the side effect."),
            ("Attempt final submission with missing required dates or dosage fields.", "The system blocks submission and identifies the missing values."),
            ("Review the displayed errors.", "The errors are clear, actionable, and tied to the failing input."),
        ],
    ),
    case(
        "SM_TC_018",
        "Patient Report History and Status Tracking",
        [
            "A patient account is logged in.",
            "At least one report exists for that patient.",
            "Report list/detail endpoints are reachable.",
        ],
        [
            "Existing patient report with status Submitted/Reviewed",
            "Patient report history screen",
        ],
        "Verify that a patient can review previously submitted ADR reports and see current status, timestamps, and details.",
        [
            ("Open the patient reports list.", "The system shows only the patient's own reports."),
            ("Inspect the status, date, and summary fields on the list.", "Each report shows meaningful tracking information."),
            ("Open a report detail page.", "Detailed ADR information is displayed for the selected report."),
            ("Return to the list and refresh.", "The list remains consistent and reflects current report status."),
        ],
    ),
    case(
        "SM_TC_019",
        "Role-Based Access to Report Details",
        [
            "Two different user accounts exist, each with distinct report data.",
            "A patient account and a doctor/admin account are available.",
            "Protected report detail endpoints are reachable.",
        ],
        [
            "Patient A report ID",
            "Patient B access token",
            "Doctor access token",
        ],
        "Verify that patients cannot access other patients' reports while healthcare staff can access reports required for review.",
        [
            ("Sign in as Patient B and request Patient A's report detail/export.", "The system returns access denied."),
            ("Sign in as Patient A and request the same report.", "The system returns the report successfully."),
            ("Sign in as a doctor and open the report for review.", "The doctor can access the report as expected."),
        ],
    ),
    case(
        "SM_TC_020",
        "Doctor Dashboard Statistics",
        [
            "A doctor account is logged in.",
            "Seeded reports exist in the database.",
            "Dashboard/statistics endpoints are reachable.",
        ],
        [
            "Doctor demo account",
            "Seeded demo reports",
        ],
        "Verify that the doctor dashboard loads high-level report statistics needed for triage and monitoring.",
        [
            ("Open the doctor dashboard.", "Dashboard cards and summary widgets load without authorization errors."),
            ("Review totals by report status or priority.", "The displayed counts are populated from report data."),
            ("Refresh the dashboard after new/updated reports exist.", "The statistics reflect the latest persisted data."),
        ],
    ),
    case(
        "SM_TC_021",
        "Pending Review Queue",
        [
            "A doctor account is logged in.",
            "At least one report has doctorReview.status set to pending.",
            "Pending review APIs are reachable.",
        ],
        [
            "Report with requested review",
            "AI-processed report metadata",
        ],
        "Verify that doctors can view the pending review queue and inspect AI-assisted context before responding.",
        [
            ("Open the pending review screen.", "Only review-requested reports are listed."),
            ("Inspect a queue item.", "Patient, medicine, severity, and request reason are visible."),
            ("Expand or open the AI analysis summary.", "AI-generated guidance and recommendations are available for the doctor."),
        ],
    ),
    case(
        "SM_TC_022",
        "Patient Request Doctor Review",
        [
            "A patient account is logged in.",
            "At least one submitted report exists for the patient.",
            "The request-review endpoint is reachable.",
        ],
        [
            'Review reason: "Please advise whether I should stop the medication."',
            "Existing patient report ID",
        ],
        "Verify that a patient can request a doctor's review for an existing ADR report and that the request becomes visible to staff.",
        [
            ("Open a submitted patient report detail page.", "The report detail view loads successfully."),
            ("Enter a reason and request doctor review.", "The request is accepted and linked to the report."),
            ("Refresh the report detail and doctor review queue.", "The report shows review-request metadata and appears in the doctor's pending review list."),
        ],
    ),
    case(
        "SM_TC_023",
        "Doctor Review Submission",
        [
            "A doctor account is logged in.",
            "A report exists in the pending review queue.",
            "The submit-review endpoint is reachable.",
        ],
        [
            'Remarks: "Monitor symptoms and discontinue if bleeding increases."',
            'Recommendation: "Schedule follow-up appointment"',
            'Action Required: "monitor"',
        ],
        "Verify that a doctor can submit a review response for a requested ADR report and that the report is updated accordingly.",
        [
            ("Open a pending review item.", "The report review modal/detail opens successfully."),
            ("Enter doctor remarks, recommendation, and action.", "The review form accepts the response."),
            ("Submit the review.", "The system stores the doctor review successfully."),
            ("Reload the report and patient-facing detail.", "The report now shows completed review data and follow-up information."),
        ],
    ),
    case(
        "SM_TC_024",
        "Report Status Update and Doctor Assignment",
        [
            "A doctor or admin account is logged in.",
            "At least one report exists in Submitted or Under Review state.",
            "The update-status endpoint is reachable.",
        ],
        [
            'Target status: "Under Review"',
            "Assigned doctor ID",
            'Follow-up comment: "Escalated for clinical review"',
        ],
        "Verify that healthcare staff can update report status, add comments, and assign the report to a doctor when needed.",
        [
            ("Open a report management/detail view.", "The current report status is shown."),
            ("Change the report status and optionally assign a doctor.", "The update request is accepted."),
            ("Add a status comment or follow-up note.", "The comment is attached to the report history."),
            ("Refresh the report detail.", "The new status, assignee, and follow-up note are persisted."),
        ],
    ),
    case(
        "SM_TC_025",
        "Pre-Submission Duplicate Check",
        [
            "A similar ADR report already exists in the database.",
            "The duplicate pre-check endpoint is reachable.",
            "Authenticated user access is available.",
        ],
        [
            "Existing medicine and side-effect combination",
            "Similar incident date",
            "Dissimilar control payload",
        ],
        "Verify that SafeMed warns users when a new report is similar to an existing ADR report before final submission.",
        [
            ("Submit a duplicate-check request using data similar to an existing report.", "The API returns potential duplicate matches with similarity details."),
            ("Review the warning/duplicate response.", "The system clearly indicates that similar reports were found."),
            ("Submit a duplicate-check request with unrelated data.", "The API reports no duplicates detected."),
        ],
    ),
    case(
        "SM_TC_026",
        "Staff Duplicate Flagging and Statistics",
        [
            "A doctor or admin account is logged in.",
            "Potential duplicates are available for review.",
            "Duplicate detail/statistics endpoints are reachable.",
        ],
        [
            "Report ID with duplicates",
            "Target duplicate-of report ID",
        ],
        "Verify that staff can inspect duplicate candidates, flag confirmed duplicates, and review duplicate analytics.",
        [
            ("Open the duplicate candidates for a report.", "The system returns similarity scores and matching details."),
            ("Flag a report as a confirmed duplicate of another report.", "The report is updated with duplicate metadata successfully."),
            ("Open duplicate statistics.", "The duplicate analytics endpoint returns counts and summary information."),
        ],
    ),
    case(
        "SM_TC_027",
        "Async AI Analysis and Severity Tagging",
        [
            "A report exists with AI processing enabled or seeded AI metadata.",
            "RabbitMQ/consumer services are running or seeded AI-processed reports are available.",
            "Report detail endpoints are reachable.",
        ],
        [
            "Report with severe side-effect text",
            "AI-processed demo report fixture",
        ],
        "Verify that SafeMed stores AI analysis results such as severity, priority, guidance, and processing metadata on ADR reports.",
        [
            ("Submit a report for AI processing or open an existing AI-processed report.", "The report is queued for processing or already contains AI metadata."),
            ("Inspect the report after processing completes.", "The report shows AI processed flags and timestamps."),
            ("Review severity, priority, summary, and patient guidance fields.", "The AI analysis metadata is populated and accessible to the appropriate role."),
        ],
    ),
    case(
        "SM_TC_028",
        "Notifications and Mark-Read Flow",
        [
            "A logged-in user has at least one unread notification.",
            "Notification endpoints are reachable.",
            "Web SSE or mobile polling is available in the environment.",
        ],
        [
            "Unread notification ID",
            "Status update or review completion event",
        ],
        "Verify that notifications are delivered to users, counted correctly, and can be marked read individually or in bulk.",
        [
            ("Open the notifications screen or establish the web SSE stream.", "Recent notifications and unread count are loaded."),
            ("Trigger or inspect a new review/status notification.", "The new notification appears for the user."),
            ("Mark a single notification as read.", "Unread count decreases and the notification state updates."),
            ("Use mark-all-read.", "All unread notifications are updated successfully."),
        ],
    ),
    case(
        "SM_TC_029",
        "Export Report List in JSON and CSV",
        [
            "A doctor account is logged in.",
            "Report export endpoints are reachable.",
            "Reports exist for the chosen filter range.",
        ],
        [
            'Format: "json"',
            'Format: "csv"',
            'Filter: priority=High',
            'Filter: date range and medicine',
        ],
        "Verify that SafeMed can export filtered report collections in structured JSON and CSV formats.",
        [
            ("Request a JSON export for reports.", "The API returns structured export data successfully."),
            ("Request a CSV export for the same filter set.", "The API returns a downloadable CSV payload with headers."),
            ("Compare the filtered results.", "The exported content matches the requested filter criteria."),
        ],
    ),
    case(
        "SM_TC_030",
        "Export Single Report and Printable Summary",
        [
            "A patient or doctor account is logged in.",
            "A valid report exists for export.",
            "Single-report export endpoint is reachable.",
        ],
        [
            "Existing report ID",
            'Format: "json"',
            'Format: "csv"',
        ],
        "Verify that a single ADR report can be exported for review or print usage and that access rules are enforced.",
        [
            ("Request a single report export using an authorized account.", "The API returns detailed structured report data."),
            ("Export the same report in CSV format.", "A flattened CSV representation is returned."),
            ("Open the printable/report detail view in the client.", "The report content is presented in a print-friendly detail layout."),
            ("Attempt the same export with an unauthorized patient account.", "The system rejects the request with access denied."),
        ],
    ),
    case(
        "SM_TC_031",
        "Symptom Progression Workflow",
        [
            "A report with at least one side effect exists.",
            "A patient or doctor account is authenticated.",
            "Symptom progression endpoints are reachable.",
        ],
        [
            "Report ID",
            "Side effect ID",
            'Severity entry: "Moderate / numericScore 5"',
            'Status update: "Resolved"',
        ],
        "Verify that symptom progression records can be created from a report, updated with entries, and retrieved later.",
        [
            ("Create a symptom progression from an existing report/side effect.", "A new progression record is created successfully."),
            ("Add a progression entry with severity, pattern, and notes.", "The entry is appended to the progression timeline."),
            ("Retrieve the patient's progressions.", "The created progression appears in the patient progression list."),
            ("Update the progression status.", "The progression status changes successfully and remains queryable."),
        ],
    ),
    case(
        "SM_TC_032",
        "Cross-Platform and Multilingual Smoke Test",
        [
            "The SafeMed web app and mobile app are both available.",
            "A patient account is available for both clients.",
            "The multilingual build/resources are present where supported.",
        ],
        [
            "Web login session",
            "Mobile login session",
            'Languages: English, French, Spanish (partial support)',
        ],
        "Verify that the core SafeMed workflow is reachable on both web and mobile, and that language switching works on the screens currently wired for localization.",
        [
            ("Log in as the same patient on the web app.", "The web patient home/report flow loads successfully."),
            ("Log in as the same patient on the mobile app.", "The mobile patient tabs and report flow load successfully."),
            ("Navigate through key screens on both platforms.", "The core reporting, reports, notifications, and profile features are reachable on both clients."),
            ("Switch the language where the UI exposes localization.", "Translated labels appear on supported screens without breaking navigation."),
            ("Inspect unsupported or partial areas.", "Any untranslated elements are limited to known partial multilingual coverage and do not crash the app."),
        ],
    ),
]


def html_list(items: Iterable[str]) -> str:
    return "<ul>" + "".join(f"<li>{html.escape(item)}</li>" for item in items) + "</ul>"


def html_table(headers: list[str], rows: list[tuple[str, ...]]) -> str:
    head = "".join(f"<th>{html.escape(h)}</th>" for h in headers)
    body = []
    for row in rows:
        body.append("<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>")
    return f"<table><thead><tr>{head}</tr></thead><tbody>{''.join(body)}</tbody></table>"


def build_test_plan_html() -> str:
    features_rows = [
        tuple(html.escape(col) for col in row)
        for row in FEATURES_TO_BE_TESTED
    ]
    excluded_rows = [
        tuple(html.escape(col) for col in row)
        for row in FEATURES_NOT_TO_BE_TESTED
    ]
    tools_backend = [
        "Swagger UI, Postman/curl, and direct API verification for the Express backend.",
        "MongoDB seed/demo data for deterministic patient, doctor, medication, and report scenarios.",
        "RabbitMQ and the consumer worker for async AI-processing verification.",
        "MinIO/S3-compatible storage validation for report attachments and exported content.",
    ]
    tools_clients = [
        "Manual browser testing for the React/MUI web application.",
        "Manual device/emulator testing for the Expo/React Native mobile client.",
        "Existing repository test scaffolding: React Testing Library/Jest on web, Jest on mobile, and backend Supertest/Jest scripts that can be extended later.",
    ]
    methods = [
        "Functional testing of patient, doctor, and admin-facing scenarios.",
        "API and integration testing across auth, reports, medications, uploads, notifications, exports, and symptom progression.",
        "Role-based access validation for protected report and export flows.",
        "Cross-platform smoke testing across the web and mobile clients.",
        "AI-assisted workflow verification using seeded data, async processing, and report metadata inspection.",
    ]
    deliverables = [
        "SafeMed Test Plan (`.docx` and HTML source).",
        "SafeMed Test Case workbook (`.xlsx`) aligned to the template structure.",
        "Execution status placeholders marked `Not Executed` so the team can record live QA results later.",
    ]

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SafeMed Test Plan</title>
  <style>
    body {{
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.45;
      margin: 36px;
      color: #111;
    }}
    h1, h2, h3 {{
      color: #13294b;
      margin-bottom: 6px;
    }}
    p, li {{
      font-size: 11pt;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 18px;
      font-size: 10.5pt;
    }}
    th, td {{
      border: 1px solid #666;
      padding: 8px;
      vertical-align: top;
      text-align: left;
    }}
    th {{
      background: #eaf0f8;
    }}
    .meta {{
      margin-bottom: 18px;
    }}
  </style>
</head>
<body>
  <h1>SafeMed Test Plan</h1>
  <div class="meta">
    <p><strong>Group #5 Project title:</strong> SafeMed ADR Reporting System</p>
    <p><strong>Team Members:</strong> Imadeddin Ouahidi, Anji Reddy Modugula, Lohitha Vodnala</p>
    <p><strong>Date:</strong> March 2026</p>
    <p><strong>The test plan GitHub link:</strong> <a href="{html.escape(REPO_URL)}">{html.escape(REPO_URL)}</a></p>
  </div>

  <h2>Introduction</h2>
  <h3>Purpose of the Document</h3>
  <p>
    This document defines the testing strategy for SafeMed, a cross-platform adverse drug reaction
    (ADR) reporting system that supports patients and healthcare staff across web and mobile clients.
    The plan validates patient reporting, doctor review, access control, secure uploads, export flows,
    notifications, and AI-supported analysis in the implementation under <code>final_submission/demo</code>.
  </p>

  <h3>Summary of the Goals of the Test Plan</h3>
  {html_list([
      "Validate end-to-end ADR workflows from patient submission to doctor review and export.",
      "Verify required-field validation, meaningful error handling, and role-based access control.",
      "Confirm that reports, medications, notifications, and user data are stored and retrieved correctly.",
      "Validate the implemented AI-assisted flows, including severity metadata and duplicate scoring/flagging.",
      "Confirm the demo supports both web and mobile access for the primary user journeys.",
  ])}

  <h3>Constraints</h3>
  {html_list([
      "Testing is centered on the current demo implementation rather than every aspirational wiki requirement.",
      "Some requirements remain partial or in progress, including duplicate merging, full multilingual coverage, urgent staff notification, graph/statistics UI, and custom print layout.",
      "AI analysis depends on external services and asynchronous processing, so some scenarios require seeded/demo data or a configured worker stack.",
      "Performance, high availability, disaster recovery, and formal security validation require separate infrastructure-oriented testing.",
  ])}

  <h3>References</h3>
  {html_list([
      f'Functional Requirements: <a href="{html.escape(FR_URL)}">{html.escape(FR_URL)}</a>',
      f'Project Wiki: <a href="{html.escape(WIKI_URL)}">{html.escape(WIKI_URL)}</a>',
      'Local wiki sources: GDP-Group5.wiki/Functional-Requirements-List---Final---Group-5.md, GDP-Group5.wiki/Use-Cases-(Iteration-2).md, GDP-Group5.wiki/Non‐Functional-Requirements-List-(Iteration-2).md, GDP-Group5.wiki/Problem-Statement-(Draft-2).md',
      'Implementation sources: final_submission/demo/backend, final_submission/demo/frontend, final_submission/demo/mobile, final_submission/demo/consumer',
  ])}

  <h2>Features to Be Tested</h2>
  {html_table(["Feature", "Feature Description", "Requirement Mapping"], features_rows)}

  <h2>Features Not to Be Tested</h2>
  {html_table(["Feature", "Rationale"], excluded_rows)}

  <h2>Approach</h2>
  <h3>Tools</h3>
  <p><strong>Backend / Integration Testing</strong></p>
  {html_list(tools_backend)}
  <p><strong>Web / Mobile Testing</strong></p>
  {html_list(tools_clients)}

  <h3>Methods</h3>
  {html_list(methods)}

  <h2>Test Deliverables</h2>
  {html_list(deliverables)}

  <h2>Pass / Fail Criteria</h2>
  {html_list([
      "A test case passes when the observed system behavior matches the expected behavior across the supported client and API path.",
      "A test case fails when validation, persistence, access control, notifications, exports, or linked workflows do not meet the documented expected result.",
      "Environment-dependent scenarios remain marked as `Not Executed` until the required AI, email, upload, or worker services are available for live execution.",
  ])}
</body>
</html>
"""


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
XML_NS = "http://www.w3.org/XML/1998/namespace"
ET.register_namespace("", MAIN_NS)
ET.register_namespace("r", REL_NS)


def ns(tag: str) -> str:
    return f"{{{MAIN_NS}}}{tag}"


def get_sheet_targets(workbook_xml: bytes, rels_xml: bytes) -> list[tuple[ET.Element, str]]:
    workbook = ET.fromstring(workbook_xml)
    rels = ET.fromstring(rels_xml)
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    sheets_parent = workbook.find(ns("sheets"))
    out = []
    for sheet in sheets_parent:
        rid = sheet.attrib[f"{{{REL_NS}}}id"]
        target = rel_map[rid]
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        out.append((sheet, target))
    return out


def set_inline_text(cell: ET.Element, value: str) -> None:
    for child in list(cell):
        cell.remove(child)
    cell.attrib["t"] = "inlineStr"
    inline = ET.SubElement(cell, ns("is"))
    text = ET.SubElement(inline, ns("t"))
    if value.startswith(" ") or value.endswith(" ") or "\n" in value:
        text.attrib[f"{{{XML_NS}}}space"] = "preserve"
    text.text = value


def clear_cell(cell: ET.Element) -> None:
    set_inline_text(cell, "")


def write_sheet_case(sheet_xml: bytes, data: dict) -> bytes:
    tree = ET.fromstring(sheet_xml)
    sheet_data = tree.find(ns("sheetData"))
    rows_by_number = {int(row.attrib["r"]): row for row in sheet_data}
    cells = {}
    for row in sheet_data:
        for cell in row:
            cells[cell.attrib["r"]] = cell

    def split_ref(ref: str) -> tuple[str, int]:
        col = "".join(ch for ch in ref if ch.isalpha())
        row_no = int("".join(ch for ch in ref if ch.isdigit()))
        return col, row_no

    def copy_style_for(ref: str) -> dict[str, str]:
        col, row_no = split_ref(ref)
        candidates = [
            f"{col}{max(row_no - 1, 1)}",
            f"B{row_no}",
            f"A{row_no}",
        ]
        for candidate in candidates:
            if candidate in cells:
                style_bits = {}
                for key in ("s", "cm", "vm", "ph"):
                    if key in cells[candidate].attrib:
                        style_bits[key] = cells[candidate].attrib[key]
                return style_bits
        return {}

    def cell(ref: str) -> ET.Element:
        existing = cells.get(ref)
        if existing is not None:
            return existing

        col, row_no = split_ref(ref)
        row = rows_by_number.get(row_no)
        if row is None:
            row = ET.SubElement(sheet_data, ns("row"), {"r": str(row_no)})
            rows_by_number[row_no] = row

        new_cell = ET.SubElement(row, ns("c"), {"r": ref, **copy_style_for(ref)})
        cells[ref] = new_cell
        return new_cell

    set_inline_text(cell("C1"), data["id"])
    set_inline_text(cell("F1"), data["title"])
    set_inline_text(cell("C2"), data["created_by"])
    set_inline_text(cell("F2"), data["reviewed_by"])
    set_inline_text(cell("J2"), data["version"])
    set_inline_text(cell("C4"), data["title"])
    set_inline_text(cell("C6"), data["tester"])
    set_inline_text(cell("F6"), data["date_tested"])
    set_inline_text(cell("J6"), data["status"])
    set_inline_text(cell("B14"), data["scenario"])

    for row_no in range(9, 13):
        clear_cell(cell(f"A{row_no}"))
        clear_cell(cell(f"B{row_no}"))
        clear_cell(cell(f"F{row_no}"))
        clear_cell(cell(f"G{row_no}"))

    for idx, prereq in enumerate(data["prerequisites"], start=9):
        set_inline_text(cell(f"A{idx}"), f"{idx - 8}.0")
        set_inline_text(cell(f"B{idx}"), prereq)

    for idx, datum in enumerate(data["test_data"], start=9):
        set_inline_text(cell(f"F{idx}"), f"{idx - 8}.0")
        set_inline_text(cell(f"G{idx}"), datum)

    for row_no in range(18, 31):
        clear_cell(cell(f"A{row_no}"))
        clear_cell(cell(f"B{row_no}"))
        clear_cell(cell(f"D{row_no}"))
        clear_cell(cell(f"F{row_no}"))
        clear_cell(cell(f"I{row_no}"))

    for offset, step in enumerate(data["steps"], start=18):
        label = f"{offset - 17}.0"
        detail, expected = step
        set_inline_text(cell(f"A{offset}"), label)
        set_inline_text(cell(f"B{offset}"), detail)
        set_inline_text(cell(f"D{offset}"), expected)
        set_inline_text(cell(f"F{offset}"), "Pending execution")
        set_inline_text(cell(f"I{offset}"), "Not Executed")

    return ET.tostring(tree, encoding="utf-8", xml_declaration=True)


def short_sheet_name(index: int, title: str) -> str:
    base = f"TC{index:02d} {title}"
    return base[:31]


def build_workbook_from_template(template_path: Path, output_path: Path, test_cases: list[dict]) -> None:
    with zipfile.ZipFile(template_path, "r") as src:
        files = {name: src.read(name) for name in src.namelist()}

    sheet_targets = get_sheet_targets(files["xl/workbook.xml"], files["xl/_rels/workbook.xml.rels"])
    if len(test_cases) > len(sheet_targets):
        raise ValueError("Not enough template sheets for the requested test cases.")

    workbook_root = ET.fromstring(files["xl/workbook.xml"])
    workbook_sheets = workbook_root.find(ns("sheets"))
    workbook_sheet_elements = list(workbook_sheets)

    for idx, test_case in enumerate(test_cases):
        workbook_sheet_elements[idx].attrib["name"] = short_sheet_name(idx + 1, test_case["title"])
        _, target = sheet_targets[idx]
        files[target] = write_sheet_case(files[target], test_case)

    files["xl/workbook.xml"] = ET.tostring(workbook_root, encoding="utf-8", xml_declaration=True)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as dest:
        for name, content in files.items():
            dest.writestr(name, content)


def convert_html_to_docx(html_path: Path, output_docx: Path) -> None:
    subprocess.run(
        [
            "textutil",
            "-convert",
            "docx",
            str(html_path),
            "-output",
            str(output_docx),
        ],
        check=True,
    )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    html_path = OUTPUT_DIR / "SafeMed_Test_Plan.html"
    docx_path = OUTPUT_DIR / "SafeMed_Test_Plan.docx"
    xlsx_path = OUTPUT_DIR / "SafeMed_Test_Cases.xlsx"

    html_path.write_text(build_test_plan_html(), encoding="utf-8")
    convert_html_to_docx(html_path, docx_path)
    build_workbook_from_template(TEST_CASE_TEMPLATE, xlsx_path, TEST_CASES)

    print(f"Generated: {html_path}")
    print(f"Generated: {docx_path}")
    print(f"Generated: {xlsx_path}")


if __name__ == "__main__":
    main()
