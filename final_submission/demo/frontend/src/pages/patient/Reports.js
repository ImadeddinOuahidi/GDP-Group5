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
  Paper,
  Skeleton,
  useTheme,
  Fade,
  Pagination,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Assessment as SeverityIcon,
  Psychology as AIIcon,
  PersonSearch as DoctorIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { reportService } from '../../services';
import { useI18n } from '../../i18n';

const statusConfig = {
  'draft': {
    color: 'default',
    icon: <PendingIcon />,
    label: 'status.draft'
  },
  'submitted': {
    color: 'warning',
    icon: <PendingIcon />,
    label: 'status.submitted'
  },
  'under review': {
    color: 'info',
    icon: <WarningIcon />,
    label: 'status.underReview'
  },
  'reviewed': {
    color: 'success',
    icon: <CheckCircleIcon />,
    label: 'status.reviewed'
  },
  'closed': {
    color: 'success',
    icon: <CheckCircleIcon />,
    label: 'status.closed'
  },
  'rejected': {
    color: 'error',
    icon: <ErrorIcon />,
    label: 'status.rejected'
  },
  // Legacy mappings
  'pending': {
    color: 'warning',
    icon: <PendingIcon />,
    label: 'reports.pendingReviewLabel'
  },
  'under_review': {
    color: 'info',
    icon: <WarningIcon />,
    label: 'status.underReview'
  },
  'confirmed': {
    color: 'success',
    icon: <CheckCircleIcon />,
    label: 'reports.confirmed'
  },
  'archived': {
    color: 'default',
    icon: <HistoryIcon />,
    label: 'reports.archived'
  }
};

const severityConfig = {
  'mild': { color: 'success', label: 'severity.mild' },
  'moderate': { color: 'warning', label: 'severity.moderate' },
  'severe': { color: 'error', label: 'severity.severe' },
  'life-threatening': { color: 'error', label: 'severity.lifeThreatening' }
};

// Real reports data will be loaded from the API

