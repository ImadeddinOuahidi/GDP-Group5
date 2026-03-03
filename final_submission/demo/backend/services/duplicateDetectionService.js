/**
 * Duplicate Detection Service for ADR Reports
 * 
 * Implements Use Case 8: Identify Duplicate Reports
 * - Compares new reports with stored reports
 * - Flags potential duplicates for staff review
 * 
 * @module services/duplicateDetectionService
 */

const ReportSideEffect = require('../models/ReportSideEffect');

/**
 * Configuration for duplicate detection thresholds
 */
const DUPLICATE_CONFIG = {
  // Time window in hours to search for duplicates
  TIME_WINDOW_HOURS: 72,
  
  // Minimum similarity score to flag as potential duplicate (0-1)
  SIMILARITY_THRESHOLD: 0.7,
  
  // Weight for each matching criteria
  WEIGHTS: {
    sameMedicine: 0.35,
    samePatient: 0.25,
    similarSymptoms: 0.25,
    closeIncidentDate: 0.15
  }
};

/**
 * Calculate text similarity using Jaccard similarity coefficient
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score between 0 and 1
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Calculate side effect similarity between two reports
 * @param {Array} effects1 - Side effects from first report
 * @param {Array} effects2 - Side effects from second report
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSideEffectSimilarity(effects1, effects2) {
  if (!effects1?.length || !effects2?.length) return 0;
  
  const effectStrings1 = effects1.map(e => e.effect?.toLowerCase() || '');
  const effectStrings2 = effects2.map(e => e.effect?.toLowerCase() || '');
  
  let matchScore = 0;
  let totalComparisons = effectStrings1.length;
  
  for (const effect1 of effectStrings1) {
    let bestMatch = 0;
    for (const effect2 of effectStrings2) {
      const similarity = calculateTextSimilarity(effect1, effect2);
      bestMatch = Math.max(bestMatch, similarity);
    }
    matchScore += bestMatch;
  }
  
  return matchScore / totalComparisons;
}

/**
 * Calculate date proximity score
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Proximity score between 0 and 1
 */
function calculateDateProximity(date1, date2) {
  if (!date1 || !date2) return 0;
  
  const diffHours = Math.abs(new Date(date1) - new Date(date2)) / (1000 * 60 * 60);
  
  // Returns 1 if same day, decreases linearly over 72 hours
  if (diffHours <= 24) return 1;
  if (diffHours <= DUPLICATE_CONFIG.TIME_WINDOW_HOURS) {
    return 1 - (diffHours / DUPLICATE_CONFIG.TIME_WINDOW_HOURS);
  }
  return 0;
}

/**
 * Calculate overall similarity score between two reports
 * @param {Object} report1 - First report
 * @param {Object} report2 - Second report
 * @returns {Object} Similarity analysis result
 */
function calculateDuplicateScore(report1, report2) {
  const weights = DUPLICATE_CONFIG.WEIGHTS;
  let score = 0;
  const matchDetails = {};
  
  // Check if same medicine
  const sameMedicine = report1.medicine?.toString() === report2.medicine?.toString();
  matchDetails.sameMedicine = sameMedicine;
  score += sameMedicine ? weights.sameMedicine : 0;
  
  // Check if same patient
  const samePatient = report1.patient?.toString() === report2.patient?.toString();
  matchDetails.samePatient = samePatient;
  score += samePatient ? weights.samePatient : 0;
  
  // Calculate side effect similarity
  const symptomSimilarity = calculateSideEffectSimilarity(
    report1.sideEffects,
    report2.sideEffects
  );
  matchDetails.symptomSimilarity = symptomSimilarity;
  score += symptomSimilarity * weights.similarSymptoms;
  
  // Calculate incident date proximity
  const dateProximity = calculateDateProximity(
    report1.reportDetails?.incidentDate,
    report2.reportDetails?.incidentDate
  );
  matchDetails.dateProximity = dateProximity;
  score += dateProximity * weights.closeIncidentDate;
  
  return {
    score: Math.round(score * 100) / 100,
    matchDetails,
    isPotentialDuplicate: score >= DUPLICATE_CONFIG.SIMILARITY_THRESHOLD
  };
}

/**
 * Find potential duplicates for a given report
 * @param {string} reportId - ID of the report to check
 * @returns {Promise<Object>} Duplicate analysis result
 */
