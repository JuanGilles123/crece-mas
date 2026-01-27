// 🍔 Componente para seleccionar toppings al agregar producto al carrito (mejorado con categorías)
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Package } from 'lucide-react';
import { useToppings } from '../hooks/useToppings';
import { calcularPrecioConToppings } from '../utils/toppingsUtils';
import { useImageCache } from '../hooks/useImageCache';
import './ToppingsSelector.css';

// Formato de moneda
const formatCOP = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
};

// Componente para cada item de topping con imagen
const ToppingItem = ({ topping, seleccionado, onToggle, onChangeCantidad }) => {
  const { imageUrl, loading: imageLoading, error: imageError } = useImageCache(topping.imagen_url);

  return (
    <motion.div
      className={`topping-item ${seleccionado ? 'selected' : ''}`}
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="topping-item-content">
        <div className="topping-item-check">
          {seleccionado && <Check size={14} />}
        </div>
        {topping.imagen_url && (
          <div className="topping-item-image">
            {imageLoading ? (
              <div className="topping-image-placeholder">
                <Package size={20} />
              </div>
            ) : imageError || !imageUrl ? (
              <div className="topping-image-placeholder">
                <Package size={20} />
              </div>
            ) : (
              <img src={imageUrl} alt={topping.nombre} />
            )}
          </div>
        )}
        <div className="topping-item-info">
          <span className="topping-item-nombre">{topping.nombre}</span>
          <span className="topping-item-precio">{formatCOP(topping.precio)}</span>
        </div>
      </div>
      {seleccionado && (
        <div className="topping-item-cantidad" onClick={(e) => e.stopPropagation()}>
          <button
            className="topping-cantidad-btn"
            onClick={() => onChangeCantidad(-1)}
            disabled={seleccionado.cantidad <= 1}
          >
            −
          </button>
          <span>{seleccionado.cantidad}</span>
          <button
            className="topping-cantidad-btn"
            onClick={() => onChangeCantidad(1)}
            disabled={topping.stock !== null && seleccionado.cantidad >= topping.stock}
          >
            +
          </button>
        </div>
      )}
    </motion.div>
  );
};

