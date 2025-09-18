import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Inventario.css';
import { useAuth } from '../context/AuthContext';

const EditarProductoModal = ({ open, onClose, producto, onProductoEditado }) => {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState(producto?.codigo || '');
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [precioCompra, setPrecioCompra] = useState(producto?.precio_compra?.toString() || '');
  const [precioVenta, setPrecioVenta] = useState(producto?.precio_venta?.toString() || '');
  const [stock, setStock] = useState(producto?.stock?.toString() || '');
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Funciones para manejar la imagen (igual que en AgregarProductoModal)
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
    }
  };


  // Actualizar estados cuando cambie el producto
  React.useEffect(() => {
    if (producto) {
      setCodigo(producto.codigo || '');
      setNombre(producto.nombre || '');
      setPrecioCompra(producto.precio_compra?.toString() || '');
      setPrecioVenta(producto.precio_venta?.toString() || '');
      setStock(producto.stock?.toString() || '');
      setImagen(null); // Limpiar imagen nueva al cambiar producto
    }
  }, [producto]);

  // Limpiar imagen cuando se cierre el modal
  React.useEffect(() => {
    if (!open) {
      setImagen(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    setSubiendo(true);

    // Validar que el stock no sea negativo
    const stockNum = Number(stock);
    if (stockNum < 0) {
      setError('El stock no puede ser negativo');
      setSubiendo(false);
      return;
    }

    try {
      let imagenPath = producto?.imagen; // Mantener imagen actual por defecto

      // Si hay nueva imagen, subirla
      if (imagen) {
        const nombreArchivo = `${user.id}/${Date.now()}_${imagen.name}`;
        const { error: errorUpload } = await supabase.storage.from('productos').upload(nombreArchivo, imagen);
        if (errorUpload) throw errorUpload;
        imagenPath = nombreArchivo;
      }

      // Actualizar producto en la base de datos
      const { error: updateError } = await supabase
        .from('productos')
        .update({
          codigo,
          nombre,
          precio_compra: Number(precioCompra.replace(/\D/g, '')),
          precio_venta: Number(precioVenta.replace(/\D/g, '')),
          stock: Number(stock),
          imagen: imagenPath,
        })
        .eq('id', producto.id);

      if (updateError) throw updateError;

      onProductoEditado({
        id: producto.id,
        codigo,
        nombre,
        precio_compra: Number(precioCompra.replace(/\D/g, '')),
        precio_venta: Number(precioVenta.replace(/\D/g, '')),
        stock: Number(stock),
        imagen: imagenPath,
      });

      // Limpiar formulario
      setCodigo('');
      setNombre('');
      setPrecioCompra('');
      setPrecioVenta('');
      setStock('');
      setImagen(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      onClose();
    } catch (err) {
      console.error('Error actualizando producto:', err);
      setError(err.message || 'Error al actualizar el producto');
    } finally {
      setSubiendo(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg">
      <div className="modal-card">
        <h2>Editar producto</h2>
        <form className="form-producto form-producto-centro" onSubmit={handleSubmit}>
          <label>Código de producto</label>
          <input 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)} 
            required 
            className="input-form" 
            placeholder="Ej: SKU123" 
          />
          <label>Nombre</label>
          <input 
            value={nombre} 
            onChange={e => setNombre(e.target.value)} 
            required 
            className="input-form" 
          />
          <label>Precios</label>
          <div className="input-precio-row" style={{ gap: '2.5rem', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>Precio de Compra</span>
              <input 
                value={precioCompra} 
                onChange={e => setPrecioCompra(e.target.value)} 
                required 
                inputMode="numeric"
                placeholder="Ej: 30.000" 
                className="input-form" 
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>Precio de Venta</span>
              <input 
                value={precioVenta} 
                onChange={e => setPrecioVenta(e.target.value)} 
                required 
                inputMode="numeric"
                placeholder="Ej: 50.000" 
                className="input-form" 
              />
            </div>
          </div>
          <label>Stock</label>
          <input 
            value={stock} 
            onChange={e => {
              const value = e.target.value;
              // No permitir valores negativos
              if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
                setStock(value);
              }
            }} 
            required 
            type="number" 
            min="0" 
            className="input-form" 
            placeholder="Cantidad en stock" 
          />
          <label>Imagen (opcional)</label>
          
          
          <div className="input-upload-wrapper input-upload-centro">
            <button type="button" className="input-upload-btn" onClick={handleClickUpload}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="#2563eb" fillOpacity=".08"/></svg>
              {imagen ? imagen.name : 'Cambiar imagen'}
            </button>
            <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display: 'none' }} />
          </div>
          
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions form-actions-centro">
            <button type="button" className="inventario-btn inventario-btn-secondary" onClick={onClose} disabled={subiendo}>
              Cancelar
            </button>
            <button type="submit" className="inventario-btn inventario-btn-primary" disabled={subiendo}>
              {subiendo ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarProductoModal;
