import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Outlet, NavLink } from 'react-router-dom';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { BarChart3, CreditCard, Package, User, TrendingUp, Menu, X, Users, Zap, Crown, Shield, Package2, Wallet, Eye, Calculator, Activity, CreditCard as SubscriptionIcon, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import OrganizationSwitcher from '../components/OrganizationSwitcher';
import UsageBanner from '../components/UsageBanner';
import './DashboardLayout.css';

// Memoizar el componente del sidebar
const SidebarLink = memo(({ to, icon: Icon, label, onClick, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    <Icon className="sidebar-icon" size={20} />
    <span className="sidebar-text">{label}</span>
  </NavLink>
));

SidebarLink.displayName = 'SidebarLink';

const DashboardLayout = () => {
  const { hasPermission, hasRole, userProfile, organization, user } = useAuth();
  const { hasFeature } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Memoizar el handler del sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Memoizar menuItems para evitar recalcular en cada render (ANTES de cualquier return)
  const menuItems = useMemo(() => {
    const isSuperAdmin = user?.email === 'juanjosegilarbelaez@gmail.com';
    
    return [
      { 
        to: "/dashboard", 
        icon: BarChart3, 
        label: "Dashboard", 
        title: "Dashboard", 
        end: true,
        visible: hasPermission('dashboard') || true
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
        visible: hasRole('owner', 'admin') && hasFeature('teamManagement')
      },
      { 
        to: "/dashboard/configuracion-facturacion", 
        icon: FileText, 
        label: "Configuración de Facturación", 
        title: "Configuración de Facturación",
        visible: hasRole('owner')
      },
      { 
        to: "/dashboard/suscripcion", 
        icon: SubscriptionIcon, 
        label: "Mi Suscripción", 
        title: "Gestionar Suscripción",
        visible: true
      },
      {
        to: "/dashboard/analytics",
        icon: Activity,
        label: "Analytics",
        title: "Analytics de Plataforma",
        visible: isSuperAdmin
      },
      { 
        to: "/dashboard/perfil", 
        icon: User, 
        label: "Perfil", 
        title: "Perfil de Usuario",
        visible: true
      }
    ].filter(item => item.visible);
  }, [user?.email, hasPermission, hasRole, hasFeature]);

  // Memoizar variantes de animación (solo se crean una vez) - ANTES de cualquier return
  const sidebarVariants = useMemo(() => ({
    hidden: { x: -300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
        duration: 0.4
      }
    }
  }), []);

  const navItemVariants = useMemo(() => ({
    hidden: { x: -20, opacity: 0 },
    visible: (index) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.2,
        ease: "easeOut"
      }
    })
  }), []);

  const mainVariants = useMemo(() => ({
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: 0.1
      }
    }
  }), []);

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

    // Simular tiempo de carga inicial - REDUCIDO para mejor UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Reducido de 800ms a 300ms

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-layout">
      {/* Botón de toggle para sidebar */}
      <motion.button
        className="sidebar-toggle"
        onClick={toggleSidebar}
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
                <SidebarLink
                  to={item.to}
                  icon={Icon}
                  label={item.label}
                  end={item.end}
                  onClick={closeSidebarOnMobile}
                />
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
          onClick={toggleSidebar}
        />
      )}
      
      <motion.main 
        className="dashboard-main"
        variants={mainVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Banner de uso (solo para plan gratis) */}
        <UsageBanner />
        
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
