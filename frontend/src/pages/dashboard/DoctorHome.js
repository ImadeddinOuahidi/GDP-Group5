import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  LinearProgress,
  Badge,
  Fab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Assignment as ReportIcon,
  Person as PatientIcon,
  Warning as WarningIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Close as RejectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  Assessment as AssessmentIcon,
  NotificationsActive as NotificationIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AuthContainer from './containers/AuthContainer';

export default function DoctorHome() {
  const theme = useTheme();
  const { user } = AuthContainer.useContainer();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced mock data with more realistic ADR reports
  const mockReports = [
    {
      _id: '1',
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      patientAge: 45,
      patientGender: 'Male',
      medicationName: 'Aspirin',
      dosage: '100mg',
      administrationRoute: 'Oral',
      indicationsForUse: 'Cardiovascular protection',
      adverseReaction: 'Gastrointestinal bleeding',
      reactionSeverity: 'Severe',
      onsetTime: '3 days after initiation',
      reactionDuration: 'Ongoing',
      actionTaken: 'Medication discontinued, hospitalization',
      outcome: 'Stabilized',
      concomitantMeds: 'Warfarin, Metoprolol',
      medicalHistory: 'Hypertension, Atrial fibrillation',
      allergies: 'None known',
      additionalInfo: 'Patient requires close monitoring',
      reportDate: '2024-10-08T10:30:00Z',
      status: 'pending',
      doctorNotes: '',
      priority: 'high',
      followUpRequired: true,
    },
    {
      _id: '2',
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.j@email.com',
      patientAge: 32,
      patientGender: 'Female',
      medicationName: 'Ibuprofen',
      dosage: '400mg',
      administrationRoute: 'Oral',
      indicationsForUse: 'Pain management',
      adverseReaction: 'Allergic skin rash',
      reactionSeverity: 'Moderate',
      onsetTime: '2 hours post-dose',
      reactionDuration: '48 hours',
      actionTaken: 'Medication stopped, antihistamine given',
      outcome: 'Fully recovered',
      concomitantMeds: 'Birth control pills',
      medicalHistory: 'No significant history',
      allergies: 'Penicillin',
      additionalInfo: 'Patient advised to avoid NSAIDs',
      reportDate: '2024-10-07T14:15:00Z',
      status: 'approved',
      doctorNotes: 'Typical NSAID allergic reaction. Patient education provided.',
      priority: 'medium',
      followUpRequired: false,
    },
    {
      _id: '3',
      patientName: 'Michael Brown',
      patientEmail: 'mbrown@email.com',
      patientAge: 58,
      patientGender: 'Male',
      medicationName: 'Warfarin',
      dosage: '5mg daily',
      administrationRoute: 'Oral',
      indicationsForUse: 'Anticoagulation therapy',
      adverseReaction: 'Excessive bleeding, bruising',
      reactionSeverity: 'Severe',
      onsetTime: '1 week after dose adjustment',
      reactionDuration: 'Ongoing',
      actionTaken: 'Dose reduction, Vitamin K administered',
      outcome: 'Improving',
      concomitantMeds: 'Aspirin, Simvastatin',
      medicalHistory: 'Diabetes, Coronary artery disease',
      allergies: 'Sulfa drugs',
      additionalInfo: 'INR was 4.5, now monitoring closely',
      reportDate: '2024-10-06T09:45:00Z',
      status: 'pending',
      doctorNotes: '',
      priority: 'high',
      followUpRequired: true,
    },
    {
      _id: '4',
      patientName: 'Emily Davis',
      patientEmail: 'emily.davis@email.com',
      patientAge: 28,
      patientGender: 'Female',
      medicationName: 'Amoxicillin',
      dosage: '500mg',
      administrationRoute: 'Oral',
      indicationsForUse: 'Respiratory tract infection',
      adverseReaction: 'Mild nausea, diarrhea',
      reactionSeverity: 'Mild',
      onsetTime: '4 hours post-dose',
      reactionDuration: '24 hours',
      actionTaken: 'Continued with food',
      outcome: 'Resolved',
      concomitantMeds: 'None',
      medicalHistory: 'No significant history',
      allergies: 'None known',
      additionalInfo: 'Common side effect, well tolerated',
      reportDate: '2024-10-05T16:20:00Z',
      status: 'approved',
      doctorNotes: 'Expected side effect. Patient completed course successfully.',
      priority: 'low',
      followUpRequired: false,
    },
  ];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      loadReports();
      setRefreshing(false);
    }, 800);
  };

  // Filter and search reports
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = !searchTerm || 
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.adverseReaction.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Get enhanced statistics
  const getAdvancedStats = () => {
    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      approved: reports.filter(r => r.status === 'approved').length,
      rejected: reports.filter(r => r.status === 'rejected').length,
      high: reports.filter(r => r.priority === 'high').length,
      severe: reports.filter(r => r.reactionSeverity?.toLowerCase() === 'severe').length,
      thisWeek: reports.filter(r => {
        const reportDate = new Date(r.reportDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return reportDate > weekAgo;
      }).length,
    };
    return stats;
  };

  const stats = getAdvancedStats();

  // Handle report actions
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleStatusUpdate = async (reportId, newStatus, doctorNotes = '') => {
    try {
      setReports(prevReports => 
        prevReports.map(report => 
          report._id === reportId 
            ? { ...report, status: newStatus, doctorNotes } 
            : report
        )
      );
      setDialogOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  // Utility functions for styling
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'mild': return 'success';
      case 'moderate': return 'warning';
      case 'severe': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
      p: 3 
    }}>
      {/* Enhanced Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Doctor Portal
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Welcome back, Dr. {user?.firstName || user?.name || 'Doctor'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor adverse drug reactions and ensure patient safety
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton 
                color="primary" 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Reports">
              <IconButton 
                color="primary"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Quick Stats Bar */}
        <Alert 
          severity="info" 
          icon={<NotificationIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            You have <strong>{stats.pending}</strong> pending reports requiring review, 
            including <strong>{stats.high}</strong> high-priority cases.
          </Typography>
        </Alert>
      </Box>

      {/* Enhanced Statistics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: `linear-gradient(45deg, ${alpha('#fff', 0.1)}, transparent)`,
              }
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReportIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.total}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Total Reports
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.thisWeek} this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge badgeContent={stats.high} color="error">
                  <PendingIcon sx={{ fontSize: 40, mr: 2 }} />
                </Badge>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.pending}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Pending Review
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.pending / stats.total) * 100}
                sx={{ 
                  mt: 1, 
                  bgcolor: alpha('#fff', 0.3),
                  '& .MuiLinearProgress-bar': { bgcolor: '#fff' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ApprovedIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.approved}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Approved
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.severe}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Severe Cases
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Requires attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.high}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                High Priority
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Urgent review needed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Action Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}
            component={Link}
            to="/dashboard"
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 48, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Analytics Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View detailed reports and trends
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}
            component={Link}
            to="/settings"
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HospitalIcon sx={{ fontSize: 48, mr: 2, color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Patient Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage patient profiles and history
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReportIcon sx={{ fontSize: 48, mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Generate Reports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create comprehensive ADR reports
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Search and Filter Section */}
      <Card sx={{ mb: 3, boxShadow: theme.shadows[4] }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
            Search & Filter Reports
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by patient name, medication, or adverse reaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                InputProps={{
                  startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">
                  {filteredReports.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reports found
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Reports Table */}
      <Card sx={{ boxShadow: theme.shadows[4] }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <ReportIcon sx={{ mr: 1, color: 'primary.main' }} />
              Adverse Drug Reaction Reports
            </Typography>
            
            {loading && (
              <LinearProgress sx={{ width: 200, borderRadius: 1 }} />
            )}
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Medication</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Adverse Reaction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <LinearProgress sx={{ width: 200 }} />
                        <Typography color="text.secondary">Loading reports...</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary" variant="h6">
                        No reports found matching your criteria
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Try adjusting your search terms or filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow 
                      key={report._id} 
                      hover
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              bgcolor: theme.palette.primary.light,
                              width: 40,
                              height: 40
                            }}
                          >
                            <PatientIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {report.patientName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {report.patientAge} years • {report.patientGender}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {report.medicationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.dosage} • {report.administrationRoute}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {report.adverseReaction}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={report.reactionSeverity}
                          color={getSeverityColor(report.reactionSeverity)}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={report.priority}
                          color={getPriorityColor(report.priority)}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={report.status}
                          color={getStatusColor(report.status)}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(report.reportDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(report.reportDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewReport(report)}
                            size="small"
                            sx={{
                              '&:hover': { 
                                bgcolor: alpha(theme.palette.primary.main, 0.1) 
                              }
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Enhanced Report Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedReport && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ADR Report Details
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Patient: {selectedReport.patientName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={selectedReport.priority}
                    color={getPriorityColor(selectedReport.priority)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={selectedReport.status}
                    color={getStatusColor(selectedReport.status)}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Patient Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'primary.main', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <PatientIcon sx={{ mr: 1 }} />
                    Patient Information
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedReport.patientName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Email</Typography>
                        <Typography variant="body1">{selectedReport.patientEmail}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Age</Typography>
                        <Typography variant="body1">{selectedReport.patientAge} years</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Gender</Typography>
                        <Typography variant="body1">{selectedReport.patientGender}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Medication Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'secondary.main', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <HospitalIcon sx={{ mr: 1 }} />
                    Medication Information
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Medication</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedReport.medicationName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Dosage</Typography>
                        <Typography variant="body1">{selectedReport.dosage}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Administration Route</Typography>
                        <Typography variant="body1">{selectedReport.administrationRoute}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Indication</Typography>
                        <Typography variant="body1">{selectedReport.indicationsForUse}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Adverse Reaction Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'error.main', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <WarningIcon sx={{ mr: 1 }} />
                    Adverse Reaction Details
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.02) }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Reaction Description</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedReport.adverseReaction}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Severity</Typography>
                        <Chip
                          label={selectedReport.reactionSeverity}
                          color={getSeverityColor(selectedReport.reactionSeverity)}
                          sx={{ fontWeight: 500 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Onset Time</Typography>
                        <Typography variant="body1">{selectedReport.onsetTime}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Duration</Typography>
                        <Typography variant="body1">{selectedReport.reactionDuration}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Action Taken</Typography>
                        <Typography variant="body1">{selectedReport.actionTaken}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Outcome</Typography>
                        <Typography variant="body1">{selectedReport.outcome}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Medical History */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'info.main', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                    Medical History & Context
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Medical History</Typography>
                        <Typography variant="body1">{selectedReport.medicalHistory}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Known Allergies</Typography>
                        <Typography variant="body1">{selectedReport.allergies}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Concomitant Medications</Typography>
                        <Typography variant="body1">{selectedReport.concomitantMeds}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Additional Information */}
                {selectedReport.additionalInfo && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                    <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                      <Typography variant="body1">{selectedReport.additionalInfo}</Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Doctor Notes */}
                {selectedReport.status !== 'pending' && selectedReport.doctorNotes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: 'success.main', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <ApprovedIcon sx={{ mr: 1 }} />
                      Doctor's Assessment
                    </Typography>
                    <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                      <Typography variant="body1">{selectedReport.doctorNotes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
              {selectedReport.status === 'pending' ? (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<ApprovedIcon />}
                    onClick={() => handleStatusUpdate(selectedReport._id, 'approved')}
                    sx={{ minWidth: 120 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<RejectIcon />}
                    onClick={() => handleStatusUpdate(selectedReport._id, 'rejected')}
                    sx={{ minWidth: 120 }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setDialogOpen(false)}
                    sx={{ minWidth: 100 }}
                  >
                    Close
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setDialogOpen(false)}
                  sx={{ minWidth: 100 }}
                >
                  Close
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Global styles for animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
}
