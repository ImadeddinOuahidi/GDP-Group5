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
    <Container component="main" maxWidth="md" sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: { xs: 4, md: 6 },
          position: 'relative',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: { xs: 220, md: 300 },
            height: { xs: 220, md: 300 },
            borderRadius: '38% 62% 56% 44% / 48% 38% 62% 52%',
            top: { xs: 26, md: 12 },
            right: { xs: -90, md: -130 },
            background: 'linear-gradient(145deg, rgba(34, 211, 238, 0.2), rgba(5, 150, 105, 0.15))',
            filter: 'blur(3px)',
            zIndex: 0,

          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: { xs: 180, md: 250 },
            height: { xs: 180, md: 250 },
            borderRadius: '62% 38% 40% 60% / 42% 64% 36% 58%',
            bottom: { xs: -48, md: -32 },
            left: { xs: -80, md: -120 },
            background: 'linear-gradient(145deg, rgba(8, 145, 178, 0.14), rgba(34, 211, 238, 0.2))',
            filter: 'blur(4px)',
            zIndex: 0,
            
          }}
        />

        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 3, md: 4 },
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(14, 36, 41, 0.75)' : 'rgba(247, 255, 253, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            zIndex: 1,
            
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              background: `linear-gradient(130deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14)} 0%, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.16 : 0.1)} 100%)`,
            }}
          >
            <MedicalIcon
              sx={{
                fontSize: 44,
                mb: 1.5,
                p: 1,
                borderRadius: '42% 58% 63% 37% / 43% 39% 61% 57%',
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.2 : 0.48),
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom fontWeight="700">
              {t('common.appName')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.subtitle')}
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, md: 4.5 } }}>
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
                      borderRadius: 999,
                      px: 1,
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
                  borderRadius: 999,
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
                  borderRadius: 999,
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
          sx={{ mt: 2.5, opacity: 0.9 }}
        >
          {t('auth.footerCopyright')}
        </Typography>
      </Box>
    </Container>
  );
}
