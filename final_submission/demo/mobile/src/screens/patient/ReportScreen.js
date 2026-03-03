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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { reportService, medicationService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import {
  SEVERITY_LEVELS,
  ONSET_TIMES,
  BODY_SYSTEMS,
  ADMINISTRATION_ROUTES,
} from '../../config/constants';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const ReportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    medicine: null,
    sideEffects: [{
      effect: '',
      severity: 'Mild',
      onset: 'Within hours',
      bodySystem: 'Other',
      description: '',
    }],
    medicationUsage: {
      indication: '',
      dosage: {
        amount: '',
        frequency: '',
        route: 'Oral',
      },
      startDate: new Date().toISOString(),
    },
    reportDetails: {
      incidentDate: new Date().toISOString(),
      seriousness: 'Non-serious',
      outcome: 'Recovering',
    },
  });

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchMedications();
    }
  }, [searchQuery]);

  const searchMedications = async () => {
    try {
      const response = await medicationService.fuzzySearch(searchQuery);
      if (response.data) {
        setMedications(response.data);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSideEffect = (index, field, value) => {
    setFormData(prev => {
      const newSideEffects = [...prev.sideEffects];
      newSideEffects[index] = { ...newSideEffects[index], [field]: value };
      return { ...prev, sideEffects: newSideEffects };
    });
  };

  const addSideEffect = () => {
    setFormData(prev => ({
      ...prev,
      sideEffects: [
        ...prev.sideEffects,
        {
          effect: '',
          severity: 'Mild',
          onset: 'Within hours',
          bodySystem: 'Other',
          description: '',
        },
      ],
    }));
  };

  const removeSideEffect = (index) => {
    if (formData.sideEffects.length > 1) {
      setFormData(prev => ({
        ...prev,
        sideEffects: prev.sideEffects.filter((_, i) => i !== index),
      }));
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.medicine) {
          Alert.alert('Error', 'Please select a medication');
          return false;
        }
        return true;
      case 2:
        if (!formData.sideEffects[0].effect.trim()) {
          Alert.alert('Error', 'Please describe the side effect');
          return false;
        }
        return true;
      case 3:
        if (!formData.medicationUsage.indication.trim()) {
          Alert.alert('Error', 'Please enter the reason for taking the medication');
          return false;
        }
        if (!formData.medicationUsage.dosage.amount.trim()) {
          Alert.alert('Error', 'Please enter the dosage amount');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const reportData = {
        ...formData,
        medicine: formData.medicine._id,
      };

      const response = await reportService.submitReport(reportData);
      
      if (response.status === 'success') {
        Alert.alert(
          'Success',
          'Your side effect report has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Reports'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Medication</Text>
      <Text style={styles.stepSubtitle}>
        Search for the medication that caused the side effect
      </Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          placeholderTextColor={colors.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {formData.medicine && (
        <View style={styles.selectedMedication}>
          <View style={styles.selectedMedicationInfo}>
            <Text style={styles.selectedMedicationName}>{formData.medicine.name}</Text>
            {formData.medicine.genericName && (
              <Text style={styles.selectedMedicationGeneric}>
                {formData.medicine.genericName}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => updateFormData('medicine', null)}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.medicationList}>
        {medications.map((med) => (
          <TouchableOpacity
            key={med._id}
            style={[
              styles.medicationItem,
              formData.medicine?._id === med._id && styles.medicationItemSelected,
            ]}
            onPress={() => updateFormData('medicine', med)}
          >
            <View>
              <Text style={styles.medicationName}>{med.name}</Text>
              {med.genericName && (
                <Text style={styles.medicationGeneric}>{med.genericName}</Text>
              )}
              {med.category && (
                <Text style={styles.medicationCategory}>{med.category}</Text>
              )}
            </View>
            {formData.medicine?._id === med._id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Describe Side Effects</Text>
      <Text style={styles.stepSubtitle}>
        Tell us about the side effects you experienced
      </Text>

      {formData.sideEffects.map((sideEffect, index) => (
        <View key={index} style={styles.sideEffectCard}>
          <View style={styles.sideEffectHeader}>
            <Text style={styles.sideEffectNumber}>Side Effect {index + 1}</Text>
            {formData.sideEffects.length > 1 && (
              <TouchableOpacity onPress={() => removeSideEffect(index)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the side effect..."
            placeholderTextColor={colors.textDisabled}
            value={sideEffect.effect}
            onChangeText={(text) => updateSideEffect(index, 'effect', text)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Severity *</Text>
          <View style={styles.severityContainer}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityButton,
                  sideEffect.severity === level.value && {
                    backgroundColor: level.color,
                    borderColor: level.color,
                  },
                ]}
                onPress={() => updateSideEffect(index, 'severity', level.value)}
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    sideEffect.severity === level.value && { color: '#fff' },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>When did it start?</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sideEffect.onset}
              onValueChange={(value) => updateSideEffect(index, 'onset', value)}
              style={styles.picker}
            >
              {ONSET_TIMES.map((onset) => (
                <Picker.Item key={onset} label={onset} value={onset} />
              ))}
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Body System Affected</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sideEffect.bodySystem}
              onValueChange={(value) => updateSideEffect(index, 'bodySystem', value)}
              style={styles.picker}
            >
              {BODY_SYSTEMS.map((system) => (
                <Picker.Item key={system} label={system} value={system} />
              ))}
            </Picker>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addSideEffect}>
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        <Text style={styles.addButtonText}>Add Another Side Effect</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      <Text style={styles.stepSubtitle}>
        Help us understand your medication usage
      </Text>

      <Text style={styles.inputLabel}>Reason for Taking Medication *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Headache, Fever, etc."
        placeholderTextColor={colors.textDisabled}
        value={formData.medicationUsage.indication}
        onChangeText={(text) =>
          updateFormData('medicationUsage', {
            ...formData.medicationUsage,
            indication: text,
          })
        }
      />

      <Text style={styles.inputLabel}>Dosage Amount *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 500mg, 2 tablets"
        placeholderTextColor={colors.textDisabled}
        value={formData.medicationUsage.dosage.amount}
        onChangeText={(text) =>
          updateFormData('medicationUsage', {
            ...formData.medicationUsage,
            dosage: { ...formData.medicationUsage.dosage, amount: text },
          })
        }
      />

      <Text style={styles.inputLabel}>Frequency</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Twice daily, Every 6 hours"
        placeholderTextColor={colors.textDisabled}
        value={formData.medicationUsage.dosage.frequency}
        onChangeText={(text) =>
          updateFormData('medicationUsage', {
            ...formData.medicationUsage,
            dosage: { ...formData.medicationUsage.dosage, frequency: text },
          })
        }
      />

      <Text style={styles.inputLabel}>Route of Administration</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.medicationUsage.dosage.route}
          onValueChange={(value) =>
            updateFormData('medicationUsage', {
              ...formData.medicationUsage,
              dosage: { ...formData.medicationUsage.dosage, route: value },
            })
          }
          style={styles.picker}
        >
          {ADMINISTRATION_ROUTES.map((route) => (
            <Picker.Item key={route} label={route} value={route} />
          ))}
        </Picker>
      </View>

      <Text style={styles.inputLabel}>Seriousness</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            formData.reportDetails.seriousness === 'Non-serious' && styles.toggleButtonActive,
          ]}
          onPress={() =>
            updateFormData('reportDetails', {
              ...formData.reportDetails,
              seriousness: 'Non-serious',
            })
          }
        >
          <Text
            style={[
              styles.toggleButtonText,
              formData.reportDetails.seriousness === 'Non-serious' &&
                styles.toggleButtonTextActive,
            ]}
          >
            Non-serious
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            formData.reportDetails.seriousness === 'Serious' && styles.toggleButtonActive,
          ]}
          onPress={() =>
            updateFormData('reportDetails', {
              ...formData.reportDetails,
              seriousness: 'Serious',
            })
          }
        >
          <Text
            style={[
              styles.toggleButtonText,
              formData.reportDetails.seriousness === 'Serious' && styles.toggleButtonTextActive,
            ]}
          >
            Serious
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              s <= step && styles.progressStepActive,
            ]}
          />
        ))}
      </View>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, step === 1 && styles.fullWidthButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.sm,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.base,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  selectedMedication: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedMedicationInfo: {
    flex: 1,
  },
  selectedMedicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedMedicationGeneric: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  medicationList: {
    flex: 1,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  medicationItemSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
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
  medicationCategory: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  sideEffectCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  sideEffectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sideEffectNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  inputLabel: {
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  severityButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  severityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.base,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default ReportScreen;
