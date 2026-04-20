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
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { reportService, medicationService, uploadService } from '../../services';

// Dynamic import — expo-speech-recognition requires a dev build (not Expo Go)
let SpeechModule = null;
try {
  SpeechModule = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
} catch (e) {
  // Native module not available (Expo Go) — voice input will be hidden
}
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  SEVERITY_LEVELS,
  ONSET_TIMES,
  MEDICATION_CATEGORIES,
  DOSAGE_FORMS,
} from '../../config/constants';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

const STEPS = ['Basic Information', 'Describe Symptoms', 'Additional Details'];

const ReportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t, speechLanguage, locale } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Medication search
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewMedModal, setShowNewMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    genericName: '',
    category: 'Other',
    dosageForm: 'Tablet',
  });

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [dateInput, setDateInput] = useState({ month: '', day: '', year: '' });

  // File attachments (images/videos/audio)
  const [attachments, setAttachments] = useState([]);
  const [audioRecording, setAudioRecording] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  // Duplicate warning flow
  const [duplicateWarningVisible, setDuplicateWarningVisible] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [pendingReportData, setPendingReportData] = useState(null);

  // Speech-to-text (matches web's voice input that fills symptoms field)
  const [isListening, setIsListening] = useState(false);
  const speechSupported = !!SpeechModule;

  // Set up speech recognition event listeners (only if native module is available)
  useEffect(() => {
    if (!SpeechModule) return;

    const resultSub = SpeechModule.addListener('result', (event) => {
      const finalResults = event.results
        ?.filter((r) => r.isFinal)
        ?.map((r) => r.transcript)
        ?.join(' ');
      if (finalResults) {
        setFormData((prev) => ({
          ...prev,
          symptoms: (prev.symptoms ? prev.symptoms + ' ' : '') + finalResults,
        }));
      }
    });
    const endSub = SpeechModule.addListener('end', () => setIsListening(false));
    const errSub = SpeechModule.addListener('error', (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    });

    return () => {
      resultSub?.remove();
      endSub?.remove();
      errSub?.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRecording) {
        audioRecording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [audioRecording]);

  // Form Data — matches web exactly
  const [formData, setFormData] = useState({
    medicine: null,
    dosage: '',
    frequency: '',
    route: 'Oral',
    indication: '',
    symptoms: '',
    severity: 'Mild',
    onset: 'Within hours',
    startDate: '',
    additionalInfo: '',
  });

  // Load popular medications on mount
  useEffect(() => {
    loadPopularMedications();
  }, []);

  // Search medications when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchMeds();
      } else if (searchQuery.length === 0) {
        loadPopularMedications();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPopularMedications = async () => {
    try {
      const response = await medicationService.getPopularMedications();
      const meds = response.data?.medications || response.data || [];
      setMedications(Array.isArray(meds) ? meds : []);
    } catch (error) {
      console.log('Popular meds error:', error);
    }
  };

  const searchMeds = async () => {
    try {
      setIsSearching(true);
      const response = await medicationService.searchMedications(searchQuery);
      const meds = response.data?.medications || response.data || [];
      setMedications(Array.isArray(meds) ? meds : []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreatePatientMedication = async () => {
    if (!newMedForm.name.trim()) {
      Alert.alert('Required', 'Please enter the medication name.');
      return;
    }
    try {
      const response = await medicationService.createPatientMedication({
        name: newMedForm.name.trim(),
        genericName: newMedForm.genericName.trim() || undefined,
        category: newMedForm.category,
        dosageForm: newMedForm.dosageForm,
      });
      const created = response.data?.medication || response.data;
      if (created) {
        setFormData(prev => ({ ...prev, medicine: created }));
        setShowNewMedModal(false);
        setNewMedForm({ name: '', genericName: '', category: 'Other', dosageForm: 'Tablet' });
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add medication.');
    }
  };

  // ─── Image Picker ──────────────────────────────────
  const pickImage = async (useCamera = false) => {
    try {
      if (attachments.length >= 5) {
        Alert.alert('Limit Reached', 'You can upload a maximum of 5 files.');
        return;
      }

      const permissionFn = useCamera
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
      const { status } = await permissionFn();
      if (status !== 'granted') {
        Alert.alert('Permission Required', `Please grant ${useCamera ? 'camera' : 'photo library'} permission.`);
        return;
      }

      const launchFn = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await launchFn({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: !useCamera,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
          fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image',
          width: asset.width,
          height: asset.height,
        }));
        setAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const startAudioAttachmentRecording = async () => {
    if (attachments.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 files.');
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record a voice note.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      setAudioRecording(recording);
      setIsRecordingAudio(true);
    } catch (error) {
      console.error('Start voice note recording error:', error);
      Alert.alert('Error', 'Failed to start voice note recording. Please try again.');
      setAudioRecording(null);
      setIsRecordingAudio(false);
    }
  };

  const stopAudioAttachmentRecording = async () => {
    if (!audioRecording) {
      setIsRecordingAudio(false);
      return;
    }

    try {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();

      if (uri) {
        setAttachments((prev) => [
          ...prev,
          {
            uri,
            mimeType: 'audio/m4a',
            fileName: `voice_note_${Date.now()}.m4a`,
            type: 'audio',
          },
        ].slice(0, 5));
      }
    } catch (error) {
      console.error('Stop voice note recording error:', error);
      Alert.alert('Error', 'Failed to save voice note. Please try again.');
    } finally {
      setAudioRecording(null);
      setIsRecordingAudio(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    }
  };

  // ─── Speech-to-Text (Voice Input) ─────────────────────────────────
  const startListening = async () => {
    if (!SpeechModule) return;
    try {
      const result = await SpeechModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission for voice input.');
        return;
      }
      SpeechModule.start({
        lang: speechLanguage,
        interimResults: false,
        continuous: true,
      });
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      Alert.alert('Not Available', 'Speech recognition is not available on this device.');
    }
  };

  const stopListening = () => {
    try {
      SpeechModule?.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
    setIsListening(false);
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.medicine) {
          Alert.alert('Required', 'Please select a medication');
          return false;
        }
        if (!formData.dosage.trim()) {
          Alert.alert('Required', 'Please enter the dosage amount');
          return false;
        }
        if (!formData.frequency.trim()) {
          Alert.alert('Required', 'Please enter the frequency');
          return false;
        }
        if (!formData.indication.trim()) {
          Alert.alert('Required', 'Please enter the indication (reason for taking)');
          return false;
        }
        return true;
      case 1:
        if (!formData.symptoms.trim()) {
          Alert.alert('Required', 'Please describe the side effect');
          return false;
        }
        return true;
      case 2:
        if (!formData.startDate) {
          Alert.alert('Required', 'Please enter when symptoms started');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const submitFinalReport = async (reportData) => {
    const response = await reportService.submitReport(reportData);

    if (response.success || response.status === 'success') {
      Alert.alert(
        t('report.alerts.submittedTitle'),
        t('report.alerts.submittedMessage'),
        [{
          text: t('report.alerts.viewReports'),
          onPress: () => navigation.navigate('Reports'),
        }]
      );
      return;
    }

    throw new Error(response?.message || t('report.alerts.submitFailed'));
  };

  const getSimilarityPercent = (candidate = {}) => {
    const raw = candidate.similarityScore ?? candidate.score ?? candidate.heuristicScore ?? null;
    if (raw === null || raw === undefined || Number.isNaN(Number(raw))) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(Number(raw) * 100)));
  };

  const handleCancelDuplicateWarning = () => {
    setDuplicateWarningVisible(false);
    setPendingReportData(null);
    setPotentialDuplicates([]);
    setIsLoading(false);
  };

  const handleSubmitDespiteDuplicates = async () => {
    if (!pendingReportData) {
      setDuplicateWarningVisible(false);
      return;
    }

    setDuplicateWarningVisible(false);
    setIsLoading(true);

    try {
      await submitFinalReport(pendingReportData);
      setPendingReportData(null);
      setPotentialDuplicates([]);
    } catch (error) {
      Alert.alert(
        t('report.alerts.errorTitle'),
        error.response?.data?.message || error.message || t('report.alerts.submitFailed')
      );
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (isRecordingAudio) {
      Alert.alert(
        t('report.alerts.recordingInProgressTitle'),
        t('report.alerts.recordingInProgressMessage')
      );
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Upload files if any attachments exist
      let uploadedAttachments = [];
      const filesToUpload = [...attachments];

      if (filesToUpload.length > 0) {
        try {
          const uploadResult = await uploadService.uploadFiles(filesToUpload);
          const uploaded = uploadResult.data?.files || uploadResult.files || [];
          uploadedAttachments = uploaded.map((f) => ({
            key: f.key || f.objectName,
            originalName: f.originalName || f.originalname,
            mimeType: f.mimeType || f.mimetype || f.contentType,
            size: f.size,
            url: f.url || f.location || '',
          }));
        } catch (uploadError) {
          console.warn('File upload failed, continuing without attachments:', uploadError.message);
        }
      }

      // Step 2: Auto-determine seriousness from severity (same as web)
      const seriousness = (formData.severity === 'Severe' || formData.severity === 'Life-threatening')
        ? 'Serious' : 'Non-serious';

      const reportData = {
        reporterRole: 'patient',
        medicine: formData.medicine._id,
        sideEffects: [{
          effect: formData.symptoms,
          severity: formData.severity,
          onset: formData.onset,
          description: formData.additionalInfo || undefined,
        }],
        medicationUsage: {
          indication: formData.indication,
          dosage: {
            amount: formData.dosage,
            frequency: formData.frequency,
            route: formData.route,
          },
          startDate: formData.startDate,
        },
        reportDetails: {
          incidentDate: formData.startDate,
          seriousness,
          outcome: 'Unknown',
        },
        patientInfo: {
          age: user?.age || undefined,
          gender: user?.gender || 'other',
        },
      };

      // Include attachments if files were uploaded
      if (uploadedAttachments.length > 0) {
        reportData.attachments = uploadedAttachments;
      }

      const duplicateCheck = await reportService.checkDuplicates({
        medicine: reportData.medicine,
        patient: user?._id || user?.id,
        sideEffects: reportData.sideEffects,
        reportDetails: reportData.reportDetails,
      });

      const hasPotentialDuplicates =
        duplicateCheck?.data?.hasPotentialDuplicates ?? duplicateCheck?.data?.hasDuplicates;

      if (duplicateCheck?.success && hasPotentialDuplicates && duplicateCheck?.data?.duplicates?.length > 0) {
        setPendingReportData(reportData);
        setPotentialDuplicates(duplicateCheck.data.duplicates);
        setDuplicateWarningVisible(true);
        return;
      }

      await submitFinalReport(reportData);
    } catch (error) {
      Alert.alert(
        t('report.alerts.errorTitle'),
        error.response?.data?.message || t('report.alerts.submitFailed')
      );
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  };

  const handleDateConfirm = () => {
    const { month, day, year } = dateInput;
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear() + 1) {
      const isoDate = new Date(y, m - 1, d).toISOString();
      setFormData(prev => ({ ...prev, startDate: isoDate }));
      setShowDatePicker(null);
      setDateInput({ month: '', day: '', year: '' });
    } else {
      Alert.alert('Invalid Date', 'Please enter a valid date (MM/DD/YYYY).');
    }
  };

  // ─── STEP 0: Basic Information ────────────────────────
  const renderStep0 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Ionicons name="medkit" size={22} color={colors.primary} />
        <Text style={styles.stepTitle}>Basic Information</Text>
      </View>
      <Text style={styles.stepSubtitle}>
        Select the medication and provide dosage details
      </Text>

      {/* Medication Search */}
      <Text style={styles.inputLabel}>Search Medication *</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          placeholderTextColor={colors.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* Selected Medication */}
      {formData.medicine && (
        <View style={styles.selectedMed}>
          <View style={styles.selectedMedIcon}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedMedName}>{formData.medicine.name}</Text>
            {formData.medicine.genericName && (
              <Text style={styles.selectedMedGeneric}>{formData.medicine.genericName}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, medicine: null }))}>
            <Ionicons name="close-circle" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Medication List */}
      {!formData.medicine && (
        <View style={styles.medListContainer}>
          {medications.length > 0 ? (
            medications.slice(0, 10).map((med) => (
              <TouchableOpacity
                key={med._id}
                style={styles.medItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, medicine: med }));
                  setSearchQuery('');
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.medNameRow}>
                    <Text style={styles.medItemName}>{med.name}</Text>
                    {!med.isVerified && (
                      <View style={styles.unverifiedBadge}>
                        <Text style={styles.unverifiedText}>Patient Added</Text>
                      </View>
                    )}
                  </View>
                  {med.genericName && (
                    <Text style={styles.medItemGeneric}>{med.genericName}</Text>
                  )}
                  {med.category && (
                    <Text style={styles.medItemCategory}>{med.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : searchQuery.length >= 2 && !isSearching ? (
            <Text style={styles.noResults}>No medications found</Text>
          ) : null}

          {/* Can't find it? */}
          <TouchableOpacity style={styles.cantFindBtn} onPress={() => setShowNewMedModal(true)}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.cantFindText}>Can't find your medication? Add it here</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dosage Amount */}
      <Text style={styles.inputLabel}>Dosage Amount *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 500mg, 1 tablet"
        placeholderTextColor={colors.textDisabled}
        value={formData.dosage}
        onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))}
      />

      {/* Frequency */}
      <Text style={styles.inputLabel}>Frequency *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., twice daily, once a day"
        placeholderTextColor={colors.textDisabled}
        value={formData.frequency}
        onChangeText={(text) => setFormData(prev => ({ ...prev, frequency: text }))}
      />

      {/* Route of Administration */}
      <Text style={styles.inputLabel}>Route of Administration</Text>
      <View style={styles.chipGrid}>
        {['Oral', 'Topical', 'Injection', 'Inhalation', 'Other'].map((route) => (
          <TouchableOpacity
            key={route}
            style={[
              styles.routeChip,
              formData.route === route && styles.routeChipActive,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, route }))}
          >
            <Text style={[
              styles.routeChipText,
              formData.route === route && styles.routeChipTextActive,
            ]}>{route}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Indication */}
      <Text style={styles.inputLabel}>Indication (Reason for Taking) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Pain relief, Blood pressure"
        placeholderTextColor={colors.textDisabled}
        value={formData.indication}
        onChangeText={(text) => setFormData(prev => ({ ...prev, indication: text }))}
      />

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );

  // ─── STEP 1: Describe Symptoms ────────────────────────
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Ionicons name="warning" size={22} color={colors.warning} />
        <Text style={styles.stepTitle}>Describe Symptoms</Text>
      </View>
      <Text style={styles.stepSubtitle}>
        Tell us about the side effects you experienced
      </Text>

      {/* Side Effect Description */}
      <Text style={styles.inputLabel}>Describe the Side Effect *</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Describe what happened in detail..."
        placeholderTextColor={colors.textDisabled}
        value={formData.symptoms}
        onChangeText={(text) => setFormData(prev => ({ ...prev, symptoms: text }))}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Severity Level */}
      <Text style={styles.inputLabel}>Severity Level *</Text>
      <View style={styles.severityContainer}>
        {SEVERITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.severityButton,
              formData.severity === level.value && {
                backgroundColor: level.color,
                borderColor: level.color,
              },
            ]}
            onPress={() => setFormData(prev => ({ ...prev, severity: level.value }))}
          >
            <Ionicons
              name={formData.severity === level.value ? 'radio-button-on' : 'radio-button-off'}
              size={16}
              color={formData.severity === level.value ? '#fff' : colors.textSecondary}
            />
            <Text style={[
              styles.severityButtonText,
              formData.severity === level.value && { color: '#fff' },
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Auto seriousness indicator */}
      {(formData.severity === 'Severe' || formData.severity === 'Life-threatening') && (
        <View style={styles.seriousWarning}>
          <Ionicons name="alert-circle" size={16} color="#D32F2F" />
          <Text style={styles.seriousWarningText}>
            This will be classified as a <Text style={{ fontWeight: '700' }}>Serious</Text> report due to severity level
          </Text>
        </View>
      )}

      {/* Onset */}
      <Text style={styles.inputLabel}>When did it start? *</Text>
      <View style={styles.chipGrid}>
        {ONSET_TIMES.map((onset) => (
          <TouchableOpacity
            key={onset}
            style={[
              styles.onsetChip,
              formData.onset === onset && styles.onsetChipActive,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, onset }))}
          >
            <Text style={[
              styles.onsetChipText,
              formData.onset === onset && styles.onsetChipTextActive,
            ]}>{onset}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );

  // ─── STEP 2: Additional Details ───────────────────────
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Ionicons name="document-text" size={22} color={colors.info} />
        <Text style={styles.stepTitle}>Additional Details</Text>
      </View>
      <Text style={styles.stepSubtitle}>
        Provide any additional information about your experience
      </Text>

      {/* Start Date */}
      <Text style={styles.inputLabel}>When did symptoms start? *</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker('startDate')}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.dateButtonText, !formData.startDate && { color: colors.textDisabled }]}>
          {formData.startDate ? formatDisplayDate(formData.startDate) : 'Select date'}
        </Text>
      </TouchableOpacity>

      {/* Additional Information */}
      <Text style={styles.inputLabel}>Additional Information</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Any other details you'd like to share (medical history, other medications, etc.)"
        placeholderTextColor={colors.textDisabled}
        value={formData.additionalInfo}
        onChangeText={(text) => setFormData(prev => ({ ...prev, additionalInfo: text }))}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Media Upload */}
      <Text style={styles.inputLabel}>Upload Media (Optional)</Text>
      <View style={styles.uploadSection}>
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(false)}>
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={styles.uploadBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(true)}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={styles.uploadBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadBtn, isRecordingAudio && styles.voiceAttachmentBtnActive]}
            onPress={isRecordingAudio ? stopAudioAttachmentRecording : startAudioAttachmentRecording}
          >
            <Ionicons
              name={isRecordingAudio ? 'stop-circle-outline' : 'mic-outline'}
              size={20}
              color={isRecordingAudio ? '#fff' : colors.primary}
            />
            <Text style={[styles.uploadBtnText, isRecordingAudio && styles.voiceAttachmentBtnTextActive]}>
              {isRecordingAudio ? 'Stop Voice' : 'Voice Note'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.uploadHint}>
          Upload up to 5 images, videos, or voice notes (max 50MB each)
        </Text>
        {isRecordingAudio && <Text style={styles.listeningHint}>Recording voice note...</Text>}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentList}>
            {attachments.map((file, idx) => (
              <View key={idx} style={styles.attachmentItem}>
                {file.type === 'video' ? (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={24} color="#fff" />
                  </View>
                ) : file.type === 'audio' ? (
                  <View style={styles.audioPlaceholder}>
                    <Ionicons name="mic" size={20} color="#fff" />
                    <Text style={styles.audioFileName} numberOfLines={2}>
                      {file.fileName || 'voice-note.m4a'}
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: file.uri }} style={styles.attachmentThumb} />
                )}
                <TouchableOpacity
                  style={styles.removeAttachmentBtn}
                  onPress={() => removeAttachment(idx)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Voice Input (Speech-to-Text — same as web's voice input) */}
      {speechSupported && (
        <View style={styles.voiceInputSection}>
          <TouchableOpacity
            style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
            onPress={isListening ? stopListening : startListening}
          >
            <Ionicons
              name={isListening ? 'stop-circle' : 'mic'}
              size={22}
              color={isListening ? '#fff' : colors.primary}
            />
            <Text style={[styles.voiceBtnText, isListening && { color: '#fff' }]}>
              {isListening ? 'Stop Recording' : 'Record Voice'}
            </Text>
            {isListening && <View style={styles.recordingDot} />}
          </TouchableOpacity>
          {isListening && (
            <Text style={styles.listeningHint}>Listening... Speak now</Text>
          )}
          {!isListening && (
            <Text style={styles.uploadHint}>
              Use voice input to describe your symptoms — text will be added above
            </Text>
          )}
        </View>
      )}

      {/* Report Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="clipboard" size={18} color={colors.primary} />
          <Text style={styles.summaryTitle}>Report Summary</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Medication</Text>
          <Text style={styles.summaryValue}>{formData.medicine?.name || '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dosage</Text>
          <Text style={styles.summaryValue}>{formData.dosage || '—'} ({formData.frequency || '—'})</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Route</Text>
          <Text style={styles.summaryValue}>{formData.route}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Indication</Text>
          <Text style={styles.summaryValue}>{formData.indication || '—'}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Side Effect</Text>
          <Text style={styles.summaryValue} numberOfLines={2}>{formData.symptoms || '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Severity</Text>
          <View style={[styles.summaryBadge, { backgroundColor: (SEVERITY_LEVELS.find(s => s.value === formData.severity)?.color || '#999') + '20' }]}>
            <Text style={[styles.summaryBadgeText, { color: SEVERITY_LEVELS.find(s => s.value === formData.severity)?.color || '#999' }]}>
              {formData.severity}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Classification</Text>
          <Text style={[styles.summaryValue, {
            color: (formData.severity === 'Severe' || formData.severity === 'Life-threatening') ? colors.error : colors.success,
            fontWeight: '600',
          }]}>
            {(formData.severity === 'Severe' || formData.severity === 'Life-threatening') ? 'Serious' : 'Non-serious'}
          </Text>
        </View>
      </View>

      {/* AI Info */}
      <View style={styles.aiInfoCard}>
        <LinearGradient
          colors={['#4A148C', '#7C4DFF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.aiInfoGradient}
        >
          <Ionicons name="analytics" size={18} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiInfoTitle}>AI Analysis</Text>
            <Text style={styles.aiInfoDesc}>
              After submission, our AI will analyze your report and provide severity assessment, patient guidance, and recommended next steps.
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );

  // ─── New Medication Modal ─────────────────────────────
  const renderNewMedModal = () => (
    <Modal visible={showNewMedModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Medication</Text>
              <TouchableOpacity onPress={() => setShowNewMedModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Add a medication that's not in our database
            </Text>

            <Text style={styles.inputLabel}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Aspirin"
              placeholderTextColor={colors.textDisabled}
              value={newMedForm.name}
              onChangeText={(text) => setNewMedForm(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.inputLabel}>Generic Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Acetylsalicylic acid"
              placeholderTextColor={colors.textDisabled}
              value={newMedForm.genericName}
              onChangeText={(text) => setNewMedForm(prev => ({ ...prev, genericName: text }))}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.base }}>
              {MEDICATION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, newMedForm.category === cat && styles.catChipActive]}
                  onPress={() => setNewMedForm(prev => ({ ...prev, category: cat }))}
                >
                  <Text style={[styles.catChipText, newMedForm.category === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Dosage Form</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              {DOSAGE_FORMS.map((form) => (
                <TouchableOpacity
                  key={form}
                  style={[styles.catChip, newMedForm.dosageForm === form && styles.catChipActive]}
                  onPress={() => setNewMedForm(prev => ({ ...prev, dosageForm: form }))}
                >
                  <Text style={[styles.catChipText, newMedForm.dosageForm === form && styles.catChipTextActive]}>{form}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowNewMedModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreatePatientMedication}>
                <LinearGradient
                  colors={[colors.primary, '#42A5F5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.modalSubmitGradient}
                >
                  <Text style={styles.modalSubmitText}>Add Medication</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── Date Picker Modal ────────────────────────────────
  const renderDatePickerModal = () => (
    <Modal visible={showDatePicker !== null} transparent animationType="fade">
      <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
        <View style={styles.datePickerModal}>
          <Text style={styles.datePickerTitle}>When did symptoms start?</Text>
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
            <TouchableOpacity onPress={() => { setShowDatePicker(null); setDateInput({ month: '', day: '', year: '' }); }}>
              <Text style={[styles.dateActionText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDateConfirm}>
              <Text style={styles.dateActionText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Stepper Header */}
      <View style={styles.stepperContainer}>
        {STEPS.map((label, index) => (
          <View key={index} style={styles.stepperItem}>
            <View style={[
              styles.stepperCircle,
              index <= activeStep && styles.stepperCircleActive,
              index < activeStep && styles.stepperCircleCompleted,
            ]}>
              {index < activeStep ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepperNumber,
                  index <= activeStep && styles.stepperNumberActive,
                ]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[
              styles.stepperLabel,
              index <= activeStep && styles.stepperLabelActive,
            ]} numberOfLines={1}>{label}</Text>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepperLine, index < activeStep && styles.stepperLineActive]} />
            )}
          </View>
        ))}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((activeStep + 1) / STEPS.length) * 100}%` }]} />
      </View>

      {/* Step Content */}
      {activeStep === 0 && renderStep0()}
      {activeStep === 1 && renderStep1()}
      {activeStep === 2 && renderStep2()}

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {activeStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {activeStep < STEPS.length - 1 ? (
          <TouchableOpacity
            style={[styles.nextButton, activeStep === 0 && { flex: 1 }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#2E7D32', '#4CAF50']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {renderNewMedModal()}
      {renderDatePickerModal()}

      <Modal visible={duplicateWarningVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.duplicateModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('report.alerts.possibleDuplicateTitle')}</Text>
              <TouchableOpacity onPress={handleCancelDuplicateWarning}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {t('report.alerts.possibleDuplicateMessage', {
                count: potentialDuplicates.length,
                suffix: potentialDuplicates.length > 1 ? 's' : '',
              })}
            </Text>

            <ScrollView style={styles.duplicateList} showsVerticalScrollIndicator={false}>
              {potentialDuplicates.slice(0, 3).map((dup, index) => {
                const similarity = getSimilarityPercent(dup);
                const dateLabel = dup?.createdAt
                  ? formatDisplayDate(dup.createdAt)
                  : '--';

                return (
                  <View key={dup.reportId || `${dup.createdAt || 'duplicate'}-${index}`} style={styles.duplicateCard}>
                    <Text style={styles.duplicateTitle} numberOfLines={2}>
                      {dup?.medicine?.name || formData?.medicine?.name || 'Medication'}
                    </Text>
                    <Text style={styles.duplicateEffect} numberOfLines={2}>
                      {dup?.sideEffects?.[0]?.effect || 'Similar symptoms reported'}
                    </Text>
                    <View style={styles.duplicateMetaRow}>
                      <Text style={styles.duplicateMetaText}>{dateLabel}</Text>
                      <Text style={styles.duplicateMetaText}>
                        {similarity !== null ? `${similarity}%` : 'High'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCancelDuplicateWarning}>
                <Text style={styles.modalCancelText}>{t('report.alerts.reviewAndEdit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isLoading && styles.buttonDisabled]}
                onPress={handleSubmitDespiteDuplicates}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.warning, '#FFB74D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSubmitGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>{t('report.alerts.submitAnyway')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  stepperItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepperCircleActive: {
    backgroundColor: colors.primary,
  },
  stepperCircleCompleted: {
    backgroundColor: colors.success,
  },
  stepperNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepperNumberActive: {
    color: '#fff',
  },
  stepperLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepperLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepperLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: -1,
  },
  stepperLineActive: {
    backgroundColor: colors.success,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  // Step content
  stepContainer: {
    flex: 1,
    padding: spacing.base,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: 48,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  // Selected medication
  selectedMed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '40',
    gap: spacing.sm,
  },
  selectedMedIcon: {},
  selectedMedName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  selectedMedGeneric: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  // Medication list
  medListContainer: {
    marginBottom: spacing.md,
  },
  medItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  unverifiedBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  unverifiedText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
  },
  medItemGeneric: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  medItemCategory: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  noResults: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  cantFindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  cantFindText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  // Route chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  routeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  routeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  routeChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  routeChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Severity
  severityContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  severityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  seriousWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  seriousWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#D32F2F',
    lineHeight: 18,
  },
  // Onset chips
  onsetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  onsetChipActive: {
    borderColor: colors.info,
    backgroundColor: colors.info + '12',
  },
  onsetChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  onsetChipTextActive: {
    color: colors.info,
    fontWeight: '600',
  },
  // Date
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: 48,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dateButtonText: {
    fontSize: 15,
    color: colors.text,
  },
  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  summaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // AI info
  aiInfoCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  aiInfoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  aiInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  aiInfoDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
  // Buttons
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: borderRadius.md,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  duplicateModalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    padding: spacing.lg,
    maxHeight: '80%',
    ...shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  duplicateList: {
    maxHeight: 220,
  },
  duplicateCard: {
    borderWidth: 1,
    borderColor: colors.warning + '33',
    backgroundColor: colors.warning + '12',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  duplicateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  duplicateEffect: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  duplicateMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duplicateMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  catChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  catChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubmitBtn: {
    flex: 2,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Date picker
  datePickerModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '85%',
    alignSelf: 'center',
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
  dateActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  // Upload section
  uploadSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
    backgroundColor: colors.primary + '05',
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  voiceAttachmentBtnActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
    borderStyle: 'solid',
  },
  voiceAttachmentBtnTextActive: {
    color: '#fff',
  },
  uploadHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  attachmentList: {
    marginTop: spacing.sm,
  },
  attachmentItem: {
    marginRight: spacing.sm,
    position: 'relative',
  },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  videoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 4,
  },
  audioFileName: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center',
  },
  removeAttachmentBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  // Voice input section
  voiceInputSection: {
    marginBottom: spacing.md,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '05',
  },
  voiceBtnActive: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  voiceBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  listeningHint: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default ReportScreen;
