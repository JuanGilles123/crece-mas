import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ResumenVentas.css';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw, 
  LayoutGrid,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Target,
  Award
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
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vistaActual, setVistaActual] = useState('general');
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    categoria: 'todas',
    vendedor: 'todos'
  });
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // Cargar datos de ventas
  const cargarVentas = useCallback(async () => {
    if (!user) return;
    setCargando(true);
    
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error) {
        setVentas(data || []);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
    setCargando(false);
  }, [user]);

  // Cargar productos para análisis
  const cargarProductos = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', user.id)
        .limit(1000);

      if (!error) {
        setProductos(data || []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }, [user]);

  useEffect(() => {
    cargarVentas();
    cargarProductos();
  }, [cargarVentas, cargarProductos]);

  // Calcular métricas
  const calcularMetricas = () => {
    const ventasFiltradas = filtrarVentas();
    const totalVentas = ventasFiltradas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
    const totalTickets = ventasFiltradas.length;
    const promedioTicket = totalTickets > 0 ? totalVentas / totalTickets : 0;
    
    // Calcular utilidad (asumiendo 30% de margen promedio)
    const utilidad = totalVentas * 0.3;

    return {
      totalVentas,
      totalTickets,
      promedioTicket,
      utilidad
    };
  };

  // Filtrar ventas según filtros aplicados
  const filtrarVentas = () => {
    let ventasFiltradas = ventas;

    if (filtros.fechaInicio) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        new Date(venta.created_at) >= new Date(filtros.fechaInicio)
      );
    }

    if (filtros.fechaFin) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        new Date(venta.created_at) <= new Date(filtros.fechaFin + 'T23:59:59')
      );
    }

    return ventasFiltradas;
  };

  // Obtener productos más vendidos
  const obtenerProductosMasVendidos = () => {
    const ventasFiltradas = filtrarVentas();
    const productosVendidos = {};

    ventasFiltradas.forEach(venta => {
      if (venta.items && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const productoId = item.id;
          if (productosVendidos[productoId]) {
            productosVendidos[productoId].cantidad += item.qty || 1;
            productosVendidos[productoId].total += (item.precio_venta || 0) * (item.qty || 1);
          } else {
            productosVendidos[productoId] = {
              nombre: item.nombre || 'Producto desconocido',
              cantidad: item.qty || 1,
              total: (item.precio_venta || 0) * (item.qty || 1)
            };
          }
        });
      }
    });

    return Object.entries(productosVendidos)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  };

  // Obtener ventas por día (últimos 7 días)
  const obtenerVentasPorDia = () => {
    const ventasFiltradas = filtrarVentas();
    const ventasPorDia = {};
    
    // Crear array de los últimos 7 días
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
      const fecha = subDays(new Date(), i);
      return format(fecha, 'yyyy-MM-dd');
    }).reverse();

    // Inicializar todos los días con 0
    ultimos7Dias.forEach(fecha => {
      ventasPorDia[fecha] = 0;
    });

    // Sumar ventas reales
    ventasFiltradas.forEach(venta => {
      const fechaVenta = format(parseISO(venta.created_at), 'yyyy-MM-dd');
      if (ventasPorDia.hasOwnProperty(fechaVenta)) {
        ventasPorDia[fechaVenta] += parseFloat(venta.total);
      }
    });

    return Object.entries(ventasPorDia)
      .map(([fecha, total]) => ({ 
        fecha, 
        total,
        fechaFormateada: format(parseISO(fecha), 'dd/MM', { locale: es })
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  // Obtener historial de ventas detallado
  const obtenerHistorialVentas = () => {
    const ventasFiltradas = filtrarVentas();
    const historialDetallado = [];
    
    console.log('Ventas filtradas para historial:', ventasFiltradas);
    
    // Si no hay ventas reales, crear datos de prueba
    if (ventasFiltradas.length === 0) {
      console.log('No hay ventas reales, creando datos de prueba');
      return [
        {
          id: 'test-1',
          fecha: new Date().toISOString(),
          producto: 'Camisa Polo Azul',
          vendedor: 'Usuario Actual',
          cantidad: 2,
          total: 45000,
          metodoPago: 'Efectivo',
          fechaFormateada: format(new Date(), 'dd/MM/yyyy', { locale: es })
        },
        {
          id: 'test-2',
          fecha: new Date().toISOString(),
          producto: 'Jeans Skinny',
          vendedor: 'Usuario Actual',
          cantidad: 1,
          total: 80000,
          metodoPago: 'Tarjeta',
          fechaFormateada: format(new Date(), 'dd/MM/yyyy', { locale: es })
        },
        {
          id: 'test-3',
          fecha: new Date().toISOString(),
          producto: 'Zapatillas Running',
          vendedor: 'Usuario Actual',
          cantidad: 1,
          total: 120000,
          metodoPago: 'Nequi',
          fechaFormateada: format(new Date(), 'dd/MM/yyyy', { locale: es })
        }
      ];
    }
    
    ventasFiltradas.slice(0, 50).forEach(venta => {
      console.log('Procesando venta:', venta);
      console.log('Items de la venta:', venta.items);
      // Verificar si hay items en la venta
      if (venta.items && Array.isArray(venta.items) && venta.items.length > 0) {
        venta.items.forEach((item, index) => {
          console.log(`Item ${index}:`, item);
          
          // Extraer datos del item con múltiples fallbacks
          const nombreProducto = item.nombre || 
                                item.producto_nombre || 
                                item.name || 
                                `Producto ${index + 1}`;
          
          const cantidad = parseInt(item.qty) || 
                          parseInt(item.cantidad) || 
                          parseInt(item.quantity) || 
                          1;
          
          const precioUnitario = parseFloat(item.precio_venta) || 
                                parseFloat(item.precio) || 
                                parseFloat(item.price) || 
                                0;
          
          const totalItem = precioUnitario * cantidad;
          
          console.log(`Procesando item: ${nombreProducto}, cantidad: ${cantidad}, precio: ${precioUnitario}, total: ${totalItem}`);
          
          historialDetallado.push({
            id: `${venta.id}-${item.id || index}`,
            fecha: venta.created_at,
            producto: nombreProducto,
            vendedor: 'Usuario Actual',
            cantidad: cantidad,
            total: totalItem,
            metodoPago: venta.metodo_pago,
            fechaFormateada: format(parseISO(venta.created_at), 'dd/MM/yyyy', { locale: es })
          });
        });
      } else {
        // Si no hay items detallados, crear una entrada general
        console.log('Venta sin items detallados, creando entrada general');
        historialDetallado.push({
          id: venta.id,
          fecha: venta.created_at,
          producto: 'Venta General',
          vendedor: 'Usuario Actual',
          cantidad: 1,
          total: parseFloat(venta.total) || 0,
          metodoPago: venta.metodo_pago,
          fechaFormateada: format(parseISO(venta.created_at), 'dd/MM/yyyy', { locale: es })
        });
      }
    });
    
    console.log('Historial detallado final:', historialDetallado);
    return historialDetallado.slice(0, 20);
  };

  // Formatear moneda
  const formatCOP = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Exportar tabla a CSV
  const exportarTabla = () => {
    if (historialVentas.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear encabezados CSV
    const headers = ['Fecha', 'Producto', 'Vendedor', 'Cantidad', 'Total'];
    
    // Crear filas de datos
    const rows = historialVentas.map(venta => [
      venta.fechaFormateada,
      venta.producto,
      venta.vendedor,
      venta.cantidad,
      venta.total
    ]);

    // Combinar headers y rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_ventas_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar historial por búsqueda
  const filtrarHistorial = () => {
    const historial = obtenerHistorialVentas();
    if (!busquedaHistorial.trim()) return historial;
    
    const termino = busquedaHistorial.toLowerCase();
    return historial.filter(item => 
      item.producto.toLowerCase().includes(termino) ||
      item.vendedor.toLowerCase().includes(termino)
    );
  };

  const metricas = calcularMetricas();
  const productosMasVendidos = obtenerProductosMasVendidos();
  const ventasPorDia = obtenerVentasPorDia();
  const historialVentas = filtrarHistorial();

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
            onClick={cargarVentas}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={16} />
            Actualizar
          </motion.button>
          <motion.button 
            className="resumen-ventas-btn resumen-ventas-btn-outline"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={16} />
            Exportar
          </motion.button>
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
        <div className="resumen-ventas-filtro">
          <Calendar size={16} />
          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
            className="resumen-ventas-input"
          />
        </div>
        <div className="resumen-ventas-filtro">
          <Calendar size={16} />
          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
            className="resumen-ventas-input"
          />
        </div>
        <select
          value={filtros.categoria}
          onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
          className="resumen-ventas-select"
        >
          <option value="todas">Categoría: Todas</option>
          <option value="ropa">Ropa</option>
          <option value="accesorios">Accesorios</option>
        </select>
        <button className="resumen-ventas-btn resumen-ventas-btn-primary">
          <Filter size={16} />
          Aplicar
        </button>
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
            <p className="resumen-ventas-metrica-label">Tickets</p>
            <p className="resumen-ventas-metrica-value">{metricas.totalTickets}</p>
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
            <p className="resumen-ventas-metrica-label">Promedio Ticket</p>
            <p className="resumen-ventas-metrica-value">{formatCOP(metricas.promedioTicket)}</p>
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
            <p className="resumen-ventas-metrica-label">Utilidad</p>
            <p className="resumen-ventas-metrica-value resumen-ventas-utilidad">{formatCOP(metricas.utilidad)}</p>
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

      {/* Historial de Ventas */}
      <motion.div 
        className="resumen-ventas-grafico"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="resumen-ventas-grafico-header">
          <h3 className="resumen-ventas-grafico-title">Historial de Ventas</h3>
          <div className="resumen-ventas-grafico-stats">
            <span className="resumen-ventas-grafico-stat">
              <ShoppingCart size={16} />
              {historialVentas.length} transacciones
            </span>
          </div>
        </div>
        
        {/* Barra de búsqueda y exportar */}
        <div className="resumen-ventas-busqueda-container">
          <div className="resumen-ventas-busqueda">
            <div className="resumen-ventas-busqueda-input-container">
              <Filter size={16} className="resumen-ventas-busqueda-icon" />
              <input
                type="text"
                placeholder="Buscar producto o vendedor..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                className="resumen-ventas-busqueda-input"
              />
            </div>
          </div>
          <button className="resumen-ventas-exportar-btn" onClick={exportarTabla}>
            <Download size={16} />
            Exportar Tabla
          </button>
        </div>
        
        <div className="resumen-ventas-grafico-content">
          {historialVentas.length > 0 ? (
            <div className="resumen-ventas-tabla-container">
              <table className="resumen-ventas-tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Vendedor</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historialVentas.map((venta, index) => (
                    <tr key={venta.id}>
                      <td>{venta.fechaFormateada}</td>
                      <td>{venta.producto}</td>
                      <td>{venta.vendedor}</td>
                      <td>{venta.cantidad}</td>
                      <td>{formatCOP(venta.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="resumen-ventas-sin-datos">
              <div className="resumen-ventas-sin-datos-icon">
                <ShoppingCart size={48} />
              </div>
              <p>No hay ventas registradas</p>
              <small>El historial de ventas aparecerá aquí</small>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rankings */}
      <div className="resumen-ventas-rankings">
        <div className="resumen-ventas-ranking">
          <h3 className="resumen-ventas-ranking-title">Productos más vendidos</h3>
          <div className="resumen-ventas-ranking-content">
            {productosMasVendidos.length > 0 ? (
              <ul className="resumen-ventas-ranking-list">
                {productosMasVendidos.map((producto, index) => (
                  <li key={producto.id} className="resumen-ventas-ranking-item">
                    <span className="resumen-ventas-ranking-position">{index + 1}.</span>
                    <span className="resumen-ventas-ranking-nombre">{producto.nombre}</span>
                    <span className="resumen-ventas-ranking-cantidad">{producto.cantidad} uds</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="resumen-ventas-sin-datos">No hay ventas registradas</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumenVentas;
