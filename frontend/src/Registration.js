import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  MedicalServices as MedicalIcon,
  ContactEmergency as EmergencyIcon,
  Business as BusinessIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "./components/Loading";
import authService from "./services/authService";

const steps = ['Personal Info', 'Contact Details', 'Role Specific', 'Review & Submit'];

const roleOptions = [
  { value: 'patient', label: 'Patient', icon: '🤒', description: 'Report side effects and manage health' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', description: 'Review reports and manage patients' },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genderOptions = ['male', 'female', 'other'];

export default function Registration({ onSuccess, onBackToLogin }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    
    // Address
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    
    // Role
    role: 'patient',
    
    // Patient Info
    patientInfo: {
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      bloodGroup: '',
      allergies: [],
      chronicConditions: [],
    },
    
    // Doctor Info
    doctorInfo: {
      licenseNumber: '',
      specialization: '',
      yearsOfExperience: '',
      consultationFee: '',
      hospitalAffiliation: '',
    },
  });

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    
    if (field.includes('.')) {
      const [parent, child, subchild] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: subchild ? {
            ...prev[parent][child],
            [subchild]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Add/remove items from arrays (allergies, conditions)
  const handleArrayField = (field, action, value = '') => {
    if (action === 'add' && value.trim()) {
      setFormData(prev => ({
        ...prev,
        patientInfo: {
          ...prev.patientInfo,
          [field]: [...prev.patientInfo[field], value.trim()]
        }
      }));
    } else if (action === 'remove') {
      setFormData(prev => ({
        ...prev,
        patientInfo: {
          ...prev.patientInfo,
          [field]: prev.patientInfo[field].filter((_, index) => index !== value)
        }
      }));
    }
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        break;
        
      case 1: // Contact Details
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
        if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
        if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
        if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = 'ZIP code is required';
        break;
        
      case 2: // Role Specific
        if (formData.role === 'patient') {
          if (!formData.patientInfo.emergencyContact.name.trim()) {
            newErrors['patientInfo.emergencyContact.name'] = 'Emergency contact name is required';
          }
          if (!formData.patientInfo.emergencyContact.phone.trim()) {
            newErrors['patientInfo.emergencyContact.phone'] = 'Emergency contact phone is required';
          }
          if (!formData.patientInfo.bloodGroup) {
            newErrors['patientInfo.bloodGroup'] = 'Blood group is required';
          }
        } else if (formData.role === 'doctor') {
          if (!formData.doctorInfo.licenseNumber.trim()) {
            newErrors['doctorInfo.licenseNumber'] = 'License number is required';
          }
          if (!formData.doctorInfo.specialization.trim()) {
            newErrors['doctorInfo.specialization'] = 'Specialization is required';
          }
          if (!formData.doctorInfo.yearsOfExperience) {
            newErrors['doctorInfo.yearsOfExperience'] = 'Years of experience is required';
          }
          if (!formData.doctorInfo.consultationFee) {
            newErrors['doctorInfo.consultationFee'] = 'Consultation fee is required';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    
    try {
      // Prepare data for API
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        role: formData.role,
      };

      // Add role-specific data
      if (formData.role === 'patient') {
        registrationData.patientInfo = formData.patientInfo;
      } else if (formData.role === 'doctor') {
        registrationData.doctorInfo = {
          ...formData.doctorInfo,
          yearsOfExperience: parseInt(formData.doctorInfo.yearsOfExperience),
          consultationFee: parseFloat(formData.doctorInfo.consultationFee),
        };
      }

      const result = await authService.signup(registrationData);
      
      if (result.success) {
        onSuccess && onSuccess(result);
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="password"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChange={handleInputChange('dateOfBirth')}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  label="Gender"
                  onChange={handleInputChange('gender')}
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={handleInputChange('address.street')}
                error={!!errors['address.street']}
                helperText={errors['address.street']}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={handleInputChange('address.city')}
                error={!!errors['address.city']}
                helperText={errors['address.city']}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                required
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={handleInputChange('address.state')}
                error={!!errors['address.state']}
                helperText={errors['address.state']}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                required
                fullWidth
                label="ZIP Code"
                value={formData.address.zipCode}
                onChange={handleInputChange('address.zipCode')}
                error={!!errors['address.zipCode']}
                helperText={errors['address.zipCode']}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your Role
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {roleOptions.map((role) => (
                <Grid item xs={12} sm={6} key={role.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.role === role.value ? 2 : 1,
                      borderColor: formData.role === role.value ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.light' }
                    }}
                    onClick={() => handleInputChange('role')({ target: { value: role.value } })}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>{role.icon}</Typography>
                      <Typography variant="h6" gutterBottom>{role.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {formData.role === 'patient' && (
              <Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Patient Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Emergency Contact Name"
                      value={formData.patientInfo.emergencyContact.name}
                      onChange={handleInputChange('patientInfo.emergencyContact.name')}
                      error={!!errors['patientInfo.emergencyContact.name']}
                      helperText={errors['patientInfo.emergencyContact.name']}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmergencyIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Emergency Contact Phone"
                      value={formData.patientInfo.emergencyContact.phone}
                      onChange={handleInputChange('patientInfo.emergencyContact.phone')}
                      error={!!errors['patientInfo.emergencyContact.phone']}
                      helperText={errors['patientInfo.emergencyContact.phone']}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      value={formData.patientInfo.emergencyContact.relationship}
                      onChange={handleInputChange('patientInfo.emergencyContact.relationship')}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors['patientInfo.bloodGroup']}>
                      <InputLabel>Blood Group</InputLabel>
                      <Select
                        value={formData.patientInfo.bloodGroup}
                        label="Blood Group"
                        onChange={handleInputChange('patientInfo.bloodGroup')}
                      >
                        {bloodGroups.map((group) => (
                          <MenuItem key={group} value={group}>{group}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {formData.role === 'doctor' && (
              <Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Doctor Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Medical License Number"
                      value={formData.doctorInfo.licenseNumber}
                      onChange={handleInputChange('doctorInfo.licenseNumber')}
                      error={!!errors['doctorInfo.licenseNumber']}
                      helperText={errors['doctorInfo.licenseNumber']}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MedicalIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Specialization"
                      value={formData.doctorInfo.specialization}
                      onChange={handleInputChange('doctorInfo.specialization')}
                      error={!!errors['doctorInfo.specialization']}
                      helperText={errors['doctorInfo.specialization']}
                      placeholder="e.g., Cardiology, Neurology"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      type="number"
                      label="Years of Experience"
                      value={formData.doctorInfo.yearsOfExperience}
                      onChange={handleInputChange('doctorInfo.yearsOfExperience')}
                      error={!!errors['doctorInfo.yearsOfExperience']}
                      helperText={errors['doctorInfo.yearsOfExperience']}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      type="number"
                      label="Consultation Fee ($)"
                      value={formData.doctorInfo.consultationFee}
                      onChange={handleInputChange('doctorInfo.consultationFee')}
                      error={!!errors['doctorInfo.consultationFee']}
                      helperText={errors['doctorInfo.consultationFee']}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hospital Affiliation (Optional)"
                      value={formData.doctorInfo.hospitalAffiliation}
                      onChange={handleInputChange('doctorInfo.hospitalAffiliation')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom align="center">
              Review Your Information
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Personal Information
              </Typography>
              <Typography>Name: {formData.firstName} {formData.lastName}</Typography>
              <Typography>Email: {formData.email}</Typography>
              <Typography>Phone: {formData.phone}</Typography>
              <Typography>Date of Birth: {formData.dateOfBirth}</Typography>
              <Typography>Gender: {formData.gender}</Typography>
            </Card>
            
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Address
              </Typography>
              <Typography>
                {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.zipCode}
              </Typography>
            </Card>
            
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Role: {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
              </Typography>
              {formData.role === 'patient' && (
                <Box>
                  <Typography>Emergency Contact: {formData.patientInfo.emergencyContact.name}</Typography>
                  <Typography>Blood Group: {formData.patientInfo.bloodGroup}</Typography>
                </Box>
              )}
              {formData.role === 'doctor' && (
                <Box>
                  <Typography>License: {formData.doctorInfo.licenseNumber}</Typography>
                  <Typography>Specialization: {formData.doctorInfo.specialization}</Typography>
                  <Typography>Experience: {formData.doctorInfo.yearsOfExperience} years</Typography>
                </Box>
              )}
            </Card>
            
            {errors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.submit}
              </Alert>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={onBackToLogin} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="600">
              Create Account
            </Typography>
          </Box>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<CheckIcon />}
              >
                <ButtonLoading loading={loading} loadingText="Creating Account...">
                  Create Account
                </ButtonLoading>
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}