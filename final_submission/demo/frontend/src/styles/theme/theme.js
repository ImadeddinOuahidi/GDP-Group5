import { alpha, createTheme } from '@mui/material/styles';

const organicLight = {
  primary: { light: '#67E8F9', main: '#0891B2', dark: '#0F6E83', contrastText: '#F7FFFD' },
  secondary: { light: '#A5F3FC', main: '#22D3EE', dark: '#0F99B2', contrastText: '#08343D' },
  accent: '#059669',
  success: '#2F9E6F',
  warning: '#B57D2E',
  error: '#B54B58',
  info: '#0D7FA8',
  background: { default: '#ECFEFF', paper: '#F7FFFD' },
  text: { primary: '#164E63', secondary: '#3C6E77' },
  divider: '#B8DBDD',
  navGlass: 'rgba(247, 255, 253, 0.86)',
};

const organicDark = {
  primary: { light: '#8CF2FF', main: '#22D3EE', dark: '#0891B2', contrastText: '#05242C' },
  secondary: { light: '#C5FAFF', main: '#67E8F9', dark: '#22D3EE', contrastText: '#05242C' },
  accent: '#10B981',
  success: '#41C187',
  warning: '#DB9C43',
  error: '#E77C86',
  info: '#57BFE0',
  background: { default: '#07181C', paper: '#0E2429' },
  text: { primary: '#D9F5F4', secondary: '#9FC4C5' },
  divider: '#25555D',
  navGlass: 'rgba(14, 36, 41, 0.82)',
};

const baseTypography = {
  fontFamily: '"Raleway", "IBM Plex Sans", "Segoe UI", sans-serif',
  h1: { fontFamily: '"Lora", serif', fontSize: '2.35rem', fontWeight: 700, lineHeight: 1.14 },
  h2: { fontFamily: '"Lora", serif', fontSize: '1.95rem', fontWeight: 700, lineHeight: 1.18 },
  h3: { fontFamily: '"Lora", serif', fontSize: '1.62rem', fontWeight: 650, lineHeight: 1.24 },
  h4: { fontFamily: '"Lora", serif', fontSize: '1.36rem', fontWeight: 650, lineHeight: 1.28 },
  h5: { fontSize: '1.12rem', fontWeight: 650, lineHeight: 1.38 },
  h6: { fontSize: '1.01rem', fontWeight: 650, lineHeight: 1.42 },
  subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.46 },
  subtitle2: { fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.48 },
  body1: { fontSize: '0.98rem', lineHeight: 1.62 },
  body2: { fontSize: '0.88rem', lineHeight: 1.58 },
  button: {
    textTransform: 'none',
    fontWeight: 650,
    letterSpacing: '0.01em',
  },
};

const getSurfaceGradient = (isDark, palette) => (
  isDark
    ? `linear-gradient(155deg, ${alpha(palette.background.paper, 0.96)} 0%, ${alpha('#13323A', 0.95)} 100%)`
    : `linear-gradient(155deg, ${alpha('#FFFFFF', 0.95)} 0%, ${alpha('#E8FBF7', 0.92)} 100%)`
);

