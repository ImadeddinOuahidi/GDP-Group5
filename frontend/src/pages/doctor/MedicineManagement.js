import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MedicalServices as MedicineIcon,
  Inventory as StockIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { medicineService } from '../../services';
import { useAuth } from '../../hooks';
import { MEDICINE_CATEGORIES } from '../../config/constants';
import { InlineLoading } from '../../components/ui/Loading';

const MedicineManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalMedicines, setTotalMedicines] = useState(0);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [prescriptionFilter, setPrescriptionFilter] = useState('');
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    medicineId: null,
    medicineName: '',
  });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    prescriptionOnly: 0,
    otc: 0,
    lowStock: 0,
  });

  // Load medicines
  const loadMedicines = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(prescriptionFilter && { prescriptionRequired: prescriptionFilter }),
      };
      
      const response = await medicineService.getAllMedicines(params);
      
      if (response.success) {
        setMedicines(response.data.medicines);
        setTotalMedicines(response.data.pagination.totalMedicines);
      }
    } catch (err) {
      console.error('Load medicines error:', err);
      setError('Failed to load medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const [allMeds, prescMeds, otcMeds, lowStockMeds] = await Promise.all([
        medicineService.getAllMedicines({ limit: 1 }),
        medicineService.getPrescriptionMedicines({ limit: 1 }),
        medicineService.getOTCMedicines({ limit: 1 }),
        medicineService.getLowStockMedicines(),
      ]);

      setStats({
        total: allMeds.data.pagination.totalMedicines,
        prescriptionOnly: prescMeds.data.pagination.totalMedicines,
        otc: otcMeds.data.pagination.totalMedicines,
        lowStock: lowStockMeds.data.medicines.length,
      });
    } catch (err) {
      console.error('Load stats error:', err);
    }
  };

  // Handle delete medicine
  const handleDeleteMedicine = async () => {
    try {
      const response = await medicineService.deleteMedicine(deleteDialog.medicineId, 'Deleted by doctor');
      
      if (response.success) {
        setSuccess('Medicine deleted successfully');
        loadMedicines();
        loadStats();
      }
    } catch (err) {
      console.error('Delete medicine error:', err);
      setError('Failed to delete medicine. Please try again.');
    } finally {
      setDeleteDialog({ open: false, medicineId: null, medicineName: '' });
    }
  };

  // Handle search
  const handleSearch = () => {
    setPage(0);
    loadMedicines();
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') {
      setCategoryFilter(value);
    } else if (filterType === 'prescription') {
      setPrescriptionFilter(value);
    }
    setPage(0);
  };

  // Effect to load data
  useEffect(() => {
    loadMedicines();
    loadStats();
  }, [page, rowsPerPage, categoryFilter, prescriptionFilter]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PharmacyIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Medicine Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/add-medicine')}
        >
          Add Medicine
        </Button>
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
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Medicines
                  </Typography>
                  <Typography variant="h4">
                    {stats.total}
                  </Typography>
                </Box>
                <MedicineIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Prescription Only
                  </Typography>
                  <Typography variant="h4">
                    {stats.prescriptionOnly}
                  </Typography>
                </Box>
                <MedicineIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Over-the-Counter
                  </Typography>
                  <Typography variant="h4">
                    {stats.otc}
                  </Typography>
                </Box>
                <MedicineIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.lowStock}
                  </Typography>
                </Box>
                <StockIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search medicines"
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
                value={categoryFilter}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {MEDICINE_CATEGORIES.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Prescription</InputLabel>
              <Select
                value={prescriptionFilter}
                onChange={(e) => handleFilterChange('prescription', e.target.value)}
                label="Prescription"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Prescription Only</MenuItem>
                <MenuItem value="false">Over-the-Counter</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setPrescriptionFilter('');
                setPage(0);
                loadMedicines();
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Medicines Table */}
      <Paper>
        {loading ? (
          <InlineLoading message="Loading medicines..." />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Generic Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Strength</TableCell>
                    <TableCell>Form</TableCell>
                    <TableCell>Prescription</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medicines.map((medicine) => (
                    <TableRow key={medicine._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {medicine.name}
                        </Typography>
                        {medicine.brandName && (
                          <Typography variant="caption" color="textSecondary">
                            Brand: {medicine.brandName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{medicine.genericName}</TableCell>
                      <TableCell>
                        <Chip
                          label={medicine.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {medicine.strength.value} {medicine.strength.unit}
                      </TableCell>
                      <TableCell>{medicine.dosageForm}</TableCell>
                      <TableCell>
                        <Chip
                          label={medicine.prescriptionRequired ? 'Rx' : 'OTC'}
                          size="small"
                          color={medicine.prescriptionRequired ? 'error' : 'success'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {medicine.availability?.quantity || 'N/A'}
                          </Typography>
                          {medicine.availability?.inStock !== undefined && (
                            <Chip
                              label={medicine.availability.inStock ? 'In Stock' : 'Out of Stock'}
                              size="small"
                              color={medicine.availability.inStock ? 'success' : 'error'}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/edit-medicine/${medicine._id}`)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        {user?.role === 'admin' && (
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({
                              open: true,
                              medicineId: medicine._id,
                              medicineName: medicine.name,
                            })}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalMedicines}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, medicineId: null, medicineName: '' })}
      >
        <DialogTitle>Delete Medicine</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.medicineName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, medicineId: null, medicineName: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteMedicine} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicineManagement;