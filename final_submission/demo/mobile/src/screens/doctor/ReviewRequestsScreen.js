import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const ReviewRequestsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await reportService.getAllReports({ status: 'pending' });
      if (response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
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

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.medicineName}>{item.medicine?.name || 'Unknown'}</Text>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.sideEffects?.[0]?.severity) },
          ]}
        >
          <Text style={styles.severityText}>
            {item.sideEffects?.[0]?.severity || 'Unknown'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.patientName}>
        Patient: {item.patient?.firstName} {item.patient?.lastName}
      </Text>
      
      <Text style={styles.sideEffectText} numberOfLines={2}>
        {item.sideEffects?.[0]?.effect || 'No description'}
      </Text>
      
      <View style={styles.reportFooter}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
            <Text style={styles.emptyStateText}>No pending reports to review</Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: spacing.base,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
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
  medicineName: {
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
  patientName: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sideEffectText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  dateText: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default ReviewRequestsScreen;
