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
  Typography,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Home as HomeIcon,
  EditNote as ReportIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  MedicalServices as DoctorIcon,
  LocalPharmacy as MedicineIcon,
  RateReview as ReviewIcon,
  Medication as MedicationIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContainer from '../../store/containers/AuthContainer';
import { useNotifications } from '../../contexts/NotificationContext';
import { useI18n } from '../../i18n';

const drawerWidth = 272;

const Navigation = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isPatient } = AuthContainer.useContainer();
  const { unreadCount } = useNotifications();
  const { t } = useI18n();

  const patientNavItems = [
    { text: t('navigation.overview'), caption: t('navigation.patientLanding'), icon: <HomeIcon />, path: '/', badge: null },
    { text: t('navigation.newReport'), caption: t('navigation.submitAdr'), icon: <ReportIcon />, path: '/report', badge: null },
    { text: t('navigation.myReports'), caption: t('navigation.trackProgress'), icon: <HistoryIcon />, path: '/reports', badge: unreadCount > 0 ? String(unreadCount) : null },
    { text: t('navigation.settings'), caption: t('navigation.profileAndPreferences'), icon: <SettingsIcon />, path: '/settings', badge: null },
  ];

  const doctorNavItems = [
    { text: t('navigation.doctorOverview'), caption: t('navigation.operationalSummary'), icon: <DoctorIcon />, path: '/doctor-home', badge: null },
    { text: t('navigation.reviewRequests'), caption: t('navigation.pendingDoctorReviews'), icon: <ReviewIcon />, path: '/review-requests', badge: null },
    { text: t('navigation.medications'), caption: t('navigation.catalogManagement'), icon: <MedicineIcon />, path: '/medications', badge: null },
    { text: t('navigation.analytics'), caption: t('navigation.trendsAndReports'), icon: <DashboardIcon />, path: '/dashboard', badge: null },
    { text: t('navigation.settings'), caption: t('navigation.profileAndPreferences'), icon: <SettingsIcon />, path: '/settings', badge: null },
  ];

  const navItems = isPatient ? patientNavItems : doctorNavItems;

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  const userName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('common.safeMedUser');
  const userRole = String(user?.role || 'user').toUpperCase();

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Avatar
          variant="rounded"
          sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: 'primary.contrastText' }}
        >
          <MedicationIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
            {t('common.appName')}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {isPatient ? t('navigation.patientWorkspace') : t('navigation.doctorWorkspace')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {t('navigation.signedInAs')}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {userName}
        </Typography>
        <Chip label={userRole} size="small" sx={{ mt: 1 }} variant="outlined" />
      </Box>

      <Divider />

      <List sx={{ pt: 1.25, px: 1.25 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={active}
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: active ? 'primary.main' : 'transparent',
                  backgroundColor: active
                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08)
                    : 'transparent',
                  '&.Mui-selected:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.12),
                  },
                }}
              >
                <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 34 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  secondary={item.caption}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 600, fontSize: 14 }}
                  secondaryTypographyProps={{ fontSize: 11.5, sx: { color: 'text.secondary' } }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2.5 }}>
        <Box
          sx={{
            p: 1.75,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('navigation.safetyPriority')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 650 }}>
            {t('navigation.safetyPriorityDescription')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
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

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            position: 'fixed',
            height: '100vh',
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