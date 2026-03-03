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
import { reportService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const DoctorHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    seriousReports: 0,
    recentReports: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await reportService.getDashboardStats();
      if (response.data) {
        setStats(response.data);
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

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>Dr. {user?.lastName || 'User'}</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Reports"
            value={stats.totalReports}
            icon="document-text"
            color={colors.primary}
            onPress={() => navigation.navigate('Review')}
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingReports}
            icon="time"
            color={colors.warning}
            onPress={() => navigation.navigate('Review')}
          />
          <StatCard
            title="Serious Cases"
            value={stats.seriousReports}
            icon="alert-circle"
            color={colors.error}
            onPress={() => navigation.navigate('Review')}
          />
          <StatCard
            title="Medications"
            value={stats.totalMedications || 0}
            icon="medkit"
            color={colors.success}
            onPress={() => navigation.navigate('Medications')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Medications', { screen: 'AddMedication' })}
          >
            <Ionicons name="add-circle" size={32} color={colors.primary} />
            <Text style={styles.actionText}>Add Medication</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Review')}
          >
            <Ionicons name="clipboard" size={32} color={colors.secondary} />
            <Text style={styles.actionText}>Review Reports</Text>
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
        {stats.recentReports?.map((report) => (
          <TouchableOpacity
            key={report._id}
            style={styles.reportCard}
            onPress={() => navigation.navigate('ReportDetail', { reportId: report._id })}
          >
            <View style={styles.reportInfo}>
              <Text style={styles.reportMedicine}>
                {report.medicine?.name || 'Unknown'}
              </Text>
              <Text style={styles.reportPatient}>
                Patient: {report.patient?.firstName} {report.patient?.lastName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  statsContainer: {
    padding: spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    margin: '1%',
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.base,
  },
  actionText: {
    fontSize: 12,
    color: colors.text,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
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
    marginTop: spacing.xs,
  },
});

export default DoctorHomeScreen;
