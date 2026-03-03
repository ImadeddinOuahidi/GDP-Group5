import React, { useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, TextField, Button, Avatar,
  Switch, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Divider,
  Paper, List, ListItem, ListItemIcon, ListItemText, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  Snackbar, Alert, alpha, useTheme
} from '@mui/material';
import {
  Person as PersonIcon, Lock as LockIcon, Notifications as NotifIcon,
  Palette as PaletteIcon, CameraAlt as CameraIcon, Save as SaveIcon,
  Visibility, VisibilityOff, Email as EmailIcon, Phone as PhoneIcon,
  NotificationsActive, ReportProblem, CalendarMonth, SystemUpdate,
  DarkMode, LightMode, Logout as LogoutIcon, Badge as BadgeIcon,
  MedicalServices, LocalHospital
} from '@mui/icons-material';
import { useThemeMode } from '../../styles/theme/ThemeProvider';
import AuthContainer from '../../store/containers/AuthContainer';
import { api, tokenManager } from '../../services/apiClient';

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null;
}

export default function Settings() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const { user, updateProfile } = AuthContainer.useContainer();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Profile state
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    licenseNumber: user?.licenseNumber || '',
    hospital: user?.hospital || ''
  });

  // Security state
  const [pwdDialog, setPwdDialog] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  // Notification state
  const [notifSettings, setNotifSettings] = useState({
    emailNotif: true, pushNotif: true, smsNotif: false,
    highPriority: true, reportReminders: true, weeklyDigest: false, systemUpdates: true
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false, loginAlerts: true, sessionTimeout: '30', passwordExpiry: '90'
  });

  const showMessage = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      showMessage('Profile updated successfully');
    } catch (err) {
      showMessage(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const response = await api.auth.updateProfilePicture(formData);
      if (response.data?.profilePicture) {
        await updateProfile({ profilePicture: response.data.profilePicture });
      }
      showMessage('Profile picture updated');
    } catch (err) {
      showMessage('Failed to upload picture', 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      showMessage('Passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }
    try {
      await api.auth.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      showMessage('Password changed successfully');
      setPwdDialog(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  const handleSignOut = () => {
    tokenManager.clearTokens();
    window.location.href = '/login';
  };

  const tabs = [
    { label: 'Profile', icon: <PersonIcon /> },
    { label: 'Security', icon: <LockIcon /> },
    { label: 'Notifications', icon: <NotifIcon /> },
    { label: 'Appearance', icon: <PaletteIcon /> }
  ];

  const isDoctor = user?.role === 'doctor';

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account preferences
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          {tabs.map((t, i) => (
            <Tab key={i} icon={t.icon} label={t.label} iconPosition="start" sx={{ minHeight: 56, textTransform: 'none' }} />
          ))}
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {/* ── Profile Tab ── */}
          <TabPanel value={tab} index={0}>
            <Stack spacing={3}>
              {/* Avatar Section */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={user?.profilePicture}
                    sx={{ width: 96, height: 96, mx: 'auto', fontSize: 36, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute', bottom: 0, right: -4,
                      bgcolor: 'primary.main', color: '#fff',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 32, height: 32
                    }}
                  >
                    <CameraIcon fontSize="small" />
                  </IconButton>
                  <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleProfilePictureUpload} />
                </Box>
                <Typography fontWeight={600} sx={{ mt: 1.5 }}>{user?.firstName} {user?.lastName}</Typography>
                <Chip label={user?.role} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
              </Paper>

              {/* Personal Info */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Personal Information</Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      size="small" fullWidth label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                    <TextField
                      size="small" fullWidth label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                  </Stack>
                  <TextField
                    size="small" fullWidth label="Email" disabled
                    value={profile.email}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }}
                  />
                  <TextField
                    size="small" fullWidth label="Phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }}
                  />
                </Stack>
              </Paper>

              {/* Doctor Fields */}
              {isDoctor && (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Professional Information</Typography>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      size="small" fullWidth label="Specialization"
                      value={profile.specialization}
                      onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><MedicalServices fontSize="small" color="action" /></InputAdornment> }}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        size="small" fullWidth label="License Number"
                        value={profile.licenseNumber}
                        onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment> }}
                      />
                      <TextField
                        size="small" fullWidth label="Hospital"
                        value={profile.hospital}
                        onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LocalHospital fontSize="small" color="action" /></InputAdornment> }}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              )}

              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleProfileSave} disabled={saving} sx={{ alignSelf: 'flex-end' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </TabPanel>

          {/* ── Security Tab ── */}
          <TabPanel value={tab} index={1}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Password</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Change your account password
                </Typography>
                <Button variant="outlined" startIcon={<LockIcon />} onClick={() => setPwdDialog(true)}>
                  Change Password
                </Button>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Security Options</Typography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary="Two-Factor Authentication" secondary="Add an extra layer of security" />
                    <Switch checked={securitySettings.twoFactor} onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactor: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary="Login Alerts" secondary="Get notified of new sign-ins" />
                    <Switch checked={securitySettings.loginAlerts} onChange={(e) => setSecuritySettings({ ...securitySettings, loginAlerts: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary="Session Timeout" secondary="Auto-logout after inactivity" />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}>
                        <MenuItem value="15">15 min</MenuItem>
                        <MenuItem value="30">30 min</MenuItem>
                        <MenuItem value="60">1 hour</MenuItem>
                        <MenuItem value="120">2 hours</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary="Password Expiry" secondary="Force password change periodically" />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={securitySettings.passwordExpiry} onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value })}>
                        <MenuItem value="30">30 days</MenuItem>
                        <MenuItem value="60">60 days</MenuItem>
                        <MenuItem value="90">90 days</MenuItem>
                        <MenuItem value="never">Never</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItem>
                </List>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleSignOut}>
                  Sign Out of All Devices
                </Button>
              </Paper>
            </Stack>
          </TabPanel>

          {/* ── Notifications Tab ── */}
          <TabPanel value={tab} index={2}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Notification Channels</Typography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><EmailIcon color="action" /></ListItemIcon>
                    <ListItemText primary="Email Notifications" secondary="Receive updates via email" />
                    <Switch checked={notifSettings.emailNotif} onChange={(e) => setNotifSettings({ ...notifSettings, emailNotif: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><NotifIcon color="action" /></ListItemIcon>
                    <ListItemText primary="Push Notifications" secondary="Browser push notifications" />
                    <Switch checked={notifSettings.pushNotif} onChange={(e) => setNotifSettings({ ...notifSettings, pushNotif: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><PhoneIcon color="action" /></ListItemIcon>
                    <ListItemText primary="SMS Notifications" secondary="Text message alerts" />
                    <Switch checked={notifSettings.smsNotif} onChange={(e) => setNotifSettings({ ...notifSettings, smsNotif: e.target.checked })} />
                  </ListItem>
                </List>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Notification Types</Typography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><NotificationsActive color="warning" /></ListItemIcon>
                    <ListItemText primary="High Priority Alerts" secondary="Urgent side effect reports" />
                    <Switch checked={notifSettings.highPriority} onChange={(e) => setNotifSettings({ ...notifSettings, highPriority: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><ReportProblem color="info" /></ListItemIcon>
                    <ListItemText primary="Report Reminders" secondary="Follow-up reminders for reports" />
                    <Switch checked={notifSettings.reportReminders} onChange={(e) => setNotifSettings({ ...notifSettings, reportReminders: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><CalendarMonth color="action" /></ListItemIcon>
                    <ListItemText primary="Weekly Digest" secondary="Summary of weekly activity" />
                    <Switch checked={notifSettings.weeklyDigest} onChange={(e) => setNotifSettings({ ...notifSettings, weeklyDigest: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><SystemUpdate color="action" /></ListItemIcon>
                    <ListItemText primary="System Updates" secondary="Platform changes and features" />
                    <Switch checked={notifSettings.systemUpdates} onChange={(e) => setNotifSettings({ ...notifSettings, systemUpdates: e.target.checked })} />
                  </ListItem>
                </List>
              </Paper>
            </Stack>
          </TabPanel>

          {/* ── Appearance Tab ── */}
          <TabPanel value={tab} index={3}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Theme</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose your preferred appearance
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Paper
                    variant="outlined"
                    onClick={() => mode === 'dark' && toggleTheme()}
                    sx={{
                      p: 2, flex: 1, cursor: 'pointer', textAlign: 'center', borderRadius: 2,
                      borderColor: mode === 'light' ? 'primary.main' : 'divider',
                      bgcolor: mode === 'light' ? alpha(theme.palette.primary.main, 0.04) : 'transparent'
                    }}
                  >
                    <LightMode sx={{ fontSize: 32, color: mode === 'light' ? 'primary.main' : 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" fontWeight={mode === 'light' ? 600 : 400}>Light</Typography>
                  </Paper>
                  <Paper
                    variant="outlined"
                    onClick={() => mode === 'light' && toggleTheme()}
                    sx={{
                      p: 2, flex: 1, cursor: 'pointer', textAlign: 'center', borderRadius: 2,
                      borderColor: mode === 'dark' ? 'primary.main' : 'divider',
                      bgcolor: mode === 'dark' ? alpha(theme.palette.primary.main, 0.04) : 'transparent'
                    }}
                  >
                    <DarkMode sx={{ fontSize: 32, color: mode === 'dark' ? 'primary.main' : 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" fontWeight={mode === 'dark' ? 600 : 400}>Dark</Typography>
                  </Paper>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Preview</Typography>
                <Paper
                  sx={{
                    p: 3, borderRadius: 2,
                    bgcolor: mode === 'dark' ? '#0B1120' : '#F8FAFC',
                    color: mode === 'dark' ? '#F1F5F9' : '#0F172A',
                    border: 1, borderColor: 'divider'
                  }}
                >
                  <Typography variant="body2" fontWeight={600} gutterBottom>Sample Content</Typography>
                  <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94A3B8' : '#64748B' }}>
                    This is how your content will appear with the selected theme.
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip label="Primary" size="small" color="primary" />
                    <Chip label="Success" size="small" color="success" />
                    <Chip label="Warning" size="small" color="warning" />
                  </Stack>
                </Paper>
              </Paper>
            </Stack>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={pwdDialog} onClose={() => setPwdDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {['current', 'new', 'confirm'].map((field) => (
              <TextField
                key={field}
                size="small"
                fullWidth
                label={field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm Password'}
                type={showPwd[field] ? 'text' : 'password'}
                value={passwords[field]}
                onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd({ ...showPwd, [field]: !showPwd[field] })}>
                        {showPwd[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwdDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePasswordChange}>Update Password</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
