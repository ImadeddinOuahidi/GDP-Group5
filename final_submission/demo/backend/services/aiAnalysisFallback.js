const SEVERITY_ORDER = {
  Mild: 1,
  Moderate: 2,
  Severe: 3,
  'Life-threatening': 4,
};

const PRIORITY_BY_SEVERITY = {
  Mild: 'Low',
  Moderate: 'Medium',
  Severe: 'High',
  'Life-threatening': 'Critical',
};

function clampConfidence(value, fallback = 0.6) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  if (numeric > 1) {
    return Math.max(0, Math.min(1, numeric / 100));
  }

  return Math.max(0, Math.min(1, numeric));
}

function getHighestSeverity(sideEffects = []) {
  return sideEffects.reduce((currentHighest, effect = {}) => {
    if ((SEVERITY_ORDER[effect.severity] || 0) > (SEVERITY_ORDER[currentHighest] || 0)) {
      return effect.severity;
    }

    return currentHighest;
  }, 'Mild');
}

function calculateRiskScore(analysis = {}) {
  let score = 0;

  score += {
    Mild: 5,
    Moderate: 15,
    Severe: 30,
    'Life-threatening': 40,
  }[analysis.severity?.level] || 15;

  score += {
    Low: 5,
    Medium: 10,
    High: 20,
    Critical: 30,
  }[analysis.priority] || 10;

  if (analysis.seriousness?.classification === 'Serious') {
    score += 20;
  }

  score += Math.min((analysis.riskFactors || []).length * 2, 10);

  return Math.min(100, Math.round(score));
}

function generatePatientGuidance(analysis = {}, reportData = {}) {
  const severity = analysis.severity?.level || getHighestSeverity(reportData.sideEffects || []);

  if (severity === 'Life-threatening') {
    return {
      urgencyLevel: 'emergency',
      recommendation: 'This report indicates a potentially life-threatening reaction. Stop the medication and seek emergency care immediately.',
      nextSteps: [
        'Stop taking the medication right away.',
        'Call emergency services or go to the nearest emergency department.',
        'Bring the medication package or prescription details with you.',
      ],
      warningSignsToWatch: [
        'Difficulty breathing',
        'Swelling of the face, lips, or throat',
        'Loss of consciousness',
        'Severe chest pain',
      ],
      canContinueMedication: false,
      shouldSeekMedicalAttention: true,
    };
  }

  if (severity === 'Severe') {
    return {
      urgencyLevel: 'urgent',
      recommendation: 'This reaction needs prompt medical review. Contact a doctor or urgent care service as soon as possible.',
      nextSteps: [
        'Contact your doctor today.',
        'Avoid taking another dose until a clinician advises you.',
        'Keep a record of when the symptoms started and how they changed.',
      ],
      warningSignsToWatch: [
        'Symptoms getting worse',
        'New symptoms appearing',
        'Fever or severe pain',
      ],
      canContinueMedication: false,
      shouldSeekMedicalAttention: true,
    };
  }

  if (severity === 'Moderate') {
    return {
      urgencyLevel: 'soon',
      recommendation: 'This reaction should be reviewed by a clinician soon. Arrange follow-up within the next few days.',
      nextSteps: [
        'Monitor symptoms closely.',
        'Arrange a follow-up appointment within a few days.',
        'Escalate sooner if symptoms worsen.',
      ],
      warningSignsToWatch: [
        'Symptoms becoming more severe',
        'Symptoms lasting longer than expected',
        'New symptoms developing',
      ],
      canContinueMedication: true,
      shouldSeekMedicalAttention: false,
    };
  }

  return {
    urgencyLevel: 'routine',
    recommendation: 'This appears consistent with a lower-severity reaction. Continue monitoring and raise it at your next routine review if it does not improve.',
    nextSteps: [
      'Continue monitoring your symptoms.',
      'Mention this at your next routine appointment.',
    ],
    warningSignsToWatch: [
      'Symptoms not improving',
      'Symptoms becoming more severe',
    ],
    canContinueMedication: true,
    shouldSeekMedicalAttention: false,
  };
}

