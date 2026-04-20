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
  AdminPanelSettings as AdminPanelIcon,
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

const drawerWidth = 292;

const Navigation = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isPatient, isAdmin } = AuthContainer.useContainer();
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

  const adminNavItems = [
    { text: t('navigation.adminOverview'), caption: t('navigation.operationalSummary'), icon: <AdminPanelIcon />, path: '/admin-home', badge: null },
    { text: t('navigation.staffInbox'), caption: t('navigation.adminQueueCaption'), icon: <ReviewIcon />, path: '/review-requests', badge: null },
    { text: t('navigation.medicationGovernance'), caption: t('navigation.catalogGovernanceCaption'), icon: <MedicineIcon />, path: '/medications', badge: null },
    { text: t('navigation.adminAnalytics'), caption: t('navigation.platformSignals'), icon: <DashboardIcon />, path: '/dashboard', badge: null },
    { text: t('navigation.settings'), caption: t('navigation.profileAndPreferences'), icon: <SettingsIcon />, path: '/settings', badge: null },
  ];

  const navItems = isPatient ? patientNavItems : (isAdmin ? adminNavItems : doctorNavItems);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="organic-fade-in">
      <Box
        sx={{
          p: 2.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          background: `linear-gradient(140deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14)} 0%, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08)} 100%)`,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '40% 60% 62% 38% / 44% 42% 58% 56%',
          }}
        >
          <MedicationIcon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
            {t('common.appName')}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {isPatient ? t('navigation.patientWorkspace') : (isAdmin ? t('navigation.adminWorkspace') : t('navigation.doctorWorkspace'))}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          p: 2.5,
          pb: 1.75,
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.18 : 0.42),
        }}
      >
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
                  px: 1.4,
                  py: 1.05,
                  borderRadius: '16px 26px 16px 24px',
                  border: 1,
                  borderColor: active ? alpha(theme.palette.primary.main, 0.65) : alpha(theme.palette.divider, 0.15),
                  backgroundColor: active
                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.14)
                    : alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.14 : 0.46),
                  '&:hover': {
                    transform: 'translateX(2px)',
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.26 : 0.12),
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.18),
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
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: '18px 26px 18px 24px',
            bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
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
            backdropFilter: 'blur(14px)',
            borderTopRightRadius: 26,
            borderBottomRightRadius: 26,
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
            backdropFilter: 'blur(16px)',
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
