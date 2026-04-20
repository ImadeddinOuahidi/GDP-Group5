/**
 * Duplicate Detection Service for ADR Reports
 *
 * Implements the duplicate-review workflow by combining:
 * 1. Deterministic candidate retrieval
 * 2. Heuristic shortlisting/scoring
 * 3. AI adjudication using the shared provider layer
 */

const ReportSideEffect = require('../models/ReportSideEffect');
const aiProviderService = require('./aiProviderService');

const DUPLICATE_CONFIG = {
  TIME_WINDOW_HOURS: 72,
  SIMILARITY_THRESHOLD: 0.7,
  SHORTLIST_THRESHOLD: 0.35,
  MAX_CANDIDATES: 50,
  MAX_SHORTLIST: 10,
  WEIGHTS: {
    sameMedicine: 0.35,
    samePatient: 0.25,
    similarSymptoms: 0.25,
    closeIncidentDate: 0.15,
  },
};

function getEntityId(value) {
  return String(value?._id || value || '');
}

function toDateOrNull(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const words1 = new Set(String(text1).toLowerCase().split(/\s+/).filter((word) => word.length > 2));
  const words2 = new Set(String(text2).toLowerCase().split(/\s+/).filter((word) => word.length > 2));

  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

function calculateSideEffectSimilarity(effects1, effects2) {
  if (!effects1?.length || !effects2?.length) return 0;

  const effectStrings1 = effects1.map((effect = {}) => effect.effect?.toLowerCase() || '');
  const effectStrings2 = effects2.map((effect = {}) => effect.effect?.toLowerCase() || '');

  let matchScore = 0;

  for (const effect1 of effectStrings1) {
    let bestMatch = 0;
    for (const effect2 of effectStrings2) {
      bestMatch = Math.max(bestMatch, calculateTextSimilarity(effect1, effect2));
    }
    matchScore += bestMatch;
  }

  return matchScore / effectStrings1.length;
}

function calculateDateProximity(date1, date2) {
  const parsedDate1 = toDateOrNull(date1);
  const parsedDate2 = toDateOrNull(date2);

  if (!parsedDate1 || !parsedDate2) return 0;

  const diffHours = Math.abs(parsedDate1 - parsedDate2) / (1000 * 60 * 60);

  if (diffHours <= 24) return 1;
  if (diffHours <= DUPLICATE_CONFIG.TIME_WINDOW_HOURS) {
    return 1 - diffHours / DUPLICATE_CONFIG.TIME_WINDOW_HOURS;
  }

  return 0;
}

function calculateDuplicateScore(report1, report2) {
  const weights = DUPLICATE_CONFIG.WEIGHTS;
  let score = 0;
  const matchDetails = {};

  const sameMedicine = getEntityId(report1.medicine) && getEntityId(report1.medicine) === getEntityId(report2.medicine);
  matchDetails.sameMedicine = sameMedicine;
  score += sameMedicine ? weights.sameMedicine : 0;

  const samePatient = getEntityId(report1.patient) && getEntityId(report1.patient) === getEntityId(report2.patient);
  matchDetails.samePatient = samePatient;
  score += samePatient ? weights.samePatient : 0;

  const symptomSimilarity = calculateSideEffectSimilarity(report1.sideEffects, report2.sideEffects);
  matchDetails.symptomSimilarity = symptomSimilarity;
  score += symptomSimilarity * weights.similarSymptoms;

  const dateProximity = calculateDateProximity(
    report1.reportDetails?.incidentDate || report1.reportDate,
    report2.reportDetails?.incidentDate || report2.reportDate
  );
  matchDetails.dateProximity = dateProximity;
  score += dateProximity * weights.closeIncidentDate;

  return {
    score: Math.round(score * 100) / 100,
    matchDetails,
    isPotentialDuplicate: score >= DUPLICATE_CONFIG.SIMILARITY_THRESHOLD,
  };
}

function normalizeReviewState(report = {}) {
  if (report.metadata?.duplicateAnalysis?.reviewState) {
    return report.metadata.duplicateAnalysis.reviewState;
  }

  if (report.metadata?.mergedInto) {
    return 'merged';
  }

  if (report.metadata?.isDuplicate) {
    return 'flagged';
  }

  return 'pending';
}

function mergeUniqueSideEffects(primaryEffects = [], additionalEffects = []) {
  const combined = [...primaryEffects, ...additionalEffects];
  const seen = new Set();
  const merged = [];

  for (const effect of combined) {
    const key = [
      (effect.effect || '').trim().toLowerCase(),
      effect.severity || '',
      effect.onset || '',
    ].join('|');

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(effect);
    }
  }

  return merged;
}

