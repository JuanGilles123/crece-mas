import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { BarChart3, CreditCard, Package, User } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular tiempo de carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        {/* <div className="dashboard-logo">Crece</div> */}
        <div className="dashboard-logo">
          <img src="/logo.png" alt="Logo Crece" className="dashboard-logo-img" />
        </div>
        <nav className="dashboard-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>
            <BarChart3 size={20} /> Dashboard
          </NavLink>
          <NavLink to="/dashboard/caja" className={({ isActive }) => isActive ? 'active' : ''}>
            <CreditCard size={20} /> Caja
          </NavLink>
          <NavLink to="/dashboard/inventario" className={({ isActive }) => isActive ? 'active' : ''}>
            <Package size={20} /> Inventario
          </NavLink>
          <NavLink to="/dashboard/perfil" className={({ isActive }) => isActive ? 'active' : ''}>
            <User size={20} /> Perfil
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
