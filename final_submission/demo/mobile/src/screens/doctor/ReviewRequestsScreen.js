import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';
import { useI18n } from '../../context/I18nContext';

const SEVERITY_OPTIONS = ['', 'Life-threatening', 'Severe', 'Moderate', 'Mild'];

const ReviewRequestsScreen = ({ navigation }) => {
  const { t, locale } = useI18n();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [mode, setMode] = useState('pending');
  const [filters, setFilters] = useState({
    drugName: '',
    fromDate: '',
    toDate: '',
    severity: '',
  });
  const [duplicateResults, setDuplicateResults] = useState({});
  const [actionState, setActionState] = useState({});

  // Review dialog state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingReport, setReviewingReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    agreedWithAI: true,
    remarks: '',
    recommendation: '',
    actionRequired: 'none',
    followUpRequired: false,
  });

  const ACTION_OPTIONS = [
    { value: 'none', label: t('reviewRequests.actions.none') },
    { value: 'monitor', label: t('reviewRequests.actions.monitor') },
    { value: 'adjust_medication', label: t('reviewRequests.actions.adjustMedication') },
    { value: 'discontinue', label: t('reviewRequests.actions.discontinue') },
    { value: 'schedule_appointment', label: t('reviewRequests.actions.scheduleAppointment') },
    { value: 'emergency', label: t('reviewRequests.actions.emergency') },
  ];

  const normalizeDateFilter = (value = '') => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return undefined;

    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoPattern.test(trimmed)) return undefined;

    const parsedDate = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) return undefined;

    return trimmed;
  };

  const getSeverityLabel = (severity) => {
    const severityKeyMap = {
      Mild: 'reviewRequests.severity.mild',
      Moderate: 'reviewRequests.severity.moderate',
      Severe: 'reviewRequests.severity.severe',
      'Life-threatening': 'reviewRequests.severity.lifeThreatening',
    };

    const key = severityKeyMap[severity];
    return key ? t(key) : (severity || t('common.unknown'));
  };

  const fetchReports = async () => {
    try {
      const params = {
        severity: filters.severity || undefined,
        fromDate: normalizeDateFilter(filters.fromDate),
        toDate: normalizeDateFilter(filters.toDate),
        drugName: filters.drugName || undefined,
      };

      const response = mode === 'pending'
        ? await reportService.getPendingReviews(params)
        : await reportService.getAllReports(params);

      if (response.data) {
        if (Array.isArray(response.data)) {
          setReports(response.data);
        } else if (Array.isArray(response.data.reports)) {
          setReports(response.data.reports);
        } else if (Array.isArray(response.data.data)) {
          setReports(response.data.data);
        } else {
          setReports([]);
        }
      }
    } catch (error) {
      try {
        const fallback = await reportService.getAllReports({
          ...(mode === 'pending' ? { status: 'Submitted' } : {}),
          severity: filters.severity || undefined,
          fromDate: normalizeDateFilter(filters.fromDate),
          toDate: normalizeDateFilter(filters.toDate),
          drugName: filters.drugName || undefined,
        });
        if (fallback.data) setReports(Array.isArray(fallback.data) ? fallback.data : fallback.data.data || []);
      } catch (e) {
        console.error('Error fetching reports:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [mode, filters]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
  };

  const openReviewDialog = (report) => {
    setReviewingReport(report);
    setReviewForm({
      agreedWithAI: true,
      remarks: '',
      recommendation: '',
      actionRequired: 'none',
      followUpRequired: false,
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.remarks.trim()) {
      Alert.alert(t('common.required'), t('reviewRequests.remarksRequired'));
      return;
    }
    try {
      setIsSubmitting(true);
      // Send data matching web's format exactly
      await reportService.submitReview(reviewingReport._id, {
        remarks: reviewForm.remarks,
        recommendation: reviewForm.recommendation || undefined,
        actionRequired: reviewForm.actionRequired,
        agreedWithAI: reviewForm.agreedWithAI,
      });
      setShowReviewModal(false);
      Alert.alert(t('common.success'), t('reviewRequests.reviewSubmitted'));
      fetchReports();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('reviewRequests.reviewSubmitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDuplicates = async (reportId) => {
    try {
      setDuplicateResults((prev) => ({
        ...prev,
        [reportId]: { ...(prev[reportId] || {}), loading: true, error: null },
      }));
      const response = await reportService.findDuplicates(reportId);
      const payload = response.data || {};
      setDuplicateResults((prev) => ({
        ...prev,
        [reportId]: {
          loading: false,
          loaded: true,
          analysisSource: payload.analysisSource,
          duplicates: payload.duplicates || [],
        },
      }));
    } catch (error) {
      setDuplicateResults((prev) => ({
        ...prev,
        [reportId]: {
          loading: false,
          loaded: true,
          error: error.response?.data?.message || t('reviewRequests.loadDuplicatesFailed'),
          duplicates: [],
        },
      }));
    }
  };

  const handleDuplicateDecision = async ({ action, candidateId, originalReportId }) => {
    const key = `${action}:${candidateId}`;

    try {
      setActionState((prev) => ({ ...prev, [key]: true }));
      if (action === 'merge') {
        await reportService.mergeDuplicate(candidateId, originalReportId);
        Alert.alert(t('common.success'), t('reviewRequests.duplicateMerged'));
      } else {
        await reportService.flagDuplicate(candidateId, originalReportId);
        Alert.alert(t('common.success'), t('reviewRequests.duplicateFlagged'));
      }
      await Promise.all([handleLoadDuplicates(originalReportId), fetchReports()]);
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('reviewRequests.duplicateActionFailed'));
    } finally {
      setActionState((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleReprocessAi = async (reportId) => {
    try {
      setActionState((prev) => ({ ...prev, [`reprocess:${reportId}`]: true }));
      await reportService.reprocessAiAnalysis(reportId);
      Alert.alert(t('common.success'), t('reviewRequests.aiReprocessQueued'));
      await fetchReports();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('reviewRequests.aiReprocessFailed'));
    } finally {
      setActionState((prev) => ({ ...prev, [`reprocess:${reportId}`]: false }));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Mild': return '#4CAF50';
      case 'Moderate': return '#FFC107';
      case 'Severe': return '#FF9800';
      case 'Life-threatening': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const getUrgencyConfig = (level) => {
    switch (level?.toLowerCase()) {
      case 'emergency': return { color: '#F44336', label: t('reviewRequests.urgency.emergency'), icon: 'alert-circle' };
      case 'urgent': return { color: '#FF9800', label: t('reviewRequests.urgency.urgent'), icon: 'warning' };
      case 'soon': return { color: '#42A5F5', label: t('reviewRequests.urgency.soon'), icon: 'time' };
      default: return { color: '#4CAF50', label: t('reviewRequests.urgency.routine'), icon: 'checkmark-circle' };
    }
  };

  const formatDate = (d) => d
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
    : t('common.notAvailable');

  const renderReportItem = ({ item }) => {
    const ai = item.metadata?.aiAnalysis;
    const aiStatus = item.metadata?.aiStatus || (item.metadata?.aiProcessed ? 'completed' : 'queued');
    const urgency = getUrgencyConfig(ai?.patientGuidance?.urgencyLevel || ai?.priorityLevel);
    const maxSeverity = item.sideEffects?.reduce((max, se) => {
      const order = { 'Life-threatening': 4, 'Severe': 3, 'Moderate': 2, 'Mild': 1 };
      return (order[se.severity] || 0) > (order[max] || 0) ? se.severity : max;
    }, 'Mild') || 'Unknown';
    const isExpanded = expandedId === item._id;

    return (
      <View style={[styles.reportCard, { borderLeftColor: getSeverityColor(maxSeverity) }]}>
        <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item._id)}>
          <View style={styles.reportHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Ionicons name="medkit" size={16} color={colors.primary} />
                <Text style={styles.medicineName}>{item.medicine?.name || t('common.unknown')}</Text>
              </View>
              <Text style={styles.patientName}>
                {item.patient?.firstName} {item.patient?.lastName}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {/* Urgency chip */}
              <View style={[styles.urgencyChip, { backgroundColor: urgency.color + '15' }]}>
                <Ionicons name={urgency.icon} size={10} color={urgency.color} />
                <Text style={[styles.urgencyChipText, { color: urgency.color }]}>{urgency.label}</Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(maxSeverity) + '18' }]}>
                <Text style={[styles.severityBadgeText, { color: getSeverityColor(maxSeverity) }]}>{getSeverityLabel(maxSeverity)}</Text>
              </View>
            </View>
          </View>

          {/* Patient reason if available */}
          {item.doctorReview?.reason && (
            <View style={styles.reasonBox}>
              <Ionicons name="chatbubble-ellipses" size={13} color={colors.info} />
              <Text style={styles.reasonText} numberOfLines={2}>{item.doctorReview.reason}</Text>
            </View>
          )}

          {/* Side effects summary */}
          <View style={styles.effectsRow}>
            {item.sideEffects?.slice(0, 3).map((se, i) => (
              <View key={i} style={styles.effectChip}>
                <View style={[styles.miniDot, { backgroundColor: getSeverityColor(se.severity) }]} />
                <Text style={styles.effectChipText} numberOfLines={1}>{se.effect}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reportMeta}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            {ai && (
              <View style={styles.aiBadge}>
                <Ionicons name="analytics" size={12} color="#7C4DFF" />
                <Text style={styles.aiBadgeText}>{t('reviewRequests.aiStatus', { status: aiStatus })}</Text>
              </View>
            )}
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Expanded: AI Analysis (matching web's expandable accordion) */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {ai && (
              <View style={styles.aiCard}>
                <LinearGradient
                  colors={['#4A148C', '#7C4DFF']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.aiHeader}
                >
                  <Ionicons name="analytics" size={14} color="#fff" />
                  <Text style={styles.aiHeaderText}>{t('reviewRequests.aiAnalysis')}</Text>
                </LinearGradient>
                <View style={styles.aiBody}>
                  {/* Summary */}
                  {ai.summary && (
                    <Text style={styles.aiSummary}>{ai.summary}</Text>
                  )}

                  {/* Patient Guidance */}
                  {ai.patientGuidance?.recommendation && (
                    <View style={styles.aiGuidanceBox}>
                      <Text style={styles.aiGuidanceLabel}>{t('reviewRequests.patientGuidance')}</Text>
                      <Text style={styles.aiGuidanceText}>{ai.patientGuidance.recommendation}</Text>
                    </View>
                  )}

                  {/* Recommended Actions */}
                  {(ai.recommendedActions?.length > 0 || ai.recommendations?.length > 0) && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text style={styles.aiSubLabel}>{t('reviewRequests.recommendedActions')}</Text>
                      {(ai.recommendedActions || ai.recommendations || []).map((rec, i) => (
                        <View key={i} style={styles.aiRecRow}>
                          <Ionicons name="checkmark-circle" size={12} color="#7C4DFF" />
                          <Text style={styles.aiRecText}>{rec}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Medication Verification */}
                  {ai.medicationVerification && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text style={styles.aiSubLabel}>{t('reviewRequests.medicationVerification')}</Text>
                      {ai.medicationVerification.isVerifiedMedication !== undefined && (
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>{t('reviewRequests.medicationVerification')}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons
                              name={ai.medicationVerification.isVerifiedMedication ? 'checkmark-circle' : 'close-circle'}
                              size={12}
                              color={ai.medicationVerification.isVerifiedMedication ? colors.success : colors.error}
                            />
                            <Text style={styles.aiValue}>{ai.medicationVerification.isVerifiedMedication ? t('reviewRequests.verified') : t('reviewRequests.notVerified')}</Text>
                          </View>
                        </View>
                      )}
                      {ai.medicationVerification.drugClass && (
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>{t('reviewRequests.drugClassLabel')}</Text>
                          <Text style={styles.aiValue}>{ai.medicationVerification.drugClass}</Text>
                        </View>
                      )}
                      {ai.medicationVerification.knownADR !== undefined && (
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>{t('reviewRequests.knownAdrLabel')}</Text>
                          <Text style={[styles.aiValue, { color: ai.medicationVerification.knownADR ? colors.warning : colors.success }]}>
                            {ai.medicationVerification.knownADR ? t('reviewRequests.verified') : t('reviewRequests.notVerified')}
                          </Text>
                        </View>
                      )}
                      {ai.medicationVerification.knownADRFrequency && (
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>{t('reviewRequests.frequencyLabel')}</Text>
                          <Text style={styles.aiValue}>{ai.medicationVerification.knownADRFrequency}</Text>
                        </View>
                      )}
                      {ai.medicationVerification.labelWarnings && (
                        <View style={{ marginTop: spacing.xs }}>
                          <Text style={styles.aiLabel}>{t('reviewRequests.labelWarnings')}</Text>
                          <Text style={[styles.aiRecText, { color: '#E65100' }]}>{ai.medicationVerification.labelWarnings}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* References */}
                  {ai.references?.length > 0 && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text style={styles.aiSubLabel}>{t('reviewRequests.references')}</Text>
                      {ai.references.map((ref, i) => (
                        <Text key={i} style={[styles.aiRecText, { color: colors.primary }]}>
                          {ref.title || ref.uri || ref}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Bottom chips */}
                  <View style={styles.aiChipsRow}>
                    {ai.causalityAssessment?.likelihood && (
                      <View style={[styles.aiChip, { backgroundColor: '#7C4DFF15' }]}>
                        <Text style={[styles.aiChipText, { color: '#7C4DFF' }]}>
                          {t('reviewRequests.causality', {
                            value: typeof ai.causalityAssessment.likelihood === 'object'
                              ? ai.causalityAssessment.likelihood.level || t('common.unknown')
                              : ai.causalityAssessment.likelihood,
                          })}
                        </Text>
                      </View>
                    )}
                    {(ai.overallRiskScore || ai.confidenceScore) && (
                      <View style={[styles.aiChip, { backgroundColor: '#FF980015' }]}>
                        <Text style={[styles.aiChipText, { color: '#FF9800' }]}>
                          {t('reviewRequests.risk', { value: `${ai.overallRiskScore || ai.confidenceScore}%` })}
                        </Text>
                      </View>
                    )}
                    {(ai.priority || ai.priorityLevel) && (
                      <View style={[styles.aiChip, { backgroundColor: urgency.color + '15' }]}>
                        <Text style={[styles.aiChipText, { color: urgency.color }]}>
                          {t('reviewRequests.priority', { value: ai.priority || ai.priorityLevel })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.aiChipsRow}>
              <View style={[styles.aiChip, { backgroundColor: colors.info + '15' }]}>
                <Text style={[styles.aiChipText, { color: colors.info }]}>
                  {t('reviewRequests.aiStatus', { status: aiStatus })}
                </Text>
              </View>
              {item.metadata?.aiProvider && (
                <View style={[styles.aiChip, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.aiChipText, { color: colors.primary }]}>
                    {t('reviewRequests.aiProvider', { provider: item.metadata.aiProvider })}
                  </Text>
                </View>
              )}
            </View>

            {aiStatus === 'failed' && item.metadata?.aiProcessingError ? (
              <View style={styles.aiErrorBox}>
                <Text style={styles.aiErrorText}>{item.metadata.aiProcessingError}</Text>
              </View>
            ) : null}

            {duplicateResults[item._id]?.loaded && (
              <View style={[styles.aiCard, { marginTop: spacing.sm }]}>
                <View style={styles.aiBody}>
                  <Text style={styles.aiSubLabel}>{t('reviewRequests.duplicateCandidates')}</Text>
                  {duplicateResults[item._id]?.error ? (
                    <Text style={styles.errorText}>{duplicateResults[item._id].error}</Text>
                  ) : duplicateResults[item._id]?.duplicates?.length ? (
                    duplicateResults[item._id].duplicates.map((candidate) => {
                      const isFlagActionLoading = actionState[`flag:${candidate.reportId}`];
                      const isMergeActionLoading = actionState[`merge:${candidate.reportId}`];
                      const isFlagDisabled = candidate.reviewState === 'flagged' || isFlagActionLoading;
                      const isMergeDisabled = candidate.reviewState === 'merged' || isMergeActionLoading;

                      return (
                        <View key={candidate.reportId} style={styles.aiGuidanceBox}>
                          <Text style={styles.aiGuidanceLabel}>
                            {(candidate.medicine?.name || t('common.unknown'))} · {formatDate(candidate.reportDate || candidate.createdAt)}
                          </Text>
                          <Text style={styles.aiGuidanceText}>{candidate.reasoning}</Text>
                          <Text style={styles.aiRecText}>
                            {t('reviewRequests.duplicateConfidence', {
                              confidence: `${Math.round((candidate.confidence || 0) * 100)}%`,
                            })}
                          </Text>
                          <Text style={styles.aiRecText}>
                            {t('reviewRequests.analysisSource', {
                              source: candidate.analysisSource || duplicateResults[item._id]?.analysisSource || 'heuristic',
                            })}
                          </Text>
                          <Text style={styles.aiRecText}>
                            {t('reviewRequests.mergePreview', {
                              sideEffects: candidate.mergePreview?.addedSideEffects || 0,
                              followUps: candidate.mergePreview?.totalFollowUps || 0,
                              attachments: candidate.mergePreview?.totalAttachments || 0,
                            })}
                          </Text>
                          <View style={styles.expandedActions}>
                            <TouchableOpacity
                              style={styles.viewDetailBtn}
                              onPress={() => navigation.navigate('ReportDetail', { reportId: candidate.reportId })}
                            >
                              <Text style={styles.viewDetailText}>{t('reviewRequests.viewFullReport')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.viewDetailBtn, isFlagDisabled && styles.actionDisabledBtn]}
                              disabled={isFlagDisabled}
                              onPress={() => handleDuplicateDecision({
                                action: 'flag',
                                candidateId: candidate.reportId,
                                originalReportId: item._id,
                              })}
                            >
                              {isFlagActionLoading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                              ) : (
                                <Text style={styles.viewDetailText}>{t('reviewRequests.flagDuplicate')}</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.reviewButton, isMergeDisabled && styles.actionDisabledBtn]}
                              disabled={isMergeDisabled}
                              onPress={() => handleDuplicateDecision({
                                action: 'merge',
                                candidateId: candidate.reportId,
                                originalReportId: item._id,
                              })}
                            >
                              <LinearGradient colors={['#FB8C00', '#FFB300']} style={styles.reviewBtnGradient}>
                                {isMergeActionLoading ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Text style={styles.reviewBtnText}>{t('reviewRequests.mergeDuplicate')}</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.descriptionText}>{t('reviewRequests.noDuplicateCandidates')}</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.expandedActions}>
              <TouchableOpacity
                style={[styles.viewDetailBtn, duplicateResults[item._id]?.loading && styles.actionDisabledBtn]}
                onPress={() => handleLoadDuplicates(item._id)}
                disabled={duplicateResults[item._id]?.loading}
              >
                {duplicateResults[item._id]?.loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.viewDetailText}>{t('reviewRequests.reviewDuplicates')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewDetailBtn, actionState[`reprocess:${item._id}`] && styles.actionDisabledBtn]}
                onPress={() => handleReprocessAi(item._id)}
                disabled={actionState[`reprocess:${item._id}`]}
              >
                {actionState[`reprocess:${item._id}`] ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.viewDetailText}>{t('reviewRequests.reprocessAi')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewDetailBtn}
                onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
              >
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.viewDetailText}>{t('reviewRequests.viewFullReport')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reviewButton} onPress={() => openReviewDialog(item)}>
                <LinearGradient
                  colors={['#1565C0', '#42A5F5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.reviewBtnGradient}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.reviewBtnText}>{t('reviewRequests.submitReview')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('reviewRequests.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header count */}
      <View style={styles.countBanner}>
        <Ionicons name="clipboard" size={18} color={colors.primary} />
        <Text style={styles.countText}>{t(mode === 'pending' ? 'reviewRequests.modePending' : 'reviewRequests.modeAll')} · {reports.length}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, mode === 'pending' && styles.filterPillActive]}
          onPress={() => setMode('pending')}
        >
          <Text style={[styles.filterPillText, mode === 'pending' && styles.filterPillTextActive]}>
            {t('reviewRequests.modePending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, mode === 'all' && styles.filterPillActive]}
          onPress={() => setMode('all')}
        >
          <Text style={[styles.filterPillText, mode === 'all' && styles.filterPillTextActive]}>
            {t('reviewRequests.modeAll')}
          </Text>
        </TouchableOpacity>
        {SEVERITY_OPTIONS.map((severity) => (
          <TouchableOpacity
            key={severity || 'all'}
            style={[styles.filterPill, filters.severity === severity && styles.filterPillActive]}
            onPress={() => setFilters((prev) => ({ ...prev, severity }))}
          >
            <Text style={[styles.filterPillText, filters.severity === severity && styles.filterPillTextActive]}>
              {severity
                ? t(`reviewRequests.severity.${severity === 'Life-threatening' ? 'lifeThreatening' : severity.toLowerCase()}`)
                : t('reviewRequests.severity.all')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputFilters}>
        <TextInput
          style={styles.filterInput}
          value={filters.drugName}
          onChangeText={(value) => setFilters((prev) => ({ ...prev, drugName: value }))}
          placeholder={t('reviewRequests.drugFilter')}
          placeholderTextColor={colors.textDisabled}
        />
        <TextInput
          style={styles.filterInput}
          value={filters.fromDate}
          onChangeText={(value) => setFilters((prev) => ({ ...prev, fromDate: value }))}
          placeholder={t('reviewRequests.fromDate')}
          placeholderTextColor={colors.textDisabled}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <TextInput
          style={styles.filterInput}
          value={filters.toDate}
          onChangeText={(value) => setFilters((prev) => ({ ...prev, toDate: value }))}
          placeholder={t('reviewRequests.toDate')}
          placeholderTextColor={colors.textDisabled}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.emptyStateTitle}>
              {t(mode === 'pending' ? 'reviewRequests.emptyPendingTitle' : 'reviewRequests.emptyAllTitle')}
            </Text>
            <Text style={styles.emptyStateText}>
              {t(mode === 'pending' ? 'reviewRequests.emptyPendingText' : 'reviewRequests.emptyAllText')}
            </Text>
          </View>
        }
      />

      {/* Review Modal (matching web's dialog fields exactly) */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('reviewRequests.submitReview')}</Text>
                <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {reviewingReport && (
                <Text style={styles.modalSubtitle}>
                  {reviewingReport.medicine?.name} — {reviewingReport.patient?.firstName} {reviewingReport.patient?.lastName}
                </Text>
              )}

              {/* AI Assessment Summary (read-only) */}
              {reviewingReport?.metadata?.aiAnalysis?.summary && (
                <View style={styles.aiSummaryAlert}>
                  <Ionicons name="information-circle" size={16} color={colors.info} />
                  <Text style={styles.aiSummaryAlertText}>
                    {reviewingReport.metadata.aiAnalysis.summary}
                  </Text>
                </View>
              )}

              {/* Agree with AI */}
              {reviewingReport?.metadata?.aiAnalysis && (
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>{t('reviewRequests.agreeWithAi')}</Text>
                  <View style={styles.agreeOptions}>
                    <TouchableOpacity
                      style={[styles.agreeBtn, reviewForm.agreedWithAI && styles.agreeBtnActive]}
                      onPress={() => setReviewForm(f => ({ ...f, agreedWithAI: true }))}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={reviewForm.agreedWithAI ? '#fff' : colors.success} />
                      <Text style={[styles.agreeBtnText, reviewForm.agreedWithAI && { color: '#fff' }]}>
                        {t('reviewRequests.agreeYes')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.agreeBtn, !reviewForm.agreedWithAI && styles.disagreeBtnActive]}
                      onPress={() => setReviewForm(f => ({ ...f, agreedWithAI: false }))}
                    >
                      <Ionicons name="close-circle" size={16} color={!reviewForm.agreedWithAI ? '#fff' : colors.warning} />
                      <Text style={[styles.agreeBtnText, !reviewForm.agreedWithAI && { color: '#fff' }]}>
                        {t('reviewRequests.agreeNo')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Remarks */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('reviewRequests.remarksLabel')}</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('reviewRequests.remarksPlaceholder')}
                  placeholderTextColor={colors.textDisabled}
                  multiline
                  numberOfLines={4}
                  value={reviewForm.remarks}
                  onChangeText={(v) => setReviewForm(f => ({ ...f, remarks: v }))}
                />
              </View>

              {/* Recommendation */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('reviewRequests.recommendationLabel')}</Text>
                <TextInput
                  style={styles.textAreaSmall}
                  placeholder={t('reviewRequests.recommendationPlaceholder')}
                  placeholderTextColor={colors.textDisabled}
                  multiline
                  numberOfLines={3}
                  value={reviewForm.recommendation}
                  onChangeText={(v) => setReviewForm(f => ({ ...f, recommendation: v }))}
                />
              </View>

              {/* Action Required */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>{t('reviewRequests.actionRequiredLabel')}</Text>
                <View style={styles.actionGrid}>
                  {ACTION_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.actionOption,
                        reviewForm.actionRequired === opt.value && styles.actionOptionActive,
                        opt.value === 'emergency' && reviewForm.actionRequired === opt.value && styles.actionOptionEmergency,
                      ]}
                      onPress={() => setReviewForm(f => ({ ...f, actionRequired: opt.value }))}
                    >
                      <Ionicons
                        name={reviewForm.actionRequired === opt.value ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={reviewForm.actionRequired === opt.value
                          ? (opt.value === 'emergency' ? '#fff' : colors.primary)
                          : colors.textSecondary}
                      />
                      <Text style={[
                        styles.actionOptionText,
                        reviewForm.actionRequired === opt.value && styles.actionOptionTextActive,
                        opt.value === 'emergency' && reviewForm.actionRequired === opt.value && { color: '#fff' },
                      ]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReviewModal(false)}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, !reviewForm.remarks.trim() && { opacity: 0.5 }]}
                  onPress={handleSubmitReview}
                  disabled={isSubmitting || !reviewForm.remarks.trim()}
                >
                  <LinearGradient
                    colors={['#1565C0', '#42A5F5']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.submitBtnGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>{t('reviewRequests.submitReview')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.base, fontSize: 14, color: colors.textSecondary },
  countBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: colors.primary + '08', borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  countText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  filterRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  inputFilters: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
  listContent: { padding: spacing.base, paddingBottom: 80 },
  // Report card
  reportCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base,
    marginBottom: spacing.md, borderLeftWidth: 4, ...shadows.sm,
  },
  reportHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  medicineName: { fontSize: 15, fontWeight: '600', color: colors.text },
  patientName: { fontSize: 13, color: colors.primary, marginTop: 2, marginLeft: 24 },
  urgencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: borderRadius.full,
  },
  urgencyChipText: { fontSize: 10, fontWeight: '700' },
  severityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  severityBadgeText: { fontSize: 11, fontWeight: '700' },
  reasonBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.info + '08', borderRadius: borderRadius.md,
    padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.info + '15',
  },
  reasonText: { flex: 1, fontSize: 12, color: colors.text, lineHeight: 17 },
  effectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  effectChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full, gap: 4,
  },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  effectChipText: { fontSize: 11, color: colors.text, maxWidth: 100 },
  reportMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  dateText: { fontSize: 12, color: colors.textSecondary },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C4DFF15',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full, gap: 3,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: '#7C4DFF' },
  // Expanded
  expandedSection: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md },
  aiCard: { borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: spacing.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  aiHeaderText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  aiBody: { backgroundColor: '#7C4DFF08', padding: spacing.md },
  aiSummary: { fontSize: 13, color: colors.text, lineHeight: 19, marginBottom: spacing.sm },
  aiGuidanceBox: {
    backgroundColor: colors.info + '08', borderRadius: borderRadius.sm, padding: spacing.sm,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.info + '15',
  },
  aiGuidanceLabel: { fontSize: 11, fontWeight: '600', color: colors.info, marginBottom: 2 },
  aiGuidanceText: { fontSize: 12, color: colors.text, lineHeight: 17 },
  aiSubLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  aiRecRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 2 },
  aiRecText: { flex: 1, fontSize: 12, color: colors.text, lineHeight: 17 },
  aiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  aiLabel: { fontSize: 12, color: colors.textSecondary },
  aiValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  aiChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  aiErrorBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.error + '12',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  aiErrorText: {
    fontSize: 12,
    color: colors.error,
    lineHeight: 17,
  },
  aiChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  aiChipText: { fontSize: 10, fontWeight: '700' },
  expandedActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actionDisabledBtn: { opacity: 0.55 },
  viewDetailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary + '40',
  },
  viewDetailText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  reviewButton: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  reviewBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 1, borderRadius: borderRadius.md,
  },
  reviewBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: spacing.xxl },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: spacing.lg },
  emptyStateText: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
  aiSummaryAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.info + '08', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.info + '15',
  },
  aiSummaryAlertText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  formRow: { marginBottom: spacing.lg },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  agreeOptions: { gap: spacing.sm },
  agreeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  agreeBtnActive: {
    backgroundColor: colors.success, borderColor: colors.success,
  },
  disagreeBtnActive: {
    backgroundColor: colors.warning, borderColor: colors.warning,
  },
  agreeBtnText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  textArea: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: 14, color: colors.text, minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border,
  },
  textAreaSmall: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: 14, color: colors.text, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border,
  },
  actionGrid: { gap: spacing.xs },
  actionOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  actionOptionActive: {
    borderColor: colors.primary, backgroundColor: colors.primary + '08',
  },
  actionOptionEmergency: {
    borderColor: '#D32F2F', backgroundColor: '#D32F2F',
  },
  actionOptionText: { fontSize: 13, color: colors.text },
  actionOptionTextActive: { color: colors.primary, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, paddingBottom: spacing.lg },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  submitBtn: { flex: 2, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.md },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default ReviewRequestsScreen;
