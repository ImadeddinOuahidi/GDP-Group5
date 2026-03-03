/**
 * Export & Print Utilities for SafeMed ADR
 * Supports: CSV, JSON, PDF (via browser print), and direct printing
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Get auth token
 */
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
}

/**
 * Export multiple reports as CSV via the backend
 */
export async function exportReportsCSV(filters = {}) {
  try {
    const params = new URLSearchParams({ format: 'csv', ...filters });
    const response = await fetch(`${BASE_URL}/export/reports?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    downloadBlob(blob, `adr-reports-${getDateStamp()}.csv`);
    return true;
  } catch (error) {
    console.error('CSV export failed:', error);
    // Fallback: export from provided data
    return false;
  }
}

/**
 * Export multiple reports as JSON via the backend
 */
export async function exportReportsJSON(filters = {}) {
  try {
    const params = new URLSearchParams({ format: 'json', ...filters });
    const response = await fetch(`${BASE_URL}/export/reports?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    downloadBlob(blob, `adr-reports-${getDateStamp()}.json`);
    return true;
  } catch (error) {
    console.error('JSON export failed:', error);
    return false;
  }
}

/**
 * Export a single report as JSON for printing/PDF
 */
export async function exportSingleReportJSON(reportId) {
  try {
    const response = await fetch(`${BASE_URL}/export/reports/${reportId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) throw new Error('Export failed');

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Single report export failed:', error);
    return null;
  }
}

/**
 * Export from client-side data (fallback when API is unavailable)
 */
export function exportClientCSV(reports, filename = 'adr-reports') {
  const headers = [
    'Report ID', 'Patient', 'Medication', 'Side Effects', 'Severity',
    'Status', 'Priority', 'Seriousness', 'Date', 'AI Severity', 'Doctor Review'
  ];

  const rows = reports.map((r) => [
    r._id || r.id || '',
    r.patient ? `${r.patient.firstName || ''} ${r.patient.lastName || ''}`.trim() : 'Anonymous',
    r.medicine?.name || r.drug || '',
    (r.sideEffects || []).map((e) => e.effect).join('; ') || r.symptom || '',
    (r.sideEffects || []).map((e) => e.severity).join('; ') || r.severity || '',
    r.status || '',
    r.priority || '',
    r.reportDetails?.seriousness || '',
    r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date || '',
    r.metadata?.aiAnalysis?.severity?.level || '',
    r.doctorReview?.status || 'not_requested',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}-${getDateStamp()}.csv`);
}

/**
 * Export from client-side data as JSON
 */
export function exportClientJSON(reports, filename = 'adr-reports') {
  const data = {
    exportedAt: new Date().toISOString(),
    system: 'SafeMed ADR',
    count: reports.length,
    reports: reports.map((r) => ({
      id: r._id || r.id,
      status: r.status,
      priority: r.priority,
      medication: r.medicine?.name || r.drug || '',
      patient: r.patient ? `${r.patient.firstName || ''} ${r.patient.lastName || ''}`.trim() : '',
      sideEffects: r.sideEffects || [],
      reportDetails: r.reportDetails || {},
      aiAnalysis: r.metadata?.aiAnalysis || null,
      doctorReview: r.doctorReview || null,
      createdAt: r.createdAt,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}-${getDateStamp()}.json`);
}

/**
 * Generate a printable HTML view of a report and open browser print dialog
 */
export function printReport(report) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow popups to print the report.');
    return;
  }

  const html = generatePrintHTML(report);
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Wait for content to render then trigger print
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * Generate a PDF-like printable HTML document for a report
 */
export function generatePrintHTML(report) {
  const medication = report.medicine || report.report?.medication || {};
  const patient = report.patient || report.report?.patient || {};
  const sideEffects = report.sideEffects || report.report?.sideEffects || [];
  const medUsage = report.medicationUsage || report.report?.medicationUsage || {};
  const details = report.reportDetails || report.report?.reportDetails || {};
  const aiAnalysis = report.metadata?.aiAnalysis || report.report?.aiAnalysis || {};
  const guidance = aiAnalysis.patientGuidance || {};
  const doctorReview = report.doctorReview || report.report?.doctorReview || {};
  const patientName = typeof patient === 'string' ? patient :
    patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Anonymous';
  const medName = typeof medication === 'string' ? medication :
    medication.name || 'Unknown Medication';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ADR Report - ${report._id || report.id || 'Report'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { color: #1976d2; font-size: 22px; margin-bottom: 4px; }
    .header p { color: #666; font-size: 12px; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { font-size: 16px; color: #1976d2; font-weight: bold; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 12px; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .field { margin-bottom: 8px; }
    .field-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 14px; }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 4px; }
    .chip-critical { background: #ffebee; color: #c62828; }
    .chip-high, .chip-severe { background: #fff3e0; color: #e65100; }
    .chip-medium, .chip-moderate { background: #e3f2fd; color: #1565c0; }
    .chip-low, .chip-mild { background: #e8f5e9; color: #2e7d32; }
    .chip-default { background: #f5f5f5; color: #616161; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #f5f5f5; font-weight: 600; color: #333; }
    .ai-box { background: #f3f8ff; border: 1px solid #bbdefb; border-radius: 8px; padding: 16px; margin: 8px 0; }
    .doctor-box { background: #f1f8e9; border: 1px solid #c5e1a5; border-radius: 8px; padding: 16px; margin: 8px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 11px; color: #999; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SafeMed ADR - Adverse Drug Reaction Report</h1>
    <p>Report ID: ${report._id || report.id || 'N/A'} | Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="section">
    <div class="section-title">Report Overview</div>
    <div class="field-grid">
      <div class="field"><div class="field-label">Status</div><div class="field-value"><span class="chip chip-default">${report.status || 'N/A'}</span></div></div>
      <div class="field"><div class="field-label">Priority</div><div class="field-value"><span class="chip chip-${(report.priority || '').toLowerCase()}">${report.priority || 'N/A'}</span></div></div>
      <div class="field"><div class="field-label">Patient</div><div class="field-value">${patientName}</div></div>
      <div class="field"><div class="field-label">Incident Date</div><div class="field-value">${details.incidentDate ? new Date(details.incidentDate).toLocaleDateString() : 'N/A'}</div></div>
      <div class="field"><div class="field-label">Report Date</div><div class="field-value">${details.reportDate ? new Date(details.reportDate).toLocaleDateString() : report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}</div></div>
      <div class="field"><div class="field-label">Seriousness</div><div class="field-value">${details.seriousness || 'N/A'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Medication Information</div>
    <div class="field-grid">
      <div class="field"><div class="field-label">Medication</div><div class="field-value">${medName}</div></div>
      <div class="field"><div class="field-label">Generic Name</div><div class="field-value">${medication.genericName || 'N/A'}</div></div>
      <div class="field"><div class="field-label">Dosage</div><div class="field-value">${medUsage.dosage?.amount || ''} ${medUsage.dosage?.frequency || ''}</div></div>
      <div class="field"><div class="field-label">Route</div><div class="field-value">${medUsage.dosage?.route || 'N/A'}</div></div>
      <div class="field"><div class="field-label">Indication</div><div class="field-value">${medUsage.indication || 'N/A'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Side Effects</div>
    <table>
      <thead><tr><th>Effect</th><th>Severity</th><th>Onset</th><th>Body System</th></tr></thead>
      <tbody>
        ${sideEffects.length > 0
          ? sideEffects.map((e) => `<tr><td>${e.effect || ''}</td><td><span class="chip chip-${(e.severity || '').toLowerCase()}">${e.severity || ''}</span></td><td>${e.onset || ''}</td><td>${e.bodySystem || ''}</td></tr>`).join('')
          : '<tr><td colspan="4" style="text-align:center;color:#999;">No side effects recorded</td></tr>'}
      </tbody>
    </table>
  </div>

  ${aiAnalysis.processed !== false && (aiAnalysis.summary || aiAnalysis.severity) ? `
  <div class="section">
    <div class="section-title">AI Analysis</div>
    <div class="ai-box">
      ${aiAnalysis.severity?.level ? `<div class="field"><div class="field-label">AI Severity Assessment</div><div class="field-value"><span class="chip chip-${(aiAnalysis.severity.level || '').toLowerCase()}">${aiAnalysis.severity.level}</span> (Confidence: ${aiAnalysis.severity.confidence || 'N/A'})</div></div>` : ''}
      ${aiAnalysis.summary ? `<div class="field"><div class="field-label">Clinical Summary</div><div class="field-value">${aiAnalysis.summary}</div></div>` : ''}
      ${guidance.recommendation ? `<div class="field"><div class="field-label">Patient Guidance</div><div class="field-value">${guidance.recommendation}</div></div>` : ''}
      ${guidance.nextSteps?.length ? `<div class="field"><div class="field-label">Recommended Next Steps</div><div class="field-value"><ul>${guidance.nextSteps.map((s) => `<li>${s}</li>`).join('')}</ul></div></div>` : ''}
      ${guidance.warningSignsToWatch?.length ? `<div class="field"><div class="field-label">Warning Signs</div><div class="field-value"><ul>${guidance.warningSignsToWatch.map((s) => `<li>${s}</li>`).join('')}</ul></div></div>` : ''}
    </div>
  </div>` : ''}

  ${doctorReview.status === 'completed' ? `
  <div class="section">
    <div class="section-title">Doctor Review</div>
    <div class="doctor-box">
      <div class="field-grid">
        <div class="field"><div class="field-label">Reviewed By</div><div class="field-value">${doctorReview.reviewedBy ? (typeof doctorReview.reviewedBy === 'string' ? doctorReview.reviewedBy : `Dr. ${doctorReview.reviewedBy.firstName || ''} ${doctorReview.reviewedBy.lastName || ''}`) : 'Unknown'}</div></div>
        <div class="field"><div class="field-label">Reviewed On</div><div class="field-value">${doctorReview.reviewedAt ? new Date(doctorReview.reviewedAt).toLocaleDateString() : 'N/A'}</div></div>
      </div>
      ${doctorReview.remarks ? `<div class="field"><div class="field-label">Remarks</div><div class="field-value">${doctorReview.remarks}</div></div>` : ''}
      ${doctorReview.doctorAssessment?.recommendation || doctorReview.assessment?.recommendation ? `<div class="field"><div class="field-label">Recommendation</div><div class="field-value">${doctorReview.doctorAssessment?.recommendation || doctorReview.assessment?.recommendation}</div></div>` : ''}
    </div>
  </div>` : ''}

  <div class="footer">
    <p>SafeMed ADR - Adverse Drug Reaction Reporting System</p>
    <p>This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}. It is intended for medical record purposes only.</p>
    <p>CONFIDENTIAL - This document contains protected health information.</p>
  </div>
</body>
</html>`;
}

// ---- Internal helpers ----

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateStamp() {
  return new Date().toISOString().split('T')[0];
}
