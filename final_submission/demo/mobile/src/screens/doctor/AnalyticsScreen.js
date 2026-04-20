import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const STATUS_KEY_MAP = {
  Draft: 'status.draft',
  Submitted: 'status.submitted',
  'Under Review': 'status.underReview',
  Reviewed: 'status.reviewed',
  Closed: 'status.closed',
  Rejected: 'status.rejected',
};

const severityOrder = ['Life-threatening', 'Severe', 'Moderate', 'Mild'];

const AnalyticsScreen = () => {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    severe: 0,
    highPriority: 0,
    aiProcessed: 0,
    thisWeek: 0,
  });
  const [severityDistribution, setSeverityDistribution] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topMedications, setTopMedications] = useState([]);

  const loadAnalytics = async () => {
    try {
      const response = await reportService.getDashboardStats();
      const dashboard = response?.data || {};

      const statusMap = {};
      (dashboard.reportsByStatus || []).forEach((entry = {}) => {
        statusMap[entry._id] = entry.count || 0;
      });

      setStats({
        total: dashboard.totalReports || 0,
        pending: (statusMap.Submitted || 0) + (statusMap['Under Review'] || 0),
        reviewed: statusMap.Reviewed || 0,
        severe: dashboard.severeCaseCount || 0,
        highPriority: dashboard.highPriorityCount || 0,
        aiProcessed: dashboard.aiProcessedCount || 0,
        thisWeek: dashboard.reportsThisWeek || 0,
      });

      const serverSeverity = dashboard.patientSeverityDistribution?.length
        ? dashboard.patientSeverityDistribution
        : (dashboard.aiSeverityDistribution || []);
      const sevMap = {
        Mild: 0,
        Moderate: 0,
        Severe: 0,
        'Life-threatening': 0,
      };
      serverSeverity.forEach((entry = {}) => {
        if (entry._id && sevMap[entry._id] !== undefined) {
          sevMap[entry._id] = entry.count || 0;
        }
      });

      setSeverityDistribution(
        severityOrder.map((label) => ({
          label,
          count: sevMap[label] || 0,
        }))
      );

      setStatusDistribution(dashboard.reportsByStatus || []);
      setTopMedications((dashboard.mostReportedMedicines || []).slice(0, 5));
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await loadAnalytics();
      setIsLoading(false);
    };
    initialLoad();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const severityTotal = useMemo(
    () => severityDistribution.reduce((sum, item) => sum + item.count, 0),
    [severityDistribution]
  );

  const getSeverityColor = (label) => {
    switch (label) {
      case 'Mild':
        return colors.mild;
      case 'Moderate':
        return colors.moderate;
      case 'Severe':
        return colors.severe;
      case 'Life-threatening':
        return colors.lifeThreatening;
      default:
        return colors.textSecondary;
    }
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('reviewRequests.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTitleRow}>
          <Ionicons name={isAdmin ? 'shield-checkmark' : 'analytics'} size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>{t('nav.dashboard')}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isAdmin ? t('staffHome.adminSubtitle') : t('staffHome.doctorSubtitle')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('staffHome.stats.totalReports')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>{t('staffHome.stats.pendingReview')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.reviewed}</Text>
          <Text style={styles.statLabel}>{t('staffHome.stats.reviewed')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.highPriority}</Text>
          <Text style={styles.statLabel}>{t('staffHome.stats.highPriority')}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('staffHome.sections.severity')}</Text>
        {severityDistribution.map((item) => {
          const percent = severityTotal > 0 ? Math.round((item.count / severityTotal) * 100) : 0;
          const color = getSeverityColor(item.label);

          return (
            <View key={item.label} style={styles.metricRow}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricDot, { backgroundColor: color }]} />
                <Text style={styles.metricLabel}>{getSeverityLabel(item.label)}</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: `${percent}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.metricValue}>{item.count}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('staffHome.sections.topMedications')}</Text>
        {topMedications.length === 0 ? (
          <Text style={styles.emptyText}>{t('staffHome.emptyReports')}</Text>
        ) : (
          topMedications.map((medication, index) => (
            <View key={`${medication.medicineName || 'med'}-${index}`} style={styles.listRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.listLabel} numberOfLines={1}>
                {medication.medicineName || t('common.unknown')}
              </Text>
              <Text style={styles.listValue}>{medication.reportCount || 0}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('staffHome.sections.operations')}</Text>
        {statusDistribution.length === 0 ? (
          <Text style={styles.emptyText}>{t('staffHome.emptyReports')}</Text>
        ) : (
          statusDistribution.map((statusEntry = {}, index) => {
            const statusKey = STATUS_KEY_MAP[statusEntry._id];
            return (
              <View key={`${statusEntry._id || 'status'}-${index}`} style={styles.listRow}>
                <Text style={styles.listLabel}>
                  {statusKey ? t(statusKey) : (statusEntry._id || t('common.unknown'))}
                </Text>
                <Text style={styles.listValue}>{statusEntry.count || 0}</Text>
              </View>
            );
          })
        )}

        <View style={styles.weekPill}>
          <Ionicons name="calendar" size={14} color={colors.primary} />
          <Text style={styles.weekPillText}>
            {t('staffHome.thisWeek', { count: stats.thisWeek })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.base,
    color: colors.textSecondary,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
    marginBottom: spacing.base,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
    marginBottom: spacing.base,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metricRow: {
    marginBottom: spacing.sm,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  metricBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: 8,
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    textAlign: 'right',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rank: {
    width: 30,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  listLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  listValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  weekPill: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primary + '12',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  weekPillText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AnalyticsScreen;
