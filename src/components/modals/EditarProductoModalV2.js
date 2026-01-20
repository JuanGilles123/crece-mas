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
import { useActualizarProducto } from '../../hooks/useProductos';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PRODUCT_TYPES, ADDITIONAL_FIELDS, getProductTypeFields } from '../../utils/productTypes';
import OptimizedProductImage from '../../components/business/OptimizedProductImage';
import './AgregarProductoModalV2.css';

// Función para crear esquema de validación dinámico (igual que en AgregarProductoModalV2)
const createProductSchema = (productType) => {
  const baseSchema = {
    codigo: z.string().min(1, 'El código es requerido').max(50, 'El código es muy largo'),
    nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
    precioVenta: z.string().min(1, 'El precio de venta es requerido'),
    tipo: z.enum(['fisico', 'servicio', 'comida', 'accesorio']),
    imagen: z.any().optional(),
  };

  const typeFields = getProductTypeFields(productType);
  
  if (typeFields.required.includes('precio_compra')) {
    baseSchema.precioCompra = z.string().min(1, 'El precio de compra es requerido');
  } else {
    baseSchema.precioCompra = z.string().optional();
  }

  if (typeFields.required.includes('stock')) {
    baseSchema.stock = z.string().min(1, 'El stock es requerido');
  } else {
    baseSchema.stock = z.string().optional();
  }

  // Campos opcionales
  baseSchema.fecha_vencimiento = z.union([z.string(), z.undefined()]).optional();
  baseSchema.peso = z.string().optional();
  baseSchema.unidad_peso = z.string().optional();
  baseSchema.dimensiones = z.string().optional();
  baseSchema.marca = z.string().optional();
  baseSchema.modelo = z.string().optional();
  baseSchema.color = z.string().optional();
  baseSchema.talla = z.string().optional();
  baseSchema.material = z.string().optional();
  baseSchema.categoria = z.string().optional();
  baseSchema.duracion = z.string().optional();
  baseSchema.descripcion = z.string().optional();
  baseSchema.ingredientes = z.string().optional();
  baseSchema.alergenos = z.string().optional();
  baseSchema.calorias = z.string().optional();
  baseSchema.porcion = z.string().optional();
  baseSchema.variaciones = z.string().optional();

  return z.object(baseSchema).superRefine((data, ctx) => {
    const precioCompra = data.precioCompra ? parseFloat(data.precioCompra.replace(/[^\d]/g, '')) : 0;
    const precioVenta = parseFloat(data.precioVenta.replace(/[^\d]/g, ''));

    if (typeFields.required.includes('precio_compra') && (!data.precioCompra || data.precioCompra.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El precio de compra es requerido",
        path: ["precioCompra"]
      });
    }

    if (typeFields.required.includes('stock') && (!data.stock || data.stock.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El stock es requerido",
        path: ["stock"]
      });
    }

    if (data.precioCompra && !isNaN(precioCompra) && !isNaN(precioVenta) && precioVenta < precioCompra) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El precio de venta debe ser mayor o igual al precio de compra",
        path: ["precioVenta"]
      });
    }
  });
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

