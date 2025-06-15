import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { APP_ROUTES } from './config/routes'
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from './config/theme';



function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

   useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {APP_ROUTES.map(route => 
              <Route path={route.path} element={<route.element/>} />
            )}
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
