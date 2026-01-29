import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProductos } from '../../hooks/useProductos';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { Search, X, Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import './ConsultarPrecio.css';

const ConsultarPrecio = () => {
  const { organization } = useAuth();
  const { data: productos = [], isLoading } = useProductos(organization?.id);
  const [query, setQuery] = useState('');
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [varianteEncontrada, setVarianteEncontrada] = useState(null);

  // Función para buscar producto
  const buscarProducto = useCallback((termino) => {
    if (!termino || termino.trim() === '') {
      setProductoEncontrado(null);
      setVarianteEncontrada(null);
      return;
    }

    const terminoLower = termino.toLowerCase().trim();
    
    const variante = productos
      .flatMap(producto => producto.variantes || [])
      .find(vari => vari.codigo && vari.codigo.toLowerCase() === terminoLower);

    if (variante) {
      const productoVariante = productos.find(p => p.id === variante.producto_id);
      setProductoEncontrado(productoVariante || null);
      setVarianteEncontrada(variante);
      return;
    }

    // Buscar por código de barras (búsqueda exacta)
    let producto = productos.find(p => 
      p.codigo && p.codigo.toLowerCase() === terminoLower
    );

    // Si no se encuentra por código exacto, buscar por nombre o código parcial
    if (!producto) {
      producto = productos.find(p => {
        const nombre = (p.nombre || '').toLowerCase();
        const codigo = (p.codigo || '').toLowerCase();
        return nombre.includes(terminoLower) || codigo.includes(terminoLower);
      });
    }

    setProductoEncontrado(producto || null);
    setVarianteEncontrada(null);
  }, [productos]);

  // Handler para cuando se escanea un código de barras
  const handleBarcodeScanned = useCallback((barcode) => {
    setQuery(barcode);
    buscarProducto(barcode);
  }, [buscarProducto]);

  // Hook para lector de códigos de barras
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
  const searchInputRef = useRef(null);

  // Refs para detección global de código de barras
  const globalBarcodeBufferRef = useRef('');
  const globalLastCharTimeRef = useRef(null);
  const globalBarcodeTimeoutRef = useRef(null);
  const globalBarcodeProcessingRef = useRef(false);

  // Listener global para detectar códigos de barras
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const target = e.target;
      
      // Verificar si hay un modal abierto
      const isInModal = target.closest('.modal-overlay, .modal-content, [class*="modal"], [class*="Modal"], [data-modal], [role="dialog"]');
      if (isInModal) {
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
        if (globalLastCharTimeRef.current && (now - globalLastCharTimeRef.current) > 100) {
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
            
            setTimeout(() => {
              globalBarcodeProcessingRef.current = false;
            }, 500);
          }
        }, 80);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (globalBarcodeTimeoutRef.current) {
        clearTimeout(globalBarcodeTimeoutRef.current);
      }
    };
  }, [handleBarcodeScanned, barcodeInputRef]);

  // Buscar cuando cambia el query
  useEffect(() => {
    if (query) {
      buscarProducto(query);
    } else {
      setProductoEncontrado(null);
    }
  }, [query, buscarProducto]);

  // Formatear moneda
  const formatCOP = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setQuery('');
    setProductoEncontrado(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="consultar-precio-container">
      <div className="consultar-precio-header">
        <h1>Consultar Precio</h1>
        <p className="consultar-precio-subtitle">Busca un producto por código de barras o nombre</p>
      </div>

      <div className="consultar-precio-search-container">
        <div className="consultar-precio-search-wrapper">
          <Search size={20} className="consultar-precio-search-icon" />
          <input
            ref={(node) => {
              searchInputRef.current = node;
              if (barcodeInputRef && node) {
                barcodeInputRef.current = node;
              }
            }}
            type="text"
            className="consultar-precio-search-input"
            placeholder="Escribe el código de barras o nombre del producto..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleBarcodeInputChange(e);
            }}
            onKeyDown={handleBarcodeKeyDown}
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="consultar-precio-clear-btn"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="consultar-precio-content">
        {isLoading ? (
          <div className="consultar-precio-loading">
            <p>Cargando productos...</p>
          </div>
        ) : query && !productoEncontrado ? (
          <div className="consultar-precio-not-found">
            <AlertCircle size={48} />
            <h3>Producto no encontrado</h3>
            <p>No se encontró ningún producto con "{query}"</p>
          </div>
        ) : productoEncontrado ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="consultar-precio-product-card"
          >
            <div className="consultar-precio-product-image">
              <OptimizedProductImage
                imagePath={productoEncontrado.imagen}
                alt={productoEncontrado.nombre}
                className="consultar-precio-image"
              />
            </div>
            
            <div className="consultar-precio-product-info">
              <h2 className="consultar-precio-product-name">{productoEncontrado.nombre}</h2>
              
              {varianteEncontrada && (
                <div className="consultar-precio-product-code">
                  <Package size={16} />
                  <span>Variante: {varianteEncontrada.nombre}</span>
                </div>
              )}
              
              {varianteEncontrada?.codigo && (
                <div className="consultar-precio-product-code">
                  <Package size={16} />
                  <span>Código variante: {varianteEncontrada.codigo}</span>
                </div>
              )}

              {productoEncontrado.codigo && (
                <div className="consultar-precio-product-code">
                  <Package size={16} />
                  <span>Código: {productoEncontrado.codigo}</span>
                </div>
              )}

              <div className="consultar-precio-prices">
                <div className="consultar-precio-price-item">
                  <div className="consultar-precio-price-label">
                    <DollarSign size={20} />
                    <span>Precio de Venta</span>
                  </div>
                  <div className="consultar-precio-price-value venta">
                    {formatCOP(productoEncontrado.precio_venta)}
                  </div>
                </div>

                {productoEncontrado.precio_compra && (
                  <div className="consultar-precio-price-item">
                    <div className="consultar-precio-price-label">
                      <TrendingUp size={20} />
                      <span>Precio de Compra</span>
                    </div>
                    <div className="consultar-precio-price-value compra">
                      {formatCOP(productoEncontrado.precio_compra)}
                    </div>
                  </div>
                )}

                {productoEncontrado.precio_compra && productoEncontrado.precio_venta && (
                  <div className="consultar-precio-price-item">
                    <div className="consultar-precio-price-label">
                      <TrendingUp size={20} />
                      <span>Margen de Utilidad</span>
                    </div>
                    <div className="consultar-precio-price-value utilidad">
                      {productoEncontrado.precio_venta > 0
                        ? `${(((productoEncontrado.precio_venta - productoEncontrado.precio_compra) / productoEncontrado.precio_venta) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                )}
              </div>

              <div className="consultar-precio-stock">
                <div className="consultar-precio-stock-label">
                  <Package size={16} />
                  <span>Stock Disponible</span>
                </div>
                {(() => {
                  const stockActual = varianteEncontrada ? varianteEncontrada.stock : productoEncontrado.stock;
                  return (
                    <div className={`consultar-precio-stock-value ${
                      stockActual === 0 
                        ? 'sin-stock' 
                        : stockActual < 10 
                        ? 'stock-bajo' 
                        : 'stock-ok'
                    }`}>
                      {stockActual !== null && stockActual !== undefined ? stockActual : 'N/A'}
                    </div>
                  );
                })()}
              </div>

              {productoEncontrado.tipo && (
                <div className="consultar-precio-type">
                  <span className="consultar-precio-type-label">Tipo:</span>
                  <span className="consultar-precio-type-value">{productoEncontrado.tipo}</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="consultar-precio-empty">
            <Search size={64} />
            <h3>Busca un producto</h3>
            <p>Escribe el código de barras o nombre del producto para ver su información</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultarPrecio;
