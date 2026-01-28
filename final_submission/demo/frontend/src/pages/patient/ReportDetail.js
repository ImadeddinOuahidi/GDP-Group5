import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  LocalHospital as HospitalIcon,
  Psychology as AIIcon,
  PersonSearch as DoctorIcon,
  RateReview as ReviewIcon,
  TipsAndUpdates as TipIcon,
  MonitorHeart as MonitorIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { reportService } from '../../services';

// Urgency level configurations
const urgencyConfig = {
  routine: {
    color: 'success',
    icon: <CheckIcon />,
    label: 'Routine',
    bgColor: '#e8f5e9',
    borderColor: '#4caf50'
  },
  soon: {
    color: 'info',
    icon: <InfoIcon />,
    label: 'See Doctor Soon',
    bgColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  urgent: {
    color: 'warning',
    icon: <WarningIcon />,
    label: 'Urgent',
    bgColor: '#fff3e0',
    borderColor: '#ff9800'
  },
  emergency: {
    color: 'error',
    icon: <ErrorIcon />,
    label: 'Emergency',
    bgColor: '#ffebee',
    borderColor: '#f44336'
  }
};

const severityConfig = {
  'Mild': { color: 'success', icon: <CheckIcon /> },
  'Moderate': { color: 'warning', icon: <WarningIcon /> },
  'Severe': { color: 'error', icon: <ErrorIcon /> },
  'Life-threatening': { color: 'error', icon: <ErrorIcon /> }
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReportById(id);
      // Handle different response formats
      const reportData = response.data?.report || response.report || response.data;
      if (response.success && reportData) {
        setReport(reportData);
      } else if (response.status === 'success' && reportData) {
        setReport(reportData);
      } else {
        setError('Report not found');
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async () => {
    try {
      setSubmittingReview(true);
      await reportService.requestDoctorReview(id, reviewReason);
      setReviewDialogOpen(false);
      setReviewReason('');
      // Reload report to get updated status
      await loadReport();
    } catch (err) {
      console.error('Error requesting review:', err);
      alert(err.message || 'Failed to request review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !report) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || 'Report not found'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const aiAnalysis = report.metadata?.aiAnalysis;
  const patientGuidance = aiAnalysis?.patientGuidance;
  const doctorReview = report.doctorReview;
  const urgency = urgencyConfig[patientGuidance?.urgencyLevel] || urgencyConfig.routine;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Report Details
        </Typography>
        <Chip 
          label={report.status} 
          color={report.status === 'Reviewed' ? 'success' : 'warning'}
          sx={{ ml: 2 }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Report Info */}
        <Grid item xs={12} md={6}>
          {/* Medication & Side Effect Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                  <MedicationIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{report.medicine?.name || 'Unknown Medication'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {report.medicine?.genericName}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reported Side Effects
              </Typography>
              {report.sideEffects?.map((effect, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body1" fontWeight="medium">
                      {effect.effect}
                    </Typography>
                    <Chip 
                      label={effect.severity}
                      color={severityConfig[effect.severity]?.color || 'default'}
                      size="small"
                    />
                  </Box>
                  {effect.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {effect.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Onset: {effect.onset} • {effect.bodySystem || 'General'}
                  </Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Dosage</Typography>
                  <Typography variant="body2">
                    {report.medicationUsage?.dosage?.amount} - {report.medicationUsage?.dosage?.frequency}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Route</Typography>
                  <Typography variant="body2">{report.medicationUsage?.dosage?.route}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Indication</Typography>
                  <Typography variant="body2">{report.medicationUsage?.indication}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Reported</Typography>
                  <Typography variant="body2">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - AI Analysis & Doctor Review */}
        <Grid item xs={12} md={6}>
          {/* AI Analysis Card - Only show if processed */}
          {report.metadata?.aiProcessed && (
            <Card 
              sx={{ 
                mb: 3, 
                border: `2px solid ${urgency.borderColor}`,
                bgcolor: alpha(urgency.borderColor, 0.05)
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: urgency.borderColor, mr: 2 }}>
                    <AIIcon />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6">AI Analysis</Typography>
                    <Chip 
                      icon={urgency.icon}
                      label={urgency.label}
                      color={urgency.color}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Main Recommendation */}
                {patientGuidance?.recommendation && (
                  <Alert 
                    severity={urgency.color}
                    sx={{ mb: 2 }}
                    icon={urgency.icon}
                  >
                    <AlertTitle>What This Means For You</AlertTitle>
                    {patientGuidance.recommendation}
                  </Alert>
                )}

                {/* Next Steps */}
                {patientGuidance?.nextSteps?.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                      <TipIcon sx={{ mr: 1, fontSize: 20 }} />
                      Recommended Next Steps
                    </Typography>
                    <List dense>
                      {patientGuidance.nextSteps.map((step, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={step} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Warning Signs */}
                {patientGuidance?.warningSignsToWatch?.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" color="warning.main">
                      <WarningIcon sx={{ mr: 1, fontSize: 20 }} />
                      Warning Signs to Watch
                    </Typography>
                    <List dense>
                      {patientGuidance.warningSignsToWatch.map((sign, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <MonitorIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={sign} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Quick Actions Based on Urgency */}
                {patientGuidance?.shouldSeekMedicalAttention && (
                  <Box display="flex" gap={1} mt={2}>
                    {patientGuidance.urgencyLevel === 'emergency' && (
                      <Button 
                        variant="contained" 
                        color="error" 
                        startIcon={<PhoneIcon />}
                        href="tel:911"
                      >
                        Call Emergency
                      </Button>
                    )}
                    <Button 
                      variant="outlined" 
                      color={urgency.color}
                      startIcon={<HospitalIcon />}
                    >
                      Find Nearby Care
                    </Button>
                  </Box>
                )}

                {/* AI Summary */}
                {aiAnalysis?.summary && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                    <Typography variant="caption" color="text.secondary">
                      Clinical Summary
                    </Typography>
                    <Typography variant="body2">{aiAnalysis.summary}</Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          )}

          {/* Processing Status if not yet processed */}
          {!report.metadata?.aiProcessed && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Analyzing Your Report</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Our AI is reviewing your report. This usually takes a few moments.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Doctor Review Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
                  <DoctorIcon />
                </Avatar>
                <Typography variant="h6">Doctor Review</Typography>
              </Box>

              {/* If review completed - show doctor's remarks */}
              {doctorReview?.status === 'completed' ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <AlertTitle>Reviewed by Dr. {doctorReview.reviewedBy?.firstName} {doctorReview.reviewedBy?.lastName}</AlertTitle>
                    Reviewed on {new Date(doctorReview.reviewedAt).toLocaleDateString()}
                  </Alert>

                  {doctorReview.remarks && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <ReviewIcon sx={{ mr: 1, fontSize: 18, verticalAlign: 'middle' }} />
                        Doctor's Remarks
                      </Typography>
                      <Typography variant="body1">{doctorReview.remarks}</Typography>
                    </Paper>
                  )}

                  {doctorReview.doctorAssessment?.recommendation && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Recommendation</Typography>
                      <Typography variant="body2">{doctorReview.doctorAssessment.recommendation}</Typography>
                    </Paper>
                  )}

                  {doctorReview.doctorAssessment?.actionRequired && 
                   doctorReview.doctorAssessment.actionRequired !== 'none' && (
                    <Chip 
                      label={`Action: ${doctorReview.doctorAssessment.actionRequired.replace(/_/g, ' ')}`}
                      color="primary"
                      sx={{ mr: 1 }}
                    />
                  )}

                  {doctorReview.doctorAssessment?.followUpRequired && (
                    <Chip 
                      icon={<ScheduleIcon />}
                      label={`Follow-up: ${new Date(doctorReview.doctorAssessment.followUpDate).toLocaleDateString()}`}
                      color="info"
                    />
                  )}
                </Box>
              ) : doctorReview?.requested ? (
                // Review requested but pending
                <Box>
                  <Alert severity="info">
                    <AlertTitle>Review Requested</AlertTitle>
                    Your request for a doctor review has been submitted. 
                    {doctorReview.status === 'in_review' 
                      ? ' A doctor is currently reviewing your report.'
                      : ' A doctor will review your report soon.'}
                  </Alert>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Requested on {new Date(doctorReview.requestedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                // No review requested yet
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    If you'd like a healthcare professional to review this report and provide personalized guidance, you can request a doctor review.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<DoctorIcon />}
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    Request Doctor Review
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Request Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Doctor Review</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
            A doctor will review your report and provide personalized medical guidance. 
            You can optionally add a note about any specific concerns.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional concerns or questions (optional)"
            placeholder="Is there anything specific you'd like the doctor to address?"
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleRequestReview}
            disabled={submittingReview}
          >
            {submittingReview ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
