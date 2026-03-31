import { createTheme } from '@mui/material/styles';

const neutralScale = {
  white: '#ffffff',
  black: '#0f172a',
  gray50: '#fafafa',
  gray100: '#f3f3f3',
  gray200: '#dbe3ef',
  gray300: '#c2d0e3',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0b1220',
};

const brandLight = {
  primary: { light: '#3b82f6', main: '#1d4ed8', dark: '#1e40af' },
  secondary: { light: '#14b8a6', main: '#0f766e', dark: '#115e59' },
  success: '#15803d',
  warning: '#b45309',
  error: '#b91c1c',
  info: '#0369a1',
};

const brandDark = {
  primary: { light: '#93c5fd', main: '#60a5fa', dark: '#3b82f6' },
  secondary: { light: '#5eead4', main: '#2dd4bf', dark: '#14b8a6' },
  success: '#4ade80',
  warning: '#f59e0b',
  error: '#f87171',
  info: '#38bdf8',
};

const baseTypography = {
  fontFamily: '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
  h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.15 },
  h2: { fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.2 },
  h3: { fontSize: '1.6rem', fontWeight: 650, lineHeight: 1.25 },
  h4: { fontSize: '1.35rem', fontWeight: 650, lineHeight: 1.3 },
  h5: { fontSize: '1.1rem', fontWeight: 650, lineHeight: 1.4 },
  h6: { fontSize: '0.98rem', fontWeight: 650, lineHeight: 1.4 },
  subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.45 },
  subtitle2: { fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.45 },
  body1: { fontSize: '0.96rem', lineHeight: 1.6 },
  body2: { fontSize: '0.86rem', lineHeight: 1.55 },
  button: {
    textTransform: 'none',
    fontWeight: 600,
    letterSpacing: '0.01em',
  },
};

const buildComponentTheme = (isDark) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundImage: isDark
          ? 'radial-gradient(circle at 18% 12%, rgba(96,165,250,0.12) 0%, transparent 38%), radial-gradient(circle at 84% 0%, rgba(45,212,191,0.12) 0%, transparent 34%)'
          : 'radial-gradient(circle at 14% 12%, rgba(59,130,246,0.12) 0%, transparent 42%), radial-gradient(circle at 88% 0%, rgba(20,184,166,0.11) 0%, transparent 35%)',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      size: 'medium',
    },
    styleOverrides: {
      root: {
        borderRadius: 11,
        padding: '9px 16px',
      },
      containedPrimary: {
        backgroundColor: isDark ? brandDark.primary.main : brandLight.primary.main,
        color: neutralScale.white,
        '&:hover': {
          backgroundColor: isDark ? brandDark.primary.dark : brandLight.primary.dark,
        },
      },
      containedSecondary: {
        backgroundColor: isDark ? brandDark.secondary.main : brandLight.secondary.main,
        color: neutralScale.white,
        '&:hover': {
          backgroundColor: isDark ? brandDark.secondary.dark : brandLight.secondary.dark,
        },
      },
      outlinedPrimary: {
        borderColor: isDark ? brandDark.primary.main : brandLight.primary.main,
        color: isDark ? brandDark.primary.light : brandLight.primary.main,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: `1px solid ${isDark ? '#263855' : neutralScale.gray200}`,
        boxShadow: isDark
          ? '0 3px 20px rgba(0,0,0,0.42)'
          : '0 4px 22px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderBottom: `1px solid ${isDark ? '#2a3d5c' : neutralScale.gray200}`,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: `1px solid ${isDark ? '#2a3d5c' : neutralScale.gray200}`,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        fontWeight: 600,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 650,
        backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(29,78,216,0.08)',
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandLight.primary.main,
      light: brandLight.primary.light,
      dark: brandLight.primary.dark,
      contrastText: neutralScale.white,
    },
    secondary: {
      main: brandLight.secondary.main,
      light: brandLight.secondary.light,
      dark: brandLight.secondary.dark,
      contrastText: neutralScale.white,
    },
    success: { main: brandLight.success },
    warning: { main: brandLight.warning },
    error: { main: brandLight.error },
    info: { main: brandLight.info },
    background: {
      default: '#f5f7fb',
      paper: neutralScale.white,
    },
    text: {
      primary: neutralScale.black,
      secondary: neutralScale.gray500,
    },
    divider: neutralScale.gray200,
  },
  typography: baseTypography,
  shape: { borderRadius: 11 },
  spacing: 8,
  components: buildComponentTheme(false),
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: brandDark.primary.main,
      light: brandDark.primary.light,
      dark: brandDark.primary.dark,
      contrastText: neutralScale.black,
    },
    secondary: {
      main: brandDark.secondary.main,
      light: brandDark.secondary.light,
      dark: brandDark.secondary.dark,
      contrastText: neutralScale.black,
    },
    success: { main: brandDark.success },
    warning: { main: brandDark.warning },
    error: { main: brandDark.error },
    info: { main: brandDark.info },
    background: {
      default: neutralScale.gray900,
      paper: '#111b2e',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    divider: '#27364d',
  },
  typography: baseTypography,
  shape: { borderRadius: 11 },
  spacing: 8,
  components: buildComponentTheme(true),
});

export default lightTheme;