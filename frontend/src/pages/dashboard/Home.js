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

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isLoading } = AuthContainer.useContainer();
  const [pageLoading, setPageLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    recentReports: [],
    completedProfile: 85,
  });

  // Simulate loading and fetch user stats
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user stats - in real app, fetch from API
        setUserStats({
          totalReports: 12,
          recentReports: [
            { id: 1, medicine: "Aspirin", date: "2025-10-28", status: "reviewed" },
            { id: 2, medicine: "Ibuprofen", date: "2025-10-25", status: "pending" },
          ],
          completedProfile: 85,
        });
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setPageLoading(false);
      }
    };

    if (!isLoading && user) {
      loadUserData();
    } else if (!isLoading) {
      setPageLoading(false);
    }
  }, [user, isLoading]);

  if (isLoading || pageLoading) {
    return (
      <Container maxWidth="lg">
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
      title: "Quick Reporting",
      description: "Report side effects in minutes with our intuitive interface",
      icon: <SpeedIcon color="primary" sx={{ fontSize: 40 }} />,
      color: "primary",
    },
    {
      title: "Secure & Private",
      description: "Your medical data is encrypted and protected",
      icon: <SecurityIcon color="secondary" sx={{ fontSize: 40 }} />,
      color: "secondary",
    },
    {
      title: "Real-time Analysis",
      description: "Doctors get instant alerts for urgent cases",
      icon: <TimelineIcon color="success" sx={{ fontSize: 40 }} />,
      color: "success",
    },
  ];

  const quickActions = [
    {
      title: "Report Side Effect",
      description: "Quickly report any adverse drug reactions you're experiencing",
      icon: <ReportIcon />,
      action: () => navigate("/report"),
      color: "primary",
      variant: "contained",
      priority: true,
    },
    {
      title: "View My Reports",
      description: "Review your submitted reports and their status",
      icon: <HistoryIcon />,
      action: () => navigate("/reports"),
      color: "info",
      variant: "outlined",
      badge: userStats.totalReports > 0 ? userStats.totalReports.toString() : null,
    },
    {
      title: "Settings",
      description: "Manage your profile and notification preferences",
      icon: <SettingsIcon />,
      action: () => navigate("/settings"),
      color: "secondary",
      variant: "outlined",
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Welcome Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              pointerEvents: 'none',
            },
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 60,
                      height: 60,
                    }}
                  >
                    <MedicalIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h1" fontWeight="700">
                      Welcome back, {user?.name || 'Patient'}!
                    </Typography>
                    <Chip 
                      label="Patient Portal" 
                      color="primary" 
                      size="small"
                      sx={{ mt: 0.5 }} 
                    />
                  </Box>
                </Stack>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  SafeMed ADR - Adverse Drug Reaction Reporting System
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 600 }}>
                  Report medicine side effects quickly and securely. 
                  Help healthcare professionals identify urgent cases and keep patients safe.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'background.paper', boxShadow: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Profile Completion
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
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Complete your profile for better reporting
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  border: action.priority ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8],
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
                    label="Priority"
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
              Recent Activity
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
                              Side effect report for {report.medicine}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Submitted on {new Date(report.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={report.status === 'reviewed' ? 'Reviewed' : 'Pending'}
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
                  >
                    View All Reports
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}

        {/* Features Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Why Choose SafeMed ADR?
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center',
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
          elevation={2}
          sx={{
            p: 3,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            borderRadius: 3,
            border: `2px solid ${theme.palette.error.dark}`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <SecurityIcon sx={{ fontSize: 28, mt: 0.5, flexShrink: 0 }} />
            <Box>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Emergency Notice
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                <strong>Important:</strong> If you're experiencing a medical emergency, 
                call emergency services immediately (911). This system is designed for 
                reporting non-emergency adverse drug reactions only.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="inherit"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'inherit',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                  href="tel:911"
                >
                  Call 911
                </Button>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
