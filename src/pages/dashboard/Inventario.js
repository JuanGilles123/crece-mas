

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Inventario.css';
import AgregarProductoModal from '../../components/modals/AgregarProductoModal';
import EditarProductoModal from '../../components/modals/EditarProductoModal';
import ImportarProductosCSV from '../../components/forms/ImportarProductosCSV';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import LottieLoader from '../../components/ui/LottieLoader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import { Search, List, Grid3X3 } from 'lucide-react';
import { useProductos, useEliminarProducto } from '../../hooks/useProductos';
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
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoLista, setModoLista] = useState(false);
  const [query, setQuery] = useState('');
  // Suponiendo que el usuario tiene moneda en user.user_metadata.moneda
  const moneda = user?.user_metadata?.moneda || 'COP';

  // React Query hooks
  const { data: productos = [], isLoading: cargando, error } = useProductos(user?.id);
  const eliminarProductoMutation = useEliminarProducto();

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
    if (!user) return;
    
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

      // Usar React Query mutation para eliminar
      eliminarProductoMutation.mutate({ 
        id: producto.id, 
        userId: user.id 
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
