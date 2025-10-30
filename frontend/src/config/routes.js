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
  Report,
  Reports,
  AddMedicine,
  MedicineManagement
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
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/doctor-home" element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorHome />
                  </ProtectedRoute>
                } />
                <Route path="/medicines" element={
                  <ProtectedRoute requiredRole="doctor">
                    <MedicineManagement />
                  </ProtectedRoute>
                } />
                <Route path="/add-medicine" element={
                  <ProtectedRoute requiredRole="doctor">
                    <AddMedicine />
                  </ProtectedRoute>
                } />
                <Route path="/edit-medicine/:id" element={
                  <ProtectedRoute requiredRole="doctor">
                    <AddMedicine />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={<Settings />} />
                <Route path="/report" element={<Report />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default AppRoutes;