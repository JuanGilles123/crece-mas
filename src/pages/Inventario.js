

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Inventario.css';
import AgregarProductoModal from './AgregarProductoModal';
import EditarProductoModal from './EditarProductoModal';
import ImportarProductosCSV from '../components/ImportarProductosCSV';
import OptimizedProductImage from '../components/OptimizedProductImage';
import { ProductCardSkeleton, ProductListSkeleton, InventoryHeaderSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Search } from 'lucide-react';

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
  const { user } = useAuth();
  const [productos, setProductos] = useState(productosIniciales);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoLista, setModoLista] = useState(false);
  const [query, setQuery] = useState('');
  // Suponiendo que el usuario tiene moneda en user.user_metadata.moneda
  const moneda = user?.user_metadata?.moneda || 'COP';

  // Función para cargar productos
  const cargarProductos = useCallback(async () => {
    if (!user) return;
    setCargando(true);
    
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (!error) {
      setProductos(data || []);
    }
    setCargando(false);
  }, [user]);

  // Cargar productos del usuario al montar
  useEffect(() => {
    cargarProductos();
  }, [user, cargarProductos]);

  // Filtrar productos basado en la búsqueda
  const filteredProducts = productos.filter((producto) => {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return true;
    return producto.nombre.toLowerCase().includes(searchTerm);
  });

  // Guardar producto en Supabase
  const handleAgregarProducto = async (nuevo) => {
    if (!user) return;
    // Log de los datos que se intentan guardar
    console.log('Intentando guardar producto:', {
      user_id: user.id,
      codigo: nuevo.codigo,
      nombre: nuevo.nombre,
      precio_compra: nuevo.precio_compra,
      precio_venta: nuevo.precio_venta,
      stock: nuevo.stock,
      imagen: nuevo.imagen,
    });
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          user_id: user.id,
          codigo: nuevo.codigo,
          nombre: nuevo.nombre,
          precio_compra: nuevo.precio_compra,
          precio_venta: nuevo.precio_venta,
          stock: nuevo.stock,
          imagen: nuevo.imagen,
        }
      ])
      .select();
    if (error) {
      console.error('Error al guardar producto:', error);
    } else if (data && data[0]) {
      setProductos(prev => [data[0], ...prev]);
    }
  };

  // Editar producto
  const handleEditarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setEditarModalOpen(true);
  };

  // Actualizar producto editado
  const handleProductoEditado = (productoEditado) => {
    setProductos(prev => prev.map(p => p.id === productoEditado.id ? productoEditado : p));
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

      // Eliminar producto de la base de datos
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', producto.id);

      if (error) {
        console.error('Error eliminando producto:', error);
        alert('Error al eliminar el producto');
      } else {
        setProductos(prev => prev.filter(p => p.id !== producto.id));
        alert('Producto eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleProductosImportados = () => {
    // Recargar la lista de productos después de la importación
    cargarProductos();
    setCsvModalOpen(false);
  };

  return (
    <div className="inventario-main">
      {cargando ? (
        <InventoryHeaderSkeleton />
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
              {modoLista ? 'Ver en cuadrícula' : 'Ver en lista'}
            </button>
          </div>
        </div>
      )}
      <div className="inventario-content">
        {modoLista ? (
          <div className="inventario-lista">
            {cargando ? (
              <>
                <ProductListSkeleton />
                <ProductListSkeleton />
                <ProductListSkeleton />
                <ProductListSkeleton />
              </>
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
                  <div style={{display:'flex',gap:'1.2rem',justifyContent:'center',marginBottom:4}}>
                    <span style={{color:'#2563eb',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'#16a34a',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
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
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </>
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
                    <span style={{color:'#2563eb',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'#16a34a',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
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