const ToppingsSelector = ({
  open,
  onClose,
  producto,
  precioBase,
  onConfirm,
  organizationId,
  tipo = 'comida', // 'comida' | 'servicio'
  titulo = null // Título personalizado opcional
}) => {
  const { data: toppings = [], isLoading } = useToppings(organizationId);
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Filtrar toppings por tipo y stock (si aplica)
  // Para servicios, el stock puede ser null, así que permitimos null o > 0
  const toppingsDisponibles = toppings.filter(t => {
    // Filtrar por tipo (si el topping tiene tipo definido)
    if (t.tipo && t.tipo !== tipo) return false;

    // Si es servicio, siempre disponible (stock null o > 0)
    if (tipo === 'servicio') return true;

    // Si es comida, requiere stock > 0
    return t.stock > 0;
  });

  // Filtrar por búsqueda
  const toppingsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return toppingsDisponibles;
    
    const query = busqueda.toLowerCase();
    return toppingsDisponibles.filter(topping => 
      topping.nombre?.toLowerCase().includes(query) ||
      topping.categoria?.toLowerCase().includes(query)
    );
  }, [toppingsDisponibles, busqueda]);

  // Agrupar toppings por categoría
  const toppingsPorCategoria = useMemo(() => {
    const grupos = {};
    toppingsFiltrados.forEach(topping => {
      const cat = topping.categoria || 'general';
      if (!grupos[cat]) {
        grupos[cat] = [];
      }
      grupos[cat].push(topping);
    });
    return grupos;
  }, [toppingsFiltrados]);

  const categorias = Object.keys(toppingsPorCategoria).sort();

  // Establecer primera categoría como activa por defecto
  useEffect(() => {
    if (categorias.length > 0 && !categoriaActiva) {
      setCategoriaActiva(categorias[0]);
    }
  }, [categorias, categoriaActiva]);

  const isService = tipo === 'servicio';
  const title = titulo || (isService ? '¿Desea agregar adicionales?' : '¿Lleva toppings?');
  const itemLabel = isService ? 'adicionales' : 'toppings';

  useEffect(() => {
    if (!open) {
      setToppingsSeleccionados([]);
      setBusqueda('');
    }
  }, [open]);

  const toggleTopping = (topping) => {
    setToppingsSeleccionados(prev => {
      const existe = prev.find(t => t.id === topping.id);
      if (existe) {
        // Si ya está seleccionado, aumentar cantidad
        return prev.map(t =>
          t.id === topping.id
            ? { ...t, cantidad: Math.min(t.cantidad + 1, topping.stock !== null ? topping.stock : 999) }
            : t
        );
      } else {
        // Si no está seleccionado, agregarlo
        return [...prev, {
          id: topping.id,
          nombre: topping.nombre,
          precio: topping.precio,
          cantidad: 1,
          stock: topping.stock
        }];
      }
    });
  };

  const cambiarCantidad = (toppingId, delta) => {
    setToppingsSeleccionados(prev =>
      prev.map(t => {
        if (t.id === toppingId) {
          const nuevaCantidad = t.cantidad + delta;
          if (nuevaCantidad <= 0) {
            return null; // Eliminar si cantidad es 0
          }
          if (nuevaCantidad > t.stock && t.stock !== null) {
            return t; // No exceder stock
          }
          return { ...t, cantidad: nuevaCantidad };
        }
        return t;
      }).filter(Boolean)
    );
  };

  const eliminarTopping = (toppingId) => {
    setToppingsSeleccionados(prev => prev.filter(t => t.id !== toppingId));
  };

  const precioTotal = calcularPrecioConToppings(precioBase, toppingsSeleccionados);

  const handleConfirmar = () => {
    onConfirm(toppingsSeleccionados, precioTotal);
    onClose();
  };

  const handleSinToppings = () => {
    onConfirm([], precioBase);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="toppings-selector-overlay" onClick={onClose}>
      <motion.div
        className="toppings-selector-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="toppings-selector-header">
          <div>
            <h3>{title}</h3>
            <p className="producto-nombre">{producto?.nombre}</p>
          </div>
          <button className="toppings-selector-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="toppings-selector-loading">
            <p>Cargando toppings...</p>
          </div>
        ) : toppingsFiltrados.length === 0 ? (
          <div className="toppings-selector-empty">
            <Package size={48} />
            <p>No hay {itemLabel} disponibles</p>
            <button className="topping-btn-primary" onClick={handleSinToppings}>
              Agregar sin {itemLabel}
            </button>
          </div>
        ) : (
          <>
            {/* Buscador de toppings */}
            <div className="toppings-busqueda-container">
              <span className="toppings-busqueda-icon-outside">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="toppings-busqueda-input"
              />
            </div>

            {/* Tabs de categorías (si hay más de una) */}
            {categorias.length > 1 && (
              <div className="toppings-categorias-tabs">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    className={`topping-categoria-tab ${categoriaActiva === cat ? 'active' : ''}`}
                    onClick={() => setCategoriaActiva(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    <span className="topping-categoria-count">
                      {toppingsPorCategoria[cat].length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Lista de toppings agrupada por categoría */}
            <div className="toppings-selector-list">
              {categoriaActiva && toppingsPorCategoria[categoriaActiva] ? (
                toppingsPorCategoria[categoriaActiva].map((topping) => {
                  const seleccionado = toppingsSeleccionados.find(t => t.id === topping.id);
                  return (
                    <ToppingItem
                      key={topping.id}
                      topping={topping}
                      seleccionado={seleccionado}
                      onToggle={() => toggleTopping(topping)}
                      onChangeCantidad={(delta) => cambiarCantidad(topping.id, delta)}
                    />
                  );
                })
              ) : (
                // Si no hay categoría activa, mostrar todos (fallback)
                toppingsFiltrados.map((topping) => {
                  const seleccionado = toppingsSeleccionados.find(t => t.id === topping.id);
                  return (
                    <ToppingItem
                      key={topping.id}
                      topping={topping}
                      seleccionado={seleccionado}
                      onToggle={() => toggleTopping(topping)}
                      onChangeCantidad={(delta) => cambiarCantidad(topping.id, delta)}
                    />
                  );
                })
              )}
            </div>

            {toppingsSeleccionados.length > 0 && (
              <div className="toppings-seleccionados">
                <h4>{isService ? 'Adicionales seleccionados:' : 'Toppings seleccionados:'}</h4>
                <div className="toppings-seleccionados-list">
                  {toppingsSeleccionados.map((topping) => (
                    <div key={topping.id} className="topping-seleccionado-item">
                      <span>{topping.nombre} x{topping.cantidad}</span>
                      <div className="topping-seleccionado-actions">
                        <span className="topping-seleccionado-precio">
                          {formatCOP(topping.precio * topping.cantidad)}
                        </span>
                        <button
                          className="topping-remove-btn"
                          onClick={() => eliminarTopping(topping.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="toppings-selector-footer">
              <div className="toppings-precio-total">
                <span className="precio-label">Precio base:</span>
                <span className="precio-value">{formatCOP(precioBase)}</span>
              </div>
              {toppingsSeleccionados.length > 0 && (
                <div className="toppings-precio-total">
                  <span className="precio-label">{isService ? 'Adicionales:' : 'Toppings:'}</span>
                  <span className="precio-value">
                    {formatCOP(precioTotal - precioBase)}
                  </span>
                </div>
              )}
              <div className="toppings-precio-total total">
                <span className="precio-label">Total:</span>
                <span className="precio-value">{formatCOP(precioTotal)}</span>
              </div>
              <div className="toppings-selector-actions">
                <button className="topping-btn-secondary" onClick={handleSinToppings}>
                  Sin {itemLabel}
                </button>
                <button className="topping-btn-primary" onClick={handleConfirmar}>
                  Agregar al carrito
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ToppingsSelector;

