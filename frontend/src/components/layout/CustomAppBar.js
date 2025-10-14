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
  useTheme,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  AccountCircle,
  Logout,
  SwapHoriz,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import AuthContainer from '../../store/containers/AuthContainer';

const CustomAppBar = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user, logout, switchRole, isPatient, isDoctor } = AuthContainer.useContainer();
  
  const [anchorEl, setAnchorEl] = React.useState(null);

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

              <MenuItem 
                onClick={() => handleRoleSwitch('patient')} 
                disabled={isPatient}
              >
                <SwapHoriz sx={{ mr: 1 }} />
                Switch to Patient
              </MenuItem>
              
              <MenuItem 
                onClick={() => handleRoleSwitch('doctor')} 
                disabled={isDoctor}
              >
                <SwapHoriz sx={{ mr: 1 }} />
                Switch to Doctor
              </MenuItem>

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