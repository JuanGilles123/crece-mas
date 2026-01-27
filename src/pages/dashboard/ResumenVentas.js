import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import './ResumenVentas.css';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import FeatureGuard from '../../components/FeatureGuard';
import { useVentas } from '../../hooks/useVentas';
import { useProductos } from '../../hooks/useProductos';
import { useTeamMembers } from '../../hooks/useTeam';
import { useClientes } from '../../hooks/useClientes';
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  LayoutGrid,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Target,
  Award,
  X,
  CreditCard,
  Percent
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ResumenVentas = () => {
  const { userProfile } = useAuth();
  const { hasFeature } = useSubscription();
  
  // Hooks para obtener datos reales
  const { data: ventas = [], isLoading: cargandoVentas, refetch: refetchVentas } = useVentas(
    userProfile?.organization_id, 
    5000, // Límite alto para análisis completo
    null // Sin límite de días para resumen completo
  );
  const { data: productos = [], isLoading: cargandoProductos } = useProductos(userProfile?.organization_id);
  const { data: miembrosEquipo = [], isLoading: cargandoEquipo } = useTeamMembers(userProfile?.organization_id);
  const { data: clientes = [], isLoading: cargandoClientes } = useClientes(userProfile?.organization_id);

  const [vistaActual, setVistaActual] = useState('general');
  const [filtroFechaRapida, setFiltroFechaRapida] = useState('todos');
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    categoria: 'todas',
    vendedor: 'todos',
    metodoPago: 'todos',
    cliente: 'todos'
  });

  const cargando = cargandoVentas || cargandoProductos || cargandoEquipo || cargandoClientes;

  // Formatear moneda
  const formatCOP = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para normalizar nombre de vendedor (definida antes de su uso)
  const normalizarNombreVendedor = useCallback((nombre) => {
    if (!nombre) return 'Vendedor desconocido';
    
    // Normalizar: quitar espacios extra, convertir a minúsculas para comparación
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    // Si el nombre tiene variantes conocidas, normalizarlas
    // Por ejemplo: "jonathan-9411" y "Jonathan" deberían agruparse
    // Eliminar guiones, números al final, etc.
    const nombreLimpio = nombreNormalizado
      .replace(/-\d+$/, '') // Eliminar guión seguido de números al final
      .replace(/[_-]/g, ' ') // Reemplazar guiones y guiones bajos con espacios
      .trim();
    
    // Capitalizar primera letra de cada palabra
    return nombreLimpio
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }, []);

  // Obtener vendedores disponibles
  const vendedoresDisponibles = useMemo(() => {
    return miembrosEquipo.filter(m => m.is_employee || m.user_id).map(m => ({
      id: m.user_id || m.id,
      nombre: m.nombre || m.user_profiles?.full_name || m.employee_name || 'Sin nombre',
      tipo: m.is_employee ? 'empleado' : 'usuario'
    }));
  }, [miembrosEquipo]);

  // Lista de vendedores normalizados para el filtro (agrupados)
  // IMPORTANTE: Esta debe estar definida antes de filtrarVentas
  const vendedoresDisponiblesNormalizados = useMemo(() => {
    const vendedoresMap = new Map();
    
    vendedoresDisponibles.forEach(vendedor => {
      const nombreNormalizado = normalizarNombreVendedor(vendedor.nombre);
      
      // Si ya existe un vendedor con este nombre normalizado, usar el primero
      if (!vendedoresMap.has(nombreNormalizado)) {
        vendedoresMap.set(nombreNormalizado, {
          id: nombreNormalizado,
          nombre: nombreNormalizado,
          // Guardar todos los IDs originales que corresponden a este nombre normalizado
          idsOriginales: [vendedor.id]
        });
      } else {
        // Agregar el ID original a la lista si no está ya incluido
        const existente = vendedoresMap.get(nombreNormalizado);
        if (!existente.idsOriginales.includes(vendedor.id)) {
          existente.idsOriginales.push(vendedor.id);
        }
      }
    });
    
    return Array.from(vendedoresMap.values()).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
  }, [vendedoresDisponibles, normalizarNombreVendedor]);

  // Extraer datos reales para filtros
  const categoriasDisponibles = useMemo(() => {
    const categorias = new Set();
    productos.forEach(producto => {
      if (producto.metadata?.categoria) {
        categorias.add(producto.metadata.categoria);
      }
    });
    return Array.from(categorias).sort();
  }, [productos]);

  // Función para normalizar método de pago (definida antes de su uso)
  const normalizarMetodoPago = useCallback((metodo) => {
    if (!metodo) return 'Sin método';
    
    // Normalizar "Mixto" - siempre mostrar solo "Mixto" sin detalle
    if (metodo === 'Mixto' || metodo?.startsWith('Mixto (')) {
      return 'Mixto';
    }
    
    // Normalizar capitalización para agrupar variantes
    const metodoNormalizado = metodo.toLowerCase().trim();
    
    switch(metodoNormalizado) {
      case 'efectivo':
        return 'Efectivo';
      case 'transferencia':
        return 'Transferencia';
      case 'tarjeta':
        return 'Tarjeta';
      case 'credito':
      case 'crédito':
        return 'Crédito';
      case 'nequi':
        return 'Nequi';
      case 'cotizacion':
      case 'cotización':
        return 'Cotización';
      case 'mixto':
        return 'Mixto';
      default:
        // Para métodos no estándar, usar la primera letra mayúscula
        return metodo.charAt(0).toUpperCase() + metodo.slice(1).toLowerCase();
    }
  }, []);

  const metodosPagoDisponibles = useMemo(() => {
    const metodosMap = new Map();
    
    ventas.forEach(venta => {
      if (venta.metodo_pago) {
        const metodoEstandar = normalizarMetodoPago(venta.metodo_pago);
        
        // Solo agregar si no existe ya
        if (!metodosMap.has(metodoEstandar)) {
          metodosMap.set(metodoEstandar, metodoEstandar);
        }
      }
    });
    
    // Ordenar métodos: primero los estándar, luego los demás
    const metodosEstandar = ['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi', 'Mixto', 'Crédito', 'Cotización'];
    const otrosMetodos = Array.from(metodosMap.values())
      .filter(m => !metodosEstandar.includes(m))
      .sort();
    
    return [...metodosEstandar.filter(m => metodosMap.has(m)), ...otrosMetodos];
  }, [ventas, normalizarMetodoPago]);


  // Aplicar filtro de fecha rápida
  useEffect(() => {
    if (filtroFechaRapida === 'todos') {
      setFiltros(prev => ({ ...prev, fechaInicio: '', fechaFin: '' }));
    } else if (filtroFechaRapida !== 'personalizado') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      let fechaInicio = '';
      let fechaFin = '';

      switch (filtroFechaRapida) {
        case 'hoy':
          fechaInicio = format(hoy, 'yyyy-MM-dd');
          fechaFin = format(hoy, 'yyyy-MM-dd');
          break;
        case 'ayer':
          const ayer = subDays(hoy, 1);
          fechaInicio = format(ayer, 'yyyy-MM-dd');
          fechaFin = format(ayer, 'yyyy-MM-dd');
          break;
        case 'semana':
          fechaInicio = format(subDays(hoy, 7), 'yyyy-MM-dd');
          fechaFin = format(hoy, 'yyyy-MM-dd');
          break;
        case 'mes':
          fechaInicio = format(subDays(hoy, 30), 'yyyy-MM-dd');
          fechaFin = format(hoy, 'yyyy-MM-dd');
          break;
        case 'trimestre':
          fechaInicio = format(subDays(hoy, 90), 'yyyy-MM-dd');
          fechaFin = format(hoy, 'yyyy-MM-dd');
          break;
        default:
          break;
      }
      setFiltros(prev => ({ ...prev, fechaInicio, fechaFin }));
    }
  }, [filtroFechaRapida]);

  // Filtrar ventas según filtros aplicados
  const filtrarVentas = useCallback(() => {
    let ventasFiltradas = ventas;

    // Filtro de fechas
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      ventasFiltradas = ventasFiltradas.filter(venta => {
        const fechaVenta = new Date(venta.created_at);
        fechaVenta.setHours(0, 0, 0, 0);
        return fechaVenta >= fechaInicio;
      });
    }

    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      ventasFiltradas = ventasFiltradas.filter(venta => 
        new Date(venta.created_at) <= fechaFin
      );
    }

    // Filtro de categoría (basado en productos vendidos)
    if (filtros.categoria !== 'todas') {
      ventasFiltradas = ventasFiltradas.filter(venta => {
        if (!venta.items || !Array.isArray(venta.items)) return false;
        return venta.items.some(item => {
          const producto = productos.find(p => p.id === item.id || p.codigo === item.codigo);
          return producto?.metadata?.categoria === filtros.categoria;
        });
      });
    }

    // Filtro de vendedor (usando nombres normalizados)
    if (filtros.vendedor !== 'todos') {
      const vendedorSeleccionado = vendedoresDisponiblesNormalizados.find(
        v => v.id === filtros.vendedor
      );
      if (vendedorSeleccionado) {
        // Filtrar por todos los IDs originales que corresponden a este nombre normalizado
        ventasFiltradas = ventasFiltradas.filter(venta => 
          vendedorSeleccionado.idsOriginales.includes(venta.user_id)
        );
      }
    }

    // Filtro de método de pago
    if (filtros.metodoPago !== 'todos') {
      ventasFiltradas = ventasFiltradas.filter(venta => {
        if (!venta.metodo_pago) return false;
        
        // Normalizar método de la venta para comparar
        let metodoVenta = venta.metodo_pago;
        if (metodoVenta === 'Mixto' || metodoVenta?.startsWith('Mixto (')) {
          metodoVenta = 'Mixto';
        }
        
        // Normalizar capitalización para comparar
        const metodoVentaNormalizado = metodoVenta.toLowerCase().trim();
        const filtroNormalizado = filtros.metodoPago.toLowerCase().trim();
        
        // Comparar normalizados
        return metodoVentaNormalizado === filtroNormalizado;
      });
    }

    // Filtro de cliente
    if (filtros.cliente !== 'todos') {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        venta.cliente_id === filtros.cliente
      );
    }

    return ventasFiltradas;
  }, [ventas, filtros, productos, vendedoresDisponiblesNormalizados]);

  // Obtener productos más vendidos
  const obtenerProductosMasVendidos = useMemo(() => {
    const ventasFiltradas = filtrarVentas();
    const productosVendidos = {};

    ventasFiltradas.forEach(venta => {
      if (venta.items && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const productoId = item.id || item.producto_id;
          const codigo = item.codigo;
          const cantidad = item.qty || 1;
          const precioVenta = parseFloat(item.precio_venta || item.precio || 0);
          const precioCompra = parseFloat(item.precio_compra || 0);
          const total = precioVenta * cantidad;
          const costo = precioCompra * cantidad;
          const ganancia = total - costo;

          if (productosVendidos[productoId]) {
            productosVendidos[productoId].cantidad += cantidad;
            productosVendidos[productoId].total += total;
            productosVendidos[productoId].costo += costo;
            productosVendidos[productoId].ganancia += ganancia;
          } else {
            productosVendidos[productoId] = {
              id: productoId,
              codigo: codigo,
              nombre: item.nombre || 'Producto desconocido',
              cantidad: cantidad,
              total: total,
              costo: costo,
              ganancia: ganancia
            };
          }
        });
      }
    });

    return Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [filtrarVentas]);

  // Calcular métricas del período anterior para comparación
  const calcularMetricasPeriodoAnterior = useCallback((ventasActuales) => {
    if (!filtros.fechaInicio || !filtros.fechaFin) return { totalVentas: 0, cantidadVentas: 0 };
    
    const fechaInicio = new Date(filtros.fechaInicio);
    const fechaFin = new Date(filtros.fechaFin);
    const duracion = fechaFin - fechaInicio;
    
    const fechaInicioAnterior = new Date(fechaInicio);
    fechaInicioAnterior.setTime(fechaInicioAnterior.getTime() - duracion - 1);
    const fechaFinAnterior = new Date(fechaInicio);
    fechaFinAnterior.setTime(fechaFinAnterior.getTime() - 1);

    const ventasAnteriores = ventas.filter(venta => {
      const fechaVenta = new Date(venta.created_at);
      return fechaVenta >= fechaInicioAnterior && fechaVenta <= fechaFinAnterior;
    });

    const totalVentas = ventasAnteriores.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
    return {
      totalVentas,
      cantidadVentas: ventasAnteriores.length
    };
  }, [ventas, filtros.fechaInicio, filtros.fechaFin]);

  // Calcular métricas mejoradas
  const calcularMetricas = useMemo(() => {
    const ventasFiltradas = filtrarVentas();
    const totalVentas = ventasFiltradas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
    const cantidadVentas = ventasFiltradas.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;
    
    // Calcular utilidad real basada en precio_compra y precio_venta de items
    let costoTotal = 0;
    let ventaTotal = 0;
    ventasFiltradas.forEach(venta => {
      if (venta.items && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const cantidad = item.qty || 1;
          const precioVenta = parseFloat(item.precio_venta || item.precio || 0);
          const precioCompra = parseFloat(item.precio_compra || 0);
          ventaTotal += precioVenta * cantidad;
          costoTotal += precioCompra * cantidad;
        });
      }
    });
    const utilidadReal = ventaTotal - costoTotal;
    const margenGanancia = ventaTotal > 0 ? (utilidadReal / ventaTotal) * 100 : 0;

    // Calcular métricas del período anterior para comparación
    const periodoAnterior = calcularMetricasPeriodoAnterior(ventasFiltradas);
    const variacionVentas = periodoAnterior.totalVentas > 0 
      ? ((totalVentas - periodoAnterior.totalVentas) / periodoAnterior.totalVentas) * 100 
      : 0;

    return {
      totalVentas,
      cantidadVentas,
      promedioVenta,
      utilidad: utilidadReal,
      margenGanancia,
      costoTotal,
      variacionVentas,
      periodoAnterior
    };
  }, [filtrarVentas, calcularMetricasPeriodoAnterior]);

  // Obtener ventas por método de pago
  const obtenerVentasPorMetodoPago = useMemo(() => {
    const ventasFiltradas = filtrarVentas();
    const ventasPorMetodo = {};
    
    ventasFiltradas.forEach(venta => {
      const metodoNormalizado = normalizarMetodoPago(venta.metodo_pago);
      
      if (!ventasPorMetodo[metodoNormalizado]) {
        ventasPorMetodo[metodoNormalizado] = { cantidad: 0, total: 0 };
      }
      ventasPorMetodo[metodoNormalizado].cantidad += 1;
      ventasPorMetodo[metodoNormalizado].total += parseFloat(venta.total || 0);
    });

    // Ordenar: primero por total descendente, luego por nombre
    const metodosEstandar = ['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi', 'Mixto', 'Crédito', 'Cotización'];
    
    return Object.entries(ventasPorMetodo)
      .map(([metodo, data]) => ({ metodo, ...data }))
      .sort((a, b) => {
        // Primero ordenar por total descendente
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        // Si tienen el mismo total, ordenar por orden estándar
        const indexA = metodosEstandar.indexOf(a.metodo);
        const indexB = metodosEstandar.indexOf(b.metodo);
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Si no están en la lista estándar, ordenar alfabéticamente
        return a.metodo.localeCompare(b.metodo);
      });
  }, [filtrarVentas, normalizarMetodoPago]);

  // Obtener top clientes
  const obtenerTopClientes = useMemo(() => {
    const ventasFiltradas = filtrarVentas();
    const clientesMap = {};
    
    ventasFiltradas.forEach(venta => {
      if (venta.cliente_id && venta.cliente) {
        const clienteId = venta.cliente_id;
        if (!clientesMap[clienteId]) {
          clientesMap[clienteId] = {
            id: clienteId,
            nombre: venta.cliente.nombre || 'Cliente desconocido',
            cantidad: 0,
            total: 0
          };
        }
        clientesMap[clienteId].cantidad += 1;
        clientesMap[clienteId].total += parseFloat(venta.total || 0);
      }
    });

    return Object.values(clientesMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtrarVentas]);


  const obtenerTopVendedores = useMemo(() => {
    const ventasFiltradas = filtrarVentas();
    const vendedoresMap = {};
    
    ventasFiltradas.forEach(venta => {
      if (venta.user_id) {
        const vendedorId = venta.user_id;
        const vendedor = vendedoresDisponibles.find(v => v.id === vendedorId);
        const nombreOriginal = vendedor?.nombre || 'Vendedor desconocido';
        const nombreNormalizado = normalizarNombreVendedor(nombreOriginal);
        
        // Usar el nombre normalizado como clave para agrupar
        if (!vendedoresMap[nombreNormalizado]) {
          vendedoresMap[nombreNormalizado] = {
            id: nombreNormalizado, // Usar nombre normalizado como ID único
            nombre: nombreNormalizado,
            cantidad: 0,
            total: 0
          };
        }
        vendedoresMap[nombreNormalizado].cantidad += 1;
        vendedoresMap[nombreNormalizado].total += parseFloat(venta.total || 0);
      }
    });

    return Object.values(vendedoresMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtrarVentas, vendedoresDisponibles, normalizarNombreVendedor]);

  // Obtener ventas por día (basado en filtros de fecha)
  const obtenerVentasPorDia = useMemo(() => {
    const ventasFiltradas = filtrarVentas();
    const ventasPorDia = {};
    
    // Determinar rango de fechas
    let fechaInicio, fechaFin;
    if (filtros.fechaInicio && filtros.fechaFin) {
      fechaInicio = new Date(filtros.fechaInicio);
      fechaFin = new Date(filtros.fechaFin);
    } else {
      // Si no hay filtros, mostrar últimos 30 días
      fechaFin = new Date();
      fechaInicio = subDays(fechaFin, 30);
    }

    // Crear array de días en el rango
    const fechaActual = new Date(fechaInicio);
    while (fechaActual <= fechaFin) {
      const fechaStr = format(fechaActual, 'yyyy-MM-dd');
      ventasPorDia[fechaStr] = { total: 0, cantidad: 0 };
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Sumar ventas reales
    ventasFiltradas.forEach(venta => {
      const fechaVenta = format(parseISO(venta.created_at), 'yyyy-MM-dd');
      if (ventasPorDia[fechaVenta]) {
        ventasPorDia[fechaVenta].total += parseFloat(venta.total || 0);
        ventasPorDia[fechaVenta].cantidad += 1;
      }
    });

    return Object.entries(ventasPorDia)
      .map(([fecha, data]) => ({ 
        fecha, 
        total: data.total,
        cantidad: data.cantidad,
        fechaFormateada: format(parseISO(fecha), 'dd/MM', { locale: es })
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [filtrarVentas, filtros.fechaInicio, filtros.fechaFin]);

  const metricas = calcularMetricas;
  const productosMasVendidos = obtenerProductosMasVendidos;
  const ventasPorDia = obtenerVentasPorDia;

  const vistas = [
    { id: 'general', nombre: 'Vista General', icono: LayoutGrid },
    { id: 'productos', nombre: 'Por Producto', icono: Package },
    { id: 'categoria', nombre: 'Por Categoría', icono: Target },
    { id: 'vendedor', nombre: 'Por Vendedor', icono: Users },
    { id: 'cliente', nombre: 'Por Cliente', icono: ShoppingCart }
  ];

  if (cargando) {
    return (
      <div className="resumen-ventas-container">
        <div className="resumen-ventas-loading">
          <div className="loading-spinner"></div>
          <p>Cargando resumen de ventas...</p>
        </div>
      </div>
    );
  }

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <FeatureGuard
      feature="advancedReports"
      recommendedPlan="professional"
      showInline={false}
    >
    <motion.div 
      className="resumen-ventas-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Encabezado */}
      <motion.div className="resumen-ventas-header" variants={itemVariants}>
        <motion.h1 
          className="resumen-ventas-title"
          variants={itemVariants}
        >
          <BarChart3 className="resumen-ventas-title-icon" />
          Resumen de Ventas
        </motion.h1>
        <motion.div className="resumen-ventas-actions" variants={itemVariants}>
          <motion.button 
            className="resumen-ventas-btn resumen-ventas-btn-outline" 
            onClick={() => refetchVentas()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={16} />
            Actualizar
          </motion.button>
          {hasFeature('exportData') ? (
            <motion.button 
              className="resumen-ventas-btn resumen-ventas-btn-outline"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toast.info('Función de exportación próximamente')}
            >
              <Download size={16} />
              Exportar
            </motion.button>
          ) : (
            <motion.button 
              className="resumen-ventas-btn resumen-ventas-btn-outline"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
              onClick={() => toast.error('La exportación de datos está disponible en el plan Estándar')}
              title="🔒 Plan Estándar"
            >
              <Download size={16} />
              Exportar
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      {/* Selector de vistas */}
      <div className="resumen-ventas-vistas">
        {vistas.map((vista) => {
          const Icono = vista.icono;
          return (
            <button
              key={vista.id}
              className={`resumen-ventas-vista-btn ${vistaActual === vista.id ? 'active' : ''}`}
              onClick={() => setVistaActual(vista.id)}
            >
              <Icono size={16} />
              {vista.nombre}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="resumen-ventas-filtros">
        {/* Filtro rápido de fechas */}
        <div className="resumen-ventas-filtro-rapido">
          <span className="resumen-ventas-filtro-icon">📅</span>
          <select
            value={filtroFechaRapida}
            onChange={(e) => {
              setFiltroFechaRapida(e.target.value);
              if (e.target.value === 'personalizado') {
                setFiltros(prev => ({ ...prev, fechaInicio: '', fechaFin: '' }));
              }
            }}
            className="resumen-ventas-select"
          >
            <option value="todos">Todas las fechas</option>
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
            <option value="trimestre">Último trimestre</option>
            <option value="personalizado">Rango personalizado</option>
          </select>
        </div>

        {/* Filtros de rango personalizado */}
        {filtroFechaRapida === 'personalizado' && (
          <>
            <div className="resumen-ventas-filtro">
              <span className="resumen-ventas-filtro-icon">📅</span>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                className="resumen-ventas-input"
                placeholder="Desde"
              />
            </div>
            <div className="resumen-ventas-filtro">
              <span className="resumen-ventas-filtro-icon">📅</span>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                className="resumen-ventas-input"
                placeholder="Hasta"
              />
            </div>
          </>
        )}

        {/* Filtro de categoría (datos reales) */}
        {categoriasDisponibles.length > 0 && (
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
            className="resumen-ventas-select"
          >
            <option value="todas">Todas las categorías</option>
            {categoriasDisponibles.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {/* Filtro de método de pago (datos reales) */}
        {metodosPagoDisponibles.length > 0 && (
          <select
            value={filtros.metodoPago}
            onChange={(e) => setFiltros({...filtros, metodoPago: e.target.value})}
            className="resumen-ventas-select"
          >
            <option value="todos">Todos los métodos</option>
            {metodosPagoDisponibles.map(metodo => (
              <option key={metodo} value={metodo}>{metodo}</option>
            ))}
          </select>
        )}

        {/* Filtro de vendedor (datos reales, normalizados) */}
        {vendedoresDisponiblesNormalizados.length > 0 && (
          <select
            value={filtros.vendedor}
            onChange={(e) => setFiltros({...filtros, vendedor: e.target.value})}
            className="resumen-ventas-select"
          >
            <option value="todos">Todos los vendedores</option>
            {vendedoresDisponiblesNormalizados.map(vendedor => (
              <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>
            ))}
          </select>
        )}

        {/* Filtro de cliente (datos reales) */}
        {clientes.length > 0 && (
          <select
            value={filtros.cliente}
            onChange={(e) => setFiltros({...filtros, cliente: e.target.value})}
            className="resumen-ventas-select"
          >
            <option value="todos">Todos los clientes</option>
            {clientes.map(cliente => (
              <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
            ))}
          </select>
        )}

        {/* Botón para limpiar filtros */}
        {(filtros.categoria !== 'todas' || filtros.vendedor !== 'todos' || 
          filtros.metodoPago !== 'todos' || filtros.cliente !== 'todos' || 
          filtroFechaRapida !== 'todos') && (
          <button 
            className="resumen-ventas-btn resumen-ventas-btn-outline"
            onClick={() => {
              setFiltroFechaRapida('todos');
              setFiltros({
                fechaInicio: '',
                fechaFin: '',
                categoria: 'todas',
                vendedor: 'todos',
                metodoPago: 'todos',
                cliente: 'todos'
              });
            }}
          >
            <X size={16} />
            Limpiar
          </button>
        )}
      </div>

      {/* Métricas rápidas */}
      <motion.div className="resumen-ventas-metricas" variants={itemVariants}>
        <motion.div 
          className="resumen-ventas-metrica"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-metrica-icon">
            <DollarSign size={24} />
          </div>
          <div className="resumen-ventas-metrica-content">
            <p className="resumen-ventas-metrica-label">Total Ventas</p>
            <p className="resumen-ventas-metrica-value">{formatCOP(metricas.totalVentas)}</p>
            {metricas.variacionVentas !== 0 && (
              <p className={`resumen-ventas-metrica-variacion ${metricas.variacionVentas >= 0 ? 'positiva' : 'negativa'}`}>
                {metricas.variacionVentas >= 0 ? '↑' : '↓'} {Math.abs(metricas.variacionVentas).toFixed(1)}% vs período anterior
              </p>
            )}
          </div>
        </motion.div>
        <motion.div 
          className="resumen-ventas-metrica"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-metrica-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="resumen-ventas-metrica-content">
            <p className="resumen-ventas-metrica-label">Ventas</p>
            <p className="resumen-ventas-metrica-value">{metricas.cantidadVentas}</p>
          </div>
        </motion.div>
        <motion.div 
          className="resumen-ventas-metrica"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-metrica-icon">
            <TrendingUp size={24} />
          </div>
          <div className="resumen-ventas-metrica-content">
            <p className="resumen-ventas-metrica-label">Promedio Venta</p>
            <p className="resumen-ventas-metrica-value">{formatCOP(metricas.promedioVenta)}</p>
          </div>
        </motion.div>
        <motion.div 
          className="resumen-ventas-metrica"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-metrica-icon">
            <Award size={24} />
          </div>
          <div className="resumen-ventas-metrica-content">
            <p className="resumen-ventas-metrica-label">Utilidad Real</p>
            <p className="resumen-ventas-metrica-value resumen-ventas-utilidad">{formatCOP(metricas.utilidad)}</p>
            <p className="resumen-ventas-metrica-subtext">Margen: {metricas.margenGanancia.toFixed(1)}%</p>
          </div>
        </motion.div>
        <motion.div 
          className="resumen-ventas-metrica"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-metrica-icon">
            <Percent size={24} />
          </div>
          <div className="resumen-ventas-metrica-content">
            <p className="resumen-ventas-metrica-label">Margen de Ganancia</p>
            <p className="resumen-ventas-metrica-value">{metricas.margenGanancia.toFixed(1)}%</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Gráficos principales */}
      <motion.div className="resumen-ventas-graficos" variants={itemVariants}>
        <motion.div 
          className="resumen-ventas-grafico"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-grafico-header">
            <h3 className="resumen-ventas-grafico-title">Ventas por día</h3>
            <div className="resumen-ventas-grafico-stats">
              <span className="resumen-ventas-grafico-stat">
                <TrendingUp size={16} />
                {ventasPorDia.length > 0 ? `${ventasPorDia.length} días` : '0 días'}
              </span>
            </div>
          </div>
          <div className="resumen-ventas-grafico-content">
            {ventasPorDia.length > 0 ? (
              <Bar
                data={{
                  labels: ventasPorDia.map(dia => dia.fechaFormateada),
                  datasets: [
                    {
                      label: 'Ventas',
                      data: ventasPorDia.map(dia => dia.total),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(6, 182, 212, 1)',
                      ],
                      borderWidth: 2,
                      borderRadius: 8,
                      borderSkipped: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: 'Ventas por Día',
                      color: 'var(--text-primary)',
                      font: {
                        size: 16,
                        weight: 'bold'
                      }
                    },
                    tooltip: {
                      backgroundColor: 'var(--bg-modal)',
                      titleColor: 'var(--text-primary)',
                      bodyColor: 'var(--text-primary)',
                      borderColor: 'var(--border-primary)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: false,
                      callbacks: {
                        label: function(context) {
                          return `Ventas: ${formatCOP(context.parsed.y)}`;
                        }
                      }
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(229, 231, 235, 0.5)',
                      },
                      ticks: {
                        color: 'var(--text-secondary)',
                        callback: function(value) {
                          return formatCOP(value);
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: 'var(--text-secondary)',
                      }
                    },
                  },
                  animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart',
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index',
                  },
                }}
              />
            ) : (
              <div className="resumen-ventas-sin-datos">
                <div className="resumen-ventas-sin-datos-icon">
                  <BarChart3 size={48} />
                </div>
                <p>No hay datos para mostrar</p>
                <small>Las ventas aparecerán aquí una vez que realices transacciones</small>
              </div>
            )}
          </div>
        </motion.div>

        {/* Gráfico circular para productos más vendidos */}
        <motion.div 
          className="resumen-ventas-grafico"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="resumen-ventas-grafico-header">
            <h3 className="resumen-ventas-grafico-title">Productos más vendidos</h3>
            <div className="resumen-ventas-grafico-stats">
              <span className="resumen-ventas-grafico-stat">
                <Package size={16} />
                {productosMasVendidos.length} productos
              </span>
            </div>
          </div>
          <div className="resumen-ventas-grafico-content">
            {productosMasVendidos.length > 0 ? (
              <Doughnut
                data={{
                  labels: productosMasVendidos.slice(0, 5).map(p => p.nombre),
                  datasets: [
                    {
                      data: productosMasVendidos.slice(0, 5).map(p => p.cantidad),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                      ],
                      borderWidth: 3,
                      hoverOffset: 10,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Productos Más Vendidos',
                      color: 'var(--text-primary)',
                      font: {
                        size: 16,
                        weight: 'bold'
                      }
                    },
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: 'var(--text-primary)',
                        font: {
                          size: 12,
                          weight: '500',
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'var(--bg-modal)',
                      titleColor: 'var(--text-primary)',
                      bodyColor: 'var(--text-primary)',
                      borderColor: 'var(--border-primary)',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: true,
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return `${context.label}: ${context.parsed} unidades (${percentage}%)`;
                        }
                      }
                    },
                  },
                  animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart',
                  },
                  cutout: '60%',
                }}
              />
            ) : (
              <div className="resumen-ventas-sin-datos">
                <div className="resumen-ventas-sin-datos-icon">
                  <Package size={48} />
                </div>
                <p>No hay productos vendidos</p>
                <small>Los productos más vendidos aparecerán aquí</small>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Rankings y análisis */}
      <div className="resumen-ventas-rankings">
        {/* Productos más vendidos */}
        <motion.div 
          className="resumen-ventas-ranking"
          variants={itemVariants}
        >
          <h3 className="resumen-ventas-ranking-title">
            <Package size={20} />
            Productos más vendidos
          </h3>
          <div className="resumen-ventas-ranking-content">
            {productosMasVendidos.length > 0 ? (
              <ul className="resumen-ventas-ranking-list">
                {productosMasVendidos.map((producto, index) => (
                  <li key={producto.id || index} className="resumen-ventas-ranking-item">
                    <span className="resumen-ventas-ranking-position">{index + 1}.</span>
                    <span className="resumen-ventas-ranking-nombre">{producto.nombre}</span>
                    <span className="resumen-ventas-ranking-cantidad">{producto.cantidad} uds</span>
                    <span className="resumen-ventas-ranking-total">{formatCOP(producto.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resumen-ventas-sin-datos">No hay ventas registradas</p>
            )}
          </div>
        </motion.div>

        {/* Ventas por método de pago */}
        {obtenerVentasPorMetodoPago.length > 0 && (
          <motion.div 
            className="resumen-ventas-ranking"
            variants={itemVariants}
          >
            <h3 className="resumen-ventas-ranking-title">
              <CreditCard size={20} />
              Por Método de Pago
            </h3>
            <div className="resumen-ventas-ranking-content">
              <ul className="resumen-ventas-ranking-list">
                {obtenerVentasPorMetodoPago.map((metodo, index) => (
                  <li key={metodo.metodo} className="resumen-ventas-ranking-item">
                    <span className="resumen-ventas-ranking-position">{index + 1}.</span>
                    <span className="resumen-ventas-ranking-nombre">{metodo.metodo}</span>
                    <span className="resumen-ventas-ranking-cantidad">{metodo.cantidad} transacciones</span>
                    <span className="resumen-ventas-ranking-total">{formatCOP(metodo.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Top vendedores */}
        {obtenerTopVendedores.length > 0 && (
          <motion.div 
            className="resumen-ventas-ranking"
            variants={itemVariants}
          >
            <h3 className="resumen-ventas-ranking-title">
              <Users size={20} />
              Top Vendedores
            </h3>
            <div className="resumen-ventas-ranking-content">
              <ul className="resumen-ventas-ranking-list">
                {obtenerTopVendedores.map((vendedor, index) => (
                  <li key={vendedor.id} className="resumen-ventas-ranking-item">
                    <span className="resumen-ventas-ranking-position">{index + 1}.</span>
                    <span className="resumen-ventas-ranking-nombre">{vendedor.nombre}</span>
                    <span className="resumen-ventas-ranking-cantidad">{vendedor.cantidad} ventas</span>
                    <span className="resumen-ventas-ranking-total">{formatCOP(vendedor.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Top clientes */}
        {obtenerTopClientes.length > 0 && (
          <motion.div 
            className="resumen-ventas-ranking"
            variants={itemVariants}
          >
            <h3 className="resumen-ventas-ranking-title">
              <Users size={20} />
              Top Clientes
            </h3>
            <div className="resumen-ventas-ranking-content">
              <ul className="resumen-ventas-ranking-list">
                {obtenerTopClientes.map((cliente, index) => (
                  <li key={cliente.id} className="resumen-ventas-ranking-item">
                    <span className="resumen-ventas-ranking-position">{index + 1}.</span>
                    <span className="resumen-ventas-ranking-nombre">{cliente.nombre}</span>
                    <span className="resumen-ventas-ranking-cantidad">{cliente.cantidad} compras</span>
                    <span className="resumen-ventas-ranking-total">{formatCOP(cliente.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>

    </motion.div>
    </FeatureGuard>
  );
};

export default ResumenVentas;
