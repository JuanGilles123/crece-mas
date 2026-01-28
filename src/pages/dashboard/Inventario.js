

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import './Inventario.css';
import AgregarProductoModalV2 from '../../components/modals/AgregarProductoModalV2';
import EditarProductoModalV2 from '../../components/modals/EditarProductoModalV2';
import ImportarProductosCSV from '../../components/forms/ImportarProductosCSV';
import FeatureGuard from '../../components/FeatureGuard';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import LottieLoader from '../../components/ui/LottieLoader';
import InventarioStats from '../../components/inventario/InventarioStats';
import InventarioFilters from '../../components/inventario/InventarioFilters';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import { List, Grid3X3, PackagePlus, Search } from 'lucide-react';
import { useProductos, useEliminarProducto } from '../../hooks/useProductos';
import EntradaInventarioModal from '../../components/modals/EntradaInventarioModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import toast from 'react-hot-toast';

// Función para eliminar imagen del storage
const deleteImageFromStorage = async (imagePath) => {
  if (!imagePath) return false;
  try {
    const { error } = await supabase.storage
      .from('productos')
      .remove([imagePath]);
    if (error) {
      console.error('Error eliminando imagen:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    return false;
  }
};

const Inventario = () => {
  const { user, organization } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [entradaInventarioOpen, setEntradaInventarioOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoLista, setModoLista] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  // Suponiendo que el usuario tiene moneda en user.user_metadata.moneda
  const moneda = user?.user_metadata?.moneda || 'COP';

  // React Query hooks - usar organization?.id en lugar de user?.id
  const { data: productos = [], isLoading: cargando, error } = useProductos(organization?.id);
  const eliminarProductoMutation = useEliminarProducto();

  // Precargar imágenes cuando se cargan los productos
  useEffect(() => {
    if (productos.length > 0 && organization?.id && supabase) {
      // Precargar imágenes de productos con imagen válida
      const productosConImagen = productos.filter(
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
  }, [productos, organization?.id]);

  // Mostrar error si hay problemas cargando productos (usando useEffect para evitar setState durante render)
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar productos');
    }
  }, [error]);

  // Handler para cuando se escanea un código de barras
  const handleBarcodeScanned = useCallback((barcode) => {
    setQuery(barcode);
    // Enfocar el input del buscador
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Hook para lector de códigos de barras en el buscador
  const { 
    inputRef: barcodeInputRef, 
    handleKeyDown: handleBarcodeKeyDown, 
    handleInputChange: handleBarcodeInputChange 
  } = useBarcodeScanner(handleBarcodeScanned, {
    minLength: 3,
    maxTimeBetweenChars: 50,
    autoSubmit: true
  });

  // Ref para el input de búsqueda
  const searchInputRef = useRef(null);

  // Refs para detección global de código de barras (funciona aunque el cursor no esté en el buscador)
  const globalBarcodeBufferRef = useRef('');
  const globalLastCharTimeRef = useRef(null);
  const globalBarcodeTimeoutRef = useRef(null);
  const globalBarcodeProcessingRef = useRef(false);

  // Combinar refs - asignar el nodo directamente al ref del hook y al ref local
  const combinedSearchInputRef = useCallback((node) => {
    searchInputRef.current = node;
    if (barcodeInputRef && node) {
      barcodeInputRef.current = node;
    }
  }, [barcodeInputRef]);

  // Listener global para detectar códigos de barras en cualquier parte de la página
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const target = e.target;
      
      // Verificar si hay un modal abierto o si el evento viene de dentro de un modal
      const isInModal = target.closest('.modal-overlay, .modal-content, [class*="modal"], [class*="Modal"], [data-modal], [role="dialog"]');
      const hasOpenModal = document.querySelector('.modal-overlay[style*="display: block"], .modal-overlay:not([style*="display: none"]), [class*="modal"][style*="display: block"]');
      
      // Si hay un modal abierto o el evento viene de dentro de un modal, no procesar
      if (isInModal || hasOpenModal || modalOpen || editarModalOpen || entradaInventarioOpen) {
        // Limpiar buffer para evitar conflictos
        globalBarcodeBufferRef.current = '';
        globalLastCharTimeRef.current = null;
        if (globalBarcodeTimeoutRef.current) {
          clearTimeout(globalBarcodeTimeoutRef.current);
          globalBarcodeTimeoutRef.current = null;
        }
        return;
      }

      // Ignorar si el usuario está escribiendo en un input, textarea o contenteditable
      const isInputElement = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable ||
                            target.closest('input') ||
                            target.closest('textarea');
      
      // Si está en el input del buscador, dejar que el hook normal lo maneje
      if (target === searchInputRef.current || target === barcodeInputRef?.current) {
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
    };
  }, [handleBarcodeScanned, barcodeInputRef, modalOpen, editarModalOpen, entradaInventarioOpen]);

  // Función para obtener la fecha límite según el filtro
  const getFechaDesde = (opcion) => {
    if (!opcion) return null;
    const ahora = new Date();
    const desde = new Date();
    
    switch (opcion) {
      case 'hoy':
        desde.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        desde.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        desde.setMonth(ahora.getMonth() - 1);
        break;
      case 'tres-meses':
        desde.setMonth(ahora.getMonth() - 3);
        break;
      case 'seis-meses':
        desde.setMonth(ahora.getMonth() - 6);
        break;
      case 'año':
        desde.setFullYear(ahora.getFullYear() - 1);
        break;
      default:
        return null;
    }
    return desde;
  };

  // Filtrar productos basado en búsqueda y filtros dinámicos
  const filteredProducts = useMemo(() => {
    return productos.filter((producto) => {
      // Filtro de búsqueda por cualquier campo
      // Si no hay búsqueda o está vacía, no filtrar por búsqueda
      if (!query || (typeof query === 'string' && query.trim() === '')) {
        // No filtrar por búsqueda, continuar con otros filtros
      } else {
        const searchTerm = query.toLowerCase().trim();
        if (searchTerm) {
        // Campos directos del producto para buscar
        const camposDirectos = [
          producto.codigo,
          producto.nombre,
          producto.tipo
        ];
        
        // Campos numéricos convertidos a string para búsqueda
        if (producto.precio_venta) camposDirectos.push(String(producto.precio_venta));
        if (producto.precio_compra) camposDirectos.push(String(producto.precio_compra));
        if (producto.stock !== null && producto.stock !== undefined) {
          camposDirectos.push(String(producto.stock));
        }
        
        // Campos en metadata
        const metadata = producto.metadata || {};
        const camposMetadata = [
          metadata.marca,
          metadata.modelo,
          metadata.color,
          metadata.talla,
          metadata.categoria,
          metadata.descripcion,
          metadata.material,
          metadata.dimensiones,
          metadata.duracion,
          metadata.ingredientes,
          metadata.alergenos,
          metadata.porcion
        ];
        
        // Combinar todos los campos en un solo string para buscar
        const todosLosCampos = [...camposDirectos, ...camposMetadata]
          .filter(campo => campo !== null && campo !== undefined && campo !== '')
          .map(campo => String(campo).toLowerCase());
        
        const textoCompleto = todosLosCampos.join(' ');
        
        // Si no encuentra el término de búsqueda en ningún campo, excluir el producto
        if (!textoCompleto.includes(searchTerm)) {
          return false;
        }
        }
      }

      // Procesar filtros dinámicos
      for (const filterKey of Object.keys(filters)) {
        const match = filterKey.match(/^(.+?)_(min|max|value|condition|multi)$/);
        if (!match) continue;

        const fieldId = match[1];
        const filterType = match[2];
        const filterValue = filters[filterKey];

        // Obtener valor del producto (puede ser campo directo o metadata)
        let productValue = null;
        if (fieldId === 'margen_utilidad') {
          const precioVenta = producto.precio_venta || 0;
          const precioCompra = producto.precio_compra || 0;
          productValue = precioVenta > 0 ? ((precioVenta - precioCompra) / precioVenta) * 100 : 0;
        } else if (fieldId === 'alta_utilidad') {
          const precioVenta = producto.precio_venta || 0;
          const precioCompra = producto.precio_compra || 0;
          productValue = precioVenta > 0 ? ((precioVenta - precioCompra) / precioVenta) * 100 : 0;
        } else {
          // Intentar obtener del producto directo
          productValue = producto[fieldId];
          
          // Si no existe, buscar en metadata
          if (productValue === undefined && producto.metadata) {
            productValue = producto.metadata[fieldId];
          }
        }

        // Aplicar filtro según tipo
        if (filterType === 'multi') {
          // Selección múltiple - el producto debe estar en la lista
          if (!Array.isArray(filterValue) || filterValue.length === 0) continue;
          if (!filterValue.includes(productValue)) return false;
        } else if (filterType === 'value') {
          if (fieldId === 'created_at' || fieldId === 'fecha_vencimiento') {
            // Filtros de fecha con opciones rápidas
            const fechaDesde = getFechaDesde(filterValue);
            if (fechaDesde && productValue) {
              const fechaProducto = new Date(productValue);
              if (fechaProducto < fechaDesde) return false;
            }
          } else if (typeof filterValue === 'string') {
            // Búsqueda de texto (contains)
            const searchValue = filterValue.toLowerCase();
            const productStr = String(productValue || '').toLowerCase();
            if (!productStr.includes(searchValue)) return false;
          } else {
            // Comparación exacta
            if (productValue !== filterValue) return false;
          }
        } else if (filterType === 'min') {
          // Filtro de rango mínimo
          if (fieldId === 'created_at' || fieldId === 'fecha_vencimiento') {
            if (productValue && new Date(productValue) < new Date(filterValue)) return false;
          } else {
            const numValue = Number(productValue || 0);
            const numFilter = Number(filterValue);
            if (numValue < numFilter) return false;
          }
        } else if (filterType === 'max') {
          // Filtro de rango máximo
          if (fieldId === 'created_at' || fieldId === 'fecha_vencimiento') {
            if (productValue && new Date(productValue) > new Date(filterValue)) return false;
          } else {
            const numValue = Number(productValue || 0);
            const numFilter = Number(filterValue);
            if (numValue > numFilter) return false;
          }
        } else if (filterType === 'condition') {
          // Condiciones especiales
          if (fieldId === 'stock') {
            const stock = Number(productValue || 0);
            if (filterValue === 'bajo' && (stock >= 10 || stock === null)) return false;
            if (filterValue === 'sin' && stock !== 0) return false;
            if (filterValue === 'con' && (stock === 0 || stock === null)) return false;
          } else if (fieldId === 'alta_utilidad') {
            if (productValue <= 50) return false;
          }
        }
      }

      return true;
    });
  }, [productos, query, filters]);

  // Guardar producto en Supabase (ahora manejado por React Query en AgregarProductoModal)
  const handleAgregarProducto = async (nuevo) => {
    // Esta función ya no es necesaria ya que React Query maneja la mutación
    // en el componente AgregarProductoModal
  };

  // Editar producto
  const handleEditarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setEditarModalOpen(true);
  };

  // Actualizar producto editado (ahora manejado por React Query)
  const handleProductoEditado = (productoEditado) => {
    // React Query invalidará automáticamente la cache y recargará los productos
    setEditarModalOpen(false);
    setProductoSeleccionado(null);
  };

  // Eliminar producto
  const handleEliminarProducto = async (producto) => {
    if (!user) return;
    
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"?`);
    if (!confirmar) return;

    try {
      // Eliminar imagen del storage si existe
      if (producto.imagen) {
        const imageDeleted = await deleteImageFromStorage(producto.imagen);
        if (!imageDeleted) {
        }
      }

      // Usar React Query mutation para eliminar
      eliminarProductoMutation.mutate({ 
        id: producto.id, 
        organizationId: organization?.id 
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleProductosImportados = () => {
    // React Query invalidará automáticamente la cache y recargará los productos
    setCsvModalOpen(false);
  };

  return (
    <div className="inventario-main">
      {cargando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <LottieLoader size="medium" message="Cargando inventario..." />
        </div>
      ) : (
        <>
          {/* Métricas del inventario - se actualizan con los productos filtrados */}
          {productos.length > 0 && (
            <InventarioStats productos={filteredProducts} />
          )}

          {/* Header con búsqueda y acciones - Separados para mejor control responsive */}
          <div className="inventario-header-wrapper">
            <div className="inventario-actions">
              <button className="inventario-btn inventario-btn-primary" onClick={() => setModalOpen(true)}>Nuevo producto</button>
              <button 
                className="inventario-btn inventario-btn-secondary" 
                onClick={() => setEntradaInventarioOpen(true)}
                title="Registrar entrada de inventario"
              >
                <PackagePlus size={18} />
                Entrada Inventario
              </button>
              <FeatureGuard
                feature="importCSV"
                recommendedPlan="professional"
                showInline={false}
                fallback={
                  <button 
                    className="inventario-btn inventario-btn-secondary" 
                    onClick={() => toast.error('La importación CSV está disponible en el plan Estándar')}
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    title="🔒 Plan Estándar"
                  >
                    Importar CSV
                  </button>
                }
              >
                <button className="inventario-btn inventario-btn-secondary" onClick={() => setCsvModalOpen(true)}>Importar CSV</button>
              </FeatureGuard>
              <button className="inventario-btn inventario-btn-secondary inventario-btn-view-toggle" onClick={() => setModoLista(m => !m)}>
                {modoLista ? <Grid3X3 size={18} /> : <List size={18} />}
              </button>
            </div>
            <div className="inventario-search-container">
              <div className="search-input-wrapper">
                <Search size={18} className="inventario-search-icon-outside" />
                <input 
                  ref={combinedSearchInputRef}
                  className="inventario-search" 
                  placeholder="Buscar por nombre, código, marca, modelo, categoría..." 
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    handleBarcodeInputChange(e);
                  }}
                  onKeyDown={handleBarcodeKeyDown}
                  autoFocus={false}
                />
              </div>
            </div>
          </div>

          {/* Filtros - Debajo del buscador y antes de los productos */}
          <InventarioFilters 
            productos={productos}
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* Contenido de productos */}
          <div className="inventario-content">
        {modoLista ? (
          <div className="inventario-lista">
            {cargando ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <LottieLoader size="medium" message="Cargando productos..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>
                {query || Object.keys(filters).length > 0 
                  ? 'No se encontraron productos con los filtros aplicados.' 
                  : 'No hay productos aún.'}
              </div>
            ) : filteredProducts.map((prod, index) => (
              <motion.div 
                className="inventario-lista-item" 
                key={prod.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                layout
              >
                <OptimizedProductImage 
                  imagePath={prod.imagen} 
                  alt={prod.nombre} 
                  className="inventario-img-lista"
                  onError={(e) => {
                  }}
                />
                <div className="inventario-lista-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div className="inventario-lista-precios">
                    <span style={{color:'var(--accent-primary)',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'var(--accent-success)',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="inventario-stock">Stock: {prod.stock !== null && prod.stock !== undefined ? parseFloat(prod.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : 'N/A'}</div>
                </div>
                <div className="inventario-lista-actions">
                  <button 
                    className="inventario-btn inventario-btn-outline"
                    onClick={() => handleEditarProducto(prod)}
                  >
                    Editar
                  </button>
                  <button 
                    className="inventario-btn inventario-btn-outline eliminar"
                    onClick={() => handleEliminarProducto(prod)}
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="inventario-grid">
            {cargando ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
                <LottieLoader size="medium" message="Cargando productos..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>
                {query || Object.keys(filters).length > 0 
                  ? 'No se encontraron productos con los filtros aplicados.' 
                  : 'No hay productos aún.'}
              </div>
            ) : filteredProducts.map((prod, index) => (
              <motion.div 
                className="inventario-card" 
                key={prod.id}
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
                layout
              >
                <OptimizedProductImage 
                  imagePath={prod.imagen} 
                  alt={prod.nombre} 
                  className="inventario-img"
                  onError={(e) => {
                  }}
                />
                <div className="inventario-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div style={{display:'flex',gap:'0.8rem',justifyContent:'center',marginBottom:2}}>
                    <span style={{color:'var(--accent-primary)',fontWeight:700,fontSize:'0.85rem'}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'var(--accent-success)',fontWeight:700,fontSize:'0.85rem'}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="inventario-stock">Stock: {prod.stock !== null && prod.stock !== undefined ? parseFloat(prod.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : 'N/A'}</div>
                </div>
                <div className="inventario-card-actions">
                  <button 
                    className="inventario-btn inventario-btn-outline"
                    onClick={() => handleEditarProducto(prod)}
                  >
                    Editar
                  </button>
                  <button 
                    className="inventario-btn inventario-btn-outline eliminar"
                    onClick={() => handleEliminarProducto(prod)}
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          )}
          {/* Panel lateral eliminado por solicitud */}
          </div>
        </>
      )}
      <AgregarProductoModalV2 open={modalOpen} onClose={() => setModalOpen(false)} onProductoAgregado={handleAgregarProducto} moneda={moneda} />
      <EditarProductoModalV2 
        open={editarModalOpen} 
        onClose={() => {
          setEditarModalOpen(false);
          setProductoSeleccionado(null);
        }} 
        producto={productoSeleccionado}
        onProductoEditado={handleProductoEditado}
      />
      <ImportarProductosCSV 
        open={csvModalOpen} 
        onClose={() => setCsvModalOpen(false)}
        onProductosImportados={handleProductosImportados}
      />
      <EntradaInventarioModal 
        open={entradaInventarioOpen} 
        onClose={() => {
          setEntradaInventarioOpen(false);
          // Refrescar productos después de actualizar inventario
          if (productos && productos.length > 0) {
            // Los productos se actualizarán automáticamente por React Query
          }
        }}
      />
    </div>
  );
};

export default Inventario;
