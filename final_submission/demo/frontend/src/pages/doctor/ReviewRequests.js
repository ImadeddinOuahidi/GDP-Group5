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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services';
import { useI18n } from '../../i18n';

export default function ReviewRequests() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewRecommendation, setReviewRecommendation] = useState('');
  const [reviewAction, setReviewAction] = useState('none');
  const [agreedWithAI, setAgreedWithAI] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getPendingReviews();
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
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
