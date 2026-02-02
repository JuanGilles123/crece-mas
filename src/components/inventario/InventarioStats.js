import React from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, TrendingUp, AlertTriangle, Box, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './InventarioStats.css';

const InventarioStats = ({ productos }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const umbralStockBajo = Number(user?.user_metadata?.umbralStockBajo ?? 10);
  const umbralStockBajoSeguro = Number.isFinite(umbralStockBajo) && umbralStockBajo > 0 ? umbralStockBajo : 10;
  // Calcular métricas
  const totalProductos = productos.length;
  
  const productosInventario = productos.filter(p => p.tipo !== 'servicio');
  const totalStock = productosInventario.reduce((sum, p) => sum + (Number(p.stock ?? 0) || 0), 0);
  
  const getUmbralProducto = (producto) => {
    const umbralProducto = Number(producto?.metadata?.umbral_stock_bajo);
    if (Number.isFinite(umbralProducto) && umbralProducto > 0) {
      return umbralProducto;
    }
    return umbralStockBajoSeguro;
  };

  // Stock bajo (según umbral por producto o general)
  const stockBajo = productosInventario.filter(p => {
    const stock = Number(p.stock ?? 0) || 0;
    return stock > 0 && stock <= getUmbralProducto(p);
  });
  const cantidadStockBajo = stockBajo.length;
  
  // Sin stock
  const sinStock = productosInventario.filter(p => (Number(p.stock ?? 0) || 0) === 0);
  const cantidadSinStock = sinStock.length;
  
  // Costo total en stock (precio_compra * stock)
  const costoEnStock = productosInventario.reduce((sum, p) => {
    const stock = Number(p.stock ?? 0) || 0;
    const precioCompra = p.precio_compra || 0;
    return sum + (stock * precioCompra);
  }, 0);
  
  // Valor de venta en stock (precio_venta * stock)
  const valorVentaEnStock = productosInventario.reduce((sum, p) => {
    const stock = Number(p.stock ?? 0) || 0;
    const precioVenta = p.precio_venta || 0;
    return sum + (stock * precioVenta);
  }, 0);
  
  // Utilidad potencial en stock (valor venta - costo)
  const utilidadEnStock = valorVentaEnStock - costoEnStock;
  
  // Margen de utilidad porcentual
  const margenUtilidad = valorVentaEnStock > 0 
    ? ((utilidadEnStock / valorVentaEnStock) * 100).toFixed(1)
    : 0;

  const stats = [
    {
      id: 'total',
      label: 'Total Productos',
      value: totalProductos,
      icon: Package,
      color: 'primary',
      format: (val) => val.toLocaleString('es-CO')
    },
    {
      id: 'stock',
      label: 'Stock Total',
      value: totalStock,
      icon: Box,
      color: 'primary',
      format: (val) => parseFloat(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    },
    {
      id: 'costo',
      label: 'Costo en Stock',
      value: costoEnStock,
      icon: DollarSign,
      color: 'info',
      format: (val) => `$${Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      id: 'utilidad',
      label: 'Utilidad Potencial',
      value: utilidadEnStock,
      icon: TrendingUp,
      color: 'success',
      format: (val) => `$${Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      id: 'margen',
      label: 'Margen de Utilidad',
      value: parseFloat(margenUtilidad),
      icon: Percent,
      color: 'success',
      format: (val) => `${val}%`
    },
    {
      id: 'stock-bajo',
      label: 'Stock Bajo',
      value: cantidadStockBajo,
      icon: AlertTriangle,
      color: 'warning',
      format: (val) => val.toLocaleString('es-CO'),
      onClick: () => navigate('/dashboard/inventario?stock=bajo')
    },
    {
      id: 'sin-stock',
      label: 'Sin Stock',
      value: cantidadSinStock,
      icon: AlertTriangle,
      color: 'danger',
      format: (val) => val.toLocaleString('es-CO'),
      onClick: () => navigate('/dashboard/inventario?stock=sin')
    }
  ];

  return (
    <div className="inventario-stats-container">
      <div className="inventario-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              className={`inventario-stat-card inventario-stat-${stat.color}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              onClick={stat.onClick}
              style={stat.onClick ? { cursor: 'pointer' } : undefined}
            >
              <div className="inventario-stat-icon-wrapper">
                <Icon size={24} className="inventario-stat-icon" />
              </div>
              <div className="inventario-stat-content">
                <div className="inventario-stat-label">{stat.label}</div>
                <div className="inventario-stat-value">{stat.format(stat.value)}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InventarioStats;
