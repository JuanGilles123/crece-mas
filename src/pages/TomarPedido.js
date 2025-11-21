// 🍽️ Página para tomar pedidos por mesa
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Minus, Trash2, Save, Circle, Users, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useMesas } from '../hooks/useMesas';
import { useCrearPedido } from '../hooks/usePedidos';
import { canUsePedidos, getMesaEstadoColor } from '../utils/mesasUtils';
import { canUseToppings } from '../utils/toppingsUtils';
import { calcularPrecioConToppings } from '../utils/toppingsUtils';
import { supabase } from '../supabaseClient';
import ToppingsSelector from '../components/ToppingsSelector';
import OptimizedProductImage from '../components/OptimizedProductImage';
import toast from 'react-hot-toast';
import './TomarPedido.css';

const formatCOP = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
};

const TomarPedido = () => {
  const { user, organization } = useAuth();
  const { hasFeature } = useSubscription();
  const { data: mesas = [] } = useMesas(organization?.id);
  const crearPedido = useCrearPedido();

  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrandoToppingsSelector, setMostrandoToppingsSelector] = useState(false);
  const [productoParaToppings, setProductoParaToppings] = useState(null);
  const [mostrandoProductos, setMostrandoProductos] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mostrandoConfirmacionToppings, setMostrandoConfirmacionToppings] = useState(false);
  const [productosPendientesToppings, setProductosPendientesToppings] = useState([]);
  const [indiceProductoActualToppings, setIndiceProductoActualToppings] = useState(0);

  // Verificar acceso
  const acceso = canUsePedidos(organization, hasFeature);
  const puedeUsarToppings = organization && canUseToppings(organization, null, hasFeature).canUse;

  // Filtrar mesas disponibles
  const mesasDisponibles = useMemo(() => {
    return mesas.filter(m => m.estado === 'disponible' && m.activa);
  }, [mesas]);

  // Cargar productos
  useEffect(() => {
    const cargarProductos = async () => {
      if (!organization?.id) {
        setCargando(false);
        setProductos([]);
        return;
      }
      setCargando(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('organization_id', organization.id)
          .order('nombre', { ascending: true });

        if (error) throw error;
        setProductos(data || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
        toast.error('Error al cargar productos');
        setProductos([]);
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, [organization?.id]);

  // Filtrar productos (excluir servicios y aplicar búsqueda)
  const productosFiltrados = useMemo(() => {
    let filtrados = productos.filter(p => p.tipo !== 'servicio');
    
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo?.toLowerCase().includes(q)
      );
    }
    
    return filtrados;
  }, [productos, query]);

  // Calcular total
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.precio_total || 0), 0);
  }, [items]);

  // Seleccionar/deseleccionar producto (solo marca visual)
  const handleSeleccionarProducto = (producto) => {
    setProductosSeleccionados(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.filter(p => p.id !== producto.id);
      } else {
        return [...prev, producto];
      }
    });
  };

  // Confirmar selección de productos
  const handleConfirmarSeleccion = () => {
    if (productosSeleccionados.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    if (puedeUsarToppings) {
      // Preguntar si incluyen toppings
      setMostrandoConfirmacionToppings(true);
    } else {
      // Agregar directamente sin toppings
      const cantidad = productosSeleccionados.length;
      productosSeleccionados.forEach(producto => {
        agregarItem(producto, [], producto.precio_venta);
      });
      setProductosSeleccionados([]);
      setMostrandoProductos(false);
      toast.success(`${cantidad} producto(s) agregado(s)`);
    }
  };

  // Manejar respuesta de confirmación de toppings
  const handleConfirmacionToppings = (incluirToppings) => {
    // Guardar cantidad antes de limpiar
    const cantidad = productosSeleccionados.length;
    const productosParaProcesar = [...productosSeleccionados];
    
    setMostrandoConfirmacionToppings(false);
    
    if (!incluirToppings) {
      // Agregar todos sin toppings y cerrar modal de productos
      productosParaProcesar.forEach(producto => {
        agregarItem(producto, [], producto.precio_venta);
      });
      setProductosSeleccionados([]);
      setMostrandoProductos(false);
      toast.success(`${cantidad} producto(s) agregado(s)`);
    } else {
      // Cerrar modal de productos primero
      setMostrandoProductos(false);
      
      // Procesar toppings para cada producto
      setProductosPendientesToppings(productosParaProcesar);
      setIndiceProductoActualToppings(0);
      if (productosParaProcesar.length > 0) {
        setProductoParaToppings(productosParaProcesar[0]);
        // Pequeño delay para que el modal de productos se cierre antes
        setTimeout(() => {
          setMostrandoToppingsSelector(true);
        }, 300);
      }
    }
  };

  const agregarItem = (producto, toppings = [], precioTotal) => {
    setItems(prev => {
      const idx = prev.findIndex(i =>
        i.producto_id === producto.id &&
        JSON.stringify(i.toppings || []) === JSON.stringify(toppings)
      );

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          cantidad: next[idx].cantidad + 1,
          precio_total: precioTotal * (next[idx].cantidad + 1)
        };
        return next;
      }

      return [...prev, {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        producto_imagen: producto.imagen,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
        precio_total: precioTotal,
        toppings: toppings.length > 0 ? toppings : []
      }];
    });
  };

  const handleToppingsConfirm = (toppings, precioTotal) => {
    if (!productoParaToppings) {
      console.error('No hay producto para toppings');
      return;
    }
    
    if (!productosPendientesToppings || productosPendientesToppings.length === 0) {
      console.error('No hay productos pendientes de toppings');
      setMostrandoToppingsSelector(false);
      setProductoParaToppings(null);
      return;
    }
    
    agregarItem(productoParaToppings, toppings, precioTotal);
    
    // Si hay más productos pendientes, continuar con el siguiente
    const siguienteIndice = indiceProductoActualToppings + 1;
    if (siguienteIndice < productosPendientesToppings.length) {
      setIndiceProductoActualToppings(siguienteIndice);
      setProductoParaToppings(productosPendientesToppings[siguienteIndice]);
      // El selector de toppings se mantiene abierto
    } else {
      // Terminamos con todos los productos
      const cantidadTotal = productosPendientesToppings.length;
      setProductoParaToppings(null);
      setProductosPendientesToppings([]);
      setIndiceProductoActualToppings(0);
      setProductosSeleccionados([]);
      setMostrandoToppingsSelector(false);
      setMostrandoProductos(false);
      toast.success(`${cantidadTotal} producto(s) agregado(s) con toppings`);
    }
  };

  // Modificar cantidad
  const cambiarCantidad = (index, delta) => {
    setItems(prev => {
      const next = [...prev];
      const item = next[index];
      const nuevaCantidad = item.cantidad + delta;
      
      if (nuevaCantidad <= 0) {
        return next.filter((_, i) => i !== index);
      }

      // Recalcular precio total con toppings
      const precioBase = item.precio_unitario;
      const precioConToppings = calcularPrecioConToppings(precioBase, item.toppings || []);
      item.cantidad = nuevaCantidad;
      item.precio_total = precioConToppings * nuevaCantidad;
      
      return next;
    });
  };

  // Eliminar item
  const eliminarItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Guardar pedido
  const handleGuardarPedido = async () => {
    if (!mesaSeleccionada) {
      toast.error('Selecciona una mesa');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    if (!organization?.id || !user?.id) {
      toast.error('Error: Faltan datos de organización o usuario');
      return;
    }

    try {
      const itemsData = items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        toppings: item.toppings || [],
        notas: null
      }));

      await crearPedido.mutateAsync({
        organizationId: organization.id,
        mesaId: mesaSeleccionada.id,
        items: itemsData,
        notas: notas.trim() || null,
        meseroId: user.id
      });

      // Limpiar formulario
      setMesaSeleccionada(null);
      setItems([]);
      setNotas('');
      setQuery('');
      setProductosSeleccionados([]);
      setMostrandoProductos(false);
      toast.success('Pedido guardado correctamente');
    } catch (error) {
      console.error('Error guardando pedido:', error);
      toast.error(error.message || 'Error al guardar el pedido');
    }
  };

  if (!acceso.canUse) {
    return (
      <div className="tomar-pedido">
        <div className="pedido-disabled">
          <Circle size={48} />
          <h3>Pedidos no disponibles</h3>
          <p>{acceso.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tomar-pedido">
      <div className="pedido-header">
        <div className="pedido-header-content">
          <Circle size={24} />
          <h1>Tomar Pedido</h1>
        </div>
      </div>

      <div className="pedido-container">
        {/* Panel izquierdo: Selección de mesa */}
        <div className="pedido-left">
          {/* Selección de mesa */}
          <div className="pedido-section">
            <h2>Seleccionar Mesa</h2>
            {mesaSeleccionada ? (
              <motion.div
                className="mesa-seleccionada"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="mesa-seleccionada-info">
                  <Circle size={20} fill={getMesaEstadoColor('ocupada')} />
                  <div>
                    <h3>{mesaSeleccionada.numero}</h3>
                    <p><Users size={14} /> {mesaSeleccionada.capacidad} personas</p>
                  </div>
                </div>
                <button
                  className="btn-cambiar-mesa"
                  onClick={() => {
                    setMesaSeleccionada(null);
                    setItems([]);
                  }}
                >
                  Cambiar
                </button>
              </motion.div>
            ) : (
              <div className="mesas-grid-selector">
                {mesasDisponibles.length === 0 ? (
                  <div className="no-mesas">
                    <p>No hay mesas disponibles</p>
                  </div>
                ) : (
                  mesasDisponibles.map((mesa) => (
                    <motion.button
                      key={mesa.id}
                      className="mesa-selector-card"
                      onClick={() => setMesaSeleccionada(mesa)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ borderColor: getMesaEstadoColor('disponible') }}
                    >
                      <Circle size={16} fill={getMesaEstadoColor('disponible')} />
                      <span className="mesa-numero">{mesa.numero}</span>
                      <span className="mesa-capacidad"><Users size={12} /> {mesa.capacidad}</span>
                    </motion.button>
                  ))
                )}
              </div>
            )}

            {/* Botón para agregar productos (solo si hay mesa seleccionada) */}
            {mesaSeleccionada && (
              <motion.div
                className="pedido-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  className="btn-agregar-productos"
                  onClick={() => setMostrandoProductos(true)}
                >
                  <Plus size={20} />
                  Agregar Productos
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Panel derecho: Items del pedido */}
        <div className="pedido-right">
          <div className="pedido-resumen">
            <h2>Pedido {mesaSeleccionada?.numero || ''}</h2>

            {items.length === 0 ? (
              <div className="pedido-vacio">
                <p>No hay items en el pedido</p>
                <small>Selecciona una mesa y agrega productos</small>
              </div>
            ) : (
              <>
                <div className="pedido-items">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.producto_id}-${JSON.stringify(item.toppings)}`}
                        className="pedido-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <div className="pedido-item-info">
                          <h4>{item.producto_nombre}</h4>
                          {item.toppings && item.toppings.length > 0 && (
                            <p className="pedido-item-toppings">
                              + {item.toppings.map(t => t.nombre).join(', ')}
                            </p>
                          )}
                          <p className="pedido-item-precio">{formatCOP(item.precio_total)}</p>
                        </div>
                        <div className="pedido-item-actions">
                          <button
                            className="btn-cantidad"
                            onClick={() => cambiarCantidad(index, -1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="cantidad">{item.cantidad}</span>
                          <button
                            className="btn-cantidad"
                            onClick={() => cambiarCantidad(index, 1)}
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            className="btn-eliminar"
                            onClick={() => eliminarItem(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="pedido-notas">
                  <label>Notas del pedido (opcional)</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: Sin cebolla, bien cocido..."
                    rows="3"
                  />
                </div>

                <div className="pedido-total">
                  <div className="pedido-total-line">
                    <span>Total</span>
                    <span className="pedido-total-amount">{formatCOP(total)}</span>
                  </div>
                </div>

                <button
                  className="btn-guardar-pedido"
                  onClick={handleGuardarPedido}
                  disabled={crearPedido.isLoading}
                >
                  <Save size={18} />
                  {crearPedido.isLoading ? 'Guardando...' : 'Guardar Pedido'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de selección de productos */}
      <AnimatePresence>
        {mostrandoProductos && mesaSeleccionada && (
          <motion.div
            className="productos-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMostrandoProductos(false)}
          >
            <motion.div
              className="productos-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="productos-modal-header">
                <div>
                  <h2>Agregar Productos</h2>
                  <p className="productos-modal-mesa">
                    <Circle size={14} fill={getMesaEstadoColor('ocupada')} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                    Mesa: {mesaSeleccionada.numero} • <Users size={14} style={{ display: 'inline-block', marginRight: '0.25rem' }} /> {mesaSeleccionada.capacidad} personas
                  </p>
                </div>
                <button
                  className="productos-modal-close"
                  onClick={() => {
                    setMostrandoProductos(false);
                    setProductosSeleccionados([]);
                    setQuery('');
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="productos-modal-search">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="productos-modal-content">
                {cargando ? (
                  <div className="productos-modal-loading">
                    <p>Cargando productos...</p>
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="productos-modal-empty">
                    <p>No se encontraron productos</p>
                    {query ? (
                      <small>Intenta con otro término de búsqueda</small>
                    ) : (
                      <small>No hay productos disponibles en el inventario</small>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="productos-modal-grid-compact">
                      {productosFiltrados.map((producto) => {
                        const estaSeleccionado = productosSeleccionados.some(p => p.id === producto.id);
                        return (
                          <motion.div
                            key={producto.id}
                            className={`producto-card-modal-compact ${estaSeleccionado ? 'seleccionado' : ''}`}
                            onClick={() => handleSeleccionarProducto(producto)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {estaSeleccionado && (
                              <div className="producto-seleccionado-badge">
                                <Check size={16} />
                              </div>
                            )}
                            {producto.imagen && (
                              <div className="producto-imagen-modal-compact">
                                <OptimizedProductImage
                                  imagePath={producto.imagen}
                                  alt={producto.nombre}
                                />
                              </div>
                            )}
                            <div className="producto-info-modal-compact">
                              <h4>{producto.nombre}</h4>
                              <p className="producto-precio-modal-compact">{formatCOP(producto.precio_venta)}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {productosSeleccionados.length > 0 && (
                      <div className="productos-modal-footer">
                        <div className="productos-seleccionados-count">
                          {productosSeleccionados.length} producto(s) seleccionado(s)
                        </div>
                        <button
                          className="btn-confirmar-seleccion"
                          onClick={handleConfirmarSeleccion}
                        >
                          <Check size={18} />
                          Confirmar Selección
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de toppings */}
      <AnimatePresence>
        {mostrandoConfirmacionToppings && (
          <motion.div
            className="confirmacion-toppings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setMostrandoConfirmacionToppings(false);
              // Si se cierra sin responder, mantener productos seleccionados
            }}
          >
            <motion.div
              className="confirmacion-toppings-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>¿Incluyen Toppings?</h3>
              <p>Seleccionaste {productosSeleccionados?.length || 0} producto(s). ¿Deseas agregar toppings adicionales?</p>
              <div className="confirmacion-toppings-buttons">
                <button
                  className="btn-toppings-si"
                  onClick={() => handleConfirmacionToppings(true)}
                >
                  Sí, agregar toppings
                </button>
                <button
                  className="btn-toppings-no"
                  onClick={() => handleConfirmacionToppings(false)}
                >
                  No, sin toppings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selector de toppings */}
      {mostrandoToppingsSelector && productoParaToppings && (
        <ToppingsSelector
          open={mostrandoToppingsSelector}
          onClose={() => {
            setMostrandoToppingsSelector(false);
            setProductoParaToppings(null);
            setProductosPendientesToppings([]);
            setIndiceProductoActualToppings(0);
            setProductosSeleccionados([]);
            setMostrandoProductos(false);
          }}
          producto={productoParaToppings}
          precioBase={productoParaToppings.precio_venta}
          onConfirm={(toppings, precioTotal) => {
            handleToppingsConfirm(toppings, precioTotal);
          }}
          organizationId={organization?.id}
          tipo={productoParaToppings.tipo === 'servicio' ? 'servicio' : 'comida'}
          titulo={`Toppings para: ${productoParaToppings.nombre} (${indiceProductoActualToppings + 1} de ${productosPendientesToppings.length})`}
        />
      )}
    </div>
  );
};

export default TomarPedido;

