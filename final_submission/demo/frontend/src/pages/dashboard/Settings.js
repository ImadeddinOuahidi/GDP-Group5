import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Switch,
  Button,
  TextField,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationIcon,
  Palette as ThemeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as CameraIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as EducationIcon,
  Work as WorkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import AuthContainer from '../../store/containers/AuthContainer';

export default function Settings() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { user, updateProfile, logout } = AuthContainer.useContainer();
  
  const [tabValue, setTabValue] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState({});

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialty: user?.doctorInfo?.specialty || user?.patientInfo?.emergencyContact || '',
    licenseNumber: user?.doctorInfo?.licenseNumber || '',
    hospital: user?.doctorInfo?.hospitalAffiliation || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    bio: user?.bio || '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    highPriorityAlerts: true,
    weeklyReports: false,
    smsNotifications: false,
    desktopNotifications: true,
    reportReminders: true,
    systemUpdates: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    passwordExpiry: '90',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSave = async () => {
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setEditingProfile(false);
        setShowSuccessMessage(true);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleNotificationChange = (setting) => (event) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const handleSecurityChange = (setting) => (event) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: event.target.checked || event.target.value
    }));
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Implement password change logic
    setChangePasswordOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowSuccessMessage(true);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
      p: 3 
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Settings & Preferences
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your profile, security, and application preferences
        </Typography>
      </Box>

      {/* Main Settings Card */}
      <Card sx={{ boxShadow: theme.shadows[4], borderRadius: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            }
          }}
        >
          <Tab 
            icon={<PersonIcon />} 
            label="Profile" 
            iconPosition="start"
            sx={{ px: 3 }}
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="Security" 
            iconPosition="start"
            sx={{ px: 3 }}
          />
          <Tab 
            icon={<NotificationIcon />} 
            label="Notifications" 
            iconPosition="start"
            sx={{ px: 3 }}
          />
          <Tab 
            icon={<ThemeIcon />} 
            label="Appearance" 
            iconPosition="start"
            sx={{ px: 3 }}
          />
        </Tabs>

        {/* Profile Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            {/* Profile Picture Section */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      fontSize: '3rem',
                      bgcolor: 'primary.main'
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 40,
                      height: 40,
                    }}
                  >
                    <CameraIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  {user?.name || `${profileData.firstName} ${profileData.lastName}`}
                </Typography>
                <Chip 
                  label={user?.role || 'User'} 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button 
                    variant={editingProfile ? "outlined" : "contained"}
                    startIcon={editingProfile ? <CancelIcon /> : <EditIcon />}
                    onClick={() => setEditingProfile(!editingProfile)}
                    size="small"
                  >
                    {editingProfile ? 'Cancel' : 'Edit Profile'}
                  </Button>
                  
                  {editingProfile && (
                    <Button 
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={handleProfileSave}
                      size="small"
                    >
                      Save
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Profile Details Section */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Personal Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!editingProfile}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!editingProfile}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editingProfile}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editingProfile}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>

                  {user?.role === 'doctor' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Medical Specialty"
                          value={profileData.specialty}
                          onChange={(e) => setProfileData(prev => ({ ...prev, specialty: e.target.value }))}
                          disabled={!editingProfile}
                          InputProps={{
                            startAdornment: <EducationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="License Number"
                          value={profileData.licenseNumber}
                          onChange={(e) => setProfileData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                          disabled={!editingProfile}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Hospital/Institution"
                          value={profileData.hospital}
                          onChange={(e) => setProfileData(prev => ({ ...prev, hospital: e.target.value }))}
                          disabled={!editingProfile}
                          InputProps={{
                            startAdornment: <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                        />
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!editingProfile}
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Password & Authentication
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Change Password"
                      secondary="Update your account password"
                    />
                    <Button 
                      variant="outlined" 
                      onClick={() => setChangePasswordOpen(true)}
                      size="small"
                    >
                      Change
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security to your account"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={securitySettings.twoFactorAuth}
                        onChange={handleSecurityChange('twoFactorAuth')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Login Alerts"
                      secondary="Receive notifications for new sign-ins"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={securitySettings.loginAlerts}
                        onChange={handleSecurityChange('loginAlerts')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Session Management
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Session Timeout</InputLabel>
                      <Select
                        value={securitySettings.sessionTimeout}
                        label="Session Timeout"
                        onChange={handleSecurityChange('sessionTimeout')}
                      >
                        <MenuItem value="15">15 minutes</MenuItem>
                        <MenuItem value="30">30 minutes</MenuItem>
                        <MenuItem value="60">1 hour</MenuItem>
                        <MenuItem value="120">2 hours</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Password Expiry</InputLabel>
                      <Select
                        value={securitySettings.passwordExpiry}
                        label="Password Expiry"
                        onChange={handleSecurityChange('passwordExpiry')}
                      >
                        <MenuItem value="30">30 days</MenuItem>
                        <MenuItem value="60">60 days</MenuItem>
                        <MenuItem value="90">90 days</MenuItem>
                        <MenuItem value="never">Never</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={logout}
                    fullWidth
                  >
                    Sign Out of All Devices
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <NotificationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  General Notifications
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Email Notifications"
                      secondary="Receive notifications via email"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationChange('emailNotifications')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Push Notifications"
                      secondary="Browser and mobile push notifications"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.pushNotifications}
                        onChange={handleNotificationChange('pushNotifications')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="SMS Notifications"
                      secondary="Receive important updates via SMS"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.smsNotifications}
                        onChange={handleNotificationChange('smsNotifications')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                  ADR Alert Settings
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="High Priority Alerts"
                      secondary="Immediate alerts for severe ADR reports"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.highPriorityAlerts}
                        onChange={handleNotificationChange('highPriorityAlerts')}
                        color="error"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Report Reminders"
                      secondary="Reminders for pending report reviews"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.reportReminders}
                        onChange={handleNotificationChange('reportReminders')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Weekly Reports"
                      secondary="Weekly summary of ADR activities"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.weeklyReports}
                        onChange={handleNotificationChange('weeklyReports')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="System Updates"
                      secondary="Notifications about system maintenance and updates"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={notificationSettings.systemUpdates}
                        onChange={handleNotificationChange('systemUpdates')}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ThemeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Theme Settings
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Dark Mode"
                      secondary="Switch between light and dark themes"
                    />
                    <ListItemSecondaryAction>
                      <Switch 
                        checked={isDarkMode}
                        onChange={toggleTheme}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Theme Preview
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Typography variant="body2">
                      This is how your interface will look with the current theme settings.
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip label="Primary" color="primary" size="small" />
                      <Chip label="Secondary" color="secondary" size="small" />
                      <Chip label="Success" color="success" size="small" />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Display Preferences
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Additional display customization options will be available in future updates.
                </Alert>
                
                <Typography variant="body2" color="text.secondary">
                  Current theme: <strong>{isDarkMode ? 'Dark' : 'Light'} Mode</strong>
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Password Change Dialog */}
      <Dialog 
        open={changePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
            Change Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      edge="end"
                    >
                      {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      edge="end"
                    >
                      {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      edge="end"
                    >
                      {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setChangePasswordOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePasswordChange}
            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
          icon={<SuccessIcon />}
        >
          Settings updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
