import React, { useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { medicationService } from '../../services';
import { MEDICATION_CATEGORIES, DOSAGE_FORMS } from '../../config/constants';
import { colors, spacing, borderRadius } from '../../config/theme';

const AddMedicationScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Other',
    dosageForm: 'Tablet',
    description: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Medication name is required');
      return;
    }

    setIsLoading(true);
    try {
      await medicationService.createMedication(formData);
      Alert.alert(
        'Success',
        'Medication added successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add medication');
      console.error('Add medication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
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

        <Text style={styles.label}>Description</Text>
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
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Medication</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.base,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: 48,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.base,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMedicationScreen;
