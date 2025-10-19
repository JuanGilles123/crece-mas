
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { FormSkeleton } from '../components/SkeletonLoader';
import LottieLoader from '../components/LottieLoader';
import './Inventario.css';
import { useAuth } from '../context/AuthContext';
import { compressProductImage } from '../utils/imageCompression';
import { useAgregarProducto } from '../hooks/useProductos';
import toast from 'react-hot-toast';

// Esquema de validación con Zod
const productoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(50, 'El código es muy largo'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  precioCompra: z.string().min(1, 'El precio de compra es requerido'),
  precioVenta: z.string().min(1, 'El precio de venta es requerido'),
  stock: z.string().min(1, 'El stock es requerido'),
  fecha_vencimiento: z.string().optional(),
  imagen: z.any().optional()
}).refine((data) => {
  const precioCompra = parseFloat(data.precioCompra.replace(/[^\d]/g, ''));
  const precioVenta = parseFloat(data.precioVenta.replace(/[^\d]/g, ''));
  return precioVenta >= precioCompra;
}, {
  message: "El precio de venta debe ser mayor o igual al precio de compra",
  path: ["precioVenta"]
});

const AgregarProductoModal = ({ open, onClose, onProductoAgregado, moneda }) => {
  const { user, userProfile } = useAuth();
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const fileInputRef = useRef();

  // React Query mutation
  const agregarProductoMutation = useAgregarProducto();

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      precioCompra: '',
      precioVenta: '',
      stock: ''
    }
  });

  if (!open) return null;

  // Funciones para formatear precios
  const handlePrecioCompraChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    const formatted = val ? Number(val).toLocaleString('es-CO') : '';
    setValue('precioCompra', formatted);
  };

  const handlePrecioVentaChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    const formatted = val ? Number(val).toLocaleString('es-CO') : '';
    setValue('precioVenta', formatted);
  };

  const handleStockChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    setValue('stock', val);
  };

  const handleImagenChange = e => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const onSubmit = async (data) => {
    if (!imagen) {
      toast.error('La imagen es obligatoria');
      return;
    }

    setSubiendo(true);
    setComprimiendo(true);
    try {
      // Comprimir imagen antes de subir
      console.log('Comprimiendo imagen antes de subir...');
      const imagenComprimida = await compressProductImage(imagen);
      setComprimiendo(false);
      
      // Subir imagen comprimida a Supabase Storage usando organization_id
      const organizationId = userProfile?.organization_id;
      if (!organizationId) {
        throw new Error('No se encontró organization_id');
      }
      const nombreArchivo = `${organizationId}/${Date.now()}_${imagenComprimida.name}`;
      const { error: errorUpload } = await supabase.storage.from('productos').upload(nombreArchivo, imagenComprimida);
      if (errorUpload) throw errorUpload;
      // Guardar la ruta del archivo en lugar de la URL
      // Usaremos signed URLs cuando necesitemos mostrar la imagen
      console.log('✅ Archivo guardado con organization_id:', nombreArchivo);
      // Usar React Query mutation
      const productoData = {
        user_id: user.id,
        organization_id: organizationId,
        codigo: data.codigo,
        nombre: data.nombre,
        precio_compra: Number(data.precioCompra.replace(/\D/g, '')),
        precio_venta: Number(data.precioVenta.replace(/\D/g, '')),
        stock: Number(data.stock),
        fecha_vencimiento: data.fecha_vencimiento || null,
        imagen: nombreArchivo, // Guardamos la ruta del archivo con organization_id
      };

      agregarProductoMutation.mutate(productoData);
      
      reset();
      setImagen(null);
      onClose();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al subir la imagen o guardar el producto.');
    } finally {
      setSubiendo(false);
      setComprimiendo(false);
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal-card">
        <h2>Agregar producto</h2>
        {subiendo ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {comprimiendo ? (
              <div>
                <div style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                  🗜️ Comprimiendo imagen...
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Optimizando para carga rápida
                </div>
              </div>
            ) : (
              <LottieLoader size="medium" message="Subiendo producto..." />
            )}
          </div>
        ) : (
          <form className="form-producto form-producto-centro" onSubmit={handleSubmit(onSubmit)}>
          <label>Código de producto</label>
          <input 
            {...register('codigo')} 
            className={`input-form ${errors.codigo ? 'error' : ''}`} 
            placeholder="Ej: SKU123" 
          />
          {errors.codigo && <span className="error-message">{errors.codigo.message}</span>}
          
          <label>Nombre</label>
          <input 
            {...register('nombre')} 
            className={`input-form ${errors.nombre ? 'error' : ''}`} 
          />
          {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
          <label>Precios</label>
          <div className="input-precio-row" style={{ gap: '2.5rem', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>Precio de Compra</span>
              <input 
                {...register('precioCompra')} 
                onChange={handlePrecioCompraChange} 
                inputMode="numeric" 
                placeholder="Ej: 30.000" 
                className={`input-form ${errors.precioCompra ? 'error' : ''}`} 
              />
              {errors.precioCompra && <span className="error-message">{errors.precioCompra.message}</span>}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>Precio de Venta</span>
              <input 
                {...register('precioVenta')} 
                onChange={handlePrecioVentaChange} 
                inputMode="numeric" 
                placeholder="Ej: 50.000" 
                className={`input-form ${errors.precioVenta ? 'error' : ''}`} 
              />
              {errors.precioVenta && <span className="error-message">{errors.precioVenta.message}</span>}
            </div>
          </div>
          <label>Stock</label>
          <input 
            {...register('stock')} 
            onChange={handleStockChange} 
            inputMode="numeric" 
            className={`input-form ${errors.stock ? 'error' : ''}`} 
            placeholder="Cantidad en stock"
          />
          {errors.stock && <span className="error-message">{errors.stock.message}</span>}
          
          <label>Fecha de Vencimiento <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span></label>
          <input 
            {...register('fecha_vencimiento')} 
            type="date"
            className="input-form" 
            placeholder="Seleccionar fecha"
            min={new Date().toISOString().split('T')[0]}
          />
          <span style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '-0.5rem' }}>
            Solo para productos perecederos o con fecha de caducidad
          </span>
          
          <label>Imagen</label>
          <div className="input-upload-wrapper input-upload-centro">
            <button type="button" className="input-upload-btn" onClick={handleClickUpload}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="#2563eb" fillOpacity=".08"/></svg>
              {imagen ? imagen.name : 'Seleccionar imagen'}
            </button>
            <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display: 'none' }} required />
          </div>
          <div className="form-actions form-actions-centro">
            <button type="button" className="inventario-btn inventario-btn-secondary" onClick={onClose} disabled={subiendo}>Cancelar</button>
            <button type="submit" className="inventario-btn inventario-btn-primary" disabled={subiendo || isSubmitting}>
              {subiendo ? (comprimiendo ? '🗜️ Comprimiendo...' : 'Subiendo...') : 'Agregar'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AgregarProductoModal;
