

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Inventario.css';
import AgregarProductoModal from './AgregarProductoModal';
import EditarProductoModal from './EditarProductoModal';
import ImportarProductosCSV from '../components/ImportarProductosCSV';
import OptimizedProductImage from '../components/OptimizedProductImage';
import { ProductCardSkeleton, ProductListSkeleton, InventoryHeaderSkeleton } from '../components/SkeletonLoader';
import LottieLoader from '../components/LottieLoader';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Search, List, Grid3X3, Loader, Calendar, AlertTriangle } from 'lucide-react';
import { useProductosPaginados, useEliminarProducto } from '../hooks/useProductos';
import toast from 'react-hot-toast';

// Función para calcular estado de vencimiento
const getEstadoVencimiento = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaVenc = new Date(fechaVencimiento);
  fechaVenc.setHours(0, 0, 0, 0);
  
  const diffTime = fechaVenc - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { estado: 'vencido', dias: Math.abs(diffDays), texto: `Vencido hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}` };
  } else if (diffDays === 0) {
    return { estado: 'hoy', dias: 0, texto: 'Vence hoy' };
  } else if (diffDays <= 3) {
    return { estado: 'critico', dias: diffDays, texto: `Vence en: ${diffDays} día${diffDays !== 1 ? 's' : ''}` };
  } else if (diffDays <= 7) {
    return { estado: 'proximo', dias: diffDays, texto: `Vence en: ${diffDays} días` };
  } else {
    return { estado: 'normal', dias: diffDays, texto: `Vence en: ${diffDays} días` };
  }
};

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

const productosIniciales = [];


const Inventario = () => {
  const { user, userProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoLista, setModoLista] = useState(false);
  const [query, setQuery] = useState('');
  const moneda = user?.user_metadata?.moneda || 'COP';
  
  // Referencias para scroll infinito
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // React Query hooks con paginación - 20 productos por página
  const { 
    data, 
    isLoading: cargando, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage 
  } = useProductosPaginados(userProfile?.organization_id, 20);
  
  const eliminarProductoMutation = useEliminarProducto();

  // Combinar todas las páginas en un solo array
  const productos = data?.pages?.flatMap(page => page.data) || [];

  // Implementar IntersectionObserver para scroll infinito
  useEffect(() => {
    if (cargando || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('🔄 Cargando más productos...');
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [cargando, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mostrar error si hay problemas cargando productos
  if (error) {
    toast.error('Error al cargar productos');
  }

  // Filtrar productos basado en la búsqueda
  const filteredProducts = productos.filter((producto) => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return true;
    return producto.nombre.toLowerCase().includes(searchTerm);
  });

  // Guardar producto en Supabase (ahora manejado por React Query en AgregarProductoModal)
  const handleAgregarProducto = async (nuevo) => {
    // Esta función ya no es necesaria ya que React Query maneja la mutación
    // en el componente AgregarProductoModal
    console.log('Producto agregado:', nuevo);
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
    if (!user || !userProfile) return;
    
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"?`);
    if (!confirmar) return;

    try {
      // Eliminar imagen del storage si existe
      if (producto.imagen) {
        console.log('Eliminando imagen del storage:', producto.imagen);
        const imageDeleted = await deleteImageFromStorage(producto.imagen);
        if (!imageDeleted) {
          console.warn('No se pudo eliminar la imagen del storage, pero continuando con la eliminación del producto');
        }
      }

      // Usar React Query mutation para eliminar con organization_id
      eliminarProductoMutation.mutate({ 
        id: producto.id, 
        organizationId: userProfile.organization_id 
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
        <div className="inventario-header">
          <div className="inventario-search-container">
            <Search className="inventario-search-icon" size={20} />
            <input 
              className="inventario-search" 
              placeholder="Buscar producto..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="inventario-actions">
            <button className="inventario-btn inventario-btn-primary" onClick={() => setModalOpen(true)}>Nuevo producto</button>
            <button className="inventario-btn inventario-btn-secondary" onClick={() => setCsvModalOpen(true)}>Importar CSV</button>
            <button className="inventario-btn inventario-btn-secondary" onClick={() => setModoLista(m => !m)}>
              {modoLista ? <Grid3X3 size={18} /> : <List size={18} />}
            </button>
          </div>
        </div>
      )}
      <div className="inventario-content">
        {modoLista ? (
          <div className="inventario-lista">
            {cargando ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <LottieLoader size="medium" message="Cargando productos..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>
                {query ? `No se encontraron productos para "${query}"` : 'No hay productos aún.'}
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
                    console.log('Error cargando imagen:', prod.imagen);
                  }}
                />
                <div className="inventario-lista-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div className="inventario-lista-precios">
                    <span style={{color:'var(--accent-primary)',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'var(--accent-success)',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="inventario-stock">Stock: {prod.stock}</div>
                  
                  {/* Badge de Vencimiento en Lista */}
                  {prod.fecha_vencimiento && (() => {
                    const estadoVenc = getEstadoVencimiento(prod.fecha_vencimiento);
                    return estadoVenc ? (
                      <div className={`badge-vencimiento badge-${estadoVenc.estado}`} style={{ marginTop: '0.5rem', width: 'fit-content' }}>
                        {estadoVenc.estado === 'vencido' ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Calendar size={14} />
                        )}
                        <span>{estadoVenc.texto}</span>
                      </div>
                    ) : null;
                  })()}
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
                {query ? `No se encontraron productos para "${query}"` : 'No hay productos aún.'}
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
                    console.log('Error cargando imagen:', prod.imagen);
                  }}
                />
                <div className="inventario-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div style={{display:'flex',gap:'1.2rem',justifyContent:'center',marginBottom:4}}>
                    <span style={{color:'var(--accent-primary)',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'var(--accent-success)',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="inventario-stock">Stock: {prod.stock}</div>
                  
                  {/* Badge de Vencimiento */}
                  {prod.fecha_vencimiento && (() => {
                    const estadoVenc = getEstadoVencimiento(prod.fecha_vencimiento);
                    return estadoVenc ? (
                      <div className={`badge-vencimiento badge-${estadoVenc.estado}`} style={{ marginTop: '0.5rem', marginLeft: 'auto', marginRight: 'auto' }}>
                        {estadoVenc.estado === 'vencido' ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Calendar size={14} />
                        )}
                        <span>{estadoVenc.texto}</span>
                      </div>
                    ) : null;
                  })()}
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
        
        {/* Infinite Scroll Trigger */}
        {!query && hasNextPage && (
          <div 
            ref={loadMoreRef} 
            style={{ 
              padding: '2rem', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            {isFetchingNextPage ? (
              <>
                <Loader className="spinner" size={32} />
                <p style={{ color: 'var(--text-secondary)' }}>Cargando más productos...</p>
              </>
            ) : (
              <button 
                onClick={() => fetchNextPage()}
                className="inventario-btn inventario-btn-primary"
                style={{ maxWidth: '300px' }}
              >
                Cargar más productos
              </button>
            )}
          </div>
        )}
        
        {!cargando && !hasNextPage && productos.length > 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ✅ Todos los productos cargados ({productos.length})
          </div>
        )}
        
        {/* Panel lateral eliminado por solicitud */}
      </div>
      <AgregarProductoModal open={modalOpen} onClose={() => setModalOpen(false)} onProductoAgregado={handleAgregarProducto} moneda={moneda} />
      <EditarProductoModal 
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
    </div>
  );
};

export default Inventario;