function mergeUniqueAttachments(primaryAttachments = [], additionalAttachments = []) {
  const combined = [...primaryAttachments, ...additionalAttachments];
  const seen = new Set();
  const merged = [];

  for (const attachment of combined) {
    const key = [
      attachment.key || '',
      attachment.originalName || '',
      attachment.size || '',
    ].join('|');

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(attachment);
    }
  }

  return merged;
}

function buildMergePreview(primaryReport = {}, candidateReport = {}) {
  const mergedSideEffects = mergeUniqueSideEffects(primaryReport.sideEffects || [], candidateReport.sideEffects || []);
  const mergedAttachments = mergeUniqueAttachments(primaryReport.attachments || [], candidateReport.attachments || []);
  const mergedFollowUps = [...(primaryReport.followUp || []), ...(candidateReport.followUp || [])];

  return {
    addedSideEffects: Math.max(mergedSideEffects.length - (primaryReport.sideEffects?.length || 0), 0),
    totalSideEffects: mergedSideEffects.length,
    totalFollowUps: mergedFollowUps.length,
    totalAttachments: mergedAttachments.length,
  };
}

function buildCandidatePayload(sourceReport = {}, candidate = {}, aiDecision = {}, heuristic = {}) {
  const heuristicScore = Number(heuristic.score ?? candidate.heuristicScore ?? candidate.similarityScore ?? candidate.score ?? 0);
  const isDuplicate = Boolean(aiDecision.isDuplicate ?? heuristic.isPotentialDuplicate);
  const recommendedAction = aiDecision.recommendedAction || (isDuplicate ? 'review' : 'ignore');

  return {
    reportId: candidate._id || candidate.reportId,
    createdAt: candidate.createdAt,
    medicine: candidate.medicine,
    patient: candidate.patient,
    reportedBy: candidate.reportedBy,
    reportDate: candidate.reportDetails?.reportDate,
    incidentDate: candidate.reportDetails?.incidentDate,
    sideEffects: candidate.sideEffects,
    sideEffectsCount: candidate.sideEffects?.length || 0,
    score: heuristicScore,
    similarityScore: heuristicScore,
    heuristicScore,
    matchDetails: heuristic.matchDetails || candidate.matchDetails || {},
    confidence: Number(aiDecision.confidence ?? 0),
    isDuplicate,
    isPotentialDuplicate: isDuplicate || recommendedAction !== 'ignore' || Boolean(heuristic.isPotentialDuplicate),
    reasoning: aiDecision.reasoning || 'Duplicate review completed.',
    recommendedAction,
    analysisSource: aiDecision.analysisSource || 'heuristic',
    mergePreview: buildMergePreview(sourceReport, candidate),
    reviewState: normalizeReviewState(candidate),
    duplicateState: {
      isDuplicate: Boolean(candidate.metadata?.isDuplicate),
      duplicateOf: candidate.metadata?.duplicateOf || null,
      mergedInto: candidate.metadata?.mergedInto || null,
    },
  };
}