export default function Reports() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const response = await reportService.getAllReports({
          page: page,
          limit: 10,
          sortBy: 'reportDetails.reportDate',
          sortOrder: 'desc'
        });
        
        console.log('API Response:', response); // Debug log
        
        // Handle both response formats: { success: true, data: [] } and { status: 'success', data: [] }
        const isSuccess = response.success === true || response.status === 'success';
        const reportData = response.data || [];
        
        if (isSuccess && reportData.length > 0) {
          // Transform the API data to match the expected format
          const transformedReports = reportData.map(report => ({
            id: report._id,
            medicine: report.medicine?.name || t('reports.unknownMedicine'),
            brandName: report.medicine?.genericName || report.medicine?.name || t('reports.unknownBrand'),
            dosage: report.medicationUsage?.dosage?.amount || t('reports.unknownDosage'),
            sideEffect: report.sideEffects?.[0]?.effect || t('reports.unknownSideEffect'),
            severity: report.sideEffects?.[0]?.severity?.toLowerCase() || 'mild',
            status: report.status?.toLowerCase() || 'pending',
            dateSubmitted: report.reportDetails?.reportDate || report.createdAt,
            dateReviewed: report.reviewDetails?.reviewDate || null,
            reviewedBy: report.reviewedBy?.firstName && report.reviewedBy?.lastName 
              ? `${report.reviewedBy.firstName} ${report.reviewedBy.lastName}` 
              : null,
            description: report.sideEffects?.[0]?.description || report.description || t('reports.noDescriptionProvided'),
            outcome: report.reportDetails?.outcome || t('reports.underInvestigation'),
            reportId: `ADR-${report._id?.slice(-8)?.toUpperCase()}` || `ADR-${Date.now()}`,
            // AI Analysis fields
            aiProcessed: report.metadata?.aiProcessed || false,
            aiSeverity: report.metadata?.aiAnalysis?.severity || null,
            aiUrgency: report.metadata?.aiAnalysis?.patientGuidance?.urgencyLevel || null,
            aiRecommendation: report.metadata?.aiAnalysis?.patientGuidance?.recommendation || null,
            // Doctor Review fields
            doctorReviewRequested: report.doctorReview?.requested || false,
            doctorReviewStatus: report.doctorReview?.status || null,
            doctorRemarks: report.doctorReview?.remarks || null,
          }));
          
          setReports(transformedReports);
          const total = response.meta?.pagination?.total || response.total || transformedReports.length;
          setTotalPages(Math.ceil(total / 10));
          console.log('Transformed reports:', transformedReports);
        } else {
          // No data returned from API
          console.warn('No data returned from API');
          setReports([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        // Set empty array on error - no fallback to mock data
        setReports([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [page, t]);

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
    <Container maxWidth="xl" className="organic-fade-in">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="700">
              {t('reports.viewMyReports')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('reports.manageReportsDescription')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/report')}
            sx={{ fontWeight: 600, borderRadius: 999 }}
          >
            {t('home.newReport')}
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: '16px',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1.2, width: 46, height: 46 }}>
                  <ReportIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {reports.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.totalReports')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '16px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1.2, width: 46, height: 46 }}>
                  <PendingIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {reports.filter(r => r.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('reports.pendingReviewLabel')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '16px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1.2, width: 46, height: 46 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {reports.filter(r => r.status === 'reviewed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('status.reviewed')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '16px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1.2, width: 46, height: 46 }}>
                  <WarningIcon />
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {reports.filter(r => r.status === 'under_review').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('status.underReview')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: 1,
            borderColor: 'divider',
            borderRadius: { xs: 3, md: 4 },
            backdropFilter: 'blur(6px)',
            backgroundColor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.55 : 0.72),
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('reports.searchReportsPlaceholder')}
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
                <InputLabel>{t('reports.status')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('reports.status')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">{t('reports.allStatus')}</MenuItem>
                  <MenuItem value="pending">{t('reports.pendingReviewLabel')}</MenuItem>
                  <MenuItem value="under_review">{t('status.underReview')}</MenuItem>
                  <MenuItem value="reviewed">{t('status.reviewed')}</MenuItem>
                  <MenuItem value="confirmed">{t('reports.confirmed')}</MenuItem>
                  <MenuItem value="rejected">{t('status.rejected')}</MenuItem>
                  <MenuItem value="archived">{t('reports.archived')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('reports.severity')}</InputLabel>
                <Select
                  value={severityFilter}
                  label={t('reports.severity')}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="all">{t('reports.allSeverity')}</MenuItem>
                  <MenuItem value="mild">{t('severity.mild')}</MenuItem>
                  <MenuItem value="moderate">{t('severity.moderate')}</MenuItem>
                  <MenuItem value="severe">{t('severity.severe')}</MenuItem>
                  <MenuItem value="life-threatening">{t('severity.lifeThreatening')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('reports.sortBy')}</InputLabel>
                <Select
                  value={sortBy}
                  label={t('reports.sortBy')}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date_desc">{t('reports.newestFirst')}</MenuItem>
                  <MenuItem value="date_asc">{t('reports.oldestFirst')}</MenuItem>
                  <MenuItem value="medicine">{t('reports.medicineAZ')}</MenuItem>
                  <MenuItem value="severity">{t('reports.severityHighLow')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('reports.reportsShown', { filtered: sortedReports.length, total: reports.length })}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Reports List */}
        {sortedReports.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: 1, borderColor: 'divider', borderRadius: 4 }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('reports.noReportsFound')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {reports.length === 0 
                ? t('reports.noReportsSubmittedYet')
                : t('reports.adjustSearchOrFilters')
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/report')}
            >
              {t('reports.createFirstReport')}
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {sortedReports.map((report, index) => (
              <Fade in timeout={300 + index * 100} key={report.id}>
                <Card
                  onClick={() => navigate(`/reports/${report.id}`)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: '16px',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      borderColor: 'primary.main',
                    },
                    border: '1px solid',
                    borderColor: 'divider',
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
                          </Stack>

                          {/* Side Effect Description */}
                          <Box>
                            <Typography variant="body1" fontWeight="500" gutterBottom>
                              {t('doctor.sideEffect')}: {report.sideEffect}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {report.description}
                            </Typography>
                          </Box>

                          {/* Status and Severity */}
                          <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Chip
                              icon={statusConfig[report.status]?.icon}
                              label={t(statusConfig[report.status]?.label || 'common.unknown')}
                              color={statusConfig[report.status]?.color}
                              variant="outlined"
                            />
                            <Chip
                              icon={<SeverityIcon />}
                              label={t(severityConfig[report.severity]?.label || 'common.unknown')}
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
                                {t('reports.submittedOn', { date: new Date(report.dateSubmitted).toLocaleDateString() })}
                              </Typography>
                            </Stack>
                            {report.dateReviewed && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {t('reports.reviewedOn', { date: new Date(report.dateReviewed).toLocaleDateString() })}
                                </Typography>
                              </Stack>
                            )}
                            {report.reviewedBy && (
                              <Typography variant="body2" color="text.secondary">
                                {t('reports.reviewedBy', { name: report.reviewedBy })}
                              </Typography>
                            )}
                          </Stack>

                          {/* Outcome */}
                          <Box>
                            {/* AI Analysis Status */}
                            {report.aiProcessed ? (
                              <Paper 
                                sx={{ 
                                  p: 1.5, 
                                  mb: 1, 
                                  bgcolor: report.aiUrgency === 'emergency' ? 'error.50' :
                                           report.aiUrgency === 'urgent' ? 'warning.50' :
                                           report.aiUrgency === 'soon' ? 'info.50' : 'success.50',
                                  border: '1px solid',
                                  borderColor: report.aiUrgency === 'emergency' ? 'error.main' :
                                              report.aiUrgency === 'urgent' ? 'warning.main' :
                                              report.aiUrgency === 'soon' ? 'info.main' : 'success.main',
                                  borderRadius: 2,
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <AIIcon fontSize="small" color={
                                    report.aiUrgency === 'emergency' ? 'error' :
                                    report.aiUrgency === 'urgent' ? 'warning' :
                                    report.aiUrgency === 'soon' ? 'info' : 'success'
                                  } />
                                  <Typography variant="body2" fontWeight="500">
                                    {t('reports.aiUrgencyLabel', { urgency: report.aiUrgency?.charAt(0).toUpperCase() + report.aiUrgency?.slice(1) || t('reports.analyzed') })}
                                  </Typography>
                                </Stack>
                              </Paper>
                            ) : (
                              <Paper sx={{ p: 1.5, mb: 1, bgcolor: 'grey.100', borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <PendingIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {t('reports.aiAnalysisPending')}
                                  </Typography>
                                </Stack>
                              </Paper>
                            )}

                            {/* Doctor Review Status */}
                            {report.doctorReviewStatus === 'completed' ? (
                              <Paper sx={{ p: 1.5, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main', borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <DoctorIcon fontSize="small" color="success" />
                                  <Typography variant="body2" fontWeight="500" color="success.dark">
                                    {t('reports.doctorReviewed')}
                                  </Typography>
                                </Stack>
                              </Paper>
                            ) : report.doctorReviewRequested ? (
                              <Paper sx={{ p: 1.5, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main', borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <DoctorIcon fontSize="small" color="info" />
                                  <Typography variant="body2" color="info.dark">
                                    {t('reports.reviewRequested')}
                                  </Typography>
                                </Stack>
                              </Paper>
                            ) : null}
                          </Box>

                          {/* View Details Arrow */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Chip 
                              label={t('reports.viewDetails')} 
                              icon={<ArrowIcon />} 
                              color="primary" 
                              variant="outlined"
                              size="small"
                            />
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
      </Box>
    </Container>
  );
}