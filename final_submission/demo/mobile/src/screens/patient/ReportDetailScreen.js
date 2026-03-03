import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const ReportDetailScreen = ({ route }) => {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportDetail();
  }, [reportId]);

  const fetchReportDetail = async () => {
    try {
      const response = await reportService.getReportById(reportId);
      if (response.data) {
        setReport(response.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Mild': return colors.mild;
      case 'Moderate': return colors.moderate;
      case 'Severe': return colors.severe;
      case 'Life-threatening': return colors.lifeThreatening;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Medication Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Medication</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.medicineName}>{report.medicine?.name || 'Unknown'}</Text>
          {report.medicine?.genericName && (
            <Text style={styles.medicineGeneric}>{report.medicine.genericName}</Text>
          )}
          <View style={styles.medicineDetails}>
            {report.medicine?.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{report.medicine.category}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Side Effects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={styles.sectionTitle}>Side Effects</Text>
        </View>
        {report.sideEffects?.map((effect, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.sideEffectHeader}>
              <Text style={styles.sideEffectTitle}>{effect.effect}</Text>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(effect.severity) },
                ]}
              >
                <Text style={styles.severityText}>{effect.severity}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Onset:</Text>
              <Text style={styles.detailValue}>{effect.onset || 'Unknown'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Body System:</Text>
              <Text style={styles.detailValue}>{effect.bodySystem || 'Unknown'}</Text>
            </View>
            
            {effect.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.descriptionText}>{effect.description}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Medication Usage Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color={colors.info} />
          <Text style={styles.sectionTitle}>Medication Usage</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Indication:</Text>
            <Text style={styles.detailValue}>
              {report.medicationUsage?.indication || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dosage:</Text>
            <Text style={styles.detailValue}>
              {report.medicationUsage?.dosage?.amount || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency:</Text>
            <Text style={styles.detailValue}>
              {report.medicationUsage?.dosage?.frequency || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>
              {report.medicationUsage?.dosage?.route || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>
              {formatDate(report.medicationUsage?.startDate)}
            </Text>
          </View>
        </View>
      </View>

      {/* Report Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color={colors.textSecondary} />
          <Text style={styles.sectionTitle}>Report Details</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Incident Date:</Text>
            <Text style={styles.detailValue}>
              {formatDate(report.reportDetails?.incidentDate)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Report Date:</Text>
            <Text style={styles.detailValue}>
              {formatDate(report.reportDetails?.reportDate || report.createdAt)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seriousness:</Text>
            <Text style={styles.detailValue}>
              {report.reportDetails?.seriousness || 'Not assessed'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Outcome:</Text>
            <Text style={styles.detailValue}>
              {report.reportDetails?.outcome || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {report.status?.replace('_', ' ') || 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI Analysis Section */}
      {report.metadata?.aiAnalysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>AI Analysis</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Overall Severity:</Text>
              <Text style={styles.detailValue}>
                {report.metadata.aiAnalysis.overallSeverity || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Priority:</Text>
              <Text style={styles.detailValue}>
                {report.metadata.aiAnalysis.priorityLevel || 'N/A'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confidence:</Text>
              <Text style={styles.detailValue}>
                {report.metadata.aiAnalysis.confidenceScore || 0}%
              </Text>
            </View>
            
            {report.metadata.aiAnalysis.reasoning && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.detailLabel}>Reasoning:</Text>
                <Text style={styles.descriptionText}>
                  {report.metadata.aiAnalysis.reasoning}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.base,
  },
  section: {
    padding: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  medicineGeneric: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  medicineDetails: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  sideEffectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sideEffectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  descriptionContainer: {
    paddingTop: spacing.md,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  statusBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default ReportDetailScreen;
