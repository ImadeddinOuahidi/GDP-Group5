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
  SmartToy as AIIcon,
  PriorityHigh as CriticalIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';
import Strings from '../../Strings';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import { reportService } from '../../services';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

export default function DoctorHome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user } = AuthContainer.useContainer();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    severe: 0,
    highPriority: 0,
    thisWeek: 0,
    aiProcessed: 0,
    pendingReviews: 0,
  });
  const [aiSeverity, setAiSeverity] = useState([]);
  const [patientSeverity, setPatientSeverity] = useState([]);
  const [priorityDist, setPriorityDist] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the backend aggregation endpoint instead of fetching 100 reports client-side
      const [dashResponse, reviewsResponse] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getPendingReviews()
      ]);
      
      if (dashResponse.success && dashResponse.data) {
        const d = dashResponse.data;
        
        // Parse status distribution into a map
        const statusMap = {};
        (d.reportsByStatus || []).forEach(s => { statusMap[s._id] = s.count; });
        
        setStats({
          total: d.totalReports || 0,
          pending: (statusMap['Submitted'] || 0) + (statusMap['Under Review'] || 0),
          reviewed: statusMap['Reviewed'] || 0,
          severe: d.severeCaseCount || 0,
          highPriority: d.highPriorityCount || 0,
          thisWeek: d.reportsThisWeek || 0,
          aiProcessed: d.aiProcessedCount || 0,
          pendingReviews: d.pendingReviewCount || 0,
        });
        
        setAiSeverity(d.aiSeverityDistribution || []);
        setPatientSeverity(d.patientSeverityDistribution || []);
        setPriorityDist(d.reportsByPriority || []);
        setTopMedicines(d.mostReportedMedicines || []);
      }

      // Load pending review requests
      const reviewsArray = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : (reviewsResponse.data?.reports || []);
      if (reviewsResponse.success && reviewsArray.length >= 0) {
        setPendingReviewCount(reviewsArray.length);
        setRecentReviews(reviewsArray.slice(0, 3));
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
        <Grid item xs={12} sm={6} md={4} lg={2}>
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

        <Grid item xs={12} sm={6} md={4} lg={2}>
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

        <Grid item xs={12} sm={6} md={4} lg={2}>
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
                  {stats.reviewed}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>Reviewed</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0}% completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
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
              <Typography variant="caption" sx={{ opacity: 0.7 }}>AI + patient reported</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CriticalIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.highPriority}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>High Priority</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Urgent review needed</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card 
            sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, #7c4dff, #651fff)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AIIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {stats.aiProcessed}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>AI Analyzed</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.total > 0 ? Math.round((stats.aiProcessed / stats.total) * 100) : 0}% coverage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Severity Distribution + Top Medicines Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Severity Distribution - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                AI Severity Assessment
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {aiSeverity.length > 0 ? `${aiSeverity.reduce((s, i) => s + i.count, 0)} reports analyzed` : 'No AI-analyzed reports yet'}
              </Typography>
              {aiSeverity.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No AI severity data available
                </Typography>
              ) : (() => {
                const PIE_COLORS = { 'Life-threatening': '#d32f2f', Severe: '#f57c00', Moderate: '#1976d2', Mild: '#388e3c' };
                const pieData = aiSeverity
                  .filter(item => item._id && item.count > 0)
                  .map(item => ({ name: item._id || 'Unknown', value: item.count }));
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#9e9e9e'} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val, name) => [`${val} reports`, name]} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Medications - Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Most Reported Medications
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Top 5 medications by ADR report count
              </Typography>
              {topMedicines.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No medication data available
                </Typography>
              ) : (() => {
                const barColors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#0288d1'];
                const barData = topMedicines.map(m => ({
                  name: m.medicineName?.slice(0, 14) || 'Unknown',
                  reports: m.reportCount,
                  full: m.medicineName
                }));
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <RechartsTooltip
                        formatter={(val, _, props) => [`${val} reports`, props.payload.full || props.payload.name]}
                      />
                      <Bar dataKey="reports" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill={barColors[i % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
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
              View All ({pendingReviewCount})
            </Button>
          </Box>
          <Grid container spacing={2}>
            {recentReviews.map((review) => {
              const aiSev = review.metadata?.aiAnalysis?.severity?.level;
              const patientSev = review.sideEffects?.[0]?.severity;
              const urgency = review.metadata?.aiAnalysis?.patientGuidance?.urgencyLevel;
              const borderColor = urgency === 'emergency' || urgency === 'urgent' 
                ? 'error.main' 
                : urgency === 'soon' ? 'warning.main' : 'success.main';
              
              return (
                <Grid item xs={12} md={4} key={review._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: theme.shadows[4] },
                      borderLeft: 4,
                      borderColor
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
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip 
                          label={patientSev || 'Unknown'} 
                          size="small"
                          color={
                            patientSev === 'Life-threatening' || patientSev === 'Severe' ? 'error' :
                            patientSev === 'Moderate' ? 'warning' : 'success'
                          }
                        />
                        {aiSev && aiSev !== patientSev && (
                          <Chip 
                            icon={<AIIcon sx={{ fontSize: 14 }} />}
                            label={`AI: ${aiSev}`}
                            size="small"
                            variant="outlined"
                            color={
                              aiSev === 'Life-threatening' || aiSev === 'Severe' ? 'error' :
                              aiSev === 'Moderate' ? 'warning' : 'success'
                            }
                          />
                        )}
                        {review.priority && (
                          <Chip 
                            label={review.priority}
                            size="small"
                            variant="outlined"
                            color={review.priority === 'Critical' ? 'error' : review.priority === 'High' ? 'warning' : 'default'}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
}
