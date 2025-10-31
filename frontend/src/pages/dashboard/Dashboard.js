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
  Analytics,
  CalendarToday,
  FileDownload,
  PictureAsPdf,
  TableChart,
  AutorenewRounded
} from '@mui/icons-material';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState(null);

  // Dummy data for now
  const reports = [
    { id: 1, patient: "John Doe", drug: "Drug A", symptom: "Headache", severity: "High", date: "2025-09-20", status: "Under Review" },
    { id: 2, patient: "Maria Lopez", drug: "Drug B", symptom: "Rash", severity: "Critical", date: "2025-09-21", status: "Investigating" },
    { id: 3, patient: "Ali Khan", drug: "Drug C", symptom: "Dizziness", severity: "Medium", date: "2025-09-22", status: "Resolved" },
    { id: 4, patient: "Sarah Johnson", drug: "Drug D", symptom: "Nausea", severity: "Low", date: "2025-09-23", status: "Monitoring" },
    { id: 5, patient: "Michael Brown", drug: "Drug E", symptom: "Fatigue", severity: "Medium", date: "2025-09-24", status: "Under Review" },
    { id: 6, patient: "Emma Wilson", drug: "Drug F", symptom: "Insomnia", severity: "High", date: "2025-09-25", status: "Investigating" },
    { id: 7, patient: "David Chen", drug: "Drug G", symptom: "Anxiety", severity: "Critical", date: "2025-09-26", status: "Urgent" },
    { id: 8, patient: "Lisa Anderson", drug: "Drug H", symptom: "Memory Loss", severity: "High", date: "2025-09-27", status: "Under Review" },
  ];

  // Filter reports based on search and severity
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.drug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.symptom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === '' || report.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  // Statistics data
  const stats = [
    {
      title: "Total Reports",
      value: reports.length,
      icon: <Assessment />,
      color: theme.palette.primary.main,
      change: "+12%",
      subtitle: "This month"
    },
    {
      title: "Critical Cases",
      value: reports.filter(r => r.severity === "Critical").length,
      icon: <Warning />,
      color: theme.palette.error.main,
      change: "+5%",
      subtitle: "Requires immediate attention"
    },
    {
      title: "Active Patients",
      value: new Set(reports.map(r => r.patient)).size,
      icon: <Person />,
      color: theme.palette.success.main,
      change: "+8%",
      subtitle: "Under monitoring"
    },
    {
      title: "Monitored Drugs",
      value: new Set(reports.map(r => r.drug)).size,
      icon: <Medication />,
      color: theme.palette.info.main,
      change: "+3%",
      subtitle: "In database"
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'urgent':
        return 'error';
      case 'investigating':
        return 'warning';
      case 'under review':
        return 'info';
      case 'monitoring':
        return 'primary';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleSeverityFilterChange = (event) => {
    setSeverityFilter(event.target.value);
    setPage(0);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastUpdated(new Date());
      setSnackbar({
        open: true,
        message: 'Dashboard data refreshed successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh data. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `adr-reports-${timestamp}`;
    
    if (format === 'csv') {
      exportToCSV(filename);
    } else if (format === 'pdf') {
      exportToPDF(filename);
    }
    
    setSnackbar({
      open: true,
      message: `Report exported as ${format.toUpperCase()} successfully!`,
      severity: 'success'
    });
    
    handleExportClose();
  };

  const exportToCSV = (filename) => {
    const headers = ['Report ID', 'Patient', 'Drug', 'Symptom', 'Severity', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.map(report => [
        `#${report.id.toString().padStart(3, '0')}`,
        `"${report.patient}"`,
        `"${report.drug}"`,
        `"${report.symptom}"`,
        report.severity,
        `"${report.status}"`,
        report.date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToPDF = (filename) => {
    // Placeholder for PDF export - would integrate with a PDF library like jsPDF
    console.log(`Exporting to PDF: ${filename}.pdf`);
    // In real implementation, you'd use jsPDF or similar library
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
                .map((report) => (
                <TableRow 
                  key={report.id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.02) 
                    } 
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{report.id.toString().padStart(3, '0')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                        {report.patient.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {report.patient}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{report.drug}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{report.symptom}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.severity}
                      color={getSeverityColor(report.severity)}
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status}
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
                        {new Date(report.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Report">
                        <IconButton size="small" color="secondary">
                          <GetApp fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
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
              Severity Distribution
            </Typography>
            <Stack spacing={2}>
              {['Critical', 'High', 'Medium', 'Low'].map((severity) => {
                const count = reports.filter(r => r.severity === severity).length;
                const percentage = (count / reports.length) * 100;
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
              Recent Activity
            </Typography>
            <Stack spacing={2}>
              {reports.slice(0, 4).map((report) => (
                <Box key={report.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: getSeverityColor(report.severity) + '.main' }}>
                    <Typography variant="caption" fontWeight="bold">
                      {report.id}
                    </Typography>
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {report.patient} reported {report.symptom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {report.drug} • {new Date(report.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip 
                    label={report.severity} 
                    size="small" 
                    color={getSeverityColor(report.severity)}
                    variant="outlined"
                  />
                </Box>
              ))}
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
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
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