async function shortlistDuplicateCandidates(reportLike = {}, options = {}) {
  const {
    excludeReportId = null,
    limit = DUPLICATE_CONFIG.MAX_CANDIDATES,
    shortlistLimit = DUPLICATE_CONFIG.MAX_SHORTLIST,
  } = options;

  const filter = {
    isActive: true,
    isDeleted: false,
  };

  if (excludeReportId) {
    filter._id = { $ne: excludeReportId };
  }

  const incidentDate = toDateOrNull(reportLike.reportDetails?.incidentDate || reportLike.reportDate);
  if (incidentDate) {
    const start = new Date(incidentDate.getTime() - DUPLICATE_CONFIG.TIME_WINDOW_HOURS * 60 * 60 * 1000);
    const end = new Date(incidentDate.getTime() + DUPLICATE_CONFIG.TIME_WINDOW_HOURS * 60 * 60 * 1000);
    filter['reportDetails.incidentDate'] = { $gte: start, $lte: end };
  } else {
    const createdAfter = new Date(Date.now() - DUPLICATE_CONFIG.TIME_WINDOW_HOURS * 60 * 60 * 1000);
    filter.createdAt = { $gte: createdAfter };
  }

  const orConditions = [];
  const medicineId = getEntityId(reportLike.medicine);
  const patientId = getEntityId(reportLike.patient);

  if (medicineId) {
    orConditions.push({ medicine: medicineId });
  }

  if (patientId) {
    orConditions.push({ patient: patientId });
  }

  if (orConditions.length > 0) {
    filter.$or = orConditions;
  }

  const candidates = await ReportSideEffect.find(filter)
    .populate([
      { path: 'medicine', select: 'name genericName' },
      { path: 'patient', select: 'firstName lastName' },
      { path: 'reportedBy', select: 'firstName lastName role' },
    ])
    .sort({ createdAt: -1 })
    .limit(limit);

  const scoredCandidates = candidates
    .map((candidate) => {
      const heuristic = calculateDuplicateScore(reportLike, candidate);
      return {
        candidate,
        heuristic,
      };
    })
    .filter(({ heuristic }) => heuristic.score >= DUPLICATE_CONFIG.SHORTLIST_THRESHOLD || heuristic.matchDetails.sameMedicine || heuristic.matchDetails.samePatient)
    .sort((left, right) => right.heuristic.score - left.heuristic.score)
    .slice(0, shortlistLimit);

  return {
    totalCandidatesChecked: candidates.length,
    shortlisted: scoredCandidates,
  };
}

async function persistDuplicateAnalysis(report, shortlist = [], aiResult = {}, candidatePayloads = [], error = null) {
  report.set('metadata.duplicateAnalysis', {
    status: error ? 'failed' : 'completed',
    analysisSource: aiResult.provider || 'heuristic',
    analyzedAt: new Date(),
    reviewState: report.metadata?.duplicateAnalysis?.reviewState || 'pending',
    shortlistedCandidateIds: shortlist.map(({ candidate }) => candidate._id),
    candidates: candidatePayloads.map((candidate) => ({
      reportId: candidate.reportId,
      heuristicScore: candidate.heuristicScore,
      confidence: candidate.confidence,
      isDuplicate: candidate.isDuplicate,
      reasoning: candidate.reasoning,
      recommendedAction: candidate.recommendedAction,
    })),
    lastError: error ? String(error.message || error) : null,
  });

  await report.save();
}

async function buildDuplicateResponse(reportLike = {}, shortlist = [], aiResult = {}) {
  const aiResultsById = new Map(
    (aiResult.results || []).map((entry = {}) => [String(entry.candidateReportId), entry])
  );

  const candidatePayloads = shortlist
    .map(({ candidate, heuristic }) => {
      const aiDecision = aiResultsById.get(String(candidate._id)) || {};

      return buildCandidatePayload(
        reportLike,
        candidate,
        {
          ...aiDecision,
          analysisSource: aiResult.provider || 'heuristic',
        },
        heuristic
      );
    })
    .filter((candidate) => candidate.isPotentialDuplicate)
    .sort((left, right) => {
      if (right.isDuplicate !== left.isDuplicate) {
        return Number(right.isDuplicate) - Number(left.isDuplicate);
      }

      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }

      return right.heuristicScore - left.heuristicScore;
    });

  return candidatePayloads;
}

