import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { medicationService } from '../../services';
import { MEDICATION_CATEGORIES, DOSAGE_FORMS } from '../../config/constants';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const AddMedicationScreen = ({ navigation, route }) => {
  const medicationId = route.params?.medicationId;
  const isEditMode = !!medicationId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    category: 'Other',
    dosageForm: 'Tablet',
    description: '',
    strengths: [],
    tags: [],
  });
  const [newStrength, setNewStrength] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEditMode) loadMedication();
  }, [medicationId]);

  useEffect(() => {
    navigation.setOptions({ title: isEditMode ? 'Edit Medication' : 'Add Medication' });
  }, [isEditMode]);

  const loadMedication = async () => {
    try {
      setIsFetching(true);
      const response = await medicationService.getMedicationById(medicationId);
      const med = response.data?.medication || response.data;
      if (med) {
        setFormData({
          name: med.name || '',
          genericName: med.genericName || '',
          manufacturer: med.manufacturer || '',
          category: med.category || 'Other',
          dosageForm: med.dosageForm || 'Tablet',
          description: med.description || '',
          strengths: med.strengths || [],
          tags: med.tags || [],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load medication details');
      navigation.goBack();
    } finally {
      setIsFetching(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStrength = () => {
    if (newStrength.trim() && !formData.strengths.includes(newStrength.trim())) {
      setFormData(prev => ({ ...prev, strengths: [...prev.strengths, newStrength.trim()] }));
      setNewStrength('');
    }
  };

  const removeStrength = (idx) => {
    setFormData(prev => ({ ...prev, strengths: prev.strengths.filter((_, i) => i !== idx) }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (idx) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Medication name is required');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode) {
        await medicationService.updateMedication(medicationId, formData);
        Alert.alert('Success', 'Medication updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await medicationService.createMedication(formData);
        Alert.alert('Success', 'Medication added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} medication`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading medication...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Preview Card */}
        {formData.name.trim() !== '' && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewBody}>
              <Text style={styles.previewName}>{formData.name}</Text>
              {formData.genericName ? <Text style={styles.previewGeneric}>{formData.genericName}</Text> : null}
              <View style={styles.previewTags}>
                {formData.category !== 'Other' && (
                  <View style={styles.previewTag}><Text style={styles.previewTagText}>{formData.category}</Text></View>
                )}
                <View style={[styles.previewTag, { backgroundColor: colors.textSecondary + '12' }]}>
                  <Text style={[styles.previewTagText, { color: colors.textSecondary }]}>{formData.dosageForm}</Text>
                </View>
                {formData.strengths.map((s, i) => (
                  <View key={i} style={[styles.previewTag, { backgroundColor: colors.info + '12' }]}>
                    <Text style={[styles.previewTagText, { color: colors.info }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <Text style={styles.label}>Medication Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter medication name"
          placeholderTextColor={colors.textDisabled}
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
        />

        <Text style={styles.label}>Generic Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter generic name"
          placeholderTextColor={colors.textDisabled}
          value={formData.genericName}
          onChangeText={(text) => updateField('genericName', text)}
        />

        <Text style={styles.label}>Manufacturer</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter manufacturer"
          placeholderTextColor={colors.textDisabled}
          value={formData.manufacturer}
          onChangeText={(text) => updateField('manufacturer', text)}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => updateField('category', value)}
            style={styles.picker}
          >
            {MEDICATION_CATEGORIES.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Dosage Form</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.dosageForm}
            onValueChange={(value) => updateField('dosageForm', value)}
            style={styles.picker}
          >
            {DOSAGE_FORMS.map((form) => (
              <Picker.Item key={form} label={form} value={form} />
            ))}
          </Picker>
        </View>

        {/* Strengths */}
        <Text style={styles.label}>Strengths</Text>
        <View style={styles.chipInputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g., 500mg"
            placeholderTextColor={colors.textDisabled}
            value={newStrength}
            onChangeText={setNewStrength}
            onSubmitEditing={addStrength}
          />
          <TouchableOpacity style={styles.addChipBtn} onPress={addStrength}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {formData.strengths.length > 0 && (
          <View style={styles.chipList}>
            {formData.strengths.map((s, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
                <TouchableOpacity onPress={() => removeStrength(i)}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        <Text style={[styles.label, { marginTop: spacing.base }]}>Tags</Text>
        <View style={styles.chipInputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="e.g., prescription, OTC"
            placeholderTextColor={colors.textDisabled}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={addTag}
          />
          <TouchableOpacity style={styles.addChipBtn} onPress={addTag}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {formData.tags.length > 0 && (
          <View style={styles.chipList}>
            {formData.tags.map((t, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}>
                <Text style={[styles.chipText, { color: colors.success }]}>{t}</Text>
                <TouchableOpacity onPress={() => removeTag(i)}>
                  <Ionicons name="close-circle" size={16} color={colors.success} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.label, { marginTop: spacing.base }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter description"
          placeholderTextColor={colors.textDisabled}
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#1565C0', '#42A5F5']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={isEditMode ? 'save' : 'add-circle'} size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Update Medication' : 'Add Medication'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.base, fontSize: 14, color: colors.textSecondary },
  form: { padding: spacing.base },
  // Preview
  previewCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.base,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.primary + '20', ...shadows.sm,
  },
  previewLabel: { fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: spacing.sm },
  previewBody: {},
  previewName: { fontSize: 16, fontWeight: '700', color: colors.text },
  previewGeneric: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  previewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  previewTag: { backgroundColor: colors.primary + '12', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  previewTagText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  // Form fields
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: spacing.md, height: 44, fontSize: 14,
    color: colors.text, marginBottom: spacing.base,
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  pickerContainer: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: colors.border, marginBottom: spacing.base, overflow: 'hidden',
  },
  picker: { height: 48 },
  // Chips
  chipInputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  addChipBtn: {
    width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary + '12',
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  chipText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  // Submit
  submitButton: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: spacing.md },
  gradientBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: borderRadius.md,
  },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default AddMedicationScreen;
