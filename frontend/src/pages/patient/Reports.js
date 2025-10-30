import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Alert,
  useTheme,
  Fade,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as MedicineIcon,
  Assessment as SeverityIcon,
} from '@mui/icons-material';
import AuthContainer from '../../store/containers/AuthContainer';

const statusConfig = {
  'pending': {
    color: 'warning',
    icon: <PendingIcon />,
    label: 'Pending Review'
  },
  'reviewed': {
    color: 'success',
    icon: <CheckCircleIcon />,
    label: 'Reviewed'
  },
  'under_review': {
    color: 'info',
    icon: <WarningIcon />,
    label: 'Under Review'
  },
  'rejected': {
    color: 'error',
    icon: <ErrorIcon />,
    label: 'Rejected'
  }
};

const severityConfig = {
  'mild': { color: 'success', label: 'Mild' },
  'moderate': { color: 'warning', label: 'Moderate' },
  'severe': { color: 'error', label: 'Severe' },
  'life-threatening': { color: 'error', label: 'Life-threatening' }
};

export default function Reports() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = AuthContainer.useContainer();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Mock reports data - in real app, fetch from API
  const mockReports = [
    {
      id: 1,
      medicine: 'Aspirin',
      brandName: 'Bayer Aspirin',
      dosage: '325mg',
      sideEffect: 'Stomach irritation and nausea',
      severity: 'moderate',
      status: 'reviewed',
      dateSubmitted: '2025-10-28',
      dateReviewed: '2025-10-29',
      reviewedBy: 'Dr. Sarah Johnson',
      description: 'Experienced stomach pain and nausea about 30 minutes after taking the medication on an empty stomach.',
      outcome: 'Recovered after discontinuing medication',
      reportId: 'ADR-2025-001',
    },
    {
      id: 2,
      medicine: 'Ibuprofen',
      brandName: 'Advil',
      dosage: '400mg',
      sideEffect: 'Dizziness and headache',
      severity: 'mild',
      status: 'pending',
      dateSubmitted: '2025-10-25',
      dateReviewed: null,
      reviewedBy: null,
      description: 'Mild dizziness occurred within 2 hours of taking the medication. Headache persisted for several hours.',
      outcome: 'Ongoing monitoring',
      reportId: 'ADR-2025-002',
    },
    {
      id: 3,
      medicine: 'Amoxicillin',
      brandName: 'Amoxil',
      dosage: '500mg',
      sideEffect: 'Skin rash and itching',
      severity: 'severe',
      status: 'under_review',
      dateSubmitted: '2025-10-20',
      dateReviewed: null,
      reviewedBy: null,
      description: 'Developed red, itchy rash on arms and chest after 3 days of treatment. Rash spread to other areas.',
      outcome: 'Medication discontinued, consulting dermatologist',
      reportId: 'ADR-2025-003',
    },
    {
      id: 4,
      medicine: 'Lisinopril',
      brandName: 'Prinivil',
      dosage: '10mg',
      sideEffect: 'Persistent dry cough',
      severity: 'mild',
      status: 'reviewed',
      dateSubmitted: '2025-10-15',
      dateReviewed: '2025-10-18',
      reviewedBy: 'Dr. Michael Chen',
      description: 'Developed a persistent dry cough about 2 weeks after starting the medication.',
      outcome: 'Switched to alternative medication',
      reportId: 'ADR-2025-004',
    },
    {
      id: 5,
      medicine: 'Metformin',
      brandName: 'Glucophage',
      dosage: '500mg',
      sideEffect: 'Gastrointestinal upset',
      severity: 'moderate',
      status: 'pending',
      dateSubmitted: '2025-10-22',
      dateReviewed: null,
      reviewedBy: null,
      description: 'Experiencing nausea, diarrhea, and abdominal discomfort, especially after meals.',
      outcome: 'Continuing medication with dietary adjustments',
      reportId: 'ADR-2025-005',
    },
  ];

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReports(mockReports);
        setTotalPages(Math.ceil(mockReports.length / 5));
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handleViewReport = (reportId) => {
    navigate(`/reports/${reportId}`);
    handleMenuClose();
  };

  const handleEditReport = (reportId) => {
    navigate(`/report/edit/${reportId}`);
    handleMenuClose();
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.sideEffect.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.dateSubmitted) - new Date(a.dateSubmitted);
      case 'date_asc':
        return new Date(a.dateSubmitted) - new Date(b.dateSubmitted);
      case 'medicine':
        return a.medicine.localeCompare(b.medicine);
      case 'severity':
        const severityOrder = { 'mild': 1, 'moderate': 2, 'severe': 3, 'life-threatening': 4 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 3, borderRadius: 2 }} />
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rectangular"
              height={200}
              sx={{ mb: 2, borderRadius: 2 }}
            />
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="700">
              My Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your adverse drug reaction reports
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/report')}
            sx={{ fontWeight: 600 }}
          >
            New Report
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                  <ReportIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {reports.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                  <PendingIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {reports.filter(r => r.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {reports.filter(r => r.status === 'reviewed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reviewed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                  <WarningIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {reports.filter(r => r.status === 'under_review').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Under Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Severity</MenuItem>
                  <MenuItem value="mild">Mild</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="severe">Severe</MenuItem>
                  <MenuItem value="life-threatening">Life-threatening</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date_desc">Newest First</MenuItem>
                  <MenuItem value="date_asc">Oldest First</MenuItem>
                  <MenuItem value="medicine">Medicine A-Z</MenuItem>
                  <MenuItem value="severity">Severity High-Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {sortedReports.length} of {reports.length} reports
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Reports List */}
        {sortedReports.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No reports found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {reports.length === 0 
                ? "You haven't submitted any reports yet."
                : "Try adjusting your search or filter criteria."
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/report')}
            >
              Create Your First Report
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {sortedReports.map((report, index) => (
              <Fade in timeout={300 + index * 100} key={report.id}>
                <Card
                  sx={{
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Stack spacing={2}>
                          {/* Report Header */}
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6" fontWeight="600">
                                  {report.medicine}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={report.reportId}
                                  variant="outlined"
                                />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {report.brandName} • {report.dosage}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, report)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Stack>

                          {/* Side Effect Description */}
                          <Box>
                            <Typography variant="body1" fontWeight="500" gutterBottom>
                              Side Effect: {report.sideEffect}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.description}
                            </Typography>
                          </Box>

                          {/* Status and Severity */}
                          <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Chip
                              icon={statusConfig[report.status]?.icon}
                              label={statusConfig[report.status]?.label}
                              color={statusConfig[report.status]?.color}
                              variant="outlined"
                            />
                            <Chip
                              icon={<SeverityIcon />}
                              label={severityConfig[report.severity]?.label}
                              color={severityConfig[report.severity]?.color}
                              variant="outlined"
                            />
                          </Stack>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                          {/* Dates and Review Info */}
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Submitted: {new Date(report.dateSubmitted).toLocaleDateString()}
                              </Typography>
                            </Stack>
                            {report.dateReviewed && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Reviewed: {new Date(report.dateReviewed).toLocaleDateString()}
                                </Typography>
                              </Stack>
                            )}
                            {report.reviewedBy && (
                              <Typography variant="body2" color="text.secondary">
                                Reviewed by: {report.reviewedBy}
                              </Typography>
                            )}
                          </Stack>

                          {/* Outcome */}
                          <Box>
                            <Typography variant="body2" fontWeight="500" gutterBottom>
                              Outcome:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.outcome}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewReport(selectedReport?.id)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleEditReport(selectedReport?.id)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Report</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Report</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Container>
  );
}