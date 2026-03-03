import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const STATUS_FILTERS = ['All', 'Draft', 'Submitted', 'Under Review', 'Reviewed', 'Closed', 'Rejected'];
const SEVERITY_FILTERS = ['All', 'Mild', 'Moderate', 'Severe', 'Life-threatening'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Medicine A-Z', value: 'medicine' },
];

const ReportsListScreen = ({ navigation }) => {
  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allReports, searchQuery, statusFilter, severityFilter, sortBy]);

  const fetchReports = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      const response = await reportService.getAllReports({ limit: 200 });
      if (response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        setAllReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...allReports];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.medicine?.name || '').toLowerCase().includes(q) ||
        (r.sideEffects || []).some(se => (se.effect || '').toLowerCase().includes(q)) ||
        (r._id || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== 'All') {
      result = result.filter(r =>
        (r.sideEffects || []).some(se => se.severity === severityFilter)
      );
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'medicine':
        result.sort((a, b) => (a.medicine?.name || '').localeCompare(b.medicine?.name || ''));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredReports(result);
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
      case 'Draft': return colors.textSecondary;
      case 'Submitted': return colors.warning;
      case 'Under Review': return colors.info;
      case 'Reviewed': return colors.success;
      case 'Closed': return colors.success;
      case 'Rejected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const stats = {
    total: allReports.length,
    pending: allReports.filter(r => r.status === 'Submitted' || r.status === 'Draft').length,
    reviewed: allReports.filter(r => r.status === 'Reviewed').length,
    underReview: allReports.filter(r => r.status === 'Under Review').length,
  };

  const activeFiltersCount = (statusFilter !== 'All' ? 1 : 0) + (severityFilter !== 'All' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  const renderStatsHeader = () => (
    <View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: colors.primary },
          { label: 'Pending', value: stats.pending, color: colors.warning },
          { label: 'In Review', value: stats.underReview, color: colors.info },
          { label: 'Reviewed', value: stats.reviewed, color: colors.success },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search + Filter Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={20} color={activeFiltersCount > 0 ? '#fff' : colors.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFilters}>
          {statusFilter !== 'All' && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setStatusFilter('All')}>
              <Text style={styles.filterChipText}>{statusFilter}</Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
          {severityFilter !== 'All' && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setSeverityFilter('All')}>
              <Text style={styles.filterChipText}>{severityFilter}</Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { setStatusFilter('All'); setSeverityFilter('All'); setSortBy('newest'); }}>
            <Text style={styles.clearFiltersText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result Count */}
      <Text style={styles.resultCount}>
        {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        {searchQuery || activeFiltersCount > 0 ? ' found' : ''}
      </Text>
    </View>
  );

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.medicineInfo}>
          <Ionicons name="medkit" size={18} color={colors.primary} />
          <Text style={styles.medicineName} numberOfLines={1}>
            {item.medicine?.name || 'Unknown Medicine'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status || 'Submitted'}
          </Text>
        </View>
      </View>

      {item.medicine?.genericName && (
        <Text style={styles.genericName}>{item.medicine.genericName}</Text>
      )}

      <View style={styles.sideEffectsContainer}>
        {item.sideEffects?.slice(0, 2).map((effect, index) => (
          <View key={index} style={styles.sideEffectRow}>
            <View style={[styles.severityDot, { backgroundColor: getSeverityColor(effect.severity) }]} />
            <Text style={styles.sideEffectText} numberOfLines={1}>{effect.effect}</Text>
            <View style={[styles.severityChip, { backgroundColor: getSeverityColor(effect.severity) + '15' }]}>
              <Text style={[styles.severityChipText, { color: getSeverityColor(effect.severity) }]}>
                {effect.severity}
              </Text>
            </View>
          </View>
        ))}
        {item.sideEffects?.length > 2 && (
          <Text style={styles.moreEffects}>+{item.sideEffects.length - 2} more</Text>
        )}
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.dateText}>{formatDate(item.reportDetails?.reportDate || item.createdAt)}</Text>
          </View>
          {item.metadata?.aiAnalysis && (
            <View style={styles.aiBadge}>
              <Ionicons name="analytics" size={12} color="#7C4DFF" />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={colors.textDisabled} />
      <Text style={styles.emptyStateTitle}>
        {searchQuery || activeFiltersCount > 0 ? 'No Matching Reports' : 'No Reports Yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || activeFiltersCount > 0
          ? 'Try adjusting your search or filters'
          : 'When you submit side effect reports, they will appear here.'
        }
      </Text>
      {!searchQuery && activeFiltersCount === 0 && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.emptyStateButtonText}>Create Report</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
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
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderStatsHeader}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchReports(true)} colors={[colors.primary]} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Report', { screen: 'NewReport' })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>Status</Text>
            <View style={styles.chipGrid}>
              {STATUS_FILTERS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.modalChip, statusFilter === s && styles.modalChipActive]}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={[styles.modalChipText, statusFilter === s && styles.modalChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionTitle}>Severity</Text>
            <View style={styles.chipGrid}>
              {SEVERITY_FILTERS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.modalChip, severityFilter === s && styles.modalChipActive]}
                  onPress={() => setSeverityFilter(s)}
                >
                  <Text style={[styles.modalChipText, severityFilter === s && styles.modalChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionTitle}>Sort By</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortOption, sortBy === opt.value && styles.sortOptionActive]}
                onPress={() => setSortBy(opt.value)}
              >
                <Ionicons
                  name={sortBy === opt.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={sortBy === opt.value ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.sortOptionText, sortBy === opt.value && { color: colors.primary }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => { setStatusFilter('All'); setSeverityFilter('All'); setSortBy('newest'); }}
              >
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.base, fontSize: 16, color: colors.textSecondary },
  listContent: { padding: spacing.base, paddingBottom: 80 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    borderTopWidth: 3, alignItems: 'center', ...shadows.sm,
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 44, ...shadows.sm,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  filterButton: {
    width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', ...shadows.sm,
  },
  filterButtonActive: { backgroundColor: colors.primary },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, backgroundColor: colors.error,
    width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  activeFilters: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, flexWrap: 'wrap' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '12',
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, gap: 4,
  },
  filterChipText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  clearFiltersText: { fontSize: 12, color: colors.error, fontWeight: '600' },
  resultCount: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  reportCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base,
    marginBottom: spacing.md, ...shadows.sm,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  medicineInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  medicineName: { fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: spacing.sm, flex: 1 },
  genericName: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, marginLeft: 26 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm,
    paddingVertical: 3, borderRadius: borderRadius.full, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  sideEffectsContainer: { marginBottom: spacing.sm },
  sideEffectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  severityDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: spacing.sm },
  sideEffectText: { flex: 1, fontSize: 13, color: colors.text },
  severityChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full },
  severityChipText: { fontSize: 10, fontWeight: '600' },
  moreEffects: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  reportFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: colors.textSecondary },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C4DFF15',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full, gap: 3,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: '#7C4DFF' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyStateText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  emptyStateButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, gap: spacing.sm,
  },
  emptyStateButtonText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute', right: spacing.base, bottom: spacing.base, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg,
  },
  // Filter Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  modalChip: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  modalChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  modalChipText: { fontSize: 13, color: colors.textSecondary },
  modalChipTextActive: { color: colors.primary, fontWeight: '600' },
  sortOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  sortOptionActive: {},
  sortOptionText: { fontSize: 14, color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalResetBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  modalResetText: { fontSize: 14, fontWeight: '600', color: colors.text },
  modalApplyBtn: {
    flex: 2, backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  modalApplyText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default ReportsListScreen;
