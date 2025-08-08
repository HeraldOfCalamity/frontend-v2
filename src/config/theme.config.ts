import { createTheme } from '@mui/material/styles';

// Rosa y acento de Benedetta Bellezza
const pinkMain = "#E96A97";
const pinkLight = "#FFB6CE";
const darkBg = "#232323";

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: pinkMain },
    secondary: { main: pinkLight },
    background: {
      default: "#feebf4ff",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#232323",
      secondary: "#7A7A7A",
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
          fontSize: '1.rem',       // Cambia el tamaño global del input
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