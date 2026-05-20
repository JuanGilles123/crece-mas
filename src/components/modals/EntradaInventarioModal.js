import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Building2, Plus, LayoutGrid, List, RefreshCw, Link2, Link2Off, Save, FileText, CheckCircle2, FolderOpen, Coins, Wallet } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useProductos, useActualizarProducto } from '../../hooks/useProductos';
import { useProveedores, useCrearGastoVariable, useCrearCreditoProveedor } from '../../hooks/useEgresos';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import AgregarProductoModalV2 from './AgregarProductoModalV2';
import EditarProductoModalV2 from './EditarProductoModalV2';
import ProveedorModal from './ProveedorModal';
import toast from 'react-hot-toast';
import { supabase } from '../../services/api/supabaseClient';
import './EntradaInventarioModal.css';

const EntradaInventarioModal = ({ open, onClose }) => {


  const { organization, user } = useAuth();
  const moneda = user?.user_metadata?.moneda || 'COP';
  const { data: productos = [], refetch: refetchProductos } = useProductos(organization?.id);
  const actualizarProducto = useActualizarProducto();
  const { data: proveedores = [], refetch: refetchProveedores } = useProveedores(organization?.id, { activo: true });
  const crearGastoVariable = useCrearGastoVariable();
  const crearCreditoProveedor = useCrearCreditoProveedor();

  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [productosParaAgregar, setProductosParaAgregar] = useState([]); // IDs de productos seleccionados en búsqueda
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [visibleCount, setVisibleCount] = useState(60); // Carga inicial
  const busquedaDebounceRef = useRef(null);
  const gridScrollRef = useRef(null);
  const isDraftCheckedRef = useRef(false); // Ref para evitar borrado accidental en la inicialización
  const isClosingRef = useRef(false); // Ref para evitar limpieza del borrador durante el cierre del modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Estado para refrescar catálogo
  const [tieneBorrador, setTieneBorrador] = useState(false); // Si existe un borrador guardado
  const [vistaLista, setVistaLista] = useState(false); // false = grid, true = lista
  const [mostrarCrearProducto, setMostrarCrearProducto] = useState(false);
  const [productosActualizando, setProductosActualizando] = useState(new Set()); // IDs de productos que se están actualizando
  const [modalProveedor, setModalProveedor] = useState({ open: false, proveedor: null });
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null); // ID del proveedor seleccionado
  const [mostrarSeleccionProveedor, setMostrarSeleccionProveedor] = useState(false);
  const [tipoPago, setTipoPago] = useState(null); // 'credito' | 'pagado' | null
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [modalEditar, setModalEditar] = useState({ open: false, producto: null });
  const [afectaCaja, setAfectaCaja] = useState(false); // Nuevo estado para saber si el dinero salió de caja
  
  // Estados para el Historial de Entradas de Inventario y Borradores en Base de Datos
  const [activeSubTab, setActiveSubTab] = useState('entrada'); // 'entrada' | 'historial'
  const [activeBatchId, setActiveBatchId] = useState(null); // ID del lote (borrador) activo
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [batchesHistorial, setBatchesHistorial] = useState([]);
  const [itemsHistorial, setItemsHistorial] = useState([]);
  const [filtroHistorial, setFiltroHistorial] = useState('todos'); // 'todos' | 'borradores' | 'completados'
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);

  // Lógica para arrastrar y minimizar el buscador
  const [posicionBusqueda, setPosicionBusqueda] = useState({ x: 0, y: 0 });
  const [busquedaMinimizada, setBusquedaMinimizada] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    if (e.target.closest('.productos-busqueda-header') && !e.target.closest('button')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - posicionBusqueda.x,
        y: e.clientY - posicionBusqueda.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosicionBusqueda({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Categorías existentes para el selector
  const categoriasExistentes = useMemo(() => {
    const cats = new Set(productos.map(p => p.metadata?.categoria || p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [productos]);

  // Handler para cuando se escanea un código de barras en el buscador
  const handleBarcodeScanned = useCallback((barcode) => {
    setBusqueda(barcode);
    // Asegurar que el modal de búsqueda esté abierto
    if (!mostrarBusqueda) {
      setMostrarBusqueda(true);
    }
    // Enfocar el input del buscador
    if (busquedaInputRef.current) {
      busquedaInputRef.current.focus();
    }
  }, [mostrarBusqueda]);

  // Hook para lector de códigos de barras en el buscador
  const {
    inputRef: barcodeInputRef,
    handleKeyDown: handleBarcodeKeyDown,
    handleInputChange: handleBarcodeInputChange
  } = useBarcodeScanner(handleBarcodeScanned, {
    minLength: 3,
    maxTimeBetweenChars: 50,
    autoSubmit: true,
    clearInput: false
  });

  // Ref para el input de búsqueda
  const busquedaInputRef = useRef(null);

  // Refs para detección global de código de barras (funciona aunque el cursor no esté en el buscador)
  const globalBarcodeBufferRef = useRef('');
  const globalLastCharTimeRef = useRef(null);
  const globalBarcodeTimeoutRef = useRef(null);
  const globalBarcodeProcessingRef = useRef(false);

  // Refrescar productos cada vez que se abre el modal
  useEffect(() => {
    if (open && organization?.id) {
      refetchProductos();
    }
  }, [open, organization?.id, refetchProductos]);

  // Sincronizar cambios externos (desde el modal de edición o actualización de catálogo) con la lista local
  useEffect(() => {
    if (productos.length > 0 && productosSeleccionados.length > 0) {
      setProductosSeleccionados(prev => {
        let huboCambios = false;
        const nuevos = prev.map(p => {
          const latestProduct = productos.find(lp => lp.id === p.producto_id);
          if (latestProduct) {
            let latestStock = latestProduct.stock || 0;
            let latestNombre = latestProduct.nombre;
            
            // Si es una variante, buscar el stock y nombre correspondiente de la variante
            if (p.variante_id) {
              const latestVariante = (latestProduct.variantes || []).find(v => v.id === p.variante_id);
              if (latestVariante) {
                latestStock = latestVariante.stock ?? 0;
                latestNombre = `${latestProduct.nombre} - ${latestVariante.nombre || 'Variante'}`;
              }
            }

            const nuevaCat = latestProduct.categoria || latestProduct.metadata?.categoria || '';
            const nuevaImg = latestProduct.imagen || '';
            const latestPrecioCompra = latestProduct.precio_compra || 0;
            const latestPrecioVenta = latestProduct.precio_venta || 0;

            const nameChanged = p.nombre !== latestNombre;
            const catChanged = p.categoria !== nuevaCat;
            const imgChanged = p.imagen_url !== nuevaImg;
            const stockChanged = p.stock_actual !== latestStock;
            const pcChanged = p.precio_compra_actual !== latestPrecioCompra;
            const pvChanged = p.precio_venta_actual !== latestPrecioVenta;

            if (nameChanged || catChanged || imgChanged || stockChanged || pcChanged || pvChanged) {
              huboCambios = true;
              
              // Si el usuario no ha modificado los valores nuevos, los actualizamos también
              const precioCompraNuevo = p.precio_compra_nuevo === p.precio_compra_actual 
                ? latestPrecioCompra 
                : p.precio_compra_nuevo;
                
              const precioVentaNuevo = p.precio_venta_nuevo === p.precio_venta_actual 
                ? latestPrecioVenta 
                : p.precio_venta_nuevo;

              const cantidad = parseFloat(p.cantidad_agregar) || 0;

              return {
                ...p,
                nombre: latestNombre,
                categoria: nuevaCat,
                imagen_url: nuevaImg,
                stock_actual: latestStock,
                stock_nuevo: latestStock + cantidad,
                precio_compra_actual: latestPrecioCompra,
                precio_compra_nuevo: precioCompraNuevo,
                precio_venta_actual: latestPrecioVenta,
                precio_venta_nuevo: precioVentaNuevo,
                porcentaje_ganancia: p.precio_compra_nuevo === p.precio_compra_actual && p.precio_venta_nuevo === p.precio_venta_actual
                  ? (latestPrecioCompra > 0 ? ((latestPrecioVenta - latestPrecioCompra) / latestPrecioCompra) * 100 : 0)
                  : p.porcentaje_ganancia
              };
            }
          }
          return p;
        });
        return huboCambios ? nuevos : prev;
      });
    }
  }, [productos, productosSeleccionados.length]);

  // Verificar si hay borrador al abrir el modal
  useEffect(() => {
    if (open && organization?.id) {
      isClosingRef.current = false; // Resetear bandera de cierre al abrir el modal
      const savedDraft = localStorage.getItem(`entrada_inventario_borrador_${organization.id}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.productosSeleccionados && parsed.productosSeleccionados.length > 0) {
            setTieneBorrador(true);
          }
        } catch (e) {
          console.error('Error parsing draft:', e);
        }
      } else {
        setTieneBorrador(false);
      }
      isDraftCheckedRef.current = true;
    } else if (!open) {
      isDraftCheckedRef.current = false;
      setTieneBorrador(false);
    }
  }, [open, organization?.id]);

  // Auto-guardar borrador en localStorage
  useEffect(() => {
    // Retornar temprano si el modal no está abierto, no hay organización, no se ha verificado el borrador, hay un borrador pendiente de recuperación, o el modal se está cerrando
    if (!open || !organization?.id || !isDraftCheckedRef.current || tieneBorrador || isClosingRef.current) {
      return;
    }

    if (productosSeleccionados.length > 0) {
      const borrador = {
        productosSeleccionados,
        proveedorSeleccionado,
        tipoPago,
        metodoPago,
        fechaPago,
        afectaCaja
      };
      localStorage.setItem(`entrada_inventario_borrador_${organization.id}`, JSON.stringify(borrador));
    } else {
      localStorage.removeItem(`entrada_inventario_borrador_${organization.id}`);
    }
  }, [productosSeleccionados, proveedorSeleccionado, tipoPago, metodoPago, fechaPago, afectaCaja, open, organization?.id, tieneBorrador]);

  // Listener global para detectar códigos de barras cuando el modal está abierto
  useEffect(() => {
    // Solo activar si el modal está abierto
    if (!open) {
      return;
    }

    const handleGlobalKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un input, textarea o contenteditable
      const target = e.target;
      const isInputElement = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input') ||
        target.closest('textarea');

      // Si está en el input del buscador, dejar que el hook normal lo maneje
      if (target === busquedaInputRef.current || target === barcodeInputRef?.current) {
        return;
      }

      // Si está en otro input, no procesar como código de barras
      if (isInputElement) {
        return;
      }

      // Si es Enter o Tab, podría ser el final del código de barras
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();

        const barcode = globalBarcodeBufferRef.current.trim();
        if (barcode.length >= 3 && !globalBarcodeProcessingRef.current) {
          globalBarcodeProcessingRef.current = true;
          handleBarcodeScanned(barcode);

          // Limpiar buffer
          globalBarcodeBufferRef.current = '';
          globalLastCharTimeRef.current = null;

          // Resetear flag después de un delay
          setTimeout(() => {
            globalBarcodeProcessingRef.current = false;
          }, 500);
        }
        return;
      }

      // Si es un carácter imprimible
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const now = Date.now();

        // Si pasó mucho tiempo desde el último carácter, resetear buffer
        if (globalLastCharTimeRef.current && (now - globalLastCharTimeRef.current) > 150) {
          globalBarcodeBufferRef.current = '';
        }

        // Agregar carácter al buffer
        globalBarcodeBufferRef.current += e.key;
        globalLastCharTimeRef.current = now;

        // Limpiar timeout anterior
        if (globalBarcodeTimeoutRef.current) {
          clearTimeout(globalBarcodeTimeoutRef.current);
        }

        // Si después de un tiempo no hay más caracteres, procesar como código de barras
        globalBarcodeTimeoutRef.current = setTimeout(() => {
          const barcode = globalBarcodeBufferRef.current.trim();
          if (barcode.length >= 3 && !globalBarcodeProcessingRef.current) {
            globalBarcodeProcessingRef.current = true;
            handleBarcodeScanned(barcode);

            // Limpiar buffer
            globalBarcodeBufferRef.current = '';
            globalLastCharTimeRef.current = null;

            // Resetear flag después de un delay
            setTimeout(() => {
              globalBarcodeProcessingRef.current = false;
            }, 500);
          }
        }, 150);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (globalBarcodeTimeoutRef.current) {
        clearTimeout(globalBarcodeTimeoutRef.current);
      }
      // Limpiar buffer cuando se cierre el modal
      globalBarcodeBufferRef.current = '';
      globalLastCharTimeRef.current = null;
      globalBarcodeProcessingRef.current = false;
    };
  }, [open, handleBarcodeScanned, barcodeInputRef]);

  const catalogoProductos = useMemo(() => {
    const items = [];
    productos.forEach((producto) => {
      const metadata = producto.metadata || {};
      items.push({
        key: `producto:${producto.id}`,
        tipo_item: 'producto',
        producto_id: producto.id,
        variante_id: null,
        nombre: producto.nombre,
        codigo: producto.codigo || '',
        descripcion: producto.descripcion || '',
        imagen: producto.imagen || '',
        metadata,
        tipo_producto: producto.tipo,
        precio_compra: producto.precio_compra || 0,
        precio_venta: producto.precio_venta || 0,
        stock: producto.stock || 0
      });

      (producto.variantes || []).forEach((vari) => {
        items.push({
          key: `variante:${vari.id}`,
          tipo_item: 'variante',
          producto_id: producto.id,
          variante_id: vari.id,
          nombre: `${producto.nombre} - ${vari.nombre || 'Variante'}`,
          codigo: vari.codigo || '',
          descripcion: producto.descripcion || '',
          imagen: producto.imagen || '',
          metadata,
          tipo_producto: producto.tipo,
          precio_compra: producto.precio_compra || 0,
          precio_venta: producto.precio_venta || 0,
          stock: vari.stock ?? 0,
          variante_nombre: vari.nombre || ''
        });
      });
    });
    return items;
  }, [productos]);

  // Debounce de búsqueda para no filtrar en cada tecla
  useEffect(() => {
    if (busquedaDebounceRef.current) clearTimeout(busquedaDebounceRef.current);
    busquedaDebounceRef.current = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setVisibleCount(60); // Resetear paginación al buscar
    }, 300);
    return () => clearTimeout(busquedaDebounceRef.current);
  }, [busqueda]);

  // Filtrar productos para búsqueda (usa debounced para no bloquear el input)
  const productosFiltradosTodos = useMemo(() => {
    if (!busquedaDebounced || busquedaDebounced.trim() === '') {
      return catalogoProductos;
    }
    const termino = busquedaDebounced.toLowerCase();
    return catalogoProductos.filter(item => {
      const nombre = (item.nombre || '').toLowerCase();
      const codigo = (item.codigo || '').toLowerCase();
      const descripcion = (item.descripcion || '').toLowerCase();
      const metadata = item.metadata || {};
      return (
        nombre.includes(termino) ||
        codigo.includes(termino) ||
        descripcion.includes(termino) ||
        (metadata.marca && metadata.marca.toLowerCase().includes(termino)) ||
        (metadata.modelo && metadata.modelo.toLowerCase().includes(termino)) ||
        (metadata.categoria && metadata.categoria.toLowerCase().includes(termino))
      );
    });
  }, [catalogoProductos, busquedaDebounced]);

  // Limitar items visibles para no renderizar todo a la vez
  const productosFiltrados = useMemo(
    () => productosFiltradosTodos.slice(0, visibleCount),
    [productosFiltradosTodos, visibleCount]
  );
  const hayMasProductos = productosFiltradosTodos.length > visibleCount;

  // Cargar más al hacer scroll en el grid
  const handleGridScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 300) {
      setVisibleCount(prev => prev + 60);
    }
  }, []);

  // Formatear moneda
  const formatearMoneda = (valor) => {
    if (!valor && valor !== 0) return '';
    const num = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d.-]/g, '')) : valor;
    if (isNaN(num)) return '';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Parsear moneda
  const parsearMoneda = (valor) => {
    if (!valor) return 0;
    // Eliminar todo lo que no sea número para evitar problemas con separadores de miles (.)
    const num = parseFloat(valor.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
  };


  // Toggle selección de producto en búsqueda
  const toggleProductoSeleccion = (itemKey) => {
    setProductosParaAgregar(prev => {
      if (prev.includes(itemKey)) {
        return prev.filter(id => id !== itemKey);
      } else {
        return [...prev, itemKey];
      }
    });
  };

  // Agregar múltiples productos seleccionados
  const agregarProductosSeleccionados = () => {
    if (productosParaAgregar.length === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    const productosAAgregar = catalogoProductos.filter(p =>
      productosParaAgregar.includes(p.key) &&
      !productosSeleccionados.find(ps => ps.key === p.key)
    );

    if (productosAAgregar.length === 0) {
      toast.error('Los productos seleccionados ya están en la lista');
      return;
    }

    const nuevosProductos = productosAAgregar.map(item => {
      const precioCompra = item.precio_compra || 0;
      const precioVenta = item.precio_venta || 0;
      // Calcular porcentaje inicial basado en precios actuales
      const porcentajeInicial = precioCompra > 0
        ? Math.round(((precioVenta - precioCompra) / precioCompra) * 100 * 10) / 10
        : 0;


      return {
        key: item.key,
        producto_id: item.producto_id,
        variante_id: item.variante_id || null,
        tipo_item: item.tipo_item,
        nombre: item.nombre,
        nombre_original: item.nombre,
        codigo: item.codigo || '',
        variante_nombre: item.variante_nombre || '',
        precio_compra_actual: precioCompra,
        precio_compra_nuevo: precioCompra,
        precio_venta_actual: precioVenta,
        precio_venta_nuevo: precioVenta,
        porcentaje_ganancia: porcentajeInicial,
        stock_actual: item.stock || 0,
        cantidad_agregar: 0,
        stock_nuevo: item.stock || 0,
        imagen_url: item.imagen,
        categoria: item.categoria || item.metadata?.categoria || '',
        precios_vinculados: true
      };

    });

    setProductosSeleccionados([...productosSeleccionados, ...nuevosProductos]);
    setProductosParaAgregar([]);
    toast.success(`${nuevosProductos.length} producto(s) agregado(s)`);
  };

  // Seleccionar/deseleccionar todos
  const toggleSeleccionarTodos = () => {
    const productosDisponibles = productosFiltradosTodos.filter(p =>
      !productosSeleccionados.find(ps => ps.key === p.key)
    );

    if (productosDisponibles.length === 0) {
      setProductosParaAgregar([]);
      return;
    }

    const todosSeleccionados = productosDisponibles.every(p =>
      productosParaAgregar.includes(p.key)
    );

    if (todosSeleccionados) {
      setProductosParaAgregar([]);
    } else {
      setProductosParaAgregar(productosDisponibles.map(p => p.key));
    }
  };

  // Eliminar producto de la lista
  const eliminarProducto = (key) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto de la lista?')) {
      setProductosSeleccionados(productosSeleccionados.filter(p => p.key !== key));
      toast.success('Producto eliminado de la lista');
    }
  };

  // Actualizar producto individualmente
  const handleActualizarProductoIndividual = async (producto) => {
    if (producto.precio_compra_nuevo === undefined || producto.precio_compra_nuevo === null || producto.precio_compra_nuevo === '') {
      toast.error('Debes ingresar un precio de compra');
      return;
    }

    if (producto.cantidad_agregar === undefined || producto.cantidad_agregar === null || producto.cantidad_agregar === '') {
      toast.error('Debes ingresar una cantidad');
      return;
    }

    setProductosActualizando(prev => new Set(prev).add(producto.key));

    try {
      const updates = {};

      // Actualizar precio de compra si cambió
      if (producto.precio_compra_nuevo !== undefined && producto.precio_compra_nuevo !== producto.precio_compra_actual) {
        updates.precio_compra = producto.precio_compra_nuevo;
      }

      // Actualizar precio de venta si cambió
      if (producto.precio_venta_nuevo !== undefined && producto.precio_venta_nuevo !== producto.precio_venta_actual) {
        updates.precio_venta = producto.precio_venta_nuevo;
      }

      // Actualizar stock (sumar cantidad_agregar al stock actual)
      if (producto.cantidad_agregar > 0) {
        const nuevoStock = (producto.stock_actual || 0) + producto.cantidad_agregar;
        if (producto.variante_id) {
          const { error: varianteError } = await supabase
            .from('product_variants')
            .update({ stock: nuevoStock })
            .eq('id', producto.variante_id);
          if (varianteError) {
            throw varianteError;
          }
        } else {
          updates.stock = nuevoStock;
        }
      }

      // Solo actualizar si hay cambios
      if (Object.keys(updates).length > 0) {
        await actualizarProducto.mutateAsync({
          id: producto.producto_id,
          updates,
          organizationId: organization?.id
        });

        // Registrar movimiento de stock si hubo cambio en el inventario
        if (producto.cantidad_agregar > 0) {
          await supabase.from('movimientos_stock').insert([{
            organization_id: organization?.id,
            producto_id: producto.producto_id,
            producto_nombre: producto.nombre,
            variante_id: producto.variante_id || null,
            tipo: 'entrada',
            cantidad: producto.cantidad_agregar,
            stock_anterior: producto.stock_actual,
            stock_nuevo: producto.stock_nuevo,
            usuario_id: user?.id,
            usuario_nombre: user?.user_metadata?.full_name || user?.email || 'Sistema',
            notas: `Entrada individual: ${producto.nombre}${producto.variante_nombre ? ` (${producto.variante_nombre})` : ''}`
          }]);
        }

        // Actualizar el producto en la lista con los nuevos valores
        setProductosSeleccionados(productosSeleccionados.map(p => {
          if (p.key === producto.key) {
            return {
              ...p,
              precio_compra_actual: updates.precio_compra !== undefined ? updates.precio_compra : p.precio_compra_actual,
              precio_compra_nuevo: updates.precio_compra !== undefined ? updates.precio_compra : p.precio_compra_nuevo,
              precio_venta_actual: updates.precio_venta !== undefined ? updates.precio_venta : p.precio_venta_actual,
              precio_venta_nuevo: updates.precio_venta !== undefined ? updates.precio_venta : p.precio_venta_nuevo,
              stock_actual: updates.stock !== undefined ? updates.stock : (producto.cantidad_agregar > 0 ? (p.stock_actual || 0) + producto.cantidad_agregar : p.stock_actual),
              stock_nuevo: updates.stock !== undefined ? updates.stock : (producto.cantidad_agregar > 0 ? (p.stock_actual || 0) + producto.cantidad_agregar : p.stock_nuevo),
              cantidad_agregar: 0 // Resetear cantidad después de actualizar
            };
          }
          return p;
        }));

        toast.success(`${producto.nombre} actualizado exitosamente`);
      } else {
        toast.info('No hay cambios para actualizar');
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error(`Error al actualizar ${producto.nombre}`);
    } finally {
      setProductosActualizando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(producto.key);
        return nuevo;
      });
    }
  };

  // Calcular precio de venta basado en precio de compra y porcentaje
  const calcularPrecioVenta = (precioCompra, porcentaje) => {
    const precio = parseFloat(precioCompra) || 0;
    const porc = parseFloat(porcentaje) || 0;
    return precio * (1 + porc / 100);
  };

  const calcularPorcentaje = (precioCompra, precioVenta) => {
    const compra = parseFloat(precioCompra) || 0;
    const venta = parseFloat(precioVenta) || 0;
    if (compra === 0) return 0;
    const res = ((venta - compra) / compra) * 100;
    return Math.round(res * 10) / 10;
  };


  // Actualizar campo de un producto
  const actualizarCampo = (itemKey, campo, valor) => {
    setProductosSeleccionados(productosSeleccionados.map(p => {
      if (p.key === itemKey) {
        const actualizado = { ...p, [campo]: valor };

        // Si se actualiza cantidad_agregar, calcular stock_nuevo
        if (campo === 'cantidad_agregar') {
          const cantidad = parseFloat(valor) || 0;
          actualizado.stock_nuevo = actualizado.stock_actual + cantidad;
        }

        // Si se actualiza precio_compra_nuevo, recalcular precio_venta_nuevo o mantenerlo fijo
        if (campo === 'precio_compra_nuevo') {
          const precioCompra = parsearMoneda(valor);
          actualizado.precio_compra_nuevo = precioCompra;
          
          if (p.precios_vinculados === false) {
            // Mantener precio_venta_nuevo congelado y en su lugar recalcular el porcentaje de ganancia
            actualizado.porcentaje_ganancia = calcularPorcentaje(precioCompra, actualizado.precio_venta_nuevo || 0);
          } else {
            // Solo recalcular si el porcentaje existe, de lo contrario mantener el precio de venta actual
            if (actualizado.porcentaje_ganancia !== undefined && actualizado.porcentaje_ganancia !== null) {
              actualizado.precio_venta_nuevo = calcularPrecioVenta(precioCompra, actualizado.porcentaje_ganancia || 0);
            }
          }
        }

        // Si se actualiza porcentaje_ganancia, recalcular precio_venta_nuevo
        if (campo === 'porcentaje_ganancia') {
          const porcentaje = parseFloat(valor) || 0;
          actualizado.porcentaje_ganancia = porcentaje;
          actualizado.precio_venta_nuevo = calcularPrecioVenta(actualizado.precio_compra_nuevo || 0, porcentaje);
        }

        // Si se actualiza precio_venta_nuevo manualmente, recalcular porcentaje_ganancia
        if (campo === 'precio_venta_nuevo') {
          const precioVenta = parsearMoneda(valor);
          actualizado.precio_venta_nuevo = precioVenta;
          actualizado.porcentaje_ganancia = calcularPorcentaje(actualizado.precio_compra_nuevo || 0, precioVenta);
        }

        return actualizado;
      }
      return p;
    }));
  };

  // Actualizar precio (manejar formato de moneda)
  const actualizarPrecio = (id, campo, valor) => {
    const valorNumerico = parsearMoneda(valor);
    actualizarCampo(id, campo, valorNumerico);
  };

  // Actualizar porcentaje
  const actualizarPorcentaje = (id, valor) => {
    const porcentaje = parseFloat(valor) || 0;
    actualizarCampo(id, 'porcentaje_ganancia', porcentaje);
  };

  // Calcular total de la compra
  const calcularTotalCompra = () => {
    const total = productosSeleccionados.reduce((sum, producto) => {
      const precioCompra = parseFloat(producto.precio_compra_nuevo) || parseFloat(producto.precio_compra_actual) || 0;
      const cantidad = parseFloat(producto.cantidad_agregar) || 0;
      const subtotal = precioCompra * cantidad;
      return sum + subtotal;
    }, 0);
    return Math.round(total * 100) / 100; // Redondear a 2 decimales
  };

  // Calcular total de la venta proyectado
  const calcularTotalVenta = () => {
    const total = productosSeleccionados.reduce((sum, producto) => {
      const precioVenta = parseFloat(producto.precio_venta_nuevo) || parseFloat(producto.precio_venta_actual) || 0;
      const cantidad = parseFloat(producto.cantidad_agregar) || 0;
      const subtotal = precioVenta * cantidad;
      return sum + subtotal;
    }, 0);
    return Math.round(total * 100) / 100;
  };


  // Guardar cambios
  const handleGuardar = async () => {
    if (productosSeleccionados.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }

    // Si hay proveedor, preguntar por tipo de pago
    if (proveedorSeleccionado && !tipoPago) {
      toast.error('Debes seleccionar si fue a crédito o pagado');
      return;
    }

    setIsSubmitting(true);

    try {
      // Actualizar cada producto
      for (const producto of productosSeleccionados) {
        const updates = {};

        // Actualizar precio de compra si cambió
        if (producto.precio_compra_nuevo !== producto.precio_compra_actual) {
          updates.precio_compra = producto.precio_compra_nuevo;
        }

        // Actualizar precio de venta si cambió
        if (producto.precio_venta_nuevo !== producto.precio_venta_actual) {
          updates.precio_venta = producto.precio_venta_nuevo;
        }

        // Actualizar stock si hay cantidad agregada
        if (producto.cantidad_agregar > 0) {
          // Solo actualizar stock para productos físicos o comida
          const productoOriginal = productos.find(p => p.id === producto.producto_id);
          if (productoOriginal && (productoOriginal.tipo === 'fisico' || productoOriginal.tipo === 'comida')) {
            if (producto.variante_id) {
              const { error: varianteError } = await supabase
                .from('product_variants')
                .update({ stock: producto.stock_nuevo })
                .eq('id', producto.variante_id);
              if (varianteError) {
                throw varianteError;
              }
            } else {
              updates.stock = producto.stock_nuevo;
            }
          }
        }

        // Solo actualizar si hay cambios
        if (Object.keys(updates).length > 0) {
          await actualizarProducto.mutateAsync({
            id: producto.producto_id,
            updates,
            organizationId: organization?.id,
            silent: true
          });
        }

        // Registrar movimiento de stock si hubo cambio
        if (producto.cantidad_agregar > 0) {
          await supabase.from('movimientos_stock').insert([{
            organization_id: organization?.id,
            producto_id: producto.producto_id,
            producto_nombre: producto.nombre,
            variante_id: producto.variante_id || null,
            tipo: 'entrada',
            cantidad: producto.cantidad_agregar,
            stock_anterior: producto.stock_actual,
            stock_nuevo: producto.stock_nuevo,
            usuario_id: user?.id,
            usuario_nombre: user?.user_metadata?.full_name || user?.email || 'Sistema',
            notas: `Entrada de inventario masiva${proveedorSeleccionado ? ` - Proveedor: ${proveedores.find(p => p.id === proveedorSeleccionado)?.nombre}` : ''}`
          }]);
        }
      }

      // Si hay tipo de pago, registrar en egresos (incluso sin proveedor para gastos pagados)
      if (tipoPago) {
        const totalCompra = calcularTotalCompra();

        // Reconfirmación de afectación de caja
        const confirmMsg = afectaCaja 
          ? `El gasto de ${totalCompra.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} SE DESCONTARÁ de la caja actual.\n\n¿Es correcto?`
          : `El gasto de ${totalCompra.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} NO se descontará de la caja (solo registro informativo).\n\n¿Es correcto?`;
        
        if (!window.confirm(confirmMsg)) {
          setIsSubmitting(false);
          return;
        }

        if (totalCompra <= 0) {
          toast.error('El total de la compra debe ser mayor a cero');
          setIsSubmitting(false);
          return;
        }

        const proveedor = proveedores.find(p => p.id === proveedorSeleccionado);
        const nombreProveedor = proveedor?.nombre || 'Proveedor';

        try {
          if (tipoPago === 'credito') {
            // Crear crédito a proveedor
            const creditoData = {
              organization_id: organization?.id,
              proveedor_id: proveedorSeleccionado,
              monto_total: totalCompra,
              monto_pagado: 0,
              monto_pendiente: totalCompra,
              fecha_emision: new Date().toISOString().split('T')[0],
              fecha_vencimiento: fechaPago,
              factura_numero: null,
              notas: `Entrada de inventario: ${productosSeleccionados.map(p => p.nombre).join(', ')}`,
              estado: 'pendiente'
            };

            await crearCreditoProveedor.mutateAsync(creditoData);
            toast.success('Crédito a proveedor creado exitosamente');
          } else if (tipoPago === 'pagado') {
            // Crear gasto variable
            const gastoData = {
              organization_id: organization?.id,
              user_id: user?.id,
              nombre: `Compra de inventario - ${nombreProveedor}`,
              descripcion: `Productos: ${productosSeleccionados.map(p => `${p.nombre} (${p.cantidad_agregar || 0})`).join(', ')}`,
              monto: totalCompra.toString(),
              fecha: fechaPago,
              metodo_pago: metodoPago,
              proveedor_id: proveedorSeleccionado,
              afecta_caja: afectaCaja,
              notas: `Entrada de inventario registrada automáticamente`
            };

            await crearGastoVariable.mutateAsync(gastoData);
            toast.success('Gasto variable registrado exitosamente');
          }
        } catch (errorEgreso) {
          console.error('Error al registrar en egresos:', errorEgreso);
          toast.error(`Error al registrar ${tipoPago === 'credito' ? 'el crédito' : 'el gasto'}. ${errorEgreso.message || ''}`);
          // Continuar aunque falle el registro en egresos, el inventario ya se actualizó
        }
      }

      // 1. Guardar la entrada completada en el historial de la base de datos
      try {
        const nombreProveedor = proveedorSeleccionado 
          ? proveedores.find(p => p.id === proveedorSeleccionado)?.nombre 
          : 'Proveedor no especificado';
        const batchName = `Entrada: ${nombreProveedor} - ${new Date().toLocaleDateString('es-CO')}`;

        const { data: batch, error: batchError } = await supabase
          .from('inventory_import_batches')
          .insert([{
            organization_id: organization.id,
            name: batchName,
            status: 'approved',
            created_by: user.id
          }])
          .select()
          .single();

        if (!batchError && batch) {
          const itemsToInsert = productosSeleccionados.map(p => ({
            batch_id: batch.id,
            organization_id: organization.id,
            codigo: p.codigo || null,
            nombre: p.nombre,
            precio_compra: Number(p.precio_compra_nuevo) || 0,
            precio_venta: Number(p.precio_venta_nuevo) || 0,
            stock: Number(p.cantidad_agregar) || 0,
            tipo: p.tipo || 'fisico',
            created_by: user.id,
            metadata: {
              producto_id: p.producto_id,
              variante_id: p.variante_id || null,
              precio_compra_actual: p.precio_compra_actual,
              precio_venta_actual: p.precio_venta_actual,
              stock_actual: p.stock_actual,
              stock_nuevo: p.stock_nuevo,
              key: p.key,
              proveedorSeleccionado,
              tipoPago,
              metodoPago,
              fechaPago,
              afectaCaja
            }
          }));

          await supabase.from('inventory_import_items').insert(itemsToInsert);
        }

        // 2. Si estábamos editando un borrador activo, lo archivamos
        if (activeBatchId) {
          await supabase
            .from('inventory_import_batches')
            .update({ status: 'deleted' })
            .eq('id', activeBatchId);
        }
      } catch (historyError) {
        console.error('Error al registrar entrada en historial de base de datos:', historyError);
      }

      // Limpiar borrador local al guardar con éxito
      localStorage.removeItem(`entrada_inventario_borrador_${organization?.id}`);
      setTieneBorrador(false);

      // Mostrar resumen detallado y amigable
      const totalImpactados = productosSeleccionados.length;
      const totalUnidades = productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.cantidad_agregar) || 0), 0);
      toast.success(
        <div style={{ textAlign: 'left' }}>
          <strong>¡Inventario actualizado exitosamente!</strong>
          <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>
            <div>• {totalImpactados} producto(s) modificado(s) con éxito.</div>
            {totalUnidades > 0 && <div>• {totalUnidades} unidad(es) ingresadas al stock.</div>}
            {proveedorSeleccionado && <div>• Proveedor: {proveedores.find(p => p.id === proveedorSeleccionado)?.nombre}</div>}
            {tipoPago === 'pagado' && <div>• Gasto registrado ({metodoPago})</div>}
            {tipoPago === 'credito' && <div>• Crédito de proveedor registrado</div>}
          </div>
        </div>,
        { duration: 6000 }
      );

      isClosingRef.current = true;
      setProductosSeleccionados([]);
      setTipoPago(null);
      setProveedorSeleccionado(null);
      
      // Resetear estados del historial
      setActiveSubTab('entrada');
      setActiveBatchId(null);
      
      onClose();
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      toast.error('Error al actualizar el inventario. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpiar al cerrar
  const handleClose = () => {
    isClosingRef.current = true;
    setProductosSeleccionados([]);
    setProductosParaAgregar([]);
    setBusqueda('');
    setMostrarBusqueda(false);
    setProveedorSeleccionado(null);
    setTipoPago(null);
    setMetodoPago('transferencia');
    setFechaPago(new Date().toISOString().split('T')[0]);
    setAfectaCaja(true);
    
    // Resetear estados del historial
    setActiveSubTab('entrada');
    setActiveBatchId(null);
    setFiltroHistorial('todos');
    setBusquedaHistorial('');
    setSelectedBatchDetail(null);
    
    onClose();
  };

  // Manejar cuando se crea un nuevo proveedor
  const handleProveedorCreado = () => {
    refetchProveedores();
    setModalProveedor({ open: false, proveedor: null });
  };

  const handleAbrirEdicion = (item) => {
    const p = productos.find(prod => prod.id === item.producto_id);
    if (p) {
      setModalEditar({ open: true, producto: p });
    } else {
      toast.error('No se encontró la información completa del producto');
    }
  };



  const handleProductoCreado = () => {
    setMostrarCrearProducto(false);
    setMostrarBusqueda(true);
  };

  // Refrescar catálogo manual
  const handleActualizarCatalogo = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProductos(),
        refetchProveedores()
      ]);
      toast.success('Catálogo de productos y proveedores actualizado');
    } catch (error) {
      console.error('Error al actualizar catálogo:', error);
      toast.error('Error al actualizar el catálogo');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Guardar borrador y salir
  // Cargar Historial y Borradores desde Supabase
  const cargarHistorialBatches = async () => {
    if (!organization?.id) return;
    setLoadingHistorial(true);
    try {
      const { data: batches, error: errorBatches } = await supabase
        .from('inventory_import_batches')
        .select('*')
        .eq('organization_id', organization.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (errorBatches) throw errorBatches;

      const { data: items, error: errorItems } = await supabase
        .from('inventory_import_items')
        .select('*')
        .eq('organization_id', organization.id);

      if (errorItems) throw errorItems;

      setBatchesHistorial(batches || []);
      setItemsHistorial(items || []);
    } catch (e) {
      console.error('Error cargando historial:', e);
      toast.error('Error al cargar el historial de la base de datos');
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Guardar borrador en base de datos
  const handleGuardarBorradorDB = async () => {
    if (productosSeleccionados.length === 0) {
      toast.error('No hay productos en la planilla para guardar');
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading('Guardando borrador en la base de datos...');
    try {
      // 1. Si estábamos editando un borrador existente, lo archivamos primero
      if (activeBatchId) {
        await supabase
          .from('inventory_import_batches')
          .update({ status: 'deleted' })
          .eq('id', activeBatchId);
      }

      // 2. Crear el nuevo lote en la base de datos
      const nombreProveedor = proveedorSeleccionado 
        ? proveedores.find(p => p.id === proveedorSeleccionado)?.nombre 
        : 'Proveedor no especificado';
      
      const batchName = `Borrador: ${nombreProveedor} - ${new Date().toLocaleDateString('es-CO')}`;

      const { data: batch, error: batchError } = await supabase
        .from('inventory_import_batches')
        .insert([{
          organization_id: organization.id,
          name: batchName,
          status: 'open',
          created_by: user.id
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // 3. Crear los ítems del lote
      const itemsToInsert = productosSeleccionados.map(p => ({
        batch_id: batch.id,
        organization_id: organization.id,
        codigo: p.codigo || null,
        nombre: p.nombre,
        precio_compra: Number(p.precio_compra_nuevo) || 0,
        precio_venta: Number(p.precio_venta_nuevo) || 0,
        stock: Number(p.cantidad_agregar) || 0,
        tipo: p.tipo || 'fisico',
        created_by: user.id,
        metadata: {
          producto_id: p.producto_id,
          variante_id: p.variante_id || null,
          precio_compra_actual: p.precio_compra_actual,
          precio_venta_actual: p.precio_venta_actual,
          stock_actual: p.stock_actual,
          stock_nuevo: p.stock_nuevo,
          key: p.key,
          proveedorSeleccionado,
          tipoPago,
          metodoPago,
          fechaPago,
          afectaCaja
        }
      }));

      const { error: itemsError } = await supabase
        .from('inventory_import_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Borrador guardado en la base de datos con éxito.', { id: loadingToastId });
      handleClose();
    } catch (e) {
      console.error('Error al guardar borrador en DB:', e);
      toast.error('No se pudo guardar el borrador en la base de datos', { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retomar Borrador de la Base de Datos
  const handleRetomarBorradorDB = (batch) => {
    const batchItems = itemsHistorial.filter(item => item.batch_id === batch.id);
    if (batchItems.length === 0) {
      toast.error('Este borrador no contiene productos');
      return;
    }

    try {
      const reconstructed = batchItems.map(item => {
        const metadata = item.metadata || {};
        return {
          producto_id: metadata.producto_id,
          variante_id: metadata.variante_id || null,
          nombre: item.nombre,
          codigo: item.codigo || '',
          precio_compra_actual: metadata.precio_compra_actual || 0,
          precio_compra_nuevo: item.precio_compra || 0,
          precio_venta_actual: metadata.precio_venta_actual || 0,
          precio_venta_nuevo: item.precio_venta || 0,
          stock_actual: metadata.stock_actual || 0,
          stock_nuevo: metadata.stock_nuevo || 0,
          cantidad_agregar: item.stock || 0,
          key: metadata.key || `${metadata.producto_id}-${metadata.variante_id || 'base'}`,
          precios_vinculados: true
        };
      });

      const firstMetadata = batchItems[0]?.metadata || {};
      setProveedorSeleccionado(firstMetadata.proveedorSeleccionado || null);
      setTipoPago(firstMetadata.tipoPago || null);
      setMetodoPago(firstMetadata.metodoPago || 'transferencia');
      setFechaPago(firstMetadata.fechaPago || new Date().toISOString().split('T')[0]);
      setAfectaCaja(firstMetadata.afectaCaja ?? true);

      setProductosSeleccionados(reconstructed);
      setActiveBatchId(batch.id); // Lote activo para actualizar al guardar
      setActiveSubTab('entrada'); // Cambiar a planilla
      toast.success('Borrador cargado desde la base de datos');
    } catch (e) {
      console.error('Error al retomar borrador:', e);
      toast.error('Error al cargar los datos del borrador');
    }
  };

  // Duplicar Entrada Completada como Nueva Planilla
  const handleDuplicarEntradaDB = (batch) => {
    const batchItems = itemsHistorial.filter(item => item.batch_id === batch.id);
    if (batchItems.length === 0) {
      toast.error('Esta entrada no contiene productos');
      return;
    }

    try {
      const reconstructed = batchItems.map(item => {
        const metadata = item.metadata || {};
        return {
          producto_id: metadata.producto_id,
          variante_id: metadata.variante_id || null,
          nombre: item.nombre,
          codigo: item.codigo || '',
          precio_compra_actual: metadata.precio_compra_actual || 0,
          precio_compra_nuevo: item.precio_compra || 0,
          precio_venta_actual: metadata.precio_venta_actual || 0,
          precio_venta_nuevo: item.precio_venta || 0,
          stock_actual: metadata.stock_actual || 0,
          stock_nuevo: metadata.stock_nuevo || 0,
          cantidad_agregar: item.stock || 0,
          key: metadata.key || `${metadata.producto_id}-${metadata.variante_id || 'base'}`,
          precios_vinculados: true
        };
      });

      const firstMetadata = batchItems[0]?.metadata || {};
      setProveedorSeleccionado(firstMetadata.proveedorSeleccionado || null);
      setTipoPago(firstMetadata.tipoPago || null);
      setMetodoPago(firstMetadata.metodoPago || 'transferencia');
      setFechaPago(firstMetadata.fechaPago || new Date().toISOString().split('T')[0]);
      setAfectaCaja(firstMetadata.afectaCaja ?? true);

      setProductosSeleccionados(reconstructed);
      setActiveBatchId(null); // Es una nueva entrada, no sobrescribe el borrador viejo
      setActiveSubTab('entrada'); // Cambiar a planilla
      toast.success('Entrada duplicada en la planilla');
    } catch (e) {
      console.error('Error al duplicar entrada:', e);
      toast.error('Error al duplicar los datos de la entrada');
    }
  };

  // Eliminar/Archivar Borrador en DB
  const handleEliminarBorradorDB = async (batchId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este borrador de la base de datos?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_import_batches')
        .update({ status: 'deleted' })
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Borrador eliminado correctamente');
      cargarHistorialBatches();
    } catch (e) {
      console.error('Error eliminando borrador:', e);
      toast.error('No se pudo eliminar el borrador');
    }
  };

  const filteredBatches = useMemo(() => {
    return batchesHistorial.filter(batch => {
      if (filtroHistorial === 'borradores' && batch.status !== 'open') return false;
      if (filtroHistorial === 'completados' && batch.status !== 'approved') return false;
      
      if (busquedaHistorial) {
        const query = busquedaHistorial.toLowerCase();
        return batch.name?.toLowerCase().includes(query) || 
               new Date(batch.created_at).toLocaleDateString('es-CO').includes(query);
      }
      return true;
    });
  }, [batchesHistorial, filtroHistorial, busquedaHistorial]);

  const renderHistorialContent = () => {
    if (loadingHistorial) {
      return (
        <div className="historial-loading-container">
          <div className="historial-loading-spinner" />
          <p>Cargando historial y cotizaciones desde la base de datos...</p>
        </div>
      );
    }

    return (
      <div className="historial-tab-content">
        {/* Filtros */}
        <div className="historial-filters-bar">
          <div className="historial-search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por proveedor o fecha (DD/MM/AAAA)..."
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              className="historial-search-input"
            />
          </div>
          <div className="historial-pills">
            <button
              type="button"
              className={`historial-pill ${filtroHistorial === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltroHistorial('todos')}
            >
              Todos ({batchesHistorial.length})
            </button>
            <button
              type="button"
              className={`historial-pill ${filtroHistorial === 'borradores' ? 'active' : ''}`}
              onClick={() => setFiltroHistorial('borradores')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={14} /> Cotizaciones ({batchesHistorial.filter(b => b.status === 'open').length})
            </button>
            <button
              type="button"
              className={`historial-pill ${filtroHistorial === 'completados' ? 'active' : ''}`}
              onClick={() => setFiltroHistorial('completados')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={14} /> Completadas ({batchesHistorial.filter(b => b.status === 'approved').length})
            </button>

          </div>
        </div>

        {/* Lista de lotes */}
        {filteredBatches.length === 0 ? (
          <div className="historial-empty-state">
            <div className="empty-icon">
              <FolderOpen size={48} style={{ color: '#94a3b8' }} />
            </div>
            <h3>No se encontraron registros</h3>


            <p>No hay entradas de inventario o borradores que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="historial-grid">
            {filteredBatches.map(batch => {
              const batchItems = itemsHistorial.filter(item => item.batch_id === batch.id);
              const totalItemsCount = batchItems.length;
              const totalUnidades = batchItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
              const totalInversion = batchItems.reduce((sum, item) => sum + (Number(item.precio_compra) * Number(item.stock) || 0), 0);
              const isDraft = batch.status === 'open';

              return (
                <div key={batch.id} className={`historial-card ${isDraft ? 'draft-card' : 'approved-card'}`}>
                  <div className="card-header">
                    <div className="card-status-badge">
                      {isDraft ? (
                        <span className="badge-draft">📝 Cotización / Borrador</span>
                      ) : (
                        <span className="badge-completed">✅ Completada</span>
                      )}
                    </div>
                    <span className="card-date">
                      {new Date(batch.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="card-title">
                    <h4>{batch.name}</h4>
                  </div>

                  <div className="card-stats">
                    <div className="stat-row">
                      <span>Variedades:</span>
                      <strong>{totalItemsCount}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Stock agregado:</span>
                      <strong>{totalUnidades} uds</strong>
                    </div>
                    <div className="stat-row highlight">
                      <span>Costo total:</span>
                      <strong>
                        {totalInversion.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </strong>
                    </div>
                  </div>

                  {batchItems.length > 0 && (
                    <div className="card-products-preview">
                      <h5>Vista previa:</h5>
                      <ul>
                        {batchItems.slice(0, 3).map((item, idx) => (
                          <li key={idx}>
                            • {item.nombre} <span className="preview-qty">x{item.stock}</span>
                          </li>
                        ))}
                        {batchItems.length > 3 && (
                          <li className="preview-more">y {batchItems.length - 3} más...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="card-actions">
                    {isDraft ? (
                      <>
                        <button
                          type="button"
                          className="btn-card-secondary"
                          onClick={() => setSelectedBatchDetail(batch)}
                          title="Ver detalle completo"
                          style={{ flex: 'none', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', padding: 0 }}
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="btn-card-primary retomar"
                          onClick={() => handleRetomarBorradorDB(batch)}
                          title="Retomar borrador"
                        >
                          ✏️ Retomar
                        </button>
                        <button
                          type="button"
                          className="btn-card-danger"
                          onClick={() => handleEliminarBorradorDB(batch.id)}
                          title="Eliminar borrador"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-card-secondary"
                          onClick={() => setSelectedBatchDetail(batch)}
                          title="Ver detalle completo"
                          style={{ flex: 'none', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', padding: 0 }}
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="btn-card-secondary duplicar"
                          onClick={() => handleDuplicarEntradaDB(batch)}
                          title="Cargar productos en la planilla"
                        >
                          🔄 Duplicar en Planilla
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderDetalleBatchModal = () => {
    if (!selectedBatchDetail) return null;

    const batch = selectedBatchDetail;
    const batchItems = itemsHistorial.filter(item => item.batch_id === batch.id);
    const totalItemsCount = batchItems.length;
    const totalUnidades = batchItems.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
    const totalInversion = batchItems.reduce((sum, item) => sum + (Number(item.precio_compra) * Number(item.stock) || 0), 0);
    const isDraft = batch.status === 'open';

    const firstMetadata = batchItems[0]?.metadata || {};
    const pSel = firstMetadata.proveedorSeleccionado;
    const proveedorName = pSel 
      ? proveedores.find(p => p.id === pSel)?.nombre 
      : 'Proveedor no especificado';
    const tPago = firstMetadata.tipoPago;
    const mPago = firstMetadata.metodoPago;
    const fPago = firstMetadata.fechaPago;
    const afCaja = firstMetadata.afectaCaja;

    return (
      <div className="batch-detail-overlay" onClick={() => setSelectedBatchDetail(null)}>
        <div className="batch-detail-content" onClick={(e) => e.stopPropagation()}>
          <div className="batch-detail-header">
            <div>
              <span className={`batch-detail-badge ${isDraft ? 'draft' : 'completed'}`}>
                {isDraft ? '📝 Cotización / Borrador' : '✅ Entrada Completada'}
              </span>
              <h3>Detalle de Entrada: {batch.name}</h3>
              <p className="batch-detail-subtitle">
                Registrado el {new Date(batch.created_at).toLocaleString('es-CO')}
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close-detail"
              onClick={() => setSelectedBatchDetail(null)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="batch-detail-body">
            <div className="batch-detail-meta-grid">
              <div className="meta-card">
                <span className="meta-label">Proveedor</span>
                <span className="meta-val">{proveedorName}</span>
              </div>
              <div className="meta-card">
                <span className="meta-label">Tipo de Pago</span>
                <span className="meta-val">
                  {tPago === 'credito' ? '⏳ Crédito de Proveedor' : tPago === 'pagado' ? '💵 De contado' : 'No especificado'}
                </span>
              </div>
              {tPago === 'pagado' && (
                <div className="meta-card">
                  <span className="meta-label">Método de Pago</span>
                  <span className="meta-val" style={{ textTransform: 'capitalize' }}>{mPago}</span>
                </div>
              )}
              {fPago && (
                <div className="meta-card">
                  <span className="meta-label">
                    {tPago === 'credito' ? 'Fecha Vencimiento' : 'Fecha de Pago'}
                  </span>
                  <span className="meta-val">
                    {new Date(fPago + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              )}
              {tPago === 'pagado' && (
                <div className="meta-card">
                  <span className="meta-label">Afectó Caja Diario</span>
                  <span className={`meta-val ${afCaja ? 'orange' : 'blue'}`}>
                    {afCaja ? 'Sí (Descontado de saldo)' : 'No (Solo registro)'}
                  </span>
                </div>
              )}
            </div>

            <div className="batch-detail-table-container">
              <table className="batch-detail-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th style={{ textAlign: 'right' }}>Precio Compra</th>
                    <th style={{ textAlign: 'right' }}>Precio Venta</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {batchItems.map((item, idx) => {
                    const subtotal = (Number(item.precio_compra) || 0) * (Number(item.stock) || 0);
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.nombre}</div>
                          {item.metadata?.variante_id && (
                            <span className="variante-badge">Variante activa</span>
                          )}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.codigo || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                          {Number(item.precio_compra).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        </td>
                        <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          {Number(item.precio_venta).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{item.stock}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                          {subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="batch-detail-footer">
            <div className="detail-totals">
              <div className="total-stat">
                <span>Variedades:</span>
                <strong>{totalItemsCount}</strong>
              </div>
              <div className="total-stat">
                <span>Stock Total:</span>
                <strong>{totalUnidades} uds</strong>
              </div>
              <div className="total-stat highlight">
                <span>Inversión Total:</span>
                <strong>
                  {totalInversion.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </strong>
              </div>
            </div>

            <div className="detail-actions">
              {isDraft ? (
                <button
                  type="button"
                  className="btn-detail-primary"
                  onClick={() => {
                    handleRetomarBorradorDB(batch);
                    setSelectedBatchDetail(null);
                  }}
                >
                  ✏️ Retomar Borrador
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-detail-primary secondary"
                  onClick={() => {
                    handleDuplicarEntradaDB(batch);
                    setSelectedBatchDetail(null);
                  }}
                >
                  🔄 Duplicar en Planilla
                </button>
              )}
              <button
                type="button"
                className="btn-detail-close"
                onClick={() => setSelectedBatchDetail(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!open) return null;


  const modalContent = (
    <div className="modal-overlay entrada-inventario-overlay" onClick={handleClose}>
      <div className="modal-content entrada-inventario-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="entrada-inventario-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            <h2 style={{ margin: 0 }}>Entrada de Inventario</h2>
            
            {/* Pestañas de Navegación Premium */}
            <div className="entrada-tabs-container">
              <button
                type="button"
                className={`entrada-tab-button ${activeSubTab === 'entrada' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('entrada')}
              >
                Planilla de Entrada
              </button>
              <button
                type="button"
                className={`entrada-tab-button ${activeSubTab === 'historial' ? 'active' : ''}`}
                onClick={() => {
                  setActiveSubTab('historial');
                  cargarHistorialBatches();
                }}
              >
                Historial y Cotizaciones
              </button>
            </div>

            {activeSubTab === 'entrada' && productosSeleccionados.length > 0 && (
              <span className="auto-save-badge" title="Tus cambios se guardan automáticamente en tu navegador">
                <Save size={12} /> Auto-guardado
              </span>
            )}

          </div>

          {activeSubTab === 'entrada' && (
            /* Selector de Proveedor Compacto */
            <div className="header-proveedor-compact" style={{ marginRight: '1rem' }}>
              {!proveedorSeleccionado ? (
                <button
                  type="button"
                  className="btn-header-add-proveedor"
                  onClick={() => setMostrarSeleccionProveedor(true)}
                  title="Seleccionar proveedor"
                >
                  <Plus size={16} />
                  <span>Proveedor</span>
                </button>
              ) : (
                <div className="proveedor-active-badge">
                  <Building2 size={14} />
                  <span className="proveedor-name-header">
                    {proveedores.find(p => p.id === proveedorSeleccionado)?.nombre}
                  </span>
                  <button
                    type="button"
                    className="btn-change-proveedor"
                    onClick={() => setMostrarSeleccionProveedor(true)}
                    title="Cambiar proveedor"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn-remove-proveedor-header"
                    onClick={() => setProveedorSeleccionado(null)}
                    title="Quitar proveedor"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Botones de acción - Movido fuera del body para fijarlo arriba */}
        {activeSubTab === 'entrada' && (
          <div className="entrada-inventario-actions">
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-buscar-productos"
                onClick={() => setMostrarBusqueda(!mostrarBusqueda)}
              >
                <Search size={16} />
                {mostrarBusqueda ? 'Ocultar búsqueda' : 'Buscar productos'}
              </button>

              <button
                type="button"
                className="btn-buscar-productos"
                onClick={handleActualizarCatalogo}
                disabled={isRefreshing}
                title="Actualiza el catálogo de productos con la base de datos sin perder lo que ya agregaste"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} />
                {isRefreshing ? 'Sincronizando...' : 'Actualizar Catálogo'}
              </button>

              <button
                type="button"
                className="btn-buscar-productos"
                onClick={() => setMostrarCrearProducto(true)}
              >
                <Plus size={16} />
                Crear producto
              </button>
            </div>

            {/* Sumatoria en tiempo real */}
            {productosSeleccionados.length > 0 && (
              <div className="entrada-inventario-resumen-rapido">
                <div className="resumen-item">
                  <span className="resumen-label">Total Compra:</span>
                  <span className="resumen-value inversion">
                    {calcularTotalCompra().toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="resumen-divider" />
                <div className="resumen-item">
                  <span className="resumen-label">Total Venta:</span>
                  <span className="resumen-value venta" style={{ color: '#059669', fontWeight: 700 }}>
                    {calcularTotalVenta().toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="resumen-divider" />
                <div className="resumen-item">
                  <span className="resumen-label">Productos:</span>
                  <span className="resumen-value">{productosSeleccionados.length}</span>
                </div>
                <div className="resumen-divider" />
                <div className="resumen-item">
                  <span className="resumen-label">Unidades:</span>
                  <span className="resumen-value">
                    {productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.cantidad_agregar) || 0), 0)}
                  </span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Body */}
        <div className="entrada-inventario-body" style={activeSubTab === 'historial' ? { padding: '1.5rem', overflowY: 'auto' } : {}}>
          {activeSubTab === 'entrada' ? (
            <>

          {/* Lista de productos seleccionados */}
          {productosSeleccionados.length === 0 ? (
            <div className="entrada-inventario-empty">
              <p>No hay productos agregados</p>
              <p className="entrada-inventario-empty-hint">
                Haz clic en "Buscar productos" para comenzar
              </p>
            </div>
          ) : (
            <div className="entrada-inventario-lista">
              <table className="entrada-inventario-table">
                <thead>
                  <tr>
                    <th className="col-producto">Producto</th>
                    <th className="col-precio">Precio<br/>Compra</th>
                    <th className="col-porcentaje">%</th>
                    <th className="col-precio">Precio<br/>Venta</th>
                    <th className="col-cantidad">Cantidad</th>
                    <th className="col-subtotal" style={{ textAlign: 'right' }}>Total<br/>Compra</th>
                    <th className="col-subtotal" style={{ textAlign: 'right' }}>Total<br/>Venta</th>
                    <th className="col-stock">Stock<br/>Actual</th>
                    <th className="col-stock">Stock<br/>Nuevo</th>
                    <th className="col-has-imagen">¿Tiene<br/>Imagen?</th>
                    <th className="col-categoria">Categoría</th>
                    <th className="col-acciones"></th>
                  </tr>
                </thead>
                <tbody>
                  {productosSeleccionados.map((producto) => (
                    <tr key={producto.key}>
                      <td className="col-producto">
                        <div className="producto-info">
                          <strong>{producto.nombre}</strong>
                          {producto.codigo && (
                            <span className="producto-codigo">{producto.codigo}</span>
                          )}
                        </div>
                      </td>
                      <td className="col-precio">
                        <input
                          type="text"
                          value={formatearMoneda(producto.precio_compra_nuevo)}
                          onChange={(e) => actualizarPrecio(producto.key, 'precio_compra_nuevo', e.target.value)}
                          placeholder="0"
                          className="input-moneda"
                        />
                      </td>
                      <td className="col-porcentaje">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                          <input
                            type="number"
                            value={producto.porcentaje_ganancia || ''}
                            onChange={(e) => actualizarPorcentaje(producto.key, e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            placeholder="0"
                            step="0.1"
                            className="input-porcentaje"
                          />
                          <span className="unit-label">%</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoEstado = producto.precios_vinculados !== false ? false : true;
                              setProductosSeleccionados(productosSeleccionados.map(p => 
                                p.key === producto.key ? { ...p, precios_vinculados: nuevoEstado } : p
                              ));
                              if (nuevoEstado) {
                                toast.success('Precio de venta vinculado al %');
                              } else {
                                toast.success('Precio de venta congelado (no cambiará al variar compra)');
                              }
                            }}
                            className={`btn-link-precio ${producto.precios_vinculados !== false ? 'linked' : 'unlinked'}`}
                            title={producto.precios_vinculados !== false 
                              ? "Vínculo activo: Cambiar la compra recalcula la venta" 
                              : "Vínculo pausado: Cambiar la compra NO altera la venta"
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              marginLeft: '4px',
                              color: producto.precios_vinculados !== false ? 'var(--accent-primary, #02A5E0)' : '#94a3b8',
                              transition: 'all 0.2s'
                            }}
                          >
                            {producto.precios_vinculados !== false ? <Link2 size={14} /> : <Link2Off size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="col-precio">
                        <input
                          type="text"
                          value={formatearMoneda(producto.precio_venta_nuevo)}
                          onChange={(e) => actualizarPrecio(producto.key, 'precio_venta_nuevo', e.target.value)}
                          placeholder="0"
                          className="input-moneda"
                        />
                      </td>
                      <td className="col-cantidad">
                        <input
                          type="number"
                          value={producto.cantidad_agregar || ''}
                          onChange={(e) => actualizarCampo(producto.key, 'cantidad_agregar', parseInt(e.target.value) || 0)}
                          onWheel={(e) => e.target.blur()}
                          placeholder="0"
                          min="0"
                          step="1"
                          className="input-cantidad"
                        />
                      </td>
                      <td className="col-subtotal" style={{ fontWeight: 600, textAlign: 'right', fontSize: '0.85rem', color: '#1e293b' }}>
                        ${formatearMoneda(producto.precio_compra_nuevo * (producto.cantidad_agregar || 0))}
                      </td>
                      <td className="col-subtotal" style={{ fontWeight: 600, textAlign: 'right', fontSize: '0.85rem', color: '#059669' }}>
                        ${formatearMoneda(producto.precio_venta_nuevo * (producto.cantidad_agregar || 0))}
                      </td>


                      <td className="col-stock">
                        <span className="stock-actual">{producto.stock_actual}</span>
                      </td>
                      <td className="col-stock">
                        <span className="stock-nuevo">{producto.stock_nuevo}</span>
                      </td>
                      <td className="col-has-imagen" style={{ textAlign: 'center' }}>
                        {producto.imagen_url ? (
                          <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>SÍ</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>NO</span>
                        )}
                      </td>
                      <td className="col-categoria">
                        <select
                          value={producto.categoria || ''}
                          onChange={(e) => actualizarCampo(producto.key, 'categoria', e.target.value)}
                          className="input-categoria-select"
                        >
                          <option value="">Sin categoría</option>
                          {categoriasExistentes.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="col-acciones">
                        <div className="btn-actions-wrapper">
                          <button
                            type="button"
                            className="btn-edit-item"
                            onClick={() => handleAbrirEdicion(producto)}
                            title="Editar"
                            tabIndex="-1"
                          >
                            <span className="icon-edit">✐</span>
                          </button>
                          <button
                            type="button"
                            className={`btn-save-item ${productosActualizando.has(producto.key) ? 'disabled' : ''}`}
                            onClick={() => handleActualizarProductoIndividual(producto)}
                            title="Actualizar"
                            disabled={productosActualizando.has(producto.key)}
                            tabIndex="-1"
                          >
                            {productosActualizando.has(producto.key) ? (
                              <div className="spinner-icon" />
                            ) : (
                              <span className="icon-save">✓</span>
                            )}
                          </button>
                          <button
                            type="button"
                            className={`btn-remove-item ${productosActualizando.has(producto.key) ? 'disabled' : ''}`}
                            onClick={() => eliminarProducto(producto.key)}
                            title="Eliminar"
                            disabled={productosActualizando.has(producto.key)}
                            tabIndex="-1"
                          >
                            <span className="icon-trash">×</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="entrada-inventario-totals-row">
                    <td className="col-producto" style={{ fontWeight: 700, color: '#1e293b' }}>TOTALES</td>
                    <td className="col-precio" style={{ fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                      ${formatearMoneda(productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.precio_compra_nuevo) || 0), 0))}
                    </td>
                    <td className="col-porcentaje"></td>
                    <td className="col-precio" style={{ fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                      ${formatearMoneda(productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.precio_venta_nuevo) || 0), 0))}
                    </td>
                    <td className="col-cantidad" style={{ fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>
                      {productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.cantidad_agregar) || 0), 0)}
                    </td>
                    <td className="col-subtotal" style={{ fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                      ${formatearMoneda(calcularTotalCompra())}
                    </td>
                    <td className="col-subtotal" style={{ fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                      ${formatearMoneda(calcularTotalVenta())}
                    </td>

                    <td className="col-stock" style={{ fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                      {productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.stock_actual) || 0), 0)}
                    </td>
                    <td className="col-stock" style={{ fontWeight: 700, color: '#059669', textAlign: 'center' }}>
                      {productosSeleccionados.reduce((sum, p) => sum + (parseFloat(p.stock_nuevo) || 0), 0)}
                    </td>
                    <td className="col-has-imagen"></td>
                    <td className="col-categoria"></td>
                    <td className="col-acciones"></td>
                  </tr>
                </tfoot>

              </table>

            </div>
          )}
          {productosSeleccionados.length > 0 && (
            <div className="entrada-inventario-pago-section" style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                Registro de Pago
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Tipo de Pago *
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!proveedorSeleccionado) {
                          toast.error('Selecciona un proveedor para comprar a crédito');
                          return;
                        }
                        setTipoPago('credito');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '2px solid',
                        borderColor: tipoPago === 'credito' ? '#02A5E0' : '#e5e7eb',
                        background: tipoPago === 'credito' ? '#FFFFFF' : '#fff',
                        borderRadius: '8px',
                        cursor: proveedorSeleccionado ? 'pointer' : 'not-allowed',
                        fontWeight: tipoPago === 'credito' ? 600 : 400,
                        color: tipoPago === 'credito' ? '#02A5E0' : '#374151',
                        transition: 'all 0.2s',
                        opacity: proveedorSeleccionado ? 1 : 0.5
                      }}
                      title={!proveedorSeleccionado ? "Debes seleccionar un proveedor para usar crédito" : ""}
                    >
                      A Crédito
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoPago('pagado')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '2px solid',
                        borderColor: tipoPago === 'pagado' ? '#10b981' : '#e5e7eb',
                        background: tipoPago === 'pagado' ? '#f0fdf4' : '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: tipoPago === 'pagado' ? 600 : 400,
                        color: tipoPago === 'pagado' ? '#10b981' : '#374151',
                        transition: 'all 0.2s'
                      }}
                    >
                      Pagado
                    </button>
                  </div>
                </div>

                {tipoPago && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {tipoPago === 'pagado' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                          Método de Pago
                        </label>
                        <select
                          value={metodoPago}
                          onChange={(e) => setMetodoPago(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '0.875rem'
                          }}
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                    )}
                    <div style={tipoPago === 'credito' ? { gridColumn: 'span 2' } : {}}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                        {tipoPago === 'pagado' ? 'Fecha de Pago' : 'Fecha de Vencimiento'}
                      </label>
                      <input
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>
                )}

                {tipoPago === 'pagado' && (
                  <div 
                    onClick={() => setAfectaCaja(!afectaCaja)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '1rem', 
                      background: afectaCaja ? '#fff7ed' : '#f0f9ff',
                      border: `2px solid ${afectaCaja ? '#fb923c' : '#02A5E0'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      marginTop: '0.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease',
                      animation: !afectaCaja ? 'pulse-blue 2s infinite' : 'none'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: `2px solid ${afectaCaja ? '#fb923c' : '#02A5E0'}`,
                      background: afectaCaja ? '#fb923c' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {afectaCaja && <Check size={16} color="white" strokeWidth={4} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 800, color: afectaCaja ? '#9a3412' : '#1e40af', marginBottom: '2px' }}>
                        {afectaCaja ? (
                          <>
                            <Coins size={16} /> SE DESCONTARÁ DE LA CAJA
                          </>
                        ) : (
                          <>
                            <Wallet size={16} /> NO DESCONTAR DE CAJA (Marcar para incluir)
                          </>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: afectaCaja ? '#c2410c' : '#2E2E2E', lineHeight: '1.3', fontWeight: 500 }}>
                        {afectaCaja 
                          ? 'El valor se restará del saldo final en el cierre de caja de hoy.' 
                          : 'Para que este gasto reste dinero de tu caja hoy, debes marcar esta casilla.'}
                      </div>
                    </div>
                  </div>
                )}

                {tipoPago && (
                  <div style={{
                    padding: '1rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>Total de la compra:</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {calcularTotalCompra().toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {tipoPago === 'credito'
                        ? 'Se creará un crédito a proveedor que podrás pagar después'
                        : 'Se registrará como un gasto variable en egresos'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          ) : (
            renderHistorialContent()
          )}
        </div>

        {/* Footer */}
        <div className="entrada-inventario-footer">
          {activeSubTab === 'entrada' ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              {productosSeleccionados.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary btn-borrador-footer"
                  onClick={handleGuardarBorradorDB}
                  disabled={isSubmitting}
                  style={{ marginRight: 'auto' }}
                  title="Guardar borrador en la base de datos para retomar después"
                >
                  <Save size={14} style={{ marginRight: '6px' }} /> Guardar Borrador

                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={handleGuardar}
                disabled={isSubmitting || productosSeleccionados.length === 0 || (proveedorSeleccionado && !tipoPago)}
              >
                {isSubmitting ? 'Guardando...' : 'Actualizar Inventario'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveSubTab('entrada')}
                style={{ marginRight: 'auto' }}
              >
                ← Volver a la Planilla
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
              >
                Cerrar
              </button>
            </>
          )}
        </div>
        {renderDetalleBatchModal()}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {/* Modal de Proveedor - Renderizado directamente en el body usando createPortal */}
      {createPortal(
        <ProveedorModal
          open={modalProveedor.open}
          onClose={handleProveedorCreado}
          proveedor={modalProveedor.proveedor}
        />,
        document.body
      )}
      {createPortal(
        <AgregarProductoModalV2
          open={mostrarCrearProducto}
          onClose={() => setMostrarCrearProducto(false)}
          onProductoAgregado={handleProductoCreado}
          moneda={moneda}
        />,
        document.body
      )}
      {createPortal(
        <EditarProductoModalV2
          open={modalEditar.open}
          onClose={() => {
            setModalEditar({ open: false, producto: null });
            refetchProductos();
          }}
          producto={modalEditar.producto}
          onProductoEditado={() => refetchProductos()}
        />,
        document.body
      )}
      {createPortal(
        <>
          {mostrarSeleccionProveedor && (
            <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setMostrarSeleccionProveedor(false)}>
              <div className="modal-content select-proveedor-compact-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Seleccionar Proveedor</h3>
                  <button onClick={() => setMostrarSeleccionProveedor(false)} className="modal-close">
                    <X size={18} />
                  </button>
                </div>
                <div className="modal-body" style={{ padding: '0.75rem' }}>
                  <div className="proveedores-list-compact">
                    <div
                      className={`proveedor-item-compact ${!proveedorSeleccionado ? 'selected' : ''}`}
                      onClick={() => { setProveedorSeleccionado(null); setMostrarSeleccionProveedor(false); }}
                    >
                      <span>Ninguno (Entrada sin proveedor)</span>
                    </div>
                    {proveedores.map(p => (
                      <div
                        key={p.id}
                        className={`proveedor-item-compact ${proveedorSeleccionado === p.id ? 'selected' : ''}`}
                        onClick={() => { setProveedorSeleccionado(p.id); setMostrarSeleccionProveedor(false); }}
                      >
                        <div className="p-item-info">
                          <strong>{p.nombre}</strong>
                          {p.nit && <span className="p-item-nit">NIT: {p.nit}</span>}
                        </div>
                        {proveedorSeleccionado === p.id && <Check size={16} className="text-success" />}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      className="btn-nuevo-proveedor-compact"
                      onClick={() => {
                        setMostrarSeleccionProveedor(false);
                        setModalProveedor({ open: true, proveedor: null });
                      }}
                    >
                      <Plus size={16} /> Crear Nuevo Proveedor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de búsqueda - PRIORIDAD TOTAL (PORTAL NIVEL SUPERIOR) */}
          {mostrarBusqueda && (
            <div 
              className={`productos-busqueda-modal ${isDragging ? 'dragging' : ''} ${busquedaMinimizada ? 'minimized' : ''}`}
              style={{
                position: 'fixed',
                left: '50%',
                top: '10%',
                transform: `translate(calc(-50% + ${posicionBusqueda.x}px), ${posicionBusqueda.y}px)`,
                zIndex: 999999,
                width: busquedaMinimizada ? '300px' : '90vw',
                maxWidth: busquedaMinimizada ? '300px' : '1100px',
                minHeight: busquedaMinimizada ? 'auto' : '500px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                border: '2px solid var(--accent-primary)',
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div 
                className="productos-busqueda-header" 
                onMouseDown={handleDragStart} 
                style={{ 
                  cursor: isDragging ? 'grabbing' : 'grab',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <Search size={18} />
                  <h3 style={{ color: 'white', margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                    {busquedaMinimizada ? 'Búsqueda activa' : 'Buscar Productos'}
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {!busquedaMinimizada && productosFiltrados.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSeleccionarTodos}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      {productosFiltrados.filter(p => !productosSeleccionados.find(ps => ps.key === p.key)).every(p => productosParaAgregar.includes(p.key)) && productosFiltrados.filter(p => !productosSeleccionados.find(ps => ps.key === p.key)).length > 0
                        ? 'Quitar todos'
                        : 'Seleccionar todos'}
                    </button>
                  )}

                  <button 
                    onClick={() => setBusquedaMinimizada(!busquedaMinimizada)}
                    style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                    title={busquedaMinimizada ? "Maximizar" : "Minimizar"}
                  >
                    {busquedaMinimizada ? <Plus size={18} /> : <div style={{ width: '14px', height: '2px', background: 'white', alignSelf: 'center' }} />}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setMostrarBusqueda(false);
                      setProductosParaAgregar([]);
                      setPosicionBusqueda({ x: 0, y: 0 });
                    }}
                    style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {!busquedaMinimizada && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: '1rem' }}>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setVistaLista(false)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: !vistaLista ? 'white' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          display: 'flex', alignItems: 'center', cursor: 'pointer',
                          boxShadow: !vistaLista ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <LayoutGrid size={14} color={!vistaLista ? 'var(--accent-primary)' : '#64748b'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVistaLista(true)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: vistaLista ? 'white' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          display: 'flex', alignItems: 'center', cursor: 'pointer',
                          boxShadow: vistaLista ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <List size={14} color={vistaLista ? 'var(--accent-primary)' : '#64748b'} />
                      </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                      <Search size={18} style={{ 
                        position: 'absolute', 
                        left: '14px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#94a3b8',
                        pointerEvents: 'none'
                      }} />
                      <input
                        ref={(node) => {
                          busquedaInputRef.current = node;
                          if (barcodeInputRef && node) {
                            barcodeInputRef.current = node;
                          }
                        }}
                        type="text"
                        autoFocus
                        placeholder="Escribe para buscar productos..."
                        value={busqueda}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setBusqueda(newValue);
                          handleBarcodeInputChange(e);
                        }}
                        onKeyDown={handleBarcodeKeyDown}
                        style={{
                          width: '100%',
                          padding: '0.7rem 1rem 0.7rem 3rem', // Aumentado el padding izquierdo a 3rem
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          outline: 'none',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, background: 'white' }}>
                    {!vistaLista && (
                      <div className="productos-busqueda-grid" onScroll={handleGridScroll} ref={gridScrollRef}>
                        {productosFiltrados.length === 0 ? (
                          <p className="productos-busqueda-empty">No se encontraron productos</p>
                        ) : (
                          productosFiltrados.map((producto) => {
                            const yaAgregado = productosSeleccionados.find(p => p.key === producto.key);
                            const estaSeleccionado = productosParaAgregar.includes(producto.key);
                            return (
                              <div
                                key={producto.key}
                                className={`productos-busqueda-card ${yaAgregado ? 'agregado' : ''} ${estaSeleccionado ? 'seleccionado' : ''}`}
                                onClick={() => !yaAgregado && toggleProductoSeleccion(producto.key)}
                              >
                                {!yaAgregado && estaSeleccionado && (
                                  <div className="productos-busqueda-check-badge">
                                    <Check size={16} />
                                  </div>
                                )}
                                {yaAgregado && (
                                  <div className="productos-busqueda-check-badge">
                                    <Check size={16} />
                                  </div>
                                )}
                                <div className="productos-busqueda-card-image">
                                  <OptimizedProductImage
                                    imagePath={producto.imagen}
                                    alt={producto.nombre}
                                    className="productos-busqueda-image"
                                  />
                                </div>
                                <div className="productos-busqueda-card-info">
                                  <div className="productos-busqueda-card-nombre">{producto.nombre}</div>
                                  {producto.codigo && (
                                    <div className="productos-busqueda-card-codigo">{producto.codigo}</div>
                                  )}
                                  <div className="productos-busqueda-card-precio">
                                    ${formatearMoneda(producto.precio_venta)}
                                  </div>
                                  <div className="productos-busqueda-card-stock">
                                    Stock: {producto.stock || 0}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {vistaLista && (
                      <div className="pbl-lista-wrapper" onScroll={handleGridScroll}>
                        {productosFiltrados.length === 0 ? (
                          <p className="productos-busqueda-empty">No se encontraron productos</p>
                        ) : (
                          <table className="pbl-table">
                            <thead>
                              <tr>
                                <th style={{ width: '32px' }}></th>
                                <th>Producto</th>
                                <th>Código</th>
                                <th style={{ textAlign: 'right' }}>Precio</th>
                                <th style={{ textAlign: 'center' }}>Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {productosFiltrados.map((producto) => {
                                const yaAgregado = productosSeleccionados.find(p => p.key === producto.key);
                                const estaSeleccionado = productosParaAgregar.includes(producto.key);
                                return (
                                  <tr
                                    key={producto.key}
                                    className={`pbl-row ${yaAgregado ? 'pbl-row-agregado' : ''} ${estaSeleccionado ? 'pbl-row-seleccionado' : ''}`}
                                    onClick={() => !yaAgregado && toggleProductoSeleccion(producto.key)}
                                  >
                                    <td className="pbl-td-check">
                                      <div className={`pbl-checkbox ${estaSeleccionado || yaAgregado ? 'checked' : ''}`}>
                                        {(estaSeleccionado || yaAgregado) && <Check size={12} />}
                                      </div>
                                    </td>
                                    <td className="pbl-td-nombre">{producto.nombre}{producto.variante_nombre ? <span className="pbl-variante"> · {producto.variante_nombre}</span> : null}</td>
                                    <td className="pbl-td-codigo">{producto.codigo || '—'}</td>
                                    <td className="pbl-td-precio">${formatearMoneda(producto.precio_venta)}</td>
                                    <td className="pbl-td-stock">{producto.stock || 0}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                    {hayMasProductos && (
                      <div style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.8rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
                        Mostrando {productosFiltrados.length} de {productosFiltradosTodos.length} productos. Desplázate para cargar más.
                      </div>
                    )}
                  </div>

                  {productosParaAgregar.length > 0 && (
                    <div className="busqueda-modal-footer" style={{
                      padding: '0.75rem 1.25rem',
                      background: '#f8fafc',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '1rem',
                      boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                        Has seleccionado {productosParaAgregar.length} producto{productosParaAgregar.length > 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={agregarProductosSeleccionados}
                        style={{
                          padding: '0.6rem 1.5rem',
                          background: 'var(--accent-success, #10b981)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                          transition: 'all 0.2s',
                          animation: 'pulse-green 2s infinite'
                        }}
                      >
                        <Check size={16} />
                        Agregar seleccionados ({productosParaAgregar.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
};

export default EntradaInventarioModal;
