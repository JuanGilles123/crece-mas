// 🍽️ Página para tomar pedidos (mejorada y adaptable)
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Minus, Trash2, Save, Circle, Users, Check, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useMesas } from '../hooks/useMesas';
import { useCrearPedido } from '../hooks/usePedidos';
import ReciboVenta from '../components/business/ReciboVenta';
import { canUsePedidos, getMesaEstadoColor } from '../utils/mesasUtils';
import { canUseToppings } from '../utils/toppingsUtils';
import { calcularPrecioConToppings } from '../utils/toppingsUtils';
import { ORDER_TYPES, getCompatibleOrderTypes, getOrderTypeFields, validateOrderFields } from '../constants/orderTypes';
import { supabase } from '../services/api/supabaseClient';
import ToppingsSelector from '../components/ToppingsSelector';
import VariacionesSelector from '../components/VariacionesSelector';
import OptimizedProductImage from '../components/business/OptimizedProductImage';
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
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const { hasFeature } = useSubscription();
  const { data: mesas = [] } = useMesas(organization?.id);
  const crearPedido = useCrearPedido();
  
  // Estados para pago inmediato
  const [mostrandoMetodoPago, setMostrandoMetodoPago] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('Efectivo');
  const [ventaCompletada, setVentaCompletada] = useState(null);

  // Estados principales
  const [tipoPedido, setTipoPedido] = useState(null); // null = no seleccionado, 'dine_in', 'takeout', 'delivery', 'express'
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(true);
  
  // Estados para campos adicionales según tipo de pedido
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [costoEnvio, setCostoEnvio] = useState('0');
  const [horaEstimada, setHoraEstimada] = useState('');
  const [numeroPersonas, setNumeroPersonas] = useState('');
  const [pagoInmediato, setPagoInmediato] = useState(false);
  
  // Estados para toppings y productos
  const [mostrandoToppingsSelector, setMostrandoToppingsSelector] = useState(false);
  const [productoParaToppings, setProductoParaToppings] = useState(null);
  const [mostrandoProductos, setMostrandoProductos] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mostrandoConfirmacionToppings, setMostrandoConfirmacionToppings] = useState(false);
  const [productosPendientesToppings, setProductosPendientesToppings] = useState([]);
  const [indiceProductoActualToppings, setIndiceProductoActualToppings] = useState(0);
  
  // Estados para variaciones
  const [mostrandoVariacionesSelector, setMostrandoVariacionesSelector] = useState(false);
  const [productoParaVariaciones, setProductoParaVariaciones] = useState(null);
  const [productosPendientesVariaciones, setProductosPendientesVariaciones] = useState([]);
  const [indiceProductoActualVariaciones, setIndiceProductoActualVariaciones] = useState(0);
  const [toppingsParaVariaciones, setToppingsParaVariaciones] = useState([]);
  const [precioTotalParaVariaciones, setPrecioTotalParaVariaciones] = useState(0);

  // Verificar acceso
  const acceso = canUsePedidos(organization, hasFeature);
  const puedeUsarToppings = organization && canUseToppings(organization, null, hasFeature).canUse;
  const tieneMesasHabilitadas = organization?.mesas_habilitadas || organization?.enabled_features?.includes('mesas');

  // Obtener tipos de pedido compatibles
  const tiposPedidoDisponibles = useMemo(() => {
    if (!organization?.business_type) return [];
    return getCompatibleOrderTypes(organization.business_type);
  }, [organization?.business_type]);

  // Obtener campos requeridos para el tipo de pedido seleccionado
  const camposRequeridos = useMemo(() => {
    if (!tipoPedido || !organization) return [];
    return getOrderTypeFields(tipoPedido, organization);
  }, [tipoPedido, organization]);

  // Filtrar mesas activas (mostrar todas: disponibles, ocupadas, reservadas)
  const mesasActivas = useMemo(() => {
    return mesas.filter(m => m.activa);
  }, [mesas]);
  
  // Separar mesas por estado para mostrar primero las disponibles
  const mesasDisponibles = useMemo(() => {
    return mesasActivas.filter(m => m.estado === 'disponible');
  }, [mesasActivas]);
  
  const mesasOcupadas = useMemo(() => {
    return mesasActivas.filter(m => m.estado === 'ocupada');
  }, [mesasActivas]);
  
  const mesasReservadas = useMemo(() => {
    return mesasActivas.filter(m => m.estado === 'reservada');
  }, [mesasActivas]);
  
  // Verificar si el tipo de pedido requiere mesa
  const requiereMesa = useMemo(() => {
    if (!tipoPedido) return false;
    const orderType = ORDER_TYPES[tipoPedido];
    return orderType?.requiresMesa && tieneMesasHabilitadas;
  }, [tipoPedido, tieneMesasHabilitadas]);

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

  // Calcular total (incluyendo costo de envío)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.precio_total || 0), 0);
  }, [items]);
  
  const total = useMemo(() => {
    const envio = parseFloat(costoEnvio) || 0;
    return subtotal + envio;
  }, [subtotal, costoEnvio]);

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
      // Verificar si algún producto tiene variaciones
      const productosConVariaciones = productosParaProcesar.filter(p => tieneVariaciones(p));
      const productosSinVariaciones = productosParaProcesar.filter(p => !tieneVariaciones(p));
      
      // Agregar productos sin variaciones directamente
      productosSinVariaciones.forEach(producto => {
        agregarItem(producto, [], producto.precio_venta, {});
      });
      
      // Procesar productos con variaciones
      if (productosConVariaciones.length > 0) {
        setProductosPendientesVariaciones(productosConVariaciones);
        setIndiceProductoActualVariaciones(0);
        setProductoParaVariaciones(productosConVariaciones[0]);
        setMostrandoProductos(false);
        setTimeout(() => {
          setMostrandoVariacionesSelector(true);
        }, 300);
      } else {
        setProductosSeleccionados([]);
        setMostrandoProductos(false);
        toast.success(`${cantidad} producto(s) agregado(s)`);
      }
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

  // Función para verificar si un producto tiene variaciones
  const tieneVariaciones = (producto) => {
    const variaciones = producto?.metadata?.variaciones_config;
    return variaciones && Array.isArray(variaciones) && variaciones.length > 0;
  };

  const agregarItem = (producto, toppings = [], precioTotal, variaciones = {}) => {
    setItems(prev => {
      // Crear clave única incluyendo variaciones
      const variacionesKey = JSON.stringify(variaciones || {});
      const idx = prev.findIndex(i =>
        i.producto_id === producto.id &&
        JSON.stringify(i.toppings || []) === JSON.stringify(toppings) &&
        JSON.stringify(i.variaciones || {}) === variacionesKey
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
        toppings: toppings.length > 0 ? toppings : [],
        variaciones: variaciones, // Agregar variaciones al item
        notas: ''
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
    
    // Verificar si el producto tiene variaciones después de seleccionar toppings
    if (tieneVariaciones(productoParaToppings)) {
      // Guardar toppings temporalmente y mostrar selector de variaciones
      setProductoParaVariaciones(productoParaToppings);
      setToppingsParaVariaciones(toppings); // Guardar los toppings seleccionados
      setPrecioTotalParaVariaciones(precioTotal); // Guardar el precio total con toppings
      setMostrandoToppingsSelector(false);
      // Guardar los toppings en el estado del producto para usarlos después
      setTimeout(() => {
        setMostrandoVariacionesSelector(true);
      }, 300);
      return;
    }
    
    agregarItem(productoParaToppings, toppings, precioTotal, {});
    
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

  // Handler para confirmar variaciones
  const handleVariacionesConfirm = (variaciones) => {
    if (!productoParaVariaciones) {
      console.error('No hay producto para variaciones');
      return;
    }
    
    // Obtener toppings si venimos del flujo de toppings
    const toppings = toppingsParaVariaciones.length > 0 ? toppingsParaVariaciones : [];
    const precioTotal = precioTotalParaVariaciones > 0 ? precioTotalParaVariaciones : productoParaVariaciones.precio_venta;
    
    // Agregar item con toppings y variaciones
    agregarItem(productoParaVariaciones, toppings, precioTotal, variaciones);
    
    // Limpiar estados temporales
    setToppingsParaVariaciones([]);
    setPrecioTotalParaVariaciones(0);
    
    // Verificar si hay más productos pendientes de variaciones
    if (productosPendientesVariaciones.length > 0) {
      const siguienteIndice = indiceProductoActualVariaciones + 1;
      if (siguienteIndice < productosPendientesVariaciones.length) {
        setIndiceProductoActualVariaciones(siguienteIndice);
        setProductoParaVariaciones(productosPendientesVariaciones[siguienteIndice]);
        // El selector de variaciones se mantiene abierto
      } else {
        // Terminamos con todos los productos
        const cantidadTotal = productosPendientesVariaciones.length;
        setProductoParaVariaciones(null);
        setProductosPendientesVariaciones([]);
        setIndiceProductoActualVariaciones(0);
        setProductosSeleccionados([]);
        setMostrandoVariacionesSelector(false);
        setMostrandoProductos(false);
        toast.success(`${cantidadTotal} producto(s) agregado(s) con variaciones`);
      }
    } else {
      // Si venimos del flujo de toppings, continuar con el siguiente producto pendiente de toppings
      const siguienteIndiceToppings = indiceProductoActualToppings + 1;
      if (siguienteIndiceToppings < productosPendientesToppings.length) {
        setIndiceProductoActualToppings(siguienteIndiceToppings);
        setProductoParaToppings(productosPendientesToppings[siguienteIndiceToppings]);
        setProductoParaVariaciones(null);
        setMostrandoVariacionesSelector(false);
        setTimeout(() => {
          setMostrandoToppingsSelector(true);
        }, 300);
      } else {
        // Terminamos con todos los productos
        const cantidadTotal = productosPendientesToppings.length;
        setProductoParaToppings(null);
        setProductosPendientesToppings([]);
        setIndiceProductoActualToppings(0);
        setProductoParaVariaciones(null);
        setProductosSeleccionados([]);
        setMostrandoVariacionesSelector(false);
        setMostrandoProductos(false);
        toast.success(`${cantidadTotal} producto(s) agregado(s) con toppings y variaciones`);
      }
    }
  };

  // Modificar cantidad
  const cambiarCantidad = (index, delta) => {
    setItems(prev => {
      const next = [...prev];
      const item = next[index];
      if (!item) return next;
      
      const nuevaCantidad = item.cantidad + delta;
      
      if (nuevaCantidad <= 0) {
        return next.filter((_, i) => i !== index);
      }

      // Recalcular precio total con toppings
      const precioBase = item.precio_unitario || 0;
      const precioConToppings = calcularPrecioConToppings(precioBase, item.toppings || []);
      
      // Crear nuevo objeto en lugar de mutar
      next[index] = {
        ...item,
        cantidad: nuevaCantidad,
        precio_total: precioConToppings * nuevaCantidad
      };
      
      return next;
    });
  };

  // Eliminar item
  const eliminarItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Actualizar notas de un item
  const actualizarNotasItem = (index, notas) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        notas: notas
      };
      return next;
    });
  };

  // Función para procesar pago inmediato
  const handlePagarAhora = async () => {
    if (!tipoPedido) {
      toast.error('Selecciona un tipo de pedido');
      setMostrandoMetodoPago(false);
      return;
    }

    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      setMostrandoMetodoPago(false);
      return;
    }

    // Validar campos requeridos según tipo de pedido
    const formData = {
      mesa: mesaSeleccionada?.id || null,
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      direccion_entrega: direccionEntrega.trim(),
      costo_envio: costoEnvio,
      hora_estimada: horaEstimada || null,
      numero_personas: numeroPersonas && numeroPersonas >= 1 ? numeroPersonas : 1
    };

    const validation = validateOrderFields(tipoPedido, formData, organization);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      setMostrandoMetodoPago(false);
      return;
    }

    if (!organization?.id || !user?.id) {
      toast.error('Error: Faltan datos de organización o usuario');
      setMostrandoMetodoPago(false);
      return;
    }

    try {
      // 1. Crear el pedido
      const itemsData = items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        toppings: item.toppings || [],
        variaciones: item.variaciones || {}, // Incluir variaciones
        notas: item.notas?.trim() || null
      }));

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
        pagoInmediato: true
      });

      // 2. Guardar el pedido en localStorage para que la caja lo cargue
      const pedidoParaCaja = {
        pedidoId: pedidoCreado.id,
        items: items.map(item => ({
          id: item.producto_id,
          nombre: item.producto_nombre,
          precio_venta: item.precio_total / item.cantidad, // Precio unitario con toppings
          qty: item.cantidad,
          toppings: item.toppings || [], // Incluir toppings
          variaciones: item.variaciones || {}, // Incluir variaciones
          notas: item.notas || null // Incluir notas
        })),
        total: total,
        tipoPedido: tipoPedido,
        clienteNombre: clienteNombre.trim() || null,
        clienteTelefono: clienteTelefono.trim() || null,
        mesa: mesaSeleccionada ? {
          id: mesaSeleccionada.id,
          numero: mesaSeleccionada.numero
        } : null
      };
      localStorage.setItem('pedidoParaPagar', JSON.stringify(pedidoParaCaja));
      
      // 3. Cerrar modal y limpiar formulario
      setMostrandoMetodoPago(false);
      setTipoPedido(null);
      setMesaSeleccionada(null);
      setItems([]);
      setNotas('');
      setQuery('');
      setClienteNombre('');
      setClienteTelefono('');
      setDireccionEntrega('');
      setCostoEnvio('0');
      setHoraEstimada('');
      setNumeroPersonas('');
      setPagoInmediato(false);
      setProductosSeleccionados([]);
      setMostrandoProductos(false);
      
      // 4. Redirigir a la caja para procesar el pago
      navigate('/dashboard/caja');
      toast.success('Pedido creado. Redirigiendo a la caja para procesar el pago...');
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error(error.message || 'Error al procesar el pago');
      setMostrandoMetodoPago(false);
    }
  };

  // Validar y guardar pedido
  const handleGuardarPedido = async (forzarPagoInmediato = false) => {
    // Usar el parámetro si se pasa, sino usar el estado
    const esPagoInmediato = forzarPagoInmediato || pagoInmediato;
    console.log('handleGuardarPedido ejecutado');
    console.log('pagoInmediato al inicio:', pagoInmediato);
    console.log('forzarPagoInmediato:', forzarPagoInmediato);
    console.log('esPagoInmediato:', esPagoInmediato);
    
    // Validar tipo de pedido
    if (!tipoPedido) {
      toast.error('Selecciona un tipo de pedido');
      return;
    }
    
    // Validar mesa si es requerida
    if (requiereMesa && !mesaSeleccionada) {
      toast.error('Selecciona una mesa');
      return;
    }
    
    // Validar productos
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    
    // Validar campos requeridos según tipo de pedido
    const formData = {
      mesa: mesaSeleccionada?.id || null,
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      direccion_entrega: direccionEntrega.trim(),
      costo_envio: costoEnvio,
      hora_estimada: horaEstimada || null,
      numero_personas: numeroPersonas && numeroPersonas >= 1 ? numeroPersonas : 1
    };
    
    const validation = validateOrderFields(tipoPedido, formData, organization);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
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
        variaciones: item.variaciones || {}, // Incluir variaciones
        notas: item.notas?.trim() || null
      }));

      // Determinar prioridad
      const prioridad = tipoPedido === 'express' ? 'alta' : 'normal';

      console.log('Antes de crear pedido - esPagoInmediato:', esPagoInmediato);
      
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

      console.log('Después de crear pedido:');
      console.log('- pedidoCreado:', pedidoCreado);
      console.log('- esPagoInmediato:', esPagoInmediato);
      console.log('- pedidoCreado existe?', !!pedidoCreado);
      console.log('- pedidoCreado.id:', pedidoCreado?.id);
      console.log('- Condición completa:', esPagoInmediato && pedidoCreado && pedidoCreado.id);

      // Si se seleccionó "Pagar ahora", redirigir a la caja con el pedido
      if (esPagoInmediato && pedidoCreado && pedidoCreado.id) {
        console.log('Pago inmediato detectado, preparando redirección a caja...', { pedidoCreado, esPagoInmediato });
        
        // Guardar el pedido en localStorage para que la caja lo cargue
        const pedidoParaCaja = {
          pedidoId: pedidoCreado.id,
          items: items.map(item => ({
            id: item.producto_id,
            nombre: item.producto_nombre,
            precio_venta: item.precio_total / item.cantidad, // Precio unitario con toppings
            qty: item.cantidad,
            toppings: item.toppings || [], // Incluir toppings
            variaciones: item.variaciones || {}, // Incluir variaciones
            notas: item.notas || null // Incluir notas
          })),
          total: total,
          tipoPedido: tipoPedido,
          clienteNombre: clienteNombre.trim() || null,
          clienteTelefono: clienteTelefono.trim() || null,
          mesa: mesaSeleccionada ? {
            id: mesaSeleccionada.id,
            numero: mesaSeleccionada.numero
          } : null
        };
        
        console.log('Guardando pedido en localStorage:', pedidoParaCaja);
        localStorage.setItem('pedidoParaPagar', JSON.stringify(pedidoParaCaja));
        
        // Limpiar formulario antes de redirigir
        setTipoPedido(null);
        setMesaSeleccionada(null);
        setItems([]);
        setNotas('');
        setQuery('');
        setClienteNombre('');
        setClienteTelefono('');
        setDireccionEntrega('');
        setCostoEnvio('0');
        setHoraEstimada('');
        setNumeroPersonas('');
        setPagoInmediato(false);
        setProductosSeleccionados([]);
        setMostrandoProductos(false);
        
        // Redirigir a la caja inmediatamente
        console.log('Redirigiendo a /dashboard/caja...');
        toast.success('Pedido creado. Redirigiendo a la caja...', { duration: 1500 });
        
        // Usar setTimeout para asegurar que el toast se muestre y el estado se actualice
        setTimeout(() => {
          navigate('/dashboard/caja', { replace: true });
        }, 200);
        
        return;
      }

      // Si llegamos aquí y esPagoInmediato es true pero no se redirigió, algo salió mal
      if (esPagoInmediato) {
        console.error('Error: esPagoInmediato es true pero no se redirigió a la caja', { pedidoCreado, esPagoInmediato });
        toast.error('Error al procesar el pago. Por favor, intenta de nuevo.');
        return;
      }

      // Limpiar formulario solo si NO es pago inmediato
      setTipoPedido(null);
      setMesaSeleccionada(null);
      setItems([]);
      setNotas('');
      setQuery('');
      setClienteNombre('');
      setClienteTelefono('');
      setDireccionEntrega('');
      setCostoEnvio('0');
      setHoraEstimada('');
      setNumeroPersonas('');
      setPagoInmediato(false);
      setProductosSeleccionados([]);
      setMostrandoProductos(false);
      toast.success('Pedido guardado correctamente');
    } catch (error) {
      console.error('Error guardando pedido:', error);
      toast.error(error.message || 'Error al guardar el pedido');
    }
  };
  
  // Limpiar formulario cuando cambia el tipo de pedido
  const handleCambiarTipoPedido = (nuevoTipo) => {
    setTipoPedido(nuevoTipo);
    // Limpiar campos específicos pero mantener productos si ya hay
    setMesaSeleccionada(null);
    setClienteNombre('');
    setClienteTelefono('');
    setDireccionEntrega('');
    setCostoEnvio('0');
    setHoraEstimada('');
    setNumeroPersonas('');
    setPagoInmediato(false);
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
        {tieneMesasHabilitadas && (
          <button
            className="pedido-btn-mapa"
            onClick={() => navigate('/dashboard/mesas')}
            title="Gestionar mapa de mesas"
          >
            <MapPin size={18} />
            Mapa de Mesas
          </button>
        )}
      </div>

      <div className="pedido-container">
        {/* Panel izquierdo: Configuración del pedido */}
        <div className="pedido-left">
          {/* Paso 1: Seleccionar tipo de pedido */}
          {!tipoPedido ? (
            <div className="pedido-section">
              <h2>Selecciona el Tipo de Pedido</h2>
              <div className="tipo-pedido-grid">
                {tiposPedidoDisponibles.map((tipo) => {
                  const IconComponent = tipo.Icon;
                  return (
                    <motion.button
                      key={tipo.id}
                      className="tipo-pedido-card"
                      onClick={() => handleCambiarTipoPedido(tipo.id)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="tipo-pedido-icon">
                        <IconComponent size={32} />
                      </div>
                      <h3>{tipo.label}</h3>
                      <p>{tipo.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Botón para cambiar tipo de pedido */}
              <div className="pedido-section">
                <div className="tipo-pedido-seleccionado">
                  <div className="tipo-pedido-seleccionado-info">
                    {(() => {
                      const tipo = ORDER_TYPES[tipoPedido];
                      const IconComponent = tipo?.Icon;
                      return (
                        <>
                          {IconComponent && <IconComponent size={20} />}
                          <span>{tipo?.label}</span>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    className="btn-cambiar-tipo"
                    onClick={() => handleCambiarTipoPedido(null)}
                  >
                    Cambiar
                  </button>
                </div>
              </div>

              {/* Campos dinámicos según tipo de pedido */}
              {camposRequeridos.length > 0 && (
                <div className="pedido-section">
                  <h2>Información del Pedido</h2>
                  <div className="pedido-campos-form">
                    {camposRequeridos.map((campo) => {
                      if (campo.key === 'mesa' && tieneMesasHabilitadas) {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>{campo.label}</label>
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
                                  onClick={() => setMesaSeleccionada(null)}
                                >
                                  Cambiar
                                </button>
                              </motion.div>
                            ) : (
                              <div className="mesas-grid-selector">
                                {mesasActivas.length === 0 ? (
                                  <div className="no-mesas">
                                    <p>No hay mesas activas</p>
                                    <small>O selecciona "Mostrador" para pedidos sin mesa</small>
                                  </div>
                                ) : (
                                  <>
                                    {/* Mesas disponibles */}
                                    {mesasDisponibles.map((mesa) => (
                                      <motion.button
                                        key={mesa.id}
                                        className="mesa-selector-card"
                                        onClick={() => setMesaSeleccionada(mesa)}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{ borderColor: getMesaEstadoColor('disponible') }}
                                      >
                                        <div className="mesa-estado-indicator">
                                          <Circle size={10} fill={getMesaEstadoColor('disponible')} />
                                        </div>
                                        <span className="mesa-numero">{mesa.numero}</span>
                                        <span className="mesa-capacidad"><Users size={12} /> {mesa.capacidad}</span>
                                      </motion.button>
                                    ))}
                                    
                                    {/* Mesas ocupadas */}
                                    {mesasOcupadas.map((mesa) => (
                                      <motion.button
                                        key={mesa.id}
                                        className="mesa-selector-card mesa-ocupada"
                                        onClick={() => {
                                          setMesaSeleccionada(mesa);
                                          toast('Esta mesa está ocupada. Puedes agregar pedidos adicionales.', {
                                            icon: '⚠️',
                                            duration: 3000
                                          });
                                        }}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{ borderColor: getMesaEstadoColor('ocupada') }}
                                      >
                                        <div className="mesa-estado-indicator">
                                          <Circle size={10} fill={getMesaEstadoColor('ocupada')} />
                                        </div>
                                        <span className="mesa-numero">{mesa.numero}</span>
                                        <span className="mesa-capacidad"><Users size={12} /> {mesa.capacidad}</span>
                                      </motion.button>
                                    ))}
                                    
                                    {/* Mesas reservadas */}
                                    {mesasReservadas.map((mesa) => (
                                      <motion.button
                                        key={mesa.id}
                                        className="mesa-selector-card mesa-reservada"
                                        onClick={() => {
                                          setMesaSeleccionada(mesa);
                                          toast('Esta mesa está reservada. Puedes agregar pedidos adicionales.', {
                                            icon: '📅',
                                            duration: 3000
                                          });
                                        }}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{ borderColor: getMesaEstadoColor('reservada') }}
                                      >
                                        <div className="mesa-estado-indicator">
                                          <Circle size={10} fill={getMesaEstadoColor('reservada')} />
                                        </div>
                                        <span className="mesa-numero">{mesa.numero}</span>
                                        <span className="mesa-capacidad"><Users size={12} /> {mesa.capacidad}</span>
                                      </motion.button>
                                    ))}
                                    
                                    <motion.button
                                      className="mesa-selector-card mostrador"
                                      onClick={() => setMesaSeleccionada({ id: null, numero: 'Mostrador', capacidad: 0 })}
                                      whileHover={{ scale: 1.05, y: -2 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <span className="mesa-numero">Mostrador</span>
                                      <span className="mesa-capacidad">Sin mesa</span>
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      if (campo.key === 'cliente_nombre') {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>
                              {campo.label} {campo.required && <span className="required">*</span>}
                            </label>
                            <input
                              type="text"
                              value={clienteNombre}
                              onChange={(e) => setClienteNombre(e.target.value)}
                              placeholder="Nombre del cliente"
                              required={campo.required}
                            />
                          </div>
                        );
                      }
                      
                      if (campo.key === 'cliente_telefono') {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>
                              {campo.label} {campo.required && <span className="required">*</span>}
                            </label>
                            <input
                              type="tel"
                              value={clienteTelefono}
                              onChange={(e) => setClienteTelefono(e.target.value)}
                              placeholder="Teléfono del cliente"
                              required={campo.required}
                            />
                          </div>
                        );
                      }
                      
                      if (campo.key === 'direccion_entrega') {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>
                              {campo.label} {campo.required && <span className="required">*</span>}
                            </label>
                            <textarea
                              value={direccionEntrega}
                              onChange={(e) => setDireccionEntrega(e.target.value)}
                              placeholder="Dirección completa de entrega"
                              rows="3"
                              required={campo.required}
                            />
                          </div>
                        );
                      }
                      
                      if (campo.key === 'costo_envio') {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>{campo.label}</label>
                            <input
                              type="number"
                              value={costoEnvio}
                              onChange={(e) => setCostoEnvio(e.target.value)}
                              placeholder="0"
                              min="0"
                              step="100"
                            />
                          </div>
                        );
                      }
                      
                      if (campo.key === 'hora_estimada') {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>{campo.label}</label>
                            <input
                              type="datetime-local"
                              value={horaEstimada}
                              onChange={(e) => setHoraEstimada(e.target.value)}
                            />
                          </div>
                        );
                      }
                      
                      if (campo.key === 'numero_personas') {
                        return (
                          <div key={campo.key} className="pedido-campo">
                            <label>{campo.label}</label>
                            <input
                              type="number"
                              value={numeroPersonas}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Permitir campo vacío mientras el usuario escribe
                                if (value === '') {
                                  setNumeroPersonas('');
                                } else {
                                  const num = parseInt(value);
                                  if (!isNaN(num) && num >= 1 && num <= 50) {
                                    setNumeroPersonas(num);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Al perder el foco, si está vacío o inválido, poner 1
                                const value = e.target.value;
                                if (!value || parseInt(value) < 1) {
                                  setNumeroPersonas(1);
                                }
                              }}
                              placeholder="1"
                              min="1"
                              max="50"
                            />
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Botón para agregar productos */}
              <div className="pedido-section">
                <button
                  className="btn-agregar-productos"
                  onClick={() => setMostrandoProductos(true)}
                >
                  <Plus size={20} />
                  Agregar Productos
                </button>
              </div>
            </>
          )}
        </div>

        {/* Panel derecho: Items del pedido */}
        <div className="pedido-right">
          <div className="pedido-resumen">
            <h2>
              {tipoPedido ? `Pedido ${ORDER_TYPES[tipoPedido]?.label}` : 'Nuevo Pedido'}
              {mesaSeleccionada && ` - ${mesaSeleccionada.numero}`}
            </h2>

            {!tipoPedido ? (
              <div className="pedido-vacio">
                <p>Selecciona un tipo de pedido para comenzar</p>
              </div>
            ) : items.length === 0 ? (
              <div className="pedido-vacio">
                <p>No hay items en el pedido</p>
                <small>Agrega productos al pedido</small>
              </div>
            ) : (
              <>
                <div className="pedido-items">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.producto_id}-${JSON.stringify(item.toppings)}-${index}`}
                        className="pedido-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <div className="pedido-item-header">
                          <div className="pedido-item-info">
                            <h4>{item.producto_nombre}</h4>
                            {item.toppings && item.toppings.length > 0 && (
                              <p className="pedido-item-toppings">
                                + {item.toppings.map(t => t.nombre).join(', ')}
                              </p>
                            )}
                            {item.variaciones && Object.keys(item.variaciones).length > 0 && (
                              <p className="pedido-item-variaciones">
                                {Object.entries(item.variaciones).map(([key, value], idx) => {
                                  // Buscar el label de la variación y opción
                                  const productoCompleto = productos.find(p => p.id === item.producto_id);
                                  const variacionConfig = productoCompleto?.metadata?.variaciones_config?.find(v => 
                                    (v.id || v.nombre?.toLowerCase()) === key.toLowerCase()
                                  );
                                  const opcion = variacionConfig?.opciones?.find(o => 
                                    (typeof o === 'string' ? o : o.valor) === value
                                  );
                                  const variacionNombre = variacionConfig?.nombre || key;
                                  const opcionLabel = typeof opcion === 'string' ? opcion : (opcion?.label || value);
                                  
                                  return (
                                    <span key={idx}>
                                      {variacionNombre}: {opcionLabel}
                                      {idx < Object.keys(item.variaciones).length - 1 && ' | '}
                                    </span>
                                  );
                                })}
                              </p>
                            )}
                            <p className="pedido-item-precio">{formatCOP(item.precio_total)}</p>
                          </div>
                          <div className="pedido-item-actions">
                            <button
                              className="btn-cantidad btn-cantidad-minus"
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarCantidad(index, -1);
                              }}
                              type="button"
                              aria-label="Disminuir cantidad"
                            >
                              <span className="btn-icon-wrapper">
                                <Minus size={20} strokeWidth={2.5} />
                              </span>
                            </button>
                            <span className="cantidad-display">{item.cantidad}</span>
                            <button
                              className="btn-cantidad btn-cantidad-plus"
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarCantidad(index, 1);
                              }}
                              type="button"
                              aria-label="Aumentar cantidad"
                            >
                              <span className="btn-icon-wrapper">
                                <Plus size={20} strokeWidth={2.5} />
                              </span>
                            </button>
                            <button
                              className="btn-eliminar"
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarItem(index);
                              }}
                              type="button"
                              aria-label="Eliminar producto"
                            >
                              <span className="btn-icon-wrapper">
                                <Trash2 size={20} strokeWidth={2.5} />
                              </span>
                            </button>
                          </div>
                        </div>
                        <div className="pedido-item-notas">
                          <input
                            type="text"
                            placeholder="Notas para este producto (ej: sin cebolla, bien cocido...)"
                            value={item.notas || ''}
                            onChange={(e) => actualizarNotasItem(index, e.target.value)}
                            className="pedido-item-notas-input"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="pedido-pago-option">
                  <label>Método de pago</label>
                  <div className="pedido-pago-options">
                    <button
                      type="button"
                      className={`pedido-pago-btn ${!pagoInmediato ? 'active' : ''}`}
                      onClick={() => setPagoInmediato(false)}
                    >
                      Pagar al final
                    </button>
                    <button
                      type="button"
                      className={`pedido-pago-btn ${pagoInmediato ? 'active' : ''}`}
                      onClick={async () => {
                        // Validar que haya productos
                        if (items.length === 0) {
                          toast.error('Agrega productos al pedido primero');
                          return;
                        }
                        
                        // Establecer pago inmediato y guardar el pedido pasando true como parámetro
                        setPagoInmediato(true);
                        await handleGuardarPedido(true); // Pasar true para forzar pago inmediato
                      }}
                      disabled={items.length === 0 || crearPedido.isLoading}
                    >
                      {crearPedido.isLoading ? 'Guardando...' : 'Pagar ahora'}
                    </button>
                  </div>
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
                    <span>Subtotal</span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  {parseFloat(costoEnvio) > 0 && (
                    <div className="pedido-total-line">
                      <span>Costo de Envío</span>
                      <span>{formatCOP(parseFloat(costoEnvio))}</span>
                    </div>
                  )}
                  <div className="pedido-total-line total">
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
        {mostrandoProductos && tipoPedido && (
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
                    {tipoPedido && (
                      <>
                        {(() => {
                          const tipo = ORDER_TYPES[tipoPedido];
                          const IconComponent = tipo?.Icon;
                          return IconComponent && <IconComponent size={14} style={{ display: 'inline-block', marginRight: '0.5rem' }} />;
                        })()}
                        {ORDER_TYPES[tipoPedido]?.label}
                        {mesaSeleccionada && ` • ${mesaSeleccionada.numero}`}
                      </>
                    )}
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

      {/* Selector de variaciones */}
      {mostrandoVariacionesSelector && productoParaVariaciones && (
        <VariacionesSelector
          open={mostrandoVariacionesSelector}
          onClose={() => {
            setMostrandoVariacionesSelector(false);
            // Si venimos del flujo de toppings, volver al selector de toppings
            if (toppingsParaVariaciones.length > 0 && productosPendientesToppings.length > 0) {
              setProductoParaVariaciones(null);
              setToppingsParaVariaciones([]);
              setPrecioTotalParaVariaciones(0);
              setTimeout(() => {
                setMostrandoToppingsSelector(true);
              }, 300);
            } else {
              setProductoParaVariaciones(null);
              setToppingsParaVariaciones([]);
              setPrecioTotalParaVariaciones(0);
              setProductosPendientesVariaciones([]);
              setIndiceProductoActualVariaciones(0);
            }
            setProductosSeleccionados([]);
            setMostrandoProductos(false);
          }}
          producto={productoParaVariaciones}
          onConfirm={handleVariacionesConfirm}
        />
      )}

      {/* Modal de método de pago para "Pagar ahora" */}
      {mostrandoMetodoPago && (
        <div className="pedido-metodo-pago-modal">
          <div className="pedido-metodo-pago-overlay" onClick={() => setMostrandoMetodoPago(false)} />
          <div className="pedido-metodo-pago-content">
            <h3>Selecciona método de pago</h3>
            <div className="pedido-metodo-pago-options">
              {['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi'].map((metodo) => (
                <button
                  key={metodo}
                  className={`pedido-metodo-pago-btn ${metodoPagoSeleccionado === metodo ? 'active' : ''}`}
                  onClick={() => setMetodoPagoSeleccionado(metodo)}
                >
                  {metodo}
                </button>
              ))}
            </div>
            <div className="pedido-metodo-pago-actions">
              <button
                className="pedido-metodo-pago-cancelar"
                onClick={() => setMostrandoMetodoPago(false)}
              >
                Cancelar
              </button>
              <button
                className="pedido-metodo-pago-confirmar"
                onClick={handlePagarAhora}
                disabled={crearPedido.isLoading}
              >
                {crearPedido.isLoading ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recibo */}
      {ventaCompletada && (
        <ReciboVenta
          venta={ventaCompletada}
          onNuevaVenta={() => {
            setVentaCompletada(null);
          }}
          onCerrar={() => {
            setVentaCompletada(null);
            navigate('/dashboard/pedidos');
          }}
          mostrarCerrar={true}
        />
      )}
    </div>
  );
};

export default TomarPedido;

