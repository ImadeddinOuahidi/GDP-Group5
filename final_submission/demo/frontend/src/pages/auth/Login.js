import { useState } from "react";
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Chip,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  MedicalServices as MedicalIcon,
  PersonAdd as SignUpIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "../../components/ui/Loading";
import AuthContainer from "../../store/containers/AuthContainer";
import { useI18n } from '../../i18n';

export default function Login({ onShowRegistration }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = AuthContainer.useContainer();

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(emailOrUsername, password);
    if (result.success) {
      console.log("Login successful:", result.user);
      // Redirect will be handled by the main App component
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) clearError();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const demoCredentials = [
    { role: t('common.patient'), email: "patient@demo.com", password: "Demo@123", color: "primary" },
    { role: t('common.doctor'), email: "doctor@demo.com", password: "Demo@123", color: "secondary" },
  ];

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3.5,
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.04),
            }}
          >
            <MedicalIcon sx={{ fontSize: 42, mb: 1.5 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight="700">
              {t('common.appName')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.subtitle')}
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            {/* Demo Credentials */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('auth.demoCredentials')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {demoCredentials.map((cred) => (
                  <Chip
                    key={cred.role}
                    label={`${cred.role}: ${cred.email} / ${cred.password}`}
                    color={cred.color}
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setEmailOrUsername(cred.email);
                      setPassword(cred.password);
                    }}
                    sx={{ 
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.08),
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Login Form */}
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                <TextField
                margin="normal"
                required
                fullWidth
                id="emailOrUsername"
                label={t('auth.emailOrUsername')}
                name="emailOrUsername"
                autoComplete="email"
                autoFocus
                value={emailOrUsername}
                onChange={handleInputChange(setEmailOrUsername)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText={t('auth.emailOrUsernameHelper')}
              />              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={handleInputChange(setPassword)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={t('auth.togglePasswordVisibility')}
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 650,
                }}
              >
                <ButtonLoading loading={loading} loadingText={t('auth.signingIn')}>
                  {t('auth.signIn')}
                </ButtonLoading>
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.newToApp')}
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={onShowRegistration}
                startIcon={<SignUpIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 650,
                }}
              >
                {t('auth.createAccount')}
              </Button>
            </Box>
          </CardContent>
        </Paper>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          {t('auth.footerCopyright')}
        </Typography>
      </Box>
    </Container>
  );
}
