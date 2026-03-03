import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
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
  useTheme,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  AccountCircle,
  Logout,
  MedicalServices as MedicalServicesIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Language as LanguageIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import AuthContainer from '../../store/containers/AuthContainer';
import { useNotifications } from '../../contexts/NotificationContext';
import { useI18n } from '../../i18n';

const CustomAppBar = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user, logout, switchRole, isPatient, isDoctor } = AuthContainer.useContainer();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { locale, changeLanguage, supportedLanguages, t } = useI18n();
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchor, setNotifAnchor] = React.useState(null);
  const [langAnchor, setLangAnchor] = React.useState(null);

  // Safe function to get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    
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
    
    return 'User';
  };

  // Safe function to get user initials
  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    
    if (!displayName || displayName === 'Guest' || displayName === 'User') {
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

  // Safe function to get user role
  const getUserRole = () => {
    if (!user || !user.role) return 'user';
    return user.role;
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

  const handleRoleSwitch = (role) => {
    handleClose();
    switchRole(role);
  };

  const getRoleColor = (role) => {
    return role === 'doctor' ? 'secondary' : 'primary';
  };

  const getRoleIcon = (role) => {
    return role === 'doctor' ? '👨‍⚕️' : '🤒';
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <MedicalServicesIcon sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SafeMed ADR
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<span>{getRoleIcon(getUserRole())}</span>}
              label={getUserRole().toUpperCase()}
              color={getRoleColor(getUserRole())}
              size="small"
              variant="filled"
            />
            
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Welcome, {getUserDisplayName()}
            </Typography>

            <Tooltip title="Toggle theme">
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                sx={{ ml: 1 }}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* Language Selector */}
            <Tooltip title={t('settings.selectLanguage')}>
              <IconButton
                color="inherit"
                onClick={(e) => setLangAnchor(e.currentTarget)}
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
                color="inherit"
                onClick={(e) => setNotifAnchor(e.currentTarget)}
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
              PaperProps={{ sx: { width: 360, maxHeight: 420 } }}
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
                            primary={notif.title}
                            secondary={notif.message}
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

            <Tooltip title="Account settings">
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
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
                  Signed in as
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getUserDisplayName()}
                </Typography>
              </Box>

              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;