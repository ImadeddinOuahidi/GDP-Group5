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
  TextField,
  MenuItem,
  Alert,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';
import { reportService } from '../../services';

export default function ReviewRequests() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = AuthContainer.useContainer();
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
      setError('Failed to load review requests');
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
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent': return 'error';
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
    if (!dateString) return 'N/A';
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReviewIcon color="primary" />
          Review Requests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Patients have requested your review on these reports
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {pendingReviews.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No Pending Reviews</Typography>
          <Typography color="text.secondary">
            All review requests have been addressed. Great work!
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {pendingReviews.map((report) => {
            const aiAnalysis = report.metadata?.aiAnalysis;
            const patientGuidance = aiAnalysis?.patientGuidance;
            const patientName = report.patient?.firstName && report.patient?.lastName 
              ? `${report.patient.firstName} ${report.patient.lastName}` 
              : 'Anonymous';
            const sideEffect = report.sideEffects?.[0];

            return (
              <Grid item xs={12} key={report._id}>
                <Card 
                  sx={{ 
                    borderLeft: 4, 
                    borderColor: patientGuidance?.urgencyLevel === 'urgent' ? 'error.main' 
                      : patientGuidance?.urgencyLevel === 'soon' ? 'warning.main' 
                      : 'success.main',
                    '&:hover': { boxShadow: 6 },
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
                            Requested: {formatDate(report.doctorReview?.requestedAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={patientGuidance?.urgencyLevel || 'unknown'} 
                          color={getUrgencyColor(patientGuidance?.urgencyLevel)}
                          size="small"
                        />
                        <Chip 
                          label={sideEffect?.severity || 'Unknown'} 
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
                          <strong>Patient's reason:</strong> {report.doctorReview.requestReason}
                        </Typography>
                      </Alert>
                    )}

                    {/* Report Summary */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MedicineIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Medication</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {report.medicine?.name || 'Unknown'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Side Effect</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {sideEffect?.effect || 'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon color="action" fontSize="small" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Onset</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {sideEffect?.onset || 'Unknown'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* AI Analysis Accordion */}
                    {aiAnalysis && (
                      <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AIIcon color="primary" />
                            <Typography fontWeight={500}>AI Analysis</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {aiAnalysis.summary || 'No summary available'}
                            </Typography>
                          </Box>
                          
                          {patientGuidance?.recommendation && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>Patient Guidance Given</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {patientGuidance.recommendation}
                              </Typography>
                            </Box>
                          )}

                          {aiAnalysis.recommendedActions?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>Recommended Actions</Typography>
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

                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`Causality: ${aiAnalysis.causalityAssessment?.likelihood || 'Unknown'}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={`Risk Score: ${aiAnalysis.overallRiskScore || 'N/A'}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip 
                              label={`Priority: ${aiAnalysis.priority || 'Unknown'}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={() => navigate(`/reports/${report._id}`)}
                      >
                        View Full Report
                      </Button>
                      <Button 
                        variant="contained" 
                        startIcon={<ReviewIcon />}
                        onClick={() => handleOpenReviewDialog(report)}
                      >
                        Submit Review
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
          Submit Review for {selectedReport?.patient?.firstName} {selectedReport?.patient?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* AI Summary */}
            {selectedReport?.metadata?.aiAnalysis && (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>AI Assessment Summary</Typography>
                <Typography variant="body2">
                  {selectedReport.metadata.aiAnalysis.summary}
                </Typography>
              </Alert>
            )}

            <TextField
              select
              label="Do you agree with AI assessment?"
              value={agreedWithAI}
              onChange={(e) => setAgreedWithAI(e.target.value === 'true')}
              fullWidth
            >
              <MenuItem value="true">Yes, I agree with the AI assessment</MenuItem>
              <MenuItem value="false">No, I have a different assessment</MenuItem>
            </TextField>

            <TextField
              label="Your Remarks / Medical Opinion"
              multiline
              rows={4}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="Provide your professional assessment and any additional observations..."
              fullWidth
              required
            />

            <TextField
              label="Recommendation for Patient"
              multiline
              rows={3}
              value={reviewRecommendation}
              onChange={(e) => setReviewRecommendation(e.target.value)}
              placeholder="What should the patient do next? Any specific instructions?"
              fullWidth
            />

            <TextField
              select
              label="Action Required"
              value={reviewAction}
              onChange={(e) => setReviewAction(e.target.value)}
              fullWidth
            >
              <MenuItem value="none">No immediate action needed</MenuItem>
              <MenuItem value="monitor">Continue monitoring</MenuItem>
              <MenuItem value="adjust_medication">Adjust medication dosage</MenuItem>
              <MenuItem value="discontinue">Discontinue medication</MenuItem>
              <MenuItem value="schedule_appointment">Schedule follow-up appointment</MenuItem>
              <MenuItem value="emergency">Seek immediate medical attention</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setReviewDialogOpen(false)} disabled={submittingReview}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitReview}
            disabled={submittingReview || !reviewRemarks.trim()}
            startIcon={submittingReview ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
