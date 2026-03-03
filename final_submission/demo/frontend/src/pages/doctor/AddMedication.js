/**
 * Add/Edit Medication Page
 * 
 * Simple form for doctors to add or edit medications that patients can choose
 * when reporting side effects.
 * 
 * Design: Clean, focused, and easy to use - only essential fields
 */

import React, { useState, useEffect } from 'react';
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
  Box,
  Chip,
  Alert,
  IconButton,
  Divider,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  MedicalServices as MedicationIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { medicationService } from '../../services';
import { MEDICATION_CATEGORIES, MEDICATION_DOSAGE_FORMS } from '../../config/constants';
import { ButtonLoading } from '../../components/ui/Loading';

const AddMedication = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get medication ID from URL if editing
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [loadingMedication, setLoadingMedication] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state - simplified for the medication use case
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    dosageForm: '',
    commonStrengths: [''],
    description: '',
    tags: [],
  });

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Load medication data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadMedication();
    }
  }, [isEditMode, id]);

  const loadMedication = async () => {
    setLoadingMedication(true);
    setError('');
    
    try {
      const response = await medicationService.getById(id);
      if (response.success && response.data?.medication) {
        const med = response.data.medication;
        setFormData({
          name: med.name || '',
          genericName: med.genericName || '',
          category: med.category || '',
          dosageForm: med.dosageForm || '',
          commonStrengths: med.commonStrengths?.length > 0 ? med.commonStrengths : [''],
          description: med.description || '',
          tags: med.tags || [],
        });
      } else {
        setError('Failed to load medication data');
      }
    } catch (err) {
      console.error('Load medication error:', err);
      setError('Failed to load medication. It may not exist.');
    } finally {
      setLoadingMedication(false);
    }
  };

  // Handle simple input changes
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Handle strength changes
  const handleStrengthChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      commonStrengths: prev.commonStrengths.map((s, i) => i === index ? value : s),
    }));
  };

  // Add strength field
  const addStrength = () => {
    setFormData(prev => ({
      ...prev,
      commonStrengths: [...prev.commonStrengths, ''],
    }));
  };

  // Remove strength field
  const removeStrength = (index) => {
    setFormData(prev => ({
      ...prev,
      commonStrengths: prev.commonStrengths.filter((_, i) => i !== index),
    }));
  };

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Medication name is required');
      return false;
    }
    if (formData.name.length < 2) {
      setError('Medication name must be at least 2 characters');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Clean up data before submission
      const submitData = {
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || undefined,
        category: formData.category || 'Other',
        dosageForm: formData.dosageForm || undefined,
        commonStrengths: formData.commonStrengths.filter(s => s.trim()),
        description: formData.description.trim() || undefined,
        tags: formData.tags,
      };

      let response;
      if (isEditMode) {
        response = await medicationService.update(id, submitData);
      } else {
        response = await medicationService.create(submitData);
      }

      if (response.success) {
        setSuccess(isEditMode ? 'Medication updated successfully!' : 'Medication created successfully!');
        setTimeout(() => {
          navigate('/medications');
        }, 1500);
      }
    } catch (err) {
      console.error(isEditMode ? 'Update medication error:' : 'Create medication error:', err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} medication. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching medication data
  if (loadingMedication) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading medication...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate('/medications')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        {isEditMode ? (
          <EditIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
        ) : (
          <MedicationIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
        )}
        <Box>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Medication' : 'Add New Medication'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode 
              ? 'Update the medication details below'
              : 'Add a medication that patients can select when reporting side effects'
            }
          </Typography>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        {/* Basic Information Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Medication Name"
                placeholder="e.g., Paracetamol, Lisinopril"
                value={formData.name}
                onChange={handleInputChange('name')}
                helperText="The brand or common name of the medication"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Generic Name"
                placeholder="e.g., Acetaminophen"
                value={formData.genericName}
                onChange={handleInputChange('genericName')}
                helperText="The scientific/generic name (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{minWidth: '220px'}}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  label="Category"
                >
                  <MenuItem value="">Select a category</MenuItem>
                  {MEDICATION_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{minWidth: '220px'}}>
                <InputLabel>Dosage Form</InputLabel>
                <Select
                  value={formData.dosageForm}
                  onChange={handleInputChange('dosageForm')}
                  label="Dosage Form"
                >
                  <MenuItem value="">Select a form</MenuItem>
                  {MEDICATION_DOSAGE_FORMS.map(form => (
                    <MenuItem key={form} value={form}>{form}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Common Strengths Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Common Strengths
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add common dosage strengths (e.g., "500mg", "10mg/5ml")
          </Typography>
          <Grid container spacing={2}>
            {formData.commonStrengths.map((strength, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Strength ${index + 1}`}
                    placeholder="e.g., 500mg"
                    value={strength}
                    onChange={(e) => handleStrengthChange(index, e.target.value)}
                  />
                  {formData.commonStrengths.length > 1 && (
                    <IconButton 
                      color="error" 
                      size="small"
                      onClick={() => removeStrength(index)}
                    >
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
          <Button
            startIcon={<AddIcon />}
            onClick={addStrength}
            size="small"
            sx={{ mt: 2 }}
          >
            Add Another Strength
          </Button>
        </Box>

        {/* Description Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Additional Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            placeholder="Brief description of what this medication is used for..."
            value={formData.description}
            onChange={handleInputChange('description')}
            helperText="Optional: Provide a brief description for patients"
          />
        </Box>

        {/* Tags Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Tags
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField
              label="Add Tag"
              placeholder="Type and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              helperText="Press Enter to add tags for better searchability"
              size="small"
              sx={{ minWidth: 250 }}
            />
            <Button
              variant="outlined"
              onClick={handleAddTag}
              size="medium"
              sx={{ mt: 0.5 }}
            >
              Add
            </Button>
          </Box>
          {formData.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {formData.tags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Preview Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Preview
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" component="div">
                {formData.name || 'Medication Name'}
                {formData.genericName && (
                  <Typography 
                    component="span" 
                    color="text.secondary" 
                    sx={{ ml: 1, fontWeight: 'normal', fontSize: '0.9em' }}
                  >
                    ({formData.genericName})
                  </Typography>
                )}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {formData.category && (
                  <Chip label={formData.category} size="small" color="primary" />
                )}
                {formData.dosageForm && (
                  <Chip label={formData.dosageForm} size="small" variant="outlined" />
                )}
                {formData.commonStrengths.filter(s => s.trim()).map((strength, i) => (
                  <Chip key={i} label={strength} size="small" variant="outlined" />
                ))}
              </Box>
              
              {formData.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {formData.description}
                </Typography>
              )}
              
              {formData.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 2, flexWrap: 'wrap' }}>
                  {formData.tags.map(tag => (
                    <Chip 
                      key={tag} 
                      label={`#${tag}`} 
                      size="small" 
                      sx={{ fontSize: '0.7rem', height: 20 }} 
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Actions */}
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/medications')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? null : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <ButtonLoading /> : (isEditMode ? 'Update Medication' : 'Create Medication')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddMedication;