function normalizeSeverityAnalysis(rawAnalysis = {}, reportData = {}) {
  const resolvedSeverity = rawAnalysis.severity?.level || getHighestSeverity(reportData.sideEffects || []);

  const normalized = {
    severity: {
      level: resolvedSeverity,
      confidence: clampConfidence(rawAnalysis.severity?.confidence, 0.6),
      reasoning: rawAnalysis.severity?.reasoning || 'Severity inferred from structured fallback analysis.',
    },
    priority: rawAnalysis.priority || PRIORITY_BY_SEVERITY[resolvedSeverity] || 'Medium',
    seriousness: {
      classification:
        rawAnalysis.seriousness?.classification ||
        (resolvedSeverity === 'Severe' || resolvedSeverity === 'Life-threatening' ? 'Serious' : 'Non-serious'),
      reasons: Array.isArray(rawAnalysis.seriousness?.reasons) ? rawAnalysis.seriousness.reasons : [],
    },
    bodySystemsAffected: Array.isArray(rawAnalysis.bodySystemsAffected) ? rawAnalysis.bodySystemsAffected : [],
    riskFactors: Array.isArray(rawAnalysis.riskFactors) ? rawAnalysis.riskFactors : [],
    recommendedActions: Array.isArray(rawAnalysis.recommendedActions) && rawAnalysis.recommendedActions.length > 0
      ? rawAnalysis.recommendedActions
      : [
          'Review the report clinically.',
          'Monitor symptom progression.',
          'Contact the patient if symptoms worsen or new symptoms appear.',
        ],
    causalityAssessment: {
      likelihood: rawAnalysis.causalityAssessment?.likelihood || 'Possible',
      reasoning:
        rawAnalysis.causalityAssessment?.reasoning ||
        'Temporal association is present, but clinical review is still required.',
    },
    keywords: Array.isArray(rawAnalysis.keywords) ? rawAnalysis.keywords.filter(Boolean) : [],
    summary: rawAnalysis.summary || 'AI analysis completed with fallback normalization.',
    medicalTerminology: Array.isArray(rawAnalysis.medicalTerminology) ? rawAnalysis.medicalTerminology : [],
    medicationVerification: {
      isVerifiedMedication: Boolean(rawAnalysis.medicationVerification?.isVerifiedMedication),
      drugClass: rawAnalysis.medicationVerification?.drugClass || '',
      knownADR: Boolean(rawAnalysis.medicationVerification?.knownADR),
      knownADRFrequency: rawAnalysis.medicationVerification?.knownADRFrequency || '',
      labelWarnings: rawAnalysis.medicationVerification?.labelWarnings || '',
      sources: Array.isArray(rawAnalysis.medicationVerification?.sources) ? rawAnalysis.medicationVerification.sources : [],
    },
    references: Array.isArray(rawAnalysis.references) ? rawAnalysis.references : [],
  };

  normalized.patientGuidance = rawAnalysis.patientGuidance || generatePatientGuidance(normalized, reportData);
  normalized.overallRiskScore =
    rawAnalysis.overallRiskScore !== undefined
      ? Math.max(0, Math.min(100, Number(rawAnalysis.overallRiskScore) || 0))
      : calculateRiskScore(normalized);

  return normalized;
}

function buildFallbackSeverityAnalysis(reportData = {}, reason = 'AI analysis unavailable') {
  const highestSeverity = getHighestSeverity(reportData.sideEffects || []);
  const normalized = normalizeSeverityAnalysis(
    {
      severity: {
        level: highestSeverity,
        confidence: 0.6,
        reasoning: reason,
      },
      priority: PRIORITY_BY_SEVERITY[highestSeverity] || 'Medium',
      seriousness: {
        classification: highestSeverity === 'Severe' || highestSeverity === 'Life-threatening' ? 'Serious' : 'Non-serious',
        reasons:
          highestSeverity === 'Severe' || highestSeverity === 'Life-threatening'
            ? ['High patient-reported severity']
            : [],
      },
      summary: `Fallback severity analysis used. Highest reported severity: ${highestSeverity}.`,
      keywords: [
        reportData.medication?.name,
        ...(reportData.sideEffects || []).map((effect) => effect.effect),
      ].filter(Boolean),
    },
    reportData
  );

  return {
    success: true,
    provider: 'heuristic',
    modelUsed: 'heuristic-fallback-v1',
    fallbackUsed: true,
    analysis: normalized,
  };
}

function buildDuplicateReasoning(candidate = {}) {
  const detailParts = [];

  if (candidate.matchDetails?.sameMedicine) {
    detailParts.push('same medication');
  }

  if (candidate.matchDetails?.samePatient) {
    detailParts.push('same patient');
  }

  if ((candidate.matchDetails?.symptomSimilarity || 0) >= 0.75) {
    detailParts.push('very similar symptoms');
  } else if ((candidate.matchDetails?.symptomSimilarity || 0) >= 0.4) {
    detailParts.push('partially overlapping symptoms');
  }

  if ((candidate.matchDetails?.dateProximity || 0) >= 0.75) {
    detailParts.push('close incident timing');
  }

  return detailParts.length > 0
    ? `Heuristic duplicate review indicates ${detailParts.join(', ')}.`
    : 'Heuristic duplicate review found limited overlap between the reports.';
}

function buildHeuristicDuplicateAdjudication(sourceReport = {}, candidates = []) {
  const results = candidates.map((candidate = {}) => {
    const heuristicScore = Number(
      candidate.heuristicScore ??
        candidate.similarityScore ??
        candidate.score ??
        0
    );

    const isDuplicate = heuristicScore >= 0.7;
    const confidence = clampConfidence(heuristicScore, 0.4);
    const recommendedAction = !isDuplicate
      ? 'ignore'
      : heuristicScore >= 0.9
        ? 'merge'
        : heuristicScore >= 0.8
          ? 'flag'
          : 'review';

    return {
      candidateReportId: String(candidate.reportId || candidate._id || ''),
      isDuplicate,
      confidence,
      reasoning: buildDuplicateReasoning(candidate),
      recommendedAction,
    };
  });

  return {
    success: true,
    provider: 'heuristic',
    modelUsed: 'heuristic-duplicate-v1',
    fallbackUsed: true,
    results,
  };
}

module.exports = {
  SEVERITY_ORDER,
  clampConfidence,
  getHighestSeverity,
  calculateRiskScore,
  generatePatientGuidance,
  normalizeSeverityAnalysis,
  buildFallbackSeverityAnalysis,
  buildHeuristicDuplicateAdjudication,
};
