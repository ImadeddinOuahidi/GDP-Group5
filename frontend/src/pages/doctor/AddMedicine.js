import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  MedicalServices as MedicineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { medicineService } from '../../services';
import { useAuth } from '../../hooks';
import {
  MEDICINE_CATEGORIES,
  DOSAGE_FORMS,
  ADMINISTRATION_ROUTES,
  STRENGTH_UNITS,
  SEVERITY_LEVELS,
} from '../../config/constants';
import { ButtonLoading } from '../../components/ui/Loading';

const steps = ['Basic Information', 'Medical Details', 'Pricing & Stock', 'Review & Submit'];

const AddMedicine = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    genericName: '',
    brandName: '',
    manufacturer: {
      name: '',
      country: '',
      licenseNumber: '',
    },
    category: '',
    therapeuticClass: '',
    drugClass: '',
    dosageForm: '',
    strength: {
      value: '',
      unit: 'mg',
    },
    route: [],
    prescriptionRequired: true,

    // Medical Information
    indications: [{ condition: '', description: '' }],
    contraindications: [{ condition: '', severity: 'Absolute', description: '' }],
    knownSideEffects: [{ effect: '', severity: 'Mild', description: '' }],

    // Pricing & Stock
    pricing: {
      wholesalePrice: '',
      retailPrice: '',
    },
    availability: {
      quantity: '',
      minimumStock: '',
      inStock: true,
    },
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleArrayFieldChange = (arrayName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addArrayField = (arrayName, defaultObject) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultObject],
    }));
  };

  const removeArrayField = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const handleRouteChange = (route) => {
    setFormData(prev => ({
      ...prev,
      route: prev.route.includes(route)
        ? prev.route.filter(r => r !== route)
        : [...prev.route, route],
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Clean up the data before submission
      const submitData = {
        ...formData,
        strength: {
          value: parseFloat(formData.strength.value),
          unit: formData.strength.unit,
        },
        pricing: {
          wholesalePrice: formData.pricing.wholesalePrice ? parseFloat(formData.pricing.wholesalePrice) : undefined,
          retailPrice: formData.pricing.retailPrice ? parseFloat(formData.pricing.retailPrice) : undefined,
        },
        availability: {
          quantity: formData.availability.quantity ? parseInt(formData.availability.quantity) : undefined,
          minimumStock: formData.availability.minimumStock ? parseInt(formData.availability.minimumStock) : undefined,
          inStock: formData.availability.inStock,
        },
        // Remove empty fields
        indications: formData.indications.filter(ind => ind.condition.trim()),
        contraindications: formData.contraindications.filter(con => con.condition.trim()),
        knownSideEffects: formData.knownSideEffects.filter(effect => effect.effect.trim()),
      };

      const response = await medicineService.createMedicine(submitData);
      
      if (response.success) {
        setSuccess('Medicine created successfully!');
        setTimeout(() => {
          navigate('/doctor-home'); // Navigate back to doctor dashboard
        }, 2000);
      }
    } catch (err) {
      console.error('Create medicine error:', err);
      setError(err.message || 'Failed to create medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Medicine Name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          required
          helperText="Brand or trade name of the medicine"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Generic Name"
          value={formData.genericName}
          onChange={(e) => handleInputChange('genericName', e.target.value)}
          required
          helperText="Active ingredient or generic name"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Brand Name (Optional)"
          value={formData.brandName}
          onChange={(e) => handleInputChange('brandName', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            label="Category"
          >
            {MEDICINE_CATEGORIES.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Manufacturer Information */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Manufacturer Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Manufacturer Name"
          value={formData.manufacturer.name}
          onChange={(e) => handleInputChange('manufacturer.name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Country"
          value={formData.manufacturer.country}
          onChange={(e) => handleInputChange('manufacturer.country', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="License Number"
          value={formData.manufacturer.licenseNumber}
          onChange={(e) => handleInputChange('manufacturer.licenseNumber', e.target.value)}
          required
        />
      </Grid>

      {/* Drug Classification */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Classification
        </Typography>
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Therapeutic Class"
          value={formData.therapeuticClass}
          onChange={(e) => handleInputChange('therapeuticClass', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Drug Class"
          value={formData.drugClass}
          onChange={(e) => handleInputChange('drugClass', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth required>
          <InputLabel>Dosage Form</InputLabel>
          <Select
            value={formData.dosageForm}
            onChange={(e) => handleInputChange('dosageForm', e.target.value)}
            label="Dosage Form"
          >
            {DOSAGE_FORMS.map(form => (
              <MenuItem key={form} value={form}>{form}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Strength */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Strength
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Strength Value"
          type="number"
          value={formData.strength.value}
          onChange={(e) => handleInputChange('strength.value', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Unit</InputLabel>
          <Select
            value={formData.strength.unit}
            onChange={(e) => handleInputChange('strength.unit', e.target.value)}
            label="Unit"
          >
            {STRENGTH_UNITS.map(unit => (
              <MenuItem key={unit} value={unit}>{unit}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Route of Administration */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Route of Administration
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {ADMINISTRATION_ROUTES.map(route => (
            <Chip
              key={route}
              label={route}
              onClick={() => handleRouteChange(route)}
              color={formData.route.includes(route) ? 'primary' : 'default'}
              variant={formData.route.includes(route) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Grid>

      {/* Prescription Required */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.prescriptionRequired}
              onChange={(e) => handleInputChange('prescriptionRequired', e.target.checked)}
            />
          }
          label="Prescription Required"
        />
      </Grid>
    </Grid>
  );

  const renderMedicalDetails = () => (
    <Grid container spacing={3}>
      {/* Indications */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Indications
        </Typography>
        {formData.indications.map((indication, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">Indication {index + 1}</Typography>
                {formData.indications.length > 1 && (
                  <IconButton 
                    color="error" 
                    onClick={() => removeArrayField('indications', index)}
                  >
                    <RemoveIcon />
                  </IconButton>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Condition"
                    value={indication.condition}
                    onChange={(e) => handleArrayFieldChange('indications', index, 'condition', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={indication.description}
                    onChange={(e) => handleArrayFieldChange('indications', index, 'description', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() => addArrayField('indications', { condition: '', description: '' })}
          variant="outlined"
        >
          Add Indication
        </Button>
      </Grid>

      {/* Known Side Effects */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Known Side Effects
        </Typography>
        {formData.knownSideEffects.map((sideEffect, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">Side Effect {index + 1}</Typography>
                {formData.knownSideEffects.length > 1 && (
                  <IconButton 
                    color="error" 
                    onClick={() => removeArrayField('knownSideEffects', index)}
                  >
                    <RemoveIcon />
                  </IconButton>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Side Effect"
                    value={sideEffect.effect}
                    onChange={(e) => handleArrayFieldChange('knownSideEffects', index, 'effect', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Severity</InputLabel>
                    <Select
                      value={sideEffect.severity}
                      onChange={(e) => handleArrayFieldChange('knownSideEffects', index, 'severity', e.target.value)}
                      label="Severity"
                    >
                      {SEVERITY_LEVELS.map(level => (
                        <MenuItem key={level} value={level}>{level}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={sideEffect.description}
                    onChange={(e) => handleArrayFieldChange('knownSideEffects', index, 'description', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() => addArrayField('knownSideEffects', { effect: '', severity: 'Mild', description: '' })}
          variant="outlined"
        >
          Add Side Effect
        </Button>
      </Grid>
    </Grid>
  );

  const renderPricingStock = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Pricing Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Wholesale Price"
          type="number"
          value={formData.pricing.wholesalePrice}
          onChange={(e) => handleInputChange('pricing.wholesalePrice', e.target.value)}
          InputProps={{
            startAdornment: '$',
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Retail Price"
          type="number"
          value={formData.pricing.retailPrice}
          onChange={(e) => handleInputChange('pricing.retailPrice', e.target.value)}
          InputProps={{
            startAdornment: '$',
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Stock Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Current Quantity"
          type="number"
          value={formData.availability.quantity}
          onChange={(e) => handleInputChange('availability.quantity', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Minimum Stock Level"
          type="number"
          value={formData.availability.minimumStock}
          onChange={(e) => handleInputChange('availability.minimumStock', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.availability.inStock}
              onChange={(e) => handleInputChange('availability.inStock', e.target.checked)}
            />
          }
          label="Currently In Stock"
        />
      </Grid>
    </Grid>
  );

  const renderReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Review Medicine Information
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Basic Information</strong>
          </Typography>
          <Typography>Name: {formData.name}</Typography>
          <Typography>Generic Name: {formData.genericName}</Typography>
          <Typography>Category: {formData.category}</Typography>
          <Typography>Dosage Form: {formData.dosageForm}</Typography>
          <Typography>Strength: {formData.strength.value} {formData.strength.unit}</Typography>
          <Typography>Route: {formData.route.join(', ')}</Typography>
          <Typography>Prescription Required: {formData.prescriptionRequired ? 'Yes' : 'No'}</Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            <strong>Manufacturer</strong>
          </Typography>
          <Typography>Name: {formData.manufacturer.name}</Typography>
          <Typography>Country: {formData.manufacturer.country}</Typography>
          <Typography>License: {formData.manufacturer.licenseNumber}</Typography>
          
          {formData.pricing.retailPrice && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                <strong>Pricing</strong>
              </Typography>
              <Typography>Retail Price: ${formData.pricing.retailPrice}</Typography>
            </>
          )}
          
          {formData.availability.quantity && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                <strong>Stock</strong>
              </Typography>
              <Typography>Quantity: {formData.availability.quantity}</Typography>
              <Typography>Minimum Stock: {formData.availability.minimumStock}</Typography>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderMedicalDetails();
      case 2:
        return renderPricingStock();
      case 3:
        return renderReview();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/doctor-home')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <MedicineIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Add New Medicine
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <ButtonLoading
                loading={loading}
                loadingText="Creating Medicine..."
                onClick={handleSubmit}
                variant="contained"
                startIcon={<SaveIcon />}
              >
                Create Medicine
              </ButtonLoading>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddMedicine;