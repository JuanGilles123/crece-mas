import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import styles from './Dashboard.module.css';

// Lazy loading de las rutas del dashboard
const DashboardHome = lazy(() => import('./DashboardHome'));
const Caja = lazy(() => import('./Caja'));
const Inventario = lazy(() => import('./Inventario'));
const ResumenVentas = lazy(() => import('./ResumenVentas'));
const Perfil = lazy(() => import('./Perfil'));
const GestionEquipo = lazy(() => import('../GestionEquipo'));
const VentaRapida = lazy(() => import('../VentaRapida'));
const CierreCaja = lazy(() => import('../CierreCaja'));
const HistorialVentas = lazy(() => import('./HistorialVentas'));
const HistorialCierresCaja = lazy(() => import('./HistorialCierresCaja'));
const MiSuscripcion = lazy(() => import('../MiSuscripcion'));
const ConfiguracionFacturacion = lazy(() => import('../../components/forms/ConfiguracionFacturacion'));
const PlatformAnalytics = lazy(() => import('../PlatformAnalytics'));
const TomarPedido = lazy(() => import('../TomarPedido'));
const PanelCocina = lazy(() => import('../PanelCocina'));
const Clientes = lazy(() => import('./Clientes'));

// Loading fallback optimizado
const DashboardLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    color: 'var(--text-secondary)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border-color)',
        borderTop: '3px solid var(--primary-color)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 12px'
      }}></div>
      <p>Cargando...</p>
    </div>
  </div>
);

const Dashboard = () => (
  <div className={styles.container}>
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={
          <Suspense fallback={<DashboardLoader />}>
            <DashboardHome />
          </Suspense>
        } />
        <Route path="caja" element={
          <Suspense fallback={<DashboardLoader />}>
            <Caja />
          </Suspense>
        } />
        <Route path="venta-rapida" element={
          <Suspense fallback={<DashboardLoader />}>
            <VentaRapida />
          </Suspense>
        } />
        <Route path="cierre-caja" element={
          <Suspense fallback={<DashboardLoader />}>
            <CierreCaja />
          </Suspense>
        } />
        <Route path="historial-ventas" element={
          <Suspense fallback={<DashboardLoader />}>
            <HistorialVentas />
          </Suspense>
        } />
        <Route path="historial-cierres" element={
          <Suspense fallback={<DashboardLoader />}>
            <HistorialCierresCaja />
          </Suspense>
        } />
        <Route path="inventario" element={
          <Suspense fallback={<DashboardLoader />}>
            <Inventario />
          </Suspense>
        } />
        <Route path="resumen-ventas" element={
          <Suspense fallback={<DashboardLoader />}>
            <ResumenVentas />
          </Suspense>
        } />
        <Route path="perfil" element={
          <Suspense fallback={<DashboardLoader />}>
            <Perfil />
          </Suspense>
        } />
        <Route path="equipo" element={
          <Suspense fallback={<DashboardLoader />}>
            <GestionEquipo />
          </Suspense>
        } />
        <Route path="configuracion-facturacion" element={
          <Suspense fallback={<DashboardLoader />}>
            <ConfiguracionFacturacion />
          </Suspense>
        } />
        <Route path="suscripcion" element={
          <Suspense fallback={<DashboardLoader />}>
            <MiSuscripcion />
          </Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<DashboardLoader />}>
            <PlatformAnalytics />
          </Suspense>
        } />
        <Route path="tomar-pedido" element={
          <Suspense fallback={<DashboardLoader />}>
            <TomarPedido />
          </Suspense>
        } />
        <Route path="panel-cocina" element={
          <Suspense fallback={<DashboardLoader />}>
            <PanelCocina />
          </Suspense>
        } />
        <Route path="clientes" element={
          <Suspense fallback={<DashboardLoader />}>
            <Clientes />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  </div>
);

export default Dashboard;
