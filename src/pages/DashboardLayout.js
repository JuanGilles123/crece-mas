import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">Crece</div>
        <nav className="dashboard-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>
            <span role="img" aria-label="dashboard"></span> Dashboard
          </NavLink>
          <NavLink to="/dashboard/caja" className={({ isActive }) => isActive ? 'active' : ''}>
            <span role="img" aria-label="caja"></span> Caja
          </NavLink>
          <NavLink to="/dashboard/inventario" className={({ isActive }) => isActive ? 'active' : ''}>
            <span role="img" aria-label="inventario"></span> Inventario
          </NavLink>
        </nav>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          {/* Aquí puedes agregar el buscador, notificaciones, perfil, etc. */}
        </header>
        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
