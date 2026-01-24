import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import { BarChart3, CreditCard, Package, User, TrendingUp, Users, Zap, Calculator, Activity, CreditCard as SubscriptionIcon, FileText, Circle, ChefHat, Settings, History, UserCircle, Table, Utensils, ListChecks } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import UsageBanner from '../../components/UsageBanner';
import BottomNav from '../../components/navigation/BottomNav';
import TopNav from '../../components/navigation/TopNav';
import './DashboardLayout.css';


const DashboardLayout = () => {
  const { hasPermission, hasRole, userProfile, organization, user } = useAuth();
  const { hasFeature } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const closeSidebarOnMobile = () => {
    // Función para cerrar menús en móvil si es necesario
  };

  // Memoizar menuGroups para evitar recalcular en cada render (ANTES de cualquier return)
  const menuGroups = useMemo(() => {
    if (!organization) return [];
    const isSuperAdmin = user?.email === 'juanjosegilarbelaez@gmail.com';
    
    const groups = [
      // Dashboard (siempre visible, no agrupado)
      {
        type: 'single',
        to: "/dashboard",
        icon: BarChart3,
        label: "Inicio",
        title: "Inicio",
        end: true,
        visible: hasPermission('dashboard') || true
      },
      // Grupo: Ventas
      {
        type: 'group',
        icon: CreditCard,
        label: "Ventas",
        items: [
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
            to: "/dashboard/historial-ventas",
            icon: History,
            label: "Historial Ventas",
            title: "Historial de Órdenes de Venta",
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
            to: "/dashboard/historial-cierres",
            icon: History,
            label: "Historial Cierres",
            title: "Historial de Cierres de Caja",
            visible: (hasPermission('sales') || true) && hasFeature('closingHistory')
          },
          {
            to: "/dashboard/clientes",
            icon: UserCircle,
            label: "Clientes",
            title: "Gestión de Clientes",
            visible: hasPermission('sales') || true
          }
        ].filter(item => item.visible),
        visible: hasPermission('sales') || true
      },
      // Grupo: Inventario
      {
        type: 'group',
        icon: Package,
        label: "Inventario",
        items: [
          {
            to: "/dashboard/inventario",
            icon: Package,
            label: "Productos",
            title: "Gestión de Inventario",
            visible: hasPermission('inventory') || true
          },
          {
            to: "/dashboard/toppings",
            icon: Utensils,
            label: "Toppings",
            title: "Gestión de Toppings e Ingredientes",
            visible: organization?.business_type === 'food' && (hasPermission('inventory') || true) && hasFeature('toppings')
          },
          {
            to: "/dashboard/variaciones",
            icon: ListChecks,
            label: "Variaciones",
            title: "Gestión de Variaciones de Productos",
            visible: organization?.business_type === 'food' && (hasPermission('inventory') || true)
          }
        ].filter(item => item.visible),
        visible: hasPermission('inventory') || true
      },
      // Grupo: Pedidos (solo para food)
      {
        type: 'group',
        icon: Circle,
        label: "Pedidos",
        items: [
          {
            to: "/dashboard/tomar-pedido",
            icon: Circle,
            label: "Tomar Pedido",
            title: "Tomar Pedido por Mesa",
            visible: organization?.business_type === 'food' && organization?.pedidos_habilitados && hasFeature('pedidos')
          },
          {
            to: "/dashboard/mesas",
            icon: Table,
            label: "Gestión de Mesas",
            title: "Gestionar Mesas y Mapa del Local",
            visible: (organization?.mesas_habilitadas || organization?.enabled_features?.includes('mesas')) && hasFeature('mesas') && hasFeature('mesas')
          },
          {
            to: "/dashboard/panel-cocina",
            icon: ChefHat,
            label: "Panel Cocina",
            title: "Panel de Cocina para Chefs",
            visible: organization?.business_type === 'food' && organization?.pedidos_habilitados && hasFeature('pedidos')
          }
        ].filter(item => item.visible),
        visible: organization?.business_type === 'food' && organization?.pedidos_habilitados && hasFeature('pedidos')
      },
      // Grupo: Reportes
      {
        type: 'group',
        icon: TrendingUp,
        label: "Reportes",
        items: [
          {
            to: "/dashboard/resumen-ventas",
            icon: TrendingUp,
            label: "Resumen Ventas",
            title: "Resumen de Ventas",
            visible: (hasPermission('reports') || true) && hasFeature('advancedReports')
          },
          {
            to: "/dashboard/analytics",
            icon: Activity,
            label: "Analytics",
            title: "Analytics de Plataforma",
            visible: isSuperAdmin
          }
        ].filter(item => item.visible),
        visible: ((hasPermission('reports') || true) && hasFeature('advancedReports')) || isSuperAdmin
      },
      // Grupo: Configuración
      {
        type: 'group',
        icon: Settings,
        label: "Configuración",
        items: [
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
            label: "Facturación",
            title: "Configuración de Facturación",
            visible: hasRole('owner')
          },
          {
            to: "/dashboard/suscripcion",
            icon: SubscriptionIcon,
            label: "Suscripción",
            title: "Gestionar Suscripción",
            visible: true
          }
        ].filter(item => item.visible),
        visible: true
      },
      // Perfil (siempre visible, no agrupado)
      {
        type: 'single',
        to: "/dashboard/perfil",
        icon: User,
        label: "Perfil",
        title: "Perfil de Usuario",
        visible: true
      }
    ];
    
    return groups.filter(group => {
      if (group.type === 'single') {
        return group.visible;
      }
      return group.visible && group.items.length > 0;
    });
  }, [user?.email, hasPermission, hasRole, hasFeature, organization]);

  // Memoizar variantes de animación (solo se crean una vez) - ANTES de cualquier return
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
      {/* Barra de navegación superior horizontal */}
      <TopNav 
        menuGroups={menuGroups}
        userProfile={userProfile}
        onMenuClick={closeSidebarOnMobile}
      />

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
        
        {/* Bottom Navigation para móvil */}
        {isMobile && (
          <BottomNav 
            menuGroups={menuGroups}
            onItemClick={closeSidebarOnMobile}
          />
        )}
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
