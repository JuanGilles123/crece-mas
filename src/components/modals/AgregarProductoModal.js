
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../services/api/supabaseClient';
import LottieLoader from '../../components/ui/LottieLoader';
import '../../pages/dashboard/Inventario.css';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { compressProductImage } from '../../services/storage/imageCompression';
import { useAgregarProducto } from '../../hooks/useProductos';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { Package, Scissors } from 'lucide-react';
import { getDefaultProductType, shouldSkipProductTypeSelector } from '../../constants/businessTypes';
import { generateStoragePath, validateFilename } from '../../utils/fileUtils';
import toast from 'react-hot-toast';

// Esquema de validación con Zod
const productoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(50, 'El código es muy largo'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  precioCompra: z.string().optional(),
  precioVenta: z.string().min(1, 'El precio de venta es requerido'),
  stock: z.string().optional(),
  fecha_vencimiento: z.union([z.string(), z.undefined()]).optional(),
  imagen: z.any().optional(),
  tipo: z.enum(['fisico', 'servicio']).default('fisico')
}).superRefine((data, ctx) => {
  const precioCompra = data.precioCompra ? parseFloat(data.precioCompra.replace(/[^\d]/g, '')) : 0;
  const precioVenta = parseFloat(data.precioVenta.replace(/[^\d]/g, ''));

  // Validar precio de compra solo si es producto físico
  if (data.tipo === 'fisico' && (!data.precioCompra || data.precioCompra.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El precio de compra es requerido para productos físicos",
      path: ["precioCompra"]
    });
  }

  // Validar stock solo si es producto físico
  if (data.tipo === 'fisico' && (!data.stock || data.stock.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El stock es requerido para productos físicos",
      path: ["stock"]
    });
  }

  // Validar precio de venta >= compra (solo si hay precio compra y es producto físico)
  if (data.tipo === 'fisico' && !isNaN(precioCompra) && !isNaN(precioVenta) && precioVenta < precioCompra) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El precio de venta debe ser mayor o igual al precio de compra",
      path: ["precioVenta"]
    });
  }
});

