import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, NavLink } from 'react-router-dom';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { BarChart3, CreditCard, Package, User, TrendingUp } from 'lucide-react';
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

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
        duration: 0.6
      }
    }
  };

  const navItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (index) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  const mainVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: 0.3
      }
    }
  };

  return (
    <div className="dashboard-layout">
      <motion.aside 
        className="dashboard-sidebar"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="dashboard-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <img src="/logo.png" alt="Logo Crece" className="dashboard-logo-img" />
        </motion.div>
        <nav className="dashboard-nav">
          {[
            { to: "/dashboard", icon: BarChart3, label: "Dashboard", title: "Dashboard", end: true },
            { to: "/dashboard/caja", icon: CreditCard, label: "Caja", title: "Punto de Venta" },
            { to: "/dashboard/inventario", icon: Package, label: "Inventario", title: "Gestión de Inventario" },
            { to: "/dashboard/resumen-ventas", icon: TrendingUp, label: "Resumen", title: "Resumen de Ventas" },
            { to: "/dashboard/perfil", icon: User, label: "Perfil", title: "Perfil de Usuario" }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.to}
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
              >
                <NavLink 
                  to={item.to} 
                  end={item.end}
                  className={({ isActive }) => isActive ? 'active' : ''} 
                  title={item.title}
                >
                  <Icon size={20} /> {item.label}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>
      </motion.aside>
      <motion.main 
        className="dashboard-main"
        variants={mainVariants}
        initial="hidden"
        animate="visible"
      >
        <header className="dashboard-header">
          {/* Aquí puedes agregar el buscador, notificaciones, perfil, etc. */}
        </header>
        <motion.section 
          className="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Outlet />
        </motion.section>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
