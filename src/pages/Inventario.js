

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
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

const Inventario = () => {
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoLista, setModoLista] = useState(false);
  const [query, setQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, stock-bajo, proximoVencer
  const moneda = user?.user_metadata?.moneda || 'COP';
  
  // Estados para estadísticas reales de la BD
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    stockBajo: 0,
    proximosVencer: 0,
    cargando: true
  });
  
  // Referencias para scroll infinito
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Invalidar cache cuando cambie la organización
  useEffect(() => {
    if (userProfile?.organization_id) {
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['productos-paginados']);
    }
  }, [userProfile?.organization_id, queryClient]);

  // Cargar estadísticas reales de la base de datos
  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!userProfile?.organization_id) return;
      
      setEstadisticas(prev => ({ ...prev, cargando: true }));
      
      try {
        // 1. Contar TODOS los productos
        const { count: totalProductos, error: errorTotal } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userProfile.organization_id);
        
        if (errorTotal) throw errorTotal;
        
        // 2. Contar productos con stock bajo (<=10)
        const { count: totalStockBajo, error: errorStock } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userProfile.organization_id)
          .lte('stock', 10);
        
        if (errorStock) throw errorStock;
        
        // 3. Contar productos próximos a vencer (próximos 7 días)
        const proximaSemana = new Date();
        proximaSemana.setDate(proximaSemana.getDate() + 7);
        
        const { count: totalProximosVencer, error: errorVencer } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', userProfile.organization_id)
          .not('fecha_vencimiento', 'is', null)
          .lte('fecha_vencimiento', proximaSemana.toISOString().split('T')[0]);
        
        if (errorVencer) throw errorVencer;
        setEstadisticas({
          total: totalProductos || 0,
          stockBajo: totalStockBajo || 0,
          proximosVencer: totalProximosVencer || 0,
          cargando: false
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setEstadisticas({
          total: 0,
          stockBajo: 0,
          proximosVencer: 0,
          cargando: false
        });
      }
    };
    
    cargarEstadisticas();
  }, [userProfile?.organization_id]);

  // Debug: Log organization_id
  useEffect(() => {
    if (!userProfile?.organization_id) {
      console.warn('⚠️ INVENTARIO - No hay organization_id en userProfile');
    }
  }, [userProfile]);

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
  const productos = useMemo(() => {
    return data?.pages?.flatMap(page => page.data) || [];
  }, [data?.pages]);
  
  // Implementar IntersectionObserver para scroll infinito
  useEffect(() => {
    if (cargando || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
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

  // Filtrar productos basado en la búsqueda y filtros
  const filteredProducts = productos.filter((producto) => {
    // Filtro de búsqueda
    const searchTerm = query.toLowerCase().trim();
    let matchesSearch = true;
    
    if (searchTerm) {
      const nombre = producto.nombre.toLowerCase();
      const codigoBarra = producto.codigo_barra ? producto.codigo_barra.toLowerCase() : '';
      const categoria = producto.categoria ? producto.categoria.toLowerCase() : '';
      
      // Buscar coincidencias (exacta, desde inicio, o en cualquier parte)
      matchesSearch = 
        nombre === searchTerm || 
        codigoBarra === searchTerm ||
        categoria === searchTerm ||
        nombre.startsWith(searchTerm) ||
        codigoBarra.startsWith(searchTerm) ||
        categoria.startsWith(searchTerm) ||
        nombre.includes(searchTerm) ||
        codigoBarra.includes(searchTerm) ||
        categoria.includes(searchTerm);
    }
    
    // Filtro de estado
    let matchesEstado = true;
    
    if (filtroEstado === 'stock-bajo') {
      matchesEstado = producto.stock <= 10;
    } else if (filtroEstado === 'proximoVencer') {
      if (!producto.fecha_vencimiento) {
        matchesEstado = false;
      } else {
        const estadoVenc = getEstadoVencimiento(producto.fecha_vencimiento);
        matchesEstado = estadoVenc && ['critico', 'proximo', 'hoy', 'vencido'].includes(estadoVenc.estado);
      }
    }
    
    return matchesSearch && matchesEstado;
  });
  
  // Ordenar resultados: coincidencias exactas primero, luego por relevancia
  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (!query.trim()) return 0; // No ordenar si no hay búsqueda
    
    const searchTerm = query.toLowerCase().trim();
    const nombreA = a.nombre.toLowerCase();
    const nombreB = b.nombre.toLowerCase();
    
    // Coincidencia exacta tiene máxima prioridad
    const exactoA = nombreA === searchTerm ? 0 : 1;
    const exactoB = nombreB === searchTerm ? 0 : 1;
    if (exactoA !== exactoB) return exactoA - exactoB;
    
    // Luego, los que empiezan con el término
    const inicioA = nombreA.startsWith(searchTerm) ? 0 : 1;
    const inicioB = nombreB.startsWith(searchTerm) ? 0 : 1;
    if (inicioA !== inicioB) return inicioA - inicioB;
    
    // Por último, orden alfabético
    return nombreA.localeCompare(nombreB);
  });

  // Guardar producto en Supabase (ahora manejado por React Query en AgregarProductoModal)
  const handleAgregarProducto = async (nuevo) => {
    // Esta función ya no es necesaria ya que React Query maneja la mutación
    // en el componente AgregarProductoModal
    // Recargar estadísticas después de agregar
    await cargarEstadisticasActualizadas();
  };

  // Función para recargar estadísticas
  const cargarEstadisticasActualizadas = async () => {
    if (!userProfile?.organization_id) return;
    
    try {
      const { count: totalProductos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', userProfile.organization_id);
      
      const { count: totalStockBajo } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', userProfile.organization_id)
        .lte('stock', 10);
      
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      
      const { count: totalProximosVencer } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', userProfile.organization_id)
        .not('fecha_vencimiento', 'is', null)
        .lte('fecha_vencimiento', proximaSemana.toISOString().split('T')[0]);
      
      setEstadisticas({
        total: totalProductos || 0,
        stockBajo: totalStockBajo || 0,
        proximosVencer: totalProximosVencer || 0,
        cargando: false
      });
    } catch (error) {
      console.error('Error recargando estadísticas:', error);
    }
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
    // Recargar estadísticas
    cargarEstadisticasActualizadas();
  };

  // Eliminar producto
  const handleEliminarProducto = async (producto) => {
    if (!user || !userProfile) return;
    
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"?`);
    if (!confirmar) return;

    try {
      // Eliminar imagen del storage si existe
      if (producto.imagen) {
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
      
      // Recargar estadísticas después de eliminar
      await cargarEstadisticasActualizadas();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleProductosImportados = () => {
    // React Query invalidará automáticamente la cache y recargará los productos
    setCsvModalOpen(false);
    // Recargar estadísticas después de importar
    cargarEstadisticasActualizadas();
  };

  return (
    <div className="inventario-main">
      {cargando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <LottieLoader size="medium" message="Cargando inventario..." />
        </div>
      ) : (
        <>
          <div className="inventario-stats">
            <div className={`stat-card ${filtroEstado === 'todos' ? 'active' : ''}`} onClick={() => setFiltroEstado('todos')}>
              <span className="stat-label">Total Productos</span>
              <span className="stat-value">{estadisticas.cargando ? '...' : estadisticas.total}</span>
            </div>
            <div className={`stat-card warning ${filtroEstado === 'stock-bajo' ? 'active' : ''}`} onClick={() => setFiltroEstado('stock-bajo')}>
              <span className="stat-label">Stock Bajo</span>
              <span className="stat-value">{estadisticas.cargando ? '...' : estadisticas.stockBajo}</span>
            </div>
            <div className={`stat-card danger ${filtroEstado === 'proximoVencer' ? 'active' : ''}`} onClick={() => setFiltroEstado('proximoVencer')}>
              <span className="stat-label">Próximos a Vencer</span>
              <span className="stat-value">{estadisticas.cargando ? '...' : estadisticas.proximosVencer}</span>
            </div>
          </div>

          <div className="inventario-header">
            <div className="inventario-search-container">
              <Search className="inventario-search-icon" size={20} />
              <input 
                className="inventario-search" 
                placeholder="Buscar por nombre, código de barras o categoría..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button 
                  className="clear-search"
                  onClick={() => setQuery('')}
                  title="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
            <div className="inventario-actions">
              <button className="inventario-btn inventario-btn-primary" onClick={() => setModalOpen(true)}>Nuevo producto</button>
              <button className="inventario-btn inventario-btn-secondary" onClick={() => setCsvModalOpen(true)}>Importar CSV</button>
              <button className="inventario-btn inventario-btn-secondary" onClick={() => setModoLista(m => !m)}>
                {modoLista ? <Grid3X3 size={18} /> : <List size={18} />}
              </button>
            </div>
          </div>
          
          {filtroEstado !== 'todos' && (
            <div className="filtro-activo">
              <span>Filtrando: {filtroEstado === 'stock-bajo' ? 'Stock Bajo' : 'Próximos a Vencer'}</span>
              <button onClick={() => setFiltroEstado('todos')}>× Limpiar filtro</button>
            </div>
          )}
        </>
      )}
      <div className="inventario-content">
        {modoLista ? (
          <div className="inventario-lista">
            {cargando ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <LottieLoader size="medium" message="Cargando productos..." />
              </div>
            ) : sortedFilteredProducts.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>
                {query ? `No se encontraron productos para "${query}"` : 'No hay productos aún.'}
              </div>
            ) : sortedFilteredProducts.map((prod, index) => (
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
            ) : sortedFilteredProducts.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>
                {query ? `No se encontraron productos para "${query}"` : 'No hay productos aún.'}
              </div>
            ) : sortedFilteredProducts.map((prod, index) => (
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
