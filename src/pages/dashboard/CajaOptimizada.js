import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import ReciboVenta from '../../components/business/ReciboVenta';
import ConfirmacionVenta from '../../components/business/ConfirmacionVenta';
import SearchInput from '../../components/ui/SearchInput';
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, X, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import { useProductosBusqueda } from '../../hooks/useProductosPaginados';
import { useVentas } from '../../hooks/useVentas';
import toast from 'react-hot-toast';
import './Caja.css';

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

export default function CajaOptimizada() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState("Efectivo");
  const [showCartMobile, setShowCartMobile] = useState(false);
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

  // Hook optimizado para búsqueda de productos
  const { 
    data: productos = [], 
    isLoading: cargandoProductos,
    error: errorProductos 
  } = useProductosBusqueda(user?.id, searchQuery, {
    limit: 50 // Limitar a 50 resultados para mejor rendimiento
  });

  // Hook para ventas
  const { useCrearVenta } = useVentas(user?.id);
  const crearVentaMutation = useCrearVenta();

  const subtotal = useMemo(() => calcTotal(cart.map((c) => ({ id: c.id, price: c.precio_venta, qty: c.qty }))), [cart]);
  const impuestos = useMemo(() => incluirIva ? subtotal * (porcentajeIva / 100) : 0, [subtotal, incluirIva, porcentajeIva]);
  const total = useMemo(() => subtotal + impuestos, [subtotal, impuestos]);

  const addToCart = useCallback((producto) => {
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
      return [...prev, { ...producto, qty: 1 }];
    });
  }, [cart]);

  const removeFromCart = useCallback((productoId) => {
    setCart((prev) => prev.filter((item) => item.id !== productoId));
  }, []);

  const updateQuantity = useCallback((productoId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productoId);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === productoId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: newQty };
        return next;
      }
      return prev;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleVenta = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setProcesandoVenta(true);
    try {
      const ventaData = {
        user_id: user.id,
        productos: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.qty,
          precio_unitario: item.precio_venta,
          subtotal: item.qty * item.precio_venta
        })),
        subtotal,
        impuestos,
        total,
        metodo_pago: method,
        incluir_iva: incluirIva,
        porcentaje_iva: porcentajeIva,
        monto_entregado: method === "Efectivo" ? parseFloat(montoEntregado) : total,
        cambio: method === "Efectivo" ? parseFloat(montoEntregado) - total : 0
      };

      await crearVentaMutation.mutateAsync(ventaData);
      
      setVentaCompletada({
        cart,
        total,
        method,
        cambio: method === "Efectivo" ? parseFloat(montoEntregado) - total : 0
      });
      
      clearCart();
      setSearchQuery("");
      
    } catch (error) {
      console.error('Error al procesar venta:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setProcesandoVenta(false);
    }
  }, [cart, subtotal, impuestos, total, method, incluirIva, porcentajeIva, montoEntregado, user?.id, crearVentaMutation, clearCart]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Iniciando sesión...</p>
      </div>
    );
  }

  return (
    <div className="caja-container">
      {/* Header */}
      <div className="caja-header">
        <h1 className="caja-title">Caja</h1>
        <div className="caja-cart-mobile">
          <button
            onClick={() => setShowCartMobile(!showCartMobile)}
            className="caja-cart-button"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="caja-cart-badge">{cart.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="caja-content">
        {/* Panel de Productos */}
        <div className="caja-products-panel">
          {/* Búsqueda */}
          <div className="caja-search-container">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar productos por nombre, código o descripción..."
              loading={cargandoProductos}
              onClear={handleSearchClear}
              className="w-full"
            />
          </div>

          {/* Lista de Productos */}
          <div className="caja-products-grid">
            <AnimatePresence mode="wait">
              {cargandoProductos ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : errorProductos ? (
                <div className="col-span-full text-center py-12 text-red-500">
                  <p>Error al cargar productos</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Reintentar
                  </button>
                </div>
              ) : productos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  {searchQuery ? (
                    <div>
                      <p>No se encontraron productos para "{searchQuery}"</p>
                      <p className="text-sm mt-2">Intenta con otros términos de búsqueda</p>
                    </div>
                  ) : (
                    <div>
                      <p>Escribe algo para buscar productos</p>
                      <p className="text-sm mt-2">Busca por nombre, código o descripción</p>
                    </div>
                  )}
                </div>
              ) : (
                productos.map((producto) => (
                  <motion.div
                    key={producto.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    className="caja-product-card"
                    onClick={() => addToCart(producto)}
                  >
                    <div className="caja-product-image">
                      <OptimizedProductImage
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="caja-product-info">
                      <h3 className="caja-product-name">{producto.nombre}</h3>
                      <p className="caja-product-price">{formatCOP(producto.precio_venta)}</p>
                      <p className="caja-product-stock">Stock: {producto.stock}</p>
                    </div>
                    <div className="caja-product-add">
                      <Plus className="w-5 h-5" />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Panel del Carrito */}
        <div className={`caja-cart-panel ${showCartMobile ? 'caja-cart-panel-mobile' : ''}`}>
          <div className="caja-cart-header">
            <h2 className="caja-cart-title">Carrito</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="caja-cart-clear"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>

          <div className="caja-cart-items">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="caja-cart-empty">
                  <ShoppingCart className="w-12 h-12 text-gray-300" />
                  <p>Carrito vacío</p>
                  <p className="text-sm text-gray-500">Agrega productos para comenzar</p>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="caja-cart-item"
                  >
                    <div className="caja-cart-item-image">
                      <OptimizedProductImage
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="caja-cart-item-info">
                      <h4 className="caja-cart-item-name">{item.nombre}</h4>
                      <p className="caja-cart-item-price">{formatCOP(item.precio_venta)}</p>
                    </div>
                    <div className="caja-cart-item-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                        className="caja-cart-item-button"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="caja-cart-item-quantity">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        className="caja-cart-item-button"
                        disabled={item.qty >= item.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="caja-cart-item-remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Resumen de la venta */}
          {cart.length > 0 && (
            <div className="caja-cart-summary">
              <div className="caja-cart-totals">
                <div className="caja-cart-total-row">
                  <span>Subtotal:</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                {incluirIva && (
                  <div className="caja-cart-total-row">
                    <span>IVA ({porcentajeIva}%):</span>
                    <span>{formatCOP(impuestos)}</span>
                  </div>
                )}
                <div className="caja-cart-total-row caja-cart-total-final">
                  <span>Total:</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>

              {/* Configuración de IVA */}
              <div className="caja-iva-config">
                <label className="caja-iva-checkbox">
                  <input
                    type="checkbox"
                    checked={incluirIva}
                    onChange={(e) => setIncluirIva(e.target.checked)}
                  />
                  <span>Incluir IVA</span>
                </label>
                {incluirIva && (
                  <div className="caja-iva-percentage">
                    <label>Porcentaje IVA:</label>
                    <input
                      type="number"
                      value={porcentajeIva}
                      onChange={(e) => setPorcentajeIva(Number(e.target.value))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="caja-iva-input"
                    />
                  </div>
                )}
              </div>

              {/* Botón de venta */}
              <button
                onClick={() => setMostrandoMetodosPago(true)}
                className="caja-sell-button"
                disabled={procesandoVenta}
              >
                {procesandoVenta ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Procesar Venta
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modales de pago y confirmación */}
      <AnimatePresence>
        {mostrandoMetodosPago && (
          <div className="caja-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="caja-modal"
            >
              <div className="caja-modal-header">
                <h3>Método de Pago</h3>
                <button
                  onClick={() => setMostrandoMetodosPago(false)}
                  className="caja-modal-close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="caja-modal-content">
                <div className="caja-payment-methods">
                  <button
                    onClick={() => {
                      setMethod("Efectivo");
                      setMostrandoPagoEfectivo(true);
                      setMostrandoMetodosPago(false);
                    }}
                    className="caja-payment-method"
                  >
                    <Banknote className="w-6 h-6" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    onClick={() => {
                      setMethod("Tarjeta");
                      handleVenta();
                      setMostrandoMetodosPago(false);
                    }}
                    className="caja-payment-method"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    onClick={() => {
                      setMethod("Transferencia");
                      handleVenta();
                      setMostrandoMetodosPago(false);
                    }}
                    className="caja-payment-method"
                  >
                    <Smartphone className="w-6 h-6" />
                    <span>Transferencia</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {mostrandoPagoEfectivo && (
          <div className="caja-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="caja-modal"
            >
              <div className="caja-modal-header">
                <h3>Pago en Efectivo</h3>
                <button
                  onClick={() => setMostrandoPagoEfectivo(false)}
                  className="caja-modal-close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="caja-modal-content">
                <div className="caja-cash-payment">
                  <div className="caja-cash-total">
                    <span>Total a pagar:</span>
                    <span className="caja-cash-amount">{formatCOP(total)}</span>
                  </div>
                  <div className="caja-cash-input">
                    <label>Monto entregado:</label>
                    <input
                      type="number"
                      value={montoEntregado}
                      onChange={(e) => setMontoEntregado(e.target.value)}
                      placeholder="0"
                      className="caja-cash-input-field"
                    />
                  </div>
                  {montoEntregado && parseFloat(montoEntregado) >= total && (
                    <div className="caja-cash-change">
                      <span>Cambio:</span>
                      <span className="caja-cash-change-amount">
                        {formatCOP(parseFloat(montoEntregado) - total)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (parseFloat(montoEntregado) >= total) {
                        handleVenta();
                        setMostrandoPagoEfectivo(false);
                      } else {
                        toast.error("El monto entregado debe ser mayor o igual al total");
                      }
                    }}
                    className="caja-cash-confirm"
                    disabled={!montoEntregado || parseFloat(montoEntregado) < total}
                  >
                    Confirmar Pago
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Componentes de recibo y confirmación */}
      {ventaCompletada && (
        <ReciboVenta
          venta={ventaCompletada}
          onClose={() => setVentaCompletada(null)}
        />
      )}
    </div>
  );
}
