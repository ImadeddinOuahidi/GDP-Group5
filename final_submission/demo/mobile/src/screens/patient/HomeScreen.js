import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, underReview: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await reportService.getAllReports({ limit: 100 });
      if (response.data) {
        const all = Array.isArray(response.data) ? response.data : [];
        setRecentReports(all.slice(0, 3));
        setStats({
          total: all.length,
          pending: all.filter(r => r.status === 'Submitted' || r.status === 'Draft').length,
          reviewed: all.filter(r => r.status === 'Reviewed' || r.status === 'Closed').length,
          underReview: all.filter(r => r.status === 'Under Review').length,
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const getProfileCompletion = () => {
    if (!user) return 0;
    const fields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'];
    const filled = fields.filter(f => user[f]).length;
    const addressFields = ['street', 'city', 'state', 'zipCode'];
    const filledAddr = addressFields.filter(f => user.address?.[f]).length;
    return Math.round(((filled + filledAddr) / (fields.length + addressFields.length)) * 100);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reviewed': case 'Closed': return colors.success;
      case 'Submitted': return colors.warning;
      case 'Under Review': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const profileCompletion = getProfileCompletion();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header with Gradient */}
      <LinearGradient
        colors={['#1565C0', '#1976D2', '#42A5F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeSection}
      >
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person" size={12} color="#fff" />
              <Text style={styles.roleText}>Patient Portal</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || 'U').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Profile Completion */}
        <View style={styles.completionContainer}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionLabel}>Profile Completion</Text>
            <Text style={styles.completionPercent}>{profileCompletion}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${profileCompletion}%` }]} />
          </View>
        </View>
        {stats.pending > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.pendingBannerText}>
              You have {stats.pending} pending report{stats.pending > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.info }]}>
          <Text style={styles.statValue}>{stats.underReview}</Text>
          <Text style={styles.statLabel}>In Review</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
          <Text style={styles.statValue}>{stats.reviewed}</Text>
          <Text style={styles.statLabel}>Reviewed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
          >
            <LinearGradient colors={['#1976D2', '#42A5F5']} style={styles.actionIconBg}>
              <Ionicons name="add-circle" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionCardTitle}>Report Side Effect</Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>Priority</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Reports')}
          >
            <LinearGradient colors={['#0288d1', '#03a9f4']} style={styles.actionIconBg}>
              <Ionicons name="document-text" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionCardTitle}>My Reports</Text>
            {stats.total > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{stats.total}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}
          >
            <LinearGradient colors={['#7B1FA2', '#AB47BC']} style={styles.actionIconBg}>
              <Ionicons name="settings" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionCardTitle}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentReports.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <TouchableOpacity
              key={report._id}
              style={styles.reportCard}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report._id })}
            >
              <View style={styles.reportLeft}>
                <View style={[styles.reportAvatar, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                  <Ionicons name="medkit" size={18} color={getStatusColor(report.status)} />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportMedicine} numberOfLines={1}>
                    {report.medicine?.name || 'Unknown Medicine'}
                  </Text>
                  <Text style={styles.reportEffect} numberOfLines={1}>
                    {report.sideEffects?.[0]?.effect || 'No description'}
                  </Text>
                  <Text style={styles.reportDate}>
                    {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View style={styles.reportRight}>
                <View style={[styles.statusChip, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.statusChipText, { color: getStatusColor(report.status) }]}>
                    {report.status || 'Submitted'}
                  </Text>
                </View>
                {report.sideEffects?.[0]?.severity && (
                  <View style={[styles.severityDot, { backgroundColor: getSeverityColor(report.sideEffects[0].severity) }]} />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
            <Text style={styles.emptyStateText}>Start by reporting your first side effect</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.emptyStateButtonText}>Create Your First Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresRow}>
          {[
            { icon: 'flash', title: 'Quick Reporting', desc: 'Submit in minutes', color: colors.primary },
            { icon: 'shield-checkmark', title: 'Secure & Private', desc: 'HIPAA compliant', color: colors.success },
            { icon: 'analytics', title: 'AI Analysis', desc: 'Smart insights', color: '#7C4DFF' },
          ].map((feat, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feat.color + '15' }]}>
                <Ionicons name={feat.icon} size={22} color={feat.color} />
              </View>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Emergency Notice */}
      <View style={styles.section}>
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyLeft}>
            <Ionicons name="alert-circle" size={24} color={colors.error} />
            <View style={styles.emergencyText}>
              <Text style={styles.emergencyTitle}>Emergency?</Text>
              <Text style={styles.emergencyDesc}>
                If you experience severe symptoms, call emergency services immediately.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => Linking.openURL('tel:911')}
          >
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.emergencyButtonText}>Call 911</Text>
          </TouchableOpacity>
        </View>
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
  welcomeSection: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTextContainer: {
    flex: 1,
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
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  completionContainer: {
    marginTop: spacing.base,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  completionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  completionPercent: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
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
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  priorityBadge: {
    backgroundColor: colors.error + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  reportCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  reportEffect: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportDate: {
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: 2,
  },
  reportRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  emergencyCard: {
    backgroundColor: colors.error + '08',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error + '20',
    padding: spacing.base,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  emergencyText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.error,
  },
  emergencyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default HomeScreen;
