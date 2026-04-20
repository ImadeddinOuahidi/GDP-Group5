import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Chip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Popover,
  alpha,
  useTheme,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Logout,
  Menu as MenuIcon,
  Medication as MedicationIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Language as LanguageIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import AuthContainer from '../../store/containers/AuthContainer';
import { useNotifications } from '../../contexts/NotificationContext';
import { useI18n } from '../../i18n';

const CustomAppBar = ({ onOpenMobileNav }) => {
  const theme = useTheme();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user, logout, isAdmin } = AuthContainer.useContainer();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { locale, changeLanguage, supportedLanguages, t } = useI18n();
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchor, setNotifAnchor] = React.useState(null);
  const [langAnchor, setLangAnchor] = React.useState(null);

  const getPageTitle = React.useCallback((pathname) => {
    if (pathname === '/') return t('navigation.overview');
    if (pathname === '/report') return t('navigation.newReport');
    if (pathname === '/reports') return t('navigation.myReports');
    if (pathname.startsWith('/reports/')) return t('reports.reportDetails');
    if (pathname === '/settings') return t('navigation.settings');
    if (pathname === '/admin-home') return t('navigation.adminOverview');
    if (pathname === '/doctor-home') return t('navigation.doctorOverview');
    if (pathname === '/review-requests') return isAdmin ? t('navigation.staffInbox') : t('navigation.reviewRequests');
    if (pathname === '/medications') return isAdmin ? t('navigation.medicationGovernance') : t('doctor.medicationManagement');
    if (pathname === '/add-medication') return t('doctor.addMedication');
    if (pathname.startsWith('/medications/edit/')) return t('doctor.editMedication');
    if (pathname === '/dashboard') return isAdmin ? t('navigation.adminAnalytics') : t('doctor.analyticsDashboard');
    return t('common.appName');
  }, [isAdmin, t]);

  // Safe function to get user display name
  const getUserDisplayName = () => {
    if (!user) return t('common.guest');
    
    // Handle both API user structure and demo user structure
    if (user.name) {
      return user.name;
    }
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) {
      return user.firstName;
    }
    
    if (user.username) {
      return user.username;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return t('common.user');
  };

  // Safe function to get user initials
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    
    if (!displayName || displayName === t('common.guest') || displayName === t('common.user')) {
      return 'U';
    }
    
    // Split name and get first letter of each part
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    
    // Single name or username
    return displayName.charAt(0).toUpperCase();
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const roleLabel = (user?.role || 'user').toUpperCase();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        mt: { xs: 1, md: 1.25 },
        mx: { xs: 1, md: 2 },
        width: 'auto',
        border: 1,
        borderColor: alpha(theme.palette.divider, 0.9),
        borderRadius: { xs: 3, md: 4 },
        backdropFilter: 'blur(14px) saturate(1.25)',
        backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.58 : 0.72),
      }}
    >
      <Toolbar sx={{ minHeight: 74, gap: 2, px: { xs: 1.25, sm: 2 } }}>
        {onOpenMobileNav && (
          <IconButton
            onClick={onOpenMobileNav}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              border: 1,
              borderColor: 'divider',
              borderRadius: 999,
              bgcolor: alpha(theme.palette.background.paper, 0.65),
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              mr: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: '41% 59% 63% 37% / 43% 41% 59% 57%',
            }}
          >
            <MedicationIcon fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
              {t('common.appName')}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {getPageTitle(location.pathname)}
            </Typography>
          </Box>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={roleLabel}
              size="small"
              variant="outlined"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                borderRadius: 999,
                bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
                borderColor: alpha(theme.palette.secondary.main, 0.58),
              }}
            />
            
            <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, color: 'text.secondary' }}>
              {getUserDisplayName()}
            </Typography>

            <Tooltip title={t('settings.toggleTheme')}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.background.paper, 0.65),
                }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* Language Selector */}
            <Tooltip title={t('settings.selectLanguage')}>
              <IconButton
                onClick={(e) => setLangAnchor(e.currentTarget)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.background.paper, 0.65),
                }}
              >
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={() => setLangAnchor(null)}
              PaperProps={{ sx: { minWidth: 160 } }}
            >
              {supportedLanguages.map((lang) => (
                <MenuItem
                  key={lang.code}
                  selected={locale === lang.code}
                  onClick={() => { changeLanguage(lang.code); setLangAnchor(null); }}
                >
                  <span style={{ marginRight: 8 }}>{lang.flag}</span>
                  {lang.nativeName}
                </MenuItem>
              ))}
            </Menu>

            {/* Notification Bell */}
            <Tooltip title={t('notifications.title')}>
              <IconButton
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.background.paper, 0.65),
                }}
              >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  width: 360,
                  maxHeight: 420,
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.95 : 0.96),
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold">{t('notifications.title')}</Typography>
                {unreadCount > 0 && (
                  <Tooltip title={t('notifications.markAllRead')}>
                    <IconButton size="small" onClick={markAllAsRead}>
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <List sx={{ p: 0, maxHeight: 340, overflow: 'auto' }}>
                {notifications.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary={t('notifications.noNotifications')}
                      primaryTypographyProps={{ color: 'text.secondary', textAlign: 'center' }}
                    />
                  </ListItem>
                ) : (
                  notifications.slice(0, 10).map((notif) => {
                    const icon = notif.priority === 'critical' ? <ErrorIcon color="error" /> :
                      notif.priority === 'high' ? <WarningIcon color="warning" /> :
                      notif.type === 'review_completed' ? <CheckIcon color="success" /> :
                      <InfoIcon color="info" />;
                    return (
                      <React.Fragment key={notif._id || notif.id}>
                        <ListItem
                          button
                          onClick={() => { markAsRead(notif._id || notif.id); setNotifAnchor(null); }}
                          sx={{ bgcolor: notif.isRead ? 'transparent' : 'action.hover', py: 1.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                          <ListItemText
                            primary={notif.localizedTitle || notif.title}
                            secondary={notif.localizedMessage || notif.message}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: notif.isRead ? 'normal' : 'bold' }}
                            secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    );
                  })
                )}
              </List>
            </Popover>

            <Tooltip title={t('settings.accountSettings')}>
              <IconButton
                size="large"
                onClick={handleMenu}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: '40% 60% 58% 42% / 47% 40% 60% 53%',
                  }}
                >
                  {getUserInitials()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('navigation.signedInAs')}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getUserDisplayName()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabel}
                </Typography>
              </Box>

              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout sx={{ mr: 1 }} />
                {t('auth.logOut')}
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;