async function findDuplicates(reportId) {
  const report = await ReportSideEffect.findById(reportId).populate([
    { path: 'medicine', select: 'name genericName' },
    { path: 'patient', select: 'firstName lastName' },
    { path: 'reportedBy', select: 'firstName lastName role' },
  ]);

  if (!report) {
    throw new Error('Report not found');
  }

  const { totalCandidatesChecked, shortlisted } = await shortlistDuplicateCandidates(report, {
    excludeReportId: reportId,
  });

  const aiResult = await aiProviderService.adjudicateDuplicates(
    report,
    shortlisted.map(({ candidate, heuristic }) => ({
      ...candidate.toObject(),
      heuristicScore: heuristic.score,
      matchDetails: heuristic.matchDetails,
    }))
  );

  const duplicates = await buildDuplicateResponse(report, shortlisted, aiResult);
  await persistDuplicateAnalysis(report, shortlisted, aiResult, duplicates);

  return {
    reportId,
    analysisDate: new Date(),
    analysisSource: aiResult.provider || 'heuristic',
    modelUsed: aiResult.modelUsed || null,
    totalCandidatesChecked,
    shortlistedCandidates: shortlisted.length,
    potentialDuplicatesFound: duplicates.length,
    duplicateCount: duplicates.length,
    hasPotentialDuplicates: duplicates.length > 0,
    duplicates,
    config: {
      timeWindowHours: DUPLICATE_CONFIG.TIME_WINDOW_HOURS,
      similarityThreshold: DUPLICATE_CONFIG.SIMILARITY_THRESHOLD,
      shortlistThreshold: DUPLICATE_CONFIG.SHORTLIST_THRESHOLD,
    },
  };
}

async function checkForDuplicatesBeforeSubmission(reportData) {
  const sourceReport = {
    ...reportData,
    reportDate: reportData.reportDetails?.reportDate || new Date(),
  };

  const { totalCandidatesChecked, shortlisted } = await shortlistDuplicateCandidates(sourceReport);

  const aiResult = await aiProviderService.adjudicateDuplicates(
    sourceReport,
    shortlisted.map(({ candidate, heuristic }) => ({
      ...candidate.toObject(),
      heuristicScore: heuristic.score,
      matchDetails: heuristic.matchDetails,
    }))
  );

  const duplicates = await buildDuplicateResponse(sourceReport, shortlisted, aiResult);

  return {
    analysisDate: new Date(),
    analysisSource: aiResult.provider || 'heuristic',
    modelUsed: aiResult.modelUsed || null,
    totalCandidatesChecked,
    shortlistedCandidates: shortlisted.length,
    hasPotentialDuplicates: duplicates.length > 0,
    duplicateCount: duplicates.length,
    duplicates,
  };
}

