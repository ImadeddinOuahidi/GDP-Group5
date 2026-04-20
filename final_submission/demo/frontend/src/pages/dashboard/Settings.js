import React, { useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, TextField, Button, Avatar,
  Switch, Select, MenuItem, FormControl, Tabs, Tab, Divider,
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
import { useI18n } from '../../i18n';

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null;
}

export default function Settings() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const { t } = useI18n();
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
      showMessage(t('settings.profileUpdated'));
    } catch (err) {
      showMessage(err.message || t('settings.profileUpdateFailed'), 'error');
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
      showMessage(t('settings.profilePictureUpdated'));
    } catch (err) {
      showMessage(t('settings.profilePictureUploadFailed'), 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      showMessage(t('settings.passwordsDoNotMatch'), 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showMessage(t('settings.passwordMinLength'), 'error');
      return;
    }
    try {
      await api.auth.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      showMessage(t('settings.passwordChanged'));
      setPwdDialog(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      showMessage(err.response?.data?.message || t('settings.passwordChangeFailed'), 'error');
    }
  };

  const handleSignOut = () => {
    tokenManager.clearTokens();
    window.location.href = '/login';
  };

  const tabs = [
    { label: t('settings.tabs.profile'), icon: <PersonIcon /> },
    { label: t('settings.tabs.security'), icon: <LockIcon /> },
    { label: t('settings.tabs.notifications'), icon: <NotifIcon /> },
    { label: t('settings.tabs.appearance'), icon: <PaletteIcon /> }
  ];

  const isDoctor = user?.role === 'doctor';

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto', py: 4, px: 2 }} className="organic-fade-in">
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {t('settings.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('settings.managePreferences')}
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: '16px' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}
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
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px', textAlign: 'center' }}>
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
                      bgcolor: 'primary.main', color: 'common.white',
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
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.personalInformation')}</Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      size="small" fullWidth label={t('settings.firstName')}
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                    <TextField
                      size="small" fullWidth label={t('settings.lastName')}
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                  </Stack>
                  <TextField
                    size="small" fullWidth label={t('settings.email')} disabled
                    value={profile.email}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }}
                  />
                  <TextField
                    size="small" fullWidth label={t('settings.phone')}
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }}
                  />
                </Stack>
              </Paper>

              {/* Doctor Fields */}
              {isDoctor && (
                <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.professionalInformation')}</Typography>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      size="small" fullWidth label={t('settings.specialization')}
                      value={profile.specialization}
                      onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><MedicalServices fontSize="small" color="action" /></InputAdornment> }}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        size="small" fullWidth label={t('settings.licenseNumber')}
                        value={profile.licenseNumber}
                        onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment> }}
                      />
                      <TextField
                        size="small" fullWidth label={t('settings.hospital')}
                        value={profile.hospital}
                        onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LocalHospital fontSize="small" color="action" /></InputAdornment> }}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              )}

              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleProfileSave} disabled={saving} sx={{ alignSelf: 'flex-end', borderRadius: 999 }}>
                {saving ? t('settings.saving') : t('settings.saveChanges')}
              </Button>
            </Stack>
          </TabPanel>

          {/* ── Security Tab ── */}
          <TabPanel value={tab} index={1}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.password')}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('settings.changePasswordDescription')}
                </Typography>
                <Button variant="outlined" startIcon={<LockIcon />} onClick={() => setPwdDialog(true)}>
                  {t('settings.changePassword')}
                </Button>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.securityOptions')}</Typography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary={t('settings.twoFactorAuthentication')} secondary={t('settings.twoFactorAuthenticationDescription')} />
                    <Switch checked={securitySettings.twoFactor} onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactor: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary={t('settings.loginAlerts')} secondary={t('settings.loginAlertsDescription')} />
                    <Switch checked={securitySettings.loginAlerts} onChange={(e) => setSecuritySettings({ ...securitySettings, loginAlerts: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary={t('settings.sessionTimeout')} secondary={t('settings.sessionTimeoutDescription')} />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}>
                        <MenuItem value="15">{t('settings.time.15min')}</MenuItem>
                        <MenuItem value="30">{t('settings.time.30min')}</MenuItem>
                        <MenuItem value="60">{t('settings.time.1hour')}</MenuItem>
                        <MenuItem value="120">{t('settings.time.2hours')}</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText primary={t('settings.passwordExpiry')} secondary={t('settings.passwordExpiryDescription')} />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={securitySettings.passwordExpiry} onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: e.target.value })}>
                        <MenuItem value="30">{t('settings.time.30days')}</MenuItem>
                        <MenuItem value="60">{t('settings.time.60days')}</MenuItem>
                        <MenuItem value="90">{t('settings.time.90days')}</MenuItem>
                        <MenuItem value="never">{t('settings.time.never')}</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItem>
                </List>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleSignOut}>
                  {t('settings.signOutAllDevices')}
                </Button>
              </Paper>
            </Stack>
          </TabPanel>

          {/* ── Notifications Tab ── */}
          <TabPanel value={tab} index={2}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.notificationChannels')}</Typography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><EmailIcon color="action" /></ListItemIcon>
                    <ListItemText primary={t('settings.emailNotifications')} secondary={t('settings.emailNotificationsDescription')} />
                    <Switch checked={notifSettings.emailNotif} onChange={(e) => setNotifSettings({ ...notifSettings, emailNotif: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><NotifIcon color="action" /></ListItemIcon>
                    <ListItemText primary={t('settings.pushNotifications')} secondary={t('settings.pushNotificationsDescription')} />
                    <Switch checked={notifSettings.pushNotif} onChange={(e) => setNotifSettings({ ...notifSettings, pushNotif: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><PhoneIcon color="action" /></ListItemIcon>
                    <ListItemText primary={t('settings.smsNotifications')} secondary={t('settings.smsNotificationsDescription')} />
                    <Switch checked={notifSettings.smsNotif} onChange={(e) => setNotifSettings({ ...notifSettings, smsNotif: e.target.checked })} />
                  </ListItem>
                </List>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.notificationTypes')}</Typography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><NotificationsActive color="warning" /></ListItemIcon>
                    <ListItemText primary={t('settings.highPriorityAlerts')} secondary={t('settings.highPriorityAlertsDescription')} />
                    <Switch checked={notifSettings.highPriority} onChange={(e) => setNotifSettings({ ...notifSettings, highPriority: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><ReportProblem color="info" /></ListItemIcon>
                    <ListItemText primary={t('settings.reportReminders')} secondary={t('settings.reportRemindersDescription')} />
                    <Switch checked={notifSettings.reportReminders} onChange={(e) => setNotifSettings({ ...notifSettings, reportReminders: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><CalendarMonth color="action" /></ListItemIcon>
                    <ListItemText primary={t('settings.weeklyDigest')} secondary={t('settings.weeklyDigestDescription')} />
                    <Switch checked={notifSettings.weeklyDigest} onChange={(e) => setNotifSettings({ ...notifSettings, weeklyDigest: e.target.checked })} />
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}><SystemUpdate color="action" /></ListItemIcon>
                    <ListItemText primary={t('settings.systemUpdates')} secondary={t('settings.systemUpdatesDescription')} />
                    <Switch checked={notifSettings.systemUpdates} onChange={(e) => setNotifSettings({ ...notifSettings, systemUpdates: e.target.checked })} />
                  </ListItem>
                </List>
              </Paper>
            </Stack>
          </TabPanel>

          {/* ── Appearance Tab ── */}
          <TabPanel value={tab} index={3}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.theme')}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('settings.themeDescription')}
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
                    <Typography variant="body2" fontWeight={mode === 'light' ? 600 : 400}>{t('settings.lightMode')}</Typography>
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
                    <Typography variant="body2" fontWeight={mode === 'dark' ? 600 : 400}>{t('settings.darkMode')}</Typography>
                  </Paper>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('settings.preview')}</Typography>
                <Paper
                  sx={{
                    p: 3, borderRadius: 2,
                    bgcolor: mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.primary.main, 0.08),
                    color: 'text.primary',
                    border: 1, borderColor: 'divider'
                  }}
                >
                  <Typography variant="body2" fontWeight={600} gutterBottom>{t('settings.sampleContent')}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('settings.previewDescription')}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip label={t('settings.primary')} size="small" color="primary" />
                    <Chip label={t('common.success')} size="small" color="success" />
                    <Chip label={t('common.warning')} size="small" color="warning" />
                  </Stack>
                </Paper>
              </Paper>
            </Stack>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={pwdDialog} onClose={() => setPwdDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{t('settings.changePassword')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {['current', 'new', 'confirm'].map((field) => (
              <TextField
                key={field}
                size="small"
                fullWidth
                label={field === 'current' ? t('settings.currentPassword') : field === 'new' ? t('settings.newPassword') : t('settings.confirmPassword')}
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
          <Button onClick={() => setPwdDialog(false)} sx={{ borderRadius: 999 }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handlePasswordChange} sx={{ borderRadius: 999 }}>{t('settings.updatePassword')}</Button>
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
