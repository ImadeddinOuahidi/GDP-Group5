import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Paper,
  Alert,
  Chip,
  useTheme,
  alpha,
  Skeleton,
  Divider,
  Stack,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  Report as ReportIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  MedicalServices as MedicalIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import AuthContainer from "../../store/containers/AuthContainer";
import reportService from "../../services/reportService";
import { useI18n } from '../../i18n';

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, isLoading } = AuthContainer.useContainer();
  const [pageLoading, setPageLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    recentReports: [],
    completedProfile: 85,
  });
  const [error, setError] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Load real user stats from API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const result = await reportService.getAllReports({ limit: 100, sortBy: 'reportDetails.reportDate', sortOrder: 'desc' });

        // Handle both real API format { success, data: [...], meta: { pagination: { total } } }
        // and demo-mode format { status: 'success', data: [...], total: N }
        const reports = Array.isArray(result?.data) ? result.data : [];
        const total = result?.total ?? result?.meta?.pagination?.total ?? reports.length;

        setUserStats({
          totalReports: total,
          recentReports: reports.slice(0, 3).map(r => ({
            id: r._id,
            medicine: r.medicine?.name || t('reports.unknownMedicine'),
            date: (r.reportDetails?.reportDate || r.createdAt || '').split('T')[0],
            status: (r.status || t('status.submitted')).toLowerCase(),
            severity: r.sideEffects?.[0]?.severity?.toLowerCase() || t('severity.mild').toLowerCase(),
          })),
          completedProfile: 85,
        });

        const pendingCount = reports.filter(r => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'submitted').length;
        setWelcomeMessage(t('home.welcomePendingReports', {
          name: user?.firstName || t('common.user'),
          count: pendingCount,
        }));
      } catch (error) {
        console.error("Error loading user data:", error);
        setError(t('home.loadDashboardError'));
      } finally {
        setPageLoading(false);
      }
    };

    if (!isLoading && user) {
      loadUserData();
    } else if (!isLoading) {
      setPageLoading(false);
    }
  }, [user, isLoading, t]);

  if (isLoading || pageLoading) {
    return (
      <Container maxWidth="xl" className="organic-fade-in">
        <Box sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  const features = [
    {
      title: t('home.quickReportingTitle'),
      description: t('home.quickReportingDesc'),
      icon: <SpeedIcon color="primary" sx={{ fontSize: 40 }} />,
      color: "primary",
    },
    {
      title: t('home.securePrivateTitle'),
      description: t('home.securePrivateDesc'),
      icon: <SecurityIcon color="secondary" sx={{ fontSize: 40 }} />,
      color: "secondary",
    },
    {
      title: t('home.realtimeAnalysisTitle'),
      description: t('home.realtimeAnalysisDesc'),
      icon: <TimelineIcon color="success" sx={{ fontSize: 40 }} />,
      color: "success",
    },
  ];

  const quickActions = [
    {
      title: t('reports.submitReport'),
      description: t('home.quickActionReportDescription'),
      icon: <ReportIcon />,
      action: () => navigate("/report"),
      color: "primary",
      variant: "contained",
      priority: true,
    },
    {
      title: t('reports.viewMyReports'),
      description: t('home.quickActionReportsDescription'),
      icon: <HistoryIcon />,
      action: () => navigate("/reports"),
      color: "info",
      variant: "outlined",
      badge: userStats.totalReports > 0 ? userStats.totalReports.toString() : null,
    },
    {
      title: t('navigation.settings'),
      description: t('home.quickActionSettingsDescription'),
      icon: <SettingsIcon />,
      action: () => navigate("/settings"),
      color: "secondary",
      variant: "outlined",
    },
  ];

  return (
    <Container maxWidth="xl" className="organic-fade-in">
      <Box sx={{ py: 4 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {/* Welcome Message */}
        {welcomeMessage && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setWelcomeMessage('')}>
            {welcomeMessage}
          </Alert>
        )}

        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.74),
            borderRadius: '18px',
            border: 1,
            borderColor: 'divider',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      width: 60,
                      height: 60,
                    }}
                  >
                    <MedicalIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h1" fontWeight="700">
                      {t('dashboard.welcomeBack', { name: user?.name || t('common.patient') })}
                    </Typography>
                    <Chip 
                      label={t('home.patientPortalTag')} 
                      color="primary" 
                      size="small"
                      sx={{ mt: 0.5 }} 
                    />
                  </Box>
                </Stack>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  {`${t('common.appName')} - ${t('common.subtitle')}`}
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 600 }}>
                  {t('home.heroDescription')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'background.paper', boxShadow: 0, border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('home.profileCompletion')}
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" component="div" color="primary.main" fontWeight="bold">
                      {userStats.completedProfile}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={userStats.completedProfile}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {t('home.completeProfileHint')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          {t('home.quickActions')}
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                    borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  border: 1,
                  borderColor: action.priority ? 'primary.main' : 'divider',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[4],
                  },
                  '&:active': {
                    transform: 'translateY(-4px)',
                  },
                }}
                onClick={action.action}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    action.action();
                  }
                }}
                aria-label={action.title}
              >
                {action.priority && (
                  <Chip
                    label={t('common.priority')}
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                    }}
                  />
                )}
                {action.badge && (
                  <Chip
                    label={action.badge}
                    color={action.color}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: action.priority || action.badge ? 5 : 4 }}>
                  <Box 
                    sx={{ 
                      color: `${action.color}.main`, 
                      mb: 2,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {React.cloneElement(action.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom fontWeight="600">
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={action.variant}
                    color={action.color}
                    size="large"
                    startIcon={action.icon}
                    sx={{
                      fontWeight: 600,
                      py: 1.5,
                      borderRadius: 999,
                    }}
                  >
                    {action.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity Section */}
        {userStats.recentReports.length > 0 && (
          <>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              {t('home.recentActivity')}
            </Typography>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Stack spacing={2}>
                  {userStats.recentReports.map((report, index) => (
                    <Box key={report.id}>
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar 
                            sx={{ 
                              bgcolor: report.status === 'reviewed' ? 'success.main' : 'warning.main',
                              width: 32,
                              height: 32,
                            }}
                          >
                            {report.status === 'reviewed' ? (
                              <CheckCircleIcon sx={{ fontSize: 18 }} />
                            ) : (
                              <TrendingUpIcon sx={{ fontSize: 18 }} />
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {t('home.sideEffectReportFor', { medicine: report.medicine })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('home.submittedOn', { date: new Date(report.date).toLocaleDateString() })}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={report.status === 'reviewed' ? t('status.reviewed') : t('status.submitted')}
                          color={report.status === 'reviewed' ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      {index < userStats.recentReports.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/reports")}
                    startIcon={<HistoryIcon />}
                    sx={{ borderRadius: 999 }}
                  >
                    {t('home.viewAllReports')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {/* Features Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          {t('home.whyChoose')}
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6],
                    '& .feature-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box 
                    className="feature-icon"
                    sx={{ 
                      mb: 3,
                      transition: 'transform 0.3s ease-in-out',
                      display: 'inline-block',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Important Notice */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: 'text.primary',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.error.main, 0.35)}`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <SecurityIcon sx={{ fontSize: 28, mt: 0.5, flexShrink: 0 }} />
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="600">
                {t('emergency.title')}
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {t('emergency.text')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  href="tel:911"
                >
                  {t('emergency.call911')}
                </Button>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
