import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

// Import components
import Home from "./Home";
import Report from "./Report";
import Settings from "./Settings";
import DoctorHome from "./DoctorHome";
import Dashboard from "./Dashboard";
import Login from "./Login";

// Import custom components and providers
import AuthContainer from "./containers/AuthContainer";
import { CustomThemeProvider } from "./theme/ThemeProvider";
import CustomAppBar from "./components/CustomAppBar";
import Navigation from "./components/Navigation";

function AppContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isPatient } = AuthContainer.useContainer();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!isAuthenticated) {
    return <Login />;
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
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/doctor" element={<DoctorHome />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/doctor" replace />} />
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
