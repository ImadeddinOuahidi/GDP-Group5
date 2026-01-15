import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, IconButton, useMediaQuery, useTheme, Alert, Snackbar, LinearProgress, Typography } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

// Import components from new structure
import {
  Home,
  Report,
  Reports,
  Settings,
  DoctorHome,
  Dashboard,
  Login,
  Registration,
  AddMedicine,
  MedicineManagement
} from "./pages";

// Import custom components and providers
import AuthContainer from "./store/containers/AuthContainer";
import { CustomThemeProvider } from "./styles/theme/ThemeProvider";
import { CustomAppBar, Navigation } from "./components";

function AppContent() {
  const theme = useTheme();
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
              Loading SafeMed ADR...
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
    setSuccessMessage(result.message || 'Registration successful! Welcome to SafeMed ADR.');
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
      {/* Mobile menu button */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

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
        <CustomAppBar />
        
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            {isPatient ? (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/report" element={<Report />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/doctor-home" element={<DoctorHome />} />
                <Route path="/medicines" element={<MedicineManagement />} />
                <Route path="/add-medicine" element={<AddMedicine />} />
                <Route path="/edit-medicine/:id" element={<AddMedicine />} />
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
  );
}

export default function App() {
  return (
    <CustomThemeProvider>
      <AuthContainer.Provider>
        <Router>
          <AppContent />
        </Router>
      </AuthContainer.Provider>
    </CustomThemeProvider>
  );
}
