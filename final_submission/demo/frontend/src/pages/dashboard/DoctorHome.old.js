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
  Avatar,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Badge,
  Fab,
  Skeleton,
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
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';
import Strings from '../../Strings';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import { reportService } from '../../services';

export default function DoctorHome() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user } = AuthContainer.useContainer();
  const [reports, setReports] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReviewReport, setSelectedReviewReport] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewRecommendation, setReviewRecommendation] = useState('');
  const [reviewAction, setReviewAction] = useState('none');
  const [submittingReview, setSubmittingReview] = useState(false);
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

  const loadReports = async () => {
    setLoading(true);
    try {
      // Fetch real reports from API
      const response = await reportService.getAllReports({
        page: 1,
        limit: 50,
        sortBy: 'reportDetails.reportDate',
        sortOrder: 'desc'
      });
      
      if (response.status === 'success' && response.data) {
        // Transform API data to match the component's expected format
        const transformedReports = response.data.map(report => ({
          _id: report._id,
          patientName: report.patient?.firstName && report.patient?.lastName 
            ? `${report.patient.firstName} ${report.patient.lastName}`
            : 'Anonymous',
          patientEmail: report.patient?.email || 'N/A',
          patientAge: report.patientInfo?.age || 'N/A',
          patientGender: report.patientInfo?.gender || 'N/A',
          medicationName: report.medicine?.name || 'Unknown',
          dosage: report.medicationUsage?.dosage?.amount || 'N/A',
          administrationRoute: report.medicationUsage?.dosage?.route || 'N/A',
          indicationsForUse: report.medicationUsage?.indication || 'N/A',
          adverseReaction: report.sideEffects?.map(se => se.effect).join(', ') || 'N/A',
          reactionSeverity: report.sideEffects?.[0]?.severity || 'Unknown',
          onsetTime: report.sideEffects?.[0]?.onset || 'Unknown',
          reactionDuration: 'N/A',
          actionTaken: report.reportDetails?.description || 'N/A',
          outcome: report.reportDetails?.outcome || 'Unknown',
          concomitantMeds: 'N/A',
          medicalHistory: 'N/A',
          allergies: 'None recorded',
          additionalInfo: report.reportDetails?.description || '',
          reportDate: report.reportDetails?.reportDate || report.createdAt,
          status: report.status.toLowerCase(),
          doctorNotes: report.workflow?.comments || '',
          priority: report.priority?.toLowerCase() || 'medium',
          followUpRequired: report.followUp?.length > 0,
          ...report // Include all original fields
        }));
        
        setReports(transformedReports);
      } else {
        // Fallback to mock data if API fails
        console.warn('Using mock data as fallback');
        setReports(mockReports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      // Use mock data as fallback
      setReports(mockReports);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await reportService.getDashboardStats();
      if (response.status === 'success' && response.data) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Stats will fallback to local calculation
    }
  };

  // Load pending review requests
  const loadPendingReviews = async () => {
    try {
      const response = await reportService.getPendingReviews({ status: 'pending' });
      if (response.success && response.data) {
        setPendingReviews(response.data);
      }
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      setPendingReviews([]);
    }
  };

  // Handle opening review dialog
  const handleOpenReviewDialog = (report) => {
    setSelectedReviewReport(report);
    setReviewRemarks('');
    setReviewRecommendation('');
    setReviewAction('none');
    setReviewDialogOpen(true);
  };

  // Handle submitting doctor review
  const handleSubmitReview = async () => {
    if (!selectedReviewReport) return;
    
    try {
      setSubmittingReview(true);
      await reportService.submitDoctorReview(selectedReviewReport._id, {
        remarks: reviewRemarks,
        recommendation: reviewRecommendation,
        actionRequired: reviewAction,
      });
      setReviewDialogOpen(false);
      setSelectedReviewReport(null);
      // Refresh pending reviews
      await loadPendingReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    loadReports();
    if (user?.role === 'doctor' || user?.role === 'admin') {
      loadDashboardStats();
      loadPendingReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadReports(),
      (user?.role === 'doctor' || user?.role === 'admin') && loadDashboardStats()
    ]);
    setRefreshing(false);
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
      // Map local status to API status
      const statusMap = {
        'pending': 'Submitted',
        'approved': 'Reviewed',
        'rejected': 'Rejected'
      };
      
      const apiStatus = statusMap[newStatus] || newStatus;
      
      // Update via API
      await reportService.updateReportStatus(reportId, {
        status: apiStatus,
        comments: doctorNotes
      });
      
      // Update local state
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
              {Strings.doctorPortalTitle}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {Strings.doctorWelcome(user?.firstName || user?.name || 'Doctor')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {Strings.monitorADRText}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton 
                color="primary" 
                onClick={toggleTheme}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                  transition: 'all 0.3s ease',
                }}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
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

      {/* Pending Review Requests Section */}
      {pendingReviews.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: theme.shadows[4], border: `2px solid ${theme.palette.warning.main}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Badge badgeContent={pendingReviews.length} color="warning" sx={{ mr: 2 }}>
                  <NotificationIcon color="warning" />
                </Badge>
                Patient Review Requests
              </Typography>
              <Chip 
                label={`${pendingReviews.length} pending`} 
                color="warning" 
                size="small"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Patients have requested your review on the following reports
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Medication</TableCell>
                    <TableCell>Side Effect</TableCell>
                    <TableCell>AI Severity</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingReviews.map((review) => (
                    <TableRow key={review._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {review.reporter?.firstName?.[0] || 'P'}
                          </Avatar>
                          <Typography variant="body2">
                            {review.reporter?.firstName} {review.reporter?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{review.medicine?.name || 'Unknown'}</TableCell>
                      <TableCell>{review.sideEffects?.[0]?.effect || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={review.metadata?.aiAnalysis?.severity || 'Pending'}
                          color={
                            review.metadata?.aiAnalysis?.severity === 'High' ? 'error' :
                            review.metadata?.aiAnalysis?.severity === 'Medium' ? 'warning' : 'success'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {review.doctorReview?.requestedAt 
                          ? new Date(review.doctorReview.requestedAt).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenReviewDialog(review)}
                          startIcon={<ViewIcon />}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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
                  // Enhanced skeleton loading rows
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                          <Box>
                            <Skeleton variant="text" width={120} height={20} />
                            <Skeleton variant="text" width={80} height={16} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={100} height={20} />
                        <Skeleton variant="text" width={60} height={16} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={150} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={70} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={60} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={80} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={80} height={20} />
                        <Skeleton variant="text" width={60} height={16} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton variant="circular" width={32} height={32} />
                      </TableCell>
                    </TableRow>
                  ))
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

      {/* Doctor Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HospitalIcon sx={{ mr: 1 }} />
            Submit Medical Review
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedReviewReport && (
            <Box>
              {/* Report Summary */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Report Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Patient:</strong> {selectedReviewReport.reporter?.firstName} {selectedReviewReport.reporter?.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Medication:</strong> {selectedReviewReport.medicine?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Side Effect:</strong> {selectedReviewReport.sideEffects?.[0]?.effect}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Severity:</strong> {selectedReviewReport.sideEffects?.[0]?.severity}
                    </Typography>
                  </Grid>
                </Grid>
                
                {/* AI Analysis Summary */}
                {selectedReviewReport.metadata?.aiAnalysis && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Analysis
                    </Typography>
                    <Typography variant="body2">
                      {selectedReviewReport.metadata.aiAnalysis.summary}
                    </Typography>
                  </Box>
                )}
                
                {/* Patient's Request Reason */}
                {selectedReviewReport.doctorReview?.requestReason && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Patient's Concern
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{selectedReviewReport.doctorReview.requestReason}"
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              {/* Doctor's Input */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Medical Assessment & Remarks"
                placeholder="Provide your professional assessment of this adverse reaction..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Recommendation for Patient"
                placeholder="What should the patient do? Continue medication, stop, see specialist..."
                value={reviewRecommendation}
                onChange={(e) => setReviewRecommendation(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                select
                label="Action Required"
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="none">No immediate action needed</MenuItem>
                <MenuItem value="continue_monitoring">Continue monitoring</MenuItem>
                <MenuItem value="adjust_dosage">Adjust dosage</MenuItem>
                <MenuItem value="discontinue">Discontinue medication</MenuItem>
                <MenuItem value="seek_immediate_care">Seek immediate medical care</MenuItem>
                <MenuItem value="schedule_appointment">Schedule follow-up appointment</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitReview}
            disabled={submittingReview || !reviewRemarks.trim()}
            startIcon={submittingReview ? <CircularProgress size={20} color="inherit" /> : <ApprovedIcon />}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Floating Action Button */}
      <Tooltip title={Strings.createNewADRTooltip} arrow placement="left">
        <Fab
          color="primary"
          aria-label="create new report"
          variant="extended"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            boxShadow: theme.shadows[8],
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: theme.shadows[12],
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          }}
        >
          <AddIcon sx={{ mr: 1 }} />
          {Strings.newReportLabel}
        </Fab>
      </Tooltip>

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
