import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardHome from './DashboardHome';
import Caja from './Caja';
import Inventario from './Inventario';
import ResumenVentas from './ResumenVentas';
import Perfil from './Perfil';
import GestionEquipo from './GestionEquipo';
import styles from './Dashboard.module.css';

const Dashboard = () => (
  <div className={styles.container}>
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="caja" element={<Caja />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="resumen-ventas" element={<ResumenVentas />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="equipo" element={<GestionEquipo />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  </div>
);

export default Dashboard;