const buildComponentTheme = (isDark, palette) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        minHeight: '100vh',
        backgroundImage: isDark
          ? `radial-gradient(circle at 12% 18%, ${alpha(palette.primary.main, 0.24)} 0%, transparent 38%),
             radial-gradient(circle at 88% 6%, ${alpha(palette.accent, 0.2)} 0%, transparent 36%),
             radial-gradient(circle at 50% 110%, ${alpha(palette.secondary.main, 0.16)} 0%, transparent 38%),
             linear-gradient(165deg, #061316 0%, #0A2127 46%, #102E35 100%)`
          : `radial-gradient(circle at 10% 10%, ${alpha(palette.primary.main, 0.2)} 0%, transparent 36%),
             radial-gradient(circle at 92% 4%, ${alpha(palette.accent, 0.18)} 0%, transparent 34%),
             radial-gradient(circle at 48% 112%, ${alpha(palette.secondary.main, 0.14)} 0%, transparent 40%),
             linear-gradient(162deg, #F2FFFE 0%, #ECFEFF 48%, #E5FAF2 100%)`,
      },
      '#root': {
        minHeight: '100vh',
      },
      '::selection': {
        backgroundColor: alpha(palette.primary.main, 0.28),
      },
      ':focus-visible': {
        outline: `2px solid ${alpha(palette.primary.main, 0.66)}`,
        outlineOffset: 3,
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
        borderRadius: 999,
        padding: '10px 18px',
        transition: 'transform 180ms ease, box-shadow 220ms ease, background-color 220ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
      },
      containedPrimary: {
        background: `linear-gradient(125deg, ${palette.primary.main} 0%, ${palette.secondary.main} 100%)`,
        color: palette.primary.contrastText,
        boxShadow: `0 10px 24px ${alpha(palette.primary.main, 0.32)}`,
      },
      containedSecondary: {
        background: `linear-gradient(125deg, ${palette.secondary.main} 0%, ${palette.accent} 100%)`,
        color: palette.secondary.contrastText,
        boxShadow: `0 10px 24px ${alpha(palette.secondary.main, 0.3)}`,
      },
      outlined: {
        borderWidth: 1.4,
      },
      text: {
        borderRadius: 14,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: '42% 58% 58% 42% / 47% 44% 56% 53%',
        border: `1px solid ${alpha(palette.divider, isDark ? 0.48 : 0.55)}`,
        backgroundColor: alpha(palette.background.paper, isDark ? 0.16 : 0.62),
        transition: 'transform 180ms ease, background-color 220ms ease, box-shadow 220ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          backgroundColor: alpha(palette.primary.main, isDark ? 0.24 : 0.14),
        },
      },
      sizeSmall: {
        borderRadius: 999,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: `1px solid ${alpha(palette.divider, 0.62)}`,
        background: getSurfaceGradient(isDark, palette),
        boxShadow: isDark
          ? `0 12px 34px ${alpha('#000000', 0.32)}`
          : `0 14px 30px ${alpha('#0F4A56', 0.12)}`,
        overflow: 'hidden',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 22,
        '&:last-child': {
          paddingBottom: 22,
        },
      },
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: '8px 22px 18px',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: 14,
        border: `1px solid ${alpha(palette.divider, 0.58)}`,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderBottom: `1px solid ${alpha(palette.divider, 0.9)}`,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: `1px solid ${alpha(palette.divider, 0.85)}`,
        background: isDark
          ? `linear-gradient(178deg, ${alpha('#103139', 0.95)} 0%, ${alpha('#0A2026', 0.98)} 100%)`
          : `linear-gradient(176deg, ${alpha('#F8FFFD', 0.95)} 0%, ${alpha('#E7FAF4', 0.95)} 100%)`,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundColor: alpha(palette.background.paper, isDark ? 0.18 : 0.66),
        backdropFilter: 'blur(2px)',
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(palette.primary.main, 0.5),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: palette.primary.main,
          borderWidth: 1.8,
          boxShadow: `0 0 0 4px ${alpha(palette.primary.main, 0.15)}`,
        },
      },
      notchedOutline: {
        borderColor: alpha(palette.divider, 0.95),
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontWeight: 600,
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        marginLeft: 4,
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      select: {
        display: 'flex',
        alignItems: 'center',
      },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      paper: {
        borderRadius: 14,
        border: `1px solid ${alpha(palette.divider, 0.6)}`,
        background: getSurfaceGradient(isDark, palette),
      },
      option: {
        borderRadius: 10,
        margin: 4,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        fontWeight: 600,
        border: `1px solid ${alpha(palette.divider, 0.72)}`,
      },
      outlined: {
        backgroundColor: alpha(palette.background.paper, isDark ? 0.18 : 0.62),
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        borderRadius: '40% 60% 58% 42% / 47% 42% 58% 53%',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        transition: 'transform 170ms ease, background-color 220ms ease',
        '&:hover': {
          transform: 'translateX(2px)',
        },
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: alpha(palette.divider, 0.75),
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 50,
      },
      indicator: {
        height: 3,
        borderRadius: 999,
        background: `linear-gradient(120deg, ${palette.primary.main} 0%, ${palette.secondary.main} 100%)`,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 50,
        borderRadius: 12,
        margin: '4px 6px',
        textTransform: 'none',
        fontWeight: 600,
        '&.Mui-selected': {
          color: palette.primary.main,
          backgroundColor: alpha(palette.primary.main, isDark ? 0.18 : 0.1),
        },
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: '16px !important',
        border: `1px solid ${alpha(palette.divider, 0.82)}`,
        boxShadow: 'none',
        '&:before': {
          display: 'none',
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        minHeight: 52,
      },
      content: {
        margin: '10px 0',
      },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        paddingTop: 6,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 700,
        backgroundColor: alpha(palette.primary.main, isDark ? 0.2 : 0.14),
        borderBottomColor: alpha(palette.divider, 0.92),
      },
      body: {
        borderBottomColor: alpha(palette.divider, 0.62),
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: `1px solid ${alpha(palette.divider, 0.6)}`,
        background: getSurfaceGradient(isDark, palette),
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: alpha(palette.primary.main, isDark ? 0.14 : 0.08),
        },
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: {
        borderTop: `1px solid ${alpha(palette.divider, 0.72)}`,
      },
      toolbar: {
        minHeight: 56,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        height: 10,
        backgroundColor: alpha(palette.primary.main, 0.18),
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: `1px solid ${alpha(palette.divider, 0.72)}`,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        border: `1px solid ${alpha(palette.divider, 0.62)}`,
        background: getSurfaceGradient(isDark, palette),
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        paddingBottom: 8,
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        paddingTop: 10,
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '12px 18px 18px',
        gap: 8,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        border: `1px solid ${alpha(palette.divider, 0.85)}`,
        background: getSurfaceGradient(isDark, palette),
      },
      list: {
        paddingTop: 6,
        paddingBottom: 6,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        margin: '2px 6px',
        borderRadius: 10,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 10,
        fontSize: '0.74rem',
        border: `1px solid ${alpha(palette.divider, 0.85)}`,
        backgroundColor: alpha(palette.background.paper, isDark ? 0.96 : 0.98),
        color: palette.text.primary,
      },
      arrow: {
        color: alpha(palette.background.paper, isDark ? 0.96 : 0.98),
      },
    },
  },
  MuiStepConnector: {
    styleOverrides: {
      line: {
        borderTopWidth: 2,
        borderColor: alpha(palette.primary.main, 0.2),
      },
    },
  },
  MuiStepIcon: {
    styleOverrides: {
      root: {
        color: alpha(palette.primary.main, 0.24),
        '&.Mui-active': {
          color: palette.primary.main,
        },
        '&.Mui-completed': {
          color: palette.accent,
        },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        padding: 8,
      },
      switchBase: {
        '&.Mui-checked + .MuiSwitch-track': {
          backgroundColor: alpha(palette.primary.main, 0.6),
          opacity: 1,
        },
      },
      track: {
        borderRadius: 999,
      },
    },
  },
  MuiPaginationItem: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: `1px solid ${alpha(palette.divider, 0.58)}`,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 700,
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
});

const createOrganicTheme = (isDark) => {
  const palette = isDark ? organicDark : organicLight;

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: palette.primary.main,
        light: palette.primary.light,
        dark: palette.primary.dark,
        contrastText: palette.primary.contrastText,
      },
      secondary: {
        main: palette.secondary.main,
        light: palette.secondary.light,
        dark: palette.secondary.dark,
        contrastText: palette.secondary.contrastText,
      },
      success: { main: palette.success },
      warning: { main: palette.warning },
      error: { main: palette.error },
      info: { main: palette.info },
      background: {
        default: palette.background.default,
        paper: palette.background.paper,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.text.secondary,
      },
      divider: palette.divider,
    },
    typography: baseTypography,
    shape: { borderRadius: 18 },
    spacing: 8,
    components: buildComponentTheme(isDark, palette),
  });
};

export const lightTheme = createOrganicTheme(false);
export const darkTheme = createOrganicTheme(true);

export default lightTheme;