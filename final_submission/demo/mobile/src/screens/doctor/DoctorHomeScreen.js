import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { reportService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const DoctorHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    seriousReports: 0,
    pendingReviewCount: 0,
    reviewedCount: 0,
    severeCaseCount: 0,
    highPriorityCount: 0,
    aiAnalyzedCount: 0,
    reportsThisWeek: 0,
    aiSeverityDistribution: [],
    patientSeverityDistribution: [],
    mostReportedMedicines: [],
    reportsByStatus: [],
    reportsByPriority: [],
  });
  const [recentReports, setRecentReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, reportsRes] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getAllReports({ limit: 100 }),
      ]);
      if (dashRes.data) {
        const d = dashRes.data;
        // Derive reviewedCount from reportsByStatus
        const reviewedEntry = (d.reportsByStatus || []).find(
          (s) => s._id === 'Reviewed' || s._id === 'reviewed'
        );
        setStats({
          totalReports: d.totalReports || 0,
          seriousReports: d.seriousReports || 0,
          pendingReviewCount: d.pendingReviewCount || 0,
          reviewedCount: reviewedEntry?.count || 0,
          severeCaseCount: d.severeCaseCount || 0,
          highPriorityCount: d.highPriorityCount || 0,
          aiAnalyzedCount: d.aiProcessedCount || 0,
          reportsThisWeek: d.reportsThisWeek || 0,
          // Store server-aggregated distributions
          aiSeverityDistribution: d.aiSeverityDistribution || [],
          patientSeverityDistribution: d.patientSeverityDistribution || [],
          mostReportedMedicines: d.mostReportedMedicines || [],
          reportsByStatus: d.reportsByStatus || [],
          reportsByPriority: d.reportsByPriority || [],
        });
      }
      if (reportsRes.data) {
        const reports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
        setAllReports(reports);
        setRecentReports(reports.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Use server-aggregated severity distribution (patient-reported, with AI fallback)
  const severityDist = (() => {
    const serverDist = stats.patientSeverityDistribution?.length
      ? stats.patientSeverityDistribution
      : stats.aiSeverityDistribution || [];

    const counts = { Mild: 0, Moderate: 0, Severe: 0, 'Life-threatening': 0 };
    serverDist.forEach((item) => {
      if (item._id && counts[item._id] !== undefined) {
        counts[item._id] = item.count || 0;
      }
    });
    // Fallback to client-side computation if server data is empty
    if (Object.values(counts).every((v) => v === 0) && allReports.length > 0) {
      allReports.forEach((r) => {
        r.sideEffects?.forEach((se) => {
          if (counts[se.severity] !== undefined) counts[se.severity]++;
        });
      });
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 100),
    }));
  })();

  // Use server-aggregated top medications (with client-side fallback)
  const topMedications = (() => {
    if (stats.mostReportedMedicines?.length) {
      return stats.mostReportedMedicines.slice(0, 5).map((m) => ({
        name: m.medicineName || m.name || 'Unknown',
        count: m.reportCount || m.count || 0,
      }));
    }
    // Fallback to client-side
    const medMap = {};
    allReports.forEach((r) => {
      const name = r.medicine?.name;
      if (name) medMap[name] = (medMap[name] || 0) + 1;
    });
    return Object.entries(medMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  })();

  const getSeverityColor = (label) => {
    switch (label) {
      case 'Mild': return colors.mild;
      case 'Moderate': return colors.moderate;
      case 'Severe': return colors.severe;
      case 'Life-threatening': return colors.lifeThreatening;
      default: return colors.textSecondary;
    }
  };

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports || allReports.length,
      icon: 'document-text',
      gradient: ['#1565C0', '#42A5F5'],
    },
    {
      title: 'Pending Review',
      value: stats.pendingReviewCount || 0,
      icon: 'time',
      gradient: ['#E65100', '#FF9800'],
    },
    {
      title: 'Reviewed',
      value: stats.reviewedCount || 0,
      icon: 'checkmark-circle',
      gradient: ['#1B5E20', '#4CAF50'],
    },
    {
      title: 'Severe Cases',
      value: stats.severeCaseCount || stats.seriousReports || 0,
      icon: 'alert-circle',
      gradient: ['#B71C1C', '#F44336'],
    },
    {
      title: 'High Priority',
      value: stats.highPriorityCount || 0,
      icon: 'flame',
      gradient: ['#880E4F', '#E91E63'],
    },
    {
      title: 'AI Analyzed',
      value: stats.aiAnalyzedCount || 0,
      icon: 'analytics',
      gradient: ['#4A148C', '#7C4DFF'],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Dr. {user?.lastName || 'User'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="medkit" size={12} color="#fff" />
            <Text style={styles.roleText}>Doctor Portal</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Pending Review Alert */}
      {(stats.pendingReviewCount || 0) > 0 && (
        <TouchableOpacity
          style={styles.pendingAlert}
          onPress={() => navigation.navigate('Review')}
        >
          <View style={styles.pendingAlertLeft}>
            <View style={styles.pendingAlertIcon}>
              <Ionicons name="alert" size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.pendingAlertTitle}>Pending Reviews</Text>
              <Text style={styles.pendingAlertDesc}>
                {stats.pendingReviewCount} report{stats.pendingReviewCount > 1 ? 's' : ''} awaiting review
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* 6 Stat Cards Grid */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {statCards.map((card, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.statCardWrapper}
              onPress={() => navigation.navigate('Review')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={card.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={styles.statCardIcon}>
                  <Ionicons name={card.icon} size={22} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statCardValue}>{card.value}</Text>
                <Text style={styles.statCardTitle}>{card.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Severity Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severity Distribution</Text>
        <View style={styles.card}>
          {severityDist.map((item, idx) => (
            <View key={idx} style={styles.severityRow}>
              <View style={styles.severityLabelRow}>
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(item.label) }]} />
                <Text style={styles.severityLabel}>{item.label}</Text>
                <Text style={styles.severityCount}>{item.count}</Text>
              </View>
              <View style={styles.severityBarBg}>
                <View
                  style={[
                    styles.severityBarFill,
                    { width: `${item.percent}%`, backgroundColor: getSeverityColor(item.label) },
                  ]}
                />
              </View>
              <Text style={styles.severityPercent}>{item.percent}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Medications */}
      {topMedications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Reported Medications</Text>
          <View style={styles.card}>
            {topMedications.map((med, idx) => (
              <View key={idx} style={[styles.medRow, idx < topMedications.length - 1 && styles.medRowBorder]}>
                <View style={styles.medRank}>
                  <Text style={styles.medRankText}>{idx + 1}</Text>
                </View>
                <Text style={styles.medName} numberOfLines={1}>{med.name}</Text>
                <View style={styles.medCountBadge}>
                  <Text style={styles.medCountText}>{med.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Review')}
          >
            <LinearGradient colors={['#E65100', '#FF9800']} style={styles.actionIconBg}>
              <Ionicons name="clipboard" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Review Reports</Text>
            {(stats.pendingReviewCount || 0) > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{stats.pendingReviewCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Medications', { screen: 'MedicationsList' })}
          >
            <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.actionIconBg}>
              <Ionicons name="medkit" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Medications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Medications', { screen: 'AddMedication' })}
          >
            <LinearGradient colors={['#1B5E20', '#4CAF50']} style={styles.actionIconBg}>
              <Ionicons name="add-circle" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Review')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentReports.length > 0 ? recentReports.map((report) => (
          <TouchableOpacity
            key={report._id}
            style={styles.reportCard}
            onPress={() => navigation.navigate('ReportDetail', { reportId: report._id })}
          >
            <View style={styles.reportLeft}>
              <View style={[styles.reportAvatar, {
                backgroundColor: (report.sideEffects?.[0]?.severity === 'Severe' || report.sideEffects?.[0]?.severity === 'Life-threatening')
                  ? colors.error + '15' : colors.primary + '15'
              }]}>
                <Ionicons
                  name="document-text"
                  size={18}
                  color={(report.sideEffects?.[0]?.severity === 'Severe' || report.sideEffects?.[0]?.severity === 'Life-threatening')
                    ? colors.error : colors.primary}
                />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportMedicine} numberOfLines={1}>
                  {report.medicine?.name || 'Unknown'}
                </Text>
                <Text style={styles.reportPatient} numberOfLines={1}>
                  {report.patient?.firstName} {report.patient?.lastName}
                </Text>
              </View>
            </View>
            <View style={styles.reportRight}>
              {report.sideEffects?.[0]?.severity && (
                <View style={[styles.severityChip, { backgroundColor: getSeverityColor(report.sideEffects[0].severity) + '20' }]}>
                  <Text style={[styles.severityChipText, { color: getSeverityColor(report.sideEffects[0].severity) }]}>
                    {report.sideEffects[0].severity}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyStateText}>No reports yet</Text>
          </View>
        )}
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warning + '12',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  pendingAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pendingAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  pendingAlertDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statsSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCardWrapper: {
    width: '48.5%',
  },
  statCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    minHeight: 100,
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statCardValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  statCardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  severityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  severityLabel: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  severityCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    width: 20,
    textAlign: 'right',
  },
  severityBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  severityBarFill: {
    height: 8,
    borderRadius: 4,
  },
  severityPercent: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 35,
    textAlign: 'right',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  medRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  medRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  medRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  medName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  medCountBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  medCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBadge: {
    backgroundColor: colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  reportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportMedicine: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reportPatient: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  severityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  severityChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default DoctorHomeScreen;
