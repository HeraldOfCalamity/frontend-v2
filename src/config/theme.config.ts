import { createTheme } from '@mui/material/styles';

// Rosa y acento de Benedetta Bellezza
const pinkMain = "#f5a9c3ff";
const pinkLight = "#f3c4d4ff";
const darkBg = "#232323";
export const benedettaPink = '#f2ccd0c4'

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#AAC8A7', // verde pastel
      contrastText: '#fff',
    },
    secondary: {
      main: '#A7C7E7', // azul pastel
      contrastText: '#fff',
    },
    background: {
      default: '#F9FAFB', // fondo claro
      paper: '#FFFFFF',   // tarjetas y formularios
    },
    text: {
      primary: '#424242', // gris oscuro
      secondary: '#6E6E6E', // gris medio
    },
    grey: {
      100: '#f5f5f5',
      300: '#e0e0e0',
      500: '#bdbdbd',
      700: '#616161',
      900: '#212121',
    },
    warning: {
      main: '#E0A96D', // naranja más visible (contrast ratio > 4.5:1)
      contrastText: '#fff'
    },
    info: {
      main: '#A7C7E7',
    },
    success: {
      main: '#AAC8A7',
    },
  },
  typography: {
    fontFamily: ['"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'].join(','),
    h1: { fontWeight: 600, fontSize: '2.5rem' },
    h2: { fontWeight: 500, fontSize: '2rem' },
    h3: { fontWeight: 500, fontSize: '1.75rem' },
    button: { textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});

export const theme2 = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9fbbb5ff', 
      contrastText: '#fff',
    },
    secondary: {
      main: '#C1A3E0',
      contrastText: '#fff',
    },
    success: {
      main: '#8cd298ff',
      contrastText: '#fff',
    },
    info: {
      main: '#9ed3fcff',
      contrastText: '#000',
    },
    warning: {
      main: '#E0A96D',
      contrastText: '#fff',
    },
    error: {
      main: '#e6776dff',
      contrastText: '#fff',
    },
    background: {
      default: '#FCEEF1', // base de fondo suave
    },
    grey: {
      100: '#f5f5f5',
      300: '#e0e0e0',
      500: '#bdbdbd',
      700: '#616161',
      900: '#212121',
    },
  },
  typography: {
    fontFamily: ['"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'].join(','),
    h1: { fontWeight: 600, fontSize: '2.5rem' },
    h2: { fontWeight: 500, fontSize: '2rem' },
    h3: { fontWeight: 500, fontSize: '1.75rem' },
    button: { textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          // boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
});


export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: pinkLight },
    secondary: { main: pinkMain },
    background: {
      default: darkBg,
      paper: "#2C2C2E",
    },
    text: {
      primary: "#FFF6FA",
      secondary: "#FFB6CE",
    },
  },
  typography: {
    fontFamily: "'Montserrat', 'Roboto', 'Arial', sans-serif",
    fontWeightBold: 700,
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem',       // Cambia el tamaño global del input
        },
        input: {
          fontSize: '1.1rem',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1.05rem',     // Tamaño del label (placeholder arriba)
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
      },
    },
    // Opcional: el botón
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "1.1rem",
          fontWeight: 700,
        },
      },
    }
  }
});