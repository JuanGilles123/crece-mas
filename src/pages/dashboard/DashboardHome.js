import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { ShoppingCart, Package, TrendingUp, AlertTriangle, Zap, Users, User, Calculator, Calendar, ClipboardList } from 'lucide-react';
import './DashboardHome.css';

const DashboardHome = () => {
  const { userProfile, user, organization } = useAuth();
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    totalProductos: 0,
    ventasHoy: 0,
    bajoStock: 0,
    proximosVencer: 0,
    cargando: true
  });

  useEffect(() => {
    const cargarMetricas = async () => {
      if (!userProfile?.organization_id) return;

      try {
        // Total de productos
        const { count: productos } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userProfile.organization_id);

        // Productos con stock bajo (menos de 10)
        const { count: bajoStock } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userProfile.organization_id)
          .lt('stock', 10);

        // Productos próximos a vencer (dentro de 7 días)
        const hoy = new Date().toISOString().split('T')[0];
        const en7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { count: proximosVencer } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userProfile.organization_id)
          .gte('fecha_vencimiento', hoy)
          .lte('fecha_vencimiento', en7dias)
          .not('fecha_vencimiento', 'is', null);

        // Ventas de hoy (suma total)
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        
        const { data: ventasHoy } = await supabase
          .from('ventas')
          .select('total')
          .eq('organization_id', userProfile.organization_id)
          .gte('created_at', inicioHoy.toISOString());

        const totalVentasHoy = ventasHoy?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;

        setMetricas({
          totalProductos: productos || 0,
          ventasHoy: totalVentasHoy,
          bajoStock: bajoStock || 0,
          proximosVencer: proximosVencer || 0,
          cargando: false
        });
      } catch (error) {
        console.error('Error cargando métricas:', error);
        setMetricas(prev => ({ ...prev, cargando: false }));
      }
    };

    cargarMetricas();
  }, [userProfile?.organization_id]);

  const formatCOP = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Función para obtener el primer nombre
  const getPrimerNombre = () => {
    // Intentar obtener el nombre completo de diferentes fuentes
    const nombreCompleto = 
      userProfile?.nombre || 
      user?.user_metadata?.full_name || 
      user?.email?.split('@')[0] || 
      'Usuario';
    
    // Extraer el primer nombre (primera palabra)
    const primerNombre = nombreCompleto.split(' ')[0];
    
    // Capitalizar primera letra
    return primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }
  };

  // Verificar si los pedidos están habilitados
  const pedidosHabilitados = organization?.business_type === 'food' && 
                             organization?.pedidos_habilitados && 
                             hasFeature('pedidos');

  const accesosRapidos = [
    { icon: ShoppingCart, label: 'Caja', path: '/dashboard/caja', color: '#8B5CF6' },
    { icon: Package, label: 'Inventario', path: '/dashboard/inventario', color: '#3B82F6' },
    // Mostrar Pedidos si está habilitado, sino mostrar Resumen Ventas
    ...(pedidosHabilitados 
      ? [{ icon: ClipboardList, label: 'Pedidos', path: '/dashboard/tomar-pedido', color: '#06B6D4' }]
      : [{ icon: TrendingUp, label: 'Resumen Ventas', path: '/dashboard/resumen-ventas', color: '#10B981' }]
    ),
    { icon: Zap, label: 'Venta Rápida', path: '/dashboard/venta-rapida', color: '#F59E0B' },
    { icon: Calculator, label: 'Cierre de Caja', path: '/dashboard/cierre-caja', color: '#EF4444' },
    { icon: Users, label: 'Equipo', path: '/dashboard/equipo', color: '#6366F1' },
    { icon: User, label: 'Perfil', path: '/dashboard/perfil', color: '#EC4899' },
  ];

  return (
    <motion.div 
      className="dashboard-home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Barra lateral de accesos rápidos */}
      <motion.div className="accesos-rapidos-sidebar" variants={cardVariants}>
        <h2><Zap size={18} /> Accesos</h2>
        <div className="accesos-vertical">
          {accesosRapidos.map((acceso, index) => (
            <motion.div
              key={index}
              className="acceso-item"
              variants={cardVariants}
              whileHover={{ scale: 1.05, x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(acceso.path)}
              style={{ '--card-color': acceso.color }}
            >
              <acceso.icon size={24} />
              <span>{acceso.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="dashboard-content">
        {/* Header de bienvenida */}
        <motion.div className="dashboard-welcome-header" variants={cardVariants}>
        <div className="welcome-content">
          <div className="welcome-text">
            <span className="welcome-greeting">¡Hola de nuevo!</span>
            <h1 className="welcome-name">
              {getPrimerNombre()}
            </h1>
            <p className="welcome-org">
              {(userProfile?.organization_name || 'Tu Negocio')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')}
            </p>
          </div>
          <motion.div 
            className="welcome-icon"
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <TrendingUp size={64} strokeWidth={2.5} />
          </motion.div>
        </div>
        <div className="welcome-date">
          <Calendar size={18} strokeWidth={2} />
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </div>
      </motion.div>

      {/* Métricas rápidas */}
      <motion.div className="metricas-container" variants={cardVariants}>
        <h2><TrendingUp size={20} /> Resumen Rápido</h2>
        <div className="metricas-grid">
          <motion.div 
            className="metrica-card"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Package size={32} />
            <h3>{metricas.cargando ? '...' : metricas.totalProductos}</h3>
            <p>Productos</p>
          </motion.div>

          <motion.div 
            className="metrica-card ventas"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUp size={32} />
            <h3>{metricas.cargando ? '...' : formatCOP(metricas.ventasHoy)}</h3>
            <p>Ventas Hoy</p>
          </motion.div>

          <motion.div 
            className="metrica-card alerta"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/inventario')}
            style={{ cursor: 'pointer' }}
          >
            <AlertTriangle size={32} />
            <h3>{metricas.cargando ? '...' : metricas.bajoStock}</h3>
            <p>Bajo Stock</p>
          </motion.div>

          <motion.div 
            className="metrica-card vencimiento"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/inventario')}
            style={{ cursor: 'pointer' }}
          >
            <AlertTriangle size={32} />
            <h3>{metricas.cargando ? '...' : metricas.proximosVencer}</h3>
            <p>Próximos a Vencer</p>
          </motion.div>
        </div>
      </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardHome;
