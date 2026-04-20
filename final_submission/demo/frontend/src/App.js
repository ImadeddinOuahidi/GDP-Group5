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
  AdminHome,
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
  const { isAuthenticated, isPatient, isAdmin } = AuthContainer.useContainer();

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
      <Box sx={{ width: '100%', minHeight: '100vh', px: { xs: 2, md: 4 }, py: { xs: 6, md: 10 } }}>
        <Box
          sx={{
            maxWidth: 620,
            mx: 'auto',
            border: 1,
            borderColor: 'divider',
            borderRadius: { xs: 4, md: 6 },
            p: { xs: 3, md: 5 },
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(14, 36, 41, 0.62)' : 'rgba(247, 255, 253, 0.78)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <LinearProgress sx={{ mb: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '34vh' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                SafeMed Organic UI
              </Typography>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              {t('app.loading')}
            </Typography>
          </Box>
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
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: { xs: '65vw', md: '36vw' },
          aspectRatio: '1 / 1',
          top: { xs: '-22vw', md: '-14vw' },
          left: { xs: '-18vw', md: '-9vw' },
          borderRadius: '42% 58% 66% 34% / 44% 38% 62% 56%',
          background: 'linear-gradient(135deg, rgba(34,211,238,0.24), rgba(5,150,105,0.2))',
          filter: 'blur(6px)',
          zIndex: -1,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: { xs: '56vw', md: '30vw' },
          aspectRatio: '1 / 1',
          right: { xs: '-18vw', md: '-10vw' },
          bottom: { xs: '-26vw', md: '-16vw' },
          borderRadius: '54% 46% 41% 59% / 52% 62% 38% 48%',
          background: 'linear-gradient(135deg, rgba(8,145,178,0.24), rgba(34,211,238,0.14))',
          filter: 'blur(8px)',
          zIndex: -1,
        }}
      />

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
        className="organic-fade-in"
      >
        <CustomAppBar onOpenMobileNav={isMobile ? handleDrawerToggle : undefined} />
        
        <Box
          sx={{
            flexGrow: 1,
            px: { xs: 1.5, sm: 2.5, md: 4 },
            py: { xs: 2, md: 3 },
            bgcolor: 'transparent',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 1440,
              mx: 'auto',
              p: { xs: 1.25, md: 2 },
              borderRadius: { xs: 4, md: 5 },
              border: 1,
              borderColor: 'divider',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(14, 36, 41, 0.48)' : 'rgba(247, 255, 253, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
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
                  <Route path="/admin-home" element={isAdmin ? <AdminHome /> : <Navigate to="/doctor-home" replace />} />
                  <Route path="/doctor-home" element={isAdmin ? <Navigate to="/admin-home" replace /> : <DoctorHome />} />
                  <Route path="/review-requests" element={<ReviewRequests />} />
                  <Route path="/reports/:id" element={<ReportDetail />} />
                  {/* Medication System Routes for Side Effect Reporting */}
                  <Route path="/medications" element={<MedicationManagement />} />
                  <Route path="/add-medication" element={<AddMedication />} />
                  <Route path="/medications/edit/:id" element={<AddMedication />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/doctor" element={<Navigate to={isAdmin ? "/admin-home" : "/doctor-home"} replace />} />
                  <Route path="/" element={<Navigate to={isAdmin ? "/admin-home" : "/doctor-home"} replace />} />
                  <Route path="*" element={<Navigate to={isAdmin ? "/admin-home" : "/doctor-home"} replace />} />
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
