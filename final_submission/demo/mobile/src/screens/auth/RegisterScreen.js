import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../config/theme';

const GENDER_OPTIONS = ['male', 'female', 'other'];

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'patient',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    // Doctor fields (shown only when role=doctor)
    licenseNumber: '',
    specialization: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // Multi-step form
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState({ month: '', day: '', year: '' });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const updateAddress = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    if (errors[`address.${field}`]) {
      setErrors(prev => ({ ...prev, [`address.${field}`]: null }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must include upper, lower case and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.address.street.trim() || formData.address.street.length < 5) {
      newErrors['address.street'] = 'Street address is required (min 5 chars)';
    }
    if (!formData.address.city.trim() || formData.address.city.length < 2) {
      newErrors['address.city'] = 'City is required';
    }
    if (!formData.address.state.trim() || formData.address.state.length < 2) {
      newErrors['address.state'] = 'State is required';
    }
    if (!formData.address.zipCode.trim() || formData.address.zipCode.length < 5) {
      newErrors['address.zipCode'] = 'Valid zip code is required (min 5 chars)';
    }
    if (formData.role === 'doctor') {
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
      if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleDateConfirm = () => {
    const { month, day, year } = dateInput;
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear()) {
      const isoDate = new Date(y, m - 1, d).toISOString();
      updateField('dateOfBirth', isoDate);
      setShowDatePicker(false);
    } else {
      Alert.alert('Invalid Date', 'Please enter a valid date (MM/DD/YYYY).');
    }
  };

  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    // Strip confirmPassword & empty doctor fields before sending
    const { confirmPassword, licenseNumber, specialization, ...rest } = formData;
    const payload = { ...rest };
    if (formData.role === 'doctor') {
      payload.licenseNumber = licenseNumber;
      payload.specialization = specialization;
    }

    const result = await register(payload);
    if (!result.success) {
      Alert.alert('Registration Failed', result.message);
    }
  };

  const renderInput = (field, placeholder, icon, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{placeholder}</Text>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          {...options}
        />
        {(field === 'password' || field === 'confirmPassword') && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderAddressInput = (field, placeholder, icon, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{placeholder}</Text>
      <View style={[styles.inputWrapper, errors[`address.${field}`] && styles.inputError]}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          value={formData.address[field]}
          onChangeText={(value) => updateAddress(field, value)}
          {...options}
        />
      </View>
      {errors[`address.${field}`] && (
        <Text style={styles.errorText}>{errors[`address.${field}`]}</Text>
      )}
    </View>
  );

  // ---- Step 1: Basic Info ----
  const renderStep1 = () => (
    <>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          {renderInput('firstName', 'First Name', 'person-outline')}
        </View>
        <View style={styles.halfInput}>
          {renderInput('lastName', 'Last Name', 'person-outline')}
        </View>
      </View>

      {renderInput('email', 'Email', 'mail-outline', {
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      })}

      {renderInput('phone', 'Phone Number', 'call-outline', {
        keyboardType: 'phone-pad',
      })}

      {renderInput('password', 'Password', 'lock-closed-outline', {
        secureTextEntry: !showPassword,
      })}

      {renderInput('confirmPassword', 'Confirm Password', 'lock-closed-outline', {
        secureTextEntry: !showPassword,
      })}

      {/* Role Selector */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>I am a...</Text>
        <View style={styles.roleRow}>
          {['patient', 'doctor'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                formData.role === role && styles.roleButtonActive,
              ]}
              onPress={() => updateField('role', role)}
            >
              <Ionicons
                name={role === 'patient' ? 'person-outline' : 'medical-outline'}
                size={18}
                color={formData.role === role ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === role && styles.roleButtonTextActive,
                ]}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.registerButton} onPress={handleNext}>
        <Text style={styles.registerButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </>
  );

  // ---- Step 2: Personal & Address ----
  const renderStep2Content = () => (
    <>
      {/* Date of Birth */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TouchableOpacity
          style={[styles.inputWrapper, errors.dateOfBirth && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <Text
            style={[
              styles.input,
              { paddingTop: 14 },
              !formData.dateOfBirth && { color: colors.textDisabled },
            ]}
          >
            {formData.dateOfBirth ? formatDisplayDate(formData.dateOfBirth) : 'MM/DD/YYYY'}
          </Text>
        </TouchableOpacity>
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
      </View>

      {/* Gender */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderButton,
                formData.gender === g && styles.genderButtonActive,
              ]}
              onPress={() => updateField('gender', g)}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  formData.gender === g && styles.genderButtonTextActive,
                ]}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>

      {/* Address */}
      <Text style={styles.sectionLabel}>Address</Text>
      {renderAddressInput('street', 'Street Address', 'location-outline')}

      <View style={styles.row}>
        <View style={styles.halfInput}>
          {renderAddressInput('city', 'City', 'business-outline')}
        </View>
        <View style={styles.halfInput}>
          {renderAddressInput('state', 'State', 'map-outline')}
        </View>
      </View>

      {renderAddressInput('zipCode', 'Zip Code', 'pin-outline', {
        keyboardType: 'number-pad',
      })}

      {/* Doctor-specific fields */}
      {formData.role === 'doctor' && (
        <>
          <Text style={styles.sectionLabel}>Professional Details</Text>
          {renderInput('licenseNumber', 'License Number', 'card-outline')}
          {renderInput('specialization', 'Specialization', 'school-outline')}
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.backStepButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backStepButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, { flex: 1 }, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // ---- Date Picker Modal ----
  const renderDatePickerModal = () => (
    <Modal visible={showDatePicker} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerModal}>
          <Text style={styles.datePickerTitle}>Enter Date of Birth</Text>
          <View style={styles.dateInputRow}>
            <TextInput
              style={styles.dateFieldInput}
              placeholder="MM"
              placeholderTextColor={colors.textDisabled}
              keyboardType="number-pad"
              maxLength={2}
              value={dateInput.month}
              onChangeText={(v) => setDateInput(p => ({ ...p, month: v }))}
            />
            <Text style={styles.dateSeparator}>/</Text>
            <TextInput
              style={styles.dateFieldInput}
              placeholder="DD"
              placeholderTextColor={colors.textDisabled}
              keyboardType="number-pad"
              maxLength={2}
              value={dateInput.day}
              onChangeText={(v) => setDateInput(p => ({ ...p, day: v }))}
            />
            <Text style={styles.dateSeparator}>/</Text>
            <TextInput
              style={[styles.dateFieldInput, { flex: 1.5 }]}
              placeholder="YYYY"
              placeholderTextColor={colors.textDisabled}
              keyboardType="number-pad"
              maxLength={4}
              value={dateInput.year}
              onChangeText={(v) => setDateInput(p => ({ ...p, year: v }))}
            />
          </View>
          <View style={styles.datePickerActions}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={[styles.datePickerActionText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDateConfirm}>
              <Text style={styles.datePickerActionText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (currentStep === 1 ? navigation.goBack() : handleBack())}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              {currentStep === 1
                ? 'Step 1 of 2 — Basic Information'
                : 'Step 2 of 2 — Personal Details'}
            </Text>
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: currentStep === 1 ? '50%' : '100%' }]} />
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {currentStep === 1 ? renderStep1() : renderStep2Content()}

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {renderDatePickerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.base,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.sm,
  },
  halfInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: 50,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  backStepButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '85%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateFieldInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.background,
  },
  dateSeparator: {
    fontSize: 24,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  datePickerActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default RegisterScreen;
