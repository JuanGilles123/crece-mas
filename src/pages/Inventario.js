

import React, { useState } from 'react';
import './Inventario.css';
import AgregarProductoModal from './AgregarProductoModal';
import { useAuth } from '../context/AuthContext';

const productosIniciales = [
  { id: 1, nombre: 'Taza de ceramica winalmass', precio: 15000, stock: 50, imagen: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' },
  { id: 2, nombre: 'Auracuires winalmass', precio: 0, stock: 0, imagen: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 3, nombre: '80.000 recetas', precio: 80000, stock: 0, imagen: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80' },
  { id: 4, nombre: 'Taza navideña', precio: 15000, stock: 50, imagen: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' },
  { id: 5, nombre: 'Libro de recetas', precio: 0, stock: 52, imagen: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80' },
  { id: 6, nombre: 'Recetario social', precio: 0, stock: 0, imagen: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { id: 7, nombre: 'Rabaná', precio: 35000, stock: 12, imagen: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80' },
];


const Inventario = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState(productosIniciales);
  const [modalOpen, setModalOpen] = useState(false);
  const [modoLista, setModoLista] = useState(false);
  // Suponiendo que el usuario tiene moneda en user.user_metadata.moneda
  const moneda = user?.user_metadata?.moneda || 'COP';

  const handleAgregarProducto = (nuevo) => {
    setProductos(prev => [
      { ...nuevo, id: Date.now() },
      ...prev
    ]);
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
            {productos.map(prod => (
              <div className="inventario-lista-item" key={prod.id}>
                <img src={prod.imagen} alt={prod.nombre} className="inventario-img-lista" />
                <div className="inventario-lista-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div className="inventario-precio">{prod.precio > 0 ? prod.precio.toLocaleString('es-CO') : '\u00A0'}</div>
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
            {productos.map(prod => (
              <div className="inventario-card" key={prod.id}>
                <img src={prod.imagen} alt={prod.nombre} className="inventario-img" />
                <div className="inventario-info">
                  <div className="inventario-nombre">{prod.nombre}</div>
                  <div className="inventario-precio" style={{ minHeight: '1.2em' }}>{prod.precio > 0 ? prod.precio.toLocaleString('es-CO') : '\u00A0'}</div>
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
