import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicationService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const CATEGORY_FILTERS = ['All', 'Analgesic', 'Antibiotic', 'Antiviral', 'Cardiovascular', 'Dermatological', 'Neurological', 'Psychiatric', 'Respiratory', 'Gastrointestinal'];

const MedicationsScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [tabIndex, setTabIndex] = useState(0); // 0 = All, 1 = Pending

  useEffect(() => {
    fetchMedications();
  }, []);

  // Re-fetch when navigating back (edit mode support)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!isLoading) fetchMedications();
    });
    return unsubscribe;
  }, [navigation, isLoading]);

  const fetchMedications = async () => {
    try {
      setIsLoading(true);
      const response = await medicationService.getAllMedications();
      if (response.data) {
        setMedications(Array.isArray(response.data) ? response.data : response.data.medications || []);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const response = await medicationService.searchMedications(query);
        if (response.data) {
          setMedications(Array.isArray(response.data) ? response.data : response.data.medications || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    } else if (query.length === 0) {
      fetchMedications();
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    setSearchQuery('');
    await fetchMedications();
    setIsRefreshing(false);
  };

  const handleDelete = (med) => {
    Alert.alert('Delete Medication', `Are you sure you want to delete "${med.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await medicationService.deleteMedication(med._id);
          setMedications(prev => prev.filter(m => m._id !== med._id));
        } catch (error) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to delete medication.');
        }
      }},
    ]);
  };

  const handleVerify = async (med) => {
    try {
      await medicationService.updateMedication(med._id, { isVerified: true });
      setMedications(prev => prev.map(m => m._id === med._id ? { ...m, isVerified: true } : m));
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify medication.');
    }
  };

  const filteredMedications = useMemo(() => {
    let result = [...medications];
    if (tabIndex === 1) result = result.filter(m => !m.isVerified);
    if (categoryFilter !== 'All') result = result.filter(m => m.category === categoryFilter);
    return result;
  }, [medications, tabIndex, categoryFilter]);

  const stats = useMemo(() => ({
    total: medications.length,
    verified: medications.filter(m => m.isVerified).length,
    pending: medications.filter(m => !m.isVerified).length,
    categories: [...new Set(medications.map(m => m.category).filter(Boolean))].length,
  }), [medications]);

  const renderHeader = () => (
    <View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: colors.primary, icon: 'medkit' },
          { label: 'Verified', value: stats.verified, color: colors.success, icon: 'checkmark-circle' },
          { label: 'Pending', value: stats.pending, color: colors.warning, icon: 'time' },
          { label: 'Categories', value: stats.categories, color: colors.info, icon: 'grid' },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Ionicons name={s.icon} size={16} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['All Medications', 'Pending Verification'].map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, tabIndex === i && styles.tabActive]}
            onPress={() => setTabIndex(i)}
          >
            <Text style={[styles.tabText, tabIndex === i && styles.tabTextActive]}>
              {tab} {i === 1 && stats.pending > 0 ? `(${stats.pending})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
        {CATEGORY_FILTERS.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, categoryFilter === cat && styles.catChipActive]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text style={[styles.catChipText, categoryFilter === cat && styles.catChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>{filteredMedications.length} medication{filteredMedications.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  const renderMedicationItem = ({ item }) => (
    <View style={styles.medicationCard}>
      <TouchableOpacity
        style={styles.medicationContent}
        onPress={() => navigation.navigate('AddMedication', { medicationId: item._id })}
      >
        <View style={styles.medicationInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.medicationName}>{item.name}</Text>
            {item.isVerified ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            ) : (
              <Ionicons name="time-outline" size={18} color={colors.warning} />
            )}
          </View>
          {item.genericName && (
            <Text style={styles.medicationGeneric}>{item.genericName}</Text>
          )}
          {item.manufacturer && (
            <Text style={styles.manufacturer}>{item.manufacturer}</Text>
          )}
          <View style={styles.tagsContainer}>
            {item.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.category}</Text>
              </View>
            )}
            {item.dosageForm && (
              <View style={[styles.tag, styles.tagSecondary]}>
                <Text style={styles.tagTextSecondary}>{item.dosageForm}</Text>
              </View>
            )}
            {item.strengths?.length > 0 && (
              <View style={[styles.tag, { backgroundColor: colors.info + '15' }]}>
                <Text style={[styles.tagText, { color: colors.info }]}>{item.strengths.length} strength{item.strengths.length !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {!item.isVerified && (
          <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item)}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.verifyBtnText}>Verify</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddMedication', { medicationId: item._id })}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          placeholderTextColor={colors.textDisabled}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredMedications}
        renderItem={renderMedicationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyStateTitle}>No Medications Found</Text>
            <Text style={styles.emptyStateText}>
              {categoryFilter !== 'All' ? 'Try a different category filter' : 'Add medications to get started'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMedication')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.base, fontSize: 14, color: colors.textSecondary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    margin: spacing.base, marginBottom: 0, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, height: 44, ...shadows.sm,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  listContent: { padding: spacing.base, paddingBottom: 80 },
  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm,
    borderTopWidth: 3, alignItems: 'center', ...shadows.sm,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  statLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 1 },
  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.md, ...shadows.sm, marginBottom: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  // Category chips
  chipScroll: { marginBottom: spacing.sm },
  chipScrollContent: { gap: spacing.sm, paddingRight: spacing.base },
  catChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  catChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  catChipText: { fontSize: 12, color: colors.textSecondary },
  catChipTextActive: { color: colors.primary, fontWeight: '600' },
  resultCount: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  // Cards
  medicationCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    marginBottom: spacing.md, ...shadows.sm, overflow: 'hidden',
  },
  medicationContent: { padding: spacing.base },
  medicationInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  medicationName: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  medicationGeneric: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  manufacturer: { fontSize: 11, color: colors.textDisabled, marginTop: 1 },
  tagsContainer: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  tagText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  tagSecondary: { backgroundColor: colors.textSecondary + '15' },
  tagTextSecondary: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  // Actions
  actionRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.sm,
  },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full,
    backgroundColor: colors.success + '10', borderWidth: 1, borderColor: colors.success + '30',
  },
  verifyBtnText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '30',
  },
  editBtnText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  deleteBtn: {
    marginLeft: 'auto', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, backgroundColor: colors.error + '08',
  },
  emptyState: { alignItems: 'center', padding: spacing.xxl },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.lg },
  emptyStateText: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  fab: {
    position: 'absolute', right: spacing.base, bottom: spacing.base, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg,
  },
});

export default MedicationsScreen;
