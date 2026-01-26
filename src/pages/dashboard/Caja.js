import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useProductos } from '../../hooks/useProductos';
import { useToppings } from '../../hooks/useToppings';
import { useGuardarCotizacion, useActualizarCotizacion } from '../../hooks/useCotizaciones';
import { generarCodigoVenta } from '../../utils/generarCodigoVenta';
import { useClientes, useCrearCliente } from '../../hooks/useClientes';
import { usePedidos, useActualizarPedido, useCrearPedido } from '../../hooks/usePedidos';
import { useAperturaCajaActiva } from '../../hooks/useAperturasCaja';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import ReciboVenta from '../../components/business/ReciboVenta';
import ConfirmacionVenta from '../../components/business/ConfirmacionVenta';
import AperturaCajaModal from '../../components/modals/AperturaCajaModal';
import DescuentoModal from '../../components/modals/DescuentoModal';
import ToppingsSelector from '../../components/ToppingsSelector';
import VariacionesSelector from '../../components/VariacionesSelector';
import { ShoppingCart, Trash2, Search, CheckCircle, CreditCard, Banknote, Smartphone, Wallet, ArrowLeft, Save, Plus, X, UserCircle, Lock, Percent, List, ArrowRight, Package } from 'lucide-react';
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

export default function Caja({ 
  mode = 'venta', // 'venta' | 'pedido'
  // Props para modo pedido
  tipoPedido = null,
  mesaSeleccionada = null,
  clienteNombre = '',
  clienteTelefono = '',
  direccionEntrega = '',
  costoEnvio = '0',
  horaEstimada = '',
  numeroPersonas = '',
  notas = '',
  onPedidoGuardado = null, // Callback cuando se guarda el pedido
  onCancelar = null // Callback para cancelar
}) {
  const { user, organization } = useAuth();
  const { hasFeature, canPerformAction } = useSubscription();
  const navigate = useNavigate();
  
  const esModoPedido = mode === 'pedido';
  const [query, setQuery] = useState("");
  const [queryPedidos, setQueryPedidos] = useState(""); // Buscador para pedidos listos para pagar
  const [cart, setCart] = useState([]);
  const [method, setMethod] = useState("Efectivo");
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [mostrandoMetodosPago, setMostrandoMetodosPago] = useState(false);
  const [mostrandoPagoEfectivo, setMostrandoPagoEfectivo] = useState(false);
  const [mostrandoPagoMixto, setMostrandoPagoMixto] = useState(false);
  const [montoEntregado, setMontoEntregado] = useState('');
  const [mostrandoOpcionPagoPedido, setMostrandoOpcionPagoPedido] = useState(false);
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
  // Leer preferencia de mostrar factura desde user_metadata
  const mostrarFacturaPantalla = user?.user_metadata?.mostrarFacturaPantalla === true;
  const [mostrarModalRegresarPedidos, setMostrarModalRegresarPedidos] = useState(false);
  const [vieneDePedidos, setVieneDePedidos] = useState(false);
  const [mostrarModalApertura, setMostrarModalApertura] = useState(false);
  const [mostrarModalDescuento, setMostrarModalDescuento] = useState(false);
  const [descuento, setDescuento] = useState({
    tipo: 'porcentaje', // 'porcentaje' o 'fijo'
    valor: 0,
    alcance: 'total', // 'total' o 'productos'
    productosIds: [] // IDs de productos con descuento
  });
  
  // Estados para selectores de toppings y variaciones
  const [mostrandoToppingsSelector, setMostrandoToppingsSelector] = useState(false);
  const [productoParaToppings, setProductoParaToppings] = useState(null);
  const [mostrandoVariacionesSelector, setMostrandoVariacionesSelector] = useState(false);
  const [productoParaVariaciones, setProductoParaVariaciones] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);
  const [variacionesSeleccionadas, setVariacionesSeleccionadas] = useState({});
  
  // Verificar si hay una apertura de caja activa (solo en modo venta)
  const { data: aperturaActiva, isLoading: cargandoApertura, refetch: refetchApertura } = useAperturaCajaActiva(
    esModoPedido ? null : organization?.id // No verificar apertura en modo pedido
  );
  
  // En modo pedido, forzar aperturaActiva a null para evitar problemas
  const aperturaActivaFinal = esModoPedido ? null : aperturaActiva;
  
  // Mostrar modal de apertura automáticamente solo una vez al cargar si no hay apertura activa (solo en modo venta)
  const [modalMostradoInicialmente, setModalMostradoInicialmente] = useState(false);
  const [modalCerradoManualmente, setModalCerradoManualmente] = useState(false);
  
  useEffect(() => {
    // En modo pedido, no verificar apertura de caja
    if (esModoPedido) return;
    
    // Si hay una apertura activa, asegurarse de que el modal esté cerrado y resetear estados
    if (aperturaActivaFinal && mostrarModalApertura) {
      setMostrarModalApertura(false);
      setModalCerradoManualmente(false);
      setModalMostradoInicialmente(false);
    }
    
    // Si NO hay apertura activa (después de un cierre), resetear el estado para permitir nueva apertura
    if (!cargandoApertura && !aperturaActivaFinal && organization?.id) {
      // Si había una apertura antes y ahora no hay, significa que se cerró la caja
      // Resetear el estado para permitir que se muestre el modal de apertura nuevamente
      if (modalMostradoInicialmente) {
        // Esperar un momento para evitar que se muestre inmediatamente después del cierre
        const timer = setTimeout(() => {
          setModalMostradoInicialmente(false);
          setModalCerradoManualmente(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
    
    // Solo mostrar el modal automáticamente si:
    // 1. No está cargando
    // 2. No hay apertura activa
    // 3. Hay organización
    // 4. No se ha mostrado inicialmente
    // 5. El modal no está ya abierto manualmente
    // 6. El usuario no lo cerró manualmente
    if (!cargandoApertura && !aperturaActivaFinal && organization?.id && !modalMostradoInicialmente && !mostrarModalApertura && !modalCerradoManualmente) {
      setMostrarModalApertura(true);
      setModalMostradoInicialmente(true);
    }
  }, [cargandoApertura, aperturaActivaFinal, organization?.id, modalMostradoInicialmente, mostrarModalApertura, modalCerradoManualmente, esModoPedido]);
  
  // Cerrar automáticamente el carrito móvil cuando esté vacío
  useEffect(() => {
    if (cart.length === 0 && showCartMobile) {
      setShowCartMobile(false);
    }
  }, [cart.length, showCartMobile]);
  
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
  const crearPedido = useCrearPedido();
  
  // Filtrar pedidos listos para pago (solo estado "listo", excluir "completado", excluir sin items)
  // Excluir pedidos con pago_inmediato o con venta_id (ya fueron pagados)
  const pedidosPendientesPago = useMemo(() => {
    const pedidosFiltrados = todosPedidos.filter(p => 
      p.estado === 'listo' && 
      !p.pago_inmediato &&
      !p.venta_id && // Excluir pedidos que ya tienen una venta asociada (ya fueron pagados)
      p.items && 
      Array.isArray(p.items) && 
      p.items.length > 0
    );
    
    // Aplicar filtro de búsqueda si existe
    if (!queryPedidos.trim()) {
      return pedidosFiltrados;
    }
    
    const queryLower = queryPedidos.toLowerCase().trim();
    return pedidosFiltrados.filter(p => {
      // Buscar por número de pedido
      if (p.numero_pedido?.toLowerCase().includes(queryLower)) return true;
      // Buscar por nombre de cliente
      if (p.cliente_nombre?.toLowerCase().includes(queryLower)) return true;
      // Buscar por teléfono de cliente
      if (p.cliente_telefono?.toString().includes(queryLower)) return true;
      // Buscar por número de mesa
      if (p.mesa?.numero?.toString().includes(queryLower)) return true;
      return false;
    });
  }, [todosPedidos, queryPedidos]);
  
  const [mostrandoPedidosPendientes, setMostrandoPedidosPendientes] = useState(false);
  const [pedidoIdActual, setPedidoIdActual] = useState(null);
  const [pedidosConsolidados, setPedidosConsolidados] = useState([]); // IDs de todos los pedidos consolidados
  
  // Agrupar pedidos por mesa (solo mesas con más de un pedido)
  const pedidosPorMesa = useMemo(() => {
    const agrupados = {};
    pedidosPendientesPago.forEach(pedido => {
      // Verificar si tiene mesa (puede ser mesa.id o mesa_id)
      const mesaId = pedido.mesa?.id || pedido.mesa_id;
      if (mesaId) {
        if (!agrupados[mesaId]) {
          agrupados[mesaId] = {
            mesa: pedido.mesa || { id: mesaId, numero: pedido.mesa?.numero || 'Sin número' },
            pedidos: []
          };
        }
        agrupados[mesaId].pedidos.push(pedido);
      }
    });
    // Filtrar solo las mesas que tienen más de un pedido
    const agrupadosFiltrados = {};
    Object.keys(agrupados).forEach(mesaId => {
      if (agrupados[mesaId].pedidos.length > 1) {
        agrupadosFiltrados[mesaId] = agrupados[mesaId];
      }
    });
    return agrupadosFiltrados;
  }, [pedidosPendientesPago]);
  
  // Pedidos individuales (sin mesa o con mesa que tiene solo un pedido)
  const pedidosIndividuales = useMemo(() => {
    // Primero obtener todas las mesas agrupadas (sin filtrar)
    const todasLasMesas = {};
    pedidosPendientesPago.forEach(pedido => {
      const mesaId = pedido.mesa?.id || pedido.mesa_id;
      if (mesaId) {
        if (!todasLasMesas[mesaId]) {
          todasLasMesas[mesaId] = [];
        }
        todasLasMesas[mesaId].push(pedido);
      }
    });
    
    // Filtrar pedidos que:
    // 1. No tienen mesa, O
    // 2. Tienen mesa pero solo hay un pedido en esa mesa
    return pedidosPendientesPago.filter(p => {
      const mesaId = p.mesa?.id || p.mesa_id;
      if (!mesaId) return true; // Sin mesa, mostrar individual
      return todasLasMesas[mesaId]?.length === 1; // Con mesa pero solo un pedido
    });
  }, [pedidosPendientesPago]);
  
  // Función para cargar todos los pedidos de una mesa
  // Puede recibir un array de pedidos directamente o un mesaId para buscarlos
  const cargarTodosPedidosMesa = (pedidosOMesaId) => {
    let pedidosMesa = [];
    
    // Si es un array, usar directamente
    if (Array.isArray(pedidosOMesaId)) {
      pedidosMesa = pedidosOMesaId;
    } else {
      // Si es un ID, buscar los pedidos
      const mesaId = pedidosOMesaId;
      const mesaIdStr = String(mesaId);
      
      // Buscar en pedidosPorMesa primero
      const grupo = Object.values(pedidosPorMesa).find(g => {
        const gMesaId = g.mesa?.id || g.mesa_id;
        return gMesaId && String(gMesaId) === mesaIdStr;
      });
      
      if (grupo && grupo.pedidos) {
        pedidosMesa = grupo.pedidos;
      } else {
        // Si no se encuentra en pedidosPorMesa, buscar en pedidosPendientesPago
        pedidosMesa = pedidosPendientesPago.filter(p => {
          const pMesaId = p.mesa?.id || p.mesa_id;
          return pMesaId && String(pMesaId) === mesaIdStr;
        });
      }
    }
    
    if (pedidosMesa.length === 0) {
      toast.error('No se encontraron pedidos para esta mesa');
      return;
    }
    
    // Usar la misma lógica de consolidación que cargarPedidoEnCarrito
    const todosItems = [];
    pedidosMesa.forEach(p => {
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
      // Consolidar items duplicados
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
      setPedidoIdActual(pedidosMesa[0].id); // Mantener el ID del primer pedido para compatibilidad
      setPedidosConsolidados(pedidosMesa.map(p => p.id));
      setMostrandoPedidosPendientes(false);
      toast.success(`${pedidosMesa.length} pedido${pedidosMesa.length > 1 ? 's' : ''} de la mesa ${pedidosMesa[0].mesa.numero} cargado${pedidosMesa.length > 1 ? 's' : ''}`);
    } else {
      toast.error('No se pudieron cargar los productos de los pedidos');
    }
  };

  // Detectar tamaño de pantalla y mostrar automáticamente pedidos en pantallas amplias
  useEffect(() => {
    const checkScreenSize = () => {
      const wide = window.innerWidth >= 769; // Tablet y desktop
      setIsWideScreen(wide);
      
      // En pantallas amplias, siempre mostrar los pedidos cuando hay pedidos disponibles
      if (wide && pedidosPendientesPago.length > 0) {
        setMostrandoPedidosPendientes(true);
      }
    };
    
    // Verificar al cargar y cuando cambie el tamaño de pantalla
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [pedidosPendientesPago.length]);
  
  // Asegurar que en pantallas amplias siempre se muestren los pedidos si hay pedidos disponibles
  useEffect(() => {
    if (isWideScreen && pedidosPendientesPago.length > 0 && !mostrandoPedidosPendientes) {
      setMostrandoPedidosPendientes(true);
    }
  }, [isWideScreen, pedidosPendientesPago.length, mostrandoPedidosPendientes]);

  // Cargar productos usando React Query (optimizado con cache)
  const { data: productosData = [], isLoading: productosLoading } = useProductos(organization?.id);
  
  // Cargar toppings para mostrarlos como productos individuales
  const { data: toppingsData = [], isLoading: toppingsLoading } = useToppings(organization?.id);
  
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
  
  // Combinar productos y toppings usando useMemo para evitar actualizaciones infinitas
  const productosCombinados = useMemo(() => {
    let productos = [];
    
    // Agregar productos
    if (productosData.length > 0) {
      // El hook useProductos ya filtra por organization_id en la consulta
      // Agregamos un filtro adicional de seguridad para asegurar que solo se muestren
      // productos de la organización actual (por si algún producto tiene organization_id incorrecto)
      if (organization?.id) {
        const productosFiltrados = productosData.filter(
          p => p.organization_id && String(p.organization_id) === String(organization.id)
        );
        // Si después del filtro no quedan productos, usar los originales (el hook ya filtró)
        // Esto previene que se eliminen todos los productos si hay un problema con el filtro
        productos = productosFiltrados.length > 0 ? productosFiltrados : productosData;
      } else {
        productos = productosData;
      }
    }
    
    // Agregar toppings como productos individuales
    if (toppingsData.length > 0) {
      const toppingsComoProductos = toppingsData.map(topping => ({
        id: `topping_${topping.id}`, // Prefijo para identificar que es un topping
        nombre: topping.nombre,
        precio_venta: topping.precio || 0,
        precio_compra: topping.precio_compra || 0,
        stock: topping.stock,
        imagen: topping.imagen_url || null,
        organization_id: topping.organization_id,
        es_topping: true, // Flag para identificar que es un topping
        topping_id: topping.id, // ID original del topping
        categoria: topping.categoria || 'general',
        tipo: topping.tipo || 'comida'
      }));
      productos = [...productos, ...toppingsComoProductos];
    }
    
    return productos;
  }, [productosData, toppingsData, organization?.id]);

  // Actualizar productos y estado de carga solo cuando cambien los datos combinados
  useEffect(() => {
    setProductos(productosCombinados);
    setCargando(productosLoading || toppingsLoading);
  }, [productosCombinados, productosLoading, toppingsLoading]);

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
          // Marcar que viene de pedidos
          setVieneDePedidos(true);
          
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
        localStorage.removeItem('cotizacionRetomar');
      }
    }
  }, [productos, clientes]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => {
      // Buscar por nombre
      if (p.nombre?.toLowerCase().includes(q)) return true;
      // Buscar por código de barras (parcial)
      if (p.codigo?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, productos]);

  // Calcular subtotal incluyendo precios de toppings
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      // Precio base del producto
      const precioBase = item.precio_venta || item.price || 0;
      const cantidad = typeof item.qty === 'number' ? item.qty : 0;
      
      // Sumar precio de toppings (considerando cantidad de cada topping)
      let precioToppings = 0;
      if (item.toppings && Array.isArray(item.toppings)) {
        precioToppings = item.toppings.reduce((toppingSum, topping) => {
          const precioTopping = topping.precio || topping.precio_venta || 0;
          const cantidadTopping = topping.cantidad || 1; // Si no tiene cantidad, asumir 1
          return toppingSum + (precioTopping * cantidadTopping);
        }, 0);
      }
      
      // Precio total del item (producto + toppings) * cantidad del producto
      const precioItemTotal = (precioBase + precioToppings) * cantidad;
      
      return sum + precioItemTotal;
    }, 0);
  }, [cart]);
  
  // Calcular descuento
  const montoDescuento = useMemo(() => {
    if (!descuento.valor || descuento.valor <= 0) return 0;
    
    if (descuento.alcance === 'total') {
      // Descuento sobre el total
      if (descuento.tipo === 'porcentaje') {
        return (subtotal * descuento.valor) / 100;
      } else {
        // Descuento fijo
        return Math.min(descuento.valor, subtotal);
      }
    } else {
      // Descuento sobre productos específicos
      let descuentoProductos = 0;
      cart.forEach(item => {
        if (descuento.productosIds.includes(item.id)) {
          const itemSubtotal = (typeof item.qty === 'number' ? item.qty : 0) * item.precio_venta;
          if (descuento.tipo === 'porcentaje') {
            descuentoProductos += (itemSubtotal * descuento.valor) / 100;
          } else {
            // Descuento fijo por producto (se divide entre la cantidad de productos con descuento)
            const descuentoPorItem = descuento.valor / descuento.productosIds.length;
            descuentoProductos += Math.min(descuentoPorItem, itemSubtotal);
          }
        }
      });
      return descuentoProductos;
    }
  }, [subtotal, descuento, cart]);
  
  const total = useMemo(() => Math.max(0, subtotal - montoDescuento), [subtotal, montoDescuento]);

  const addToCartRef = useRef(null);
  
  function addToCart(producto) {
    // Si se agrega un producto manualmente (no desde un pedido), resetear el flag
    if (!esModoPedido) {
      setVieneDePedidos(false);
    }
    // Verificar stock disponible
    const stockDisponible = producto.stock;
    const itemEnCarrito = cart.find(item => item.id === producto.id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.qty : 0;
    
    if (cantidadEnCarrito >= stockDisponible) {
      toast.error(`No hay suficiente stock. Disponible: ${parseFloat(stockDisponible).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
      return;
    }

    // Si el producto es un topping, agregarlo directamente sin mostrar selector de toppings
    const esTopping = producto.es_topping || (typeof producto.id === 'string' && producto.id.startsWith('topping_'));
    if (esTopping) {
      // Agregar directamente al carrito sin toppings adicionales
      agregarProductoConToppingsYVariaciones(producto, [], {});
      return;
    }

    // Verificar si el producto permite toppings (por defecto true si no está definido)
    const permiteToppings = producto.metadata?.permite_toppings !== undefined 
      ? producto.metadata.permite_toppings 
      : true;
    
    // Verificar si el producto tiene variaciones
    const tieneVariaciones = producto.metadata?.variaciones_config && producto.metadata.variaciones_config.length > 0;
    
    // Si tiene variaciones, mostrar selector de variaciones primero
    if (tieneVariaciones) {
      setProductoParaVariaciones(producto);
      setProductoParaToppings(producto); // Guardar producto para después de variaciones
      setMostrandoVariacionesSelector(true);
      return;
    }
    
    // Si permite toppings, mostrar selector de toppings
    if (permiteToppings) {
      setProductoParaToppings(producto);
      setMostrandoToppingsSelector(true);
    } else {
      // Si no permite toppings, agregar directamente al carrito
      agregarProductoConToppingsYVariaciones(producto, [], {});
    }
  }
  
  // Guardar referencia a addToCart para usar en el hook de código de barras
  addToCartRef.current = addToCart;
  
  // Hook para detectar código de barras
  const handleBarcodeScanned = useCallback((barcode) => {
    // Buscar producto por código de barras exacto
    const producto = productos.find(p => 
      p.codigo && p.codigo.toLowerCase() === barcode.toLowerCase()
    );
    
    if (producto && addToCartRef.current) {
      // Agregar al carrito automáticamente
      addToCartRef.current(producto);
      // Limpiar búsqueda después de un pequeño delay
      setTimeout(() => {
        setQuery('');
        // El foco se mantendrá automáticamente por el hook
      }, 100);
      toast.success(`Producto agregado: ${producto.nombre}`);
    } else {
      // Si no se encuentra, buscar por código parcial
      setQuery(barcode);
      toast('Producto no encontrado por código de barras', { icon: '⚠️' });
    }
  }, [productos]);
  
  const { inputRef: barcodeInputRef, handleKeyDown: handleBarcodeKeyDown, handleInputChange: handleBarcodeInputChange } = useBarcodeScanner(handleBarcodeScanned, {
    minLength: 3,
    maxTimeBetweenChars: 100
  });
  
  // Función para agregar producto al carrito después de seleccionar toppings y variaciones
  const agregarProductoConToppingsYVariaciones = (producto, toppings = [], variaciones = {}) => {
    // Si se agrega un producto manualmente (no desde un pedido), resetear el flag
    if (!esModoPedido) {
      setVieneDePedidos(false);
    }
    // Verificar stock disponible
    const stockDisponible = producto.stock;
    const itemEnCarrito = cart.find(item => {
      // Comparar por ID, toppings y variaciones para determinar si es el mismo item
      if (item.id !== producto.id) return false;
      
      // Comparar toppings
      const toppingsItem = JSON.stringify((item.toppings || []).map(t => t.id || t).sort());
      const toppingsNuevo = JSON.stringify(toppings.map(t => t.id || t).sort());
      if (toppingsItem !== toppingsNuevo) return false;
      
      // Comparar variaciones
      const variacionesItem = JSON.stringify(item.variaciones || {});
      const variacionesNuevo = JSON.stringify(variaciones);
      if (variacionesItem !== variacionesNuevo) return false;
      
      return true;
    });
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.qty : 0;
    
    if (cantidadEnCarrito >= stockDisponible) {
      toast.error(`No hay suficiente stock. Disponible: ${parseFloat(stockDisponible).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((i) => {
        if (i.id !== producto.id) return false;
        const toppingsItem = JSON.stringify((i.toppings || []).map(t => t.id || t).sort());
        const toppingsNuevo = JSON.stringify(toppings.map(t => t.id || t).sort());
        if (toppingsItem !== toppingsNuevo) return false;
        const variacionesItem = JSON.stringify(i.variaciones || {});
        const variacionesNuevo = JSON.stringify(variaciones);
        return variacionesItem === variacionesNuevo;
      });
      
      if (idx >= 0) {
        // Si ya existe, aumentar cantidad y mover al inicio
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        // Mover al inicio
        const item = next.splice(idx, 1)[0];
        return [item, ...next];
      }
      
      // Si es nuevo, agregarlo al inicio con toppings y variaciones
      return [{ 
        id: producto.id, 
        nombre: producto.nombre, 
        precio_venta: producto.precio_venta, 
        qty: 1,
        toppings: toppings,
        variaciones: variaciones,
        notas: null // Inicializar notas como null
      }, ...prev];
    });
  }
  
  // Función para actualizar notas de un item del carrito
  const actualizarNotasItem = (itemId, notas, itemIndex, toppings, variaciones) => {
    setCart((prev) => prev.map((item, index) => {
      // Comparar por ID, toppings, variaciones e índice para identificar el item correcto
      if (item.id !== itemId) return item;
      
      const toppingsItem = JSON.stringify((item.toppings || []).map(t => t.id || t).sort());
      const toppingsParam = JSON.stringify((toppings || []).map(t => t.id || t).sort());
      if (toppingsItem !== toppingsParam) return item;
      
      const variacionesItem = JSON.stringify(item.variaciones || {});
      const variacionesParam = JSON.stringify(variaciones || {});
      if (variacionesItem !== variacionesParam) return item;
      
      // Si el índice coincide, actualizar las notas
      if (index === itemIndex) {
        return { ...item, notas: notas };
      }
      
      return item;
    }));
  };

  const inc = (id) => {
    console.log('INC llamado para id:', id);
    console.log('Cart actual:', cart);
    console.log('Productos disponibles:', productos);
    
    const itemEnCarrito = cart.find(item => String(item.id) === String(id));
    console.log('Item en carrito encontrado:', itemEnCarrito);
    
    if (!itemEnCarrito) {
      console.error('Item no encontrado en carrito para id:', id);
      return;
    }
    
    const producto = productos.find(p => String(p.id) === String(id));
    console.log('Producto encontrado:', producto);
    
    if (itemEnCarrito && producto && producto.stock !== undefined && itemEnCarrito.qty >= producto.stock) {
      toast.error(`No hay suficiente stock. Disponible: ${parseFloat(producto.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
      return;
    }
    
    setCart((prev) => {
      const itemIndex = prev.findIndex(i => String(i.id) === String(id));
      console.log('Índice del item en carrito:', itemIndex);
      
      if (itemIndex === -1) {
        console.error('Item no encontrado en carrito durante actualización');
        return prev; // No hacer nada si no se encuentra el item
      }
      
      const updated = prev.map((i) => {
        if (String(i.id) === String(id)) {
          const nuevaCantidad = (i.qty || 0) + 1;
          console.log('Incrementando cantidad de', i.qty, 'a', nuevaCantidad);
          return { ...i, qty: nuevaCantidad };
        }
        return i;
      });
      
      console.log('INC - Carrito actualizado:', updated);
      return updated;
    });
  };
  
  const dec = (id) => {
    console.log('DEC llamado para id:', id);
    setCart((prev) => {
      const updated = prev.map((i) => 
        i.id === id ? { ...i, qty: (i.qty || 0) - 1 } : i
      );
      // Eliminar productos con cantidad 0 o menor
      const filtered = updated.filter((i) => i.qty > 0);
      console.log('DEC - Carrito actualizado:', filtered);
      return filtered;
    });
  };

  const updateQty = (id, newQty) => {
    const producto = productos.find(p => p.id === id);
    const qty = parseInt(newQty, 10);
    
    if (isNaN(qty) || qty < 1) {
      // Si no es un número válido o es menor a 1, eliminar del carrito
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    
    if (producto && qty > producto.stock) {
      toast.error(`No hay suficiente stock. Disponible: ${parseFloat(producto.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
      // Mantener la cantidad anterior si excede el stock
      const itemEnCarrito = cart.find(item => item.id === id);
      if (itemEnCarrito) {
        setCart((prev) => prev.map((i) => 
          i.id === id ? { ...i, qty: itemEnCarrito.qty } : i
        ));
      }
      return;
    }
    
    setCart((prev) => prev.map((i) => 
      i.id === id ? { ...i, qty: qty } : i
    ));
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const handleNuevaVenta = () => {
    setPedidoIdActual(null);
    setPedidosConsolidados([]);
    setVentaCompletada(null);
    setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
    setMostrandoMetodosPago(false);
  };

  const handleContinuar = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    
    // En modo pedido, mostrar opción de pagar ahora o después
    if (esModoPedido) {
      setMostrandoOpcionPagoPedido(true);
    } else {
      setMostrandoMetodosPago(true);
    }
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
      setVieneDePedidos(false); // Resetear flag cuando se vacía el carrito
      setQuery('');
      localStorage.removeItem('cotizacionOriginal');
    } catch (error) {
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
          
          {hasFeature('multiplePaymentMethods') ? (
            <>
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
            </>
          ) : (
            <>
              <button 
                className="metodo-pago-card metodo-pago-card-locked"
                onClick={() => toast.error('Los métodos de pago adicionales están disponibles en el plan Estándar')}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                <Lock className="metodo-pago-icon" size={32} />
                <span className="metodo-pago-label">Transferencia</span>
                <span className="metodo-pago-desc">🔒 Plan Estándar</span>
              </button>
              
              <button 
                className="metodo-pago-card metodo-pago-card-locked"
                onClick={() => toast.error('Los métodos de pago adicionales están disponibles en el plan Estándar')}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                <Lock className="metodo-pago-icon" size={32} />
                <span className="metodo-pago-label">Nequi</span>
                <span className="metodo-pago-desc">🔒 Plan Estándar</span>
              </button>
            </>
          )}
          
          {hasFeature('mixedPayments') ? (
            <button 
              className={`metodo-pago-card ${metodoSeleccionado === 'Mixto' ? 'selected' : ''}`}
              onClick={() => setMetodoSeleccionado('Mixto')}
            >
              <Wallet className="metodo-pago-icon" size={32} />
              <span className="metodo-pago-label">Mixto</span>
              <span className="metodo-pago-desc">Varios métodos</span>
            </button>
          ) : (
            <button 
              className="metodo-pago-card metodo-pago-card-locked"
              onClick={() => toast.error('Los pagos mixtos están disponibles en el plan Estándar')}
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              <Lock className="metodo-pago-icon" size={32} />
              <span className="metodo-pago-label">Mixto</span>
              <span className="metodo-pago-desc">🔒 Plan Estándar</span>
            </button>
          )}
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

  // Función para procesar el pago de un pedido ya creado
  const procesarPagoConPedido = async (pedidoId, metodoPago, detallesPago = null) => {
    if (!user || !organization) {
      toast.error('Error: No hay usuario u organización activa');
      setProcesandoVenta(false);
      return;
    }

    // Verificar límite de ventas antes de confirmar
    const canCreateSale = await canPerformAction('createSale');
    if (!canCreateSale.allowed) {
      toast.error(canCreateSale.reason || 'Has alcanzado el límite de ventas este mes. Actualiza tu plan.');
      setProcesandoVenta(false);
      return;
    }

    // Verificar si hay una apertura de caja activa
    if (!aperturaActivaFinal) {
      toast.error('Debes abrir la caja antes de realizar ventas');
      setMostrarModalApertura(true);
      setProcesandoVenta(false);
      return;
    }

    setProcesandoVenta(true);

    // Usar el método pasado como parámetro o el estado actual
    const metodoActual = metodoPago || method;

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
    } else if (metodoActual === "Mixto" && detallesPago) {
      metodoPagoFinal = `Mixto (${detallesPago.metodo1}: ${formatCOP(detallesPago.monto1)} + ${detallesPago.metodo2}: ${formatCOP(detallesPago.monto2)})`;
      montoPagoCliente = detallesPago.monto1 + detallesPago.monto2;
    }

    try {
      // Generar código de venta
      const numeroVenta = await generarCodigoVenta(organization.id, metodoPagoFinal, false);
      
      // Guardar la venta en la base de datos
      const ventaData = {
        organization_id: organization.id,
        user_id: user.id,
        total: total,
        subtotal: subtotal,
        descuento: montoDescuento > 0 ? {
          tipo: descuento.tipo,
          valor: descuento.valor,
          monto: montoDescuento,
          alcance: descuento.alcance,
          productosIds: descuento.productosIds
        } : null,
        metodo_pago: metodoPagoFinal,
        items: cart,
        fecha: new Date().toISOString(),
        pago_cliente: montoPagoCliente,
        detalles_pago_mixto: metodoActual === "Mixto" && detallesPago ? detallesPago : null,
        numero_venta: numeroVenta,
        cliente_id: clienteSeleccionado?.id || null
      };
      
      const { data: ventaResult, error: ventaError } = await supabase
        .from('ventas')
        .insert([ventaData])
        .select()
        .single();

      if (ventaError) {
        toast.error(`Error al guardar la venta: ${ventaError.message}`);
        setProcesandoVenta(false);
        return;
      }

      // Actualizar todos los pedidos consolidados: asociar la venta pero mantener el estado actual
      // Los pedidos se marcarán como "completados" cuando se finalice la preparación
      const pedidosAActualizar = pedidosConsolidados.length > 0 ? pedidosConsolidados : [pedidoId];
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({
          venta_id: ventaResult.id
          // NO cambiar el estado aquí, se cambiará cuando se finalice la preparación
        })
        .in('id', pedidosAActualizar);

      if (pedidoError) {
        console.error('Error actualizando pedido:', pedidoError);
        // No fallar si no se puede actualizar el pedido, la venta ya se guardó
      }

      // Actualizar stock de productos y toppings
      for (const item of cart) {
        // Si es un topping individual, actualizar stock en la tabla toppings
        if (item.es_topping || (typeof item.id === 'string' && item.id.startsWith('topping_'))) {
          const toppingId = item.topping_id || (typeof item.id === 'string' && item.id.startsWith('topping_') ? item.id.replace('topping_', '') : item.id);
          
          // Obtener el topping actual para verificar stock
          const { data: topping, error: toppingError } = await supabase
            .from('toppings')
            .select('stock')
            .eq('id', toppingId)
            .single();
          
          if (!toppingError && topping && topping.stock !== null && topping.stock !== undefined) {
            const nuevoStock = topping.stock - item.qty;
            const { error: stockError } = await supabase
              .from('toppings')
              .update({ stock: nuevoStock })
              .eq('id', toppingId);
            
            if (stockError) {
              console.error(`Error al actualizar el stock del topping ${item.nombre}:`, stockError);
              toast.error(`Error al actualizar el stock de ${item.nombre}. La venta se guardó pero el stock no se actualizó.`);
            }
          }
        } else {
          // Es un producto normal
          // Primero intentar obtener el producto del array, si no está, obtenerlo de la BD
          let producto = productos.find(p => p.id === item.id);
          
          // Si no está en el array, obtenerlo directamente de la BD
          if (!producto) {
            const { data: productoBD, error: productoBDError } = await supabase
              .from('productos')
              .select('id, nombre, stock, metadata')
              .eq('id', item.id)
              .single();
            
            if (!productoBDError && productoBD) {
              producto = productoBD;
            }
          }
          
          if (producto && producto.stock !== null && producto.stock !== undefined) {
            const nuevoStock = producto.stock - item.qty;
            const { error: stockError } = await supabase
              .from('productos')
              .update({ stock: nuevoStock })
              .eq('id', item.id);
            
            if (stockError) {
              console.error(`Error al actualizar el stock de ${item.nombre}:`, stockError);
              toast.error(`Error al actualizar el stock de ${item.nombre}. La venta se guardó pero el stock no se actualizó.`);
            }
          }
          
          // Descontar productos vinculados si existen
          // Parsear metadata si viene como string
          let metadata = producto?.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              console.warn('Error parseando metadata:', e);
              metadata = null;
            }
          }
          
          const productosVinculados = metadata?.productos_vinculados;
          if (productosVinculados && Array.isArray(productosVinculados) && productosVinculados.length > 0) {
            for (const productoVinculado of productosVinculados) {
              // Validar que tenga producto_id
              if (!productoVinculado.producto_id) {
                console.warn('Producto vinculado sin producto_id:', productoVinculado);
                continue;
              }
              
              // Calcular cantidad a descontar (puede ser fraccionada)
              const cantidadADescontar = parseFloat(productoVinculado.cantidad || 0) * parseFloat(item.qty || 1);
              
              console.log(`📦 Descontando producto vinculado:`, {
                producto_id: productoVinculado.producto_id,
                producto_nombre: productoVinculado.producto_nombre,
                cantidad_por_unidad: productoVinculado.cantidad,
                cantidad_vendida: item.qty,
                cantidad_total_a_descontar: cantidadADescontar,
                es_porcion: productoVinculado.es_porcion
              });
              
              // Obtener el producto vinculado actual
              const { data: prodVinculado, error: prodError } = await supabase
                .from('productos')
                .select('id, nombre, stock')
                .eq('id', productoVinculado.producto_id)
                .single();
              
              if (prodError) {
                console.error(`Error obteniendo producto vinculado ${productoVinculado.producto_id}:`, prodError);
                toast.error(`Error al obtener producto vinculado ${productoVinculado.producto_nombre || productoVinculado.producto_id}. La venta se guardó pero el stock no se actualizó.`);
                continue;
              }
              
              if (prodVinculado && prodVinculado.stock !== null && prodVinculado.stock !== undefined) {
                // Convertir stock actual a número (puede venir como string)
                const stockActual = parseFloat(prodVinculado.stock) || 0;
                const nuevoStockVinculado = Math.max(0, stockActual - cantidadADescontar);
                
                // Redondear a 2 decimales para evitar problemas de precisión
                const nuevoStockRedondeado = Math.round(nuevoStockVinculado * 100) / 100;
                
                console.log(`📊 Actualizando stock:`, {
                  producto: prodVinculado.nombre,
                  stock_actual: stockActual,
                  cantidad_a_descontar: cantidadADescontar,
                  nuevo_stock: nuevoStockRedondeado
                });
                
                const { error: stockVinculadoError } = await supabase
                  .from('productos')
                  .update({ stock: nuevoStockRedondeado })
                  .eq('id', productoVinculado.producto_id);
                
                if (stockVinculadoError) {
                  console.error(`❌ Error al actualizar el stock del producto vinculado ${productoVinculado.producto_nombre || prodVinculado.nombre}:`, stockVinculadoError);
                  console.error(`   Detalles del error:`, JSON.stringify(stockVinculadoError, null, 2));
                  console.error(`   Valores usados:`, {
                    producto_id: productoVinculado.producto_id,
                    stock_actual: stockActual,
                    cantidad_a_descontar: cantidadADescontar,
                    nuevo_stock: nuevoStockRedondeado
                  });
                  toast.error(`Error al actualizar el stock de ${productoVinculado.producto_nombre || prodVinculado.nombre}. La venta se guardó pero el stock no se actualizó.`);
                } else {
                  console.log(`✅ Stock actualizado para producto vinculado: ${prodVinculado.nombre} (${stockActual} -> ${nuevoStockRedondeado})`);
                }
              } else {
                console.warn(`Producto vinculado ${prodVinculado?.nombre || productoVinculado.producto_id} no tiene stock configurado`);
              }
            }
          }
        }
      }

      // Limpiar carrito y estados
      setCart([]);
      setVieneDePedidos(false); // Resetear flag cuando se vacía el carrito
      setProcesandoVenta(false);
      setMostrandoMetodosPago(false);
      setMostrandoPagoEfectivo(false);
      setMostrandoPagoMixto(false);
      setMontoEntregado('');

      // Mostrar confirmación
      setMostrandoConfirmacion(true);
      setConfirmacionCargando(false);
      setConfirmacionExito(true);
      setDatosVentaConfirmada(ventaResult);

      // Llamar callback si existe
      if (onPedidoGuardado) {
        onPedidoGuardado({ id: pedidoId, ...ventaResult });
      } else {
        toast.success('Pago procesado y pedido completado');
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error(error.message || 'Error al procesar el pago');
      setProcesandoVenta(false);
    }
  };

  // Función para guardar pedido (modo pedido)
  const guardarPedido = async (esPagoInmediato = false, metodoPago = null, detallesPago = null) => {
    if (!user || !organization || !tipoPedido) {
      toast.error('Error: Faltan datos del pedido');
      setProcesandoVenta(false);
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      setProcesandoVenta(false);
      return;
    }

    setProcesandoVenta(true);

    try {
      // Convertir items del carrito al formato de pedido
      // Los toppings individuales ahora se tratan como productos normales
      const itemsData = cart.map(item => {
          // Si es un topping individual, usar el topping_id como producto_id
          let productoId = item.id;
          if (item.es_topping || (typeof item.id === 'string' && item.id.startsWith('topping_'))) {
            productoId = item.topping_id || (typeof item.id === 'string' && item.id.startsWith('topping_') ? item.id.replace('topping_', '') : item.id);
          }
          
          // Los toppings individuales no tienen toppings anidados
          const toppingsLimpios = (item.es_topping || (typeof item.id === 'string' && item.id.startsWith('topping_'))) 
            ? [] 
            : ((item.toppings || []).map(t => {
              if (typeof t === 'object' && t !== null) {
                // Si el topping tiene un ID con prefijo, usar el topping_id original
                let toppingId = t.id;
                if (typeof t.id === 'string' && t.id.startsWith('topping_')) {
                  toppingId = t.id.replace('topping_', '');
                } else if (t.topping_id) {
                  toppingId = t.topping_id;
                }
                
                return {
                  id: toppingId,
                  nombre: t.nombre,
                  precio: t.precio,
                };
              }
              return t;
            }));

          const variacionesLimpias = {};
          if (item.variaciones && typeof item.variaciones === 'object') {
            Object.keys(item.variaciones).forEach(key => {
              const value = item.variaciones[key];
              if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                variacionesLimpias[key] = value;
              }
            });
          }

          // Calcular precio total incluyendo toppings
          const precioBase = item.precio_venta || item.price || 0;
          const precioToppings = (toppingsLimpios || []).reduce((sum, topping) => {
            return sum + (topping.precio || 0) * (topping.cantidad || 1);
          }, 0);
          const precioUnitarioConToppings = precioBase + precioToppings;
          const precioTotal = precioUnitarioConToppings * (item.qty || 1);

          return {
            producto_id: productoId,
            cantidad: item.qty || 1,
            precio_unitario: precioBase, // Precio base sin toppings
            precio_total: precioTotal, // Precio total con toppings y cantidad
            toppings: toppingsLimpios,
            variaciones: variacionesLimpias,
            notas: item.notas?.trim() || null
          };
        });

      const prioridad = tipoPedido === 'express' ? 'alta' : 'normal';
      
      const pedidoCreado = await crearPedido.mutateAsync({
        organizationId: organization.id,
        mesaId: mesaSeleccionada?.id || null,
        items: itemsData,
        notas: notas.trim() || null,
        meseroId: user.id,
        tipoPedido: tipoPedido,
        clienteNombre: clienteNombre.trim() || null,
        clienteTelefono: clienteTelefono.trim() || null,
        direccionEntrega: direccionEntrega.trim() || null,
        costoEnvio: parseFloat(costoEnvio) || 0,
        horaEstimada: horaEstimada || null,
        numeroPersonas: numeroPersonas && numeroPersonas >= 1 ? numeroPersonas : 1,
        prioridad: prioridad,
        pagoInmediato: esPagoInmediato
      });

      // Si es pago inmediato, procesar el pago después de crear el pedido
      if (esPagoInmediato && metodoPago) {
        // Procesar el pago con el pedido ya creado
        await procesarPagoConPedido(pedidoCreado.id, metodoPago, detallesPago);
        return;
      }

      // Limpiar carrito
      setCart([]);
      setVieneDePedidos(false); // Resetear flag cuando se vacía el carrito
      setProcesandoVenta(false);

      // Llamar callback si existe
      if (onPedidoGuardado) {
        onPedidoGuardado(pedidoCreado);
      } else {
        toast.success('Pedido guardado correctamente');
      }
    } catch (error) {
      console.error('Error guardando pedido:', error);
      toast.error(error.message || 'Error al guardar el pedido');
      setProcesandoVenta(false);
    }
  };

  async function confirmSale(metodoPagoOverride = null, detallesPagoMixto = null) {
    if (!user || !organization) {
      toast.error('Error: No hay usuario u organización activa');
      setProcesandoVenta(false);
      return;
    }

    // Verificar límite de ventas antes de confirmar (solo en modo venta)
    if (!esModoPedido) {
      const canCreateSale = await canPerformAction('createSale');
      if (!canCreateSale.allowed) {
        toast.error(canCreateSale.reason || 'Has alcanzado el límite de ventas este mes. Actualiza tu plan.');
        setProcesandoVenta(false);
        return;
      }
    }

    // Verificar si hay una apertura de caja activa (solo en modo venta)
    if (!esModoPedido && !aperturaActivaFinal) {
      toast.error('Debes abrir la caja antes de realizar ventas');
      setMostrarModalApertura(true);
      setProcesandoVenta(false);
      return;
    }
    
    // Si es modo pedido, guardar el pedido en lugar de crear una venta
    if (esModoPedido) {
      return await guardarPedido();
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
    
    // Validar que no se exceda el stock (productos y toppings)
    for (const item of cart) {
      // Si es un topping individual, validar stock en la tabla toppings
      if (item.es_topping || (typeof item.id === 'string' && item.id.startsWith('topping_'))) {
        const toppingId = item.topping_id || (typeof item.id === 'string' && item.id.startsWith('topping_') ? item.id.replace('topping_', '') : item.id);
        
        // Buscar el topping en la lista de productos (que incluye toppings)
        const topping = productos.find(p => (p.es_topping && p.topping_id === toppingId) || p.id === item.id);
        
        if (!topping) {
          toast.error(`Error: Topping ${item.nombre} no encontrado`);
          setProcesandoVenta(false);
          return;
        }
        
        if (topping.stock !== null && topping.stock !== undefined && item.qty > topping.stock) {
          toast.error(`No hay suficiente stock para ${item.nombre}. Disponible: ${parseFloat(topping.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
          setProcesandoVenta(false);
          return;
        }
      } else {
        // Es un producto normal
        const producto = productos.find(p => p.id === item.id);
        if (!producto) {
          toast.error(`Error: Producto ${item.nombre} no encontrado`);
          setProcesandoVenta(false);
          return;
        }
        
        if (producto.stock !== null && producto.stock !== undefined && item.qty > producto.stock) {
          toast.error(`No hay suficiente stock para ${item.nombre}. Disponible: ${parseFloat(producto.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
          setProcesandoVenta(false);
          return;
        }
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
        // Generar código de venta amigable (forzar único en reintentos)
        const numeroVenta = await generarCodigoVenta(organization.id, metodoPagoFinal, intento > 0);
        
        // Guardar la venta en la base de datos
        const ventaData = {
          organization_id: organization.id,
          user_id: user.id,
          total: total,
          subtotal: subtotal,
          descuento: montoDescuento > 0 ? {
            tipo: descuento.tipo,
            valor: descuento.valor,
            monto: montoDescuento,
            alcance: descuento.alcance,
            productosIds: descuento.productosIds
          } : null,
          metodo_pago: metodoPagoFinal,
          items: cart,
          fecha: new Date().toISOString(),
          pago_cliente: montoPagoCliente,
          detalles_pago_mixto: metodoActual === "Mixto" && detallesPagoMixto ? detallesPagoMixto : null,
          numero_venta: numeroVenta,
          cliente_id: clienteSeleccionado?.id || null
        };
        
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
            intento++;
            // Esperar un poco antes de reintentar para evitar condiciones de carrera
            const tiempoEspera = 100 * intento;
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
            continue;
          }
          
          toast.error(`Error al guardar la venta: ${ventaError.message}`);
          setProcesandoVenta(false);
          return;
        }
        
        if (!result || result.length === 0) {
          toast.error('Error: No se pudo obtener el ID de la venta');
          setProcesandoVenta(false);
          return;
        }
        
        ventaResult = result;
        exito = true;
      } catch (error) {
        // Si no es un error de duplicado o ya agotamos los intentos, mostrar error
        const esDuplicado = error.code === '23505' || 
                           error.message?.includes('duplicate key') ||
                           error.message?.includes('idx_ventas_numero_venta_unique');
        
        if (!esDuplicado || intento >= maxIntentos - 1) {
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
          // Obtener todos los pedidos para verificar su estado actual
          const { data: pedidosData, error: pedidosError } = await supabase
            .from('pedidos')
            .select('id, estado, mesa_id, pago_inmediato')
            .in('id', pedidosAActualizar);
          
          if (pedidosError) {
            // Error silencioso
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
                continue;
              }
              // Para cualquier otro caso, no cambiar el estado
              else {
                continue;
              }
              
              await actualizarPedido.mutateAsync({
                id: pedido.id,
                organizationId: organization.id,
                estado: nuevoEstado
              });
            } catch (error) {
              // Continuar con los demás pedidos aunque uno falle
            }
          }
          
          setPedidoIdActual(null);
          setPedidosConsolidados([]);
        } catch (error) {
          toast.error('La venta se completó pero hubo un error al actualizar los pedidos');
          // No fallar la venta si falla la actualización del pedido
        }
      }
      
      // Actualizar stock de productos y toppings
      for (const item of cart) {
        // Si es un topping individual, actualizar stock en la tabla toppings
        if (item.es_topping || (typeof item.id === 'string' && item.id.startsWith('topping_'))) {
          const toppingId = item.topping_id || (typeof item.id === 'string' && item.id.startsWith('topping_') ? item.id.replace('topping_', '') : item.id);
          
          // Obtener el topping actual para verificar stock
          const { data: topping, error: toppingError } = await supabase
            .from('toppings')
            .select('stock')
            .eq('id', toppingId)
            .single();
          
          if (!toppingError && topping && topping.stock !== null && topping.stock !== undefined) {
            const nuevoStock = topping.stock - item.qty;
            const { error: stockError } = await supabase
              .from('toppings')
              .update({ stock: nuevoStock })
              .eq('id', toppingId);
            
            if (stockError) {
              console.error(`Error al actualizar el stock del topping ${item.nombre}:`, stockError);
              toast.error(`Error al actualizar el stock de ${item.nombre}. La venta se guardó pero el stock no se actualizó.`);
            }
          }
        } else {
          // Es un producto normal
          // Primero intentar obtener el producto del array, si no está, obtenerlo de la BD
          let producto = productos.find(p => p.id === item.id);
          
          // Si no está en el array, obtenerlo directamente de la BD
          if (!producto) {
            const { data: productoBD, error: productoBDError } = await supabase
              .from('productos')
              .select('id, nombre, stock, metadata')
              .eq('id', item.id)
              .single();
            
            if (!productoBDError && productoBD) {
              producto = productoBD;
            }
          }
          
          if (producto && producto.stock !== null && producto.stock !== undefined) {
            const nuevoStock = producto.stock - item.qty;
            const { error: stockError } = await supabase
              .from('productos')
              .update({ stock: nuevoStock })
              .eq('id', item.id);
            
            if (stockError) {
              console.error(`Error al actualizar el stock de ${item.nombre}:`, stockError);
              toast.error(`Error al actualizar el stock de ${item.nombre}. La venta se guardó pero el stock no se actualizó.`);
            }
          }
          
          // Descontar productos vinculados si existen
          // Parsear metadata si viene como string
          let metadata = producto?.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              console.warn('Error parseando metadata:', e);
              metadata = null;
            }
          }
          
          const productosVinculados = metadata?.productos_vinculados;
          if (productosVinculados && Array.isArray(productosVinculados) && productosVinculados.length > 0) {
            for (const productoVinculado of productosVinculados) {
              // Validar que tenga producto_id
              if (!productoVinculado.producto_id) {
                console.warn('Producto vinculado sin producto_id:', productoVinculado);
                continue;
              }
              
              // Calcular cantidad a descontar (puede ser fraccionada)
              const cantidadADescontar = parseFloat(productoVinculado.cantidad || 0) * parseFloat(item.qty || 1);
              
              console.log(`📦 Descontando producto vinculado:`, {
                producto_id: productoVinculado.producto_id,
                producto_nombre: productoVinculado.producto_nombre,
                cantidad_por_unidad: productoVinculado.cantidad,
                cantidad_vendida: item.qty,
                cantidad_total_a_descontar: cantidadADescontar,
                es_porcion: productoVinculado.es_porcion
              });
              
              // Obtener el producto vinculado actual
              const { data: prodVinculado, error: prodError } = await supabase
                .from('productos')
                .select('id, nombre, stock')
                .eq('id', productoVinculado.producto_id)
                .single();
              
              if (prodError) {
                console.error(`Error obteniendo producto vinculado ${productoVinculado.producto_id}:`, prodError);
                toast.error(`Error al obtener producto vinculado ${productoVinculado.producto_nombre || productoVinculado.producto_id}. La venta se guardó pero el stock no se actualizó.`);
                continue;
              }
              
              if (prodVinculado && prodVinculado.stock !== null && prodVinculado.stock !== undefined) {
                // Convertir stock actual a número (puede venir como string)
                const stockActual = parseFloat(prodVinculado.stock) || 0;
                const nuevoStockVinculado = Math.max(0, stockActual - cantidadADescontar);
                
                // Redondear a 2 decimales para evitar problemas de precisión
                const nuevoStockRedondeado = Math.round(nuevoStockVinculado * 100) / 100;
                
                console.log(`📊 Actualizando stock:`, {
                  producto: prodVinculado.nombre,
                  stock_actual: stockActual,
                  cantidad_a_descontar: cantidadADescontar,
                  nuevo_stock: nuevoStockRedondeado
                });
                
                const { error: stockVinculadoError } = await supabase
                  .from('productos')
                  .update({ stock: nuevoStockRedondeado })
                  .eq('id', productoVinculado.producto_id);
                
                if (stockVinculadoError) {
                  console.error(`❌ Error al actualizar el stock del producto vinculado ${productoVinculado.producto_nombre || prodVinculado.nombre}:`, stockVinculadoError);
                  console.error(`   Detalles del error:`, JSON.stringify(stockVinculadoError, null, 2));
                  console.error(`   Valores usados:`, {
                    producto_id: productoVinculado.producto_id,
                    stock_actual: stockActual,
                    cantidad_a_descontar: cantidadADescontar,
                    nuevo_stock: nuevoStockRedondeado
                  });
                  toast.error(`Error al actualizar el stock de ${productoVinculado.producto_nombre || prodVinculado.nombre}. La venta se guardó pero el stock no se actualizó.`);
                } else {
                  console.log(`✅ Stock actualizado para producto vinculado: ${prodVinculado.nombre} (${stockActual} -> ${nuevoStockRedondeado})`);
                }
              } else {
                console.warn(`Producto vinculado ${prodVinculado?.nombre || productoVinculado.producto_id} no tiene stock configurado`);
              }
            }
          }
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
        subtotal: subtotal,
        descuento: montoDescuento > 0 ? {
          tipo: descuento.tipo,
          valor: descuento.valor,
          monto: montoDescuento,
          alcance: descuento.alcance,
          productosIds: descuento.productosIds
        } : null,
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
          setVieneDePedidos(false); // Resetear flag cuando se vacía el carrito
          setShowCartMobile(false);
          setPedidoIdActual(null); // Limpiar pedido actual
          setPedidosConsolidados([]); // Limpiar pedidos consolidados
          setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
          
          // Si viene de pedidos, mostrar modal de regreso
          if (vieneDePedidos) {
            setMostrarModalRegresarPedidos(true);
          }
        }, 2000);
      }, 1500);
      
      // Recargar productos para actualizar stock
      const { data: productosActualizados, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', user.id);
      
      if (!productosError) {
        setProductos(productosActualizados || []);
      }
      
    } catch (error) {
      toast.error(`Error al procesar la venta: ${error.message}`);
      setMostrandoConfirmacion(false);
      setConfirmacionCargando(false);
      setConfirmacionExito(false);
    } finally {
      setProcesandoVenta(false);
    }
  }

  // Función para cargar un pedido pendiente en el carrito
  // Si consolidarTodos es true, carga todos los pedidos de la misma mesa
  // Si es false (por defecto), solo carga el pedido seleccionado
  const cargarPedidoEnCarrito = (pedido, consolidarTodos = false) => {
    setVieneDePedidos(true); // Marcar que el carrito viene de un pedido
    if (!pedido.items || pedido.items.length === 0) {
      toast.error('El pedido no tiene items');
      return;
    }

    // Si consolidarTodos es false, solo cargar este pedido
    let pedidosAConsolidar = [pedido];
    
    // Si consolidarTodos es true, buscar todos los pedidos de la misma mesa
    if (consolidarTodos) {
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

  if (cargando || (!esModoPedido && cargandoApertura)) {
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

  // No bloquear toda la página, solo la funcionalidad de ventas

  return (
    <div className="caja-container">
      {/* Overlay de bloqueo si no hay apertura activa (solo en modo venta) */}
      {!esModoPedido && !aperturaActivaFinal && organization?.id && !cargandoApertura && (
        <div className="caja-bloqueo-overlay">
          <div className="caja-bloqueo-mensaje">
            <Lock size={48} />
            <h3>Caja Cerrada</h3>
            <p>Debes abrir la caja antes de realizar ventas</p>
            <button
              className="caja-btn-abrir-caja"
              onClick={async () => {
                // Refetch para verificar el estado actual antes de abrir el modal
                const { data: aperturaActualizada } = await refetchApertura();
                
                // Si hay una apertura activa, no mostrar el modal y mostrar mensaje
                if (aperturaActualizada) {
                  toast.success('La caja ya está abierta');
                  return;
                }
                
                setModalCerradoManualmente(false);
                setMostrarModalApertura(true);
                setModalMostradoInicialmente(false); // Permitir mostrar el modal de nuevo
              }}
            >
              Abrir Caja
            </button>
          </div>
        </div>
      )}

      {/* Contenedor principal con pedidos a la izquierda y productos/carrito a la derecha */}
      <div className="caja-layout-wrapper">
        {/* Sección de pedidos pendientes de pago - Sidebar izquierdo */}
      {pedidosPendientesPago.length > 0 && (
        <div className="caja-pedidos-section">
          <div className="caja-pedidos-header">
            <div className="caja-pedidos-title">
              <CheckCircle size={20} color="#10B981" />
              <h3>Pedidos Listos para Pagar</h3>
            </div>
            <button
              className="caja-pedidos-toggle caja-pedidos-toggle-mobile"
              onClick={() => setMostrandoPedidosPendientes(!mostrandoPedidosPendientes)}
              aria-label={mostrandoPedidosPendientes ? 'Ocultar pedidos' : 'Mostrar pedidos'}
            >
              <div className="caja-pedidos-toggle-icon-container">
                <List size={20} color="currentColor" strokeWidth={2} />
              </div>
              {pedidosPendientesPago.length > 0 && (
                <span className="caja-pedidos-toggle-badge">
                  {pedidosPendientesPago.length}
                </span>
              )}
            </button>
          </div>
          
          {(mostrandoPedidosPendientes || (isWideScreen && pedidosPendientesPago.length > 0)) && (
            <>
              {/* Buscador de pedidos */}
              <div className="caja-pedidos-search-container">
                <Search className="caja-pedidos-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por pedido, cliente, teléfono o mesa..."
                  className="caja-pedidos-search-input"
                  value={queryPedidos}
                  onChange={(e) => setQueryPedidos(e.target.value)}
                />
                {queryPedidos && (
                  <button
                    className="caja-pedidos-search-clear"
                    onClick={() => setQueryPedidos('')}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="caja-pedidos-list">
                {pedidosPendientesPago.length === 0 ? (
                  <p className="caja-pedidos-empty">
                    {queryPedidos ? 'No se encontraron pedidos con ese criterio' : 'No hay pedidos listos para pagar'}
                  </p>
                ) : (
                  <>
                    {/* Mostrar pedidos agrupados por mesa */}
                    {Object.values(pedidosPorMesa).map((grupo) => (
                      <div key={grupo.mesa.id} className={`caja-mesa-group-card ${grupo.pedidos.length > 1 ? 'caja-mesa-group-multiple' : 'caja-mesa-group-single'}`}>
                        <div className="caja-mesa-group-header">
                          <div className="caja-mesa-group-title">
                            <span className="caja-pedido-mesa">{grupo.mesa.numero}</span>
                            <span className="caja-mesa-pedidos-count">
                              {grupo.pedidos.length} {grupo.pedidos.length === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </div>
                          <button
                            className="caja-mesa-cargar-todos-btn"
                            onClick={() => {
                              if (grupo.pedidos && grupo.pedidos.length > 0) {
                                // Usar directamente los pedidos del grupo
                                cargarTodosPedidosMesa(grupo.pedidos);
                              }
                            }}
                            title={`Cargar todos los pedidos de la mesa ${grupo.mesa.numero}`}
                          >
                            <Package size={16} />
                          </button>
                        </div>
                        <div className="caja-mesa-pedidos-list">
                          {grupo.pedidos.map((pedido) => {
                            const totalPedido = (() => {
                              if (!pedido.items || pedido.items.length === 0) return pedido.total || 0;
                              return pedido.items.reduce((sum, item) => {
                                const precioBase = item.precio_unitario || item.precio_venta || 0;
                                const precioToppings = (item.toppings || []).reduce((toppingSum, topping) => {
                                  return toppingSum + (topping.precio || 0) * (topping.cantidad || 1);
                                }, 0);
                                const precioUnitarioConToppings = precioBase + precioToppings;
                                return sum + (precioUnitarioConToppings * (item.cantidad || 1));
                              }, 0);
                            })();
                            
                            return (
                              <div key={pedido.id} className="caja-pedido-card caja-pedido-card-in-group">
                                <div className="caja-pedido-info">
                                  <div className="caja-pedido-header-info">
                                    <h4>{pedido.numero_pedido}</h4>
                                    <div className="caja-pedido-meta-info">
                                      {pedido.mesa && (
                                        <span className="caja-pedido-mesa">{pedido.mesa.numero}</span>
                                      )}
                                      {pedido.cliente_nombre && (
                                        <span className="caja-pedido-cliente">
                                          {pedido.cliente_nombre}
                                          {pedido.cliente_telefono && ` - ${pedido.cliente_telefono}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="caja-pedido-items">
                                    {pedido.items?.length || 0} {pedido.items?.length === 1 ? 'item' : 'items'}
                                  </p>
                                  <p className="caja-pedido-total">
                                    Total: {formatCOP(totalPedido > 0 ? totalPedido : (pedido.total || 0))}
                                  </p>
                                </div>
                                <button
                                  className="caja-pedido-cargar-btn"
                                  onClick={() => cargarPedidoEnCarrito(pedido)}
                                  disabled={!pedido.items || pedido.items.length === 0}
                                  title="Cargar pedido"
                                >
                                  <ArrowRight size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="caja-mesa-group-total">
                          <span className="caja-mesa-total-label">Total Mesa:</span>
                          <span className="caja-mesa-total-amount">
                            {formatCOP(grupo.pedidos.reduce((sum, pedido) => {
                              if (!pedido.items || pedido.items.length === 0) return sum + (pedido.total || 0);
                              return sum + pedido.items.reduce((itemSum, item) => {
                                const precioBase = item.precio_unitario || item.precio_venta || 0;
                                const precioToppings = (item.toppings || []).reduce((toppingSum, topping) => {
                                  return toppingSum + (topping.precio || 0) * (topping.cantidad || 1);
                                }, 0);
                                const precioUnitarioConToppings = precioBase + precioToppings;
                                return itemSum + (precioUnitarioConToppings * (item.cantidad || 1));
                              }, 0);
                            }, 0))}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Mostrar pedidos individuales (sin mesa o con mesa que tiene solo un pedido) */}
                    {pedidosIndividuales.map((pedido) => {
                      const totalPedido = (() => {
                        if (!pedido.items || pedido.items.length === 0) return pedido.total || 0;
                        return pedido.items.reduce((sum, item) => {
                          const precioBase = item.precio_unitario || item.precio_venta || 0;
                          const precioToppings = (item.toppings || []).reduce((toppingSum, topping) => {
                            return toppingSum + (topping.precio || 0) * (topping.cantidad || 1);
                          }, 0);
                          const precioUnitarioConToppings = precioBase + precioToppings;
                          return sum + (precioUnitarioConToppings * (item.cantidad || 1));
                        }, 0);
                      })();
                      
                      return (
                        <div key={pedido.id} className="caja-pedido-card">
                          <div className="caja-pedido-info">
                            <div className="caja-pedido-header-info">
                              <h4>{pedido.numero_pedido}</h4>
                              <div className="caja-pedido-meta-info">
                                {pedido.mesa && (
                                  <span className="caja-pedido-mesa">{pedido.mesa.numero}</span>
                                )}
                                {pedido.cliente_nombre && (
                                  <span className="caja-pedido-cliente">
                                    {pedido.cliente_nombre}
                                    {pedido.cliente_telefono && ` - ${pedido.cliente_telefono}`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="caja-pedido-items">
                              {pedido.items?.length || 0} {pedido.items?.length === 1 ? 'item' : 'items'}
                            </p>
                            <p className="caja-pedido-total">
                              Total: {formatCOP(totalPedido > 0 ? totalPedido : (pedido.total || 0))}
                            </p>
                          </div>
                          <button
                            className="caja-pedido-cargar-btn"
                            onClick={() => cargarPedidoEnCarrito(pedido)}
                            disabled={!pedido.items || pedido.items.length === 0}
                            title="Cargar pedido"
                          >
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
          </div>
        )}

        {/* Línea divisoria entre pedidos y productos - Solo en móvil */}
        {pedidosPendientesPago.length > 0 && (mostrandoPedidosPendientes || (isWideScreen && pedidosPendientesPago.length > 0)) && (
          <div className="caja-pedidos-divider"></div>
        )}

        {/* Contenedor principal para productos y carrito */}
        <div className="caja-main-content">
        {/* Panel de productos */}
        <div className="caja-products-panel">
        {/* Botón de volver cuando está en modo pedido */}
        {esModoPedido && onCancelar && (
          <div className="caja-volver-container">
            <button
              className="caja-btn-volver"
              onClick={onCancelar}
              title="Volver a tomar pedidos"
            >
              <ArrowLeft size={18} />
              <span>Volver</span>
            </button>
          </div>
        )}
        <div className="caja-search-container">
          <Search className="caja-search-icon" size={20} />
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Buscar producto o escanear código de barras..."
            className="caja-search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // El hook manejará la detección de código de barras
              handleBarcodeInputChange(e);
            }}
            onKeyDown={handleBarcodeKeyDown}
            autoFocus
            onFocus={(e) => {
              // Prevenir scroll cuando se enfoca - mantener posición
              e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }}
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
                  <p className="caja-product-stock">Stock: {producto.stock !== null && producto.stock !== undefined ? parseFloat(producto.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : 'N/A'}</p>
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
            <ShoppingCart className="caja-cart-icon" /> {esModoPedido ? 'Carrito de Pedido' : 'Carrito de Venta'}
            {cart.length > 0 && (
              <span className="caja-cart-count-badge">
                {cart.reduce((n, i) => n + (typeof i.qty === 'number' ? i.qty : 0), 0)}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <div className="caja-cart-header-actions">
              <div className="caja-cliente-container">
                <button 
                  className={`caja-header-icon-btn caja-icon-cliente ${clienteSeleccionado ? 'caja-icon-cliente-selected' : ''}`}
                  onClick={() => setMostrandoModalSeleccionCliente(true)}
                  title={clienteSeleccionado ? `Cliente: ${clienteSeleccionado.nombre}` : 'Seleccionar cliente'}
                >
                  {clienteSeleccionado ? (
                    <>
                      <UserCircle 
                        size={16} 
                        strokeWidth={2.5} 
                        color="#3b82f6"
                        style={{ 
                          display: 'block',
                          position: 'relative',
                          zIndex: 2,
                          opacity: 1,
                          visibility: 'visible',
                          flexShrink: 0
                        }}
                      />
                      <span className="caja-cliente-nombre-text">
                        {clienteSeleccionado.nombre.length > 8 
                          ? `${clienteSeleccionado.nombre.substring(0, 8)}...` 
                          : clienteSeleccionado.nombre}
                      </span>
                    </>
                  ) : (
                    <UserCircle 
                      size={20} 
                      strokeWidth={2.5} 
                      color="#3b82f6"
                      style={{ 
                        display: 'block',
                        position: 'relative',
                        zIndex: 2,
                        opacity: 1,
                        visibility: 'visible'
                      }}
                    />
                  )}
                  {clienteSeleccionado && (
                    <span className="caja-header-icon-badge"></span>
                  )}
                </button>
                {clienteSeleccionado && (
                  <button
                    className="caja-cliente-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClienteSeleccionado(null);
                    }}
                    title="Eliminar cliente"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {!esModoPedido && (
                <button 
                  className="caja-header-icon-btn caja-icon-cotizacion"
                  onClick={handleGuardarCotizacion}
                  disabled={guardandoCotizacion}
                  title="Guardar como cotización"
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <Save 
                    size={20} 
                    strokeWidth={2.5} 
                    color="#10b981"
                    style={{ 
                      display: 'block',
                      position: 'relative',
                      zIndex: 2,
                      opacity: 1,
                      visibility: 'visible'
                    }}
                  />
                </button>
              )}
              <button 
                className="caja-header-icon-btn caja-icon-descuento"
                onClick={() => {
                  if (hasFeature('advancedSale')) {
                    setMostrarModalDescuento(true);
                  } else {
                    toast.error('Los descuentos están disponibles en el plan Estándar');
                  }
                }}
                title={montoDescuento > 0 ? `Descuento: ${descuento.tipo === 'porcentaje' ? `${descuento.valor}%` : formatCOP(descuento.valor)}` : hasFeature('advancedSale') ? 'Aplicar descuento' : '🔒 Plan Estándar'}
                style={{ position: 'relative', zIndex: 1, opacity: hasFeature('advancedSale') ? 1 : 0.5 }}
              >
                <Percent 
                  size={20} 
                  strokeWidth={2.5} 
                  color="#f59e0b"
                  style={{ 
                    display: 'block',
                    position: 'relative',
                    zIndex: 2,
                    opacity: 1,
                    visibility: 'visible'
                  }}
                />
                {montoDescuento > 0 && (
                  <span className="caja-header-icon-badge"></span>
                )}
              </button>
              <button 
                className="caja-header-icon-btn caja-icon-vaciar"
                onClick={() => {
                  setCart([]);
                  setVieneDePedidos(false); // Resetear flag cuando se vacía el carrito
                  setPedidoIdActual(null);
                  setPedidosConsolidados([]);
                  setClienteNombrePedido(null); // Limpiar nombre del cliente del pedido
                  setDescuento({ tipo: 'porcentaje', valor: 0, alcance: 'total', productosIds: [] }); // Limpiar descuento
                }}
                title="Vaciar carrito"
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Trash2 
                  size={20} 
                  strokeWidth={2.5} 
                  color="#ef4444"
                  style={{ 
                    display: 'block',
                    position: 'relative',
                    zIndex: 2,
                    opacity: 1,
                    visibility: 'visible'
                  }}
                />
              </button>
            </div>
          )}
        </div>


        <div className="caja-cart-items">
          {cart.length === 0 ? (
            <p className="caja-empty-cart">Aún no has agregado productos.</p>
          ) : (
            <ul className="caja-cart-list">
              {cart.map((item, index) => {
                // Buscar el producto completo para obtener la imagen
                const productoCompleto = productos.find(p => p.id === item.id);
                // Crear una clave única que incluya ID, toppings, variaciones e índice
                const itemKey = `${item.id}-${JSON.stringify(item.toppings || [])}-${JSON.stringify(item.variaciones || {})}-${index}`;
                return (
                  <li key={itemKey} className="caja-cart-item">
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
                      {(esModoPedido || vieneDePedidos) && (
                        <div className="caja-cart-item-notas">
                          <textarea
                            placeholder="Notas para este producto..."
                            value={item.notas || ''}
                            onChange={(e) => actualizarNotasItem(item.id, e.target.value, index, item.toppings, item.variaciones)}
                            className="caja-cart-item-notas-input"
                            rows={1}
                          style={{
                            width: '100%',
                            padding: '0.1rem 0.35rem',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            resize: 'vertical',
                            minHeight: '18px',
                            marginTop: '0.25rem',
                            fontFamily: 'inherit',
                            lineHeight: '1.2'
                          }}
                        />
                        </div>
                      )}
                    </div>
                    <div className="caja-cart-item-right-section">
                      <div className="caja-cart-item-controls">
                        <button 
                          className="caja-qty-btn caja-qty-btn-minus"
                          onClick={() => dec(item.id)}
                          aria-label="Disminuir cantidad"
                        >
                          <span className="caja-qty-icon">−</span>
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="caja-qty-display"
                          value={typeof item.qty === 'number' ? item.qty : (item.qty || '')}
                          style={{
                            color: '#1a1a1a',
                            backgroundColor: '#ffffff',
                            border: '2px solid #4b5563',
                            fontWeight: '700',
                            fontSize: '0.9rem'
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            // Permitir campo vacío temporalmente mientras se escribe
                            if (value === '') {
                              setCart((prev) => prev.map((i) => 
                                i.id === item.id ? { ...i, qty: '' } : i
                              ));
                              return;
                            }
                            
                            const numValue = parseInt(value, 10);
                            
                            if (!isNaN(numValue) && numValue >= 1) {
                              updateQty(item.id, numValue);
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value, 10);
                            
                            if (value === '' || isNaN(numValue) || numValue < 1) {
                              // Si está vacío o es inválido, restaurar cantidad anterior o eliminar
                              const itemEnCarrito = cart.find(i => i.id === item.id);
                              if (itemEnCarrito && typeof itemEnCarrito.qty === 'number' && itemEnCarrito.qty >= 1) {
                                setCart((prev) => prev.map((i) => 
                                  i.id === item.id ? { ...i, qty: itemEnCarrito.qty } : i
                                ));
                              } else {
                                removeItem(item.id);
                              }
                            } else {
                              updateQty(item.id, numValue);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          min="1"
                          aria-label="Cantidad"
                        />
                        <button 
                          className="caja-qty-btn caja-qty-btn-plus"
                          onClick={() => inc(item.id)}
                          aria-label="Aumentar cantidad"
                        >
                          <span className="caja-qty-icon">+</span>
                        </button>
                      </div>
                      <div className="caja-cart-item-price-unit">
                        {(() => {
                          // Calcular precio unitario incluyendo toppings (con cantidad de cada topping)
                          const precioBase = item.precio_venta || item.price || 0;
                          const precioToppings = (item.toppings && Array.isArray(item.toppings))
                            ? item.toppings.reduce((sum, topping) => {
                                const precioTopping = topping.precio || topping.precio_venta || 0;
                                const cantidadTopping = topping.cantidad || 1;
                                return sum + (precioTopping * cantidadTopping);
                              }, 0)
                            : 0;
                          return formatCOP(precioBase + precioToppings);
                        })()} c/u
                      </div>
                      <div className="caja-cart-item-total">
                        {(() => {
                          // Calcular precio total incluyendo toppings (con cantidad de cada topping)
                          const precioBase = item.precio_venta || item.price || 0;
                          const precioToppings = (item.toppings && Array.isArray(item.toppings))
                            ? item.toppings.reduce((sum, topping) => {
                                const precioTopping = topping.precio || topping.precio_venta || 0;
                                const cantidadTopping = topping.cantidad || 1;
                                return sum + (precioTopping * cantidadTopping);
                              }, 0)
                            : 0;
                          const cantidad = typeof item.qty === 'number' ? item.qty : 0;
                          return formatCOP((precioBase + precioToppings) * cantidad);
                        })()}
                      </div>
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
            <div className="caja-total-row">
              <span className="caja-total-label">Subtotal</span>
              <span className="caja-total-amount">{formatCOP(subtotal)}</span>
            </div>
            {montoDescuento > 0 && (
              <div className="caja-total-row caja-descuento-row">
                <span className="caja-total-label">
                  Descuento 
                  {descuento.tipo === 'porcentaje' && ` (${descuento.valor}%)`}
                  {descuento.alcance === 'productos' && ' en productos'}
                </span>
                <span className="caja-total-amount caja-descuento-amount">-{formatCOP(montoDescuento)}</span>
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
              {esModoPedido 
                ? (procesandoVenta ? 'Guardando...' : 'Guardar Pedido')
                : (procesandoVenta ? 'Procesando...' : 'Continuar')
              }
            </motion.button>
        </div>
        </div>
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
              {cart.length > 0 && (
                <span className="caja-mobile-cart-icon-badge">
                  {cart.reduce((n, i) => n + (typeof i.qty === 'number' ? i.qty : 0), 0)}
                </span>
              )}
              <span className="caja-mobile-cart-text">Carrito</span>
            </button>
            <button 
              className="caja-mobile-pay-btn"
              onClick={handleContinuar} 
              disabled={cart.length === 0 || procesandoVenta}
            >
              {esModoPedido ? (procesandoVenta ? 'Guardando...' : 'Guardar Pedido') : 'Cobrar'}
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
            <h3 className="caja-mobile-cart-title">
              <div className="caja-mobile-cart-icon-container">
                <ShoppingCart className="caja-mobile-cart-icon" />
                {cart.length > 0 && (
                  <span className="caja-mobile-cart-count-badge">
                    {cart.reduce((n, i) => n + (typeof i.qty === 'number' ? i.qty : 0), 0)}
                  </span>
                )}
              </div>
              <span className="caja-mobile-cart-title-text">Carrito</span>
            </h3>
            {cart.length > 0 && (
              <div className="caja-mobile-cart-header-actions">
                <button 
                  className="caja-mobile-header-icon-btn caja-mobile-icon-cliente"
                  onClick={() => setMostrandoModalSeleccionCliente(true)}
                  title={clienteSeleccionado ? `Cliente: ${clienteSeleccionado.nombre}` : 'Seleccionar cliente'}
                >
                  <UserCircle 
                    size={18} 
                    strokeWidth={2.5} 
                    color={clienteSeleccionado ? "#3b82f6" : "#6b7280"}
                  />
                  {clienteSeleccionado && (
                    <span className="caja-mobile-header-icon-badge"></span>
                  )}
                </button>
                <button 
                  className="caja-mobile-header-icon-btn caja-mobile-icon-cotizacion"
                  onClick={handleGuardarCotizacion}
                  disabled={guardandoCotizacion}
                  title="Guardar como cotización"
                >
                  <Save 
                    size={18} 
                    strokeWidth={2.5} 
                    color="#10b981"
                  />
                </button>
                <button 
                  className="caja-mobile-header-icon-btn caja-mobile-icon-descuento"
                  onClick={() => {
                    if (hasFeature('advancedSale')) {
                      setMostrarModalDescuento(true);
                    } else {
                      toast.error('Los descuentos están disponibles en el plan Estándar');
                    }
                  }}
                  title={montoDescuento > 0 ? `Descuento: ${descuento.tipo === 'porcentaje' ? `${descuento.valor}%` : formatCOP(descuento.valor)}` : hasFeature('advancedSale') ? 'Aplicar descuento' : '🔒 Plan Estándar'}
                  style={{ opacity: hasFeature('advancedSale') ? 1 : 0.5 }}
                >
                  <Percent 
                    size={18} 
                    strokeWidth={2.5} 
                    color="#f59e0b"
                  />
                  {montoDescuento > 0 && (
                    <span className="caja-mobile-header-icon-badge"></span>
                  )}
                </button>
                <button 
                  className="caja-mobile-header-icon-btn caja-mobile-icon-vaciar"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
                      setCart([]);
                      setPedidoIdActual(null);
                      setPedidosConsolidados([]);
                      setClienteNombrePedido(null);
                      setDescuento({ tipo: 'porcentaje', valor: 0, alcance: 'total', productosIds: [] });
                    }
                  }}
                  title="Vaciar carrito"
                >
                  <Trash2 
                    size={18} 
                    strokeWidth={2.5} 
                    color="#ef4444"
                  />
                </button>
              </div>
            )}
            {cart.length === 0 && (
              <div style={{ width: '36px' }}></div>
            )}
          </div>

          {/* Información de cliente y descuento en móvil */}
          {cart.length > 0 && (clienteSeleccionado || montoDescuento > 0) && (
            <div className="caja-mobile-cart-info-bar">
              {clienteSeleccionado && (
                <div className="caja-mobile-cart-info-item">
                  <UserCircle size={16} color="#3b82f6" />
                  <span className="caja-mobile-cart-info-text">
                    {clienteSeleccionado.nombre.length > 30 
                      ? `${clienteSeleccionado.nombre.substring(0, 30)}...` 
                      : clienteSeleccionado.nombre}
                  </span>
                  <button
                    className="caja-mobile-cart-info-remove"
                    onClick={() => setClienteSeleccionado(null)}
                    title="Quitar cliente"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {montoDescuento > 0 && (
                <div className="caja-mobile-cart-info-item">
                  <Percent size={16} color="#f59e0b" />
                  <span className="caja-mobile-cart-info-text">
                    Descuento: {descuento.tipo === 'porcentaje' ? `${descuento.valor}%` : formatCOP(descuento.valor)}
                  </span>
                  <button
                    className="caja-mobile-cart-info-remove"
                    onClick={() => setDescuento({ tipo: 'porcentaje', valor: 0, alcance: 'total', productosIds: [] })}
                    title="Quitar descuento"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="caja-mobile-cart-content">
            {cart.length === 0 ? (
              <p className="caja-mobile-empty-cart">Aún no has agregado productos.</p>
            ) : (
              <ul className="caja-mobile-cart-list">
                {cart.map((item, index) => {
                  // Buscar el producto completo para obtener la imagen
                  const productoCompleto = productos.find(p => p.id === item.id);
                  // Crear una clave única que incluya ID, toppings, variaciones e índice
                  const itemKey = `${item.id}-${JSON.stringify(item.toppings || [])}-${JSON.stringify(item.variaciones || {})}-${index}`;
                  return (
                    <li key={itemKey} className="caja-mobile-cart-item">
                      <div className="caja-mobile-cart-item-image">
                        <OptimizedProductImage
                          imagePath={productoCompleto?.imagen}
                          alt={item.nombre}
                          className="caja-mobile-cart-item-image-img"
                        />
                      </div>
                      <div className="caja-mobile-cart-item-info">
                        <p className="caja-mobile-cart-item-name">{item.nombre}</p>
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
                        {(esModoPedido || vieneDePedidos) && (
                          <div className="caja-mobile-cart-item-notas">
                            <textarea
                              placeholder="Notas para este producto..."
                              value={item.notas || ''}
                              onChange={(e) => actualizarNotasItem(item.id, e.target.value, index, item.toppings, item.variaciones)}
                              className="caja-mobile-cart-item-notas-input"
                              rows={1}
                            style={{
                              width: '100%',
                              padding: '0.15rem 0.4rem',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              resize: 'vertical',
                              minHeight: '24px',
                              marginTop: '0.25rem',
                              fontFamily: 'inherit',
                              lineHeight: '1.3'
                            }}
                          />
                          </div>
                        )}
                      </div>
                      <div className="caja-mobile-cart-item-right-section">
                        <div className="caja-mobile-cart-item-controls">
                          <button 
                            className="caja-mobile-qty-btn caja-mobile-qty-btn-minus"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dec(item.id);
                            }}
                            aria-label="Disminuir cantidad"
                          >
                            <span className="caja-mobile-qty-icon">−</span>
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="caja-mobile-qty-display"
                            value={typeof item.qty === 'number' ? item.qty : (item.qty || '')}
                            style={{
                              color: '#1a1a1a',
                              backgroundColor: '#ffffff',
                              border: '1px solid #4b5563',
                              fontWeight: '700',
                              fontSize: '0.65rem',
                              width: '28px',
                              minWidth: '28px',
                              maxWidth: '28px',
                              height: '16px',
                              minHeight: '16px',
                              maxHeight: '16px',
                              padding: '0.1rem 0.15rem',
                              WebkitTextFillColor: '#1a1a1a',
                              textFillColor: '#1a1a1a',
                              display: 'inline-block',
                              visibility: 'visible',
                              opacity: 1,
                              boxSizing: 'border-box'
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              // Permitir campo vacío temporalmente mientras se escribe
                              if (value === '') {
                                setCart((prev) => prev.map((i) => 
                                  i.id === item.id ? { ...i, qty: '' } : i
                                ));
                                return;
                              }
                              
                              const numValue = parseInt(value, 10);
                              
                              if (!isNaN(numValue) && numValue >= 1) {
                                updateQty(item.id, numValue);
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              const numValue = parseInt(value, 10);
                              
                              if (value === '' || isNaN(numValue) || numValue < 1) {
                                // Si está vacío o es inválido, restaurar cantidad anterior o eliminar
                                const itemEnCarrito = cart.find(i => i.id === item.id);
                                if (itemEnCarrito && typeof itemEnCarrito.qty === 'number' && itemEnCarrito.qty >= 1) {
                                  setCart((prev) => prev.map((i) => 
                                    i.id === item.id ? { ...i, qty: itemEnCarrito.qty } : i
                                  ));
                                } else {
                                  removeItem(item.id);
                                }
                              } else {
                                updateQty(item.id, numValue);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              }
                            }}
                            min="1"
                            aria-label="Cantidad"
                          />
                          <button 
                            className="caja-mobile-qty-btn caja-mobile-qty-btn-plus"
                            onClick={(e) => {
                              console.log('=== BOTÓN + CLICKEADO ===');
                              console.log('item.id:', item.id);
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                                e.nativeEvent.stopImmediatePropagation();
                              }
                              const itemId = item.id;
                              console.log('Llamando a inc con id:', itemId);
                              inc(itemId);
                            }}
                            onTouchEnd={(e) => {
                              console.log('=== TouchEnd en botón + ===');
                              e.preventDefault();
                              e.stopPropagation();
                              const itemId = item.id;
                              console.log('Llamando a inc desde TouchEnd con id:', itemId);
                              inc(itemId);
                            }}
                            aria-label="Aumentar cantidad"
                            type="button"
                            data-item-id={item.id}
                            data-testid={`inc-btn-${item.id}`}
                            style={{ 
                              pointerEvents: 'auto !important', 
                              zIndex: '1001 !important',
                              position: 'relative',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            <span 
                              className="caja-mobile-qty-icon"
                              style={{ pointerEvents: 'none' }}
                            >
                              +
                            </span>
                          </button>
                        </div>
                        <div className="caja-mobile-cart-item-price-unit">
                          {(() => {
                            // Calcular precio unitario incluyendo toppings (con cantidad de cada topping)
                            const precioBase = item.precio_venta || item.price || 0;
                            const precioToppings = (item.toppings && Array.isArray(item.toppings))
                              ? item.toppings.reduce((sum, topping) => {
                                  const precioTopping = topping.precio || topping.precio_venta || 0;
                                  const cantidadTopping = topping.cantidad || 1;
                                  return sum + (precioTopping * cantidadTopping);
                                }, 0)
                              : 0;
                            return formatCOP(precioBase + precioToppings);
                          })()} c/u
                        </div>
                        <div className="caja-mobile-cart-item-total">
                          {(() => {
                            // Calcular precio total incluyendo toppings (con cantidad de cada topping)
                            const precioBase = item.precio_venta || item.price || 0;
                            const precioToppings = (item.toppings && Array.isArray(item.toppings))
                              ? item.toppings.reduce((sum, topping) => {
                                  const precioTopping = topping.precio || topping.precio_venta || 0;
                                  const cantidadTopping = topping.cantidad || 1;
                                  return sum + (precioTopping * cantidadTopping);
                                }, 0)
                              : 0;
                            const cantidad = typeof item.qty === 'number' ? item.qty : 0;
                            return formatCOP((precioBase + precioToppings) * cantidad);
                          })()}
                        </div>
                      </div>
                      <button
                        className="caja-mobile-cart-item-remove"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          console.log('Botón eliminar clickeado');
                          removeItem(item.id);
                        }}
                        aria-label="Eliminar producto"
                        style={{ pointerEvents: 'auto', zIndex: 5 }}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="caja-mobile-cart-footer">
            {montoDescuento > 0 && (
              <div className="caja-mobile-total-breakdown">
                <div className="caja-mobile-total-row">
                  <span>Subtotal:</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                <div className="caja-mobile-total-row caja-mobile-descuento-row">
                  <span>Descuento:</span>
                  <span className="caja-mobile-descuento-amount">-{formatCOP(montoDescuento)}</span>
                </div>
              </div>
            )}
            <div className="caja-mobile-total-container">
              <span className="caja-mobile-total-label">Total</span>
              <span className="caja-mobile-total-amount">{formatCOP(total)}</span>
            </div>
            
            <div className="caja-mobile-cart-footer-actions">
              <button 
                className="caja-mobile-back-to-products-btn"
                onClick={() => setShowCartMobile(false)}
                title="Seguir agregando productos"
              >
                <ArrowLeft className="caja-mobile-back-icon" size={20} />
                <span className="caja-mobile-btn-text">Seguir</span>
              </button>
              <button 
                className="caja-mobile-pagar-footer-btn"
                onClick={handleContinuar} 
                disabled={cart.length === 0 || procesandoVenta}
                title={procesandoVenta ? (esModoPedido ? 'Guardando...' : 'Procesando...') : (esModoPedido ? 'Guardar Pedido' : 'Pagar')}
              >
                {esModoPedido ? <Save className="caja-mobile-pagar-icon" size={20} /> : <CheckCircle className="caja-mobile-pagar-icon" size={20} />}
                <span className="caja-mobile-btn-text">
                  {procesandoVenta 
                    ? (esModoPedido ? 'Guardando...' : '...') 
                    : (esModoPedido ? 'Guardar' : 'Pagar')
                  }
                </span>
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Opción de pago para pedidos */}
      {mostrandoOpcionPagoPedido && esModoPedido && (
        <div className="metodos-pago-overlay">
          <div className="metodos-pago-container">
            <div className="metodos-pago-header">
              <h3>¿Cómo deseas procesar el pago?</h3>
              <p className="metodos-pago-total">Total: <span>{formatCOP(total)}</span></p>
            </div>
            
            <div className="metodos-pago-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button 
                className="metodo-pago-card"
                onClick={() => {
                  setMostrandoOpcionPagoPedido(false);
                  setMostrandoMetodosPago(true);
                }}
              >
                <CreditCard className="metodo-pago-icon" size={32} />
                <span className="metodo-pago-label">Pagar Ahora</span>
                <span className="metodo-pago-desc">Procesar pago inmediatamente</span>
              </button>
              
              <button 
                className="metodo-pago-card"
                onClick={async () => {
                  setMostrandoOpcionPagoPedido(false);
                  await guardarPedido(false);
                }}
              >
                <Save className="metodo-pago-icon" size={32} />
                <span className="metodo-pago-label">Pagar Después</span>
                <span className="metodo-pago-desc">Guardar pedido para pagar luego</span>
              </button>
            </div>
            
            <div className="metodos-pago-actions">
              <button 
                className="metodos-pago-cancelar"
                onClick={() => setMostrandoOpcionPagoPedido(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
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

      {/* Selector de variaciones */}
      {mostrandoVariacionesSelector && productoParaVariaciones && (
        <VariacionesSelector
          open={mostrandoVariacionesSelector}
          onClose={() => {
            setMostrandoVariacionesSelector(false);
            setProductoParaVariaciones(null);
            setProductoParaToppings(null);
            setVariacionesSeleccionadas({});
          }}
          producto={productoParaVariaciones}
          onConfirm={(variaciones) => {
            setVariacionesSeleccionadas(variaciones);
            setMostrandoVariacionesSelector(false);
            // Después de seleccionar variaciones, mostrar selector de toppings
            // El productoParaToppings ya está configurado desde addToCart
            const producto = productoParaToppings || productoParaVariaciones;
            // Si el producto es un topping, agregarlo directamente sin mostrar selector de toppings
            const esTopping = producto?.es_topping || (producto && typeof producto.id === 'string' && producto.id.startsWith('topping_'));
            if (esTopping) {
              // Agregar directamente al carrito sin toppings adicionales
              agregarProductoConToppingsYVariaciones(producto, [], variaciones);
            } else {
              // Verificar si el producto permite toppings (por defecto true si no está definido)
              const permiteToppings = producto?.metadata?.permite_toppings !== undefined 
                ? producto.metadata.permite_toppings 
                : true;
              
              if (permiteToppings) {
                if (productoParaToppings) {
                  setMostrandoToppingsSelector(true);
                } else {
                  // Si por alguna razón no hay productoParaToppings, usar productoParaVariaciones
                  setProductoParaToppings(productoParaVariaciones);
                  setMostrandoToppingsSelector(true);
                }
              } else {
                // Si no permite toppings, agregar directamente al carrito
                agregarProductoConToppingsYVariaciones(producto, [], variaciones);
              }
            }
          }}
        />
      )}

      {/* Selector de toppings */}
      {mostrandoToppingsSelector && productoParaToppings && (
        <ToppingsSelector
          open={mostrandoToppingsSelector}
          onClose={() => {
            setMostrandoToppingsSelector(false);
            setProductoParaToppings(null);
            setToppingsSeleccionados([]);
            setVariacionesSeleccionadas({});
          }}
          producto={productoParaToppings}
          precioBase={productoParaToppings.precio_venta}
          organizationId={organization?.id}
          tipo={productoParaToppings.tipo || 'comida'}
          onConfirm={(toppings, precioTotal) => {
            // Agregar producto al carrito con toppings y variaciones
            agregarProductoConToppingsYVariaciones(
              productoParaToppings,
              toppings,
              variacionesSeleccionadas
            );
            setMostrandoToppingsSelector(false);
            setProductoParaToppings(null);
            setToppingsSeleccionados([]);
            setVariacionesSeleccionadas({});
          }}
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

      {/* Modal de regreso a pedidos */}
      {mostrarModalRegresarPedidos && (
        <div className="caja-modal-overlay" onClick={() => {
          setMostrarModalRegresarPedidos(false);
          setVieneDePedidos(false);
        }}>
          <div className="caja-modal-content" style={{ maxWidth: '320px', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>¿Regresar al menú de pedidos?</h3>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="caja-btn caja-btn-secondary"
                onClick={() => {
                  setMostrarModalRegresarPedidos(false);
                  setVieneDePedidos(false);
                }}
                style={{ padding: '0.5rem 1rem' }}
              >
                No
              </button>
              <button
                className="caja-btn caja-btn-primary"
                onClick={() => {
                  setMostrarModalRegresarPedidos(false);
                  setVieneDePedidos(false);
                  navigate('/dashboard/tomar-pedido');
                }}
                style={{ padding: '0.5rem 1rem' }}
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}

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
                    // Error silencioso
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

      {/* Modal de descuento */}
      <DescuentoModal
        isOpen={mostrarModalDescuento}
        onClose={() => setMostrarModalDescuento(false)}
        onAplicar={(nuevoDescuento) => {
          setDescuento(nuevoDescuento);
          setMostrarModalDescuento(false);
        }}
        cart={cart}
        descuentoActual={descuento}
      />

      {/* Modal de apertura de caja (solo en modo venta) */}
      {!esModoPedido && (
        <AperturaCajaModal
          isOpen={mostrarModalApertura}
          onClose={() => {
            // Permitir cerrar el modal (el usuario puede cancelar)
            // Marcar que fue cerrado manualmente para evitar que se vuelva a abrir automáticamente
            setModalCerradoManualmente(true);
            setMostrarModalApertura(false);
          }}
          onAperturaExitosa={async (apertura) => {
            setMostrarModalApertura(false);
            setModalMostradoInicialmente(true); // Marcar como mostrado para evitar que se vuelva a abrir
            setModalCerradoManualmente(false); // Resetear el flag de cierre manual
            // Esperar un momento antes de refetch para asegurar que la BD se actualizó
            setTimeout(() => {
              refetchApertura();
            }, 500);
            toast.success('Caja abierta exitosamente');
          }}
        />
      )}
    </div>
  );
}