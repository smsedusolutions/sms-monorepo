import { createTheme, alpha } from '@mui/material/styles';

const primaryMain = '#059669'; // Emerald
const secondaryMain = '#111827'; // Rich Charcoal
const accentWarning = '#f59e0b'; // Warm Marigold
const backgroundDefault = '#f8fafc'; // Slate 50

export const theme = createTheme({
  palette: {
    primary: {
      main: primaryMain,
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryMain,
      light: '#1f2937',
      dark: '#030712',
      contrastText: '#ffffff',
    },
    warning: {
      main: accentWarning,
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    background: {
      default: backgroundDefault,
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // Rich Charcoal
      secondary: '#4b5563', // Gray 600
    },
    divider: alpha('#e5e7eb', 0.8), // Gray 200
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '1.125rem' },
    subtitle1: { fontSize: '1.125rem', lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: primaryMain,
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#047857',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          border: `1px solid ${alpha('#cbd5e1', 0.5)}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#ffffff',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: '#f8fafc',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        paper: {
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
       styleOverrides: {
         rounded: {
           borderRadius: 10,
         }
       }
    }
  },
});