async function findDuplicates(reportId) {
  const report = await ReportSideEffect.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Calculate time window for duplicate search
  const searchStartDate = new Date();
  searchStartDate.setHours(searchStartDate.getHours() - DUPLICATE_CONFIG.TIME_WINDOW_HOURS);
  
  // Find potential duplicate candidates
  const candidates = await ReportSideEffect.find({
    _id: { $ne: reportId },
    isActive: true,
    isDeleted: false,
    $or: [
      // Same medicine
      { medicine: report.medicine },
      // Same patient
      { patient: report.patient }
    ],
    createdAt: { $gte: searchStartDate }
  }).populate([
    { path: 'medicine', select: 'name genericName' },
    { path: 'patient', select: 'firstName lastName' },
    { path: 'reportedBy', select: 'firstName lastName' }
  ]).limit(50);
  
  // Calculate similarity scores for each candidate
  const duplicateAnalysis = candidates.map(candidate => {
    const analysis = calculateDuplicateScore(report, candidate);
    
    return {
      reportId: candidate._id,
      medicine: candidate.medicine,
      patient: candidate.patient,
      reportedBy: candidate.reportedBy,
      reportDate: candidate.reportDetails?.reportDate,
      incidentDate: candidate.reportDetails?.incidentDate,
      sideEffectsCount: candidate.sideEffects?.length || 0,
      ...analysis
    };
  });
  
  // Sort by similarity score and filter potential duplicates
  const potentialDuplicates = duplicateAnalysis
    .filter(d => d.isPotentialDuplicate)
    .sort((a, b) => b.score - a.score);
  
  return {
    reportId,
    analysisDate: new Date(),
    totalCandidatesChecked: candidates.length,
    potentialDuplicatesFound: potentialDuplicates.length,
    duplicates: potentialDuplicates,
    config: {
      timeWindowHours: DUPLICATE_CONFIG.TIME_WINDOW_HOURS,
      similarityThreshold: DUPLICATE_CONFIG.SIMILARITY_THRESHOLD
    }
  };
}

/**
 * Check for duplicates during report submission (pre-submission check)
 * @param {Object} reportData - Report data to check
 * @returns {Promise<Object>} Potential duplicates found
 */
async function checkForDuplicatesBeforeSubmission(reportData) {
  const searchStartDate = new Date();
  searchStartDate.setHours(searchStartDate.getHours() - DUPLICATE_CONFIG.TIME_WINDOW_HOURS);
  
  // Build query for potential duplicates
  const query = {
    isActive: true,
    isDeleted: false,
    createdAt: { $gte: searchStartDate }
  };
  
  // Add medicine filter if provided
  if (reportData.medicine) {
    query.medicine = reportData.medicine;
  }
  
  // Add patient filter if provided
  if (reportData.patient) {
    query.patient = reportData.patient;
  }
  
  const candidates = await ReportSideEffect.find(query)
    .populate([
      { path: 'medicine', select: 'name genericName' },
      { path: 'patient', select: 'firstName lastName' }
    ])
    .limit(20);
  
  // Calculate similarity for each candidate
  const potentialDuplicates = candidates
    .map(candidate => {
      const analysis = calculateDuplicateScore(reportData, candidate);
      return {
        reportId: candidate._id,
        medicine: candidate.medicine,
        patient: candidate.patient,
        reportDate: candidate.reportDetails?.reportDate,
        ...analysis
      };
    })
    .filter(d => d.isPotentialDuplicate)
    .sort((a, b) => b.score - a.score);
  
  return {
    hasPotentialDuplicates: potentialDuplicates.length > 0,
    duplicateCount: potentialDuplicates.length,
    duplicates: potentialDuplicates
  };
}

/**
 * Flag a report as a confirmed duplicate
 * @param {string} reportId - ID of the report to flag
 * @param {string} originalReportId - ID of the original report
 * @param {string} flaggedBy - User ID who flagged the duplicate
 * @returns {Promise<Object>} Updated report
 */
async function flagAsDuplicate(reportId, originalReportId, flaggedBy) {
  const report = await ReportSideEffect.findByIdAndUpdate(
    reportId,
    {
      $set: {
        'metadata.isDuplicate': true,
        'metadata.duplicateOf': originalReportId,
        'metadata.duplicateFlaggedBy': flaggedBy,
        'metadata.duplicateFlaggedAt': new Date()
      }
    },
    { new: true }
  );
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  return report;
}

/**
 * Get duplicate detection statistics
 * @returns {Promise<Object>} Statistics about duplicate detection
 */
async function getDuplicateStats() {
  const stats = await ReportSideEffect.aggregate([
    {
      $facet: {
        totalReports: [
          { $match: { isActive: true, isDeleted: false } },
          { $count: 'count' }
        ],
        flaggedDuplicates: [
          { $match: { 'metadata.isDuplicate': true, isActive: true } },
          { $count: 'count' }
        ],
        recentDuplicates: [
          { 
            $match: { 
              'metadata.isDuplicate': true,
              'metadata.duplicateFlaggedAt': { 
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
              }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);
  
  return {
    totalReports: stats[0]?.totalReports[0]?.count || 0,
    flaggedDuplicates: stats[0]?.flaggedDuplicates[0]?.count || 0,
    recentDuplicatesLast7Days: stats[0]?.recentDuplicates[0]?.count || 0,
    duplicateRate: stats[0]?.totalReports[0]?.count > 0
      ? ((stats[0]?.flaggedDuplicates[0]?.count || 0) / stats[0]?.totalReports[0]?.count * 100).toFixed(2) + '%'
      : '0%'
  };
}

module.exports = {
  findDuplicates,
  checkForDuplicatesBeforeSubmission,
  flagAsDuplicate,
  getDuplicateStats,
  calculateDuplicateScore,
  DUPLICATE_CONFIG
};
