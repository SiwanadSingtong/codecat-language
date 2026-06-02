import { createTheme } from '@mui/material/styles'

// Create custom Light and Dark theme configurations
export const getTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light Mode Palette
            primary: {
              main: '#4F46E5', // Indigo
              light: '#818CF8',
              dark: '#3730A3',
            },
            secondary: {
              main: '#06B6D4', // Cyan
              light: '#22D3EE',
              dark: '#0891B2',
            },
            background: {
              default: '#F8FAFC', // Slate 50
              paper: '#FFFFFF',
            },
            text: {
              primary: '#0F172A', // Slate 900
              secondary: '#475569', // Slate 600
            },
          }
        : {
            // Dark Mode Palette
            primary: {
              main: '#6366F1', // Light Indigo
              light: '#818CF8',
              dark: '#4338CA',
            },
            secondary: {
              main: '#22D3EE', // Cyan
              light: '#67E8F9',
              dark: '#06B6D4',
            },
            background: {
              default: '#0F172A', // Slate 900
              paper: '#1E293B', // Slate 800
            },
            text: {
              primary: '#F8FAFC', // Slate 50
              secondary: '#94A3B8', // Slate 400
            },
          }),
    },
    typography: {
      fontFamily: 'var(--font-sarabun), sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.5rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '8px 20px',
            borderRadius: '24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)',
            border: mode === 'light' ? '1px solid #E2E8F0' : '1px solid #334155',
            backgroundImage: 'none',
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
    },
  })
}
