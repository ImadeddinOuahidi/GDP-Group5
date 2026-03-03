import React, { useState, useEffect, useCallback } from 'react';
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

const ReportsListScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }

      const response = await reportService.getAllReports({
        page: pageNum,
        limit: 10,
      });

      if (response.data) {
        if (refresh || pageNum === 1) {
          setReports(response.data);
        } else {
          setReports(prev => [...prev, ...response.data]);
        }
        setHasMore(response.data.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchReports(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchReports(page + 1);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'under_review': return colors.info;
      case 'confirmed': return colors.success;
      case 'resolved': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.medicineInfo}>
          <Ionicons name="medkit" size={20} color={colors.primary} />
          <Text style={styles.medicineName}>
            {item.medicine?.name || 'Unknown Medicine'}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status?.replace('_', ' ') || 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.sideEffectsContainer}>
        {item.sideEffects?.slice(0, 2).map((effect, index) => (
          <View key={index} style={styles.sideEffectRow}>
            <View
              style={[
                styles.severityDot,
                { backgroundColor: getSeverityColor(effect.severity) },
              ]}
            />
            <Text style={styles.sideEffectText} numberOfLines={1}>
              {effect.effect}
            </Text>
            <Text
              style={[
                styles.severityLabel,
                { color: getSeverityColor(effect.severity) },
              ]}
            >
              {effect.severity}
            </Text>
          </View>
        ))}
        {item.sideEffects?.length > 2 && (
          <Text style={styles.moreEffects}>
            +{item.sideEffects.length - 2} more side effects
          </Text>
        )}
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>
            {formatDate(item.reportDetails?.reportDate || item.createdAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={colors.textDisabled} />
      <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
      <Text style={styles.emptyStateText}>
        When you submit side effect reports, they will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.emptyStateButtonText}>Create Report</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || reports.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  if (isLoading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
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
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 80,
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
    marginBottom: spacing.md,
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sideEffectsContainer: {
    marginBottom: spacing.md,
  },
  sideEffectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  sideEffectText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreEffects: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

export default ReportsListScreen;
