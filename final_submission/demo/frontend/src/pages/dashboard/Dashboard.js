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
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState(null);
  const [reports, setReports] = React.useState([]);
  const [totalReportsCount, setTotalReportsCount] = React.useState(0);
  const [dashboardStats, setDashboardStats] = React.useState(null);

  // Fetch real data from API
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const reportParams = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'reportDetails.reportDate',
        sortOrder: 'desc',
        severity: severityFilter || undefined,
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
        drugName: searchTerm || undefined,
      };

      // Fetch reports and dashboard stats in parallel
      const [reportsRes, statsRes] = await Promise.all([
        api.reports.getAll(reportParams).catch(() => null),
        api.reports.getDashboard ? api.reports.getDashboard().catch(() => null) : Promise.resolve(null),
      ]);

      const reportItems = Array.isArray(reportsRes?.data?.data)
        ? reportsRes.data.data
        : Array.isArray(reportsRes?.data?.reports)
          ? reportsRes.data.reports
          : [];

      const pagination = reportsRes?.data?.meta?.pagination || reportsRes?.data?.pagination || {};
      setReports(reportItems);
      setTotalReportsCount(pagination.total ?? reportItems.length);

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
  }, [dateFrom, dateTo, page, rowsPerPage, searchTerm, severityFilter, t]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Helper: get patient name from populated report
  const getPatientName = (report) => {
    if (report.patient?.firstName) return `${report.patient.firstName} ${report.patient.lastName || ''}`.trim();
    return t('common.anonymous');
  };

  // Helper: get drug name from populated report
  const getDrugName = (report) => report.medicine?.name || t('common.unknown');

  // Helper: get primary symptom
  const getSymptom = (report) => (report.sideEffects || [])[0]?.effect || t('common.notAvailable');

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
    return report.priority || t('common.notAvailable');
  };

  // Helper: check if AI analysis exists
  const hasAIAnalysis = (report) =>
    report.metadata?.aiStatus === 'completed' || Boolean(report.metadata?.aiProcessed);

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

  const formatDate = (value, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!value) {
      return t('common.notAvailable');
    }

    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  };

  const formatTime = (value) => new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);

  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); setPage(0); };
  const handleSeverityFilterChange = (event) => { setSeverityFilter(event.target.value); setPage(0); };
  const handleDateFromChange = (event) => { setDateFrom(event.target.value); setPage(0); };
  const handleDateToChange = (event) => { setDateTo(event.target.value); setPage(0); };
  const handleClearFilters = () => { setSearchTerm(''); setSeverityFilter(''); setDateFrom(''); setDateTo(''); setPage(0); };

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
        if (!backendOk) exportClientCSV(reports);
      } else if (format === 'json') {
        const backendOk = await exportReportsJSON();
        if (!backendOk) exportClientJSON(reports);
      } else if (format === 'print') {
        // Print all filtered reports - generate a summary view
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
          printWindow.document.write(generateDashboardPrintHTML(reports));
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 500);
        }
      }
      setSnackbar({ open: true, message: t('dashboard.exportSuccess', { format: format.toUpperCase() }), severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: t('dashboard.exportFailed'), severity: 'error' });
    }
  };

  // Generate printable dashboard summary
  const generateDashboardPrintHTML = (data) => {
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const rows = data.map((r) => `<tr>
      <td>${r._id || ''}</td>
      <td>${getPatientName(r)}</td>
      <td>${getDrugName(r)}</td>
      <td>${getSymptom(r)}</td>
      <td>${getSeverity(r)}</td>
      <td>${r.status || ''}</td>
      <td>${r.createdAt ? dateFormatter.format(new Date(r.createdAt)) : ''}</td>
    </tr>`).join('');

    return `<!DOCTYPE html><html><head><title>${t('dashboard.printTitle')}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#111}
      h1{color:#111;border-bottom:2px solid #111;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      .stats{display:flex;gap:20px;margin:16px 0}
      .stat{padding:12px;border:1px solid #ddd;border-radius:8px;text-align:center;flex:1}
      .stat-value{font-size:24px;font-weight:bold;color:#111}
      .footer{margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:12px}
      @media print{body{padding:10px}}</style></head><body>
      <h1>${t('dashboard.printHeading')}</h1>
      <p>${t('dashboard.generatedAt', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()) })} | ${t('dashboard.totalReports')}: ${data.length}</p>
      <div class="stats">
        <div class="stat"><div class="stat-value">${reports.length}</div>${t('dashboard.totalReports')}</div>
        <div class="stat"><div class="stat-value">${criticalCount}</div>${t('dashboard.criticalCases')}</div>
        <div class="stat"><div class="stat-value">${uniquePatients}</div>${t('dashboard.activePatients')}</div>
        <div class="stat"><div class="stat-value">${uniqueDrugs}</div>${t('dashboard.monitoredDrugs')}</div>
      </div>
      <table><thead><tr><th>${t('common.id')}</th><th>${t('reports.patient')}</th><th>${t('reports.drug')}</th><th>${t('reports.symptoms')}</th><th>${t('reports.severity')}</th><th>${t('reports.status')}</th><th>${t('reports.reportDate')}</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">${t('dashboard.printFooter')}</div>
      </body></html>`;
  };

  const handleSnackbarClose = () => { setSnackbar({ ...snackbar, open: false }); };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }} className="organic-fade-in">
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.2, md: 2.8 },
          borderRadius: '16px',
          border: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.52 : 0.74),
          backdropFilter: 'blur(8px)',
        }}
      >
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
              gutterBottom
            >
              {t('doctor.analyticsDashboard')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('dashboard.comprehensiveAnalytics')}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportClick}
              sx={{ display: { xs: 'none', sm: 'flex' }, borderRadius: 999 }}
            >
              {t('dashboard.exportData')}
            </Button>
            <Button
              variant="contained"
              startIcon={isLoading ? <AutorenewRounded sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{ borderRadius: 999 }}
            >
              {isLoading ? t('dashboard.refreshing') : t('dashboard.refresh')}
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
                borderRadius: '16px',
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
      <Paper elevation={2} sx={{ borderRadius: '18px', overflow: 'hidden' }}>
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
                {t('dashboard.recentReports')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('dashboard.comprehensiveList')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                {t('dashboard.lastUpdated', { time: formatTime(lastUpdated) })} • {t('reports.reportsShown', { filtered: reports.length, total: totalReportsCount })}
              </Typography>
            </Box>
            
            <Stack direction="column" spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  size="small"
                  label={t('dashboard.drugNameFilter')}
                  placeholder={t('dashboard.searchPlaceholder')}
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
                  <InputLabel>{t('reports.severity')}</InputLabel>
                  <Select
                    value={severityFilter}
                    label={t('reports.severity')}
                    onChange={handleSeverityFilterChange}
                    startAdornment={<FilterList fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="">{t('common.all')}</MenuItem>
                    <MenuItem value="Life-threatening">{t('severity.lifeThreatening')}</MenuItem>
                    <MenuItem value="Severe">{t('severity.severe')}</MenuItem>
                    <MenuItem value="Moderate">{t('severity.moderate')}</MenuItem>
                    <MenuItem value="Mild">{t('severity.mild')}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  size="small"
                  label={t('dashboard.dateFrom')}
                  type="date"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  label={t('dashboard.dateTo')}
                  type="date"
                  value={dateTo}
                  onChange={handleDateToChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                {(searchTerm || severityFilter || dateFrom || dateTo) && (
                  <Button size="small" variant="outlined" color="inherit" onClick={handleClearFilters} sx={{ borderRadius: 999 }}>
                    {t('doctor.clearFilters')}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
          <Divider />
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.reportId')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.patient')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.drug')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.symptoms')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.severity')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.status')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.reportDate')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('reports.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports
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
                        label={t('doctor.aiSeverityLabel', { severity: report.metadata.aiAnalysis.severity.level })}
                        size="small"
                        variant="outlined"
                        color={getSeverityColor(report.metadata.aiAnalysis.severity.level)}
                        sx={{ ml: 0.5, fontWeight: 'medium', fontSize: '0.7rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status || t('status.submitted')}
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
                        {formatDate(report.createdAt)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title={t('reports.viewDetails')}>
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/reports/${report._id}`); }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('reports.exportReport')}>
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
          count={totalReportsCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Paper>

      {/* Charts & Insights Section */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {/* Trend Chart: Reports Over Time */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('dashboard.reportsOverTime')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {t('dashboard.dailyTrend')}
            </Typography>
            {(() => {
              const rawData = dashboardStats?.reportsOverTime || [];
              // Fill in missing days with 0
              const today = new Date();
              const chartData = [];
              for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const found = rawData.find(r => r.date === key);
                chartData.push({ date: key.slice(5), count: found ? found.count : 0 });
              }
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 8, fontSize: 13 }}
                      formatter={(val) => [t('dashboard.reportCountLabel', { count: val }), t('dashboard.reports')]} 
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      fill="url(#colorReports)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </Paper>
        </Grid>

        {/* Severity Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('dashboard.severityDistribution')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {dashboardStats?.aiProcessedCount > 0
                ? t('dashboard.aiAssessedCount', { count: dashboardStats.aiProcessedCount })
                : t('dashboard.patientReportedSeverity')}
            </Typography>
            {(() => {
              const PIE_COLORS = {
                'Life-threatening': theme.palette.error.main,
                Severe: theme.palette.warning.main,
                Moderate: theme.palette.info.main,
                Mild: theme.palette.success.main,
              };
              const aiDist = dashboardStats?.aiSeverityDistribution || [];
              const pieData = ['Life-threatening', 'Severe', 'Moderate', 'Mild'].map(sev => {
                const item = aiDist.find(d => d._id === sev);
                const count = item?.count || reports.filter(r => getSeverity(r) === sev).length;
                return { name: sev, value: count };
              }).filter(d => d.value > 0);
              if (pieData.length === 0) {
                return <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>{t('common.noData')}</Typography>;
              }
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={PIE_COLORS[entry.name] || theme.palette.grey[500]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val, name) => [t('dashboard.reportCountLabel', { count: val }), name]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
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
                      {t('dashboard.patientReportedSymptom', { patientName, symptom })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {drugName} • {report.createdAt ? formatDate(report.createdAt) : ''}
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
                  {t('dashboard.noReportsYet')}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Top Reported Medications Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('doctor.topMedicationsByReportCount')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {t('dashboard.medicationsHighestCount')}
            </Typography>
            {(() => {
              const meds = dashboardStats?.mostReportedMedicines || [];
              if (meds.length === 0) {
                return <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>{t('common.noData')}</Typography>;
              }
              const barData = meds.map(m => ({ name: m.medicineName?.slice(0, 12) || t('common.unknown'), reports: m.reportCount }));
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(val) => [t('dashboard.reportCountLabel', { count: val }), t('dashboard.reports')]} />
                    <Bar dataKey="reports" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </Paper>
        </Grid>
      </Grid>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: 'common.white',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: alpha(theme.palette.background.default, 0.74),
          backdropFilter: 'blur(4px)',
        }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {t('dashboard.refreshingData')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {t('dashboard.refreshingDataDescription')}
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
