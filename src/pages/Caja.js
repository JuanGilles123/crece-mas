import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import OptimizedProductImage from '../components/OptimizedProductImage';
import ReciboVenta from '../components/ReciboVenta';
import ConfirmacionVenta from '../components/ConfirmacionVenta';
import { ShoppingCart, Trash2, Plus, Minus, Search, CheckCircle, X, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import './Caja.css';

// Componente SafeImg removido ya que usamos OptimizedProductImage

// Utilidad: formato COP
function formatCOP(value) {
  try {
    return new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      maximumFractionDigits: 0 
    }).format(value);
  } catch {
    return "$" + value.toLocaleString("es-CO");
  }
}

// Total carrito
function calcTotal(cart) {
  return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export default function Caja() {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState("Efectivo");
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [mostrandoMetodosPago, setMostrandoMetodosPago] = useState(false);
  const [mostrandoPagoEfectivo, setMostrandoPagoEfectivo] = useState(false);
  const [montoEntregado, setMontoEntregado] = useState('');
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false);
  const [confirmacionCargando, setConfirmacionCargando] = useState(false);
  const [confirmacionExito, setConfirmacionExito] = useState(false);
  const [datosVentaConfirmada, setDatosVentaConfirmada] = useState(null);
  const [incluirIva, setIncluirIva] = useState(false);
  const [porcentajeIva, setPorcentajeIva] = useState(19);

  // Cargar productos del usuario
  useEffect(() => {
    const fetchProductos = async () => {
      if (!user || !userProfile?.organization_id) return;
      setCargando(true);
      
      console.log('🔍 Cargando productos para Caja, organization_id:', userProfile.organization_id);
      
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false })
        .limit(1000);
        
      if (!error) {
        console.log('✅ Productos cargados en Caja:', data?.length || 0);
        setProductos(data || []);
      }
      setCargando(false);
    };
    fetchProductos();
  }, [user, userProfile?.organization_id]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [query, productos]);

  const subtotal = useMemo(() => calcTotal(cart.map((c) => ({ id: c.id, price: c.precio_venta, qty: c.qty }))), [cart]);
  const impuestos = useMemo(() => incluirIva ? subtotal * (porcentajeIva / 100) : 0, [subtotal, incluirIva, porcentajeIva]);
  const total = useMemo(() => subtotal + impuestos, [subtotal, impuestos]);

  function addToCart(producto) {
    // Verificar stock disponible
    const stockDisponible = producto.stock;
    const itemEnCarrito = cart.find(item => item.id === producto.id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.qty : 0;
    
    if (cantidadEnCarrito >= stockDisponible) {
      toast.error(`No hay suficiente stock. Disponible: ${stockDisponible}`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === producto.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { 
        id: producto.id, 
        nombre: producto.nombre, 
        precio_venta: producto.precio_venta, 
        qty: 1 
      }];
    });
  }

  const inc = (id) => {
    const producto = productos.find(p => p.id === id);
    const itemEnCarrito = cart.find(item => item.id === id);
    
    if (itemEnCarrito && itemEnCarrito.qty >= producto.stock) {
      toast.error(`No hay suficiente stock. Disponible: ${producto.stock}`);
      return;
    }
    
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  };
  
  const dec = (id) =>
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)).filter((i) => i.qty > 0));
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const handleNuevaVenta = () => {
    setVentaCompletada(null);
    setMostrandoMetodosPago(false);
  };

  const handleContinuar = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setMostrandoMetodosPago(true);
  };

  const handleSeleccionarMetodoPago = (metodo) => {
    setMethod(metodo);
    setMostrandoMetodosPago(false);
    
    if (metodo === 'Efectivo') {
      // Mostrar modal de pago en efectivo
      setMontoEntregado('');
      setMostrandoPagoEfectivo(true);
    } else {
      // Para otros métodos, proceder directamente
      confirmSale();
    }
  };

  const handleValorPredefinido = useCallback((valor) => {
    setMontoEntregado(prev => {
      const montoActual = parseFloat(prev.replace(/[^\d]/g, '')) || 0;
      const nuevoMonto = montoActual + valor;
      return nuevoMonto.toLocaleString('es-CO');
    });
  }, []);

  const handleConfirmarPagoEfectivo = () => {
    const monto = parseFloat(montoEntregado.replace(/[^\d]/g, ''));
    if (isNaN(monto) || monto < total) {
      toast.error('El monto debe ser mayor o igual al total de la venta.');
      return;
    }
    setMostrandoPagoEfectivo(false);
    confirmSale();
  };

  const handleCancelarPagoEfectivo = () => {
    setMostrandoPagoEfectivo(false);
    setMontoEntregado('');
  };

  const handleCerrarConfirmacion = () => {
    setMostrandoConfirmacion(false);
    setConfirmacionCargando(false);
    setConfirmacionExito(false);
    setDatosVentaConfirmada(null);
  };

  // Componente para pago en efectivo
  const PagoEfectivo = () => {
    const monto = parseFloat(montoEntregado.replace(/[^\d]/g, '')) || 0;
    const cambio = monto - total;
    const valoresComunes = [1000, 5000, 10000, 20000, 50000, 100000];

    return (
      <div className="pago-efectivo-overlay">
        <div className="pago-efectivo-container">
          <div className="pago-efectivo-header">
            <h3>Pago en Efectivo</h3>
            <p>Total a pagar: {formatCOP(total)}</p>
          </div>
          
          <div className="pago-efectivo-content">
            <div className="pago-efectivo-input-section">
              <label className="pago-efectivo-label">Monto entregado por el cliente</label>
              <input
                type="text"
                value={montoEntregado}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir solo números y comas/puntos para formato
                  const cleanValue = value.replace(/[^\d,.]/g, '');
                  // Solo actualizar si el valor es diferente para evitar re-renders innecesarios
                  if (cleanValue !== montoEntregado) {
                    setMontoEntregado(cleanValue);
                  }
                }}
                className="pago-efectivo-input"
                placeholder="Ingresa el monto"
                autoFocus
                style={{ 
                  transition: 'none',
                  willChange: 'auto',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)'
                }}
              />
            </div>

            <div className="pago-efectivo-valores-comunes">
              <div className="pago-efectivo-subtitle-container">
                <p className="pago-efectivo-subtitle">Valores comunes:</p>
                <button 
                  className="pago-efectivo-limpiar-btn"
                  onClick={() => setMontoEntregado('')}
                  title="Limpiar monto"
                >
                  Limpiar
                </button>
              </div>
              <div className="pago-efectivo-botones">
                {valoresComunes.map((valor, index) => (
                  <button
                    key={index}
                    className="pago-efectivo-btn-valor"
                    onClick={() => handleValorPredefinido(valor)}
                  >
                    {formatCOP(valor)}
                  </button>
                ))}
              </div>
            </div>

            {monto > 0 && (
              <div className="pago-efectivo-cambio">
                <div className="pago-efectivo-cambio-item">
                  <span>Monto entregado:</span>
                  <span>{formatCOP(monto)}</span>
                </div>
                <div className="pago-efectivo-cambio-item">
                  <span>Total a pagar:</span>
                  <span>{formatCOP(total)}</span>
                </div>
                <div className={`pago-efectivo-cambio-item pago-efectivo-cambio-total ${cambio < 0 ? 'negativo' : 'positivo'}`}>
                  <span>Cambio:</span>
                  <span>
                    {cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="pago-efectivo-actions">
            <button 
              className="pago-efectivo-btn pago-efectivo-cancelar"
              onClick={handleCancelarPagoEfectivo}
            >
              Cancelar
            </button>
            <button 
              className="pago-efectivo-btn pago-efectivo-confirmar"
              onClick={handleConfirmarPagoEfectivo}
              disabled={monto < total}
            >
              Confirmar Pago
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente para métodos de pago
  const MetodosPago = () => (
    <div className="metodos-pago-overlay">
      <div className="metodos-pago-container">
        <div className="metodos-pago-header">
          <h3>Selecciona el método de pago</h3>
          <p>Total a pagar: {formatCOP(total)}</p>
        </div>
        
        <div className="metodos-pago-grid">
          <button 
            className="metodo-pago-btn"
            onClick={() => handleSeleccionarMetodoPago('Efectivo')}
          >
            <Banknote className="metodo-pago-icon" />
            <span className="metodo-pago-label">Efectivo</span>
            <span className="metodo-pago-desc">Pago en efectivo</span>
          </button>
          
          <button 
            className="metodo-pago-btn"
            onClick={() => handleSeleccionarMetodoPago('Transferencia')}
          >
            <CreditCard className="metodo-pago-icon" />
            <span className="metodo-pago-label">Transferencia</span>
            <span className="metodo-pago-desc">Transferencia bancaria</span>
          </button>
          
          <button 
            className="metodo-pago-btn"
            onClick={() => handleSeleccionarMetodoPago('Nequi')}
          >
            <Smartphone className="metodo-pago-icon" />
            <span className="metodo-pago-label">Nequi</span>
            <span className="metodo-pago-desc">Pago móvil</span>
          </button>
          
          <button 
            className="metodo-pago-btn"
            onClick={() => handleSeleccionarMetodoPago('Mixto')}
          >
            <Wallet className="metodo-pago-icon" />
            <span className="metodo-pago-label">Mixto</span>
            <span className="metodo-pago-desc">Varios métodos</span>
          </button>
        </div>
        
        <button 
          className="metodos-pago-cancelar"
          onClick={() => setMostrandoMetodosPago(false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  async function confirmSale() {
    if (!user) {
      console.error('Usuario no autenticado');
      toast.error('Error: Usuario no autenticado');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Mostrar modal de confirmación con carga
    setMostrandoConfirmacion(true);
    setConfirmacionCargando(true);
    setConfirmacionExito(false);
    // NO establecer datosVentaConfirmada como null aquí
    
    setProcesandoVenta(true);
    console.log('Iniciando confirmación de venta...', { cart, total, method });
    
    // Validar que no se exceda el stock
    for (const item of cart) {
      const producto = productos.find(p => p.id === item.id);
      if (!producto) {
        console.error('Producto no encontrado:', item.id);
        toast.error(`Error: Producto ${item.nombre} no encontrado`);
        return;
      }
      
      if (item.qty > producto.stock) {
        toast.error(`No hay suficiente stock para ${item.nombre}. Disponible: ${producto.stock}`);
        setProcesandoVenta(false);
        return;
      }
      
      if (producto.stock < item.qty) {
        toast.error(`No hay suficiente stock para ${item.nombre}. Disponible: ${producto.stock}`);
        setProcesandoVenta(false);
        return;
      }
    }
    
    // Si es pago en efectivo, usar el monto del modal
    let montoPagoCliente = total;
    if (method === "Efectivo") {
      const montoNumero = parseFloat(montoEntregado.replace(/[^\d]/g, ''));
      if (isNaN(montoNumero) || montoNumero < total) {
        toast.error('El monto debe ser mayor o igual al total de la venta.');
        setProcesandoVenta(false);
        return;
      }
      montoPagoCliente = montoNumero;
    }
    
    try {
      console.log('Guardando venta en base de datos...');
      
      // Guardar la venta en la base de datos con organization_id
      const ventaData = {
        user_id: user.id,
        organization_id: userProfile.organization_id,
        total: total,
        metodo_pago: method,
        items: cart,
        fecha: new Date().toISOString(),
        pago_cliente: montoPagoCliente
      };
      
      console.log('Datos de venta a insertar:', ventaData);
      
      const { data: ventaResult, error: ventaError } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select();
      
      if (ventaError) {
        console.error('Error guardando venta:', ventaError);
        toast.error(`Error al guardar la venta: ${ventaError.message}`);
        setProcesandoVenta(false);
        return;
      }
      
      if (!ventaResult || ventaResult.length === 0) {
        console.error('No se retornó data de la venta');
        toast.error('Error: No se pudo obtener el ID de la venta');
        setProcesandoVenta(false);
        return;
      }
      
      console.log("Venta guardada exitosamente:", ventaResult);
      
      // Actualizar stock de productos
      console.log('Actualizando stock de productos...');
      for (const item of cart) {
        const producto = productos.find(p => p.id === item.id);
        const nuevoStock = producto.stock - item.qty;
        
        console.log(`Actualizando stock de ${item.nombre}: ${producto.stock} -> ${nuevoStock}`);
        
        const { error: stockError } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.id);
        
        if (stockError) {
          console.error('Error actualizando stock:', stockError);
          toast.error(`Error al actualizar el stock de ${item.nombre}. La venta se guardó pero el stock no se actualizó.`);
          // No retornamos aquí para que la venta se complete
        }
      }
      
      // Crear objeto de venta para el recibo
      const ventaRecibo = {
        id: ventaResult[0].id,
        date: new Date().toLocaleDateString("es-CO"),
        time: new Date().toLocaleTimeString("es-CO"),
        cashier: user.user_metadata?.full_name || user.email || "Usuario",
        register: "Caja Principal",
        items: cart,
        metodo_pago: method,
        pagoCliente: montoPagoCliente,
        total: total,
        cantidadProductos: cart.length
      };
      
      console.log('Mostrando recibo:', ventaRecibo);
      
      // Establecer datos y mostrar modal de éxito inmediatamente
      setDatosVentaConfirmada(ventaRecibo);
      setConfirmacionCargando(false);
      setConfirmacionExito(true);
      
      // Simular tiempo de procesamiento para la animación
      setTimeout(() => {
        
        // Toast de éxito
        toast.success(`¡Venta completada! Total: ${formatCOP(total)}`);
        
        // Después de mostrar éxito, limpiar carrito
        setTimeout(() => {
          setVentaCompletada(ventaRecibo);
          setCart([]);
          setShowCartMobile(false);
        }, 2000);
      }, 1500);
      
      // Invalidar cache de react-query para actualizar automáticamente
      console.log('Invalidando cache de productos y ventas...');
      queryClient.invalidateQueries(['productos', userProfile.organization_id]);
      queryClient.invalidateQueries(['productos-paginados', userProfile.organization_id]);
      queryClient.invalidateQueries(['ventas', userProfile.organization_id]);
      console.log('✅ Cache invalidado - Inventario se actualizará automáticamente');
      
    } catch (error) {
      console.error('Error confirmando venta:', error);
      toast.error(`Error al procesar la venta: ${error.message}`);
      setMostrandoConfirmacion(false);
      setConfirmacionCargando(false);
      setConfirmacionExito(false);
    } finally {
      setProcesandoVenta(false);
    }
  }

  if (cargando) {
    return (
      <div className="caja-loading">
        <div className="caja-skeleton">
          <div className="caja-skeleton-search"></div>
          <div className="caja-skeleton-products">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="caja-skeleton-product"></div>
            ))}
      </div>
    </div>
  </div>
);
  }

  return (
    <div className="caja-container">
      {/* Panel de productos */}
      <div className="caja-products-panel">
        <div className="caja-search-container">
          <Search className="caja-search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar producto..."
            className="caja-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="caja-products-list">
          {filteredProducts.map((producto, index) => (
            <motion.div 
              key={producto.id} 
              className="caja-product-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(producto)}
            >
              <div className="caja-product-content">
                <OptimizedProductImage 
                  imagePath={producto.imagen} 
                  alt={producto.nombre} 
                  className="caja-product-image"
                />
                <div className="caja-product-info">
                  <p className="caja-product-name">{producto.nombre}</p>
                  <p className="caja-product-stock">Stock: {producto.stock}</p>
                </div>
                <span className="caja-product-price">{formatCOP(producto.precio_venta)}</span>
              </div>
            </motion.div>
          ))}

          {filteredProducts.length === 0 && (
            <p className="caja-no-products">No se encontraron productos para "{query}"</p>
          )}
        </div>
      </div>

      {/* Panel carrito (desktop) */}
      <div className="caja-cart-panel">
        <div className="caja-cart-header">
          <h2 className="caja-cart-title">
            <ShoppingCart className="caja-cart-icon" /> Carrito de Venta
          </h2>
          {cart.length > 0 && (
            <button 
              className="caja-clear-btn"
              onClick={() => setCart([])}
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Control de IVA */}
        {cart.length > 0 && (
          <div className="caja-iva-controls">
            <div className="caja-iva-toggle">
              <label className="caja-iva-label">
                <input
                  type="checkbox"
                  checked={incluirIva}
                  onChange={(e) => setIncluirIva(e.target.checked)}
                  className="caja-iva-checkbox"
                />
                <span className="caja-iva-text">Incluir IVA</span>
              </label>
            </div>
            {incluirIva && (
              <div className="caja-iva-percentage">
                <label className="caja-iva-percentage-label">Porcentaje:</label>
                <select
                  value={porcentajeIva}
                  onChange={(e) => setPorcentajeIva(Number(e.target.value))}
                  className="caja-iva-select"
                >
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={19}>19%</option>
                  <option value={21}>21%</option>
                </select>
              </div>
            )}
          </div>
        )}

        <div className="caja-cart-items">
          {cart.length === 0 ? (
            <p className="caja-empty-cart">Aún no has agregado productos.</p>
          ) : (
            <ul className="caja-cart-list">
              {cart.map((item) => (
                <li key={item.id} className="caja-cart-item">
                  <div className="caja-cart-item-info">
                    <p className="caja-cart-item-name">{item.nombre}</p>
                    <p className="caja-cart-item-price">{formatCOP(item.precio_venta)} c/u</p>
                  </div>
                  <div className="caja-cart-item-controls">
                    <button 
                      className="caja-qty-btn"
                      onClick={() => dec(item.id)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="caja-qty-display">{item.qty}</span>
                    <button 
                      className="caja-qty-btn"
                      onClick={() => inc(item.id)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="caja-cart-item-total">
                    {formatCOP(item.qty * item.precio_venta)}
                  </div>
                  <button 
                    className="caja-remove-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="caja-cart-footer">
          <div className="caja-total-breakdown">
            <div className="caja-total-row">
              <span className="caja-total-label">Subtotal</span>
              <span className="caja-total-amount">{formatCOP(subtotal)}</span>
            </div>
            {incluirIva && (
              <div className="caja-total-row">
                <span className="caja-total-label">IVA ({porcentajeIva}%)</span>
                <span className="caja-total-amount">{formatCOP(impuestos)}</span>
              </div>
            )}
            <div className="caja-total-row caja-total-final">
              <span className="caja-total-label">Total</span>
              <span className="caja-total-amount">{formatCOP(total)}</span>
            </div>
          </div>
          
          
            <motion.button 
              className="caja-confirm-btn"
              onClick={handleContinuar} 
              disabled={cart.length === 0 || procesandoVenta}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle className="caja-confirm-icon" /> 
              {procesandoVenta ? 'Procesando...' : 'Continuar'}
            </motion.button>
        </div>
      </div>

      {/* Botón fijo en móvil para abrir carrito */}
      <div className="caja-mobile-footer">
        <div className="caja-mobile-total">
          <p className="caja-mobile-total-label">Total</p>
          <p className="caja-mobile-total-amount">{formatCOP(total)}</p>
        </div>
        <button 
          className="caja-mobile-cart-btn"
          onClick={() => setShowCartMobile(true)}
        >
          <ShoppingCart className="caja-mobile-cart-icon" /> 
          Ver carrito ({cart.reduce((n, i) => n + i.qty, 0)})
        </button>
        <button 
          className="caja-mobile-pay-btn"
          onClick={() => setShowCartMobile(true)} 
          disabled={cart.length === 0}
        >
          Cobrar
        </button>
      </div>

      {/* Overlay del carrito en móvil */}
      {showCartMobile && (
        <div className="caja-mobile-overlay">
          <div className="caja-mobile-cart-header">
            <h3 className="caja-mobile-cart-title">
              <ShoppingCart className="caja-mobile-cart-icon" /> Carrito
            </h3>
            <button 
              className="caja-mobile-close-btn"
              onClick={() => setShowCartMobile(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="caja-mobile-cart-content">
            {cart.length === 0 ? (
              <p className="caja-mobile-empty-cart">Aún no has agregado productos.</p>
            ) : (
              <ul className="caja-mobile-cart-list">
                {cart.map((item) => (
                  <li key={item.id} className="caja-mobile-cart-item">
                    <div className="caja-mobile-cart-item-info">
                      <p className="caja-mobile-cart-item-name">{item.nombre}</p>
                      <p className="caja-mobile-cart-item-price">{formatCOP(item.precio_venta)} c/u</p>
                    </div>
                    <div className="caja-mobile-cart-item-controls">
                      <button 
                        className="caja-mobile-qty-btn"
                        onClick={() => dec(item.id)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="caja-mobile-qty-display">{item.qty}</span>
                      <button 
                        className="caja-mobile-qty-btn"
                        onClick={() => inc(item.id)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="caja-mobile-cart-item-total">
                      {formatCOP(item.qty * item.precio_venta)}
                    </div>
                    <button 
                      className="caja-mobile-remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="caja-mobile-cart-footer">
            <div className="caja-mobile-total-container">
              <span className="caja-mobile-total-label">Total</span>
              <span className="caja-mobile-total-amount">{formatCOP(total)}</span>
            </div>
            
            
            <button 
              className="caja-mobile-confirm-btn"
              onClick={handleContinuar} 
              disabled={cart.length === 0 || procesandoVenta}
            >
              <CheckCircle className="caja-mobile-confirm-icon" /> 
              {procesandoVenta ? 'Procesando...' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {/* Métodos de pago */}
      {mostrandoMetodosPago && <MetodosPago />}

      {/* Pago en efectivo */}
      {mostrandoPagoEfectivo && <PagoEfectivo />}

      {/* Recibo de venta */}
      {ventaCompletada && (
        <ReciboVenta 
          venta={ventaCompletada} 
          onNuevaVenta={handleNuevaVenta}
        />
      )}

      {/* Modal de confirmación de venta */}
      <ConfirmacionVenta
        isVisible={mostrandoConfirmacion}
        isLoading={confirmacionCargando}
        isSuccess={confirmacionExito}
        onClose={handleCerrarConfirmacion}
        ventaData={datosVentaConfirmada}
      />
    </div>
  );
}