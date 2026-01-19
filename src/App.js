import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Recuperar from './pages/auth/Recuperar';
import Dashboard from './pages/dashboard/Dashboard';
import RestablecerContrasena from './pages/auth/ResetPassword';
import Confirmacion from './pages/auth/Confirmacion';
import ConfirmacionExitosa from './components/ConfirmacionExitosa';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import './styles/themes.css';

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route path="/restablecer-contraseña" element={<RestablecerContrasena />} />
            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/confirmar" element={<Confirmacion />} />
            <Route path="/confirmacion-exitosa" element={<ConfirmacionExitosa />} />
          </Routes>
        </Router>
        {/* Configuración de React Hot Toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '10px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              duration: Infinity,
            },
          }}
        />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
