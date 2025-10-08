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
import { useThemeMode } from '../theme/ThemeProvider';
import AuthContainer from '../containers/AuthContainer';

const CustomAppBar = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user, logout, switchRole, isPatient, isDoctor } = AuthContainer.useContainer();
  
  const [anchorEl, setAnchorEl] = React.useState(null);

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
              icon={<span>{getRoleIcon(user.role)}</span>}
              label={user.role.toUpperCase()}
              color={getRoleColor(user.role)}
              size="small"
              variant="filled"
            />
            
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Welcome, {user.name}
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
                  {user.name.charAt(0).toUpperCase()}
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
                  {user.name}
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