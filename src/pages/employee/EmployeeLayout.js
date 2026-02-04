import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, History, Home, Calculator, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/navigation/BottomNav';
import TopNav from '../../components/navigation/TopNav';
import { clearEmployeeSession } from '../../utils/employeeSession';
import '../dashboard/DashboardLayout.css';
import './EmployeeLayout.css';

const EmployeeLayout = () => {
  const { organization, userProfile, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const getPrimerNombre = () => {
    const nombreCompleto = userProfile?.full_name || userProfile?.nombre || 'Empleado';
    const primerNombre = String(nombreCompleto).trim().split(' ')[0] || 'Empleado';
    return primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase();
  };

  const handleLogout = () => {
    clearEmployeeSession();
    navigate('/login-empleado');
  };

  const menuGroups = useMemo(() => {
    const items = [
    {
      type: 'single',
      icon: Home,
      label: 'Inicio',
      to: '/empleado',
      end: true
    },
    {
      type: 'single',
      icon: CreditCard,
      label: 'Caja',
      to: '/empleado/caja'
    },
    {
      type: 'single',
      icon: History,
      label: 'Historial',
      to: '/empleado/historial-ventas'
    }
    ];
    if (hasPermission('cierre.create') || hasPermission('cierre.view')) {
      items.push({
        type: 'single',
        icon: Calculator,
        label: 'Cierre de Caja',
        to: '/empleado/cierre-caja'
      });
    }
    return items;
  }, [hasPermission]);

  const bottomNavItems = useMemo(() => {
    const items = [
      { to: '/empleado', icon: Home, label: 'Inicio' },
      { to: '/empleado/caja', icon: CreditCard, label: 'Caja' },
      { to: '/empleado/historial-ventas', icon: History, label: 'Historial' }
    ];
    if (hasPermission('cierre.create') || hasPermission('cierre.view')) {
      items.push({ to: '/empleado/cierre-caja', icon: Calculator, label: 'Cierre' });
    }
    return items;
  }, [hasPermission]);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className="dashboard-layout employee-dashboard">
      <TopNav menuGroups={menuGroups} userProfile={userProfile} onMenuClick={() => {}} />

      <motion.main
        className="dashboard-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <motion.section
          className="dashboard-content employee-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="employee-hero">
            <div className="employee-welcome-content">
              <div className="employee-welcome-text">
                <span className="employee-welcome-greeting">¡Hola de nuevo!</span>
                <h1 className="employee-welcome-name">{getPrimerNombre()}</h1>
                <p className="employee-welcome-org">
                  {organization?.name || userProfile?.organization_name || 'Tu Negocio'}
                </p>
              </div>
              <div className="employee-welcome-icon">
                <Sparkles size={44} strokeWidth={2.5} />
              </div>
            </div>
            <div className="employee-welcome-actions">
              <div className="employee-welcome-date">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </div>
              <button className="employee-logout" onClick={handleLogout}>
                Salir
              </button>
            </div>
          </div>
          <Outlet />
        </motion.section>

        {isMobile && (
          <BottomNav
            items={bottomNavItems}
            onItemClick={() => {}}
          />
        )}
      </motion.main>
    </div>
  );
};

export default EmployeeLayout;
