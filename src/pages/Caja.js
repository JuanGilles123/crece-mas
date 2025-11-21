import React, { useMemo, useState, useEffect, useCallback, Suspense, lazy } from "react";
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import useCurrencyInput from '../hooks/useCurrencyInputOptimized';
import OptimizedProductImage from '../components/OptimizedProductImage';
import { ShoppingCart, Trash2, Plus, Minus, Search, CheckCircle, X, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import ToppingsSelector from '../components/ToppingsSelector';
import { canUseToppings } from '../utils/toppingsUtils';
import { useSubscription } from '../hooks/useSubscription';
import toast from 'react-hot-toast';
import './Caja.css';

// Lazy loading de componentes pesados (renderizado procedural)
const ReciboVenta = lazy(() => import('../components/ReciboVenta'));
const ConfirmacionVenta = lazy(() => import('../components/ConfirmacionVenta'));

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
  return cart.reduce((sum, item) => {
    const precioItem = item.precio_total || item.precio_venta || item.price || 0;
    return sum + item.qty * precioItem;
  }, 0);
}

export default function Caja() {
  const { user, userProfile, organization } = useAuth();
  const { canPerformAction, hasFeature } = useSubscription();
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
  const montoEntregadoInput = useCurrencyInput();
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false);
  const [confirmacionCargando, setConfirmacionCargando] = useState(false);
  const [confirmacionExito, setConfirmacionExito] = useState(false);
  const [datosVentaConfirmada, setDatosVentaConfirmada] = useState(null);
  const [incluirIva, setIncluirIva] = useState(false);
  const [porcentajeIva, setPorcentajeIva] = useState(19);
  const [productosVisibles, setProductosVisibles] = useState(20); // Renderizado procedural

  // Estados para toppings
  const [mostrandoToppingsSelector, setMostrandoToppingsSelector] = useState(false);
  const [productoParaToppings, setProductoParaToppings] = useState(null);

  // Estados para pago mixto
  const [mostrandoPagoMixto, setMostrandoPagoMixto] = useState(false);
  const [metodo1, setMetodo1] = useState('Efectivo');
  const [metodo2, setMetodo2] = useState('Transferencia');
  const montoMetodo1Input = useCurrencyInput();
  const montoMetodo2Input = useCurrencyInput();

  // Cargar productos del usuario con renderizado procedural
  useEffect(() => {
    const fetchProductos = async () => {
      if (!user || !userProfile?.organization_id) return;
      setCargando(true);

      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false });

      if (!error) {
        setProductos(data || []);
      }
      setCargando(false);
    };
    fetchProductos();
  }, [user, userProfile?.organization_id]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;

    // Filtrar productos
    const filtered = productos.filter((p) => {
      const nombre = p.nombre.toLowerCase();
      const codigoBarra = p.codigo_barra ? p.codigo_barra.toLowerCase() : '';

      // Verificar coincidencia exacta
      const esCoincidenciaExacta = nombre === q || codigoBarra === q;

      if (esCoincidenciaExacta) return true;

      // Verificar si empieza con el término (más relevante)
      const coincideDesdeInicio = nombre.startsWith(q) || codigoBarra.startsWith(q);

      if (coincideDesdeInicio) return true;

      // Como último recurso, buscar en cualquier parte
      return nombre.includes(q) || codigoBarra.includes(q);
    });

    // Ordenar resultados por relevancia
    return filtered.sort((a, b) => {
      const nombreA = a.nombre.toLowerCase();
      const nombreB = b.nombre.toLowerCase();

      // Coincidencia exacta tiene máxima prioridad
      const exactoA = nombreA === q ? 0 : 1;
      const exactoB = nombreB === q ? 0 : 1;
      if (exactoA !== exactoB) return exactoA - exactoB;

      // Luego, los que empiezan con el término
      const inicioA = nombreA.startsWith(q) ? 0 : 1;
      const inicioB = nombreB.startsWith(q) ? 0 : 1;
      if (inicioA !== inicioB) return inicioA - inicioB;

      // Por último, orden alfabético
      return nombreA.localeCompare(nombreB);
    });
  }, [query, productos]);

  // Cargar más productos al hacer scroll (renderizado procedural)
  useEffect(() => {
    const handleScroll = () => {
      const productGrid = document.querySelector('.caja-product-grid');
      if (!productGrid) return;

      const scrollTop = productGrid.scrollTop;
      const scrollHeight = productGrid.scrollHeight;
      const clientHeight = productGrid.clientHeight;

      // Si llegó al 80% del scroll, cargar más productos
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        setProductosVisibles(prev => Math.min(prev + 20, filteredProducts.length));
      }
    };

    const productGrid = document.querySelector('.caja-product-grid');
    if (productGrid) {
      productGrid.addEventListener('scroll', handleScroll);
      return () => productGrid.removeEventListener('scroll', handleScroll);
    }
  }, [filteredProducts.length]);

  const subtotal = useMemo(() => calcTotal(cart), [cart]);
  const impuestos = useMemo(() => incluirIva ? subtotal * (porcentajeIva / 100) : 0, [subtotal, incluirIva, porcentajeIva]);
  const total = useMemo(() => subtotal + impuestos, [subtotal, impuestos]);

  function addToCart(producto) {
    // Verificar stock disponible (solo si no es servicio)
    const isService = producto.tipo === 'servicio';
    if (!isService) {
      const stockDisponible = producto.stock;
      const itemEnCarrito = cart.find(item => item.id === producto.id);
      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.qty : 0;

      if (cantidadEnCarrito >= stockDisponible) {
        toast.error(`No hay suficiente stock. Disponible: ${stockDisponible}`);
        return;
      }
    }

    // Verificar si puede usar toppings (negocio de comida con premium)
    const puedeUsarToppings = organization && canUseToppings(organization, null, hasFeature).canUse;

    if (puedeUsarToppings) {
      // Mostrar selector de toppings
      setProductoParaToppings(producto);
      setMostrandoToppingsSelector(true);
    } else {
      // Agregar directamente sin toppings
      agregarAlCarrito(producto, [], producto.precio_venta);
    }
  }

  const agregarAlCarrito = (producto, toppings = [], precioTotal) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === producto.id &&
        JSON.stringify(i.toppings || []) === JSON.stringify(toppings));

      if (idx >= 0) {
        // Si existe el mismo producto con los mismos toppings, aumentar cantidad
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: next[idx].qty + 1
        };
        return next;
      }

      // Agregar nuevo item con toppings
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        precio_venta: producto.precio_venta,
        precio_total: precioTotal,
        qty: 1,
        toppings: toppings.length > 0 ? toppings : undefined
      }];
    });
  }

  const handleToppingsConfirm = (toppings, precioTotal) => {
    if (productoParaToppings) {
      agregarAlCarrito(productoParaToppings, toppings, precioTotal);
      setProductoParaToppings(null);
    }
  }

  const inc = (id) => {
    const producto = productos.find(p => p.id === id);
    const itemEnCarrito = cart.find(item => item.id === id);

    // Verificar stock solo si no es servicio
    if (producto.tipo !== 'servicio' && itemEnCarrito && itemEnCarrito.qty >= producto.stock) {
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
      montoEntregadoInput.reset();
      setMostrandoPagoEfectivo(true);
    } else if (metodo === 'Mixto') {
      // Mostrar modal de pago mixto
      setMetodo1('Efectivo');
      setMetodo2('Transferencia');
      montoMetodo1Input.reset();
      montoMetodo2Input.reset();
      setMostrandoPagoMixto(true);
    } else {
      // Para otros métodos, establecer el monto como el total
      montoEntregadoInput.setValue(total);
      // Usar setTimeout para asegurar que el estado se actualice antes de confirmar
      setTimeout(() => {
        confirmSale(metodo);
      }, 50);
    }
  };

  const handleValorPredefinido = useCallback((valor) => {
    const montoActual = montoEntregadoInput.numericValue;
    const nuevoMonto = montoActual + valor;
    montoEntregadoInput.setValue(nuevoMonto);
  }, [montoEntregadoInput]);

  const handleConfirmarPagoEfectivo = () => {
    const monto = montoEntregadoInput.numericValue;
    if (isNaN(monto) || monto < total) {
      toast.error('El monto debe ser mayor o igual al total de la venta.');
      return;
    }
    setMostrandoPagoEfectivo(false);
    confirmSale();
  };

  const handleCancelarPagoEfectivo = () => {
    setMostrandoPagoEfectivo(false);
    montoEntregadoInput.reset();
  };

  const handleCerrarConfirmacion = () => {
    setMostrandoConfirmacion(false);
    setConfirmacionCargando(false);
    setConfirmacionExito(false);
    setDatosVentaConfirmada(null);
  };

  // Handlers para pago mixto
  const handleConfirmarPagoMixto = () => {
    const monto1 = montoMetodo1Input.numericValue;
    const monto2 = total - monto1;

    if (monto1 <= 0 || monto1 >= total) {
      toast.error('El monto debe ser mayor a 0 y menor al total.');
      return;
    }

    // Guardar los datos del pago mixto
    montoEntregadoInput.setValue(total);
    setMostrandoPagoMixto(false);

    // Confirmar venta con información de pago mixto
    confirmSale('Mixto', {
      metodo1,
      metodo2,
      monto1,
      monto2
    });
  };

  const handleCancelarPagoMixto = () => {
    setMostrandoPagoMixto(false);
    montoMetodo1Input.reset();
    montoMetodo2Input.reset();
  };

  // Componente para pago mixto
  const PagoMixto = () => {
    const monto1 = montoMetodo1Input.numericValue;
    const monto2Calculado = total - monto1;

    // Sincronizar monto2 cuando cambia monto1
    const metodosDisponibles = ['Efectivo', 'Transferencia', 'Tarjeta'];

    // Obtener icono según método
    const getIconoMetodo = (metodo) => {
      switch (metodo) {
        case 'Efectivo': return <Banknote size={20} />;
        case 'Transferencia': return <Smartphone size={20} />;
        case 'Tarjeta': return <CreditCard size={20} />;
        default: return <Wallet size={20} />;
      }
    };

    const handleMonto1Change = (e) => {
      montoMetodo1Input.handleChange(e);
      const numValue = montoMetodo1Input.numericValue;

      if (numValue <= total) {
        const resto = total - numValue;
        montoMetodo2Input.setValue(resto);
      }
    };

    const handleMonto2Change = (e) => {
      montoMetodo2Input.handleChange(e);
      const numValue = montoMetodo2Input.numericValue;

      if (numValue <= total) {
        const resto = total - numValue;
        montoMetodo1Input.setValue(resto);
      }
    };

    return (
      <div className="pago-efectivo-overlay">
        <div className="pago-efectivo-container" style={{ maxWidth: '600px' }}>
          <div className="pago-efectivo-header">
            <Wallet size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <h3>Pago Mixto</h3>
            <p>Total a pagar: {formatCOP(total)}</p>
          </div>

          <div className="pago-efectivo-content">
            {/* Selección de métodos */}
            <div className="pago-mixto-metodos">
              <div className="pago-mixto-metodo-group">
                <label className="pago-efectivo-label">
                  {getIconoMetodo(metodo1)}
                  <span style={{ marginLeft: '0.5rem' }}>Primer método</span>
                </label>
                <select
                  className="pago-mixto-select"
                  value={metodo1}
                  onChange={(e) => setMetodo1(e.target.value)}
                >
                  {metodosDisponibles.filter(m => m !== metodo2).map(metodo => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>

              <div className="pago-mixto-metodo-group">
                <label className="pago-efectivo-label">
                  {getIconoMetodo(metodo2)}
                  <span style={{ marginLeft: '0.5rem' }}>Segundo método</span>
                </label>
                <select
                  className="pago-mixto-select"
                  value={metodo2}
                  onChange={(e) => setMetodo2(e.target.value)}
                >
                  {metodosDisponibles.filter(m => m !== metodo1).map(metodo => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inputs de montos */}
            <div className="pago-mixto-inputs-container" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              {/* Input monto 1 */}
              <div className="pago-mixto-input-group">
                <label className="pago-efectivo-label" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {getIconoMetodo(metodo1)}
                  <span>Monto {metodo1}</span>
                </label>
                <input
                  ref={montoMetodo1Input.inputRef}
                  type="text"
                  value={montoMetodo1Input.displayValue}
                  onChange={handleMonto1Change}
                  className="pago-efectivo-input"
                  placeholder="0"
                  autoFocus
                  inputMode="numeric"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0ea5e9'
                  }}
                />
              </div>

              {/* Input monto 2 */}
              <div className="pago-mixto-input-group">
                <label className="pago-efectivo-label" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {getIconoMetodo(metodo2)}
                  <span>Monto {metodo2}</span>
                </label>
                <input
                  ref={montoMetodo2Input.inputRef}
                  type="text"
                  value={montoMetodo2Input.displayValue}
                  onChange={handleMonto2Change}
                  className="pago-efectivo-input"
                  placeholder="0"
                  inputMode="numeric"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0ea5e9'
                  }}
                />
              </div>
            </div>

            {/* Resumen del pago */}
            {monto1 > 0 && monto1 < total && (
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '2px solid #0ea5e9',
                borderRadius: '12px',
                padding: '1rem',
                marginTop: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#0c4a6e',
                  fontWeight: '600'
                }}>
                  <CheckCircle size={20} />
                  <span>Desglose del Pago</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '8px',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    {getIconoMetodo(metodo1)}
                    {metodo1}
                  </span>
                  <span style={{ fontWeight: '700', color: '#0284c7', fontSize: '1.1rem' }}>{formatCOP(monto1)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    {getIconoMetodo(metodo2)}
                    {metodo2}
                  </span>
                  <span style={{ fontWeight: '700', color: '#0284c7', fontSize: '1.1rem' }}>{formatCOP(monto2Calculado)}</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px solid #0ea5e9',
                  paddingTop: '0.75rem'
                }}>
                  <span style={{ fontWeight: '700', color: '#0c4a6e' }}>TOTAL</span>
                  <span style={{ fontWeight: '700', fontSize: '1.5rem', color: '#0c4a6e' }}>
                    {formatCOP(total)}
                  </span>
                </div>
              </div>
            )}

            {monto1 <= 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem',
                color: '#92400e',
                fontSize: '0.9rem'
              }}>
                <Search size={18} />
                <span>Ingresa los montos para cada método de pago</span>
              </div>
            )}

            {monto1 >= total && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem',
                color: '#991b1b',
                fontSize: '0.9rem'
              }}>
                <X size={18} />
                <span>El monto no puede ser igual o mayor al total</span>
              </div>
            )}
          </div>

          <div className="pago-efectivo-actions">
            <button
              className="pago-efectivo-btn pago-efectivo-cancelar"
              onClick={handleCancelarPagoMixto}
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              className="pago-efectivo-btn pago-efectivo-confirmar"
              onClick={handleConfirmarPagoMixto}
              disabled={monto1 <= 0 || monto1 >= total}
            >
              <CheckCircle size={18} />
              Confirmar Pago Mixto
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente para pago en efectivo
  const PagoEfectivo = () => {
    const monto = montoEntregadoInput.numericValue;
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
                ref={montoEntregadoInput.inputRef}
                type="text"
                value={montoEntregadoInput.displayValue}
                onChange={montoEntregadoInput.handleChange}
                className="pago-efectivo-input"
                placeholder="Ingresa el monto"
                autoFocus
                inputMode="numeric"
              />
            </div>

            <div className="pago-efectivo-valores-comunes">
              <div className="pago-efectivo-subtitle-container">
                <p className="pago-efectivo-subtitle">Valores comunes:</p>
                <button
                  className="pago-efectivo-limpiar-btn"
                  onClick={montoEntregadoInput.reset}
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
            <Smartphone className="metodo-pago-icon" />
            <span className="metodo-pago-label">Transferencia</span>
            <span className="metodo-pago-desc">Total: {formatCOP(total)}</span>
          </button>

          <button
            className="metodo-pago-btn"
            onClick={() => handleSeleccionarMetodoPago('Tarjeta')}
          >
            <CreditCard className="metodo-pago-icon" />
            <span className="metodo-pago-label">Tarjeta Débito/Crédito</span>
            <span className="metodo-pago-desc">Total: {formatCOP(total)}</span>
          </button>

          <button
            className="metodo-pago-btn"
            onClick={() => handleSeleccionarMetodoPago('Mixto')}
          >
            <Wallet className="metodo-pago-icon" />
            <span className="metodo-pago-label">Mixto</span>
            <span className="metodo-pago-desc">Total: {formatCOP(total)}</span>
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

  async function confirmSale(metodoPago = null, datosPagoMixto = null) {
    if (!user) {
      console.error('Usuario no autenticado');
      toast.error('Error: Usuario no autenticado');
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Verificar límite de ventas ANTES de procesar
    const puedeCrearVenta = await canPerformAction('createSale');
    if (!puedeCrearVenta.allowed) {
      toast.error(puedeCrearVenta.reason);
      return;
    }

    // Usar el método pasado como parámetro o el del estado
    const metodoFinal = metodoPago || method;
    // Mostrar modal de confirmación con carga
    setMostrandoConfirmacion(true);
    setConfirmacionCargando(true);
    setConfirmacionExito(false);

    setConfirmacionExito(false);

    try {
      setProcesandoVenta(true);
      // Validar que no se exceda el stock (solo para productos físicos)
      for (const item of cart) {
        const producto = productos.find(p => p.id === item.id);
        if (!producto) {
          console.error('Producto no encontrado:', item.id);
          toast.error(`Error: Producto ${item.nombre} no encontrado`);
          setProcesandoVenta(false);
          setMostrandoConfirmacion(false);
          setConfirmacionCargando(false);
          return;
        }

        if (producto.tipo !== 'servicio' && item.qty > producto.stock) {
          toast.error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`);
          setProcesandoVenta(false);
          setMostrandoConfirmacion(false);
          setConfirmacionCargando(false);
          return;
        }
      }

      // Determinar el monto pagado por el cliente según el método de pago
      let montoPagoCliente = total;
      let detallesPagoMixto = null;

      if (metodoFinal === "Efectivo") {
        const montoNumero = montoEntregadoInput.numericValue;
        if (isNaN(montoNumero) || montoNumero < total) {
          toast.error('El monto debe ser mayor o igual al total de la venta.');
          setProcesandoVenta(false);
          setMostrandoConfirmacion(false);
          setConfirmacionCargando(false);
          return;
        }
        montoPagoCliente = montoNumero;
      } else if (metodoFinal === "Mixto" && datosPagoMixto) {
        // Para pago mixto, guardar los detalles
        montoPagoCliente = total;
        detallesPagoMixto = {
          metodo1: datosPagoMixto.metodo1,
          metodo2: datosPagoMixto.metodo2,
          monto1: datosPagoMixto.monto1,
          monto2: datosPagoMixto.monto2
        };
      } else {
        // Para otros métodos de pago, el monto es exactamente el total
        montoPagoCliente = total;
      }

      // Guardar la venta en la base de datos con organization_id
      const ventaData = {
        user_id: user.id,
        organization_id: userProfile.organization_id,
        total: total,
        metodo_pago: metodoFinal === 'Mixto' && detallesPagoMixto
          ? `Mixto (${detallesPagoMixto.metodo1}: ${formatCOP(detallesPagoMixto.monto1)} + ${detallesPagoMixto.metodo2}: ${formatCOP(detallesPagoMixto.monto2)})`
          : metodoFinal,
        items: cart,
        fecha: new Date().toISOString(),
        pago_cliente: montoPagoCliente
      };

      // Intentar agregar detalles del pago mixto en columna separada si existe
      // Si la columna no existe, el error será silencioso y solo usará el string en metodo_pago
      if (detallesPagoMixto) {
        try {
          ventaData.detalles_pago_mixto = detallesPagoMixto;
        } catch (e) {
          // Columna no existe, continuar sin ella
          console.log('Usando formato de string para pago mixto');
        }
      }
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
      // Actualizar stock de productos
      for (const item of cart) {
        const producto = productos.find(p => p.id === item.id);
        const nuevoStock = producto.stock - item.qty;
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

      // Actualizar stock de toppings si hay items con toppings
      const puedeUsarToppings = organization && canUseToppings(organization, null, hasFeature).canUse;
      if (puedeUsarToppings) {
        for (const item of cart) {
          if (item.toppings && item.toppings.length > 0) {
            for (const topping of item.toppings) {
              const cantidadVendida = (topping.cantidad || 1) * item.qty;
              // Obtener topping actual para conocer stock y tipo
              const { data: toppingActual } = await supabase
                .from('toppings')
                .select('stock, tipo')
                .eq('id', topping.id)
                .single();

              // Solo actualizar stock si el topping no es de tipo 'servicio' y tiene stock (no es null)
              if (toppingActual && toppingActual.tipo !== 'servicio' && toppingActual.stock !== null) {
                const nuevoStockTopping = toppingActual.stock - cantidadVendida;
                const { error: toppingStockError } = await supabase
                  .from('toppings')
                  .update({ stock: Math.max(0, nuevoStockTopping) })
                  .eq('id', topping.id);

                if (toppingStockError) {
                  console.error('Error actualizando stock de topping:', toppingStockError);
                  // No bloqueamos la venta por esto
                }
              }
            }
          }
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
        metodo_pago: metodoFinal,
        pagoCliente: montoPagoCliente,
        total: total,
        cantidadProductos: cart.length,
        // Agregar detalles de pago mixto si existen
        ...(detallesPagoMixto && { detalles_pago_mixto: detallesPagoMixto })
      };
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
      queryClient.invalidateQueries(['productos', userProfile.organization_id]);
      queryClient.invalidateQueries(['productos-paginados', userProfile.organization_id]);
      queryClient.invalidateQueries(['ventas', userProfile.organization_id]);
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

        <div className="caja-products-list caja-product-grid">
          {/* Renderizado procedural: Solo renderizar productos visibles */}
          {filteredProducts.slice(0, productosVisibles).map((producto, index) => (
            <motion.div
              key={producto.id}
              className="caja-product-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index * 0.05, 1), // Límite de delay
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
                  loading="lazy"
                />
                <div className="caja-product-info">
                  <p className="caja-product-name">{producto.nombre}</p>
                  <p className="caja-product-stock">Stock: {producto.stock}</p>
                </div>
                <span className="caja-product-price">{formatCOP(producto.precio_venta)}</span>
              </div>
            </motion.div>
          ))}

          {/* Indicador de carga de más productos */}
          {productosVisibles < filteredProducts.length && (
            <div className="caja-loading-more">
              <p>Mostrando {productosVisibles} de {filteredProducts.length} productos...</p>
            </div>
          )}

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
              {cart.map((item, index) => (
                <li key={`${item.id}-${index}`} className="caja-cart-item">
                  <div className="caja-cart-item-info">
                    <p className="caja-cart-item-name">{item.nombre}</p>
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="caja-cart-item-toppings">
                        {item.toppings.map(t => `+ ${t.nombre}${t.cantidad > 1 ? ` x${t.cantidad}` : ''}`).join(', ')}
                      </p>
                    )}
                    <p className="caja-cart-item-price">
                      {formatCOP(item.precio_total || item.precio_venta)} c/u
                    </p>
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
                    {formatCOP(item.qty * (item.precio_total || item.precio_venta))}
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
          onClick={handleContinuar}
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
                {cart.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="caja-mobile-cart-item">
                    <div className="caja-mobile-cart-item-info">
                      <p className="caja-mobile-cart-item-name">{item.nombre}</p>
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="caja-mobile-cart-item-toppings" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {item.toppings.map(t => `+ ${t.nombre}${t.cantidad > 1 ? ` x${t.cantidad}` : ''}`).join(', ')}
                        </p>
                      )}
                      <p className="caja-mobile-cart-item-price">{formatCOP(item.precio_total || item.precio_venta)} c/u</p>
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
                      {formatCOP(item.qty * (item.precio_total || item.precio_venta))}
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

      {/* Pago mixto */}
      {mostrandoPagoMixto && <PagoMixto />}

      {/* Recibo de venta con lazy loading */}
      {ventaCompletada && (
        <Suspense fallback={<div className="loading-fallback">Cargando recibo...</div>}>
          <ReciboVenta
            venta={ventaCompletada}
            onNuevaVenta={handleNuevaVenta}
          />
        </Suspense>
      )}

      {/* Modal de confirmación de venta con lazy loading */}
      <Suspense fallback={null}>
        <ConfirmacionVenta
          isVisible={mostrandoConfirmacion}
          isLoading={confirmacionCargando}
          isSuccess={confirmacionExito}
          onClose={handleCerrarConfirmacion}
          ventaData={datosVentaConfirmada}
        />
      </Suspense>

      {mostrandoToppingsSelector && productoParaToppings && (
        <ToppingsSelector
          open={mostrandoToppingsSelector}
          onClose={() => {
            setMostrandoToppingsSelector(false);
            setProductoParaToppings(null);
          }}
          producto={productoParaToppings}
          precioBase={productoParaToppings.precio_venta}
          onConfirm={handleToppingsConfirm}
          organizationId={userProfile?.organization_id}
          tipo={productoParaToppings.tipo === 'servicio' ? 'servicio' : 'comida'}
        />
      )}
    </div>
  );
}