const AgregarProductoModal = ({ open, onClose, onProductoAgregado, moneda }) => {
  const { user, userProfile, organization } = useAuth();
  const { hasFeature } = useSubscription();
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [tipoProducto, setTipoProducto] = useState('fisico'); // 'fisico' | 'servicio'
  const fileInputRef = useRef();

  // Obtener tipo de producto por defecto según tipo de negocio
  const defaultProductType = organization?.business_type 
    ? getDefaultProductType(organization.business_type) 
    : 'fisico';
  
  const skipTypeSelector = shouldSkipProductTypeSelector(organization?.business_type);
  
  // Verificar si el negocio es de servicios
  const isServiceBusiness = organization?.business_type === 'service';

  // Verificar si tiene acceso a imágenes
  const puedeSubirImagenes = hasFeature('productImages');
  
  // Inicializar tipo de producto según configuración del negocio
  useEffect(() => {
    if (skipTypeSelector && defaultProductType) {
      setTipoProducto(defaultProductType);
      setValue('tipo', defaultProductType);
    }
  }, [skipTypeSelector, defaultProductType, setValue]);

  // Currency inputs
  const precioCompraInput = useCurrencyInput();
  const precioVentaInput = useCurrencyInput();
  const stockInput = useCurrencyInput();

  // React Query mutation
  const agregarProductoMutation = useAgregarProducto();

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      precioCompra: '',
      precioVenta: '',
      stock: '',
      tipo: 'fisico'
    }
  });

  // Actualizar el valor del formulario cuando cambia el estado local
  React.useEffect(() => {
    setValue('tipo', tipoProducto);
    // Si cambia a servicio, limpiar campos que no aplican
    if (tipoProducto === 'servicio') {
      setValue('precioCompra', '');
      setValue('stock', '');
      precioCompraInput.reset();
      stockInput.reset();
    }
  }, [tipoProducto, setValue, precioCompraInput, stockInput]);

  if (!open) return null;

  // Funciones optimizadas para manejar inputs
  const handlePrecioCompraChange = (e) => {
    const formatted = precioCompraInput.handleChange(e);
    setValue('precioCompra', formatted || '', { shouldValidate: true });
  };

  const handlePrecioVentaChange = (e) => {
    const formatted = precioVentaInput.handleChange(e);
    setValue('precioVenta', formatted || '', { shouldValidate: true });
  };

  const handleStockChange = (e) => {
    const formatted = stockInput.handleChange(e);
    setValue('stock', formatted || '', { shouldValidate: true });
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
    setSubiendo(true);
    let imagenPath = null;

    try {
      // Si hay imagen y tiene permiso, subirla
      if (imagen && puedeSubirImagenes) {
        // Validar el nombre del archivo antes de comprimir
        const validation = validateFilename(imagen.name);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        setComprimiendo(true);
        // Comprimir imagen antes de subir
        const imagenComprimida = await compressProductImage(imagen);
        setComprimiendo(false);

        // Subir imagen comprimida a Supabase Storage usando organization_id
        const organizationId = userProfile?.organization_id;
        if (!organizationId) {
          throw new Error('No se encontró organization_id');
        }
        const nombreArchivo = generateStoragePath(organizationId, imagenComprimida.name);
        const { error: errorUpload } = await supabase.storage.from('productos').upload(nombreArchivo, imagenComprimida);
        if (errorUpload) throw errorUpload;
        imagenPath = nombreArchivo;
      }

      // Usar React Query mutation
      const productoData = {
        user_id: user.id,
        organization_id: userProfile?.organization_id,
        codigo: data.codigo,
        nombre: data.nombre,
        precio_compra: tipoProducto === 'servicio' ? 0 : (Number(data.precioCompra?.replace(/\D/g, '') || '0') || 0),
        precio_venta: Number(data.precioVenta.replace(/\D/g, '')),
        stock: tipoProducto === 'servicio' ? null : Number(data.stock?.replace(/\D/g, '') || '0'),
        fecha_vencimiento: tipoProducto === 'servicio' ? null : (data.fecha_vencimiento || null),
        imagen: imagenPath, // Puede ser null si no se subió imagen
        tipo: tipoProducto
      };

      agregarProductoMutation.mutate(productoData, {
        onSuccess: () => {
          reset();
          setImagen(null);
          setTipoProducto('fisico');
          precioCompraInput.reset();
          precioVentaInput.reset();
          stockInput.reset();
          onClose();
        },
        onError: (error) => {
          console.error('Error agregando producto:', error);
          toast.error(error?.message || 'Error al guardar el producto.');
        }
      });
    } catch (err) {
      console.error('Error:', err);
      toast.error(err?.message || 'Error al guardar el producto.');
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
            {isServiceBusiness && !skipTypeSelector && (
              <div className="tipo-producto-selector" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className={`inventario-btn ${tipoProducto === 'fisico' ? 'inventario-btn-primary' : 'inventario-btn-outline'}`}
                  onClick={() => setTipoProducto('fisico')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Package size={18} />
                  Producto Físico
                </button>
                <button
                  type="button"
                  className={`inventario-btn ${tipoProducto === 'servicio' ? 'inventario-btn-primary' : 'inventario-btn-outline'}`}
                  onClick={() => setTipoProducto('servicio')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Scissors size={18} />
                  Servicio
                </button>
              </div>
            )}
            {skipTypeSelector && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Tipo de producto: <strong>{tipoProducto === 'servicio' ? 'Servicio' : tipoProducto === 'comida' ? 'Comida' : tipoProducto === 'accesorio' ? 'Accesorio' : 'Producto Físico'}</strong> (inferido del tipo de negocio)
              </div>
            )}

            <label>Código de {tipoProducto === 'servicio' ? 'servicio' : 'producto'}</label>
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
              {tipoProducto === 'fisico' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>Precio de Compra</span>
                  <input
                    {...register('precioCompra')}
                    value={precioCompraInput.displayValue}
                    onChange={handlePrecioCompraChange}
                    inputMode="numeric"
                    placeholder="Ej: 30.000"
                    className={`input-form ${errors.precioCompra ? 'error' : ''}`}
                  />
                  {errors.precioCompra && <span className="error-message">{errors.precioCompra.message}</span>}
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>Precio de Venta</span>
                <input
                  {...register('precioVenta')}
                  value={precioVentaInput.displayValue}
                  onChange={handlePrecioVentaChange}
                  inputMode="numeric"
                  placeholder="Ej: 50.000"
                  className={`input-form ${errors.precioVenta ? 'error' : ''}`}
                />
                {errors.precioVenta && <span className="error-message">{errors.precioVenta.message}</span>}
              </div>
            </div>
            {tipoProducto === 'fisico' && (
              <>
                <label>Stock</label>
                <input
                  {...register('stock')}
                  value={stockInput.displayValue}
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
              </>
            )}

            <label>Imagen <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span> {!puedeSubirImagenes && <span style={{ color: '#ef4444', fontWeight: 600 }}>🔒 Solo plan Estándar</span>}</label>
            <div className="input-upload-wrapper input-upload-centro">
              <button
                type="button"
                className="input-upload-btn"
                onClick={puedeSubirImagenes ? handleClickUpload : () => toast.error('Actualiza al plan Estándar para subir imágenes')}
                disabled={!puedeSubirImagenes}
                style={!puedeSubirImagenes ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="4" y="16" width="16" height="4" rx="2" fill="#2563eb" fillOpacity=".08" /></svg>
                {imagen ? imagen.name : puedeSubirImagenes ? 'Seleccionar imagen' : '🔒 Bloqueado'}
              </button>
              <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display: 'none' }} disabled={!puedeSubirImagenes} />
            </div>
            {!puedeSubirImagenes && (
              <span style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '-0.5rem' }}>
                Las imágenes de productos están disponibles en el plan Estándar
              </span>
            )}
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
