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
  Card,
  CardContent,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  alpha,
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
import { ButtonLoading } from "../../components/ui/Loading";
import authService from "../../services/authService";
import { useI18n } from "../../i18n";

const roleOptions = [
  { value: 'patient', icon: <PersonIcon fontSize="large" /> },
  { value: 'doctor', icon: <MedicalIcon fontSize="large" /> },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genderOptions = ['male', 'female', 'other'];

export default function Registration({ onSuccess, onBackToLogin }) {
  const theme = useTheme();
  const { t } = useI18n();
  const steps = [
    t('auth.registration.steps.personalInfo'),
    t('auth.registration.steps.contactDetails'),
    t('auth.registration.steps.roleSpecific'),
    t('auth.registration.steps.reviewAndSubmit'),
  ];
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

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = t('auth.registration.validation.firstNameRequired');
        if (!formData.lastName.trim()) newErrors.lastName = t('auth.registration.validation.lastNameRequired');
        if (!formData.email.trim()) newErrors.email = t('auth.registration.validation.emailRequired');
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('auth.registration.validation.invalidEmail');
        if (!formData.password) newErrors.password = t('auth.registration.validation.passwordRequired');
        else if (formData.password.length < 6) newErrors.password = t('auth.registration.validation.passwordMinLength');
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password = t('auth.registration.validation.passwordComplexity');
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = t('auth.registration.validation.passwordMismatch');
        }
        if (!formData.dateOfBirth) newErrors.dateOfBirth = t('auth.registration.validation.dobRequired');
        if (!formData.gender) newErrors.gender = t('auth.registration.validation.genderRequired');
        break;
        
      case 1: // Contact Details
        if (!formData.phone.trim()) newErrors.phone = t('auth.registration.validation.phoneRequired');
        if (!formData.address.street.trim()) newErrors['address.street'] = t('auth.registration.validation.streetRequired');
        if (!formData.address.city.trim()) newErrors['address.city'] = t('auth.registration.validation.cityRequired');
        if (!formData.address.state.trim()) newErrors['address.state'] = t('auth.registration.validation.stateRequired');
        if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = t('auth.registration.validation.zipRequired');
        break;
        
      case 2: // Role Specific
        if (formData.role === 'patient') {
          if (!formData.patientInfo.emergencyContact.name.trim()) {
            newErrors['patientInfo.emergencyContact.name'] = t('auth.registration.validation.emergencyNameRequired');
          }
          if (!formData.patientInfo.emergencyContact.phone.trim()) {
            newErrors['patientInfo.emergencyContact.phone'] = t('auth.registration.validation.emergencyPhoneRequired');
          }
          if (!formData.patientInfo.bloodGroup) {
            newErrors['patientInfo.bloodGroup'] = t('auth.registration.validation.bloodGroupRequired');
          }
        } else if (formData.role === 'doctor') {
          if (!formData.doctorInfo.licenseNumber.trim()) {
            newErrors['doctorInfo.licenseNumber'] = t('auth.registration.validation.licenseRequired');
          }
          if (!formData.doctorInfo.specialization.trim()) {
            newErrors['doctorInfo.specialization'] = t('auth.registration.validation.specializationRequired');
          }
          if (!formData.doctorInfo.yearsOfExperience) {
            newErrors['doctorInfo.yearsOfExperience'] = t('auth.registration.validation.experienceRequired');
          }
          if (!formData.doctorInfo.consultationFee) {
            newErrors['doctorInfo.consultationFee'] = t('auth.registration.validation.consultationFeeRequired');
          }
        }
        break;

      default:
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
      setErrors({ submit: t('auth.registration.validation.submitFailed') });
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
                label={t('auth.registration.firstName')}
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
                label={t('auth.registration.lastName')}
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
                label={t('auth.registration.emailAddress')}
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
                label={t('auth.password')}
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
                label={t('auth.registration.confirmPassword')}
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
                label={t('auth.registration.dateOfBirth')}
                value={formData.dateOfBirth}
                onChange={handleInputChange('dateOfBirth')}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel>{t('auth.registration.gender')}</InputLabel>
                <Select
                  value={formData.gender}
                  label={t('auth.registration.gender')}
                  onChange={handleInputChange('gender')}
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {t(`auth.registration.genderOptions.${option}`)}
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
                label={t('auth.registration.phoneNumber')}
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
                label={t('auth.registration.streetAddress')}
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
                label={t('auth.registration.city')}
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
                label={t('auth.registration.state')}
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
                label={t('auth.registration.zipCode')}
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
              {t('auth.registration.selectRole')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {roleOptions.map((role) => (
                <Grid item xs={12} sm={6} key={role.value}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.role === role.value ? 2 : 1,
                      borderColor: formData.role === role.value ? 'primary.main' : 'divider',
                      borderRadius: '16px',
                      backgroundColor: formData.role === role.value
                        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.1)
                        : alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.24 : 0.74),
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.14),
                      }
                    }}
                    onClick={() => handleInputChange('role')({ target: { value: role.value } })}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box
                        sx={{
                          mb: 1,
                          display: 'inline-flex',
                          p: 1.1,
                          borderRadius: '40% 60% 62% 38% / 44% 42% 58% 56%',
                          color: 'primary.main',
                          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
                        }}
                      >
                        {role.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom>{t(`auth.registration.roles.${role.value}`)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(`auth.registration.roleDescriptions.${role.value}`)}
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
                  {t('auth.registration.patientInformation')}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label={t('auth.registration.emergencyContactName')}
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
                      label={t('auth.registration.emergencyContactPhone')}
                      value={formData.patientInfo.emergencyContact.phone}
                      onChange={handleInputChange('patientInfo.emergencyContact.phone')}
                      error={!!errors['patientInfo.emergencyContact.phone']}
                      helperText={errors['patientInfo.emergencyContact.phone']}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('auth.registration.relationship')}
                      value={formData.patientInfo.emergencyContact.relationship}
                      onChange={handleInputChange('patientInfo.emergencyContact.relationship')}
                      placeholder={t('auth.registration.relationshipPlaceholder')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors['patientInfo.bloodGroup']}>
                      <InputLabel>{t('auth.registration.bloodGroup')}</InputLabel>
                      <Select
                        value={formData.patientInfo.bloodGroup}
                        label={t('auth.registration.bloodGroup')}
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
                  {t('auth.registration.doctorInformation')}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label={t('auth.registration.medicalLicenseNumber')}
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
                      label={t('auth.registration.specialization')}
                      value={formData.doctorInfo.specialization}
                      onChange={handleInputChange('doctorInfo.specialization')}
                      error={!!errors['doctorInfo.specialization']}
                      helperText={errors['doctorInfo.specialization']}
                      placeholder={t('auth.registration.specializationPlaceholder')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      type="number"
                      label={t('auth.registration.yearsOfExperience')}
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
                      label={t('auth.registration.consultationFee')}
                      value={formData.doctorInfo.consultationFee}
                      onChange={handleInputChange('doctorInfo.consultationFee')}
                      error={!!errors['doctorInfo.consultationFee']}
                      helperText={errors['doctorInfo.consultationFee']}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('auth.registration.hospitalAffiliationOptional')}
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
              {t('auth.registration.reviewInformation')}
            </Typography>
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {t('auth.registration.personalInformation')}
              </Typography>
              <Typography>{t('auth.registration.summary.name', { firstName: formData.firstName, lastName: formData.lastName })}</Typography>
              <Typography>{t('auth.registration.summary.email', { value: formData.email })}</Typography>
              <Typography>{t('auth.registration.summary.phone', { value: formData.phone })}</Typography>
              <Typography>{t('auth.registration.summary.dob', { value: formData.dateOfBirth })}</Typography>
              <Typography>{t('auth.registration.summary.gender', { value: formData.gender })}</Typography>
            </Card>
            
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {t('auth.registration.address')}
              </Typography>
              <Typography>
                {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.zipCode}
              </Typography>
            </Card>
            
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {t('auth.registration.summary.role', { value: t(`auth.registration.roles.${formData.role}`) })}
              </Typography>
              {formData.role === 'patient' && (
                <Box>
                  <Typography>{t('auth.registration.summary.emergencyContact', { value: formData.patientInfo.emergencyContact.name })}</Typography>
                  <Typography>{t('auth.registration.summary.bloodGroup', { value: formData.patientInfo.bloodGroup })}</Typography>
                </Box>
              )}
              {formData.role === 'doctor' && (
                <Box>
                  <Typography>{t('auth.registration.summary.license', { value: formData.doctorInfo.licenseNumber })}</Typography>
                  <Typography>{t('auth.registration.summary.specialization', { value: formData.doctorInfo.specialization })}</Typography>
                  <Typography>{t('auth.registration.summary.experience', { years: formData.doctorInfo.yearsOfExperience })}</Typography>
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
    <Container component="main" maxWidth="lg" sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ py: 5, position: 'relative' }}>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: { xs: 180, md: 260 },
            height: { xs: 180, md: 260 },
            right: { xs: -70, md: -110 },
            top: { xs: 22, md: 8 },
            borderRadius: '36% 64% 60% 40% / 45% 37% 63% 55%',
            background: 'linear-gradient(140deg, rgba(34, 211, 238, 0.2), rgba(5, 150, 105, 0.14))',
            zIndex: 0,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: { xs: 170, md: 240 },
            height: { xs: 170, md: 240 },
            left: { xs: -76, md: -104 },
            bottom: { xs: -36, md: -42 },
            borderRadius: '58% 42% 43% 57% / 48% 62% 38% 52%',
            background: 'linear-gradient(140deg, rgba(8, 145, 178, 0.16), rgba(34, 211, 238, 0.18))',
            zIndex: 0,
          }}
        />

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 4.2 },
            borderRadius: { xs: 3, md: 4 },
            border: 1,
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 36, 41, 0.72)' : 'rgba(247, 255, 253, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={onBackToLogin} sx={{ mr: 2, border: 1, borderColor: 'divider', borderRadius: 999 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="700">
              {t('auth.createAccount')}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('auth.registration.intro')}
          </Typography>

          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 4,
              '& .MuiStepConnector-line': {
                borderColor: alpha(theme.palette.primary.main, 0.28),
              },
              '& .MuiStepIcon-root': {
                color: alpha(theme.palette.primary.main, 0.22),
              },
              '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': {
                color: 'primary.main',
              },
              '& .MuiStepLabel-label': {
                fontWeight: 600,
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 420 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
              sx={{ borderRadius: 999 }}
            >
              {t('common.back')}
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<CheckIcon />}
                sx={{ borderRadius: 999 }}
              >
                <ButtonLoading loading={loading} loadingText={t('auth.registration.creatingAccount')}>
                  {t('auth.createAccount')}
                </ButtonLoading>
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ForwardIcon />}
                sx={{ fontWeight: 650, borderRadius: 999 }}
              >
                {t('common.next')}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}