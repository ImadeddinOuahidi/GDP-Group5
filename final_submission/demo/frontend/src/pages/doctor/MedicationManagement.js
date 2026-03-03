/**
 * Medication Management Page
 * 
 * Doctor/Admin dashboard for managing medications that patients can use
 * when reporting side effects.
 * 
 * Features:
 * - View all medications (predefined and patient-created)
 * - Add new medications for patients to choose from
 * - Verify patient-created medications
 * - Filter and search medications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MedicalServices as MedicationIcon,
  CheckCircle as VerifyIcon,
  Refresh as RefreshIcon,
  Person as PatientIcon,
  LocalHospital as DoctorIcon,
  Warning as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { medicationService } from '../../services';
import { useAuth } from '../../hooks';
import { MEDICATION_CATEGORIES } from '../../config/constants';
import { InlineLoading } from '../../components/ui/Loading';

// Tab panel component
function TabPanel({ children, value, index, ...props }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medication-tabpanel-${index}`}
      aria-labelledby={`medication-tab-${index}`}
      {...props}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    medicationId: null,
    medicationName: '',
  });
  const [verifyDialog, setVerifyDialog] = useState({
    open: false,
    medicationId: null,
    medicationName: '',
  });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    predefined: 0,
    patientCreated: 0,
    pendingVerification: 0,
  });

  // Load medications
  const loadMedications = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      };
      
      // If on "Pending Verification" tab
      if (tabValue === 1) {
        const response = await medicationService.getUnverified(params);
        if (response.success) {
          setMedications(response.data.medications);
          setTotalItems(response.data.pagination?.totalItems || response.data.medications.length);
        }
      } else {
        const response = await medicationService.getAll(params);
        if (response.success) {
          setMedications(response.data.medications);
          setTotalItems(response.data.pagination?.totalItems || 0);
        }
      }
    } catch (err) {
      console.error('Load medications error:', err);
      setError('Failed to load medications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, categoryFilter, sourceFilter, tabValue]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await medicationService.getStats();
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  }, []);

  // Handle delete medication
  const handleDeleteMedication = async () => {
    try {
      const response = await medicationService.delete(deleteDialog.medicationId);
      if (response.success) {
        setSuccess('Medication deleted successfully');
        loadMedications();
        loadStats();
      }
    } catch (err) {
      console.error('Delete medication error:', err);
      setError('Failed to delete medication. Please try again.');
    } finally {
      setDeleteDialog({ open: false, medicationId: null, medicationName: '' });
    }
  };

  // Handle verify medication
  const handleVerifyMedication = async () => {
    try {
      const response = await medicationService.verify(verifyDialog.medicationId);
      if (response.success) {
        setSuccess('Medication verified successfully');
        loadMedications();
        loadStats();
      }
    } catch (err) {
      console.error('Verify medication error:', err);
      setError('Failed to verify medication. Please try again.');
    } finally {
      setVerifyDialog({ open: false, medicationId: null, medicationName: '' });
    }
  };

  // Handle search
  const handleSearch = () => {
    setPage(0);
    loadMedications();
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    setSearchQuery('');
    setCategoryFilter('');
    setSourceFilter('');
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setSourceFilter('');
    setPage(0);
  };

  // Effect to load data
  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get source chip
  const getSourceChip = (source, isVerified) => {
    if (source === 'predefined') {
      return (
        <Chip
          icon={<DoctorIcon />}
          label="Predefined"
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        icon={isVerified ? <VerifyIcon /> : <PendingIcon />}
        label={isVerified ? 'Patient (Verified)' : 'Patient (Pending)'}
        size="small"
        color={isVerified ? 'success' : 'warning'}
        variant="outlined"
      />
    );
  };

  // Medications table
  const renderMedicationsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Generic Name</strong></TableCell>
            <TableCell><strong>Category</strong></TableCell>
            <TableCell><strong>Dosage Form</strong></TableCell>
            <TableCell><strong>Source</strong></TableCell>
            <TableCell><strong>Usage</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <InlineLoading message="Loading medications..." />
              </TableCell>
            </TableRow>
          ) : medications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  No medications found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            medications.map((medication) => (
              <TableRow key={medication._id} hover>
                <TableCell>
                  <Typography fontWeight="medium">{medication.name}</Typography>
                </TableCell>
                <TableCell>
                  {medication.genericName || <Typography color="textSecondary">—</Typography>}
                </TableCell>
                <TableCell>
                  <Chip label={medication.category || 'Other'} size="small" />
                </TableCell>
                <TableCell>
                  {medication.dosageForm || <Typography color="textSecondary">—</Typography>}
                </TableCell>
                <TableCell>
                  {getSourceChip(medication.source, medication.isVerified)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{medication.usageCount || 0} reports</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {!medication.isVerified && medication.source === 'patient' && (
                      <Tooltip title="Verify Medication">
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => setVerifyDialog({
                            open: true,
                            medicationId: medication._id,
                            medicationName: medication.name,
                          })}
                        >
                          <VerifyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/medications/edit/${medication._id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => setDeleteDialog({
                          open: true,
                          medicationId: medication._id,
                          medicationName: medication.name,
                        })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MedicationIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Medication Management
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage medications for patient side effect reporting
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadMedications(); loadStats(); }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-medication')}
          >
            Add Medication
          </Button>
        </Box>
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2} 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white' 
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="rgba(255,255,255,0.8)" gutterBottom variant="body2">
                    Total Medications
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <MedicationIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Predefined
                  </Typography>
                  <Typography variant="h4">
                    {stats.predefined}
                  </Typography>
                  <Typography variant="caption" color="primary.main">
                    Created by doctors
                  </Typography>
                </Box>
                <DoctorIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Patient Created
                  </Typography>
                  <Typography variant="h4">
                    {stats.patientCreated}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    Added by patients
                  </Typography>
                </Box>
                <PatientIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Verification
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingVerification}
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Needs review
                  </Typography>
                </Box>
                <PendingIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Medications" />
          <Tab 
            label={
              <Badge badgeContent={stats.pendingVerification} color="warning">
                Pending Verification
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* All Medications Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search medications"
                placeholder="Search by name or generic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                sx={{minWidth:'220px'}}
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {MEDICATION_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{minWidth:'220px'}}>
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(0);
                  }}
                  label="Source"
                >
                  <MenuItem value="">All Sources</MenuItem>
                  <MenuItem value="predefined">Predefined (Doctor)</MenuItem>
                  <MenuItem value="patient">Patient Created</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Medications Table */}
        {renderMedicationsTable()}
      </TabPanel>

      {/* Pending Verification Tab */}
      <TabPanel value={tabValue} index={1}>
        <Alert severity="info" sx={{ mb: 3 }}>
          These medications were created by patients during side effect reporting and need verification.
          Verified medications will appear in the search results for all patients.
        </Alert>
        {renderMedicationsTable()}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, medicationId: null, medicationName: '' })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.medicationName}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, medicationId: null, medicationName: '' })}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteMedication} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog
        open={verifyDialog.open}
        onClose={() => setVerifyDialog({ open: false, medicationId: null, medicationName: '' })}
      >
        <DialogTitle>Verify Medication</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to verify "{verifyDialog.medicationName}"? 
            This will make it available for all patients to select when reporting side effects.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setVerifyDialog({ open: false, medicationId: null, medicationName: '' })}
          >
            Cancel
          </Button>
          <Button onClick={handleVerifyMedication} color="success" variant="contained">
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicationManagement;
