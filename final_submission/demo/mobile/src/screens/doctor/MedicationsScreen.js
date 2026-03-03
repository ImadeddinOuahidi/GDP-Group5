import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicationService } from '../../services';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const MedicationsScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setIsLoading(true);
      const response = await medicationService.getAllMedications();
      if (response.data) {
        setMedications(response.data);
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
        const response = await medicationService.fuzzySearch(query);
        if (response.data) {
          setMedications(response.data);
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
    await fetchMedications();
    setIsRefreshing(false);
  };

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity style={styles.medicationCard}>
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name}</Text>
        {item.genericName && (
          <Text style={styles.medicationGeneric}>{item.genericName}</Text>
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
        </View>
      </View>
      <View style={styles.verificationStatus}>
        {item.isVerified ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        ) : (
          <Ionicons name="time-outline" size={24} color={colors.warning} />
        )}
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          placeholderTextColor={colors.textDisabled}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Medications List */}
      <FlatList
        data={medications}
        renderItem={renderMedicationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyStateText}>No medications found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedication')}
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.base,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 80,
  },
  medicationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  medicationGeneric: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
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
  tagSecondary: {
    backgroundColor: colors.textSecondary + '20',
  },
  tagTextSecondary: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  verificationStatus: {
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
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

export default MedicationsScreen;
