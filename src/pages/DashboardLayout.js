import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Outlet, NavLink } from 'react-router-dom';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { BarChart3, CreditCard, Package, User, TrendingUp, Menu, X, Users, Zap, Crown, Shield, Package2, Wallet, Eye, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrganizationSwitcher from '../components/OrganizationSwitcher';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { hasPermission, hasRole, userProfile, organization } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // DEBUG: Log para verificar datos del usuario
  useEffect(() => {
    // Verificación de datos del usuario
  }, [userProfile, organization]);

  useEffect(() => {
    // Detectar si es móvil
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // En móvil, el sidebar inicia colapsado
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    // Verificar al cargar
    checkIsMobile();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);

    // Simular tiempo de carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Definir elementos del menú con control de permisos
  const menuItems = [
    { 
      to: "/dashboard", 
      icon: BarChart3, 
      label: "Dashboard", 
      title: "Dashboard", 
      end: true,
      visible: hasPermission('dashboard') || true // Dashboard visible para todos
    },
    { 
      to: "/dashboard/caja", 
      icon: CreditCard, 
      label: "Caja", 
      title: "Punto de Venta",
      visible: hasPermission('sales') || true
    },
    { 
      to: "/dashboard/venta-rapida", 
      icon: Zap, 
      label: "Venta Rápida", 
      title: "Venta sin Inventario",
      visible: hasPermission('sales') || true
    },
    { 
      to: "/dashboard/cierre-caja", 
      icon: Calculator, 
      label: "Cierre de Caja", 
      title: "Cierre de Caja Diario",
      visible: hasPermission('sales') || true
    },
    { 
      to: "/dashboard/inventario", 
      icon: Package, 
      label: "Inventario", 
      title: "Gestión de Inventario",
      visible: hasPermission('inventory') || true
    },
    { 
      to: "/dashboard/resumen-ventas", 
      icon: TrendingUp, 
      label: "Resumen", 
      title: "Resumen de Ventas",
      visible: hasPermission('reports') || true
    },
    { 
      to: "/dashboard/equipo", 
      icon: Users, 
      label: "Equipo", 
      title: "Gestión de Equipo",
      visible: hasRole('owner', 'admin') // Solo owner y admin
    },
    { 
      to: "/dashboard/perfil", 
      icon: User, 
      label: "Perfil", 
      title: "Perfil de Usuario",
      visible: true // Siempre visible
    }
  ].filter(item => item.visible);

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
      {/* Botón de toggle para sidebar */}
      <motion.button
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
      </motion.button>

      <motion.aside 
        className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
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
          <img 
            src="/logo-crece.svg" 
            alt="Crece+" 
            className="dashboard-logo-img"
            onError={(e) => {
              console.error('Error cargando logo SVG');
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<h2 style="color: white; font-size: 1.5rem; margin: 0;">Crece+</h2>';
            }}
          />
        </motion.div>

        {/* Selector de organizaciones */}
        <div className="org-switcher-container">
          <OrganizationSwitcher />
        </div>

        <nav className="dashboard-nav">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.to}
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                className="nav-item-wrapper"
              >
                <NavLink 
                  to={item.to} 
                  end={item.end}
                  className={({ isActive }) => isActive ? 'active' : ''} 
                  data-tooltip={item.label}
                >
                  <Icon size={22} />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Mostrar rol del usuario */}
        {userProfile && (
          <motion.div 
            className="user-role-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className={`role-indicator role-${userProfile.role}`}>
              {userProfile.role === 'owner' && (
                <>
                  <Crown size={14} />
                  <span>Propietario</span>
                </>
              )}
              {userProfile.role === 'admin' && (
                <>
                  <Shield size={14} />
                  <span>Administrador</span>
                </>
              )}
              {userProfile.role === 'inventory_manager' && (
                <>
                  <Package2 size={14} />
                  <span>Encargado</span>
                </>
              )}
              {userProfile.role === 'cashier' && (
                <>
                  <Wallet size={14} />
                  <span>Cajero</span>
                </>
              )}
              {userProfile.role === 'viewer' && (
                <>
                  <Eye size={14} />
                  <span>Visualizador</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.aside>
      
      {/* Overlay para móvil */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      <motion.main 
        className="dashboard-main"
        variants={mainVariants}
        initial="hidden"
        animate="visible"
      >
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
