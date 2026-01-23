import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion } from 'framer-motion';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useProductos } from '../../hooks/useProductos';
import { useGuardarCotizacion, useActualizarCotizacion } from '../../hooks/useCotizaciones';
import { generarCodigoVenta } from '../../utils/generarCodigoVenta';
import { useClientes, useCrearCliente } from '../../hooks/useClientes';
import { usePedidos, useActualizarPedido } from '../../hooks/usePedidos';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import ReciboVenta from '../../components/business/ReciboVenta';
import ConfirmacionVenta from '../../components/business/ConfirmacionVenta';
import { ShoppingCart, Trash2, Search, CheckCircle, CreditCard, Banknote, Smartphone, Wallet, ArrowLeft, Save, Plus, X, UserCircle } from 'lucide-react';
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
  const { user, organization } = useAuth();
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
  const [mostrandoPagoMixto, setMostrandoPagoMixto] = useState(false);
  const [montoEntregado, setMontoEntregado] = useState('');
  const [metodoMixto1, setMetodoMixto1] = useState('Efectivo');
  const [metodoMixto2, setMetodoMixto2] = useState('Transferencia');
  const [montoMixto1, setMontoMixto1] = useState('');
  const [montoMixto2, setMontoMixto2] = useState('');
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false);
  const [confirmacionCargando, setConfirmacionCargando] = useState(false);
  const [confirmacionExito, setConfirmacionExito] = useState(false);
  const [datosVentaConfirmada, setDatosVentaConfirmada] = useState(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);
  const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [mostrandoModalSeleccionCliente, setMostrandoModalSeleccionCliente] = useState(false);
  const [mostrandoModalCliente, setMostrandoModalCliente] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [mostrarFacturaPantalla, setMostrarFacturaPantalla] = useState(false);
  
  // Hooks para clientes
  // eslint-disable-next-line no-unused-vars
  const { data: clientes = [] } = useClientes(organization?.id);
  const crearClienteMutation = useCrearCliente();

  // Hook para guardar y actualizar cotización
  const guardarCotizacionMutation = useGuardarCotizacion();
  const actualizarCotizacionMutation = useActualizarCotizacion();

  // Hook para pedidos pendientes de pago
  const { data: todosPedidos = [] } = usePedidos(organization?.id);
  const actualizarPedido = useActualizarPedido();
  
  // Filtrar pedidos listos para pago (solo estado "listo", excluir "completado", excluir sin items)
  const pedidosPendientesPago = useMemo(() => {
    return todosPedidos.filter(p => 
      p.estado === 'listo' && 
      !p.pago_inmediato &&
      p.items && 
      Array.isArray(p.items) && 
      p.items.length > 0
    );
  }, [todosPedidos]);
  
  const [mostrandoPedidosPendientes, setMostrandoPedidosPendientes] = useState(false);
  const [pedidoIdActual, setPedidoIdActual] = useState(null);
  const [pedidosConsolidados, setPedidosConsolidados] = useState([]); // IDs de todos los pedidos consolidados

  // Cargar productos usando React Query (optimizado con cache)
  const { data: productosData = [], isLoading: productosLoading } = useProductos(organization?.id);
  
  // Precargar imágenes cuando se cargan los productos (similar a Inventario)
  useEffect(() => {
    if (productosData.length > 0 && organization?.id && supabase) {
      // Precargar imágenes de productos con imagen válida
      const productosConImagen = productosData.filter(
        p => p.imagen && 
        p.imagen.trim() !== '' && 
        p.imagen !== 'null' && 
        p.imagen !== 'undefined'
      );
      
      if (productosConImagen.length > 0) {
        // Precargar las primeras 30 imágenes (las más visibles)
        const imagenesAPrecargar = productosConImagen.slice(0, 30);
        
        imagenesAPrecargar.forEach(async (producto) => {
          try {
            let filePath = producto.imagen;
            
            // Extraer la ruta del archivo
            if (filePath.includes('/storage/v1/object/public/productos/')) {
              filePath = filePath.split('/storage/v1/object/public/productos/')[1];
            } else if (filePath.includes('/storage/v1/object/sign/productos/')) {
              filePath = filePath.split('/storage/v1/object/sign/productos/')[1].split('?')[0];
            } else if (filePath.includes('productos/')) {
              const parts = filePath.split('productos/');
              if (parts.length > 1) {
                filePath = parts[1].split('?')[0];
              }
            }
            
            filePath = filePath.trim();
            
            // Decodificar la ruta si viene codificada
            try {
              filePath = decodeURIComponent(filePath);
            } catch (e) {
              // Si falla la decodificación, usar el original
            }
            
            // Generar signed URL y precargarla
            const { data, error } = await supabase.storage
              .from('productos')
              .createSignedUrl(filePath, 3600);
            
            if (!error && data?.signedUrl) {
              // Guardar en cache global inmediatamente
              const globalImageCache = (window.__imageCache || new Map());
              globalImageCache.set(producto.imagen, {
                url: data.signedUrl,
                timestamp: Date.now()
              });
              window.__imageCache = globalImageCache;
              
              // Precargar la imagen en el navegador
              const img = new Image();
              img.src = data.signedUrl;
            }
          } catch (err) {
            // Error silencioso en precarga
          }
        });
      }
    }
  }, [productosData, organization?.id]);
  
  useEffect(() => {
    if (productosData.length > 0) {
      setProductos(productosData);
    }
    setCargando(productosLoading);
  }, [productosData, productosLoading]);

  // Estado para trackear si estamos editando una cotización existente
  const [cotizacionId, setCotizacionId] = useState(null);

  // Estado para guardar el nombre del cliente del pedido
  const [clienteNombrePedido, setClienteNombrePedido] = useState(null);

  // Cargar pedido desde localStorage si viene de "Pagar ahora"
  useEffect(() => {
    const pedidoData = localStorage.getItem('pedidoParaPagar');
    if (pedidoData && productos.length > 0) {
      try {
        const pedido = JSON.parse(pedidoData);
        if (pedido.items && pedido.items.length > 0) {
          // Guardar el ID del pedido
          if (pedido.pedidoId) {
            setPedidoIdActual(pedido.pedidoId);
          }
          
          // Guardar el nombre del cliente del pedido si existe
          if (pedido.clienteNombre || pedido.cliente_nombre) {
            setClienteNombrePedido(pedido.clienteNombre || pedido.cliente_nombre);
          }
          
          // Mapear los items del pedido al formato del carrito
          const itemsCarrito = pedido.items.map(item => {
            const productoCompleto = productos.find(p => p.id === item.id);
            if (productoCompleto) {
              return {
                id: item.id,
                nombre: item.nombre || productoCompleto.nombre,
                precio_venta: item.precio_venta || productoCompleto.precio_venta,
                qty: item.qty || 1,
                toppings: item.toppings || [], // Incluir toppings si existen
                variaciones: item.variaciones || item.variaciones_seleccionadas || {}, // Incluir variaciones si existen
                notas: item.notas || null // Incluir notas si existen
              };
            }
            return null;
          }).filter(item => item !== null);

          if (itemsCarrito.length > 0) {
            setCart(itemsCarrito);
            toast.success('Pedido cargado. Procede con el pago.');
          }
          
          // Limpiar localStorage
          localStorage.removeItem('pedidoParaPagar');
        }
      } catch (error) {
        console.error('Error cargando pedido:', error);
        localStorage.removeItem('pedidoParaPagar');
      }
    }
  }, [productos]);

  // Cargar cotización desde localStorage si existe
  useEffect(() => {
    const cotizacionData = localStorage.getItem('cotizacionRetomar');
    if (cotizacionData && productos.length > 0) {
      try {
        const cotizacion = JSON.parse(cotizacionData);
        if (cotizacion.items && cotizacion.items.length > 0) {
          // Guardar el ID de la cotización si existe
          if (cotizacion.id) {
            setCotizacionId(cotizacion.id);
          }
          
          // Mapear los items de la cotización al formato del carrito
          const itemsCarrito = cotizacion.items.map(item => {
            // Buscar el producto completo en la lista de productos
            const productoCompleto = productos.find(p => p.id === item.id);
            if (productoCompleto) {
              return {
                id: item.id,
                nombre: item.nombre || productoCompleto.nombre,
                precio_venta: item.precio_venta || productoCompleto.precio_venta,
                qty: item.qty || 1
              };
            }
            return null;
          }).filter(item => item !== null);

          if (itemsCarrito.length > 0) {
            setCart(itemsCarrito);
            
            // Cargar cliente si existe
            if (cotizacion.cliente_id) {
              // Buscar el cliente en la lista de clientes
              const cliente = clientes.find(c => c.id === cotizacion.cliente_id);
              if (cliente) {
                setClienteSeleccionado(cliente);
              } else {
                // Si no está en la lista, intentar cargarlo desde la base de datos
                const cargarCliente = async () => {
                  const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('id', cotizacion.cliente_id)
                    .single();
                  
                  if (!error && data) {
                    setClienteSeleccionado(data);
                  }
                };
                cargarCliente();
              }
            }
            
            // Guardar copia original para comparar cambios después
            localStorage.setItem('cotizacionOriginal', JSON.stringify({
              items: cotizacion.items,
              total: cotizacion.total
            }));
            
            toast.success('Cotización cargada');
          }
          
          // Limpiar localStorage
          localStorage.removeItem('cotizacionRetomar');
        }
      } catch (error) {
        console.error('Error cargando cotización:', error);
        localStorage.removeItem('cotizacionRetomar');
      }
    }
  }, [productos, clientes]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [query, productos]);

  const subtotal = useMemo(() => calcTotal(cart.map((c) => ({ id: c.id, price: c.precio_venta, qty: c.qty }))), [cart]);
  const total = useMemo(() => subtotal, [subtotal]);

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
        // Si ya existe, aumentar cantidad y mover al inicio
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        // Mover al inicio
        const item = next.splice(idx, 1)[0];
        return [item, ...next];
      }
      // Si es nuevo, agregarlo al inicio
      return [{ 
        id: producto.id, 
        nombre: producto.nombre, 
        precio_venta: producto.precio_venta, 
        qty: 1 
      }, ...prev];
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
  
  const dec = (id) => {
    setCart((prev) => {
      const updated = prev.map((i) => 
        i.id === id ? { ...i, qty: i.qty - 1 } : i
      );
      // Eliminar productos con cantidad 0 o menor
      return updated.filter((i) => i.qty > 0);
    });
  };
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const handleNuevaVenta = () => {
    setPedidoIdActual(null);
    setPedidosConsolidados([]);
    setVentaCompletada(null);
    setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
    setMostrandoMetodosPago(false);
    setMostrarFacturaPantalla(false); // Resetear checkbox
  };

  const handleContinuar = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setMostrandoMetodosPago(true);
  };

  // Función para guardar cotización
  const handleGuardarCotizacion = async () => {
    if (!user || !organization) {
      toast.error('Error: No hay usuario u organización activa');
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setGuardandoCotizacion(true);

    try {
      // Generar código de cotización
      const numeroVenta = await generarCodigoVenta(organization.id, 'COTIZACION');
      
      // Construir objeto de cotización con solo campos básicos requeridos
      const cotizacionData = {
        organization_id: organization.id,
        user_id: user.id,
        total: total,
        metodo_pago: 'COTIZACION', // Valor especial para identificar cotizaciones (metodo_pago tiene NOT NULL)
        items: cart,
        fecha: new Date().toISOString(),
        numero_venta: numeroVenta,
        cliente_id: clienteSeleccionado?.id || null
      };

      // Si hay un ID de cotización existente, actualizar en lugar de crear nueva
      if (cotizacionId) {
        // Verificar si realmente hay cambios comparando items y total
        const cotizacionOriginal = localStorage.getItem('cotizacionOriginal');
        if (cotizacionOriginal) {
          try {
            const original = JSON.parse(cotizacionOriginal);
            const itemsIguales = JSON.stringify(original.items) === JSON.stringify(cart);
            const totalIgual = original.total === total;
            
            // Si no hay cambios, no hacer nada
            if (itemsIguales && totalIgual) {
              toast('No hay cambios en la cotización', { icon: 'ℹ️' });
              setGuardandoCotizacion(false);
              return;
            }
          } catch (e) {
            // Si no se puede comparar, continuar con la actualización
          }
        }
        
        // Actualizar cotización existente
        await actualizarCotizacionMutation.mutateAsync({
          id: cotizacionId,
          updates: cotizacionData
        });
        
        toast.success('Cotización actualizada exitosamente');
        setCotizacionId(null); // Limpiar ID después de actualizar
      } else {
        // Crear nueva cotización
        await guardarCotizacionMutation.mutateAsync(cotizacionData);
      }
      
      // Limpiar el carrito después de guardar
      setCart([]);
      setQuery('');
      localStorage.removeItem('cotizacionOriginal');
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast.error('Error al guardar la cotización');
    } finally {
      setGuardandoCotizacion(false);
    }
  };

  const handleSeleccionarMetodoPago = (metodo) => {
    setMethod(metodo);
    setMostrandoMetodosPago(false);
    
    if (metodo === 'Efectivo') {
      // Mostrar modal de pago en efectivo
      setMontoEntregado('');
      setMostrandoPagoEfectivo(true);
    } else if (metodo === 'Mixto') {
      // Mostrar modal de pago mixto
      setMontoMixto1('');
      setMontoMixto2('');
      setMetodoMixto1('Efectivo');
      setMetodoMixto2('Transferencia');
      setMostrandoPagoMixto(true);
    } else {
      // Para otros métodos, proceder directamente pasando el método como parámetro
      confirmSale(metodo);
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

  const handleValorPredefinidoMixto = (valor, esMonto1) => {
    if (esMonto1) {
      setMontoMixto1(prev => {
        const montoActual = parseFloat(prev.replace(/[^\d]/g, '')) || 0;
        const nuevoMonto = montoActual + valor;
        return nuevoMonto.toLocaleString('es-CO');
      });
    } else {
      setMontoMixto2(prev => {
        const montoActual = parseFloat(prev.replace(/[^\d]/g, '')) || 0;
        const nuevoMonto = montoActual + valor;
        return nuevoMonto.toLocaleString('es-CO');
      });
    }
  };

  const handleConfirmarPagoMixto = () => {
    const monto1 = parseFloat(montoMixto1.replace(/[^\d]/g, '')) || 0;
    const monto2 = parseFloat(montoMixto2.replace(/[^\d]/g, '')) || 0;
    const sumaMontos = monto1 + monto2;
    const diferencia = total - sumaMontos;
    const hayEfectivo = metodoMixto1 === 'Efectivo' || metodoMixto2 === 'Efectivo';

    if (monto1 <= 0 || monto2 <= 0) {
      toast.error('Ambos montos deben ser mayores a cero');
      return;
    }

    if (metodoMixto1 === metodoMixto2) {
      toast.error('Debes seleccionar dos métodos de pago diferentes');
      return;
    }

    // Si hay efectivo, permitir que el monto sea mayor o igual (puede haber cambio)
    // Si no hay efectivo, los valores deben ser exactos
    if (!hayEfectivo && Math.abs(diferencia) > 1) {
      toast.error(`La suma de los montos (${formatCOP(sumaMontos)}) debe ser igual al total (${formatCOP(total)})`);
      return;
    }

    if (hayEfectivo && diferencia > 1) {
      toast.error(`El monto entregado (${formatCOP(sumaMontos)}) debe ser mayor o igual al total (${formatCOP(total)})`);
      return;
    }

    setMostrandoPagoMixto(false);
    // Pasar los detalles del pago mixto a confirmSale
    confirmSale('Mixto', {
      metodo1: metodoMixto1,
      monto1: monto1,
      metodo2: metodoMixto2,
      monto2: monto2
    });
  };

  const handleCancelarPagoMixto = () => {
    setMostrandoPagoMixto(false);
    setMontoMixto1('');
    setMontoMixto2('');
  };

  const handleCerrarConfirmacion = () => {
    setMostrandoConfirmacion(false);
    setConfirmacionCargando(false);
    setConfirmacionExito(false);
    setDatosVentaConfirmada(null);
  };

  // Componente para pago en efectivo
  const PagoEfectivo = () => {
    // Estado local para el input que se actualiza en tiempo real
    const [inputValue, setInputValue] = useState(montoEntregado);
    // Estado para controlar si se deben mostrar los cálculos (solo cuando el usuario termine de escribir)
    const [mostrarCalculos, setMostrarCalculos] = useState(false);
    const montoEntregadoRef = useRef(montoEntregado);
    const valoresComunes = [1000, 5000, 10000, 20000, 50000, 100000];
    
    // Actualizar ref cuando montoEntregado cambia externamente
    useEffect(() => {
      montoEntregadoRef.current = montoEntregado;
      setInputValue(montoEntregado);
      setMostrarCalculos(true); // Mostrar cálculos cuando cambia externamente (botones de valores comunes)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [montoEntregado]);

    // Debounce: actualizar montoEntregado solo después de que el usuario deje de escribir
    useEffect(() => {
      // Solo actualizar si el valor del input es diferente y no es una actualización externa
      if (inputValue === montoEntregadoRef.current) {
        return; // No hacer nada si ya están sincronizados
      }

      // Ocultar cálculos mientras el usuario está escribiendo
      setMostrarCalculos(false);

      const timer = setTimeout(() => {
        // Verificar nuevamente antes de actualizar (por si cambió externamente)
        if (inputValue !== montoEntregadoRef.current) {
          setMontoEntregado(inputValue);
          setMostrarCalculos(true); // Mostrar cálculos después del debounce
        }
      }, 500); // Esperar 500ms después de que el usuario deje de escribir

      return () => clearTimeout(timer);
    }, [inputValue]);

    // Calcular monto y cambio solo cuando montoEntregado cambie (no en cada keystroke)
    const monto = parseFloat(montoEntregado.replace(/[^\d]/g, '')) || 0;
    const cambio = monto - total;

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
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir solo números y comas/puntos para formato
                  const cleanValue = value.replace(/[^\d,.]/g, '');
                  // Actualizar solo el estado local (no causa recálculos)
                  setInputValue(cleanValue);
                }}
                onBlur={() => {
                  // Actualizar inmediatamente cuando el usuario termine de escribir
                  setMontoEntregado(inputValue);
                  setMostrarCalculos(true); // Mostrar cálculos al salir del input
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
                  onClick={() => {
                    setInputValue('');
                    setMontoEntregado('');
                  }}
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

            {mostrarCalculos && monto > 0 && (
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
          <p className="metodos-pago-total">Total a pagar: <span>{formatCOP(total)}</span></p>
        </div>
        
        <div className="metodos-pago-grid">
          <button 
            className={`metodo-pago-card ${metodoSeleccionado === 'Efectivo' ? 'selected' : ''}`}
            onClick={() => setMetodoSeleccionado('Efectivo')}
          >
            <Banknote className="metodo-pago-icon" size={32} />
            <span className="metodo-pago-label">Efectivo</span>
            <span className="metodo-pago-desc">Pago en efectivo</span>
          </button>
          
          <button 
            className={`metodo-pago-card ${metodoSeleccionado === 'Transferencia' ? 'selected' : ''}`}
            onClick={() => setMetodoSeleccionado('Transferencia')}
          >
            <CreditCard className="metodo-pago-icon" size={32} />
            <span className="metodo-pago-label">Transferencia</span>
            <span className="metodo-pago-desc">Transferencia bancaria</span>
          </button>
          
          <button 
            className={`metodo-pago-card ${metodoSeleccionado === 'Nequi' ? 'selected' : ''}`}
            onClick={() => setMetodoSeleccionado('Nequi')}
          >
            <Smartphone className="metodo-pago-icon" size={32} />
            <span className="metodo-pago-label">Nequi</span>
            <span className="metodo-pago-desc">Pago móvil</span>
          </button>
          
          <button 
            className={`metodo-pago-card ${metodoSeleccionado === 'Mixto' ? 'selected' : ''}`}
            onClick={() => setMetodoSeleccionado('Mixto')}
          >
            <Wallet className="metodo-pago-icon" size={32} />
            <span className="metodo-pago-label">Mixto</span>
            <span className="metodo-pago-desc">Varios métodos</span>
          </button>
        </div>
        
        <div className="metodos-pago-actions">
          <button 
            className="metodos-pago-cancelar"
            onClick={() => {
              setMostrandoMetodosPago(false);
              setMetodoSeleccionado(null);
            }}
          >
            Cancelar
          </button>
          <button 
            className="metodos-pago-continuar"
            onClick={() => {
              if (metodoSeleccionado) {
                handleSeleccionarMetodoPago(metodoSeleccionado);
                setMetodoSeleccionado(null);
              }
            }}
            disabled={!metodoSeleccionado}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );

  // Componente para pago mixto
  const PagoMixto = () => {
    // Estados locales para los inputs con debounce
    const [inputValue1, setInputValue1] = useState(montoMixto1);
    const [inputValue2, setInputValue2] = useState(montoMixto2);
    const [montoCalculado1, setMontoCalculado1] = useState(montoMixto1);
    const [montoCalculado2, setMontoCalculado2] = useState(montoMixto2);
    const montoMixto1Ref = useRef(montoMixto1);
    const montoMixto2Ref = useRef(montoMixto2);
    const valoresComunes = [10000, 20000, 50000, 100000];

    // Actualizar refs cuando los montos cambian externamente
    useEffect(() => {
      montoMixto1Ref.current = montoMixto1;
      montoMixto2Ref.current = montoMixto2;
      setInputValue1(montoMixto1);
      setInputValue2(montoMixto2);
      setMontoCalculado1(montoMixto1);
      setMontoCalculado2(montoMixto2);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [montoMixto1, montoMixto2]);

    // Debounce para monto1 - aumentar tiempo a 1000ms
    useEffect(() => {
      if (inputValue1 === montoMixto1Ref.current) {
        return;
      }
      const timer = setTimeout(() => {
        if (inputValue1 !== montoMixto1Ref.current) {
          setMontoMixto1(inputValue1);
          setMontoCalculado1(inputValue1);
        }
      }, 1000); // Aumentado a 1000ms
      return () => clearTimeout(timer);
    }, [inputValue1]);

    // Debounce para monto2 - aumentar tiempo a 1000ms
    useEffect(() => {
      if (inputValue2 === montoMixto2Ref.current) {
        return;
      }
      const timer = setTimeout(() => {
        if (inputValue2 !== montoMixto2Ref.current) {
          setMontoMixto2(inputValue2);
          setMontoCalculado2(inputValue2);
        }
      }, 1000); // Aumentado a 1000ms
      return () => clearTimeout(timer);
    }, [inputValue2]);

    // Calcular montos usando los valores calculados (sin parpadeo)
    const monto1 = parseFloat(montoCalculado1.replace(/[^\d]/g, '')) || 0;
    const monto2 = parseFloat(montoCalculado2.replace(/[^\d]/g, '')) || 0;
    const sumaMontos = monto1 + monto2;
    const diferencia = total - sumaMontos;
    
    // Calcular cambio si hay efectivo
    const hayEfectivo = metodoMixto1 === 'Efectivo' || metodoMixto2 === 'Efectivo';
    const cambio = hayEfectivo && sumaMontos > total ? sumaMontos - total : 0;


    return (
      <div className="pago-efectivo-overlay">
        <div className="pago-efectivo-container">
          <div className="pago-efectivo-header">
            <h3>Pago Mixto</h3>
            <p>Total a pagar: {formatCOP(total)}</p>
          </div>
          
          <div className="pago-efectivo-content">
            {/* Método 1 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="pago-efectivo-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Primer método de pago:
              </label>
              <select
                value={metodoMixto1}
                onChange={(e) => setMetodoMixto1(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginBottom: '0.75rem'
                }}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Nequi">Nequi</option>
              </select>
              
              <label className="pago-efectivo-label">Monto del primer método:</label>
              <input
                type="text"
                value={inputValue1}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleanValue = value.replace(/[^\d,.]/g, '');
                  setInputValue1(cleanValue);
                }}
                onBlur={() => {
                  setMontoMixto1(inputValue1);
                  setMontoCalculado1(inputValue1);
                }}
                className="pago-efectivo-input"
                placeholder="Ingresa el monto"
                style={{ 
                  transition: 'none',
                  willChange: 'auto',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)'
                }}
              />
              
              <div className="pago-efectivo-botones">
                {valoresComunes.map((valor, index) => (
                  <button
                    key={index}
                    className="pago-efectivo-btn-valor"
                    onClick={() => handleValorPredefinidoMixto(valor, true)}
                  >
                    {formatCOP(valor)}
                  </button>
                ))}
              </div>
            </div>

            {/* Método 2 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="pago-efectivo-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Segundo método de pago:
              </label>
              <select
                value={metodoMixto2}
                onChange={(e) => setMetodoMixto2(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginBottom: '0.75rem'
                }}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Nequi">Nequi</option>
              </select>
              
              <label className="pago-efectivo-label">Monto del segundo método:</label>
              <input
                type="text"
                value={inputValue2}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleanValue = value.replace(/[^\d,.]/g, '');
                  setInputValue2(cleanValue);
                }}
                onBlur={() => {
                  setMontoMixto2(inputValue2);
                  setMontoCalculado2(inputValue2);
                }}
                className="pago-efectivo-input"
                placeholder="Ingresa el monto"
                style={{ 
                  transition: 'none',
                  willChange: 'auto',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translateZ(0)'
                }}
              />
              
              <div className="pago-efectivo-botones">
                {valoresComunes.map((valor, index) => (
                  <button
                    key={index}
                    className="pago-efectivo-btn-valor"
                    onClick={() => handleValorPredefinidoMixto(valor, false)}
                  >
                    {formatCOP(valor)}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen - Mostrar siempre que haya valores */}
            {monto1 > 0 && monto2 > 0 && (
              <div className="pago-efectivo-cambio" style={{ marginTop: '1rem' }}>
                <div className="pago-efectivo-cambio-item">
                  <span>{metodoMixto1}:</span>
                  <span>{formatCOP(monto1)}</span>
                </div>
                <div className="pago-efectivo-cambio-item">
                  <span>{metodoMixto2}:</span>
                  <span>{formatCOP(monto2)}</span>
                </div>
                <div className="pago-efectivo-cambio-item">
                  <span>Suma:</span>
                  <span>{formatCOP(sumaMontos)}</span>
                </div>
                <div className="pago-efectivo-cambio-item">
                  <span>Total a pagar:</span>
                  <span>{formatCOP(total)}</span>
                </div>
                {hayEfectivo && cambio > 0 && (
                  <div className="pago-efectivo-cambio-item pago-efectivo-cambio-total positivo">
                    <span>Cambio a devolver:</span>
                    <span>{formatCOP(cambio)}</span>
                  </div>
                )}
                {!hayEfectivo && (
                  <div className={`pago-efectivo-cambio-item pago-efectivo-cambio-total ${diferencia < -1 ? 'negativo' : diferencia > 1 ? 'negativo' : 'positivo'}`}>
                    <span>Diferencia:</span>
                    <span>
                      {diferencia < -1 
                        ? `Sobran ${formatCOP(Math.abs(diferencia))}` 
                        : diferencia > 1
                        ? `Faltan ${formatCOP(diferencia)}`
                        : 'Correcto ✓'
                      }
                    </span>
                  </div>
                )}
                {hayEfectivo && diferencia > 1 && (
                  <div className="pago-efectivo-cambio-item pago-efectivo-cambio-total negativo">
                    <span>Faltan:</span>
                    <span>{formatCOP(diferencia)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="pago-efectivo-actions">
            <button 
              className="pago-efectivo-btn pago-efectivo-cancelar"
              onClick={handleCancelarPagoMixto}
            >
              Cancelar
            </button>
            <button 
              className="pago-efectivo-btn pago-efectivo-confirmar"
              onClick={handleConfirmarPagoMixto}
              disabled={
                monto1 <= 0 || 
                monto2 <= 0 || 
                metodoMixto1 === metodoMixto2 ||
                (!hayEfectivo && Math.abs(diferencia) > 1) ||
                (hayEfectivo && diferencia > 1)
              }
            >
              Confirmar Pago Mixto
            </button>
          </div>
        </div>
      </div>
    );
  };

  async function confirmSale(metodoPagoOverride = null, detallesPagoMixto = null) {
    if (!user || !organization) {
      console.error('Usuario u organización no autenticado');
      toast.error('Error: No hay usuario u organización activa');
      setProcesandoVenta(false);
      return;
    }
    
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Usar el método pasado como parámetro o el estado actual
    const metodoActual = metodoPagoOverride || method;

    // Mostrar modal de confirmación con carga
    setMostrandoConfirmacion(true);
    setConfirmacionCargando(true);
    setConfirmacionExito(false);
    // NO establecer datosVentaConfirmada como null aquí
    
    setProcesandoVenta(true);
    console.log('Iniciando confirmación de venta...', { cart, total, method: metodoActual });
    
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
    let metodoPagoFinal = metodoActual;
    
    if (metodoActual === "Efectivo") {
      const montoNumero = parseFloat(montoEntregado.replace(/[^\d]/g, ''));
      if (isNaN(montoNumero) || montoNumero < total) {
        toast.error('El monto debe ser mayor o igual al total de la venta.');
        setProcesandoVenta(false);
        return;
      }
      montoPagoCliente = montoNumero;
    } else if (metodoActual === "Mixto" && detallesPagoMixto) {
      // Formatear método de pago mixto como string
      metodoPagoFinal = `Mixto (${detallesPagoMixto.metodo1}: ${formatCOP(detallesPagoMixto.monto1)} + ${detallesPagoMixto.metodo2}: ${formatCOP(detallesPagoMixto.monto2)})`;
      montoPagoCliente = detallesPagoMixto.monto1 + detallesPagoMixto.monto2;
    }
    
    const maxIntentos = 3;
    let intento = 0;
    let ventaResult = null;
    let exito = false;

    while (intento < maxIntentos && !exito) {
      try {
        console.log(`Guardando venta en base de datos... (intento ${intento + 1}/${maxIntentos})`);
        
        // Generar código de venta amigable (forzar único en reintentos)
        const numeroVenta = await generarCodigoVenta(organization.id, metodoPagoFinal, intento > 0);
        
        // Guardar la venta en la base de datos
        const ventaData = {
          organization_id: organization.id,
          user_id: user.id,
          total: total,
          metodo_pago: metodoPagoFinal,
          items: cart,
          fecha: new Date().toISOString(),
          pago_cliente: montoPagoCliente,
          detalles_pago_mixto: metodoActual === "Mixto" && detallesPagoMixto ? detallesPagoMixto : null,
          numero_venta: numeroVenta,
          cliente_id: clienteSeleccionado?.id || null
        };
        
        console.log('Datos de venta a insertar:', ventaData);
        
        const { data: result, error: ventaError } = await supabase
          .from('ventas')
          .insert([ventaData])
          .select();
        
        if (ventaError) {
          // Detectar error de clave duplicada
          const esDuplicado = ventaError.code === '23505' || 
                             ventaError.message?.includes('duplicate key') ||
                             ventaError.message?.includes('idx_ventas_numero_venta_unique');
          
          if (esDuplicado && intento < maxIntentos - 1) {
            console.warn(`⚠️ Número de venta duplicado (intento ${intento + 1}/${maxIntentos}), reintentando...`);
            intento++;
            // Esperar un poco antes de reintentar para evitar condiciones de carrera
            const tiempoEspera = 100 * intento;
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
            continue;
          }
          
          console.error('Error guardando venta:', ventaError);
          toast.error(`Error al guardar la venta: ${ventaError.message}`);
          setProcesandoVenta(false);
          return;
        }
        
        if (!result || result.length === 0) {
          console.error('No se retornó data de la venta');
          toast.error('Error: No se pudo obtener el ID de la venta');
          setProcesandoVenta(false);
          return;
        }
        
        ventaResult = result;
        exito = true;
        console.log("Venta guardada exitosamente:", ventaResult);
      } catch (error) {
        // Si no es un error de duplicado o ya agotamos los intentos, mostrar error
        const esDuplicado = error.code === '23505' || 
                           error.message?.includes('duplicate key') ||
                           error.message?.includes('idx_ventas_numero_venta_unique');
        
        if (!esDuplicado || intento >= maxIntentos - 1) {
          console.error('Error al guardar venta:', error);
          toast.error(`Error al guardar la venta: ${error.message || 'Error desconocido'}`);
          setProcesandoVenta(false);
          return;
        }
        
        // Si es duplicado y aún hay intentos, continuar el loop
        intento++;
        const tiempoEsperaActual = 100 * intento;
        await new Promise(resolve => setTimeout(resolve, tiempoEsperaActual));
      }
    }

    if (!exito || !ventaResult) {
      toast.error('Error: No se pudo guardar la venta después de varios intentos');
      setProcesandoVenta(false);
      return;
    }

    try {
      
      // Si hay pedidos asociados (viene de "Pagar ahora" o pedidos consolidados), actualizar su estado según el tipo de pago
      const pedidosAActualizar = pedidosConsolidados.length > 0 ? pedidosConsolidados : (pedidoIdActual ? [pedidoIdActual] : []);
      
      if (pedidosAActualizar.length > 0) {
        try {
          console.log('Actualizando pedidos después del pago:', pedidosAActualizar);
          
          // Obtener todos los pedidos para verificar su estado actual
          const { data: pedidosData, error: pedidosError } = await supabase
            .from('pedidos')
            .select('id, estado, mesa_id, pago_inmediato')
            .in('id', pedidosAActualizar);
          
          if (pedidosError) {
            console.error('Error obteniendo pedidos:', pedidosError);
          }
          
          // Actualizar cada pedido según su estado actual y tipo de pago
          for (const pedido of pedidosData || []) {
            try {
              let nuevoEstado;
              
              // Si el pedido ya está "listo", al pagarlo debe ir a "completado"
              if (pedido.estado === 'listo') {
                nuevoEstado = 'completado';
              } 
              // Si el pago es anticipado (pago_inmediato = true), el pedido debe ir a "pendiente"
              else if (pedido.pago_inmediato) {
                nuevoEstado = 'pendiente';
              } 
              // Si no es pago anticipado y el pedido está en "pendiente", va a "en_preparacion"
              else if (pedido.estado === 'pendiente') {
                nuevoEstado = 'en_preparacion';
              }
              // Si ya está en "en_preparacion", mantenerlo o avanzar según corresponda
              else if (pedido.estado === 'en_preparacion') {
                // Si ya está en preparación, no cambiar el estado (ya fue tomado por el chef)
                console.log(`Pedido ${pedido.id} ya está en preparación, no se cambia el estado`);
                continue;
              }
              // Para cualquier otro caso, no cambiar el estado
              else {
                console.log(`Pedido ${pedido.id} tiene estado ${pedido.estado}, no se cambia`);
                continue;
              }
              
              console.log(`Actualizando pedido ${pedido.id} de ${pedido.estado} a ${nuevoEstado}`);
              
              await actualizarPedido.mutateAsync({
                id: pedido.id,
                organizationId: organization.id,
                estado: nuevoEstado
              });
            } catch (error) {
              console.error(`Error actualizando pedido ${pedido.id}:`, error);
              // Continuar con los demás pedidos aunque uno falle
            }
          }
          
          console.log(`${pedidosAActualizar.length} pedido(s) procesado(s) exitosamente`);
          setPedidoIdActual(null);
          setPedidosConsolidados([]);
        } catch (error) {
          console.error('Error actualizando pedidos:', error);
          toast.error('La venta se completó pero hubo un error al actualizar los pedidos');
          // No fallar la venta si falla la actualización del pedido
        }
      }
      
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
      
      // Obtener información del cliente si existe
      // Priorizar cliente seleccionado en caja, si no hay, usar el nombre del pedido
      let clienteInfo = null;
      if (clienteSeleccionado) {
        clienteInfo = {
          id: clienteSeleccionado.id,
          nombre: clienteSeleccionado.nombre,
          documento: clienteSeleccionado.documento,
          telefono: clienteSeleccionado.telefono,
          email: clienteSeleccionado.email,
          direccion: clienteSeleccionado.direccion
        };
      } else if (clienteNombrePedido) {
        // Si no hay cliente seleccionado pero hay nombre del pedido, incluirlo en el recibo
        clienteInfo = {
          nombre: clienteNombrePedido
        };
      }
      
      // Crear objeto de venta para el recibo
      const ventaRecibo = {
        id: ventaResult[0].id,
        date: new Date().toLocaleDateString("es-CO"),
        time: new Date().toLocaleTimeString("es-CO"),
        cashier: user.user_metadata?.full_name || user.email || "Usuario",
        register: "Caja Principal",
        items: cart,
        metodo_pago: metodoPagoFinal,
        pagoCliente: montoPagoCliente,
        total: total,
        cantidadProductos: cart.length,
        detalles_pago_mixto: metodoActual === "Mixto" && detallesPagoMixto ? detallesPagoMixto : null,
        cliente: clienteInfo,
        numero_venta: ventaResult[0].numero_venta || null
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
          setPedidoIdActual(null); // Limpiar pedido actual
          setPedidosConsolidados([]); // Limpiar pedidos consolidados
          setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
          setMostrarFacturaPantalla(false); // Resetear checkbox
        }, 2000);
      }, 1500);
      
      // Recargar productos para actualizar stock
      console.log('Recargando productos...');
      const { data: productosActualizados, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', user.id);
      
      if (productosError) {
        console.error('Error recargando productos:', productosError);
      } else {
        setProductos(productosActualizados || []);
        console.log('Productos recargados exitosamente');
      }
      
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

  // Función para cargar un pedido pendiente en el carrito (consolidando pedidos de la misma mesa y estado)
  const cargarPedidoEnCarrito = (pedido) => {
    if (!pedido.items || pedido.items.length === 0) {
      toast.error('El pedido no tiene items');
      return;
    }

    // Solo consolidar si el pedido tiene una mesa real (no mostrador)
    // Los pedidos del mostrador no deben consolidarse
    let pedidosAConsolidar = [pedido];
    
    const mesaId = pedido.mesa_id || pedido.mesa?.id;
    const numeroMesa = pedido.mesa?.numero?.toLowerCase() || '';
    
    // Solo consolidar si tiene mesa_id Y no es un mostrador
    if (mesaId && !numeroMesa.includes('mostrador')) {
      const estadoPedido = pedido.estado;
      
      // Buscar todos los pedidos de la misma mesa con el mismo estado
      const pedidosMismaMesa = pedidosPendientesPago.filter(p => {
        const pMesaId = p.mesa_id || p.mesa?.id;
        const pNumeroMesa = p.mesa?.numero?.toLowerCase() || '';
        // Solo incluir si tiene mesa_id, no es mostrador, y coincide con la mesa y estado
        return pMesaId && 
               !pNumeroMesa.includes('mostrador') &&
               pMesaId === mesaId && 
               p.estado === estadoPedido && 
               p.id !== pedido.id;
      });
      
      if (pedidosMismaMesa.length > 0) {
        pedidosAConsolidar = [pedido, ...pedidosMismaMesa];
        toast(`Consolidando ${pedidosAConsolidar.length} pedidos de la misma mesa`, { icon: 'ℹ️' });
      }
    }

    // Consolidar todos los items de los pedidos
    const todosItems = [];
    pedidosAConsolidar.forEach(p => {
      if (p.items && Array.isArray(p.items)) {
        p.items.forEach(item => {
          const productoCompleto = productos.find(prod => prod.id === item.producto_id);
          if (productoCompleto) {
            const precioUnitarioConToppings = item.precio_total / (item.cantidad || 1);
            todosItems.push({
              id: item.producto_id,
              nombre: item.producto?.nombre || productoCompleto.nombre,
              precio_venta: precioUnitarioConToppings,
              qty: item.cantidad || 1,
              toppings: item.toppings || [],
              variaciones: item.variaciones_seleccionadas || item.variaciones || {},
              notas: item.notas_item || null
            });
          }
        });
      }
    });

    if (todosItems.length > 0) {
      // Consolidar items duplicados (mismo producto, mismo precio, mismos toppings, mismas variaciones)
      const itemsConsolidados = todosItems.reduce((acc, item) => {
        const variacionesKey = JSON.stringify(item.variaciones || {});
        const key = `${item.id}-${item.precio_venta}-${JSON.stringify(item.toppings)}-${variacionesKey}-${item.notas || ''}`;
        const existente = acc.find(i => {
          const iVariacionesKey = JSON.stringify(i.variaciones || {});
          const iKey = `${i.id}-${i.precio_venta}-${JSON.stringify(i.toppings)}-${iVariacionesKey}-${i.notas || ''}`;
          return iKey === key;
        });
        
        if (existente) {
          existente.qty += item.qty;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, []);

      setCart(itemsConsolidados);
      setPedidoIdActual(pedido.id); // Mantener el ID del pedido principal para compatibilidad
      setPedidosConsolidados(pedidosAConsolidar.map(p => p.id)); // Guardar todos los IDs consolidados
      setMostrandoPedidosPendientes(false);
      toast.success(
        pedidosAConsolidar.length > 1 
          ? `${pedidosAConsolidar.length} pedidos consolidados cargados en el carrito`
          : 'Pedido cargado en el carrito'
      );
    } else {
      toast.error('No se pudieron cargar los productos del pedido');
    }
  };

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
      {/* Sección de pedidos pendientes de pago */}
      {pedidosPendientesPago.length > 0 && (
        <div className="caja-pedidos-section">
          <div className="caja-pedidos-header">
            <div className="caja-pedidos-title">
              <CheckCircle size={20} color="#10B981" />
              <h3>Pedidos Listos para Pagar ({pedidosPendientesPago.length})</h3>
            </div>
            <button
              className="caja-pedidos-toggle"
              onClick={() => setMostrandoPedidosPendientes(!mostrandoPedidosPendientes)}
            >
              {mostrandoPedidosPendientes ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          
          {mostrandoPedidosPendientes && (
            <div className="caja-pedidos-list">
              {pedidosPendientesPago.length === 0 ? (
                <p className="caja-pedidos-empty">No hay pedidos listos para pagar</p>
              ) : (
                pedidosPendientesPago.map((pedido) => (
                  <div key={pedido.id} className="caja-pedido-card">
                    <div className="caja-pedido-info">
                      <div className="caja-pedido-header-info">
                        <h4>{pedido.numero_pedido}</h4>
                        {pedido.mesa && (
                          <span className="caja-pedido-mesa">Mesa {pedido.mesa.numero}</span>
                        )}
                      </div>
                      <p className="caja-pedido-items">
                        {pedido.items?.length || 0} {pedido.items?.length === 1 ? 'item' : 'items'}
                      </p>
                      <p className="caja-pedido-total">Total: {formatCOP(pedido.total || 0)}</p>
                    </div>
                    <button
                      className="caja-pedido-cargar-btn"
                      onClick={() => cargarPedidoEnCarrito(pedido)}
                      disabled={!pedido.items || pedido.items.length === 0}
                    >
                      Cargar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

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
            <div className="caja-cart-header-actions">
              <button 
                className="caja-save-quote-btn"
                onClick={handleGuardarCotizacion}
                disabled={guardandoCotizacion}
                title="Guardar como cotización"
              >
                <Save size={16} />
                {guardandoCotizacion ? 'Guardando...' : 'Guardar Cotización'}
              </button>
              <button 
                className="caja-clear-btn"
                onClick={() => {
                  setCart([]);
                  setPedidoIdActual(null);
                  setPedidosConsolidados([]);
                  setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
                  setMostrarFacturaPantalla(false); // Resetear checkbox
                }}
              >
                Vaciar
              </button>
            </div>
          )}
        </div>

        {/* Botón de Cliente */}
        {cart.length > 0 && (
          <div className="caja-cliente-btn-container">
            <button
              className="caja-cliente-btn"
              onClick={() => setMostrandoModalSeleccionCliente(true)}
              title={clienteSeleccionado ? `Cliente: ${clienteSeleccionado.nombre}` : 'Seleccionar cliente'}
            >
              <UserCircle size={18} />
              <span>
                {clienteSeleccionado 
                  ? clienteSeleccionado.nombre.length > 20 
                    ? `${clienteSeleccionado.nombre.substring(0, 20)}...` 
                    : clienteSeleccionado.nombre
                  : 'Cliente (opcional)'}
              </span>
            </button>
            {clienteSeleccionado && (
              <button
                className="caja-cliente-remove-btn"
                onClick={() => setClienteSeleccionado(null)}
                title="Quitar cliente"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}


        <div className="caja-cart-items">
          {cart.length === 0 ? (
            <p className="caja-empty-cart">Aún no has agregado productos.</p>
          ) : (
            <ul className="caja-cart-list">
              {cart.map((item) => {
                // Buscar el producto completo para obtener la imagen
                const productoCompleto = productos.find(p => p.id === item.id);
                return (
                  <li key={item.id} className="caja-cart-item">
                    <div className="caja-cart-item-image">
                      <OptimizedProductImage
                        imagePath={productoCompleto?.imagen}
                        alt={item.nombre}
                        className="caja-cart-item-image-img"
                      />
                    </div>
                    <div className="caja-cart-item-info">
                      <p className="caja-cart-item-name">{item.nombre}</p>
                      {item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0 && (
                        <div className="caja-cart-item-toppings">
                          <span className="caja-cart-item-toppings-label">Extras: </span>
                          <span className="caja-cart-item-toppings-list">
                            {item.toppings.map((topping, idx) => (
                              <span key={idx} className="caja-cart-item-topping-tag">
                                {topping.nombre || topping}
                                {idx < item.toppings.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                      {item.variaciones && Object.keys(item.variaciones).length > 0 && (
                        <div className="caja-cart-item-variaciones">
                          <span className="caja-cart-item-variaciones-label">Variaciones: </span>
                          <span className="caja-cart-item-variaciones-list">
                            {Object.entries(item.variaciones).map(([key, value], idx) => {
                              // Formatear la variación para mostrar
                              const variacionNombre = key;
                              const opcionLabel = typeof value === 'boolean' 
                                ? (value ? 'Sí' : 'No') 
                                : String(value);
                              return (
                                <span key={idx} className="caja-cart-item-variacion-tag">
                                  {variacionNombre}: {opcionLabel}
                                  {idx < Object.keys(item.variaciones).length - 1 && ', '}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      )}
                      {item.notas && (
                        <div className="caja-cart-item-notas">
                          <span className="caja-cart-item-notas-label">Nota: </span>
                          <span className="caja-cart-item-notas-text">{item.notas}</span>
                        </div>
                      )}
                    </div>
                    <div className="caja-cart-item-controls">
                      <button 
                        className="caja-qty-btn caja-qty-btn-minus"
                        onClick={() => dec(item.id)}
                        aria-label="Disminuir cantidad"
                      >
                        <span className="caja-qty-icon">−</span>
                      </button>
                      <span className="caja-qty-display">{item.qty}</span>
                      <button 
                        className="caja-qty-btn caja-qty-btn-plus"
                        onClick={() => inc(item.id)}
                        aria-label="Aumentar cantidad"
                      >
                        <span className="caja-qty-icon">+</span>
                      </button>
                    </div>
                    <div className="caja-cart-item-price-unit">
                      {formatCOP(item.precio_venta)} c/u
                    </div>
                    <div className="caja-cart-item-total">
                      {formatCOP(item.qty * item.precio_venta)}
                    </div>
                    <button 
                      className="caja-remove-btn"
                      onClick={() => removeItem(item.id)}
                      style={{ display: 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="caja-cart-footer">
          <div className="caja-total-breakdown">
            <div className="caja-total-row caja-total-final">
              <span className="caja-total-label">Total</span>
              <span className="caja-total-amount">{formatCOP(total)}</span>
            </div>
          </div>
          
          {/* Checkbox para mostrar factura en pantalla */}
          <div className="caja-factura-checkbox-container">
            <label className="caja-factura-checkbox-label">
              <input
                type="checkbox"
                className="caja-factura-checkbox"
                checked={mostrarFacturaPantalla}
                onChange={(e) => setMostrarFacturaPantalla(e.target.checked)}
              />
              <span className="caja-factura-checkbox-text">Mostrar factura en pantalla</span>
            </label>
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

      {/* Footer fijo en móvil - Oculto cuando el carrito está abierto */}
      {!showCartMobile && (
        <div className="caja-mobile-footer">
        <div className="caja-mobile-total">
          <span className="caja-mobile-total-label">Total</span>
          <span className="caja-mobile-total-amount">{formatCOP(total)}</span>
        </div>
        {cart.length > 0 ? (
          <>
            <button 
              className="caja-mobile-cart-btn"
              onClick={() => setShowCartMobile(true)}
            >
              <ShoppingCart className="caja-mobile-cart-icon" size={18} /> 
              <span className="caja-mobile-cart-text">Carrito ({cart.reduce((n, i) => n + i.qty, 0)})</span>
            </button>
            <button 
              className="caja-mobile-pay-btn"
              onClick={handleContinuar} 
              disabled={cart.length === 0 || procesandoVenta}
            >
              Cobrar
            </button>
          </>
        ) : (
          <div style={{ flex: 1 }}></div>
        )}
        </div>
      )}

      {/* Overlay del carrito en móvil */}
      {showCartMobile && (
        <>
          <div 
            className="caja-mobile-overlay-backdrop"
            onClick={() => setShowCartMobile(false)}
          />
          <div className="caja-mobile-overlay">
          <div className="caja-mobile-cart-header">
            <button 
              className="caja-mobile-back-btn"
              onClick={() => setShowCartMobile(false)}
              aria-label="Volver a productos"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="caja-mobile-cart-title">
              <ShoppingCart className="caja-mobile-cart-icon" /> Carrito
            </h3>
            {cart.length > 0 && (
              <div className="caja-mobile-cart-header-actions">
                <button 
                  className="caja-mobile-clear-all-btn"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
                      setCart([]);
                      setPedidoIdActual(null);
                      setPedidosConsolidados([]);
                      setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
                      setMostrarFacturaPantalla(false); // Resetear checkbox
                    }
                  }}
                  aria-label="Vaciar carrito"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
            {cart.length === 0 && (
              <div style={{ width: '36px' }}></div>
            )}
          </div>

          {/* Botón de Cliente en móvil */}
          {cart.length > 0 && (
            <div className="caja-mobile-cliente-container">
              <button
                className="caja-mobile-cliente-btn"
                onClick={() => setMostrandoModalSeleccionCliente(true)}
                title={clienteSeleccionado ? `Cliente: ${clienteSeleccionado.nombre}` : 'Seleccionar cliente'}
              >
                <UserCircle size={18} />
                <span>
                  {clienteSeleccionado 
                    ? clienteSeleccionado.nombre.length > 25 
                      ? `${clienteSeleccionado.nombre.substring(0, 25)}...` 
                      : clienteSeleccionado.nombre
                    : 'Cliente (opcional)'}
                </span>
                {clienteSeleccionado && (
                  <button
                    className="caja-mobile-cliente-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClienteSeleccionado(null);
                    }}
                    title="Quitar cliente"
                    aria-label="Quitar cliente"
                  >
                    <X size={14} />
                  </button>
                )}
              </button>
            </div>
          )}

          <div className="caja-mobile-cart-content">
            {cart.length === 0 ? (
              <p className="caja-mobile-empty-cart">Aún no has agregado productos.</p>
            ) : (
              <ul className="caja-mobile-cart-list">
                {cart.map((item) => {
                  // Buscar el producto completo para obtener la imagen
                  const productoCompleto = productos.find(p => p.id === item.id);
                  return (
                    <li key={item.id} className="caja-mobile-cart-item">
                      <div className="caja-mobile-cart-item-image">
                        <OptimizedProductImage
                          imagePath={productoCompleto?.imagen}
                          alt={item.nombre}
                          className="caja-mobile-cart-item-image-img"
                        />
                      </div>
                      <div className="caja-mobile-cart-item-content">
                        <p 
                          className="caja-mobile-cart-item-name"
                          title={item.nombre}
                          onClick={(e) => {
                            // En móvil, al hacer tap largo o doble tap, mostrar el nombre completo
                            const element = e.currentTarget;
                            if (element.scrollHeight > element.clientHeight) {
                              // Si el texto está truncado, mostrar tooltip
                              element.classList.add('caja-mobile-cart-item-name-expanded');
                              setTimeout(() => {
                                element.classList.remove('caja-mobile-cart-item-name-expanded');
                              }, 3000);
                            }
                          }}
                        >
                          {item.nombre}
                        </p>
                        {item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0 && (
                          <div className="caja-mobile-cart-item-toppings">
                            <span className="caja-mobile-cart-item-toppings-label">Extras: </span>
                            <span className="caja-mobile-cart-item-toppings-list">
                              {item.toppings.map((topping, idx) => (
                                <span key={idx} className="caja-mobile-cart-item-topping-tag">
                                  {topping.nombre || topping}
                                  {idx < item.toppings.length - 1 && ', '}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                        {item.variaciones && Object.keys(item.variaciones).length > 0 && (
                          <div className="caja-mobile-cart-item-variaciones">
                            <span className="caja-mobile-cart-item-variaciones-label">Variaciones: </span>
                            <span className="caja-mobile-cart-item-variaciones-list">
                              {Object.entries(item.variaciones).map(([key, value], idx) => {
                                // Formatear la variación para mostrar
                                const variacionNombre = key;
                                const opcionLabel = typeof value === 'boolean' 
                                  ? (value ? 'Sí' : 'No') 
                                  : String(value);
                                return (
                                  <span key={idx} className="caja-mobile-cart-item-variacion-tag">
                                    {variacionNombre}: {opcionLabel}
                                    {idx < Object.keys(item.variaciones).length - 1 && ', '}
                                  </span>
                                );
                              })}
                            </span>
                          </div>
                        )}
                        {item.notas && (
                          <div className="caja-mobile-cart-item-notas">
                            <span className="caja-mobile-cart-item-notas-label">Nota: </span>
                            <span className="caja-mobile-cart-item-notas-text">{item.notas}</span>
                          </div>
                        )}
                        <div className="caja-mobile-cart-item-controls">
                          <button 
                            className="caja-mobile-qty-btn caja-mobile-qty-btn-minus"
                            onClick={() => dec(item.id)}
                            aria-label="Disminuir cantidad"
                          >
                            <span className="caja-mobile-qty-icon">−</span>
                          </button>
                          <span className="caja-mobile-qty-display">{item.qty}</span>
                          <button 
                            className="caja-mobile-qty-btn caja-mobile-qty-btn-plus"
                            onClick={() => inc(item.id)}
                            aria-label="Aumentar cantidad"
                          >
                            <span className="caja-mobile-qty-icon">+</span>
                          </button>
                        </div>
                      </div>
                      <div className="caja-mobile-cart-item-price-section">
                        <p className="caja-mobile-cart-item-unit-price">{formatCOP(item.precio_venta)} c/u</p>
                        <p className="caja-mobile-cart-item-total">{formatCOP(item.qty * item.precio_venta)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="caja-mobile-cart-footer">
            <div className="caja-mobile-total-container">
              <span className="caja-mobile-total-label">Total</span>
              <span className="caja-mobile-total-amount">{formatCOP(total)}</span>
            </div>
            
            <div className="caja-mobile-cart-footer-actions">
              <button 
                className="caja-mobile-back-to-products-btn"
                onClick={() => setShowCartMobile(false)}
              >
                <ArrowLeft className="caja-mobile-back-icon" size={16} />
                <span className="caja-mobile-btn-text">Seguir</span>
              </button>
              <button 
                className="caja-mobile-save-quote-footer-btn"
                onClick={handleGuardarCotizacion}
                disabled={cart.length === 0 || guardandoCotizacion}
              >
                <Save className="caja-mobile-save-icon" size={16} />
                <span className="caja-mobile-btn-text">{guardandoCotizacion ? 'Guardando...' : 'Guardar'}</span>
              </button>
              <button 
                className="caja-mobile-confirm-btn"
                onClick={handleContinuar} 
                disabled={cart.length === 0 || procesandoVenta}
              >
                <CheckCircle className="caja-mobile-confirm-icon" size={18} /> 
                <span className="caja-mobile-btn-text">{procesandoVenta ? 'Procesando...' : 'Pagar'}</span>
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Métodos de pago */}
      {mostrandoMetodosPago && <MetodosPago />}

      {/* Pago en efectivo */}
      {mostrandoPagoEfectivo && <PagoEfectivo />}
      {mostrandoPagoMixto && <PagoMixto />}

      {/* Recibo de venta */}
      {ventaCompletada && mostrarFacturaPantalla && (
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

      {/* Modal de selección de cliente */}
      {mostrandoModalSeleccionCliente && (
        <div className="caja-modal-overlay" onClick={() => setMostrandoModalSeleccionCliente(false)}>
          <div className="caja-modal-content caja-modal-seleccion-cliente" onClick={(e) => e.stopPropagation()}>
            <div className="caja-modal-header">
              <h3>Seleccionar Cliente</h3>
              <button 
                className="caja-modal-close"
                onClick={() => setMostrandoModalSeleccionCliente(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="caja-modal-body">
              <div className="caja-cliente-search-modal">
                <Search size={18} className="caja-cliente-search-icon-modal" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, documento, teléfono o email..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                  className="caja-cliente-search-input-modal"
                  autoFocus
                />
              </div>
              
              <div className="caja-cliente-list-modal">
                <button
                  className="caja-cliente-item-modal caja-cliente-item-nuevo"
                  onClick={() => {
                    setMostrandoModalSeleccionCliente(false);
                    setMostrandoModalCliente(true);
                  }}
                >
                  <Plus size={20} />
                  <span>Crear Nuevo Cliente</span>
                </button>
                
                {clientes
                  .filter(cliente => {
                    if (!busquedaCliente.trim()) return true;
                    const query = busquedaCliente.toLowerCase();
                    return (
                      cliente.nombre?.toLowerCase().includes(query) ||
                      cliente.documento?.toLowerCase().includes(query) ||
                      cliente.telefono?.toLowerCase().includes(query) ||
                      cliente.email?.toLowerCase().includes(query)
                    );
                  })
                  .map(cliente => (
                    <button
                      key={cliente.id}
                      className={`caja-cliente-item-modal ${clienteSeleccionado?.id === cliente.id ? 'selected' : ''}`}
                      onClick={() => {
                        setClienteSeleccionado(cliente);
                        setMostrandoModalSeleccionCliente(false);
                        setBusquedaCliente('');
                      }}
                    >
                      <UserCircle size={20} />
                      <div className="caja-cliente-item-info">
                        <span className="caja-cliente-item-nombre">{cliente.nombre}</span>
                        {cliente.documento && (
                          <span className="caja-cliente-item-doc">{cliente.documento}</span>
                        )}
                      </div>
                      {clienteSeleccionado?.id === cliente.id && (
                        <CheckCircle size={18} className="caja-cliente-item-check" />
                      )}
                    </button>
                  ))}
                
                {clientes.filter(cliente => {
                  if (!busquedaCliente.trim()) return false;
                  const query = busquedaCliente.toLowerCase();
                  return (
                    cliente.nombre?.toLowerCase().includes(query) ||
                    cliente.documento?.toLowerCase().includes(query) ||
                    cliente.telefono?.toLowerCase().includes(query) ||
                    cliente.email?.toLowerCase().includes(query)
                  );
                }).length === 0 && busquedaCliente.trim() && (
                  <div className="caja-cliente-no-results">
                    <p>No se encontraron clientes</p>
                    <button
                      className="caja-cliente-btn-crear-desde-busqueda"
                      onClick={() => {
                        setMostrandoModalSeleccionCliente(false);
                        setMostrandoModalCliente(true);
                      }}
                    >
                      <Plus size={16} />
                      Crear Nuevo Cliente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar cliente */}
      {mostrandoModalCliente && (
        <div className="caja-modal-overlay" onClick={() => setMostrandoModalCliente(false)}>
          <div className="caja-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="caja-modal-header">
              <h3>Agregar Nuevo Cliente</h3>
              <button 
                className="caja-modal-close"
                onClick={() => setMostrandoModalCliente(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="caja-modal-body">
              <div className="caja-cliente-form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="caja-cliente-form-group">
                <label>Documento</label>
                <input
                  type="text"
                  value={nuevoCliente.documento}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, documento: e.target.value })}
                  placeholder="Cédula, NIT, etc."
                />
              </div>
              <div className="caja-cliente-form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  placeholder="Teléfono de contacto"
                />
              </div>
              <div className="caja-cliente-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="caja-cliente-form-group">
                <label>Dirección</label>
                <textarea
                  value={nuevoCliente.direccion}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  placeholder="Dirección"
                  rows={3}
                />
              </div>
            </div>
            <div className="caja-modal-footer">
              <button
                className="caja-modal-btn-secondary"
                onClick={() => {
                  setMostrandoModalCliente(false);
                  setNuevoCliente({ nombre: '', documento: '', telefono: '', email: '', direccion: '' });
                }}
              >
                Cancelar
              </button>
              <button
                className="caja-modal-btn-primary"
                onClick={async () => {
                  if (!nuevoCliente.nombre.trim()) {
                    toast.error('El nombre es requerido');
                    return;
                  }
                  
                  try {
                    const clienteData = {
                      organization_id: organization.id,
                      ...nuevoCliente
                    };
                    const nuevoClienteCreado = await crearClienteMutation.mutateAsync(clienteData);
                    setClienteSeleccionado(nuevoClienteCreado);
                    setMostrandoModalCliente(false);
                    setMostrandoModalSeleccionCliente(false);
                    setNuevoCliente({ nombre: '', documento: '', telefono: '', email: '', direccion: '' });
                  } catch (error) {
                    console.error('Error creando cliente:', error);
                  }
                }}
                disabled={crearClienteMutation.isLoading}
              >
                {crearClienteMutation.isLoading ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}