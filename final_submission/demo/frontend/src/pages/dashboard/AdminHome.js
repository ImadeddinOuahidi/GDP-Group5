import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  ArrowForward as ArrowForwardIcon,
  Assessment as TotalIcon,
  CheckCircle as CompletedIcon,
  LocalHospital as SevereIcon,
  LocalPharmacy as MedicationIcon,
  PriorityHigh as PriorityIcon,
  RateReview as ReviewIcon,
  SmartToy as AIIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';
import { useI18n } from '../../i18n';
import { reportService } from '../../services';

const getSeverityColor = (theme, severity) => {
  switch (severity) {
    case 'Life-threatening':
      return theme.palette.error.dark;
    case 'Severe':
      return theme.palette.error.main;
    case 'Moderate':
      return theme.palette.warning.main;
    case 'Mild':
      return theme.palette.success.main;
    default:
      return theme.palette.text.secondary;
  }
};

export default function AdminHome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const { user } = AuthContainer.useContainer();
  const [loading, setLoading] = useState(true);
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
  const [topMedicines, setTopMedicines] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, reviewsResponse] = await Promise.all([
          reportService.getDashboardStats(),
          reportService.getPendingReviews(),
        ]);

        const dashboard = dashboardResponse?.data;
        if (dashboard) {
          const statusMap = {};
          (dashboard.reportsByStatus || []).forEach((entry) => {
            statusMap[entry._id] = entry.count;
          });

          setStats({
            total: dashboard.totalReports || 0,
            pending: (statusMap.Submitted || 0) + (statusMap['Under Review'] || 0),
            reviewed: statusMap.Reviewed || 0,
            severe: dashboard.severeCaseCount || 0,
            highPriority: dashboard.highPriorityCount || 0,
            thisWeek: dashboard.reportsThisWeek || 0,
            aiProcessed: dashboard.aiProcessedCount || 0,
            pendingReviews: dashboard.pendingReviewCount || 0,
          });
          setTopMedicines(dashboard.mostReportedMedicines || []);
        }

        const reviewItems = Array.isArray(reviewsResponse?.data)
          ? reviewsResponse.data
          : Array.isArray(reviewsResponse?.data?.reports)
            ? reviewsResponse.data.reports
            : [];
        setRecentReviews(reviewItems.slice(0, 5));
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const coveragePercent = stats.total > 0 ? Math.round((stats.aiProcessed / stats.total) * 100) : 0;
  const reviewedPercent = stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0;

  const statCards = useMemo(() => [
    {
      key: 'total',
      label: t('dashboard.totalReports'),
      value: stats.total,
      caption: t('doctor.thisWeekReports', { count: stats.thisWeek }),
      icon: <TotalIcon sx={{ fontSize: 34, color: 'primary.main' }} />,
      tint: alpha(theme.palette.primary.main, 0.1),
      border: alpha(theme.palette.primary.main, 0.3),
      valueColor: 'primary.main',
    },
    {
      key: 'queue',
      label: t('admin.reviewQueue'),
      value: stats.pendingReviews || recentReviews.length,
      caption: t('admin.queueCountLabel', { count: stats.pendingReviews || recentReviews.length }),
      icon: <ReviewIcon sx={{ fontSize: 34, color: 'warning.main' }} />,
      tint: alpha(theme.palette.warning.main, 0.12),
      border: alpha(theme.palette.warning.main, 0.35),
      valueColor: 'warning.dark',
    },
    {
      key: 'urgent',
      label: t('admin.urgentCases'),
      value: stats.highPriority,
      caption: t('doctor.urgentReviewNeeded'),
      icon: <PriorityIcon sx={{ fontSize: 34, color: 'error.main' }} />,
      tint: alpha(theme.palette.error.main, 0.1),
      border: alpha(theme.palette.error.main, 0.32),
      valueColor: 'error.main',
    },
    {
      key: 'severe',
      label: t('doctor.severeCases'),
      value: stats.severe,
      caption: t('doctor.aiAndPatientReported'),
      icon: <SevereIcon sx={{ fontSize: 34, color: 'secondary.main' }} />,
      tint: alpha(theme.palette.secondary.main, 0.12),
      border: alpha(theme.palette.secondary.main, 0.35),
      valueColor: 'secondary.dark',
    },
    {
      key: 'reviewed',
      label: t('admin.reviewedReports'),
      value: stats.reviewed,
      caption: t('admin.reviewedCaption', { percent: reviewedPercent }),
      icon: <CompletedIcon sx={{ fontSize: 34, color: 'success.main' }} />,
      tint: alpha(theme.palette.success.main, 0.1),
      border: alpha(theme.palette.success.main, 0.32),
      valueColor: 'success.dark',
    },
    {
      key: 'coverage',
      label: t('admin.aiCoverage'),
      value: `${coveragePercent}%`,
      caption: t('admin.aiCoverageCaption', { processed: stats.aiProcessed, total: stats.total }),
      icon: <AIIcon sx={{ fontSize: 34, color: 'info.main' }} />,
      tint: alpha(theme.palette.info.main, 0.1),
      border: alpha(theme.palette.info.main, 0.32),
      valueColor: 'info.main',
    },
  ], [coveragePercent, recentReviews.length, reviewedPercent, stats, t, theme.palette]);

  const lanes = useMemo(() => [
    {
      key: 'queue',
      title: t('admin.laneQueueTitle'),
      description: t('admin.laneQueueDescription'),
      stat: `${stats.pendingReviews || recentReviews.length}`,
      footer: t('admin.openQueue'),
      action: () => navigate('/review-requests'),
      icon: <ReviewIcon sx={{ color: 'warning.main' }} />,
      tint: alpha(theme.palette.warning.main, 0.08),
    },
    {
      key: 'catalog',
      title: t('admin.laneCatalogTitle'),
      description: t('admin.laneCatalogDescription'),
      stat: topMedicines[0]?.medicineName || t('common.notAvailable'),
      footer: t('admin.manageCatalog'),
      action: () => navigate('/medications'),
      icon: <MedicationIcon sx={{ color: 'primary.main' }} />,
      tint: alpha(theme.palette.primary.main, 0.08),
    },
    {
      key: 'analytics',
      title: t('admin.laneAnalyticsTitle'),
      description: t('admin.laneAnalyticsDescription'),
      stat: `${stats.thisWeek}`,
      footer: t('admin.openAnalytics'),
      action: () => navigate('/dashboard'),
      icon: <AIIcon sx={{ color: 'info.main' }} />,
      tint: alpha(theme.palette.info.main, 0.08),
    },
  ], [navigate, recentReviews.length, stats.pendingReviews, stats.thisWeek, t, theme.palette, topMedicines]);

  const formatDate = (value) => {
    if (!value) {
      return t('common.notAvailable');
    }
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
    } catch (error) {
      return t('common.notAvailable');
    }
  };

  const getPatientName = (report) => {
    const firstName = report?.patient?.firstName;
    const lastName = report?.patient?.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    return fullName || t('common.notAvailable');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 } }} className="organic-fade-in">
      <Card
        sx={{
          mb: 3,
          borderRadius: '22px',
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          background: `linear-gradient(140deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Chip
                icon={<AdminIcon />}
                label={t('navigation.adminWorkspace')}
                color="primary"
                variant="outlined"
                sx={{ mb: 2, borderRadius: 999 }}
              />
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {t('admin.commandCenter')}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {t('admin.welcome', { name: user?.firstName || user?.name || t('common.admin') })}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                {t('admin.subtitle')}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/review-requests')}
              sx={{ borderRadius: 999, px: 2.5, py: 1.15 }}
            >
              {t('admin.openQueue')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {(stats.pendingReviews || recentReviews.length) > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
          {t('admin.queueNotice', { count: stats.pendingReviews || recentReviews.length })}
        </Alert>
      )}

      {stats.highPriority > 0 && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: 3 }}>
          {t('admin.urgentNotice', { count: stats.highPriority })}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.key}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '18px',
                border: 1,
                borderColor: card.border,
                backgroundColor: card.tint,
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8), color: 'inherit' }}>
                    {card.icon}
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: card.valueColor }}>
                    {card.value}
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {card.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.caption}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        {t('admin.operationalLanes')}
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {lanes.map((lane) => (
          <Grid item xs={12} md={4} key={lane.key}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '18px',
                border: 1,
                borderColor: 'divider',
                backgroundColor: lane.tint,
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
                    {lane.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {lane.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lane.stat}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  {lane.description}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Button endIcon={<ArrowForwardIcon />} onClick={lane.action}>
                    {lane.footer}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: '18px', height: '100%' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('admin.queueActivity')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.queueActivityDescription')}
                  </Typography>
                </Box>
                <Button onClick={() => navigate('/review-requests')}>{t('common.viewAll')}</Button>
              </Stack>

              {recentReviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  {t('admin.noQueuedReports')}
                </Typography>
              ) : (
                <List disablePadding>
                  {recentReviews.map((report, index) => {
                    const severity = report?.sideEffects?.[0]?.severity || report?.metadata?.aiAnalysis?.severity;
                    const status = report?.status || t('common.notAvailable');
                    const medicineName = report?.medicine?.name || t('common.notAvailable');
                    return (
                      <React.Fragment key={report._id || `${medicineName}-${index}`}>
                        <ListItem
                          disableGutters
                          secondaryAction={(
                            <Button size="small" onClick={() => navigate(`/reports/${report._id}`)}>
                              {t('doctor.viewFullReport')}
                            </Button>
                          )}
                          sx={{ py: 1.4 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}>
                              <ReviewIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={medicineName}
                            secondary={(
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {t('admin.patient')}: {getPatientName(report)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t('admin.submitted', { date: formatDate(report?.createdAt || report?.reportDetails?.reportDate) })}
                                </Typography>
                              </Stack>
                            )}
                          />
                          <Stack direction="row" spacing={1} sx={{ ml: 2, mr: 8 }} useFlexGap flexWrap="wrap">
                            <Chip
                              size="small"
                              label={status}
                              variant="outlined"
                              sx={{ borderRadius: 999 }}
                            />
                            <Chip
                              size="small"
                              label={severity || t('common.notAvailable')}
                              sx={{
                                borderRadius: 999,
                                bgcolor: alpha(getSeverityColor(theme, severity), 0.12),
                                color: getSeverityColor(theme, severity),
                              }}
                            />
                          </Stack>
                        </ListItem>
                        {index < recentReviews.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: '18px', height: '100%' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('admin.topReportedMedications')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.topReportedMedicationsDescription')}
                  </Typography>
                </Box>
                <Button onClick={() => navigate('/medications')}>{t('admin.manageCatalog')}</Button>
              </Stack>

              {topMedicines.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  {t('admin.noMedicationSignals')}
                </Typography>
              ) : (
                <List disablePadding>
                  {topMedicines.slice(0, 5).map((medicine, index) => (
                    <React.Fragment key={medicine.medicineName || `${medicine.reportCount}-${index}`}>
                      <ListItem disableGutters sx={{ py: 1.4 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.12), color: 'secondary.main' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={medicine.medicineName || t('common.notAvailable')}
                          secondary={medicine.genericName || t('common.notAvailable')}
                        />
                        <Chip label={medicine.reportCount || 0} color="primary" variant="outlined" />
                      </ListItem>
                      {index < Math.min(topMedicines.length, 5) - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
