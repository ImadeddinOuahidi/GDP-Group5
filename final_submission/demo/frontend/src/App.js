import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, useMediaQuery, useTheme, Alert, Snackbar, LinearProgress, Typography } from "@mui/material";

// Import components from new structure
import {
  Home,
  Report,
  Reports,
  ReportDetail,
  Settings,
  DoctorHome,
  Dashboard,
  Login,
  Registration,
  AddMedication,
  MedicationManagement,
  ReviewRequests
} from "./pages";

// Import custom components and providers
import AuthContainer from "./store/containers/AuthContainer";
import { CustomThemeProvider } from "./styles/theme/ThemeProvider";
import { CustomAppBar, Navigation } from "./components";
import { I18nProvider, useI18n } from "./i18n";
import { NotificationProvider } from "./contexts/NotificationContext";

function AppContent() {
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [appLoading, setAppLoading] = useState(true);
  const { isAuthenticated, isPatient } = AuthContainer.useContainer();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setAppLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  if (appLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              {t('app.loading')}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleShowRegistration = () => {
    setShowRegistration(true);
  };

  const handleBackToLogin = () => {
    setShowRegistration(false);
  };

  const handleRegistrationSuccess = (result) => {
    setShowRegistration(false);
    setSuccessMessage(result.message || t('auth.registrationSuccess'));
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  if (!isAuthenticated) {
    if (showRegistration) {
      return (
        <Registration 
          onSuccess={handleRegistrationSuccess}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return (
      <>
        <Login onShowRegistration={handleShowRegistration} />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Sidebar */}
      <Navigation 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <CustomAppBar onOpenMobileNav={isMobile ? handleDrawerToggle : undefined} />
        
        <Box
          sx={{
            flexGrow: 1,
            px: { xs: 1.5, sm: 2.5, md: 4 },
            py: { xs: 2, md: 3 },
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
            <Routes>
              {isPatient ? (
                <>
                  <Route path="/" element={<Home />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/:id" element={<ReportDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  <Route path="/doctor-home" element={<DoctorHome />} />
                  <Route path="/review-requests" element={<ReviewRequests />} />
                  <Route path="/reports/:id" element={<ReportDetail />} />
                  {/* Medication System Routes for Side Effect Reporting */}
                  <Route path="/medications" element={<MedicationManagement />} />
                  <Route path="/add-medication" element={<AddMedication />} />
                  <Route path="/medications/edit/:id" element={<AddMedication />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/doctor" element={<Navigate to="/doctor-home" replace />} />
                  <Route path="/" element={<Navigate to="/doctor-home" replace />} />
                  <Route path="*" element={<Navigate to="/doctor-home" replace />} />
                </>
              )}
            </Routes>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <CustomThemeProvider>
      <I18nProvider>
        <AuthContainer.Provider>
          <NotificationProvider>
            <Router>
              <AppContent />
            </Router>
          </NotificationProvider>
        </AuthContainer.Provider>
      </I18nProvider>
    </CustomThemeProvider>
  );
}
