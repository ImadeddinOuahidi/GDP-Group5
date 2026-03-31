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
import { MEDICATION_CATEGORIES } from '../../config/constants';
import { InlineLoading } from '../../components/ui/Loading';
import { useI18n } from '../../i18n';

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
  const { t } = useI18n();
  
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
      setError(t('doctor.loadMedicationsFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, categoryFilter, sourceFilter, tabValue, t]);

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
        setSuccess(t('doctor.medicationDeleted'));
        loadMedications();
        loadStats();
      }
    } catch (err) {
      console.error('Delete medication error:', err);
      setError(t('doctor.deleteMedicationFailed'));
    } finally {
      setDeleteDialog({ open: false, medicationId: null, medicationName: '' });
    }
  };

  // Handle verify medication
  const handleVerifyMedication = async () => {
    try {
      const response = await medicationService.verify(verifyDialog.medicationId);
      if (response.success) {
        setSuccess(t('doctor.medicationVerified'));
        loadMedications();
        loadStats();
      }
    } catch (err) {
      console.error('Verify medication error:', err);
      setError(t('doctor.verifyMedicationFailed'));
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
          label={t('doctor.predefined')}
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        icon={isVerified ? <VerifyIcon /> : <PendingIcon />}
        label={isVerified ? t('doctor.patientVerified') : t('doctor.patientPending')}
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
            <TableCell><strong>{t('doctor.name')}</strong></TableCell>
            <TableCell><strong>{t('doctor.genericName')}</strong></TableCell>
            <TableCell><strong>{t('medications.category')}</strong></TableCell>
            <TableCell><strong>{t('medications.dosageForm')}</strong></TableCell>
            <TableCell><strong>{t('doctor.source')}</strong></TableCell>
            <TableCell><strong>{t('doctor.usage')}</strong></TableCell>
            <TableCell align="right"><strong>{t('reports.actions')}</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <InlineLoading message={t('doctor.loadingMedications')} />
              </TableCell>
            </TableRow>
          ) : medications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  {t('doctor.noMedicationsFound')}
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
                  {medication.genericName || <Typography color="textSecondary">{t('common.noneSymbol')}</Typography>}
                </TableCell>
                <TableCell>
                  <Chip label={medication.category || t('common.other')} size="small" />
                </TableCell>
                <TableCell>
                  {medication.dosageForm || <Typography color="textSecondary">{t('common.noneSymbol')}</Typography>}
                </TableCell>
                <TableCell>
                  {getSourceChip(medication.source, medication.isVerified)}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{t('doctor.reportsWithCount', { count: medication.usageCount || 0 })}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {!medication.isVerified && medication.source === 'patient' && (
                      <Tooltip title={t('doctor.verifyMedication')}>
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
                    <Tooltip title={t('common.edit')}>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/medications/edit/${medication._id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
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
              {t('doctor.medicationManagement')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {t('doctor.manageMedicationsDescription')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadMedications(); loadStats(); }}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-medication')}
          >
            {t('medications.addMedication')}
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
              border: 1,
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    {t('doctor.totalMedications')}
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <MedicationIcon sx={{ fontSize: 50, color: 'text.secondary' }} />
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
                    {t('doctor.predefined')}
                  </Typography>
                  <Typography variant="h4">
                    {stats.predefined}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('doctor.createdByDoctors')}
                  </Typography>
                </Box>
                <DoctorIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
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
                    {t('doctor.patientCreated')}
                  </Typography>
                  <Typography variant="h4">
                    {stats.patientCreated}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('doctor.addedByPatients')}
                  </Typography>
                </Box>
                <PatientIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
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
                    {t('doctor.pendingVerification')}
                  </Typography>
                  <Typography variant="h4">
                    {stats.pendingVerification}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('doctor.needsReview')}
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
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
          <Tab label={t('doctor.allMedications')} />
          <Tab 
            label={
              <Badge badgeContent={stats.pendingVerification} color="warning">
                {t('doctor.pendingVerification')}
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
                label={t('doctor.searchMedications')}
                placeholder={t('doctor.searchMedicationsPlaceholder')}
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
                <InputLabel>{t('medications.category')}</InputLabel>
                <Select
                sx={{minWidth:'220px'}}
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(0);
                  }}
                  label={t('medications.category')}
                >
                  <MenuItem value="">{t('doctor.allCategories')}</MenuItem>
                  {MEDICATION_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{minWidth:'220px'}}>
                <InputLabel>{t('doctor.source')}</InputLabel>
                <Select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(0);
                  }}
                  label={t('doctor.source')}
                >
                  <MenuItem value="">{t('doctor.allSources')}</MenuItem>
                  <MenuItem value="predefined">{t('doctor.predefinedDoctor')}</MenuItem>
                  <MenuItem value="patient">{t('doctor.patientCreated')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
              >
                {t('doctor.clearFilters')}
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
          {t('doctor.pendingVerificationDescription')}
        </Alert>
        {renderMedicationsTable()}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, medicationId: null, medicationName: '' })}
      >
        <DialogTitle>{t('doctor.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('doctor.confirmDeleteMessage', { medicationName: deleteDialog.medicationName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, medicationId: null, medicationName: '' })}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteMedication} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog
        open={verifyDialog.open}
        onClose={() => setVerifyDialog({ open: false, medicationId: null, medicationName: '' })}
      >
        <DialogTitle>{t('doctor.verifyMedication')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('doctor.verifyMedicationMessage', { medicationName: verifyDialog.medicationName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setVerifyDialog({ open: false, medicationId: null, medicationName: '' })}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleVerifyMedication} color="success" variant="contained">
            {t('doctor.verify')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicationManagement;
