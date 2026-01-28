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
  Divider,
  Chip,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Send as SendIcon,
  PhotoCamera as PhotoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Stop as StopIcon,
  FiberManualRecord as RecordIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "../../components/ui/Loading";
import { reportService, medicationService } from "../../services";
import { MEDICATION_CATEGORIES, MEDICATION_DOSAGE_FORMS } from "../../config/constants";
import AuthContainer from '../../store/containers/AuthContainer';

const steps = ['Basic Information', 'Describe Symptoms', 'Additional Details'];

// Speech-to-text hook
const useSpeechToText = () => {
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
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
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
  }, []);

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
  const { user, isAuthenticated, login } = AuthContainer.useContainer();
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
  } = useSpeechToText();
  
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
          alert('This medication already exists in our system. We\'ve selected it for you.');
        }
      }
    } catch (error) {
      console.error('Error creating medication:', error);
      alert('Failed to create medication. Please try again.');
    } finally {
      setNewMedicationLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        photo: file,
      });
    }
  };

  const handleRemovePhoto = () => {
    setFormData({
      ...formData,
      photo: null,
    });
  };

  // Form validation
  const validateCurrentStep = () => {
    const errors = {};
    
    if (activeStep === 0) {
      if (!selectedMedication) errors.medication = 'Please select a medication';
      if (!formData.dosage.trim()) errors.dosage = 'Please enter the dosage';
      if (!formData.frequency) errors.frequency = 'Please select frequency';
      if (!formData.indication.trim()) errors.indication = 'Please enter what this medication is for';
    } else if (activeStep === 1) {
      if (!formData.symptoms.trim()) errors.symptoms = 'Please describe your symptoms';
      if (!formData.severity) errors.severity = 'Please select severity level';
    } else if (activeStep === 2) {
      if (!formData.startDate) errors.startDate = 'Please enter start date';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');
    
    if (!isAuthenticated || !user) {
      setSubmissionError('You must be logged in to submit a report.');
      return;
    }
    
    if (!selectedMedication) {
      setSubmissionError('Please select a medication from the list or create a new one.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare report data for API submission matching backend schema
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

      console.log('Submitting report data:', reportData);
      
      const response = await reportService.submitReport(reportData);
      
      if (response.status === 'success' || response.success) {
        setSubmitted(true);
        setSuccessMessage('Your adverse drug reaction report has been submitted successfully. Our medical team will review it shortly.');
        console.log('Report submitted successfully:', response);
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      // Extract detailed error message
      let errorMessage = 'Failed to submit report. Please try again.';
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
      setSubmissionError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
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
                      <Typography variant="body2" sx={{ mb: 1 }}>No medications found</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenNewMedicationDialog}
                      >
                        Add New Medication
                      </Button>
                    </Box>
                  }
                  loadingText="Searching medications..."
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Search Medication"
                      placeholder="Start typing medication name..."
                      helperText={validationErrors.medication || "Search and select the medication you are reporting about"}
                      error={!!validationErrors.medication}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{option.name}</Typography>
                          {option.source === 'patient' && !option.isVerified && (
                            <Chip label="Unverified" size="small" color="warning" variant="outlined" />
                          )}
                        </Box>
                        {option.genericName && (
                          <Typography variant="body2" color="text.secondary">
                            {option.genericName}
                          </Typography>
                        )}
                        {option.category && (
                          <Typography variant="caption" color="text.secondary">
                            Category: {option.category}
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
                  Can't find it?
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Dosage Amount"
                value={formData.dosage}
                onChange={handleInputChange('dosage')}
                placeholder="e.g., 500mg, 1 tablet"
                helperText={validationErrors.dosage || "Strength per dose"}
                error={!!validationErrors.dosage}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Frequency"
                value={formData.frequency}
                onChange={handleInputChange('frequency')}
                placeholder="e.g., twice daily, once a day"
                helperText="How often do you take it"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Route of Administration</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={formData.route}
                  label="Route of Administration"
                  onChange={handleInputChange('route')}
                >
                  <MenuItem value="Oral">Oral (by mouth)</MenuItem>
                  <MenuItem value="Topical">Topical (on skin)</MenuItem>
                  <MenuItem value="Injection">Injection</MenuItem>
                  <MenuItem value="Inhalation">Inhalation</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Indication (what it's for)"
                value={formData.indication}
                onChange={handleInputChange('indication')}
                placeholder="e.g., Pain relief, Blood pressure"
                helperText="Why are you taking this medication"
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
                label="Describe the Side Effect"
                value={formData.symptoms}
                onChange={handleInputChange('symptoms')}
                placeholder="Please describe the side effect you experienced in detail..."
                helperText="Be as specific as possible about what you experienced"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Severity Level</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={formData.severity}
                  label="Severity Level"
                  onChange={handleInputChange('severity')}
                >
                  <MenuItem value="Mild">Mild</MenuItem>
                  <MenuItem value="Moderate">Moderate</MenuItem>
                  <MenuItem value="Severe">Severe</MenuItem>
                  <MenuItem value="Life-threatening">Life-threatening</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>When did it start?</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={formData.onset}
                  label="When did it start?"
                  onChange={handleInputChange('onset')}
                >
                  <MenuItem value="Immediate">Immediately</MenuItem>
                  <MenuItem value="Within hours">Within hours</MenuItem>
                  <MenuItem value="Within days">Within days</MenuItem>
                  <MenuItem value="Within weeks">Within weeks</MenuItem>
                  <MenuItem value="Unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Tooltip title={speechSupported ? (isListening ? 'Click to stop recording' : 'Click to start voice recording') : 'Speech recognition not supported in this browser'}>
                  <span>
                    <Button
                      variant={isListening ? "contained" : "outlined"}
                      color={isListening ? "error" : "primary"}
                      startIcon={isListening ? <StopIcon /> : <MicIcon />}
                      onClick={handleVoiceInput}
                      disabled={!speechSupported}
                    >
                      {isListening ? 'Stop Recording' : 'Record Voice'}
                    </Button>
                  </span>
                </Tooltip>
                {isListening && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RecordIcon sx={{ color: 'error.main', animation: 'pulse 1s infinite' }} />
                    <Typography variant="body2" color="error">
                      Listening... Speak now
                    </Typography>
                  </Box>
                )}
                {!speechSupported && (
                  <Typography variant="caption" color="text.secondary">
                    (Use Chrome or Edge for voice input)
                  </Typography>
                )}
              </Box>
              {speechError && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Speech error: {speechError}. Please try again.
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
                label="When did symptoms start?"
                value={formData.startDate}
                onChange={handleInputChange('startDate')}
                InputLabelProps={{ shrink: true }}
                helperText="Select the date when you first noticed the symptoms"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Information (Optional)"
                value={formData.additionalInfo}
                onChange={handleInputChange('additionalInfo')}
                placeholder="Any additional details about the side effect..."
                helperText="Include any other relevant information"
              />
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload Photo (Optional)
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
                      Upload Photo
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleFileUpload}
                      />
                    </Button>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    You can upload a photo of any visible symptoms or reactions
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
      <Container maxWidth="md">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3, p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              Report Submitted Successfully! ✅
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {successMessage || 'Thank you for reporting your side effect. A healthcare professional will review your report.'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Report ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/reports'}
              sx={{ minWidth: 150 }}
            >
              View My Reports
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
              Submit Another Report
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Report Side Effect
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Help us keep medications safe by reporting any adverse reactions
          </Typography>

          {!isAuthenticated && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You must be logged in to submit a report. Please log in to continue.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Quick Demo Login'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.location.href = '/login'}
                >
                  Full Login
                </Button>
              </Box>
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
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
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isStepComplete(activeStep) || loading || !isAuthenticated}
                  startIcon={<SendIcon />}
                >
                  <ButtonLoading loading={loading} loadingText="Submitting...">
                    Submit Report
                  </ButtonLoading>
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepComplete(activeStep)}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Emergency Notice:</strong> If you're experiencing severe or life-threatening symptoms, 
              seek immediate medical attention or call emergency services.
            </Typography>
          </Alert>
        </Paper>
      </Box>

      {/* New Medication Dialog */}
      <Dialog open={newMedicationDialog} onClose={handleCloseNewMedicationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Medication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Can't find your medication? Add it here and it will be available for your report.
            A healthcare professional will verify it later.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Medication Name"
                placeholder="e.g., Paracetamol, Lisinopril"
                value={newMedicationData.name}
                onChange={handleNewMedicationInputChange('name')}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Generic Name (Optional)"
                placeholder="e.g., Acetaminophen"
                value={newMedicationData.genericName}
                onChange={handleNewMedicationInputChange('genericName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={newMedicationData.category}
                  onChange={handleNewMedicationInputChange('category')}
                  label="Category"
                >
                  <MenuItem value="">Select category</MenuItem>
                  {MEDICATION_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Dosage Form</InputLabel>
                <Select
                  sx={{minWidth: '220px'}}
                  value={newMedicationData.dosageForm}
                  onChange={handleNewMedicationInputChange('dosageForm')}
                  label="Dosage Form"
                >
                  <MenuItem value="">Select form</MenuItem>
                  {MEDICATION_DOSAGE_FORMS.map(form => (
                    <MenuItem key={form} value={form}>{form}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewMedicationDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateNewMedication}
            disabled={!newMedicationData.name.trim() || newMedicationLoading}
          >
            {newMedicationLoading ? 'Adding...' : 'Add Medication'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}