const EditarProductoModalV2 = ({ open, onClose, producto, onProductoEditado }) => {
  const { userProfile } = useAuth();
  const { hasFeature } = useSubscription();
  const [formStep, setFormStep] = useState(1);
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [additionalFields, setAdditionalFields] = useState([]);
  const fileInputRef = useRef();

  const puedeSubirImagenes = hasFeature('productImages');

  // Currency inputs
  const precioCompraInput = useCurrencyInput();
  const precioVentaInput = useCurrencyInput();
  const stockInput = useCurrencyInput();

  // React Query mutation
  const actualizarProductoMutation = useActualizarProducto();

  // Obtener tipo del producto o default
  const selectedType = producto?.tipo || 'fisico';
  const productSchema = createProductSchema(selectedType);

  // Cargar metadata del producto si existe
  const metadata = producto?.metadata || {};

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      codigo: producto?.codigo || '',
      nombre: producto?.nombre || '',
      precioCompra: producto?.precio_compra?.toString() || '',
      precioVenta: producto?.precio_venta?.toString() || '',
      stock: producto?.stock?.toString() || '',
      tipo: selectedType,
      fecha_vencimiento: producto?.fecha_vencimiento || '',
      peso: metadata?.peso || '',
      unidad_peso: metadata?.unidad_peso || 'kg',
      dimensiones: metadata?.dimensiones || '',
      marca: metadata?.marca || '',
      modelo: metadata?.modelo || '',
      color: metadata?.color || '',
      talla: metadata?.talla || '',
      material: metadata?.material || '',
      categoria: metadata?.categoria || '',
      duracion: metadata?.duracion || '',
      descripcion: metadata?.descripcion || '',
      ingredientes: metadata?.ingredientes || '',
      alergenos: metadata?.alergenos || '',
      calorias: metadata?.calorias || '',
      porcion: metadata?.porcion || '',
      variaciones: metadata?.variaciones || ''
    }
  });

  // Cargar valores cuando cambia el producto
  useEffect(() => {
    if (producto) {
      const metadata = producto.metadata || {};
      
      setValue('codigo', producto.codigo || '');
      setValue('nombre', producto.nombre || '');
      setValue('precioCompra', producto.precio_compra?.toString() || '');
      setValue('precioVenta', producto.precio_venta?.toString() || '');
      setValue('stock', producto.stock?.toString() || '');
      setValue('tipo', producto.tipo || 'fisico');
      setValue('fecha_vencimiento', producto.fecha_vencimiento || '');
      
      // Cargar campos de metadata
      Object.keys(ADDITIONAL_FIELDS).forEach(fieldId => {
        if (metadata[fieldId]) {
          setValue(fieldId, metadata[fieldId]);
          // Si el campo no está en los opcionales del tipo, agregarlo a additionalFields
          const typeFields = getProductTypeFields(producto.tipo || 'fisico');
          if (!typeFields.optional.includes(fieldId)) {
            setAdditionalFields(prev => {
              if (!prev.includes(fieldId)) {
                return [...prev, fieldId];
              }
              return prev;
            });
          }
        }
      });

      // Actualizar currency inputs
      precioCompraInput.setValue(producto.precio_compra || '');
      precioVentaInput.setValue(producto.precio_venta || '');
      stockInput.setValue(producto.stock || '');
    }
  }, [producto, setValue, precioCompraInput, precioVentaInput, stockInput]);

  const handleBack = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const handleNext = () => {
    const typeFields = getProductTypeFields(selectedType);
    
    if (formStep === 1) {
      const codigo = watch('codigo');
      const nombre = watch('nombre');
      const precioVenta = watch('precioVenta');
      
      if (!codigo || !nombre || !precioVenta) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }
      
      if (typeFields.optional.length > 0) {
        setFormStep(2);
      } else if (Object.keys(ADDITIONAL_FIELDS).length > 0) {
        setFormStep(3);
      } else {
        setFormStep(4);
      }
    } else if (formStep === 2) {
      if (Object.keys(ADDITIONAL_FIELDS).length > 0) {
        setFormStep(3);
      } else {
        setFormStep(4);
      }
    } else if (formStep === 3) {
      setFormStep(4);
    }
  };

  const handleStepClick = (stepNumber) => {
    // Permitir navegar a cualquier paso
    setFormStep(stepNumber);
  };

  const handleAddAdditionalField = (fieldId) => {
    if (!additionalFields.includes(fieldId)) {
      setAdditionalFields([...additionalFields, fieldId]);
    }
  };

  const handleRemoveAdditionalField = (fieldId) => {
    setAdditionalFields(additionalFields.filter(id => id !== fieldId));
    setValue(fieldId, '');
  };

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
    if (!producto) return;
    
    setSubiendo(true);
    let imagenPath = producto.imagen;

    try {
      if (imagen && puedeSubirImagenes) {
        setComprimiendo(true);
        const imagenComprimida = await compressProductImage(imagen);
        setComprimiendo(false);

        const organizationId = userProfile?.organization_id || producto.organization_id;
        if (!organizationId) {
          throw new Error('No se encontró organization_id');
        }
        const nombreArchivo = `${organizationId}/${Date.now()}_${imagenComprimida.name}`;
        const { error: errorUpload } = await supabase.storage.from('productos').upload(nombreArchivo, imagenComprimida);
        if (errorUpload) throw errorUpload;

        // Eliminar imagen anterior si existe
        if (producto.imagen) {
          await deleteImageFromStorage(producto.imagen);
        }

        imagenPath = nombreArchivo;
      }

      const typeFields = getProductTypeFields(selectedType);
      const productoData = {
        codigo: data.codigo,
        nombre: data.nombre,
        precio_venta: Number(data.precioVenta.replace(/\D/g, '')),
        precio_compra: typeFields.required.includes('precio_compra') || data.precioCompra
          ? (Number(data.precioCompra?.replace(/\D/g, '') || '0') || 0)
          : 0,
        stock: typeFields.required.includes('stock') || data.stock
          ? (Number(data.stock?.replace(/\D/g, '') || '0') || null)
          : null,
        fecha_vencimiento: data.fecha_vencimiento || null,
        imagen: imagenPath,
        tipo: selectedType
      };

      // Agregar campos adicionales a metadata
      const newMetadata = {};
      Object.keys(ADDITIONAL_FIELDS).forEach(fieldId => {
        if (data[fieldId] && data[fieldId].trim() !== '') {
          newMetadata[fieldId] = data[fieldId];
        }
      });

      // Agregar metadata solo si tiene datos
      if (Object.keys(newMetadata).length > 0) {
        productoData.metadata = newMetadata;
      } else {
        productoData.metadata = {};
      }

      actualizarProductoMutation.mutate(
        { id: producto.id, updates: productoData },
        {
          onSuccess: () => {
            reset();
            setImagen(null);
            setAdditionalFields([]);
            precioCompraInput.reset();
            precioVentaInput.reset();
            stockInput.reset();
            onClose();
            if (onProductoEditado) onProductoEditado();
          },
          onError: (error) => {
            console.error('Error actualizando producto:', error);
            toast.error(error?.message || 'Error al actualizar el producto.');
          }
        }
      );
    } catch (err) {
      console.error('Error:', err);
      toast.error(err?.message || 'Error al actualizar el producto.');
    } finally {
      setSubiendo(false);
      setComprimiendo(false);
    }
  };

  if (!open || !producto) return null;

  const typeFields = getProductTypeFields(selectedType);
  const productType = PRODUCT_TYPES[selectedType];
  
  // Calcular labels de pasos
  const stepLabels = ['Básico'];
  if (typeFields.optional.length > 0) stepLabels.push('Opcionales');
  if (Object.keys(ADDITIONAL_FIELDS).length > 0) stepLabels.push('Adicionales');
  stepLabels.push('Imagen');

  return (
    <div className="modal-bg">
      <div className="modal-card">
        <div className="modal-header-with-back">
          <button type="button" className="back-button" onClick={onClose}>
            ← Cancelar
          </button>
          <h2>Editar {productType?.label.toLowerCase()}</h2>
        </div>
        
        {/* Indicador de pasos */}
        <div className="form-steps-indicator">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = formStep === stepNum;
            const isCompleted = formStep > stepNum;
            return (
              <div key={stepNum} className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div 
                  className="step-number" 
                  onClick={() => handleStepClick(stepNum)}
                  style={{ cursor: 'pointer' }}
                  title={`Ir a: ${label}`}
                >
                  {isCompleted ? '✓' : stepNum}
                </div>
                <span 
                  className="step-label"
                  onClick={() => handleStepClick(stepNum)}
                  style={{ cursor: 'pointer' }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        
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
              <LottieLoader size="medium" message="Actualizando producto..." />
            )}
          </div>
        ) : (
          <form className="form-producto form-producto-centro" onSubmit={handleSubmit(onSubmit)}>
            {/* Paso 1: Campos básicos */}
            {formStep === 1 && (
              <div className="form-step-content">
                <h3 className="step-title">Información Básica</h3>
                <label>Código <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  {...register('codigo')}
                  className={`input-form ${errors.codigo ? 'error' : ''}`}
                  placeholder="Ej: SKU123"
                />
                {errors.codigo && <span className="error-message">{errors.codigo.message}</span>}

                <label>Nombre <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  {...register('nombre')}
                  className={`input-form ${errors.nombre ? 'error' : ''}`}
                  placeholder="Nombre del producto"
                />
                {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}

                {/* Precios */}
                <label>Precios</label>
                <div className="input-precio-row" style={{ gap: '2.5rem', justifyContent: 'space-between' }}>
                  {(typeFields.required.includes('precio_compra') || typeFields.optional.includes('precio_compra')) && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>
                        Precio de Compra {typeFields.required.includes('precio_compra') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
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
                    <span style={{ fontWeight: 600, fontSize: '0.98rem', marginBottom: 4, textAlign: 'center' }}>
                      Precio de Venta <span style={{ color: '#ef4444' }}>*</span>
                    </span>
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

                {/* Stock si aplica */}
                {(typeFields.required.includes('stock') || typeFields.optional.includes('stock')) && (
                  <>
                    <label>
                      Stock {typeFields.required.includes('stock') && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      {...register('stock')}
                      value={stockInput.displayValue}
                      onChange={handleStockChange}
                      inputMode="numeric"
                      className={`input-form ${errors.stock ? 'error' : ''}`}
                      placeholder="Cantidad en stock"
                    />
                    {errors.stock && <span className="error-message">{errors.stock.message}</span>}
                  </>
                )}
              </div>
            )}

            {/* Paso 2: Campos opcionales del tipo */}
            {formStep === 2 && typeFields.optional.length > 0 && (
              <div className="form-step-content">
                <h3 className="step-title">Información Adicional del {productType?.label}</h3>
                <p className="step-description">Estos campos son opcionales pero pueden ser útiles</p>
                {typeFields.optional.map(fieldId => {
                  const fieldConfig = ADDITIONAL_FIELDS[fieldId];
                  if (!fieldConfig) return null;

                  return (
                    <div key={fieldId}>
                      <label>
                        {fieldConfig.label} <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span>
                      </label>
                      {fieldConfig.type === 'textarea' ? (
                        <textarea
                          {...register(fieldId)}
                          className="input-form"
                          placeholder={fieldConfig.placeholder}
                          rows={3}
                        />
                      ) : fieldConfig.type === 'select' ? (
                        <select {...register(fieldId)} className="input-form">
                          {fieldConfig.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          {...register(fieldId)}
                          type={fieldConfig.type}
                          className="input-form"
                          placeholder={fieldConfig.placeholder}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paso 3: Campos adicionales personalizables */}
            {formStep === 3 && (
              <div className="form-step-content">
                <h3 className="step-title">Campos Adicionales</h3>
                <p className="step-description">Agrega información extra si lo necesitas</p>
                
                {/* Campos adicionales agregados por el usuario */}
                {additionalFields.map(fieldId => {
                  const fieldConfig = ADDITIONAL_FIELDS[fieldId];
                  if (!fieldConfig) return null;

                  return (
                    <div key={fieldId} className="additional-field-wrapper">
                      <div className="additional-field-header">
                        <label>{fieldConfig.label}</label>
                        <button
                          type="button"
                          className="remove-field-btn"
                          onClick={() => handleRemoveAdditionalField(fieldId)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {fieldConfig.type === 'textarea' ? (
                        <textarea
                          {...register(fieldId)}
                          className="input-form"
                          placeholder={fieldConfig.placeholder}
                          rows={3}
                        />
                      ) : fieldConfig.type === 'select' ? (
                        <select {...register(fieldId)} className="input-form">
                          {fieldConfig.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          {...register(fieldId)}
                          type={fieldConfig.type}
                          className="input-form"
                          placeholder={fieldConfig.placeholder}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Botón para agregar campos adicionales */}
                <div className="add-fields-section">
                  <label>Agregar campos adicionales</label>
                  <div className="add-fields-grid">
                    {Object.keys(ADDITIONAL_FIELDS)
                      .filter(fieldId => !typeFields.optional.includes(fieldId) && !additionalFields.includes(fieldId))
                      .map(fieldId => {
                        const fieldConfig = ADDITIONAL_FIELDS[fieldId];
                        return (
                          <button
                            key={fieldId}
                            type="button"
                            className="add-field-btn"
                            onClick={() => handleAddAdditionalField(fieldId)}
                          >
                            <Plus size={16} />
                            {fieldConfig.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Imagen */}
            {formStep === 4 && (
              <div className="form-step-content">
                <h3 className="step-title">Imagen del Producto</h3>
                <p className="step-description">Cambia la imagen del producto si lo deseas</p>
                <label>
                  Imagen <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span>
                  {!puedeSubirImagenes && <span style={{ color: '#ef4444', fontWeight: 600 }}> 🔒 Solo plan Profesional</span>}
                </label>
                <div className="input-upload-wrapper input-upload-centro">
                  <button
                    type="button"
                    className="input-upload-btn"
                    onClick={puedeSubirImagenes ? handleClickUpload : () => toast.error('Actualiza al plan Profesional para subir imágenes')}
                    disabled={!puedeSubirImagenes}
                    style={!puedeSubirImagenes ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="4" y="16" width="16" height="4" rx="2" fill="#2563eb" fillOpacity=".08" />
                    </svg>
                    {imagen ? imagen.name : producto?.imagen ? 'Cambiar imagen' : puedeSubirImagenes ? 'Seleccionar imagen' : '🔒 Bloqueado'}
                  </button>
                  <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display: 'none' }} disabled={!puedeSubirImagenes} />
                </div>

                {imagen && (
                  <div className="image-preview">
                    <img src={URL.createObjectURL(imagen)} alt="Preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => setImagen(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {producto?.imagen && !imagen && (
                  <div className="image-preview" style={{ marginTop: '1rem' }}>
                    <OptimizedProductImage
                      imagePath={producto.imagen}
                      alt="Imagen actual"
                      className=""
                    />
                    <span style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>Imagen actual</span>
                  </div>
                )}
              </div>
            )}

            {/* Botones de navegación */}
            <div className="form-actions form-actions-centro">
              <button type="button" className="inventario-btn inventario-btn-secondary" onClick={onClose} disabled={subiendo}>
                Cancelar
              </button>
              {formStep > 1 && (
                <button type="button" className="inventario-btn inventario-btn-outline" onClick={handleBack} disabled={subiendo}>
                  ← Atrás
                </button>
              )}
              {formStep < 4 ? (
                <button type="button" className="inventario-btn inventario-btn-primary" onClick={handleNext}>
                  Siguiente →
                </button>
              ) : (
                <button type="submit" className="inventario-btn inventario-btn-primary" disabled={subiendo || isSubmitting}>
                  {subiendo ? (comprimiendo ? '🗜️ Comprimiendo...' : 'Actualizando...') : 'Actualizar Producto'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditarProductoModalV2;
