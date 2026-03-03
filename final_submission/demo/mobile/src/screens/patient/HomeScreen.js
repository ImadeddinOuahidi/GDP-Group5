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
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    try {
      const response = await reportService.getAllReports({ limit: 3 });
      if (response.data) {
        setRecentReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRecentReports();
    setIsRefreshing(false);
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
          >
            <Ionicons name="add-circle" size={32} color="#fff" />
            <Text style={styles.actionCardText}>Report{'\n'}Side Effect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="document-text" size={32} color="#fff" />
            <Text style={styles.actionCardText}>View{'\n'}My Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.info }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={32} color="#fff" />
            <Text style={styles.actionCardText}>My{'\n'}Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <TouchableOpacity
              key={report._id}
              style={styles.reportCard}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report._id })}
            >
              <View style={styles.reportHeader}>
                <Text style={styles.reportMedicine}>
                  {report.medicine?.name || 'Unknown Medicine'}
                </Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(report.sideEffects?.[0]?.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {report.sideEffects?.[0]?.severity || 'Unknown'}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportEffect} numberOfLines={2}>
                {report.sideEffects?.[0]?.effect || 'No description'}
              </Text>
              <Text style={styles.reportDate}>
                {new Date(report.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyStateText}>No reports yet</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
            >
              <Text style={styles.emptyStateButtonText}>Create Your First Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color={colors.warning} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Report Early</Text>
            <Text style={styles.tipText}>
              Report side effects as soon as you notice them for better tracking.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcomeSection: {
    padding: spacing.xl,
    backgroundColor: colors.primary,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    ...shadows.md,
  },
  actionCardText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reportMedicine: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
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
  reportEffect: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  reportDate: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.base,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  tipContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default HomeScreen;
