import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { APP_ROUTES } from './config/routes'



function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {APP_ROUTES.map(route => 
            <Route path={route.path} element={<route.element/>} />
          )}
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
