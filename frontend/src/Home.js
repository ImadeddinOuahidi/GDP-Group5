import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Paper,
  Alert,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Report as ReportIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material";
import AuthContainer from "./containers/AuthContainer";

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = AuthContainer.useContainer();

  const features = [
    {
      title: "Quick Reporting",
      description: "Report side effects in minutes with our intuitive interface",
      icon: <SpeedIcon color="primary" sx={{ fontSize: 40 }} />,
      color: "primary",
    },
    {
      title: "Secure & Private",
      description: "Your medical data is encrypted and protected",
      icon: <SecurityIcon color="secondary" sx={{ fontSize: 40 }} />,
      color: "secondary",
    },
    {
      title: "Real-time Analysis",
      description: "Doctors get instant alerts for urgent cases",
      icon: <TimelineIcon color="success" sx={{ fontSize: 40 }} />,
      color: "success",
    },
  ];

  const quickActions = [
    {
      title: "Report Side Effect",
      description: "Quickly report any adverse drug reactions you're experiencing",
      icon: <ReportIcon />,
      action: () => navigate("/report"),
      color: "primary",
      variant: "contained",
    },
    {
      title: "Settings",
      description: "Manage your profile and notification preferences",
      icon: <SettingsIcon />,
      action: () => navigate("/settings"),
      color: "secondary",
      variant: "outlined",
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Welcome Header */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <MedicalIcon 
              sx={{ 
                fontSize: 60, 
                color: 'primary.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h3" component="h1" gutterBottom fontWeight="600">
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              SafeMed ADR - Adverse Drug Reaction Reporting System
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto' }}>
              Report medicine side effects quickly and securely. 
              Help healthcare professionals identify urgent cases and keep patients safe.
            </Typography>
            <Chip 
              label="Patient Portal" 
              color="primary" 
              sx={{ mt: 2 }} 
            />
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                    {React.cloneElement(action.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={action.variant}
                    color={action.color}
                    size="large"
                    onClick={action.action}
                    startIcon={action.icon}
                  >
                    {action.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Features Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Why Choose SafeMed ADR?
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Important Notice */}
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            },
          }}
        >
          <Typography variant="body2">
            <strong>Important:</strong> If you're experiencing a medical emergency, 
            call emergency services immediately. This system is for reporting 
            non-emergency side effects only.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}
