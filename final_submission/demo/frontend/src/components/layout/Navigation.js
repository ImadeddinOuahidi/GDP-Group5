import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Report as ReportIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  MedicalServices as DoctorIcon,
  Person as PatientIcon,
  LocalPharmacy as MedicineIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';

const drawerWidth = 240;

const Navigation = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isPatient, isDoctor } = AuthContainer.useContainer();

  const patientNavItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/', badge: null },
    { text: 'Report Side Effect', icon: <ReportIcon />, path: '/report', badge: 'New' },
    { text: 'My Reports', icon: <HistoryIcon />, path: '/reports', badge: '3' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', badge: null },
  ];

  const doctorNavItems = [
    { text: 'Dashboard', icon: <DoctorIcon />, path: '/doctor-home', badge: null },
    { text: 'Review Requests', icon: <ReviewIcon />, path: '/review-requests', badge: null },
    { text: 'Medications', icon: <MedicineIcon />, path: '/medications', badge: null },
    { text: 'Analytics', icon: <DashboardIcon />, path: '/dashboard', badge: null },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', badge: null },
  ];

  const navItems = isPatient ? patientNavItems : doctorNavItems;

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {isPatient ? <PatientIcon color="primary" /> : <DoctorIcon color="secondary" />}
        <Box>
          <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {user?.name}
          </Box>
          <Chip
            label={user?.role}
            size="small"
            color={isDoctor ? 'secondary' : 'primary'}
            variant="outlined"
          />
        </Box>
      </Box>

      <List sx={{ pt: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) 
                    ? theme.palette.primary.main 
                    : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive(item.path) ? 500 : 400,
                    color: isActive(item.path) 
                      ? theme.palette.primary.main 
                      : 'inherit',
                  },
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color={item.badge === 'New' ? 'success' : 'primary'}
                  sx={{ 
                    height: 20, 
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 2 }} />
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
            textAlign: 'center',
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
          }}
        >
          <Box sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
            SafeMed ADR System
          </Box>
          <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Medication Safety First
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            position: 'relative',
            height: '100vh',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Navigation;