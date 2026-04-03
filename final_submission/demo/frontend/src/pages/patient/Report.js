import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Mic as MicIcon,
  Send as SendIcon,
  PhotoCamera as PhotoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Stop as StopIcon,
  FiberManualRecord as RecordIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "../../components/ui/Loading";
import { reportService, medicationService } from "../../services";
import { MEDICATION_CATEGORIES, MEDICATION_DOSAGE_FORMS } from "../../config/constants";
import AuthContainer from '../../store/containers/AuthContainer';
import { useI18n } from '../../i18n';

const stepKeys = ['report.steps.basicInformation', 'report.steps.describeSymptoms', 'report.steps.additionalDetails'];

// Speech-to-text hook
const useSpeechToText = (language = 'en-US') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }
        
        setTranscript(prev => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default function Report() {
  const { t, speechLang } = useI18n();
  const { user, isAuthenticated, login } = AuthContainer.useContainer();
  const steps = stepKeys.map((key) => t(key));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [medications, setMedications] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [medicationSearchLoading, setMedicationSearchLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  
  // Speech-to-text
  const { 
    isListening, 
    transcript, 
    isSupported: speechSupported, 
    error: speechError,
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechToText(speechLang);
  
  // Duplicate check state
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [pendingReportData, setPendingReportData] = useState(null);

  // New medication dialog state
  const [newMedicationDialog, setNewMedicationDialog] = useState(false);
  const [newMedicationData, setNewMedicationData] = useState({
    name: '',
    genericName: '',
    category: '',
    dosageForm: ''
  });
  const [newMedicationLoading, setNewMedicationLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    indication: '',
    symptoms: '',
    severity: 'Mild',
    onset: 'Within hours',
    startDate: '',
    additionalInfo: '',
    photo: null,
    attachments: [],  // Support multiple images/videos
  });

  // Update symptoms when transcript changes
  useEffect(() => {
    if (transcript) {
      setFormData(prev => ({
        ...prev,
        symptoms: prev.symptoms + transcript
      }));
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Initialize component - load popular medications
  useEffect(() => {
    const initializeMedications = async () => {
      try {
        const response = await medicationService.getPopular(10);
        if (response.success && response.data?.medications) {
          setMedications(response.data.medications);
        }
      } catch (error) {
        console.log('Failed to load initial medications:', error);
      }
    };

    initializeMedications();
  }, []);

  // Quick demo login function
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await login('patient@demo.com', 'Demo@123');
      if (!result.success) {
        // If API login fails, set up demo authentication manually
        const demoUser = {
          _id: 'demo-patient1',
          email: 'patient@demo.com',
          role: 'patient',
          name: 'Demo Patient',
          firstName: 'Demo',
          lastName: 'Patient',
          isActive: true,
          isEmailVerified: true
        };
        
        // Set token and user in localStorage for demo
        localStorage.setItem('token', 'demo-token-patient1');
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        // Refresh the page to update auth state
        window.location.reload();
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  // Search medications using new medication service
  const searchMedications = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      // Show popular medications when search is empty
      try {
        const response = await medicationService.getPopular(10);
        if (response.success && response.data?.medications) {
          setMedications(response.data.medications);
        }
      } catch (error) {
        console.log('Error loading popular medications');
      }
      return;
    }
    
    setMedicationSearchLoading(true);
    try {
      const response = await medicationService.search(searchTerm);
      if (response.success && response.data?.medications) {
        setMedications(response.data.medications);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
      setMedications([]);
    } finally {
      setMedicationSearchLoading(false);
    }
  };

  const handleMedicationSelect = (event, value) => {
    setSelectedMedication(value);
    if (value) {
      setFormData({
        ...formData,
        medicationName: value.name,
      });
    }
  };

  // Handle creating a new medication
  const handleOpenNewMedicationDialog = () => {
    setNewMedicationDialog(true);
  };

  const handleCloseNewMedicationDialog = () => {
    setNewMedicationDialog(false);
    setNewMedicationData({
      name: '',
      genericName: '',
      category: '',
      dosageForm: ''
    });
  };

  const handleNewMedicationInputChange = (field) => (event) => {
    setNewMedicationData({
      ...newMedicationData,
      [field]: event.target.value,
    });
  };

  const handleCreateNewMedication = async () => {
    if (!newMedicationData.name.trim()) {
      return;
    }

    setNewMedicationLoading(true);
    try {
      const response = await medicationService.createPatientMedication(newMedicationData);

      if (response.success) {
        const newMedication = response.data.medication;
        setSelectedMedication(newMedication);
        setFormData({
          ...formData,
          medicationName: newMedication.name,
        });
        setMedications(prev => [newMedication, ...prev]);
        handleCloseNewMedicationDialog();
        
        // Show message if it was an existing medication
        if (response.data.isExisting) {
          alert(t('report.existingMedicationSelected'));
        }
      }
    } catch (error) {
      console.error('Error creating medication:', error);
      alert(t('report.createMedicationFailed'));
    } finally {
      setNewMedicationLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // Validate file types and sizes
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
        'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/webm', 'audio/ogg'
      ];
      const maxSize = 50 * 1024 * 1024; // 50MB max per file
      
      const validFiles = files.filter(file => {
        if (!allowedTypes.includes(file.type)) {
          setSubmissionError(t('report.fileUnsupported', { fileName: file.name }));
          return false;
        }
        if (file.size > maxSize) {
          setSubmissionError(t('report.fileTooLarge', { fileName: file.name }));
          return false;
        }
        return true;
      });

      setFormData(prev => ({
        ...prev,
        photo: validFiles[0] || prev.photo,  // Keep backward compat
        attachments: [...prev.attachments, ...validFiles].slice(0, 5),  // Max 5 files
      }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData({
      ...formData,
      photo: null,
      attachments: [],
    });
  };

  // Form validation
  const validateCurrentStep = () => {
    const errors = {};
    
    if (activeStep === 0) {
      if (!selectedMedication) errors.medication = t('report.validation.selectMedication');
      if (!formData.dosage.trim()) errors.dosage = t('report.validation.enterDosage');
      if (!formData.frequency) errors.frequency = t('report.validation.selectFrequency');
      if (!formData.indication.trim()) errors.indication = t('report.validation.enterIndication');
    } else if (activeStep === 1) {
      if (!formData.symptoms.trim()) errors.symptoms = t('report.validation.describeSymptoms');
      if (!formData.severity) errors.severity = t('report.validation.selectSeverity');
    } else if (activeStep === 2) {
      if (!formData.startDate) errors.startDate = t('report.validation.enterStartDate');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setValidationErrors({});
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Actually submit the report after optional duplicate confirmation
  const doSubmitReport = async (reportData) => {
    const response = await reportService.submitReport(reportData);
    if (response.status === 'success' || response.success) {
      setSubmitted(true);
      setSuccessMessage(t('report.submissionSuccessMessage'));
    } else {
      throw new Error(response.message || t('report.submissionFailed'));
    }
  };

  // Proceed with submission after user dismisses duplicate warning
  const handleProceedDespiteDuplicates = async () => {
    setDuplicateWarningOpen(false);
    if (pendingReportData) {
      try {
        await doSubmitReport(pendingReportData);
      } catch (error) {
        let errorMessage = t('report.submissionFailedGeneric');
        if (error.response?.data?.message) errorMessage = error.response.data.message;
        else if (error.message) errorMessage = error.message;
        setSubmissionError(errorMessage);
      } finally {
        setLoading(false);
        setPendingReportData(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');

    if (!isAuthenticated || !user) {
      setSubmissionError(t('report.mustBeLoggedIn'));
      return;
    }

    if (!selectedMedication) {
      setSubmissionError(t('report.selectMedicationFromList'));
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload files to MinIO if any attachments exist
      let uploadedAttachments = [];
      const filesToUpload = formData.attachments || [];
      
      if (filesToUpload.length > 0) {
        try {
          const uploadFormData = new FormData();
          filesToUpload.forEach((file) => {
            uploadFormData.append('files', file);
          });
          
          const token = localStorage.getItem('token') || localStorage.getItem('authToken');
          const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
          const uploadResponse = await fetch(`${baseURL}/uploads/multiple`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: uploadFormData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            const uploaded = uploadResult.data?.files || uploadResult.files || [];
            uploadedAttachments = uploaded.map(f => ({
              key: f.key || f.objectName,
              originalName: f.originalName || f.originalname,
              mimeType: f.mimeType || f.mimetype || f.contentType,
              size: f.size,
              url: f.url || f.location || ''
            }));
            console.log(`Uploaded ${uploadedAttachments.length} file(s) successfully`);
          } else {
            console.warn('File upload failed, continuing without attachments');
          }
        } catch (uploadError) {
          console.warn('File upload error, continuing without attachments:', uploadError.message);
        }
      }

      // Step 2: Prepare report data for API submission matching backend schema
      // Note: Backend expects 'medicine' not 'medication'
      const reportData = {
        // Don't send reportedBy - backend gets it from authenticated user
        reporterRole: user.role || 'patient',
        medicine: selectedMedication._id, // Backend expects 'medicine' field
        sideEffects: [{
          effect: formData.symptoms.trim(),
          severity: formData.severity,
          onset: formData.onset,
          description: formData.additionalInfo?.trim() || undefined
        }],
        medicationUsage: {
          indication: formData.indication?.trim() || 'General use',
          dosage: {
            amount: formData.dosage.trim(),
            frequency: formData.frequency.trim(),
            route: formData.route
          },
          startDate: formData.startDate ? new Date(formData.startDate) : new Date()
        },
        reportDetails: {
          incidentDate: formData.startDate ? new Date(formData.startDate) : new Date(),
          seriousness: formData.severity === 'Severe' || formData.severity === 'Life-threatening' ? 'Serious' : 'Non-serious',
          outcome: 'Unknown'
        },
        patientInfo: {
          age: user.age || undefined,
          gender: user.gender || 'other'
        }
      };

      // Include attachments if files were uploaded
      if (uploadedAttachments.length > 0) {
        reportData.attachments = uploadedAttachments;
      }

      // Step 3: Check for potential duplicates before submitting
      const dupCheckData = {
        medicine: reportData.medicine,
        sideEffects: reportData.sideEffects,
        reportDetails: reportData.reportDetails,
      };
      const dupResult = await reportService.checkDuplicates(dupCheckData);
      const hasPotentialDuplicates =
        dupResult?.data?.hasPotentialDuplicates ?? dupResult?.data?.hasDuplicates;
      if (dupResult?.success && hasPotentialDuplicates && dupResult?.data?.duplicates?.length > 0) {
        // Store the report data and show warning dialog
        setPendingReportData(reportData);
        setPotentialDuplicates(dupResult.data.duplicates);
        setDuplicateWarningOpen(true);
        setLoading(false);
        return; // Don't submit yet — wait for user confirmation
      }

      // No duplicates found — proceed with submission
      await doSubmitReport(reportData);
    } catch (error) {
      console.error('Error submitting report:', error);
      // Extract detailed error message
      let errorMessage = t('report.submissionFailedGeneric');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg || e.message).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      setSubmissionError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Voice input toggle
  const handleVoiceInput = () => {
    if (!speechSupported) {
      setSubmissionError(t('report.speechNotSupported'));
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return selectedMedication && formData.dosage && formData.frequency && formData.indication;
      case 1:
        return formData.symptoms && formData.severity;
      case 2:
        return formData.startDate; // Only start date is required for final step
      default:
        return false;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Autocomplete
                  sx={{ flexGrow: 1 }}
                  options={medications}
                  getOptionLabel={(option) => `${option.name}${option.genericName ? ` (${option.genericName})` : ''}`}
                  value={selectedMedication}
                  onChange={handleMedicationSelect}
                  onInputChange={(event, value, reason) => {
                    if (reason === 'input') {
                      searchMedications(value);
                    }
                  }}
                  loading={medicationSearchLoading}
                  filterOptions={(x) => x} // Disable built-in filtering since we handle it server-side
                  noOptionsText={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>{t('report.noMedicationsFound')}</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenNewMedicationDialog}
                      >
                        {t('report.addNewMedication')}
                      </Button>
                    </Box>
                  }
                  loadingText={t('report.searchingMedications')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label={t('report.searchMedication')}
                      placeholder={t('report.searchMedicationPlaceholder')}
                      helperText={validationErrors.medication || t('report.searchMedicationHelper')}
                      error={!!validationErrors.medication}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{option.name}</Typography>
                          {option.source === 'patient' && !option.isVerified && (
                            <Chip label={t('report.unverified')} size="small" color="warning" variant="outlined" />
                          )}
                        </Box>
                        {option.genericName && (
                          <Typography variant="body2" color="text.secondary">
                            {option.genericName}
                          </Typography>
                        )}
                        {option.category && (
                          <Typography variant="caption" color="text.secondary">
                            {t('medications.category')}: {option.category}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenNewMedicationDialog}
                  sx={{ mt: 1, whiteSpace: 'nowrap' }}
                >
                  {t('report.cantFindMedication')}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('report.dosageAmount')}
                value={formData.dosage}
                onChange={handleInputChange('dosage')}
                placeholder={t('report.dosagePlaceholder')}
                helperText={validationErrors.dosage || t('report.dosageHelper')}
                error={!!validationErrors.dosage}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('report.frequency')}
                value={formData.frequency}
                onChange={handleInputChange('frequency')}
                placeholder={t('report.frequencyPlaceholder')}
                helperText={t('report.frequencyHelper')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('report.routeOfAdministration')}</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={formData.route}
                  label={t('report.routeOfAdministration')}
                  onChange={handleInputChange('route')}
                >
                  <MenuItem value="Oral">{t('report.route.oral')}</MenuItem>
                  <MenuItem value="Topical">{t('report.route.topical')}</MenuItem>
                  <MenuItem value="Injection">{t('report.route.injection')}</MenuItem>
                  <MenuItem value="Inhalation">{t('report.route.inhalation')}</MenuItem>
                  <MenuItem value="Other">{t('common.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('report.indication')}
                value={formData.indication}
                onChange={handleInputChange('indication')}
                placeholder={t('report.indicationPlaceholder')}
                helperText={t('report.indicationHelper')}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label={t('report.describeSideEffect')}
                value={formData.symptoms}
                onChange={handleInputChange('symptoms')}
                placeholder={t('report.describeSideEffectPlaceholder')}
                helperText={t('report.describeSideEffectHelper')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('report.severityLevel')}</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={formData.severity}
                  label={t('report.severityLevel')}
                  onChange={handleInputChange('severity')}
                >
                  <MenuItem value="Mild">{t('severity.mild')}</MenuItem>
                  <MenuItem value="Moderate">{t('severity.moderate')}</MenuItem>
                  <MenuItem value="Severe">{t('severity.severe')}</MenuItem>
                  <MenuItem value="Life-threatening">{t('severity.lifeThreatening')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{t('report.whenDidItStart')}</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={formData.onset}
                  label={t('report.whenDidItStart')}
                  onChange={handleInputChange('onset')}
                >
                  <MenuItem value="Immediate">{t('report.onset.immediate')}</MenuItem>
                  <MenuItem value="Within hours">{t('report.onset.withinHours')}</MenuItem>
                  <MenuItem value="Within days">{t('report.onset.withinDays')}</MenuItem>
                  <MenuItem value="Within weeks">{t('report.onset.withinWeeks')}</MenuItem>
                  <MenuItem value="Unknown">{t('common.unknown')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Tooltip title={speechSupported ? (isListening ? t('report.stopRecordingTooltip') : t('report.startRecordingTooltip')) : t('report.speechNotSupportedTooltip')}>
                  <span>
                    <Button
                      variant={isListening ? "contained" : "outlined"}
                      color={isListening ? "error" : "primary"}
                      startIcon={isListening ? <StopIcon /> : <MicIcon />}
                      onClick={handleVoiceInput}
                      disabled={!speechSupported}
                    >
                      {isListening ? t('report.stopRecording') : t('report.recordVoice')}
                    </Button>
                  </span>
                </Tooltip>
                {isListening && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RecordIcon sx={{ color: 'error.main', animation: 'pulse 1s infinite' }} />
                    <Typography variant="body2" color="error">
                      {t('report.listeningNow')}
                    </Typography>
                  </Box>
                )}
                {!speechSupported && (
                  <Typography variant="caption" color="text.secondary">
                    {t('report.useChromeForVoice')}
                  </Typography>
                )}
              </Box>
              {speechError && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {t('report.speechError', { error: speechError })}
                </Alert>
              )}
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="date"
                label={t('report.whenSymptomsStarted')}
                value={formData.startDate}
                onChange={handleInputChange('startDate')}
                InputLabelProps={{ shrink: true }}
                helperText={t('report.whenSymptomsStartedHelper')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('report.additionalInfoOptional')}
                value={formData.additionalInfo}
                onChange={handleInputChange('additionalInfo')}
                placeholder={t('report.additionalInfoPlaceholder')}
                helperText={t('report.additionalInfoHelper')}
              />
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('report.uploadMediaOptional')}
                  </Typography>
                  {formData.photo ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PhotoIcon color="primary" />
                      <Typography>{formData.photo.name}</Typography>
                      <IconButton onClick={handleRemovePhoto} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      {t('report.uploadFiles')}
                      <input
                        hidden
                        accept="image/*,video/*,audio/*"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                      />
                    </Button>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('report.uploadMediaHelper')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="md" className="organic-fade-in">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Alert
            severity="success"
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
            }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              {t('report.reportSubmittedSuccessfully')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {successMessage || t('report.thankYouMessage')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('report.reportId')}: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/reports'}
              sx={{ minWidth: 170 }}
            >
              {t('reports.viewMyReports')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSubmitted(false);
                setActiveStep(0);
                setSelectedMedication(null);
                setSuccessMessage('');
                setValidationErrors({});
                setFormData({
                  medicationName: '',
                  dosage: '',
                  frequency: '',
                  route: 'Oral',
                  indication: '',
                  symptoms: '',
                  severity: 'Mild',
                  onset: 'Within hours',
                  startDate: '',
                  additionalInfo: '',
                  photo: null,
                });
              }}
            >
              {t('report.submitAnotherReport')}
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="organic-fade-in">
      <Box sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4 },
            border: 1,
            borderColor: 'divider',
            borderRadius: { xs: 4, md: 6 },
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(155deg, rgba(14,36,41,0.86) 0%, rgba(18,43,49,0.86) 100%)'
              : 'linear-gradient(155deg, rgba(247,255,253,0.86) 0%, rgba(236,254,255,0.86) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 700 }}>
            {t('reports.submitReport')}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            {t('report.helpKeepMedicationsSafe')}
          </Typography>

          {!isAuthenticated && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('report.mustBeLoggedInToContinue')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  {loading ? t('auth.signingIn') : t('report.quickDemoLogin')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.location.href = '/login'}
                >
                  {t('auth.signIn')}
                </Button>
              </Box>
            </Alert>
          )}

          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 4,
              '& .MuiStepLabel-label': {
                fontWeight: 600,
              },
              '& .MuiStepLabel-label.Mui-active': {
                color: 'primary.main',
              },
            }}
          >
            {steps.map((label, index) => (
              <Step key={label} completed={isStepComplete(index)}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Submission Error Display */}
          {submissionError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmissionError('')}>
              <Typography variant="body2">{submissionError}</Typography>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ borderRadius: 999 }}
              >
                {t('common.back')}
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isStepComplete(activeStep) || loading || !isAuthenticated}
                  startIcon={<SendIcon />}
                  sx={{ borderRadius: 999 }}
                >
                  <ButtonLoading loading={loading} loadingText={t('report.submitting')}>
                    {t('report.submitReport')}
                  </ButtonLoading>
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(activeStep)}
                  sx={{ borderRadius: 999 }}
                >
                  {t('common.next')}
                </Button>
              )}
            </Box>
          </form>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              {t('report.emergencyNotice')}
            </Typography>
          </Alert>
        </Paper>
      </Box>

      {/* New Medication Dialog */}
      <Dialog open={newMedicationDialog} onClose={handleCloseNewMedicationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('report.addNewMedication')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {t('report.addNewMedicationDescription')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label={t('doctor.medicationName')}
                placeholder={t('doctor.medicationNamePlaceholder')}
                value={newMedicationData.name}
                onChange={handleNewMedicationInputChange('name')}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('report.genericNameOptional')}
                placeholder={t('doctor.genericNamePlaceholder')}
                value={newMedicationData.genericName}
                onChange={handleNewMedicationInputChange('genericName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('medications.category')}</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={newMedicationData.category}
                  onChange={handleNewMedicationInputChange('category')}
                  label={t('medications.category')}
                >
                  <MenuItem value="">{t('report.selectCategory')}</MenuItem>
                  {MEDICATION_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('medications.dosageForm')}</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={newMedicationData.dosageForm}
                  onChange={handleNewMedicationInputChange('dosageForm')}
                  label={t('medications.dosageForm')}
                >
                  <MenuItem value="">{t('report.selectForm')}</MenuItem>
                  {MEDICATION_DOSAGE_FORMS.map(form => (
                    <MenuItem key={form} value={form}>{form}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewMedicationDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleCreateNewMedication}
            disabled={!newMedicationData.name.trim() || newMedicationLoading}
          >
            {newMedicationLoading ? t('report.adding') : t('medications.addMedication')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      <Dialog
        open={duplicateWarningOpen}
        onClose={() => { setDuplicateWarningOpen(false); setLoading(false); setPendingReportData(null); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
          <Tooltip title={t('report.possibleDuplicate')}>
            <WarningAmberIcon color="warning" fontSize="small" />
          </Tooltip>
          {t('report.duplicateDetectedTitle')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('report.duplicateDetectedMessage', { count: potentialDuplicates.length })}
          </Alert>
          {potentialDuplicates.slice(0, 3).map((dup, i) => (
            <Box key={i} sx={{ p: 1.5, mb: 1, border: '1px solid', borderColor: 'warning.light', borderRadius: 1, bgcolor: 'warning.50' }}>
              <Typography variant="body2" fontWeight={600}>
                {dup.medicine?.name || t('report.sameMedication')} — {dup.sideEffects?.[0]?.effect || t('report.similarSymptoms')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('report.submittedOn', { date: dup.createdAt ? new Date(dup.createdAt).toLocaleDateString() : t('common.unknownDate') })} •
                {t('report.similarity', { value: dup.similarityScore ? `${Math.round(dup.similarityScore * 100)}%` : t('report.high') })}
              </Typography>
            </Box>
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('report.duplicateDetectedFooter')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setDuplicateWarningOpen(false); setLoading(false); setPendingReportData(null); }}
          >
            {t('report.goBackAndEdit')}
          </Button>
          <Button variant="contained" color="warning" onClick={handleProceedDespiteDuplicates}>
            {t('report.submitAnyway')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}