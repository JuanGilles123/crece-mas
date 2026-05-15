import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Building2, Plus, LayoutGrid, List } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Sincronizar cambios externos (desde el modal de edición) con la lista local
  useEffect(() => {
    if (productos.length > 0 && productosSeleccionados.length > 0) {
      setProductosSeleccionados(prev => {
        let huboCambios = false;
        const nuevos = prev.map(p => {
          const latest = productos.find(lp => lp.id === p.producto_id);
          if (latest) {
            const nuevaCat = latest.categoria || latest.metadata?.categoria || '';
            const nuevaImg = latest.imagen;

            if (p.categoria !== nuevaCat || p.imagen_url !== nuevaImg) {
              huboCambios = true;
              return {
                ...p,
                categoria: nuevaCat,
                imagen_url: nuevaImg
              };
            }
          }
          return p;
        });
        return huboCambios ? nuevos : prev;
      });
    }
  }, [productos, productosSeleccionados.length]);

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

    const productosAAgregar = productosFiltrados.filter(p =>
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
        ? ((precioVenta - precioCompra) / precioCompra) * 100
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
        categoria: item.categoria || item.metadata?.categoria || ''
      };
    });

    setProductosSeleccionados([...productosSeleccionados, ...nuevosProductos]);
    setProductosParaAgregar([]);
    toast.success(`${nuevosProductos.length} producto(s) agregado(s)`);
  };

  // Seleccionar/deseleccionar todos
  const toggleSeleccionarTodos = () => {
    const productosDisponibles = productosFiltrados.filter(p =>
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

  // Calcular porcentaje basado en precio de compra y precio de venta
  const calcularPorcentaje = (precioCompra, precioVenta) => {
    const compra = parseFloat(precioCompra) || 0;
    const venta = parseFloat(precioVenta) || 0;
    if (compra === 0) return 0;
    return ((venta - compra) / compra) * 100;
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

        // Si se actualiza precio_compra_nuevo, recalcular precio_venta_nuevo basado en porcentaje
        if (campo === 'precio_compra_nuevo') {
          const precioCompra = parsearMoneda(valor);
          actualizado.precio_compra_nuevo = precioCompra;
          // Solo recalcular si el porcentaje existe, de lo contrario mantener el precio de venta actual
          if (actualizado.porcentaje_ganancia !== undefined && actualizado.porcentaje_ganancia !== null) {
            actualizado.precio_venta_nuevo = calcularPrecioVenta(precioCompra, actualizado.porcentaje_ganancia || 0);
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
            organizationId: organization?.id
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

      toast.success('Inventario actualizado exitosamente');
      setProductosSeleccionados([]);
      setTipoPago(null);
      setProveedorSeleccionado(null);
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
    setProductosSeleccionados([]);
    setProductosParaAgregar([]);
    setBusqueda('');
    setMostrarBusqueda(false);
    setProveedorSeleccionado(null);
    setTipoPago(null);
    setMetodoPago('transferencia');
    setFechaPago(new Date().toISOString().split('T')[0]);
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

  if (!open) return null;

  const modalContent = (
    <div className="modal-overlay entrada-inventario-overlay" onClick={handleClose}>
      <div className="modal-content entrada-inventario-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="entrada-inventario-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2>Entrada de Inventario</h2>

            {/* Selector de Proveedor Compacto */}
            <div className="header-proveedor-compact">
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
          </div>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Botones de acción - Movido fuera del body para fijarlo arriba */}
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
              onClick={() => setMostrarCrearProducto(true)}
            >
              <Plus size={16} />
              Crear producto
            </button>

            {productosParaAgregar.length > 0 && (
              <button
                type="button"
                className="btn-buscar-productos"
                onClick={agregarProductosSeleccionados}
                style={{
                  background: 'var(--accent-success, #10b981)',
                  color: 'white',
                  border: 'none',
                  animation: 'pulse-green 2s infinite'
                }}
              >
                <Check size={16} />
                Agregar seleccionados ({productosParaAgregar.length})
              </button>
            )}
          </div>

          {/* Sumatoria en tiempo real */}
          {productosSeleccionados.length > 0 && (
            <div className="entrada-inventario-resumen-rapido">
              <div className="resumen-item">
                <span className="resumen-label">Total Factura:</span>
                <span className="resumen-value inversion">
                  {calcularTotalCompra().toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
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

        {/* Body */}
        <div className="entrada-inventario-body">

          {/* Modal de búsqueda */}
          {mostrarBusqueda && (
            <div className="productos-busqueda-modal">
              <div className="productos-busqueda-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <h3>Buscar Productos</h3>
                  {productosFiltrados.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSeleccionarTodos}
                      className="btn-seleccionar-todos"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {productosFiltrados.filter(p => !productosSeleccionados.find(ps => ps.key === p.key)).every(p => productosParaAgregar.includes(p.key)) && productosFiltrados.filter(p => !productosSeleccionados.find(ps => ps.key === p.key)).length > 0
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                  )}
                </div>
                {/* Toggle de vista */}
                <div style={{ display: 'flex', gap: '0.35rem', marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setVistaLista(false)}
                    title="Vista cuadrícula"
                    style={{
                      padding: '0.4rem',
                      border: `1.5px solid ${!vistaLista ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                      borderRadius: '6px',
                      background: !vistaLista ? 'var(--accent-primary)' : 'transparent',
                      color: !vistaLista ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaLista(true)}
                    title="Vista lista"
                    style={{
                      padding: '0.4rem',
                      border: `1.5px solid ${vistaLista ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                      borderRadius: '6px',
                      background: vistaLista ? 'var(--accent-primary)' : 'transparent',
                      color: vistaLista ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <List size={16} />
                  </button>
                </div>
                <button onClick={() => {
                  setMostrarBusqueda(false);
                  setProductosParaAgregar([]);
                }}>
                  <X size={18} />
                </button>
              </div>
              <div className="productos-busqueda-input-container">
                <Search size={18} className="productos-busqueda-icon-outside" />
                <input
                  ref={(node) => {
                    busquedaInputRef.current = node;
                    if (barcodeInputRef && node) {
                      barcodeInputRef.current = node;
                    }
                  }}
                  type="text"
                  placeholder="Buscar por nombre, código, descripción..."
                  value={busqueda}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setBusqueda(newValue);
                    handleBarcodeInputChange(e);
                  }}
                  onKeyDown={handleBarcodeKeyDown}
                  className="productos-busqueda-input"
                />
              </div>
              {/* VISTA GRID */}
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

              {/* VISTA LISTA */}
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
          )}

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
                    <th>Producto</th>
                    <th>Precio Compra</th>
                    <th>%</th>
                    <th>Precio Venta</th>
                    <th>Cantidad</th>
                    <th>Stock Actual</th>
                    <th>Stock Nuevo</th>
                    <th className="col-has-imagen">¿Tiene Imagen?</th>
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
                        borderColor: tipoPago === 'credito' ? '#3b82f6' : '#e5e7eb',
                        background: tipoPago === 'credito' ? '#eff6ff' : '#fff',
                        borderRadius: '8px',
                        cursor: proveedorSeleccionado ? 'pointer' : 'not-allowed',
                        fontWeight: tipoPago === 'credito' ? 600 : 400,
                        color: tipoPago === 'credito' ? '#3b82f6' : '#374151',
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
        </div>

        {/* Footer */}
        <div className="entrada-inventario-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGuardar}
            disabled={isSubmitting || productosSeleccionados.length === 0 || (proveedorSeleccionado && !tipoPago)}
          >
            {isSubmitting ? 'Guardando...' : 'Actualizar Inventario'}
          </button>
        </div>
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
        </>,
        document.body
      )}
    </>
  );
};

export default EntradaInventarioModal;
