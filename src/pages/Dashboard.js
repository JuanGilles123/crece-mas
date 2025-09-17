import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardHome from './DashboardHome';
import Caja from './Caja';
import Inventario from './Inventario';
import styles from './Dashboard.module.css';

const Dashboard = () => (
  <div className={styles.container}>
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="caja" element={<Caja />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  </div>
);

export default Dashboard;
