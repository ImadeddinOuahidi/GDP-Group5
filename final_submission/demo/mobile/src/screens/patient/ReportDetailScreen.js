import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';
import { API_CONFIG } from '../../config/constants';
import { useI18n } from '../../context/I18nContext';

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params;
  const { t, locale } = useI18n();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Review request dialog
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewReason, setReviewReason] = useState('');

  useEffect(() => { fetchReportDetail(); }, [reportId]);

  const fetchReportDetail = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      const response = await reportService.getReportById(reportId);
      setReport(response.data?.report || response.data || null);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRequestReview = async () => {
    try {
      setIsRequesting(true);
      await reportService.requestReview(reportId, { reason: reviewReason || undefined });
      setShowReviewDialog(false);
      setReviewReason('');
      Alert.alert(t('common.success'), t('reportDetail.requestReviewSuccess'));
      fetchReportDetail(true);
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('reportDetail.requestReviewFailed'));
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeleteReport = () => {
    Alert.alert(
      t('reportDetail.deleteTitle'),
      t('reportDetail.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: async () => {
          try {
            await reportService.deleteReport(reportId);
            Alert.alert(t('common.deleted'), t('reportDetail.deleteSuccess'));
            navigation.goBack();
          } catch (error) {
            Alert.alert(t('common.error'), error.response?.data?.message || t('reportDetail.deleteFailed'));
          }
        }},
      ]
    );
  };

  const handleExportJSON = async () => {
    try {
      const json = JSON.stringify(report, null, 2);
      const fileUri = FileSystem.cacheDirectory + `report-${reportId}.json`;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: t('reportDetail.exportDialogTitle') });
      } else {
        Alert.alert(t('common.error'), t('reportDetail.sharingUnavailable'));
      }
    } catch (error) {
      console.error('Export JSON error:', error);
      Alert.alert(t('common.error'), t('reportDetail.exportFailed'));
    }
  };

  const handlePrintReport = async () => {
    try {
      const aiSummary = safeStr(ai?.summary) || safeStr(ai?.clinicalSummary);
      const sideEffects = (report.sideEffects || []).map(
        (se) => `<li><b>${se.effect || t('common.unknown')}</b> - ${getSeverityLabel(se.severity)} (${se.duration || t('common.notAvailable')})</li>`
      ).join('');
      const html = `
        <html><body style="font-family:system-ui;padding:20px;">
          <h1>${t('reportDetail.print.title')}</h1>
          <p>${t('reportDetail.print.generatedNotice')}</p>
          <p><b>${t('reportDetail.labels.reportId')}:</b> ${report._id}</p>
          <p><b>${t('reportDetail.labels.status')}:</b> ${getStatusLabel(report.status)}</p>
          <p><b>${t('reportDetail.labels.medication')}:</b> ${report.medicine?.name || t('common.unknown')}</p>
          <p><b>${t('reportDetail.labels.date')}:</b> ${formatDate(report.createdAt)}</p>
          <h2>${t('reportDetail.sections.sideEffects', { count: report.sideEffects?.length || 0 })}</h2>
          <ul>${sideEffects || `<li>${t('reportDetail.labels.sideEffectsEmpty')}</li>`}</ul>
          ${ai ? `<h2>${t('reportDetail.print.aiAnalysis')}</h2>
            <p><b>${t('reportDetail.labels.severity')}:</b> ${getSeverityLabel(safeStr(ai.severity)) || t('common.notAvailable')}</p>
            <p><b>${t('reportDetail.labels.summary')}:</b> ${aiSummary || t('common.notAvailable')}</p>` : ''}
          ${review?.status === 'completed' ? `<h2>${t('reportDetail.print.doctorReview')}</h2>
            <p><b>${t('reportDetail.labels.assessment')}:</b> ${review.doctorAssessment?.assessment || t('common.notAvailable')}</p>` : ''}
        </body></html>`;
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(t('common.error'), t('reportDetail.printFailed'));
    }
  };

  const getAttachmentUrl = (attachment) => {
    if (attachment.url) {
      // If URL is relative, prepend base URL
      if (attachment.url.startsWith('/')) {
        return `${API_CONFIG.BASE_URL}${attachment.url}`;
      }
      return attachment.url;
    }
    if (attachment.key) {
      return `${API_CONFIG.BASE_URL}/api/uploads/${attachment.key}`;
    }
    return null;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return colors.textSecondary;
      case 'Submitted': return colors.warning;
      case 'Under Review': return colors.info;
      case 'Reviewed': return colors.success;
      case 'Closed': return colors.success;
      case 'Rejected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getUrgencyConfig = (level) => {
    switch (level?.toLowerCase()) {
      case 'emergency':
        return { gradient: ['#B71C1C', '#F44336'], icon: 'alert-circle', label: t('reportDetail.urgency.emergency'), color: '#F44336' };
      case 'urgent':
        return { gradient: ['#E65100', '#FF9800'], icon: 'warning', label: t('reportDetail.urgency.urgent'), color: '#FF9800' };
      case 'soon':
        return { gradient: ['#0D47A1', '#42A5F5'], icon: 'time', label: t('reportDetail.urgency.soon'), color: '#42A5F5' };
      default:
        return { gradient: ['#1B5E20', '#4CAF50'], icon: 'checkmark-circle', label: t('reportDetail.urgency.routine'), color: '#4CAF50' };
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      none: t('reviewRequests.actions.none'),
      monitor: t('reviewRequests.actions.monitor'),
      adjust_medication: t('reviewRequests.actions.adjustMedication'),
      discontinue: t('reviewRequests.actions.discontinue'),
      schedule_appointment: t('reviewRequests.actions.scheduleAppointment'),
      emergency: t('reviewRequests.actions.emergency'),
    };
    return labels[action] || action || t('common.notAvailable');
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'emergency': return '#F44336';
      case 'discontinue': return '#FF9800';
      case 'adjust_medication': return '#FFC107';
      case 'schedule_appointment': return colors.info;
      case 'monitor': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusLabel = (status) => {
    const key = {
      Draft: 'status.draft',
      Submitted: 'status.submitted',
      'Under Review': 'status.underReview',
      Reviewed: 'status.reviewed',
      Closed: 'status.closed',
      Rejected: 'status.rejected',
    }[status];

    return key ? t(key) : status || t('common.unknown');
  };

  const getSeverityLabel = (severity) => {
    const normalized = String(severity || '').toLowerCase();
    const key = {
      mild: 'reviewRequests.severity.mild',
      moderate: 'reviewRequests.severity.moderate',
      severe: 'reviewRequests.severity.severe',
      'life-threatening': 'reviewRequests.severity.lifeThreatening',
    }[normalized];

    return key ? t(key) : severity || t('common.unknown');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('reportDetail.loading')}</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>{t('reportDetail.notFound')}</Text>
      </View>
    );
  }

  const ai = report.metadata?.aiAnalysis;
  const aiStatus = report.metadata?.aiStatus || (report.metadata?.aiProcessed ? 'completed' : 'queued');
  const review = report.doctorReview;
  const statusColor = getStatusColor(report.status);
  const canRequestReview = !report.doctorReview?.requested && report.doctorReview?.status !== 'completed';
  const canDelete = report.status === 'Draft' || report.status === 'Submitted';
  const urgencyConfig = getUrgencyConfig(ai?.patientGuidance?.urgencyLevel);
  const statusTimeline = [...(report.statusHistory || [])]
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  // AI fields can be objects {level, confidence, reasoning} or plain strings
  const safeStr = (val) => {
    if (val == null) return null;
    if (typeof val === 'object') return val.level || val.classification || JSON.stringify(val);
    return val;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatChangedBy = (changedBy) => {
    if (!changedBy) return t('common.system');
    if (typeof changedBy === 'string') return t('common.system');
    return `${changedBy.firstName || ''} ${changedBy.lastName || ''}`.trim() || t('common.system');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchReportDetail(true)} colors={[colors.primary]} />}
    >
      {/* Status Header */}
      <View style={[styles.statusHeader, { backgroundColor: statusColor + '12', borderLeftColor: statusColor }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusHeaderText, { color: statusColor }]}>{getStatusLabel(report.status)}</Text>
        <Text style={styles.reportId}>#{reportId?.slice(-6)}</Text>
      </View>

      {/* Status Timeline */}
      {statusTimeline.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={colors.info} />
            <Text style={styles.sectionTitle}>{t('reportDetail.sections.statusTimeline')}</Text>
          </View>
          <View style={styles.card}>
            {statusTimeline.map((entry, index) => (
              <View
                key={`${entry.changedAt || entry.status}-${index}`}
                style={[
                  styles.timelineRow,
                  index !== statusTimeline.length - 1 && styles.timelineRowBorder,
                ]}
              >
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(entry.status) }]} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineTopRow}>
                    <Text style={styles.timelineStatus}>{getStatusLabel(entry.status)}</Text>
                    <Text style={styles.timelineDate}>{formatDateTime(entry.changedAt)}</Text>
                  </View>
                  <Text style={styles.timelineMeta}>{t('reportDetail.labels.updatedBy', { name: formatChangedBy(entry.changedBy) })}</Text>
                  {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Medication Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('reportDetail.sections.medication')}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.medicineName}>{report.medicine?.name || t('common.unknown')}</Text>
          {report.medicine?.genericName && (
            <Text style={styles.medicineGeneric}>{report.medicine.genericName}</Text>
          )}
          <View style={styles.tagRow}>
            {report.medicine?.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{report.medicine.category}</Text>
              </View>
            )}
            {report.medicine?.manufacturer && (
              <View style={[styles.tag, { backgroundColor: colors.textSecondary + '15' }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{report.medicine.manufacturer}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Side Effects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={styles.sectionTitle}>{t('reportDetail.sections.sideEffects', { count: report.sideEffects?.length || 0 })}</Text>
        </View>
        {report.sideEffects?.map((effect, index) => (
          <View key={index} style={[styles.card, { marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: getSeverityColor(effect.severity) }]}>
            <View style={styles.sideEffectHeader}>
              <Text style={styles.sideEffectTitle}>{effect.effect}</Text>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(effect.severity) + '18' }]}>
                <Text style={[styles.severityText, { color: getSeverityColor(effect.severity) }]}>{getSeverityLabel(effect.severity)}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('reportDetail.labels.onset')}</Text>
              <Text style={styles.detailValue}>{effect.onset || t('common.unknown')}</Text>
            </View>
            {effect.bodySystem && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('reportDetail.labels.bodySystem')}</Text>
                <Text style={styles.detailValue}>{effect.bodySystem}</Text>
              </View>
            )}
            {effect.description && (
              <Text style={styles.descriptionText}>{effect.description}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Medication Usage Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color={colors.info} />
          <Text style={styles.sectionTitle}>{t('reportDetail.sections.medicationUsage')}</Text>
        </View>
        <View style={styles.card}>
          {[
            [t('reportDetail.labels.indication'), report.medicationUsage?.indication || t('reportDetail.labels.notSpecified')],
            [t('reportDetail.labels.dosage'), report.medicationUsage?.dosage?.amount || t('common.notAvailable')],
            [t('reportDetail.labels.frequency'), report.medicationUsage?.dosage?.frequency || t('common.notAvailable')],
            [t('reportDetail.labels.route'), report.medicationUsage?.dosage?.route || t('common.notAvailable')],
            [t('reportDetail.labels.startDate'), formatDate(report.medicationUsage?.startDate)],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Report Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>{t('reportDetail.sections.reportDetails')}</Text>
        </View>
        <View style={styles.card}>
          {[
            [t('reportDetail.labels.incidentDate'), formatDate(report.reportDetails?.incidentDate)],
            [t('reportDetail.labels.reportDate'), formatDate(report.createdAt)],
            [t('reportDetail.labels.seriousness'), report.reportDetails?.seriousness || t('reportDetail.labels.notAssessed')],
            [t('reportDetail.labels.outcome'), report.reportDetails?.outcome || t('common.unknown')],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ═══ AI Analysis Section (matching web) ═══ */}
      {aiStatus === 'completed' && ai ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color="#7C4DFF" />
            <Text style={styles.sectionTitle}>{t('reportDetail.sections.aiAnalysis')}</Text>
          </View>
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: '#7C4DFF', overflow: 'hidden' }]}>
            {/* Urgency Banner */}
            <LinearGradient
              colors={urgencyConfig.gradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.urgencyBanner}
            >
              <Ionicons name={urgencyConfig.icon} size={18} color="#fff" />
              <Text style={styles.urgencyText}>{urgencyConfig.label}</Text>
            </LinearGradient>

            {/* What This Means For You */}
            {ai.patientGuidance?.recommendation && (
              <View style={styles.guidanceBox}>
                <View style={styles.guidanceHeader}>
                  <Ionicons name="information-circle" size={16} color={colors.info} />
                  <Text style={styles.guidanceTitle}>{t('reportDetail.labels.whatThisMeans')}</Text>
                </View>
                <Text style={styles.guidanceText}>{ai.patientGuidance.recommendation}</Text>
              </View>
            )}

            {/* Recommended Next Steps */}
            {ai.patientGuidance?.nextSteps?.length > 0 && (
              <View style={styles.aiListSection}>
                <Text style={styles.aiListTitle}>{t('reportDetail.labels.recommendedNextSteps')}</Text>
                {ai.patientGuidance.nextSteps.map((step, i) => (
                  <View key={i} style={styles.aiListRow}>
                    <View style={styles.aiListDot}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    </View>
                    <Text style={styles.aiListText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Warning Signs to Watch */}
            {ai.patientGuidance?.warningSignsToWatch?.length > 0 && (
              <View style={[styles.aiListSection, { backgroundColor: '#FFF3E0', borderRadius: borderRadius.md, padding: spacing.md }]}>
                <Text style={[styles.aiListTitle, { color: '#E65100' }]}>{t('reportDetail.labels.warningSigns')}</Text>
                {ai.patientGuidance.warningSignsToWatch.map((sign, i) => (
                  <View key={i} style={styles.aiListRow}>
                    <Ionicons name="alert-circle" size={14} color="#E65100" />
                    <Text style={[styles.aiListText, { color: '#BF360C' }]}>{sign}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Emergency / Medical Attention Buttons */}
            {ai.patientGuidance?.shouldSeekMedicalAttention && (
              <View style={styles.emergencyActions}>
                {ai.patientGuidance?.urgencyLevel === 'emergency' && (
                  <TouchableOpacity
                    style={styles.emergencyBtn}
                    onPress={() => Linking.openURL('tel:911')}
                  >
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={styles.emergencyBtnText}>{t('reportDetail.buttons.callEmergency')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.findCareBtn}
                  onPress={() => Linking.openURL('https://www.google.com/maps/search/hospital+near+me')}
                >
                  <Ionicons name="medkit" size={16} color={urgencyConfig.color} />
                  <Text style={[styles.findCareBtnText, { color: urgencyConfig.color }]}>{t('reportDetail.buttons.findNearbyCare')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Clinical Summary */}
            {(ai.summary || ai.clinicalSummary) && (
              <View style={styles.aiReasoningBox}>
                <Text style={styles.aiReasoningLabel}>{t('reportDetail.labels.clinicalSummary')}</Text>
                <Text style={styles.aiReasoningText}>{safeStr(ai.summary) || safeStr(ai.clinicalSummary)}</Text>
              </View>
            )}
            <View style={[styles.detailRow, { marginTop: spacing.md }]}>
              <Text style={styles.detailLabel}>{t('reportDetail.labels.aiStatusLabel')}</Text>
              <Text style={styles.detailValue}>{t(`reportDetail.aiStatus.${aiStatus}`)}</Text>
            </View>
            {report.metadata?.aiProvider ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('reportDetail.labels.aiProviderLabel')}</Text>
                <Text style={styles.detailValue}>{report.metadata.aiProvider}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : aiStatus === 'failed' ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color="#7C4DFF" />
            <Text style={styles.sectionTitle}>{t('reportDetail.sections.aiAnalysis')}</Text>
          </View>
          <View style={[styles.card, { alignItems: 'flex-start', paddingVertical: spacing.xl }]}>
            <Text style={[styles.sectionTitle, { fontSize: 15 }]}>{t('reportDetail.aiStatus.failed')}</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {t('reportDetail.aiStatusDescription.failed')}
            </Text>
            {report.metadata?.aiProcessingError ? (
              <Text style={[styles.descriptionText, { marginTop: spacing.sm }]}>
                {t('reportDetail.labels.aiFailureReasonLabel')}: {report.metadata.aiProcessingError}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color="#7C4DFF" />
            <Text style={styles.sectionTitle}>{t('reportDetail.sections.aiAnalysis')}</Text>
          </View>
          <View style={[styles.card, { alignItems: 'center', paddingVertical: spacing.xl }]}>
            <ActivityIndicator size="large" color="#7C4DFF" />
            <Text style={[styles.sectionTitle, { marginTop: spacing.base, fontSize: 15 }]}>{t(`reportDetail.aiStatus.${aiStatus === 'processing' ? 'processing' : 'queued'}`)}</Text>
            <Text style={[styles.descriptionText, { textAlign: 'center', color: colors.textSecondary }]}>
              {t(`reportDetail.aiStatusDescription.${aiStatus === 'processing' ? 'processing' : 'queued'}`)}
            </Text>
          </View>
        </View>
      )}

      {/* ═══ Doctor Review Section (matching web data paths) ═══ */}
      {review?.status === 'completed' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>{t('reportDetail.sections.doctorReview')}</Text>
          </View>
          <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
            {/* Success banner */}
            <View style={styles.reviewBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.reviewBannerText}>
                {t('reportDetail.labels.reviewedBy', { name: `${review.reviewedBy?.firstName || ''} ${review.reviewedBy?.lastName || ''}`.trim() })}
              </Text>
              <Text style={styles.reviewDate}>{formatShortDate(review.reviewedAt)}</Text>
            </View>

            {/* Remarks */}
            {review.remarks && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionLabel}>{t('reportDetail.labels.doctorRemarks')}</Text>
                <View style={styles.reviewTextBox}>
                  <Text style={styles.reviewText}>{review.remarks}</Text>
                </View>
              </View>
            )}

            {/* Recommendation */}
            {review.doctorAssessment?.recommendation && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionLabel}>{t('reportDetail.labels.recommendation')}</Text>
                <View style={styles.reviewTextBox}>
                  <Text style={styles.reviewText}>{review.doctorAssessment.recommendation}</Text>
                </View>
              </View>
            )}

            {/* Action Required */}
            {review.doctorAssessment?.actionRequired && review.doctorAssessment.actionRequired !== 'none' && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionLabel}>{t('reportDetail.labels.actionRequired')}</Text>
                <View style={[styles.actionChip, { borderColor: getActionColor(review.doctorAssessment.actionRequired) }]}>
                  <Ionicons name="alert-circle" size={14} color={getActionColor(review.doctorAssessment.actionRequired)} />
                  <Text style={[styles.actionChipText, { color: getActionColor(review.doctorAssessment.actionRequired) }]}>
                    {getActionLabel(review.doctorAssessment.actionRequired)}
                  </Text>
                </View>
              </View>
            )}

            {/* Follow-up */}
            {review.doctorAssessment?.followUpRequired && (
              <View style={[styles.followUpBox]}>
                <Ionicons name="calendar" size={14} color={colors.info} />
                <Text style={styles.followUpText}>
                  {t('reportDetail.labels.followUp', {
                    date: review.doctorAssessment.followUpDate
                      ? formatDate(review.doctorAssessment.followUpDate)
                      : t('reportDetail.labels.required'),
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Review Requested but not completed */}
      {review?.requested && review?.status !== 'completed' && (
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.info + '08', borderWidth: 1, borderColor: colors.info + '30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="hourglass" size={18} color={colors.info} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.info }}>{t('reportDetail.labels.reviewRequested')}</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm }}>
              {t('reportDetail.labels.reviewRequestedDescription')}
            </Text>
          </View>
        </View>
      )}

      {/* ═══ Attachments Section ═══ */}
      {report.attachments?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="attach" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('reportDetail.sections.attachments', { count: report.attachments.length })}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.attachmentsGrid}>
              {report.attachments.map((att, idx) => {
                const url = getAttachmentUrl(att);
                const isImage = att.mimeType?.startsWith('image/');
                const isAudio = att.mimeType?.startsWith('audio/');
                const isVideo = att.mimeType?.startsWith('video/');
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.attachmentCard}
                    onPress={() => url && Linking.openURL(url)}
                  >
                    {isImage && url ? (
                      <Image source={{ uri: url }} style={styles.attachmentImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.attachmentPlaceholder, {
                        backgroundColor: isAudio ? '#7C4DFF15' : isVideo ? '#E6510015' : colors.primary + '15',
                      }]}>
                        <Ionicons
                          name={isAudio ? 'musical-notes' : isVideo ? 'videocam' : 'document'}
                          size={24}
                          color={isAudio ? '#7C4DFF' : isVideo ? '#E65100' : colors.primary}
                        />
                      </View>
                    )}
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {att.originalName || t('reportDetail.labels.attachmentFile', { index: idx + 1 })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {/* Export / Share Buttons */}
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportJSON}>
            <Ionicons name="share-outline" size={16} color={colors.primary} />
            <Text style={styles.exportBtnText}>{t('common.exportJson')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={handlePrintReport}>
            <Ionicons name="print-outline" size={16} color={colors.primary} />
            <Text style={styles.exportBtnText}>{t('common.print')}</Text>
          </TouchableOpacity>
        </View>
        {canRequestReview && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => setShowReviewDialog(true)}
            disabled={isRequesting}
          >
            <LinearGradient
              colors={['#1565C0', '#42A5F5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.gradientBtnText}>{t('reportDetail.buttons.requestDoctorReview')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {canDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteReport}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteBtnText}>{t('reportDetail.buttons.deleteReport')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: spacing.xxl }} />

      {/* Review Request Dialog (matching web) */}
      <Modal visible={showReviewDialog} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContent}>
            <Text style={styles.dialogTitle}>{t('reportDetail.dialog.title')}</Text>
            <Text style={styles.dialogDesc}>
              {t('reportDetail.dialog.description')}
            </Text>
            <Text style={styles.dialogLabel}>{t('reportDetail.dialog.optionalPrompt')}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder={t('reportDetail.dialog.placeholder')}
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
              value={reviewReason}
              onChangeText={setReviewReason}
              textAlignVertical="top"
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => { setShowReviewDialog(false); setReviewReason(''); }}
              >
                <Text style={styles.dialogCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogSubmitBtn}
                onPress={handleRequestReview}
                disabled={isRequesting}
              >
                <LinearGradient
                  colors={['#1565C0', '#42A5F5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.dialogSubmitGradient}
                >
                  {isRequesting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.dialogSubmitText}>{t('reportDetail.buttons.submitRequest')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.base, fontSize: 14, color: colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  errorText: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.base },
  // Status
  statusHeader: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.base,
    borderLeftWidth: 4, margin: spacing.base, borderRadius: borderRadius.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  statusHeaderText: { fontSize: 14, fontWeight: '700', flex: 1 },
  reportId: { fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  timelineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timelineStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  timelineDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  timelineMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    lineHeight: 18,
  },
  // Sections
  section: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base, ...shadows.sm },
  medicineName: { fontSize: 18, fontWeight: '700', color: colors.text },
  medicineGeneric: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  // Side effects
  sideEffectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sideEffectTitle: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  severityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  severityText: { fontSize: 11, fontWeight: '700' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '500' },
  descriptionText: { fontSize: 13, color: colors.text, marginTop: spacing.sm, lineHeight: 20 },
  // AI Analysis
  urgencyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  urgencyText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  guidanceBox: {
    backgroundColor: colors.info + '08', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.info + '20',
  },
  guidanceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  guidanceTitle: { fontSize: 13, fontWeight: '700', color: colors.info },
  guidanceText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  aiStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  aiStatItem: { flex: 1, alignItems: 'center' },
  aiStatLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  aiStatValue: { fontSize: 17, fontWeight: '700' },
  aiStatDivider: { width: 1, height: 36, backgroundColor: colors.divider },
  aiListSection: { marginTop: spacing.md },
  aiListTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  aiListRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  aiListDot: {},
  aiListText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  emergencyActions: { marginTop: spacing.md, gap: spacing.sm },
  emergencyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: '#D32F2F', borderRadius: borderRadius.md, paddingVertical: 12,
  },
  emergencyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  findCareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderRadius: borderRadius.md, paddingVertical: 12, borderWidth: 1, borderColor: colors.border,
  },
  findCareBtnText: { fontSize: 14, fontWeight: '600' },
  aiReasoningBox: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  aiReasoningLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  aiReasoningText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  // Doctor Review
  reviewBanner: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  reviewBannerText: { fontSize: 14, fontWeight: '600', color: colors.success, flex: 1 },
  reviewDate: { fontSize: 11, color: colors.textSecondary },
  aiAgreementBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  aiAgreementText: { fontSize: 13, fontWeight: '500' },
  reviewSection: { marginBottom: spacing.md },
  reviewSectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  reviewTextBox: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md },
  reviewText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  actionChipText: { fontSize: 12, fontWeight: '600' },
  followUpBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.info + '10', borderRadius: borderRadius.md,
    padding: spacing.md, marginTop: spacing.sm,
  },
  followUpText: { fontSize: 13, color: colors.info, fontWeight: '500' },
  // Action buttons
  actionsSection: { padding: spacing.base, gap: spacing.md },
  reviewBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  gradientBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: borderRadius.md,
  },
  gradientBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error + '40',
    backgroundColor: colors.error + '08',
  },
  deleteBtnText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  // Review Request Dialog
  dialogOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  dialogContent: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.xl, width: '90%', maxWidth: 400,
  },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  dialogDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  dialogLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  dialogInput: {
    backgroundColor: colors.background, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    fontSize: 14, color: colors.text, minHeight: 80,
  },
  dialogActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  dialogCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  dialogCancelText: { fontSize: 14, fontWeight: '600', color: colors.text },
  dialogSubmitBtn: { flex: 2, borderRadius: borderRadius.md, overflow: 'hidden' },
  dialogSubmitGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: borderRadius.md },
  dialogSubmitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  // Attachments
  attachmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  attachmentCard: { width: 90, alignItems: 'center' },
  attachmentImage: { width: 80, height: 80, borderRadius: borderRadius.md },
  attachmentPlaceholder: {
    width: 80, height: 80, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  attachmentName: { fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  // Export
  exportRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});

export default ReportDetailScreen;
