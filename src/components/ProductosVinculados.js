// Componente para vincular productos del stock a otro producto (Modo Premium)
import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Search, Package, Minus, ShoppingCart } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import OptimizedProductImage from './business/OptimizedProductImage';
import './ProductosVinculados.css';

const ProductosVinculados = ({ productosVinculados = [], onChange, organizationId }) => {
  const { organization } = useAuth();
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [mostrandoSelector, setMostrandoSelector] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  // Utilidad para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Cargar productos con búsqueda debounced
  useEffect(() => {
    const orgId = organizationId || organization?.id;
    if (!orgId || !mostrandoSelector) return;

    const cargarProductos = async () => {
      setCargando(true);
      try {
        let query = supabase
          .from('productos')
          .select('id, nombre, codigo, stock, precio_venta, precio_compra, imagen, metadata')
          .eq('organization_id', orgId)
          .not('stock', 'is', null)
          .gt('stock', 0)
          .order('nombre', { ascending: true })
          .limit(30);

        if (busqueda.trim()) {
          query = query.or(`nombre.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setProductosDisponibles(data || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setCargando(false);
      }
    };

    const timeout = setTimeout(cargarProductos, 300);
    return () => clearTimeout(timeout);
  }, [organizationId, organization?.id, busqueda, mostrandoSelector]);

  const handleAgregarDirecto = (producto) => {
    const existe = productosVinculados.find(v => v.producto_id === producto.id);
    
    if (existe) {
      // Incrementar cantidad si ya existe
      const nuevos = productosVinculados.map(v => 
        v.producto_id === producto.id 
          ? { ...v, cantidad: (v.cantidad || 1) + 1 }
          : v
      );
      onChange(nuevos);
    } else {
      // Agregar nuevo
      const nuevoVinculo = {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad: 1,
        es_porcion: false,
        precio_compra: producto.precio_compra || 0,
        precio_venta: producto.precio_venta || 0,
        categoria: producto.metadata?.categoria || 'Sin categoría'
      };
      onChange([...productosVinculados, nuevoVinculo]);
    }
  };

  const handleActualizarCantidad = (index, delta) => {
    const nuevos = [...productosVinculados];
    const nuevaCantidad = Math.max(0.1, (nuevos[index].cantidad || 1) + delta);
    nuevos[index].cantidad = parseFloat(nuevaCantidad.toFixed(2));
    onChange(nuevos);
  };

  const handleEliminar = (index) => {
    const nuevos = productosVinculados.filter((_, i) => i !== index);
    onChange(nuevos);
  };

  return (
    <div className="productos-vinculados-premium">
      <div className="pv-header">
        <div className="pv-title-box">
          <h3>Componentes de la Ancheta / Combo</h3>
          <p>Selecciona los productos que conforman este pack</p>
        </div>
        <button
          type="button"
          className="pv-add-main-btn"
          onClick={() => setMostrandoSelector(true)}
        >
          <Search size={18} />
          Buscar Productos
        </button>
      </div>

      {/* Lista de productos ya vinculados */}
      <div className="pv-selected-list">
        {productosVinculados.length === 0 ? (
          <div className="pv-empty-state">
            <Package size={48} className="pv-empty-icon" />
            <p>No hay productos vinculados aún</p>
            <span>Usa el buscador para añadir los elementos de la ancheta</span>
          </div>
        ) : (
          <div className="pv-items-container">
            {productosVinculados.map((vinculo, index) => (
              <div key={index} className="pv-selected-item">
                <div className="pv-item-info">
                  <div className="pv-item-main">
                    <span className="pv-item-name">{vinculo.producto_nombre}</span>
                    <span className="pv-item-category">{vinculo.categoria || 'Producto'}</span>
                  </div>
                  <div className="pv-item-prices">
                    <span className="pv-price-tag cost">Costo: {formatCurrency(vinculo.precio_compra)}</span>
                    <span className="pv-price-tag sale">Venta: {formatCurrency(vinculo.precio_venta)}</span>
                  </div>
                </div>
                
                <div className="pv-item-actions">
                  <div className="pv-qty-controls">
                    <button type="button" onClick={() => handleActualizarCantidad(index, -1)} disabled={vinculo.cantidad <= 0.1}>
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number" 
                      value={vinculo.cantidad} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const nuevos = [...productosVinculados];
                        nuevos[index].cantidad = val;
                        onChange(nuevos);
                      }}
                    />
                    <button type="button" onClick={() => handleActualizarCantidad(index, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="pv-remove-btn"
                    onClick={() => handleEliminar(index)}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selector Modal (Estilo Caja) */}
      {mostrandoSelector && (
        <div className="pv-modal-overlay" onClick={() => setMostrandoSelector(false)}>
          <div className="pv-modal-content" onClick={e => e.stopPropagation()}>
            <div className="pv-modal-header">
              <div className="pv-modal-title">
                <ShoppingCart size={20} />
                <h3>Agregar Productos al Combo</h3>
              </div>
              <button type="button" onClick={() => setMostrandoSelector(false)} className="pv-close-modal">
                <X size={24} />
              </button>
            </div>

            <div className="pv-search-container">
              <Search className="pv-search-icon" size={20} />
              <input
                type="text"
                placeholder="Busca por nombre o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
            </div>

            <div className="pv-results-grid">
              {cargando ? (
                <div className="pv-loading">Buscando productos...</div>
              ) : productosDisponibles.length === 0 ? (
                <div className="pv-no-results">No se encontraron productos con "{busqueda}"</div>
              ) : (
                productosDisponibles.map(producto => {
                  const vinculado = productosVinculados.find(v => v.producto_id === producto.id);
                  const isSelected = !!vinculado;
                  
                  return (
                    <div 
                      key={producto.id} 
                      className={`pv-product-card ${isSelected ? 'is-selected' : ''}`} 
                      onClick={() => handleAgregarDirecto(producto)}
                    >
                    <div className="pv-card-image">
                      <OptimizedProductImage imagePath={producto.imagen} alt={producto.nombre} />
                    </div>
                    <div className="pv-card-info">
                      <h4 title={producto.nombre}>{producto.nombre}</h4>
                      <span className="pv-card-category">{producto.metadata?.categoria || 'Sin categoría'}</span>
                      <div className="pv-card-meta">
                        <span className="pv-card-stock">Stock: {producto.stock}</span>
                        <span className="pv-card-price">{formatCurrency(producto.precio_venta)}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="pv-card-badge">
                        {vinculado.cantidad}
                      </div>
                    )}
                    <div className="pv-card-add">
                      <Plus size={20} />
                    </div>
                  </div>
                );
              })
              )}
            </div>

            <div className="pv-modal-footer">
              <p>{productosVinculados.length} productos seleccionados</p>
              <button type="button" className="pv-done-btn" onClick={() => setMostrandoSelector(false)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosVinculados;
