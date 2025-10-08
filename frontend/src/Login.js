import { useState } from "react";
import {
  Box,
  Card,
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
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material";
import { ButtonLoading } from "./components/Loading";
import AuthContainer from "./containers/AuthContainer";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = AuthContainer.useContainer();

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(username, password);
    if (result.success) {
      console.log("Login successful:", result.user);
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
    { role: "Patient", username: "patient1", password: "1234", color: "primary" },
    { role: "Doctor", username: "doctor1", password: "abcd", color: "secondary" },
  ];

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: (theme) => 
              theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 4,
              textAlign: 'center',
              background: (theme) => 
                `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
            }}
          >
            <MedicalIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
              SafeMed ADR
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Adverse Drug Reaction Reporting System
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Demo Credentials */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Demo Credentials:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {demoCredentials.map((cred) => (
                  <Chip
                    key={cred.role}
                    label={`${cred.role}: ${cred.username}/${cred.password}`}
                    color={cred.color}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
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
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={handleInputChange(setUsername)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
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
                        aria-label="toggle password visibility"
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
                  fontWeight: 500,
                }}
              >
                <ButtonLoading loading={loading} loadingText="Signing In...">
                  Sign In
                </ButtonLoading>
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
          SafeMed ADR © 2025 - Secure Medical Reporting
        </Typography>
      </Box>
    </Container>
  );
}
