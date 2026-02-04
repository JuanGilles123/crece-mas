import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeLayout from './EmployeeLayout';

const Caja = lazy(() => import('../dashboard/Caja'));
const HistorialVentas = lazy(() => import('../dashboard/HistorialVentas'));
const CierreCaja = lazy(() => import('../CierreCaja'));

const DashboardLoader = () => (
  <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>
    Cargando...
  </div>
);

const EmployeeDashboard = () => (
  <Routes>
    <Route element={<EmployeeLayout />}>
      <Route index element={
        <Suspense fallback={<DashboardLoader />}>
          <Caja />
        </Suspense>
      } />
      <Route path="caja" element={
        <Suspense fallback={<DashboardLoader />}>
          <Caja />
        </Suspense>
      } />
      <Route path="historial-ventas" element={
        <Suspense fallback={<DashboardLoader />}>
          <HistorialVentas />
        </Suspense>
      } />
      <Route path="cierre-caja" element={
        <Suspense fallback={<DashboardLoader />}>
          <CierreCaja />
        </Suspense>
      } />
    </Route>
  </Routes>
);

export default EmployeeDashboard;
