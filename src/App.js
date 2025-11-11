import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

// Imports críticos (carga inmediata)
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/themes.css';

// Lazy loading de componentes (carga bajo demanda)
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Registro = lazy(() => import('./pages/Registro'));
const Recuperar = lazy(() => import('./pages/Recuperar'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RestablecerContrasena = lazy(() => import('./pages/ResetPassword'));
const Confirmacion = lazy(() => import('./pages/Confirmacion'));
const ConfirmacionExitosa = lazy(() => import('./components/ConfirmacionExitosa'));
const Invitaciones = lazy(() => import('./pages/Invitaciones'));
const InvitePublic = lazy(() => import('./pages/InvitePublic'));
const Pricing = lazy(() => import('./pages/Pricing'));
const VIPAdminPanel = lazy(() => import('./pages/VIPAdminPanel'));

// Componente de carga
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: '600'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      Cargando...
    </div>
  </div>
);

// Configuración de React Query con optimizaciones agresivas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutos - Aumentado para reducir refetches
      cacheTime: 60 * 60 * 1000, // 60 minutos - Cache más largo
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // No refetch al montar si hay cache válido
      refetchOnReconnect: false, // No refetch al reconectar
      suspense: false,
    },
    mutations: {
      retry: 1,
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
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
                {/* Ruta pública para invitaciones - NO requiere autenticación */}
                <Route path="/invite/:token" element={<InvitePublic />} />
                <Route path="/invitaciones" element={
                  <ProtectedRoute>
                    <Invitaciones />
                  </ProtectedRoute>
                } />
                {/* Ruta para página de precios */}
                <Route path="/pricing" element={
                  <ProtectedRoute>
                    <Pricing />
                  </ProtectedRoute>
                } />
                {/* Ruta para panel de administración VIP */}
                <Route path="/vip-admin" element={
                  <ProtectedRoute>
                    <VIPAdminPanel />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
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
