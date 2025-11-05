import React, { useState } from "react";
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
  Chip,
  IconButton,
  Snackbar,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Mic as MicIcon,
  Send as SendIcon,
  PhotoCamera as PhotoIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "../../components/ui/Loading";
import { reportService } from "../../services";

const steps = ['Basic Information', 'Describe Symptoms', 'Additional Details'];

const severityLevels = [
  { value: 'mild', label: 'Mild', color: 'success' },
  { value: 'moderate', label: 'Moderate', color: 'warning' },
  { value: 'severe', label: 'Severe', color: 'error' },
];

export default function Report() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    symptoms: '',
    severity: '',
    startDate: '',
    photo: null,
  });

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare report data for API submission
      const reportData = {
        medicine: {
          name: formData.medicationName,
          dosage: formData.dosage,
          administrationRoute: formData.route || 'Oral',
          indication: formData.indication || 'Not specified'
        },
        sideEffects: [{
          effect: formData.symptoms,
          severity: formData.severity,
          onset: formData.onsetTime || 'Not specified',
          duration: formData.duration || 'Ongoing'
        }],
        patientInfo: {
          age: formData.age || null,
          gender: formData.gender || 'Not specified',
          weight: formData.weight || null,
          height: formData.height || null
        },
        medicationUsage: {
          startDate: formData.startDate || new Date().toISOString().split('T')[0],
          dosage: {
            amount: formData.dosage,
            frequency: formData.frequency || 'As needed',
            route: formData.route || 'Oral'
          },
          indication: formData.indication || 'Not specified'
        },
        reportDetails: {
          description: formData.additionalInfo || formData.symptoms,
          reportDate: new Date().toISOString(),
          outcome: 'Ongoing'
        }
      };

      const response = await reportService.submitReport(reportData);
      
      if (response.status === 'success' || response.success) {
        setSubmitted(true);
        console.log('Report submitted successfully:', response);
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      // You could set an error state here if you have one
      alert('Failed to submit report. Please try again.');
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
        return formData.medicationName && formData.dosage;
      case 1:
        return formData.symptoms && formData.severity;
      case 2:
        return formData.startDate;
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
              <TextField
                required
                fullWidth
                label="Medication Name"
                value={formData.medicationName}
                onChange={handleInputChange('medicationName')}
                placeholder="e.g., Aspirin, Ibuprofen"
                helperText="Enter the exact name of the medication"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Dosage"
                value={formData.dosage}
                onChange={handleInputChange('dosage')}
                placeholder="e.g., 200mg twice daily"
                helperText="Include strength and frequency"
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
                label="Describe your symptoms"
                value={formData.symptoms}
                onChange={handleInputChange('symptoms')}
                placeholder="Please describe the side effects you're experiencing in detail..."
                helperText="Be as specific as possible about your symptoms"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Severity Level</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity Level"
                  onChange={handleInputChange('severity')}
                >
                  {severityLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={level.label}
                          color={level.color}
                          size="small"
                        />
                      </Box>
                    </MenuItem>
                  ))}
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
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6">Report Submitted Successfully!</Typography>
            <Typography>
              Thank you for reporting your side effect. A healthcare professional will review your report.
            </Typography>
          </Alert>
          <Button
            variant="outlined"
            onClick={() => {
              setSubmitted(false);
              setActiveStep(0);
              setFormData({
                medicationName: '',
                dosage: '',
                symptoms: '',
                severity: '',
                startDate: '',
                photo: null,
              });
            }}
          >
            Submit Another Report
          </Button>
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
                  disabled={!isStepComplete(activeStep) || loading}
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
