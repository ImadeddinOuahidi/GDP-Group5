const express = require('express');
const router = express.Router();
const ReportSideEffect = require('../models/ReportSideEffect');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');

// All export routes require authentication
router.use(protect);

/**
 * GET /api/export/reports
 * Export reports in various formats: json, csv
 * Query params: format (json|csv), status, priority, fromDate, toDate, medicine, limit
 */
router.get('/reports', restrictTo('admin', 'doctor'), async (req, res) => {
  try {
    const {
      format = 'json',
      status,
      priority,
      fromDate,
      toDate,
      medicine,
      limit = 500,
    } = req.query;

    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (medicine) filter.medicine = medicine;
    if (fromDate || toDate) {
      filter['reportDetails.reportDate'] = {};
      if (fromDate) filter['reportDetails.reportDate'].$gte = new Date(fromDate);
      if (toDate) filter['reportDetails.reportDate'].$lte = new Date(toDate);
    }

    const reports = await ReportSideEffect.find(filter)
      .populate('medicine', 'name genericName category')
      .populate('patient', 'firstName lastName')
      .populate('reportedBy', 'firstName lastName role')
      .populate('doctorReview.reviewedBy', 'firstName lastName')
      .sort({ 'reportDetails.reportDate': -1 })
      .limit(parseInt(limit))
      .lean();

    if (format === 'csv') {
      return exportCSV(res, reports);
    } else {
      return exportJSON(res, reports);
    }
  } catch (error) {
    console.error('[Export] Error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /api/export/reports/:id
 * Export a single report in detail (for printing / PDF generation)
 */
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await ReportSideEffect.findById(req.params.id)
      .populate('medicine', 'name genericName category dosageForm')
      .populate('patient', 'firstName lastName email')
      .populate('reportedBy', 'firstName lastName role')
      .populate('doctorReview.reviewedBy', 'firstName lastName')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check access: patients can only export their own
    if (req.user.role === 'patient') {
      const patientId = report.patient?._id?.toString();
      const userId = req.user._id.toString();
      if (patientId !== userId && report.reportedBy?._id?.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const { format = 'json' } = req.query;

    // Build structured export data suitable for printing
    const exportData = {
      reportId: report._id,
      generatedAt: new Date().toISOString(),
      systemName: 'SafeMed ADR - Adverse Drug Reaction Reporting System',
      report: {
        id: report._id,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        medication: {
          name: report.medicine?.name || 'Unknown',
          genericName: report.medicine?.genericName || '',
          category: report.medicine?.category || '',
        },
        patient: {
          name: report.patient
            ? `${report.patient.firstName} ${report.patient.lastName}`
            : 'Anonymous',
        },
        reporter: {
          name: report.reportedBy
            ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}`
            : 'Unknown',
          role: report.reportedBy?.role || 'unknown',
        },
        sideEffects: (report.sideEffects || []).map((e) => ({
          effect: e.effect,
          severity: e.severity,
          onset: e.onset,
          description: e.description || '',
          bodySystem: e.bodySystem || '',
        })),
        medicationUsage: {
          dosage: report.medicationUsage?.dosage || {},
          indication: report.medicationUsage?.indication || '',
          startDate: report.medicationUsage?.startDate,
          endDate: report.medicationUsage?.endDate,
        },
        reportDetails: {
          incidentDate: report.reportDetails?.incidentDate,
          reportDate: report.reportDetails?.reportDate,
          seriousness: report.reportDetails?.seriousness || 'non-serious',
          outcome: report.reportDetails?.outcome || '',
          description: report.reportDetails?.description || '',
        },
        aiAnalysis: report.metadata?.aiProcessed
          ? {
            processed: true,
            severity: report.metadata?.aiAnalysis?.severity || {},
            priority: report.metadata?.aiAnalysis?.priority || {},
            seriousness: report.metadata?.aiAnalysis?.seriousness || {},
            summary: report.metadata?.aiAnalysis?.summary || '',
            keywords: report.metadata?.aiAnalysis?.keywords || [],
            patientGuidance: report.metadata?.aiAnalysis?.patientGuidance || {},
          }
          : { processed: false },
        doctorReview: report.doctorReview?.status === 'completed'
          ? {
            status: 'completed',
            reviewedBy: report.doctorReview.reviewedBy
              ? `Dr. ${report.doctorReview.reviewedBy.firstName} ${report.doctorReview.reviewedBy.lastName}`
              : 'Unknown',
            reviewedAt: report.doctorReview.reviewedAt,
            remarks: report.doctorReview.remarks || '',
            assessment: report.doctorReview.doctorAssessment || {},
          }
          : { status: report.doctorReview?.status || 'not_requested' },
        followUp: (report.followUp || []).map((f) => ({
          date: f.date,
          type: f.informationType,
          description: f.description,
        })),
        causalityAssessment: report.causalityAssessment || {},
      },
    };

    if (format === 'csv') {
      const row = flattenReportForCSV(report);
      const headers = Object.keys(row);
      const csvContent = [
        headers.join(','),
        headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.csv`);
      return res.send(csvContent);
    }

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('[Export] Single report error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /api/export/statistics
 * Export dashboard statistics as JSON
 */
router.get('/statistics', restrictTo('admin', 'doctor'), async (req, res) => {
  try {
    const totalReports = await ReportSideEffect.countDocuments();
    const byStatus = await ReportSideEffect.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byPriority = await ReportSideEffect.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const bySeriousness = await ReportSideEffect.aggregate([
      { $group: { _id: '$reportDetails.seriousness', count: { $sum: 1 } } },
    ]);
    const topMedicines = await ReportSideEffect.aggregate([
      { $group: { _id: '$medicine', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'medications',
          localField: '_id',
          foreignField: '_id',
          as: 'medicineInfo',
        },
      },
      { $unwind: { path: '$medicineInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          medicineName: '$medicineInfo.name',
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        totalReports,
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        byPriority: Object.fromEntries(byPriority.map((p) => [p._id, p.count])),
        bySeriousness: Object.fromEntries(bySeriousness.map((s) => [s._id, s.count])),
        topMedicines,
      },
    });
  } catch (error) {
    console.error('[Export] Statistics error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// ---- Helper functions ----

function exportJSON(res, reports) {
  const data = reports.map(formatReportForExport);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=adr-reports-${new Date().toISOString().split('T')[0]}.json`);
  return res.json({ success: true, exportedAt: new Date().toISOString(), count: data.length, reports: data });
}

function exportCSV(res, reports) {
  const rows = reports.map(flattenReportForCSV);
  if (rows.length === 0) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=adr-reports.csv');
    return res.send('No reports found');
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
    ),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=adr-reports-${new Date().toISOString().split('T')[0]}.csv`
  );
  return res.send(csvLines.join('\n'));
}

function formatReportForExport(report) {
  return {
    id: report._id,
    status: report.status,
    priority: report.priority,
    createdAt: report.createdAt,
    medication: report.medicine?.name || 'Unknown',
    genericName: report.medicine?.genericName || '',
    patient: report.patient ? `${report.patient.firstName} ${report.patient.lastName}` : 'Anonymous',
    reportedBy: report.reportedBy ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}` : 'Unknown',
    sideEffects: (report.sideEffects || []).map((e) => e.effect).join('; '),
    severity: (report.sideEffects || []).map((e) => e.severity).join('; '),
    seriousness: report.reportDetails?.seriousness || '',
    outcome: report.reportDetails?.outcome || '',
    incidentDate: report.reportDetails?.incidentDate,
    reportDate: report.reportDetails?.reportDate,
    aiSeverity: report.metadata?.aiAnalysis?.severity?.level || '',
    aiPriority: report.metadata?.aiAnalysis?.priority?.level || '',
    aiSummary: report.metadata?.aiAnalysis?.summary || '',
    doctorReviewStatus: report.doctorReview?.status || 'not_requested',
    doctorRemarks: report.doctorReview?.remarks || '',
  };
}

function flattenReportForCSV(report) {
  return {
    'Report ID': report._id?.toString() || '',
    'Status': report.status || '',
    'Priority': report.priority || '',
    'Medication': report.medicine?.name || '',
    'Generic Name': report.medicine?.genericName || '',
    'Category': report.medicine?.category || '',
    'Patient': report.patient ? `${report.patient.firstName} ${report.patient.lastName}` : '',
    'Reported By': report.reportedBy ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}` : '',
    'Reporter Role': report.reportedBy?.role || '',
    'Side Effects': (report.sideEffects || []).map((e) => e.effect).join('; '),
    'Severity': (report.sideEffects || []).map((e) => e.severity).join('; '),
    'Onset': (report.sideEffects || []).map((e) => e.onset).join('; '),
    'Body Systems': (report.sideEffects || []).map((e) => e.bodySystem).join('; '),
    'Dosage': report.medicationUsage?.dosage ? `${report.medicationUsage.dosage.amount} ${report.medicationUsage.dosage.frequency}` : '',
    'Route': report.medicationUsage?.dosage?.route || '',
    'Indication': report.medicationUsage?.indication || '',
    'Seriousness': report.reportDetails?.seriousness || '',
    'Outcome': report.reportDetails?.outcome || '',
    'Incident Date': report.reportDetails?.incidentDate ? new Date(report.reportDetails.incidentDate).toISOString().split('T')[0] : '',
    'Report Date': report.reportDetails?.reportDate ? new Date(report.reportDetails.reportDate).toISOString().split('T')[0] : '',
    'AI Severity': report.metadata?.aiAnalysis?.severity?.level || '',
    'AI Priority': report.metadata?.aiAnalysis?.priority?.level || '',
    'AI Summary': report.metadata?.aiAnalysis?.summary || '',
    'Doctor Review Status': report.doctorReview?.status || 'not_requested',
    'Doctor Remarks': report.doctorReview?.remarks || '',
    'Created At': report.createdAt ? new Date(report.createdAt).toISOString() : '',
  };
}

module.exports = router;
