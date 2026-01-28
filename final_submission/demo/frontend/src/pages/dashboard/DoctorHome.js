import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Alert,
  Avatar,
  Tooltip,
  LinearProgress,
  CircularProgress,
  Badge,
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
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  Assessment as AssessmentIcon,
  NotificationsActive as NotificationIcon,
  Refresh as RefreshIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  RateReview as ReviewIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';
import Strings from '../../Strings';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import { reportService } from '../../services';

export default function DoctorHome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user } = AuthContainer.useContainer();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    severe: 0,
    high: 0,
    thisWeek: 0,
  });
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load reports for stats
      const reportsResponse = await reportService.getAllReports({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (reportsResponse.status === 'success' && reportsResponse.data) {
        const reports = reportsResponse.data;
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        setStats({
          total: reports.length,
          pending: reports.filter(r => r.status?.toLowerCase() === 'submitted' || r.status?.toLowerCase() === 'pending').length,
          approved: reports.filter(r => r.status?.toLowerCase() === 'reviewed' || r.status?.toLowerCase() === 'approved').length,
          rejected: reports.filter(r => r.status?.toLowerCase() === 'rejected').length,
          severe: reports.filter(r => r.sideEffects?.some(se => se.severity?.toLowerCase() === 'severe')).length,
          high: reports.filter(r => r.priority?.toLowerCase() === 'high').length,
          thisWeek: reports.filter(r => new Date(r.createdAt) > weekAgo).length,
        });
      }

      // Load pending review requests
      const reviewsResponse = await reportService.getPendingReviews();
      if (reviewsResponse.success && reviewsResponse.data?.reports) {
        setPendingReviewCount(reviewsResponse.data.reports.length);
        setRecentReviews(reviewsResponse.data.reports.slice(0, 3));
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
      p: 3 
    }}>
      {/* Header Section */}
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
          </Box>
        </Box>
      </Box>

      {/* Pending Review Alert - Prominent Call to Action */}
      {pendingReviewCount > 0 && (
        <Alert 
          severity="warning" 
          icon={<NotificationIcon />}
          sx={{ mb: 3, cursor: 'pointer' }}
          onClick={() => navigate('/review-requests')}
          action={
            <Button 
              color="inherit" 
              size="small" 
              endIcon={<ArrowForwardIcon />}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/review-requests');
              }}
            >
              View All
            </Button>
          }
        >
          <Typography variant="body1" fontWeight={500}>
            You have <strong>{pendingReviewCount}</strong> patient review request{pendingReviewCount > 1 ? 's' : ''} pending
          </Typography>
        </Alert>
      )}

      {/* Statistics Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReportIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.total}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>Total Reports</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.thisWeek} this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.pending}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>Pending Review</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
                sx={{ mt: 1, bgcolor: alpha('#fff', 0.3), '& .MuiLinearProgress-bar': { bgcolor: '#fff' } }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ApprovedIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.approved}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>Reviewed</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.severe}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>Severe Cases</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Requires attention</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.high}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>High Priority</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Urgent review needed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Quick Actions</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] },
              border: pendingReviewCount > 0 ? `2px solid ${theme.palette.warning.main}` : undefined,
            }}
            onClick={() => navigate('/review-requests')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge badgeContent={pendingReviewCount} color="warning">
                  <ReviewIcon sx={{ fontSize: 48, mr: 2, color: 'warning.main' }} />
                </Badge>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Review Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient-requested reviews awaiting your attention
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
              '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
            }}
            onClick={() => navigate('/dashboard')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 48, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Analytics Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View detailed reports, trends and insights
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
              '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
            }}
            onClick={() => navigate('/medications')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HospitalIcon sx={{ fontSize: 48, mr: 2, color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Medications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Browse and manage medication database
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Review Requests Preview */}
      {recentReviews.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Recent Review Requests</Typography>
            <Button 
              endIcon={<ArrowForwardIcon />} 
              onClick={() => navigate('/review-requests')}
            >
              View All
            </Button>
          </Box>
          <Grid container spacing={2}>
            {recentReviews.map((review) => (
              <Grid item xs={12} md={4} key={review._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: theme.shadows[4] },
                    borderLeft: 4,
                    borderColor: review.metadata?.aiAnalysis?.patientGuidance?.urgencyLevel === 'urgent' 
                      ? 'error.main' 
                      : review.metadata?.aiAnalysis?.patientGuidance?.urgencyLevel === 'soon'
                      ? 'warning.main'
                      : 'success.main'
                  }}
                  onClick={() => navigate('/review-requests')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ mr: 1, width: 32, height: 32, bgcolor: 'primary.light' }}>
                        <PatientIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {review.patient?.firstName} {review.patient?.lastName}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {review.medicine?.name} - {review.sideEffects?.[0]?.effect}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={review.sideEffects?.[0]?.severity || 'Unknown'} 
                        size="small"
                        color={
                          review.sideEffects?.[0]?.severity?.toLowerCase() === 'severe' ? 'error' :
                          review.sideEffects?.[0]?.severity?.toLowerCase() === 'moderate' ? 'warning' : 'success'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
