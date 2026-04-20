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
  TextField,
  InputAdornment,
  MenuItem,
  Alert,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  RateReview as ReviewIcon,
  Person as PatientIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicineIcon,
  Psychology as AIIcon,
  Schedule as ScheduleIcon,
  VerifiedUser as VerifiedIcon,
  Link as LinkIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services';
import { useI18n } from '../../i18n';

export default function ReviewRequests() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [duplicateResults, setDuplicateResults] = useState({});
  const [actionState, setActionState] = useState({});
  const [filters, setFilters] = useState({
    severity: '',
    fromDate: '',
    toDate: '',
    drugName: '',
  });
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewRecommendation, setReviewRecommendation] = useState('');
  const [reviewAction, setReviewAction] = useState('none');
  const [agreedWithAI, setAgreedWithAI] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  const buildPendingReviewParams = (activeFilters = filters) => ({
    severity: activeFilters.severity || undefined,
    fromDate: activeFilters.fromDate || undefined,
    toDate: activeFilters.toDate || undefined,
    drugName: activeFilters.drugName?.trim() || undefined,
  });

  const loadPendingReviews = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getPendingReviews(buildPendingReviewParams(activeFilters));
      if (response.success && response.data?.reports) {
        setPendingReviews(response.data.reports);
      } else {
        setPendingReviews([]);
      }
    } catch (err) {
      console.error('Error loading pending reviews:', err);
      setError(t('doctor.loadReviewRequestsFailed'));
      setPendingReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingReviews(filters);
    // Intentionally track scalar filter fields to avoid unnecessary reruns from object identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.severity, filters.fromDate, filters.toDate, filters.drugName]);

  const hasActiveFilters = Boolean(
    filters.severity || filters.fromDate || filters.toDate || filters.drugName.trim()
  );

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      severity: '',
      fromDate: '',
      toDate: '',
      drugName: '',
    });
  };

  const handleOpenReviewDialog = (report) => {
    setSelectedReport(report);
    setReviewRemarks('');
    setReviewRecommendation('');
    setReviewAction('none');
    setAgreedWithAI(true);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedReport) return;
    
    try {
      setSubmittingReview(true);
      await reportService.submitDoctorReview(selectedReport._id, {
        remarks: reviewRemarks,
        recommendation: reviewRecommendation,
        actionRequired: reviewAction,
        agreedWithAI: agreedWithAI,
      });
      setReviewDialogOpen(false);
      setSelectedReport(null);
      // Refresh the list
      await loadPendingReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.message || t('doctor.submitReviewFailed'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReprocessAi = async (reportId) => {
    try {
      setActionState((prev) => ({ ...prev, [`reprocess:${reportId}`]: true }));
      await reportService.reprocessAiAnalysis(reportId);
      setFeedback({ severity: 'success', message: t('doctor.aiReprocessQueued') });
      await loadPendingReviews();
    } catch (err) {
      console.error('Error reprocessing AI analysis:', err);
      setFeedback({ severity: 'error', message: err.message || t('doctor.aiReprocessFailed') });
    } finally {
      setActionState((prev) => ({ ...prev, [`reprocess:${reportId}`]: false }));
    }
  };

  const handleLoadDuplicates = async (reportId) => {
    try {
      setDuplicateResults((prev) => ({
        ...prev,
        [reportId]: { ...(prev[reportId] || {}), loading: true, error: null },
      }));
      const response = await reportService.findDuplicates(reportId);
      const payload = response.data || {};
      setDuplicateResults((prev) => ({
        ...prev,
        [reportId]: {
          loading: false,
          loaded: true,
          analysisSource: payload.analysisSource,
          duplicates: payload.duplicates || [],
        },
      }));
    } catch (err) {
      console.error('Error loading duplicates:', err);
      setDuplicateResults((prev) => ({
        ...prev,
        [reportId]: {
          loading: false,
          loaded: true,
          error: err.message || t('doctor.loadDuplicatesFailed'),
          duplicates: [],
        },
      }));
    }
  };

  const handleDuplicateDecision = async ({ action, candidateId, originalReportId }) => {
    const actionKey = `${action}:${candidateId}`;

    try {
      setActionState((prev) => ({ ...prev, [actionKey]: true }));

      if (action === 'merge') {
        await reportService.mergeDuplicate(candidateId, originalReportId);
      } else {
        await reportService.flagDuplicate(candidateId, originalReportId);
      }

      setFeedback({
        severity: 'success',
        message: action === 'merge' ? t('doctor.duplicateMerged') : t('doctor.duplicateFlagged'),
      });

      await Promise.all([
        handleLoadDuplicates(originalReportId),
        loadPendingReviews(),
      ]);
    } catch (err) {
      console.error('Error updating duplicate decision:', err);
      setFeedback({ severity: 'error', message: err.message || t('doctor.duplicateActionFailed') });
    } finally {
      setActionState((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'emergency': case 'urgent': return 'error';
      case 'soon': return 'warning';
      case 'routine': return 'success';
      default: return 'info';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'mild': return 'success';
      case 'moderate': return 'warning';
      case 'severe': 
      case 'life-threatening': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getAiStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'failed': return 'error';
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: 1280,
        mx: 'auto',
      }}
      className="organic-fade-in"
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2, md: 2.6 },
          borderRadius: '16px',
          border: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.44 : 0.74),
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReviewIcon color="primary" />
          {t('navigation.reviewRequests')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('doctor.reviewRequestsSubtitle')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Card elevation={0} sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: '16px' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                label={t('dashboard.drugNameFilter')}
                placeholder={t('dashboard.searchPlaceholder')}
                value={filters.drugName}
                onChange={handleFilterChange('drugName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                label={t('reports.severity')}
                value={filters.severity}
                onChange={handleFilterChange('severity')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="Life-threatening">{t('severity.lifeThreatening')}</MenuItem>
                <MenuItem value="Severe">{t('severity.severe')}</MenuItem>
                <MenuItem value="Moderate">{t('severity.moderate')}</MenuItem>
                <MenuItem value="Mild">{t('severity.mild')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('dashboard.dateFrom')}
                value={filters.fromDate}
                onChange={handleFilterChange('fromDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('dashboard.dateTo')}
                value={filters.toDate}
                onChange={handleFilterChange('toDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {hasActiveFilters && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outlined" color="inherit" onClick={handleClearFilters} sx={{ borderRadius: 999 }}>
                    {t('doctor.clearFilters')}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {pendingReviews.length === 0 ? (
        <Card elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider' }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>{t('doctor.noPendingReviews')}</Typography>
          <Typography color="text.secondary">
            {t('doctor.noPendingReviewsDescription')}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {pendingReviews.map((report) => {
            const aiAnalysis = report.metadata?.aiAnalysis;
            const patientGuidance = aiAnalysis?.patientGuidance;
            const patientName = report.patient?.firstName && report.patient?.lastName 
              ? `${report.patient.firstName} ${report.patient.lastName}` 
              : t('common.anonymous');
            const sideEffect = report.sideEffects?.[0];

            return (
              <Grid item xs={12} key={report._id}>
                <Card 
                  sx={{ 
                    borderLeft: 4, 
                    borderColor: patientGuidance?.urgencyLevel === 'urgent' ? 'error.main' 
                      : patientGuidance?.urgencyLevel === 'soon' ? 'warning.main' 
                      : 'success.main',
                    borderRadius: '16px',
                    '&:hover': { boxShadow: 3 },
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <CardContent>
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                          <PatientIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{patientName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('doctor.requestedAt', { date: formatDate(report.doctorReview?.requestedAt) })}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={patientGuidance?.urgencyLevel || t('common.unknown')} 
                          color={getUrgencyColor(patientGuidance?.urgencyLevel)}
                          size="small"
                        />
                        <Chip 
                          label={sideEffect?.severity || t('common.unknown')} 
                          color={getSeverityColor(sideEffect?.severity)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    {/* Request Reason */}
                    {report.doctorReview?.requestReason && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>{t('doctor.patientReason')}</strong> {report.doctorReview.requestReason}
                        </Typography>
                      </Alert>
                    )}

                    {/* Report Summary */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MedicineIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('reports.drug')}</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {report.medicine?.name || t('common.unknown')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('doctor.sideEffect')}</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {sideEffect?.effect || t('doctor.notSpecified')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('doctor.onset')}</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {sideEffect?.onset || t('common.unknown')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* AI Analysis Accordion */}
                    {aiAnalysis && (
                      <Accordion sx={{ mb: 2, borderRadius: '14px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AIIcon color="primary" />
                            <Typography fontWeight={500}>{t('reports.aiAnalysis')}</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>{t('doctor.summary')}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {aiAnalysis.summary || t('doctor.noSummaryAvailable')}
                            </Typography>
                          </Box>
                          
                          {patientGuidance?.recommendation && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>{t('doctor.patientGuidanceGiven')}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {patientGuidance.recommendation}
                              </Typography>
                            </Box>
                          )}

                          {aiAnalysis.recommendedActions?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>{t('reports.recommendedSteps')}</Typography>
                              <List dense>
                                {aiAnalysis.recommendedActions.map((action, idx) => (
                                  <ListItem key={idx} sx={{ py: 0 }}>
                                    <ListItemText 
                                      primary={`• ${action}`}
                                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          {/* Medication Verification from AI + Google Search */}
                          {aiAnalysis.medicationVerification && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 1, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <VerifiedIcon color={aiAnalysis.medicationVerification.isVerifiedMedication ? 'success' : 'warning'} fontSize="small" />
                                <Typography variant="subtitle2">
                                  {t('doctor.medicationVerification')}
                                  {aiAnalysis.medicationVerification.isVerifiedMedication && (
                                    <Chip label={t('doctor.verified')} size="small" color="success" sx={{ ml: 1 }} />
                                  )}
                                </Typography>
                              </Box>
                              <Grid container spacing={1}>
                                {aiAnalysis.medicationVerification.drugClass && aiAnalysis.medicationVerification.drugClass !== 'Unknown' && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">{t('doctor.drugClass')}</Typography>
                                    <Typography variant="body2">{aiAnalysis.medicationVerification.drugClass}</Typography>
                                  </Grid>
                                )}
                                {aiAnalysis.medicationVerification.knownADR && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">{t('doctor.knownAdrMatch')}</Typography>
                                    <Typography variant="body2" color={aiAnalysis.medicationVerification.knownADR ? 'error.main' : 'text.primary'}>
                                      {aiAnalysis.medicationVerification.knownADR ? t('doctor.knownAdrYes') : t('doctor.knownAdrNo')}
                                    </Typography>
                                  </Grid>
                                )}
                                {aiAnalysis.medicationVerification.knownADRFrequency && (
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">{t('doctor.adrFrequency')}</Typography>
                                    <Typography variant="body2">{aiAnalysis.medicationVerification.knownADRFrequency}</Typography>
                                  </Grid>
                                )}
                                {aiAnalysis.medicationVerification.labelWarnings && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">{t('doctor.labelWarnings')}</Typography>
                                    <Typography variant="body2">{aiAnalysis.medicationVerification.labelWarnings}</Typography>
                                  </Grid>
                                )}
                                {aiAnalysis.medicationVerification.sources?.length > 0 && (
                                  <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">{t('doctor.verificationSources')}</Typography>
                                    <Typography variant="body2">
                                      {aiAnalysis.medicationVerification.sources.join(', ')}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          )}

                          {/* References from Google Search Grounding */}
                          {aiAnalysis.references?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ScienceIcon color="primary" fontSize="small" />
                                <Typography variant="subtitle2">{t('doctor.referencesAndSources')}</Typography>
                              </Box>
                              <List dense>
                                {aiAnalysis.references.map((ref, idx) => (
                                  <ListItem key={idx} sx={{ py: 0.5 }}>
                                    <LinkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    <ListItemText
                                      primary={
                                        ref.uri ? (
                                          <a href={ref.uri} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                                            {ref.title || ref.uri}
                                          </a>
                                        ) : (
                                          ref.title || t('doctor.reference')
                                        )
                                      }
                                      primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip 
                              label={t('doctor.causalityLabel', { value: aiAnalysis.causalityAssessment?.likelihood || t('common.unknown') })}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={t('doctor.riskScoreLabel', { value: aiAnalysis.overallRiskScore || t('common.notAvailable') })}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={t('doctor.priorityLabel', { value: aiAnalysis.priority || t('common.unknown') })}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        label={t('reports.aiStatusLabel', {
                          status: t(`reports.aiStatus.${report.metadata?.aiStatus || 'queued'}`),
                        })}
                        color={getAiStatusColor(report.metadata?.aiStatus || 'queued')}
                        size="small"
                        variant="outlined"
                      />
                      {report.metadata?.aiProvider && (
                        <Chip
                          label={t('doctor.aiProviderLabel', { provider: report.metadata.aiProvider })}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {report.metadata?.aiStatus === 'failed' && report.metadata?.aiProcessingError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {report.metadata.aiProcessingError}
                      </Alert>
                    )}

                    {duplicateResults[report._id]?.loaded && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: '14px',
                          border: 1,
                          borderColor: 'divider',
                          bgcolor: alpha(theme.palette.background.paper, 0.65),
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {t('doctor.duplicateReviewTitle')}
                        </Typography>
                        {duplicateResults[report._id]?.error && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {duplicateResults[report._id].error}
                          </Alert>
                        )}
                        {duplicateResults[report._id]?.duplicates?.length === 0 && !duplicateResults[report._id]?.error && (
                          <Alert severity="success">
                            {t('doctor.noDuplicateCandidates')}
                          </Alert>
                        )}
                        {duplicateResults[report._id]?.duplicates?.map((candidate) => (
                          <Box
                            key={candidate.reportId}
                            sx={{
                              p: 2,
                              mb: 1.5,
                              borderRadius: 2,
                              border: 1,
                              borderColor: alpha(theme.palette.divider, 0.8),
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {candidate.medicine?.name || t('common.unknown')} · {formatDate(candidate.reportDate || candidate.createdAt)}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={t('doctor.duplicateConfidenceLabel', {
                                    confidence: `${Math.round((candidate.confidence || 0) * 100)}%`,
                                  })}
                                  size="small"
                                  color={candidate.isDuplicate ? 'warning' : 'default'}
                                  variant="outlined"
                                />
                                <Chip
                                  label={t('doctor.analysisSourceLabel', {
                                    source: candidate.analysisSource || duplicateResults[report._id]?.analysisSource || t('common.unknown'),
                                  })}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {candidate.reasoning}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                              {t('doctor.mergePreviewLabel', {
                                sideEffects: candidate.mergePreview?.addedSideEffects || 0,
                                followUps: candidate.mergePreview?.totalFollowUps || 0,
                                attachments: candidate.mergePreview?.totalAttachments || 0,
                              })}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/reports/${candidate.reportId}`)}
                                sx={{ borderRadius: 999 }}
                              >
                                {t('doctor.compareReport')}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                disabled={candidate.reviewState === 'flagged' || actionState[`flag:${candidate.reportId}`]}
                                onClick={() => handleDuplicateDecision({
                                  action: 'flag',
                                  candidateId: candidate.reportId,
                                  originalReportId: report._id,
                                })}
                                sx={{ borderRadius: 999 }}
                              >
                                {t('doctor.flagDuplicate')}
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                disabled={candidate.reviewState === 'merged' || actionState[`merge:${candidate.reportId}`]}
                                onClick={() => handleDuplicateDecision({
                                  action: 'merge',
                                  candidateId: candidate.reportId,
                                  originalReportId: report._id,
                                })}
                                sx={{ borderRadius: 999 }}
                              >
                                {t('doctor.mergeDuplicate')}
                              </Button>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        startIcon={duplicateResults[report._id]?.loading ? <CircularProgress size={16} /> : <LinkIcon />}
                        onClick={() => handleLoadDuplicates(report._id)}
                        disabled={duplicateResults[report._id]?.loading}
                        sx={{ borderRadius: 999 }}
                      >
                        {t('doctor.reviewDuplicates')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={actionState[`reprocess:${report._id}`] ? <CircularProgress size={16} /> : <AIIcon />}
                        onClick={() => handleReprocessAi(report._id)}
                        disabled={actionState[`reprocess:${report._id}`]}
                        sx={{ borderRadius: 999 }}
                      >
                        {t('doctor.reprocessAi')}
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={() => navigate(`/reports/${report._id}`)}
                        sx={{ borderRadius: 999 }}
                      >
                        {t('doctor.viewFullReport')}
                      </Button>
                      <Button 
                        variant="contained" 
                        startIcon={<ReviewIcon />}
                        onClick={() => handleOpenReviewDialog(report)}
                        sx={{ borderRadius: 999 }}
                      >
                        {t('doctor.submitReview')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('doctor.submitReviewFor', {
            name: `${selectedReport?.patient?.firstName || ''} ${selectedReport?.patient?.lastName || ''}`.trim(),
          })}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* AI Summary */}
            {selectedReport?.metadata?.aiAnalysis && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>{t('doctor.aiAssessmentSummary')}</Typography>
                <Typography variant="body2">
                  {selectedReport.metadata.aiAnalysis.summary}
                </Typography>
              </Alert>
            )}

            <TextField
              select
              label={t('doctor.agreeWithAiAssessment')}
              value={agreedWithAI}
              onChange={(e) => setAgreedWithAI(e.target.value === 'true')}
              fullWidth
            >
              <MenuItem value="true">{t('doctor.aiAgreeYes')}</MenuItem>
              <MenuItem value="false">{t('doctor.aiAgreeNo')}</MenuItem>
            </TextField>

            <TextField
              label={t('doctor.yourRemarks')}
              multiline
              rows={4}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder={t('doctor.remarksPlaceholder')}
              fullWidth
              required
            />

            <TextField
              label={t('doctor.recommendationForPatient')}
              multiline
              rows={3}
              value={reviewRecommendation}
              onChange={(e) => setReviewRecommendation(e.target.value)}
              placeholder={t('doctor.recommendationPlaceholder')}
              fullWidth
            />

            <TextField
              select
              label={t('doctor.actionRequired')}
              value={reviewAction}
              onChange={(e) => setReviewAction(e.target.value)}
              fullWidth
            >
              <MenuItem value="none">{t('doctor.action.none')}</MenuItem>
              <MenuItem value="monitor">{t('doctor.action.monitor')}</MenuItem>
              <MenuItem value="adjust_medication">{t('doctor.action.adjustMedication')}</MenuItem>
              <MenuItem value="discontinue">{t('doctor.action.discontinue')}</MenuItem>
              <MenuItem value="schedule_appointment">{t('doctor.action.scheduleAppointment')}</MenuItem>
              <MenuItem value="emergency">{t('doctor.action.emergency')}</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setReviewDialogOpen(false)} disabled={submittingReview} sx={{ borderRadius: 999 }}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitReview}
            disabled={submittingReview || !reviewRemarks.trim()}
            startIcon={submittingReview ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{ borderRadius: 999 }}
          >
            {submittingReview ? t('doctor.submitting') : t('doctor.submitReview')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
