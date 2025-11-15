import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Card,
  CardContent,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Loading animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  animation: `${pulse} 2s ease-in-out infinite`,
  background: theme.palette.mode === 'dark' 
    ? 'rgba(30, 30, 30, 0.9)' 
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
}));

// Full screen loading overlay
export const LoadingOverlay = ({ message = 'Loading...', open = true }) => (
  <Backdrop
    sx={{
      color: '#fff',
      zIndex: (theme) => theme.zIndex.drawer + 1,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
    }}
    open={open}
  >
    <StyledCard>
      <CardContent sx={{ textAlign: 'center', py: 4, px: 6 }}>
        <CircularProgress 
          size={60} 
          thickness={4} 
          sx={{ mb: 3, color: 'primary.main' }}
        />
        <Typography variant="h6" component="div" gutterBottom>
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we process your request
        </Typography>
      </CardContent>
    </StyledCard>
  </Backdrop>
);

// Inline loading component
export const InlineLoading = ({ 
  size = 40, 
  message, 
  color = 'primary',
  variant = 'indeterminate' 
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    p={3}
  >
    <CircularProgress 
      size={size} 
      color={color}
      variant={variant}
      sx={{ mb: message ? 2 : 0 }}
    />
    {message && (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {message}
      </Typography>
    )}
  </Box>
);

// Simple loading indicator for buttons (use with MUI Button component)
export const ButtonLoading = ({ loading, children, loadingText = 'Loading...' }) => {
  return loading ? (
    <Box display="flex" alignItems="center" gap={1}>
      <CircularProgress size={16} color="inherit" />
      {loadingText}
    </Box>
  ) : (
    children
  );
};

export default InlineLoading;