import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { ROUTES } from '../config/constants';

// Pages
import {
  Login,
  Registration,
  Home,
  Dashboard,
  DoctorHome,
  Settings,
  Report
} from '../pages';

// Layout Components
import { CustomAppBar, Navigation } from '../components';
import MainLayout from '../components/layout/MainLayout';

// Route Guards
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path={ROUTES.REGISTER} element={
          <PublicRoute>
            <Registration />
          </PublicRoute>
        } />
        
        {/* Protected Routes with Layout */}
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.DOCTOR_HOME} element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorHome />
                  </ProtectedRoute>
                } />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
                <Route path={ROUTES.REPORT} element={<Report />} />
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default AppRoutes;