
import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Inventario.css';
import { useAuth } from '../context/AuthContext';

const AgregarProductoModal = ({ open, onClose, onProductoAgregado, moneda }) => {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  if (!open) return null;

  const handlePrecioChange = e => {
    // Solo números, formatear con puntos
    let val = e.target.value.replace(/\D/g, '');
    setPrecio(val ? Number(val).toLocaleString('es-CO') : '');
  };

  const handleImagenChange = e => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!codigo || !nombre || !precio || !stock || !imagen) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setSubiendo(true);
    try {
      // Subir imagen a Supabase Storage
      const nombreArchivo = `${user.id}/${Date.now()}_${imagen.name}`;
      const { error: errorUpload } = await supabase.storage.from('productos').upload(nombreArchivo, imagen);
      if (errorUpload) throw errorUpload;
      // Obtener URL pública (o signed URL si es privado)
      const { data: urlData } = supabase.storage.from('productos').getPublicUrl(nombreArchivo);
      onProductoAgregado({
        codigo,
        nombre,
        precio: Number(precio.replace(/\D/g, '')),
        stock: Number(stock),
        imagen: urlData.publicUrl,
      });
      onClose();
  setCodigo(''); setNombre(''); setPrecio(''); setStock(''); setImagen(null);
    } catch (err) {
      setError('Error al subir la imagen o guardar el producto.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal-card">
        <h2>Agregar producto</h2>
        <form className="form-producto form-producto-centro" onSubmit={handleSubmit}>
          <label>Código de producto</label>
          <input value={codigo} onChange={e => setCodigo(e.target.value)} required className="input-form" placeholder="Ej: SKU123" />
          <label>Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required className="input-form" />
          <label>Precio</label>
          <div className="input-precio-row">
            <input value={precio} onChange={handlePrecioChange} required inputMode="numeric" placeholder="Ej: 50.000" className="input-form" />
            <span className="moneda-label">{moneda || 'COP'}</span>
          </div>
          <label>Stock</label>
          <input value={stock} onChange={e => setStock(e.target.value.replace(/\D/g, ''))} required inputMode="numeric" className="input-form" />
          <label>Imagen</label>
          <div className="input-upload-wrapper input-upload-centro">
            <button type="button" className="input-upload-btn" onClick={handleClickUpload}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="#2563eb" fillOpacity=".08"/></svg>
              {imagen ? imagen.name : 'Seleccionar imagen'}
            </button>
            <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display: 'none' }} required />
          </div>
          {imagen && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.7rem 0 1.2rem 0' }}>
              <img
                src={URL.createObjectURL(imagen)}
                alt="Previsualización"
                style={{ maxWidth: 120, maxHeight: 120, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              />
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions form-actions-centro">
            <button type="button" className="inventario-btn inventario-btn-secondary" onClick={onClose} disabled={subiendo}>Cancelar</button>
            <button type="submit" className="inventario-btn inventario-btn-primary" disabled={subiendo}>{subiendo ? 'Subiendo...' : 'Agregar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarProductoModal;
