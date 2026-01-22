import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Mic as MicIcon,
  Send as SendIcon,
  PhotoCamera as PhotoIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "../../components/ui/Loading";
import { reportService, medicineService } from "../../services";
import AuthContainer from '../../store/containers/AuthContainer';

const steps = ['Basic Information', 'Describe Symptoms', 'Additional Details'];

export default function Report() {
  const { user, isAuthenticated, login } = AuthContainer.useContainer();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineSearchLoading, setMedicineSearchLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
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

  // Initialize component
  useEffect(() => {
    // Load some default medicines on component mount for better UX
    const initializeMedicines = async () => {
      try {
        // Load popular medicines to show some options initially
        const response = await medicineService.search('a'); // Generic search for common medicines
        if (response.status === 'success' && response.data) {
          setMedicines(response.data.slice(0, 10)); // Show first 10 as initial options
        }
      } catch (error) {
        console.log('Failed to load initial medicines, using fallback');
        // Set some demo medicines as fallback
        setMedicines([
          {
            _id: 'demo-1',
            name: 'Paracetamol',
            genericName: 'Acetaminophen',
            category: 'Analgesic'
          },
          {
            _id: 'demo-2', 
            name: 'Ibuprofen',
            genericName: 'Ibuprofen',
            category: 'NSAID'
          },
          {
            _id: 'demo-3',
            name: 'Aspirin',
            genericName: 'Acetylsalicylic acid',
            category: 'NSAID'
          }
        ]);
      }
    };

    initializeMedicines();
  }, []);

  // Quick demo login function
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await login('patient1@example.com', '1234');
      if (!result.success) {
        // If API login fails, set up demo authentication manually
        const demoUser = {
          _id: 'demo-patient1',
          email: 'patient1@example.com',
          username: 'patient1',
          role: 'patient',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
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

  const searchMedicines = async (searchTerm) => {
    console.log('Searching for medicines with term:', searchTerm); // Debug log
    
    if (!searchTerm || searchTerm.length < 1) {
      // Load some default medicines when search is cleared
      setMedicines([
        {
          _id: 'demo-1',
          name: 'Paracetamol',
          genericName: 'Acetaminophen',
          category: 'Analgesic'
        },
        {
          _id: 'demo-2', 
          name: 'Ibuprofen',
          genericName: 'Ibuprofen',
          category: 'NSAID'
        }
      ]);
      return;
    }
    
    setMedicineSearchLoading(true);
    try {
      const response = await medicineService.search(searchTerm);
      console.log('Medicine search response:', response); // Debug log
      
      if (response.status === 'success' && response.data) {
        setMedicines(response.data);
      } else {
        console.log('No medicines found, setting empty array');
        setMedicines([]);
      }
    } catch (error) {
      console.error('Error searching medicines:', error);
      setMedicines([]);
    } finally {
      setMedicineSearchLoading(false);
    }
  };

  const handleMedicineSelect = (event, value) => {
    setSelectedMedicine(value);
    if (value) {
      setFormData({
        ...formData,
        medicationName: value.name,
      });
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
      if (!selectedMedicine) errors.medicine = 'Please select a medicine';
      if (!formData.dosage.trim()) errors.dosage = 'Please enter the dosage';
      if (!formData.frequency) errors.frequency = 'Please select frequency';
      if (!formData.indication.trim()) errors.indication = 'Please enter what this medicine is for';
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
    
    if (!isAuthenticated || !user) {
      alert('You must be logged in to submit a report.');
      return;
    }
    
    if (!selectedMedicine) {
      alert('Please select a medicine from the search results.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare report data for API submission matching backend schema
      const reportData = {
        reportedBy: user._id, // Required: Reporter user ID
        reporterRole: user.role || 'patient', // Required: Reporter role
        medicine: selectedMedicine._id, // Medicine ObjectId required
        sideEffects: [{
          effect: formData.symptoms,
          severity: formData.severity,
          onset: formData.onset
        }],
        medicationUsage: {
          indication: formData.indication || 'Not specified',
          dosage: {
            amount: formData.dosage,
            frequency: formData.frequency,
            route: formData.route
          },
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString()
        },
        reportDetails: {
          incidentDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
          seriousness: formData.severity === 'Severe' || formData.severity === 'Life-threatening' ? 'Serious' : 'Non-serious',
          outcome: 'Unknown'
        },
        patientInfo: {
          age: user.age || null,
          gender: user.gender || 'other'
        }
      };

      // Add additional info as description if provided
      if (formData.additionalInfo) {
        reportData.sideEffects[0].description = formData.additionalInfo;
      }

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
      alert(`Failed to submit report: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    alert("Voice input feature coming soon! This will allow you to record your symptoms verbally.");
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return selectedMedicine && formData.dosage && formData.frequency && formData.indication;
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
              <Autocomplete
                options={medicines}
                getOptionLabel={(option) => `${option.name} ${option.genericName ? `(${option.genericName})` : ''}`}
                value={selectedMedicine}
                onChange={handleMedicineSelect}
                onInputChange={(event, value, reason) => {
                  console.log('Input change:', value, reason); // Debug log
                  if (reason === 'input') {
                    searchMedicines(value);
                  }
                }}
                loading={medicineSearchLoading}
                filterOptions={(x) => x} // Disable built-in filtering since we handle it server-side
                noOptionsText="Type to search for medicines..."
                loadingText="Searching medicines..."
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Search Medicine"
                    placeholder="Start typing medicine name..."
                    helperText={validationErrors.medicine || "Search and select the medication you are reporting about"}
                    error={!!validationErrors.medicine}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
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
              <Button
                variant="outlined"
                startIcon={<MicIcon />}
                onClick={handleVoiceInput}
                sx={{ mr: 2 }}
              >
                Record Voice Description
              </Button>
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
                setSelectedMedicine(null);
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
    </Container>
  );
}