async function mergeDuplicateIntoOriginal(duplicateReportId, originalReportId, mergedBy) {
  if (duplicateReportId.toString() === originalReportId.toString()) {
    throw new Error('A report cannot be merged into itself');
  }

  const [duplicateReport, originalReport] = await Promise.all([
    ReportSideEffect.findById(duplicateReportId),
    ReportSideEffect.findById(originalReportId),
  ]);

  if (!duplicateReport || !originalReport) {
    throw new Error('Report not found');
  }

  if (duplicateReport.isDeleted || !duplicateReport.isActive) {
    throw new Error('Duplicate report is not active');
  }

  const originalSideEffectCount = originalReport.sideEffects?.length || 0;
  const mergedSideEffects = mergeUniqueSideEffects(
    originalReport.sideEffects || [],
    duplicateReport.sideEffects || []
  );
  const mergedFollowUps = [
    ...(originalReport.followUp || []),
    ...(duplicateReport.followUp || []),
  ];
  const mergedAttachments = mergeUniqueAttachments(
    originalReport.attachments || [],
    duplicateReport.attachments || []
  );

  originalReport.sideEffects = mergedSideEffects;
  originalReport.followUp = mergedFollowUps;
  originalReport.attachments = mergedAttachments;
  originalReport.lastModifiedBy = mergedBy;
  originalReport.version += 1;
  originalReport.set('metadata.duplicateAnalysis.reviewState', 'merged');
  await originalReport.save();

  duplicateReport.set('metadata.isDuplicate', true);
  duplicateReport.set('metadata.duplicateOf', originalReport._id);
  duplicateReport.set('metadata.duplicateFlaggedBy', mergedBy);
  duplicateReport.set('metadata.duplicateFlaggedAt', new Date());
  duplicateReport.set('metadata.mergedInto', originalReport._id);
  duplicateReport.set('metadata.mergedBy', mergedBy);
  duplicateReport.set('metadata.mergedAt', new Date());
  duplicateReport.set('metadata.duplicateAnalysis.reviewState', 'merged');
  duplicateReport.status = 'Closed';
  duplicateReport.isActive = false;
  duplicateReport.lastModifiedBy = mergedBy;
  duplicateReport.version += 1;
  await duplicateReport.save();

  return {
    originalReportId: originalReport._id,
    mergedReportId: duplicateReport._id,
    mergeSummary: {
      addedSideEffects: Math.max(mergedSideEffects.length - originalSideEffectCount, 0),
      totalSideEffects: mergedSideEffects.length,
      totalFollowUps: mergedFollowUps.length,
      totalAttachments: mergedAttachments.length,
    },
  };
}

async function flagAsDuplicate(reportId, originalReportId, flaggedBy) {
  const report = await ReportSideEffect.findByIdAndUpdate(
    reportId,
    {
      $set: {
        'metadata.isDuplicate': true,
        'metadata.duplicateOf': originalReportId,
        'metadata.duplicateFlaggedBy': flaggedBy,
        'metadata.duplicateFlaggedAt': new Date(),
        'metadata.duplicateAnalysis.reviewState': 'flagged',
      },
    },
    { new: true }
  );

  if (!report) {
    throw new Error('Report not found');
  }

  return report;
}

async function getDuplicateStats() {
  const stats = await ReportSideEffect.aggregate([
    {
      $facet: {
        totalReports: [
          { $match: { isActive: true, isDeleted: false } },
          { $count: 'count' },
        ],
        flaggedDuplicates: [
          { $match: { 'metadata.isDuplicate': true } },
          { $count: 'count' },
        ],
        recentDuplicates: [
          {
            $match: {
              'metadata.isDuplicate': true,
              'metadata.duplicateFlaggedAt': {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
          { $count: 'count' },
        ],
      },
    },
  ]);

  return {
    totalReports: stats[0]?.totalReports[0]?.count || 0,
    flaggedDuplicates: stats[0]?.flaggedDuplicates[0]?.count || 0,
    recentDuplicatesLast7Days: stats[0]?.recentDuplicates[0]?.count || 0,
    duplicateRate:
      stats[0]?.totalReports[0]?.count > 0
        ? `${(((stats[0]?.flaggedDuplicates[0]?.count || 0) / stats[0]?.totalReports[0]?.count) * 100).toFixed(2)}%`
        : '0%',
  };
}

module.exports = {
  findDuplicates,
  checkForDuplicatesBeforeSubmission,
  flagAsDuplicate,
  mergeDuplicateIntoOriginal,
  getDuplicateStats,
  calculateDuplicateScore,
  DUPLICATE_CONFIG,
};
