

import React, { useState, useEffect } from 'react';
import './Inventario.css';
import AgregarProductoModal from './AgregarProductoModal';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const productosIniciales = [];


const Inventario = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState(productosIniciales);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoLista, setModoLista] = useState(false);
  // Suponiendo que el usuario tiene moneda en user.user_metadata.moneda
  const moneda = user?.user_metadata?.moneda || 'COP';

  // Cargar productos del usuario al montar
  useEffect(() => {
    const fetchProductos = async () => {
      if (!user) return;
      setCargando(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setProductos(data || []);
      setCargando(false);
    };
    fetchProductos();
  }, [user]);

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

  return (
    <div className="inventario-main">
      <div className="inventario-header">
        <input className="inventario-search" placeholder="Buscar producto..." />
        <div className="inventario-actions">
          <button className="inventario-btn inventario-btn-primary" onClick={() => setModalOpen(true)}>Nuevo producto</button>
          <button className="inventario-btn inventario-btn-secondary">Importar CSV</button>
          <button className="inventario-btn inventario-btn-secondary" onClick={() => setModoLista(m => !m)}>
            {modoLista ? 'Ver en cuadrícula' : 'Ver en lista'}
          </button>
        </div>
      </div>
      <div className="inventario-content">
        {modoLista ? (
          <div className="inventario-lista">
            {cargando ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>Cargando productos...</div>
            ) : productos.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>No hay productos aún.</div>
            ) : productos.map(prod => (
              <div className="inventario-lista-item" key={prod.id}>
                <img src={prod.imagen} alt={prod.nombre} className="inventario-img-lista" />
                <div className="inventario-lista-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div style={{display:'flex',gap:'1.2rem',justifyContent:'center',marginBottom:4}}>
                    <span style={{color:'#2563eb',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'#16a34a',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="inventario-stock">Stock: {prod.stock}</div>
                </div>
                <div className="inventario-lista-actions">
                  <button className="inventario-btn inventario-btn-outline">Editar</button>
                  <button className="inventario-btn inventario-btn-outline eliminar">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="inventario-grid">
            {cargando ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>Cargando productos...</div>
            ) : productos.length === 0 ? (
              <div style={{textAlign:'center',width:'100%',padding:'2rem'}}>No hay productos aún.</div>
            ) : productos.map(prod => (
              <div className="inventario-card" key={prod.id}>
                <img src={prod.imagen} alt={prod.nombre} className="inventario-img" />
                <div className="inventario-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div style={{display:'flex',gap:'1.2rem',justifyContent:'center',marginBottom:4}}>
                    <span style={{color:'#2563eb',fontWeight:700}}>Compra: {prod.precio_compra?.toLocaleString('es-CO')}</span>
                    <span style={{color:'#16a34a',fontWeight:700}}>Venta: {prod.precio_venta?.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="inventario-stock">Stock: {prod.stock}</div>
                </div>
                <div className="inventario-card-actions">
                  <button className="inventario-btn inventario-btn-outline">Editar</button>
                  <button className="inventario-btn inventario-btn-outline eliminar">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Panel lateral eliminado por solicitud */}
      </div>
      <AgregarProductoModal open={modalOpen} onClose={() => setModalOpen(false)} onProductoAgregado={handleAgregarProducto} moneda={moneda} />
    </div>
  );
};

export default Inventario;
