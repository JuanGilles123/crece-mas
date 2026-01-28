import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useVentas } from '../../hooks/useVentas';
import { useClientes } from '../../hooks/useClientes';
import { useEstadisticasEgresos, useOrdenesCompra } from '../../hooks/useEgresos';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Zap, 
  Users, 
  User, 
  Calculator, 
  Calendar, 
  ClipboardList,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Building2,
  Crown,
  Sparkles,
  ArrowRight,
  Check,
  Search
} from 'lucide-react';
import './DashboardHome.css';

const DashboardHome = () => {
  const { userProfile, user, organization } = useAuth();
  const { 
    hasFeature, 
    planName,
    isFreePlan,
    isProfessional,
    isEnterprise,
    isVIP
  } = useSubscription();
  const navigate = useNavigate();
  
  // Hooks para obtener datos
  const { data: ventas = [] } = useVentas(userProfile?.organization_id, 1000, 30);
  const { data: clientes = [] } = useClientes(userProfile?.organization_id);
  const { data: estadisticasEgresos } = useEstadisticasEgresos(organization?.id, 'mes');
  const { data: ordenesCompra = [] } = useOrdenesCompra(organization?.id, { estado: 'pendiente' });
  
  const [metricas, setMetricas] = useState({
    totalProductos: 0,
    bajoStock: 0,
    proximosVencer: 0,
    cargando: true
  });

  // Calcular métricas de ventas
  const metricasVentas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);
    
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const ventasHoy = ventas.filter(v => {
      const fechaVenta = new Date(v.created_at);
      return fechaVenta >= hoy && fechaVenta <= finHoy;
    });
    
    const ventasMes = ventas.filter(v => {
      const fechaVenta = new Date(v.created_at);
      return fechaVenta >= inicioMes;
    });
    
    const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const totalVentasMes = ventasMes.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
    const cantidadVentasHoy = ventasHoy.length;
    const promedioVentaHoy = cantidadVentasHoy > 0 ? totalVentasHoy / cantidadVentasHoy : 0;
    
    return {
      ventasHoy: totalVentasHoy,
      ventasMes: totalVentasMes,
      cantidadVentasHoy,
      promedioVentaHoy
    };
  }, [ventas]);

  // Calcular métricas de egresos
  const metricasEgresos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);
    
    // Egresos del día (ordenes de compra facturadas hoy)
    const ordenesHoy = ordenesCompra.filter(oc => {
      if (oc.estado !== 'facturada') return false;
      const fechaFacturada = new Date(oc.updated_at || oc.created_at);
      return fechaFacturada >= hoy && fechaFacturada <= finHoy;
    });
    const egresosHoy = ordenesHoy.reduce((sum, oc) => sum + parseFloat(oc.total || 0), 0);
    
    // Egresos del mes (usar estadísticas si están disponibles)
    const egresosMes = estadisticasEgresos?.totalEgresos || 0;
    
    return {
      egresosHoy,
      egresosMes
    };
  }, [ordenesCompra, estadisticasEgresos]);

  // Calcular utilidad
  const utilidad = useMemo(() => {
    return {
      utilidadHoy: metricasVentas.ventasHoy - metricasEgresos.egresosHoy,
      utilidadMes: metricasVentas.ventasMes - metricasEgresos.egresosMes
    };
  }, [metricasVentas, metricasEgresos]);

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

        setMetricas({
          totalProductos: productos || 0,
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
    const nombreCompleto = 
      userProfile?.nombre || 
      user?.user_metadata?.full_name || 
      user?.email?.split('@')[0] || 
      'Usuario';
    
    const primerNombre = nombreCompleto.split(' ')[0];
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
    ...(pedidosHabilitados 
      ? [{ icon: ClipboardList, label: 'Pedidos', path: '/dashboard/tomar-pedido', color: '#06B6D4' }]
      : [{ icon: TrendingUp, label: 'Resumen Ventas', path: '/dashboard/resumen-ventas', color: '#10B981' }]
    ),
    { icon: Zap, label: 'Venta Rápida', path: '/dashboard/venta-rapida', color: '#F59E0B' },
    { icon: Calculator, label: 'Cierre de Caja', path: '/dashboard/cierre-caja', color: '#EF4444' },
    { icon: User, label: 'Perfil', path: '/dashboard/perfil', color: '#EC4899' },
    { icon: Search, label: 'Consultar Precio', path: '/dashboard/consultar-precio', color: '#14B8A6' },
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
                {organization?.name || userProfile?.organization_name || 'Tu Negocio'}
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
              <TrendingUp size={48} strokeWidth={2.5} />
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

        {/* Banner de Plan y Mejoras */}
        <motion.div 
          className="plan-banner-container" 
          variants={cardVariants}
        >
            <div className="plan-banner">
              <div className="plan-banner-content">
                <div className="plan-banner-header">
                  <div className="plan-banner-icon">
                    {isFreePlan ? (
                      <Sparkles size={24} />
                    ) : isProfessional ? (
                      <Crown size={24} />
                    ) : (
                      <Crown size={24} />
                    )}
                  </div>
                  <div className="plan-banner-info">
                    <h3>Plan Actual: {planName}</h3>
                    <p>
                      {isFreePlan 
                        ? 'Estás en el plan gratuito. ¡Descubre todo lo que puedes lograr!'
                        : `Estás aprovechando ${planName}. ¡Sigue creciendo!`
                      }
                    </p>
                  </div>
                </div>
                
                {isFreePlan && (
                  <div className="plan-banner-upgrade">
                    <div className="upgrade-features">
                      <h4>Mejora tu plan y obtén:</h4>
                      <ul>
                        <li>
                          <Check size={16} />
                          <span>Productos ilimitados</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Ventas ilimitadas</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Imágenes de productos</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Gestión de equipo</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Reportes avanzados</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Exportar datos</span>
                        </li>
                      </ul>
                    </div>
                    <button 
                      className="upgrade-button"
                      onClick={() => navigate('/pricing')}
                    >
                      Ver Planes
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
                
                {!isFreePlan && !isEnterprise && !isVIP && (
                  <div className="plan-banner-upgrade">
                    <div className="upgrade-features">
                      <h4>¿Necesitas más? Considera el plan Enterprise:</h4>
                      <ul>
                        <li>
                          <Check size={16} />
                          <span>Multi-sucursal</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Soporte prioritario</span>
                        </li>
                        <li>
                          <Check size={16} />
                          <span>Personalización avanzada</span>
                        </li>
                      </ul>
                    </div>
                    <button 
                      className="upgrade-button"
                      onClick={() => navigate('/pricing')}
                    >
                      Ver Planes
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        {/* Métricas principales - Financieras */}
        <motion.div className="metricas-container metricas-principales" variants={cardVariants}>
          <h2><DollarSign size={20} /> Resumen Financiero</h2>
          <div className="metricas-grid metricas-grid-principales">
            {/* Ventas del día */}
            <motion.div 
              className="metrica-card ventas"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/resumen-ventas')}
              style={{ cursor: 'pointer' }}
            >
              <TrendingUp size={32} />
              <h3>{formatCOP(metricasVentas.ventasHoy)}</h3>
              <p>Ventas Hoy</p>
              <div className="metrica-subinfo">
                <span className="metrica-badge positivo">
                  <ArrowUpRight size={14} />
                  {metricasVentas.cantidadVentasHoy} ventas
                </span>
              </div>
            </motion.div>

            {/* Ventas del mes */}
            <motion.div 
              className="metrica-card ventas-mes"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/resumen-ventas')}
              style={{ cursor: 'pointer' }}
            >
              <ShoppingCart size={32} />
              <h3>{formatCOP(metricasVentas.ventasMes)}</h3>
              <p>Ventas del Mes</p>
            </motion.div>

            {/* Utilidad del día */}
            <motion.div 
              className={`metrica-card utilidad ${utilidad.utilidadHoy >= 0 ? 'positivo' : 'negativo'}`}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              {utilidad.utilidadHoy >= 0 ? (
                <ArrowUpRight size={32} />
              ) : (
                <ArrowDownRight size={32} />
              )}
              <h3>{formatCOP(utilidad.utilidadHoy)}</h3>
              <p>Utilidad Hoy</p>
              <div className="metrica-subinfo">
                <small>
                  Ventas: {formatCOP(metricasVentas.ventasHoy)}<br />
                  Egresos: {formatCOP(metricasEgresos.egresosHoy)}
                </small>
              </div>
            </motion.div>

            {/* Utilidad del mes */}
            <motion.div 
              className={`metrica-card utilidad-mes ${utilidad.utilidadMes >= 0 ? 'positivo' : 'negativo'}`}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              {utilidad.utilidadMes >= 0 ? (
                <ArrowUpRight size={32} />
              ) : (
                <ArrowDownRight size={32} />
              )}
              <h3>{formatCOP(utilidad.utilidadMes)}</h3>
              <p>Utilidad del Mes</p>
            </motion.div>

            {/* Egresos del día */}
            <motion.div 
              className="metrica-card egresos"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/egresos')}
              style={{ cursor: 'pointer' }}
            >
              <TrendingDown size={32} />
              <h3>{formatCOP(metricasEgresos.egresosHoy)}</h3>
              <p>Egresos Hoy</p>
            </motion.div>

            {/* Egresos del mes */}
            <motion.div 
              className="metrica-card egresos-mes"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/egresos')}
              style={{ cursor: 'pointer' }}
            >
              <FileText size={32} />
              <h3>{formatCOP(metricasEgresos.egresosMes)}</h3>
              <p>Egresos del Mes</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Métricas secundarias - Operativas */}
        <motion.div className="metricas-container" variants={cardVariants}>
          <h2><Package size={20} /> Resumen Operativo</h2>
          <div className="metricas-grid">
            <motion.div 
              className="metrica-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Package size={32} />
              <h3>{metricas.cargando ? '...' : metricas.totalProductos}</h3>
              <p>Total Productos</p>
            </motion.div>

            <motion.div 
              className="metrica-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/clientes')}
              style={{ cursor: 'pointer' }}
            >
              <Users size={32} />
              <h3>{clientes.length}</h3>
              <p>Total Clientes</p>
            </motion.div>

            <motion.div 
              className="metrica-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calculator size={32} />
              <h3>{formatCOP(metricasVentas.promedioVentaHoy)}</h3>
              <p>Promedio Venta Hoy</p>
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

            <motion.div 
              className="metrica-card"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard/egresos')}
              style={{ cursor: 'pointer' }}
            >
              <Building2 size={32} />
              <h3>{ordenesCompra.length}</h3>
              <p>Órdenes Pendientes</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardHome;
