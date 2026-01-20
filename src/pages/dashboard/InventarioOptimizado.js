import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Inventario.css';
import AgregarProductoModal from '../../components/modals/AgregarProductoModal';
import EditarProductoModal from '../../components/modals/EditarProductoModal';
import ImportarProductosCSV from '../../components/forms/ImportarProductosCSV';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import InfiniteScroll from '../../components/ui/InfiniteScroll';
import { ProductCardSkeleton, ProductListSkeleton, InventoryHeaderSkeleton } from '../../components/ui/SkeletonLoader';
import LottieLoader from '../../components/ui/LottieLoader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import { Search, List, Grid3X3, Plus, Upload, Filter } from 'lucide-react';
import { 
  useProductosPaginados, 
  useProductosInfinite,
  useProductosCount,
  useEliminarProductoOptimizado 
} from '../../hooks/useProductosPaginados';
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

const InventarioOptimizado = () => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoLista, setModoLista] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('pagination'); // 'pagination' o 'infinite'
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(20);

  const moneda = user?.user_metadata?.moneda || 'COP';

  // Hook para conteo total
  const { data: totalProductos = 0, isLoading: cargandoCount } = useProductosCount(user?.id);

  // Hook para paginación
  const { 
    data: productosPaginados, 
    isLoading: cargandoPaginados,
    error: errorPaginados,
    refetch: refetchPaginados
  } = useProductosPaginados(user?.id, {
    pageSize,
    searchTerm: searchQuery,
    sortBy,
    sortOrder,
    enabled: viewMode === 'pagination'
  });

  // Hook para infinite scroll
  const {
    data: productosInfinite,
    isLoading: cargandoInfinite,
    error: errorInfinite,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchInfinite
  } = useProductosInfinite(user?.id, {
    pageSize,
    searchTerm: searchQuery,
    sortBy,
    sortOrder,
    enabled: viewMode === 'infinite'
  });

  // Hook para eliminar producto
  const eliminarProductoMutation = useEliminarProductoOptimizado();

  // Obtener productos según el modo de vista
  const productos = viewMode === 'pagination' 
    ? productosPaginados?.data || []
    : productosInfinite?.pages?.flatMap(page => page.data) || [];

  const isLoading = viewMode === 'pagination' ? cargandoPaginados : cargandoInfinite;
  const error = viewMode === 'pagination' ? errorPaginados : errorInfinite;

  const handleEliminarProducto = useCallback(async (producto) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"?`)) {
      return;
    }

    try {
      // Eliminar imagen del storage si existe
      if (producto.imagen_url) {
        await deleteImageFromStorage(producto.imagen_url);
      }

      // Eliminar producto de la base de datos
      await eliminarProductoMutation.mutateAsync({
        id: producto.id,
        userId: user.id
      });

    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar el producto');
    }
  }, [eliminarProductoMutation, user?.id]);

  const handleEditarProducto = useCallback((producto) => {
    setProductoSeleccionado(producto);
    setEditarModalOpen(true);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSortChange = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const refetchData = useCallback(() => {
    if (viewMode === 'pagination') {
      refetchPaginados();
    } else {
      refetchInfinite();
    }
  }, [viewMode, refetchPaginados, refetchInfinite]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Iniciando sesión...</p>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      {/* Header */}
      <div className="inventario-header">
        <div className="inventario-header-left">
          <h1 className="inventario-title">Inventario</h1>
          {!cargandoCount && (
            <span className="inventario-count">
              {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="inventario-header-actions">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="inventario-action-button"
          >
            <Upload className="w-5 h-5" />
            Importar CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inventario-primary-button"
          >
            <Plus className="w-5 h-5" />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="inventario-controls">
        <div className="inventario-search">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar productos por nombre, código o descripción..."
            loading={isLoading}
            onClear={handleSearchClear}
            className="w-full max-w-md"
          />
        </div>

        <div className="inventario-controls-right">
          {/* Selector de tamaño de página */}
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="inventario-select"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>

          {/* Selector de ordenamiento */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
              setCurrentPage(1);
            }}
            className="inventario-select"
          >
            <option value="created_at-desc">Más recientes</option>
            <option value="created_at-asc">Más antiguos</option>
            <option value="nombre-asc">Nombre A-Z</option>
            <option value="nombre-desc">Nombre Z-A</option>
            <option value="precio_venta-asc">Precio menor</option>
            <option value="precio_venta-desc">Precio mayor</option>
            <option value="stock-asc">Stock menor</option>
            <option value="stock-desc">Stock mayor</option>
          </select>

          {/* Selector de modo de vista */}
          <div className="inventario-view-mode">
            <button
              onClick={() => handleViewModeChange('pagination')}
              className={`inventario-view-button ${viewMode === 'pagination' ? 'active' : ''}`}
            >
              <List className="w-4 h-4" />
              Paginación
            </button>
            <button
              onClick={() => handleViewModeChange('infinite')}
              className={`inventario-view-button ${viewMode === 'infinite' ? 'active' : ''}`}
            >
              <Grid3X3 className="w-4 h-4" />
              Scroll Infinito
            </button>
          </div>

          {/* Toggle de vista */}
          <button
            onClick={() => setModoLista(!modoLista)}
            className="inventario-view-toggle"
          >
            {modoLista ? <Grid3X3 className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="inventario-content">
        {isLoading ? (
          <div className="inventario-loading">
            <InventoryHeaderSkeleton />
            {modoLista ? (
              <ProductListSkeleton count={pageSize} />
            ) : (
              <div className="inventario-grid">
                {Array.from({ length: pageSize }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        ) : error ? (
          <div className="inventario-error">
            <p>Error al cargar productos</p>
            <button 
              onClick={refetchData}
              className="inventario-retry-button"
            >
              Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div className="inventario-empty">
            {searchQuery ? (
              <div>
                <p>No se encontraron productos para "{searchQuery}"</p>
                <p className="text-sm text-gray-500 mt-2">
                  Intenta con otros términos de búsqueda o{' '}
                  <button 
                    onClick={handleSearchClear}
                    className="text-blue-500 hover:underline"
                  >
                    limpiar la búsqueda
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <p>No hay productos en tu inventario</p>
                <p className="text-sm text-gray-500 mt-2">
                  Comienza agregando tu primer producto
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inventario-empty-button"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Producto
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'infinite' ? (
              <InfiniteScroll
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                className="w-full"
              >
                {modoLista ? (
                  <div className="inventario-list">
                    {productos.map((producto) => (
                      <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inventario-list-item"
                      >
                        <div className="inventario-item-image">
                          <OptimizedProductImage
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="inventario-item-info">
                          <h3 className="inventario-item-name">{producto.nombre}</h3>
                          <p className="inventario-item-description">{producto.descripcion}</p>
                          <div className="inventario-item-details">
                            <span className="inventario-item-price">
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: moneda,
                                maximumFractionDigits: 0
                              }).format(producto.precio_venta)}
                            </span>
                            <span className="inventario-item-stock">
                              Stock: {producto.stock}
                            </span>
                          </div>
                        </div>
                        <div className="inventario-item-actions">
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            className="inventario-item-edit"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(producto)}
                            className="inventario-item-delete"
                          >
                            Eliminar
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="inventario-grid">
                    {productos.map((producto) => (
                      <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="inventario-card"
                      >
                        <div className="inventario-card-image">
                          <OptimizedProductImage
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="inventario-card-content">
                          <h3 className="inventario-card-name">{producto.nombre}</h3>
                          <p className="inventario-card-description">{producto.descripcion}</p>
                          <div className="inventario-card-details">
                            <span className="inventario-card-price">
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: moneda,
                                maximumFractionDigits: 0
                              }).format(producto.precio_venta)}
                            </span>
                            <span className="inventario-card-stock">
                              Stock: {producto.stock}
                            </span>
                          </div>
                          <div className="inventario-card-actions">
                            <button
                              onClick={() => handleEditarProducto(producto)}
                              className="inventario-card-edit"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarProducto(producto)}
                              className="inventario-card-delete"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </InfiniteScroll>
            ) : (
              <>
                {modoLista ? (
                  <div className="inventario-list">
                    {productos.map((producto) => (
                      <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inventario-list-item"
                      >
                        <div className="inventario-item-image">
                          <OptimizedProductImage
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="inventario-item-info">
                          <h3 className="inventario-item-name">{producto.nombre}</h3>
                          <p className="inventario-item-description">{producto.descripcion}</p>
                          <div className="inventario-item-details">
                            <span className="inventario-item-price">
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: moneda,
                                maximumFractionDigits: 0
                              }).format(producto.precio_venta)}
                            </span>
                            <span className="inventario-item-stock">
                              Stock: {producto.stock}
                            </span>
                          </div>
                        </div>
                        <div className="inventario-item-actions">
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            className="inventario-item-edit"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(producto)}
                            className="inventario-item-delete"
                          >
                            Eliminar
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="inventario-grid">
                    {productos.map((producto) => (
                      <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="inventario-card"
                      >
                        <div className="inventario-card-image">
                          <OptimizedProductImage
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="inventario-card-content">
                          <h3 className="inventario-card-name">{producto.nombre}</h3>
                          <p className="inventario-card-description">{producto.descripcion}</p>
                          <div className="inventario-card-details">
                            <span className="inventario-card-price">
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: moneda,
                                maximumFractionDigits: 0
                              }).format(producto.precio_venta)}
                            </span>
                            <span className="inventario-card-stock">
                              Stock: {producto.stock}
                            </span>
                          </div>
                          <div className="inventario-card-actions">
                            <button
                              onClick={() => handleEditarProducto(producto)}
                              className="inventario-card-edit"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarProducto(producto)}
                              className="inventario-card-delete"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Paginación */}
                {productosPaginados && productosPaginados.totalPages > 1 && (
                  <div className="inventario-pagination">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={productosPaginados.totalPages}
                      onPageChange={handlePageChange}
                      showInfo={true}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <AnimatePresence>
        {modalOpen && (
          <AgregarProductoModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              setModalOpen(false);
              refetchData();
            }}
          />
        )}

        {editarModalOpen && productoSeleccionado && (
          <EditarProductoModal
            isOpen={editarModalOpen}
            onClose={() => {
              setEditarModalOpen(false);
              setProductoSeleccionado(null);
            }}
            producto={productoSeleccionado}
            onSuccess={() => {
              setEditarModalOpen(false);
              setProductoSeleccionado(null);
              refetchData();
            }}
          />
        )}

        {csvModalOpen && (
          <ImportarProductosCSV
            isOpen={csvModalOpen}
            onClose={() => setCsvModalOpen(false)}
            onSuccess={() => {
              setCsvModalOpen(false);
              refetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventarioOptimizado;
