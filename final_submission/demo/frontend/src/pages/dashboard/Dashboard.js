import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Container,
  Divider,
  IconButton,
  Tooltip,
  TablePagination,
  alpha,
  Stack,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Button,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Assessment,
  Person,
  Medication,
  Warning,
  TrendingUp,
  Visibility,
  GetApp,
  Search,
  FilterList,
  Refresh,
  CalendarToday,
  FileDownload,
  TableChart,
  AutorenewRounded,
  DataObject as JsonIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { exportReportsCSV, exportReportsJSON, exportClientCSV, exportClientJSON } from '../../utils/exportUtils';
import { useI18n } from '../../i18n';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { t } = useI18n();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState(null);
  const [reports, setReports] = React.useState([]);
  const [dashboardStats, setDashboardStats] = React.useState(null);

  // Fetch real data from API
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch reports and dashboard stats in parallel
      const [reportsRes, statsRes] = await Promise.all([
        api.reports.getAll({ limit: 100, sortBy: 'reportDetails.reportDate', sortOrder: 'desc' }).catch(() => null),
        api.reports.getDashboard ? api.reports.getDashboard().catch(() => null) : Promise.resolve(null),
      ]);

      // sendPaginated returns { success, data: [...], meta: { pagination } }
      if (Array.isArray(reportsRes?.data?.data)) {
        setReports(reportsRes.data.data);
      } else if (Array.isArray(reportsRes?.data?.reports)) {
        setReports(reportsRes.data.reports);
      }

      // getDashboard uses sendSuccess → { success, data: { totalReports, ... } }
      if (statsRes?.data?.data) {
        setDashboardStats(statsRes.data.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setSnackbar({ open: true, message: t('dashboard.refreshError'), severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Helper: get patient name from populated report
  const getPatientName = (report) => {
    if (report.patient?.firstName) return `${report.patient.firstName} ${report.patient.lastName || ''}`.trim();
    return 'Anonymous';
  };

  // Helper: get drug name from populated report
  const getDrugName = (report) => report.medicine?.name || 'Unknown';

  // Helper: get primary symptom
  const getSymptom = (report) => (report.sideEffects || [])[0]?.effect || 'N/A';

  // Helper: get highest severity — prefers AI-detected severity, falls back to patient-reported
  const getSeverity = (report) => {
    // Check AI-detected severity first
    const aiSeverity = report.metadata?.aiAnalysis?.severity?.level;
    if (aiSeverity) return aiSeverity;
    
    // Fall back to patient-reported severity
    const levels = ['Life-threatening', 'Severe', 'Moderate', 'Mild'];
    const effects = report.sideEffects || [];
    for (const level of levels) {
      if (effects.some((e) => e.severity === level)) return level;
    }
    return report.priority || 'N/A';
  };

  // Helper: check if AI analysis exists
  const hasAIAnalysis = (report) => !!report.metadata?.aiProcessed;

  // Filter reports based on search and severity
  const filteredReports = reports.filter(report => {
    const patientName = getPatientName(report).toLowerCase();
    const drugName = getDrugName(report).toLowerCase();
    const symptom = getSymptom(report).toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || patientName.includes(search) || drugName.includes(search) || symptom.includes(search);
    const matchesSeverity = !severityFilter || getSeverity(report) === severityFilter || report.priority === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Computed stats from real data
  const criticalCount = dashboardStats?.severeCaseCount ?? reports.filter(r => r.priority === 'critical' || r.sideEffects?.some(e => e.severity === 'Severe' || e.severity === 'Life-threatening')).length;
  const uniquePatients = new Set(reports.map(r => r.patient?._id || r.patient).filter(Boolean)).size;
  const uniqueDrugs = new Set(reports.map(r => r.medicine?._id || r.medicine).filter(Boolean)).size;

  const stats = [
    {
      title: t('dashboard.totalReports'),
      value: dashboardStats?.totalReports ?? reports.length,
      icon: <Assessment />,
      color: theme.palette.primary.main,
      subtitle: t('dashboard.thisMonth')
    },
    {
      title: t('dashboard.criticalCases'),
      value: dashboardStats?.seriousReports ?? criticalCount,
      icon: <Warning />,
      color: theme.palette.error.main,
      subtitle: t('dashboard.requiresAttention')
    },
    {
      title: t('dashboard.activePatients'),
      value: uniquePatients,
      icon: <Person />,
      color: theme.palette.success.main,
      subtitle: t('dashboard.underMonitoring')
    },
    {
      title: t('dashboard.monitoredDrugs'),
      value: uniqueDrugs,
      icon: <Medication />,
      color: theme.palette.info.main,
      subtitle: t('dashboard.inDatabase')
    }
  ];

  const getSeverityColor = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical': case 'life-threatening': return 'error';
      case 'high': case 'severe': return 'warning';
      case 'medium': case 'moderate': return 'info';
      case 'low': case 'mild': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'urgent': return 'error';
      case 'investigating': case 'under review': return 'warning';
      case 'submitted': return 'info';
      case 'monitoring': case 'reviewed': return 'primary';
      case 'resolved': case 'closed': return 'success';
      default: return 'default';
    }
  };

  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setPage(0); };
  const handleSeverityFilterChange = (event) => { setSeverityFilter(event.target.value); setPage(0); };

  const handleRefresh = async () => {
    await fetchData();
    setSnackbar({ open: true, message: t('dashboard.refreshSuccess'), severity: 'success' });
  };

  const handleExportClick = (event) => { setExportMenuAnchor(event.currentTarget); };
  const handleExportClose = () => { setExportMenuAnchor(null); };

  const handleExport = async (format) => {
    handleExportClose();
    try {
      if (format === 'csv') {
        const backendOk = await exportReportsCSV();
        if (!backendOk) exportClientCSV(filteredReports);
      } else if (format === 'json') {
        const backendOk = await exportReportsJSON();
        if (!backendOk) exportClientJSON(filteredReports);
      } else if (format === 'print') {
        // Print all filtered reports - generate a summary view
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
          printWindow.document.write(generateDashboardPrintHTML(filteredReports));
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 500);
        }
      }
      setSnackbar({ open: true, message: t('dashboard.exportSuccess', { format: format.toUpperCase() }), severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Export failed. Please try again.', severity: 'error' });
    }
  };

  // Generate printable dashboard summary
  const generateDashboardPrintHTML = (data) => {
    const rows = data.map((r) => `<tr>
      <td>${r._id || ''}</td>
      <td>${getPatientName(r)}</td>
      <td>${getDrugName(r)}</td>
      <td>${getSymptom(r)}</td>
      <td>${getSeverity(r)}</td>
      <td>${r.status || ''}</td>
      <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</td>
    </tr>`).join('');

    return `<!DOCTYPE html><html><head><title>ADR Reports Summary</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}
      h1{color:#1976d2;border-bottom:2px solid #1976d2;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      .stats{display:flex;gap:20px;margin:16px 0}
      .stat{padding:12px;border:1px solid #ddd;border-radius:8px;text-align:center;flex:1}
      .stat-value{font-size:24px;font-weight:bold;color:#1976d2}
      .footer{margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:12px}
      @media print{body{padding:10px}}</style></head><body>
      <h1>SafeMed ADR - Reports Summary</h1>
      <p>Generated: ${new Date().toLocaleString()} | Total Reports: ${data.length}</p>
      <div class="stats">
        <div class="stat"><div class="stat-value">${reports.length}</div>Total Reports</div>
        <div class="stat"><div class="stat-value">${criticalCount}</div>Critical</div>
        <div class="stat"><div class="stat-value">${uniquePatients}</div>Patients</div>
        <div class="stat"><div class="stat-value">${uniqueDrugs}</div>Medications</div>
      </div>
      <table><thead><tr><th>ID</th><th>Patient</th><th>Medication</th><th>Symptom</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">SafeMed ADR - Adverse Drug Reaction Reporting System | CONFIDENTIAL</div>
      </body></html>`;
  };

  const handleSnackbarClose = () => { setSnackbar({ ...snackbar, open: false }); };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              fontWeight="bold" 
              color="primary" 
              gutterBottom
            >
              Doctor Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and review patient adverse drug reaction reports with comprehensive analytics
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportClick}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Export Data
            </Button>
            <Button
              variant="contained"
              startIcon={isLoading ? <AutorenewRounded sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'transform 0.3s ease-in-out',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4" component="div" fontWeight="bold" color={stat.color}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: alpha(stat.color, 0.1),
                        color: stat.color,
                        width: 48,
                        height: 48
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                      <Typography variant="caption" color="success.main" fontWeight="medium">
                        {stat.change}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Reports Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                Recent ADR Reports
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Comprehensive list of adverse drug reactions sorted by severity and date
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                Last updated: {lastUpdated.toLocaleTimeString()} • {filteredReports.length} of {reports.length} reports shown
              </Typography>
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: { sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search patients, drugs, symptoms..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={handleSeverityFilterChange}
                  startAdornment={<FilterList fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
          <Divider />
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Report ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Drug</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Symptom</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report) => {
                const patientName = getPatientName(report);
                const drugName = getDrugName(report);
                const symptom = getSymptom(report);
                const severity = getSeverity(report);
                return (
                <TableRow 
                  key={report._id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      cursor: 'pointer'
                    } 
                  }}
                  onClick={() => navigate(`/reports/${report._id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{(report._id || '').slice(-6).toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                        {patientName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2)}
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {patientName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{drugName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{symptom}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={severity}
                      color={getSeverityColor(severity)}
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                    {hasAIAnalysis(report) && report.metadata?.aiAnalysis?.severity?.level !== severity && (
                      <Chip
                        label={`AI: ${report.metadata.aiAnalysis.severity.level}`}
                        size="small"
                        variant="outlined"
                        color={getSeverityColor(report.metadata.aiAnalysis.severity.level)}
                        sx={{ ml: 0.5, fontWeight: 'medium', fontSize: '0.7rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status || 'Submitted'}
                      color={getStatusColor(report.status)}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/reports/${report._id}`); }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Report">
                        <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); exportClientJSON([report]); }}>
                          <GetApp fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Paper>

      {/* Quick Insights Section */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('dashboard.severityDistribution')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {dashboardStats?.aiProcessedCount > 0 
                ? `AI-assessed severity (${dashboardStats.aiProcessedCount} reports analyzed)`
                : 'Based on patient-reported severity'}
            </Typography>
            <Stack spacing={2}>
              {['Life-threatening', 'Severe', 'Moderate', 'Mild'].map((severity) => {
                // Use AI severity distribution from backend if available, otherwise fall back to client-side
                const aiDist = dashboardStats?.aiSeverityDistribution || [];
                const aiItem = aiDist.find(d => d._id === severity);
                const aiCount = aiItem?.count || 0;
                const clientCount = reports.filter(r => getSeverity(r) === severity).length;
                const count = aiDist.length > 0 ? aiCount : clientCount;
                const total = aiDist.length > 0 
                  ? aiDist.reduce((sum, d) => sum + d.count, 0) 
                  : reports.length;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <Box key={severity}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{severity}</Typography>
                      <Typography variant="body2" fontWeight="medium">{count} ({percentage.toFixed(1)}%)</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage} 
                      color={getSeverityColor(severity)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('dashboard.recentActivity')}
            </Typography>
            <Stack spacing={2}>
              {reports.slice(0, 4).map((report) => {
                const patientName = getPatientName(report);
                const symptom = getSymptom(report);
                const drugName = getDrugName(report);
                const severity = getSeverity(report);
                return (
                <Box key={report._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', borderRadius: 1 } }} onClick={() => navigate(`/reports/${report._id}`)}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: `${getSeverityColor(severity)}.main`, fontSize: 12 }}>
                    {patientName.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {patientName} reported {symptom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {drugName} • {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                  <Chip 
                    label={severity} 
                    size="small" 
                    color={getSeverityColor(severity)}
                    variant="outlined"
                  />
                </Box>
                );
              })}
              {reports.length === 0 && !isLoading && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No reports yet
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Refreshing Dashboard Data...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            Please wait while we fetch the latest reports
          </Typography>
        </Box>
      </Backdrop>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('export.csv')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('json')}>
          <ListItemIcon>
            <JsonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('export.json')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleExport('print')}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('export.print')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
