import { createTheme, alpha } from '@mui/material/styles';

const primaryMain = '#0284c7'; // Sky / Corporate Blue
const secondaryMain = '#0f172a'; // Slate 900
const backgroundDefault = '#f8fafc'; // Slate 50

export const theme = createTheme({
  palette: {
    primary: {
      main: primaryMain,
      light: alpha(primaryMain, 0.1),
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: secondaryMain,
      light: alpha(secondaryMain, 0.1),
      dark: '#020617',
      contrastText: '#ffffff',
    },
    background: {
      default: backgroundDefault,
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Slate 800
      secondary: '#64748b', // Slate 500
    },
    divider: alpha('#cbd5e1', 0.5), // Slate 300
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
            backgroundColor: '#0369a1',
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
