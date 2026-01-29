import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Package, Scissors, UtensilsCrossed, Scale, ChevronRight, Plus, X } from 'lucide-react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import toast from 'react-hot-toast';
import { PRODUCT_TYPES, ADDITIONAL_FIELDS, getProductTypeFields } from '../../utils/productTypes';
import { getBusinessTypeConfig, getDefaultProductType, getAvailableProductTypes, shouldSkipProductTypeSelector } from '../../constants/businessTypes';
import { generateStoragePath, validateFilename } from '../../utils/fileUtils';
import VariacionesConfig from '../VariacionesConfig';
import ProductosVinculados from '../ProductosVinculados';
import './AgregarProductoModalV2.css';

// Función para crear esquema de validación dinámico
const createProductSchema = (productType, defaultPermiteToppings = true) => {
  const baseSchema = {
    codigo: z.string().min(1, 'El código es requerido').max(50, 'El código es muy largo'),
    nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
    precioVenta: z.string().min(1, 'El precio de venta es requerido'),
    tipo: z.enum(['fisico', 'servicio', 'comida', 'accesorio']),
    imagen: z.any().optional(),
  };

  const typeFields = getProductTypeFields(productType);
  
  // Agregar campos requeridos
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

  // Campos opcionales siempre opcionales
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
  baseSchema.permite_toppings = z.boolean().optional().default(defaultPermiteToppings);

  return z.object(baseSchema).superRefine((data, ctx) => {
    const precioCompra = data.precioCompra ? parseFloat(data.precioCompra.replace(/[^\d]/g, '')) : 0;
    const precioVenta = parseFloat(data.precioVenta.replace(/[^\d]/g, ''));

    // Validar precio de compra si es requerido
    if (typeFields.required.includes('precio_compra') && (!data.precioCompra || data.precioCompra.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El precio de compra es requerido",
        path: ["precioCompra"]
      });
    }

    // Validar stock si es requerido
    if (typeFields.required.includes('stock') && (!data.stock || data.stock.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El stock es requerido",
        path: ["stock"]
      });
    }

    // Validar precio de venta >= compra (solo si hay precio compra)
    if (data.precioCompra && !isNaN(precioCompra) && !isNaN(precioVenta) && precioVenta < precioCompra) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El precio de venta debe ser mayor o igual al precio de compra",
        path: ["precioVenta"]
      });
    }
  });
};

const AgregarProductoModalV2 = ({ open, onClose, onProductoAgregado, moneda }) => {
  const { user, userProfile, organization } = useAuth();
  const { hasFeature, canPerformAction } = useSubscription();
  
  // Obtener configuración del tipo de negocio
  const businessTypeConfig = organization?.business_type 
    ? getBusinessTypeConfig(organization.business_type) 
    : null;
  
  // Determinar si debe saltarse el selector de tipo
  const skipTypeSelector = shouldSkipProductTypeSelector(organization?.business_type);
  
  // Tipo de producto por defecto basado en tipo de negocio
  const defaultProductType = businessTypeConfig 
    ? getDefaultProductType(organization.business_type) 
    : null;
  
  // Tipos de producto disponibles según el tipo de negocio
  const availableProductTypes = businessTypeConfig 
    ? getAvailableProductTypes(organization.business_type) 
    : Object.keys(PRODUCT_TYPES);
  
  const [step, setStep] = useState(skipTypeSelector ? 'basic' : 'selectType'); // 'selectType' | 'basic' | 'optional' | 'additional' | 'image'
  const [formStep, setFormStep] = useState(1); // 1: básico + imagen, 2: opcionales del tipo, 3: adicionales
  const [selectedType, setSelectedType] = useState(skipTypeSelector ? defaultProductType : null);
  const [imagen, setImagen] = useState(null);
  const [imagenUrl, setImagenUrl] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [additionalFields, setAdditionalFields] = useState([]);
  const [variacionesConfig, setVariacionesConfig] = useState([]);
  const [productosVinculados, setProductosVinculados] = useState([]);
  const [variantesProducto, setVariantesProducto] = useState([]);
  const fileInputRef = useRef();
  const codigoInputRef = useRef(null);

  const puedeSubirImagenes = hasFeature('productImages');
  
  // Efecto para establecer el tipo por defecto cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Siempre resetear al paso 1 cuando se abre el modal
      setFormStep(1);
      setVariacionesConfig([]);
      setProductosVinculados([]);
      setVariantesProducto([]);
      setImagen(null);
      setImagenUrl('');
      
      if (skipTypeSelector && defaultProductType) {
        setSelectedType(defaultProductType);
        setStep('basic');
      } else if (!skipTypeSelector) {
        // Si no debe saltarse, resetear
        setSelectedType(null);
        setStep('selectType');
      }
    }
  }, [open, skipTypeSelector, defaultProductType]);

  // Currency inputs
  const precioCompraInput = useCurrencyInput();
  const precioVentaInput = useCurrencyInput();
  const stockInput = useCurrencyInput();

  // React Query mutation
  const agregarProductoMutation = useAgregarProducto();

  const defaultPermiteToppings = organization?.business_type === 'food';

  // Crear esquema dinámico
  const productSchema = selectedType
    ? createProductSchema(selectedType, defaultPermiteToppings)
    : z.object({});

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    clearErrors
  } = useForm({
    resolver: selectedType ? zodResolver(productSchema) : undefined,
    defaultValues: {
      codigo: '',
      nombre: '',
      precioCompra: '',
      precioVenta: '',
      stock: '',
      tipo: selectedType || 'fisico',
      fecha_vencimiento: '',
      peso: '',
      unidad_peso: 'kg',
      dimensiones: '',
      marca: '',
      modelo: '',
      color: '',
      talla: '',
      material: '',
      categoria: '',
      duracion: '',
      descripcion: '',
      ingredientes: '',
      alergenos: '',
      calorias: '',
      porcion: '',
      variaciones: '',
      permite_toppings: defaultPermiteToppings
    }
  });

  // Resetear cuando cambia el tipo
  useEffect(() => {
    if (selectedType) {
      setValue('tipo', selectedType);
      const typeFields = getProductTypeFields(selectedType);
      
      // Limpiar campos que no aplican
      if (!typeFields.required.includes('precio_compra') && !typeFields.optional.includes('precio_compra')) {
        setValue('precioCompra', '');
        precioCompraInput.reset();
      }
      if (!typeFields.required.includes('stock') && !typeFields.optional.includes('stock')) {
        setValue('stock', '');
        stockInput.reset();
      }
    }
  }, [selectedType, setValue, precioCompraInput, stockInput]);

  useEffect(() => {
    if (variantesProducto.length > 0) {
      setValue('stock', '0', { shouldValidate: true });
      stockInput.setValue('0');
      clearErrors('stock');
    }
  }, [variantesProducto.length, setValue, stockInput, clearErrors]);

  // Handler para cuando se escanea un código de barras en el campo código
  const handleBarcodeScanned = useCallback((barcode) => {
    setValue('codigo', barcode, { shouldValidate: true });
    if (codigoInputRef.current) {
      codigoInputRef.current.value = barcode;
      codigoInputRef.current.focus();
    }
  }, [setValue]);

  const agregarVariante = () => {
    setVariantesProducto(prev => ([
      ...prev,
      { nombre: '', codigo: '', stock: 0 }
    ]));
  };

  const actualizarVariante = (index, campo, valor) => {
    setVariantesProducto(prev => prev.map((vari, idx) => (
      idx === index ? { ...vari, [campo]: valor } : vari
    )));
  };

  const eliminarVariante = (index) => {
    setVariantesProducto(prev => prev.filter((_, idx) => idx !== index));
  };

  // Hook para lector de códigos de barras en el campo código
  const { 
    inputRef: barcodeInputRef, 
    handleKeyDown: handleBarcodeKeyDown, 
    handleInputChange: handleBarcodeInputChange 
  } = useBarcodeScanner(handleBarcodeScanned, {
    minLength: 3,
    maxTimeBetweenChars: 50,
    autoSubmit: true,
    clearInput: false // No limpiar el input después de escanear
  });

  // Refs para detección global de código de barras (funciona aunque el cursor no esté en el campo código)
  const globalBarcodeBufferRef = useRef('');
  const globalLastCharTimeRef = useRef(null);
  const globalBarcodeTimeoutRef = useRef(null);
  const globalBarcodeProcessingRef = useRef(false);

  // Listener global para detectar códigos de barras cuando el modal está abierto
  useEffect(() => {
    // Solo activar si el modal está abierto
    if (!open) {
      return;
    }

    const handleGlobalKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un input, textarea o contenteditable
      const target = e.target;
      const isInputElement = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable ||
                            target.closest('input') ||
                            target.closest('textarea');
      
      // Si está en el input del código, dejar que el hook normal lo maneje
      if (target === codigoInputRef.current || target === barcodeInputRef?.current) {
        return;
      }
      
      // Si está en otro input, no procesar como código de barras
      if (isInputElement) {
        return;
      }
      
      // Si es Enter o Tab, podría ser el final del código de barras
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        
        const barcode = globalBarcodeBufferRef.current.trim();
        if (barcode.length >= 3 && !globalBarcodeProcessingRef.current) {
          globalBarcodeProcessingRef.current = true;
          handleBarcodeScanned(barcode);
          
          // Limpiar buffer
          globalBarcodeBufferRef.current = '';
          globalLastCharTimeRef.current = null;
          
          // Resetear flag después de un delay
          setTimeout(() => {
            globalBarcodeProcessingRef.current = false;
          }, 500);
        }
        return;
      }
      
      // Si es un carácter imprimible
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const now = Date.now();
        
        // Si pasó mucho tiempo desde el último carácter, resetear buffer (usuario escribiendo manualmente)
        if (globalLastCharTimeRef.current && (now - globalLastCharTimeRef.current) > 100) {
          globalBarcodeBufferRef.current = '';
        }
        
        // Agregar carácter al buffer
        globalBarcodeBufferRef.current += e.key;
        globalLastCharTimeRef.current = now;
        
        // Limpiar timeout anterior
        if (globalBarcodeTimeoutRef.current) {
          clearTimeout(globalBarcodeTimeoutRef.current);
        }
        
        // Si después de un tiempo no hay más caracteres, procesar como código de barras
        // Reducido a 80ms para detección más rápida (los escáneres suelen ser < 50ms entre caracteres)
        globalBarcodeTimeoutRef.current = setTimeout(() => {
          const barcode = globalBarcodeBufferRef.current.trim();
          if (barcode.length >= 3 && !globalBarcodeProcessingRef.current) {
            globalBarcodeProcessingRef.current = true;
            handleBarcodeScanned(barcode);
            
            // Limpiar buffer
            globalBarcodeBufferRef.current = '';
            globalLastCharTimeRef.current = null;
            
            // Resetear flag después de un delay
            setTimeout(() => {
              globalBarcodeProcessingRef.current = false;
            }, 300);
          }
        }, 80);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (globalBarcodeTimeoutRef.current) {
        clearTimeout(globalBarcodeTimeoutRef.current);
      }
      // Limpiar buffer cuando se cierre el modal
      globalBarcodeBufferRef.current = '';
      globalLastCharTimeRef.current = null;
      globalBarcodeProcessingRef.current = false;
    };
  }, [open, handleBarcodeScanned, barcodeInputRef]);

  if (!open) return null;

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setStep('basic');
    setFormStep(1);
    setValue('tipo', typeId);
  };

  const handleBack = () => {
    if (formStep === 1) {
      if (skipTypeSelector) {
        // Si se salta el selector, cerrar el modal
        onClose();
      } else {
        setStep('selectType');
        setSelectedType(null);
        reset();
        setImagen(null);
        setImagenUrl('');
        setAdditionalFields([]);
      }
    } else {
      setFormStep(formStep - 1);
    }
  };

  const handleNext = (e) => {
    // Prevenir el submit del formulario
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validar paso actual antes de avanzar
    if (formStep === 1) {
      // Validar campos básicos
      const codigo = watch('codigo');
      const nombre = watch('nombre');
      const precioVenta = watch('precioVenta');
      
      if (!codigo || !nombre || !precioVenta) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }
      
      // Ir a paso 2 (opciones/variantes)
      setFormStep(2);
    } else if (formStep === 2) {
      // De opcionales del tipo a adicionales
      if (Object.keys(ADDITIONAL_FIELDS).length > 0) {
        setFormStep(3);
      } else {
        // Si no hay más pasos, no hacer nada (el botón cambiará a "Agregar Producto")
        return;
      }
    } else if (formStep === 3) {
      // Ya estamos en el último paso, no hacer nada (el botón cambiará a "Agregar Producto")
      return;
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
      setImagenUrl('');
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const getTypeIcon = (typeId) => {
    const icons = {
      fisico: Package,
      servicio: Scissors,
      comida: UtensilsCrossed,
      accesorio: Scale
    };
    return icons[typeId] || Package;
  };

  const onSubmit = async (data) => {
    // Verificar límite de productos antes de crear
    const canCreate = await canPerformAction('createProduct');
    if (!canCreate.allowed) {
      toast.error(canCreate.reason || 'No puedes crear más productos. Actualiza tu plan.');
      return;
    }

    setSubiendo(true);
    let imagenPath = null;

    try {
      // Validar que organization_id esté presente (requerido por RLS) - ANTES de cualquier operación
      const organizationId = userProfile?.organization_id;
      if (!organizationId) {
        throw new Error('No se encontró organization_id. Por favor, verifica que tu perfil esté correctamente configurado.');
      }

      if (imagen && puedeSubirImagenes) {
        // Validar el nombre del archivo antes de comprimir
        const validation = validateFilename(imagen.name);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        setComprimiendo(true);
        const imagenComprimida = await compressProductImage(imagen);
        setComprimiendo(false);

        const nombreArchivo = generateStoragePath(organizationId, imagenComprimida.name);
        const { error: errorUpload } = await supabase.storage.from('productos').upload(nombreArchivo, imagenComprimida);
        if (errorUpload) throw errorUpload;
        imagenPath = nombreArchivo;
      } else if (imagenUrl && imagenUrl.trim() !== '') {
        imagenPath = imagenUrl.trim();
      }

      const typeFields = getProductTypeFields(selectedType);
      
      const tieneVariantes = variantesProducto.length > 0;

      // Campos que existen en la tabla productos
      const productoData = {
        user_id: user?.id,
        organization_id: organizationId, // Usar la variable validada
        codigo: data.codigo,
        nombre: data.nombre,
        precio_venta: Number(data.precioVenta.replace(/\D/g, '')),
        precio_compra: typeFields.required.includes('precio_compra') || data.precioCompra
          ? (Number(data.precioCompra?.replace(/\D/g, '') || '0') || 0)
          : 0,
        stock: tieneVariantes
          ? 0
          : (typeFields.required.includes('stock') || data.stock
            ? (Number(data.stock?.replace(/\D/g, '') || '0') || null)
            : null),
        fecha_vencimiento: data.fecha_vencimiento || null,
        imagen: imagenPath,
        tipo: selectedType
      };

      // Campos adicionales que se guardarán en metadata (JSON)
      const metadata = {};
      if (data.peso) metadata.peso = data.peso;
      if (data.unidad_peso) metadata.unidad_peso = data.unidad_peso;
      if (data.dimensiones) metadata.dimensiones = data.dimensiones;
      if (data.marca) metadata.marca = data.marca;
      if (data.modelo) metadata.modelo = data.modelo;
      if (data.color) metadata.color = data.color;
      if (data.talla) metadata.talla = data.talla;
      if (data.material) metadata.material = data.material;
      if (data.categoria) metadata.categoria = data.categoria;
      if (data.duracion) metadata.duracion = data.duracion;
      if (data.descripcion) metadata.descripcion = data.descripcion;
      if (data.ingredientes) metadata.ingredientes = data.ingredientes;
      if (data.alergenos) metadata.alergenos = data.alergenos;
      if (data.calorias) metadata.calorias = data.calorias;
      if (data.porcion) metadata.porcion = data.porcion;
      if (data.variaciones) metadata.variaciones = data.variaciones;
      
      // Agregar permite_toppings al metadata
      metadata.permite_toppings = data.permite_toppings !== undefined
        ? data.permite_toppings
        : defaultPermiteToppings;
      
      // Agregar variaciones_config si hay variaciones configuradas
      if (variacionesConfig && variacionesConfig.length > 0) {
        metadata.variaciones_config = variacionesConfig;
      }
      
      // Agregar productos_vinculados si hay productos vinculados
      if (productosVinculados && productosVinculados.length > 0) {
        metadata.productos_vinculados = productosVinculados;
      }

      // Agregar metadata solo si tiene datos
      if (Object.keys(metadata).length > 0) {
        productoData.metadata = metadata;
      }

      const productoCreado = await agregarProductoMutation.mutateAsync(productoData);

      if (tieneVariantes) {
        const variantesLimpias = variantesProducto.map(vari => ({
          organization_id: organizationId,
          producto_id: productoCreado.id,
          nombre: (vari.nombre || '').trim(),
          codigo: (vari.codigo || '').trim() || null,
          stock: vari.stock === '' || vari.stock === null || vari.stock === undefined ? 0 : Number(vari.stock)
        }));

        const invalidas = variantesLimpias.some(v => !v.nombre);
        if (invalidas) {
          toast.error('Todas las variantes deben tener nombre');
          setSubiendo(false);
          return;
        }

        const { error: variantesError } = await supabase
          .from('product_variants')
          .insert(variantesLimpias);

        if (variantesError) {
          console.error('Error guardando variantes:', variantesError);
          toast.error('El producto se creó, pero no se pudieron guardar las variantes.');
        }
      }

      reset();
      setImagen(null);
      setImagenUrl('');
      // Resetear al tipo por defecto si aplica, o a null si debe mostrar selector
      if (skipTypeSelector && defaultProductType) {
        setSelectedType(defaultProductType);
        setStep('basic');
      } else {
        setSelectedType(null);
        setStep('selectType');
      }
      // Siempre resetear al paso 1
      setFormStep(1);
      setAdditionalFields([]);
      setVariacionesConfig([]);
      setProductosVinculados([]);
      setVariantesProducto([]);
      precioCompraInput.reset();
      precioVentaInput.reset();
      stockInput.reset();
      onClose();
      if (onProductoAgregado) onProductoAgregado();
    } catch (err) {
      console.error('Error:', err);
      toast.error(err?.message || 'Error al guardar el producto.');
    } finally {
      setSubiendo(false);
      setComprimiendo(false);
    }
  };

  // Renderizar selector de tipo
  if (step === 'selectType') {
    return (
      <div className="modal-bg">
        <div className="modal-card type-selector-modal">
          <h2>¿Qué tipo de producto quieres crear?</h2>
          <p className="type-selector-description">
            Selecciona el tipo de producto para mostrar los campos adecuados
          </p>
          <div className="type-selector-grid">
            {Object.values(PRODUCT_TYPES)
              .filter(type => availableProductTypes.includes(type.id))
              .map((type) => {
                const Icon = getTypeIcon(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    className="type-selector-card"
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <div className="type-selector-icon">
                      <span className="type-emoji">{type.icon}</span>
                      <Icon size={24} className="type-icon" />
                    </div>
                    <h3>{type.label}</h3>
                    <p>{type.description}</p>
                    <ChevronRight size={20} className="type-arrow" />
                  </button>
                );
              })}
          </div>
          <div className="form-actions form-actions-centro">
            <button type="button" className="inventario-btn inventario-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar formulario
  const typeFields = selectedType ? getProductTypeFields(selectedType) : { required: [], optional: [] };
  const productType = PRODUCT_TYPES[selectedType];
  
  // Calcular labels de pasos (ahora solo 3 pasos: básico+imagen, opcionales, adicionales)
  const stepLabels = ['Básico + Imagen'];
  stepLabels.push('Opciones y variantes');
  if (Object.keys(ADDITIONAL_FIELDS).length > 0) stepLabels.push('Adicionales');

  return (
    <div className="modal-bg">
      <div className="modal-card">
        <div className="modal-header-with-back">
          <button type="button" className="back-button" onClick={handleBack}>
            ← {formStep === 1 ? (skipTypeSelector ? 'Cancelar' : 'Volver') : 'Atrás'}
          </button>
          <div>
            <h2>Agregar {productType?.label.toLowerCase()}</h2>
            {skipTypeSelector && businessTypeConfig && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Tipo inferido de: <strong>{businessTypeConfig.label}</strong>
              </p>
            )}
          </div>
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
              <LottieLoader size="medium" message="Subiendo producto..." />
            )}
          </div>
        ) : (
          <form className="form-producto form-producto-centro" onSubmit={handleSubmit(onSubmit)}>
            {/* Paso 1: Campos básicos + Imagen */}
            {formStep === 1 && (
              <div className="form-step-content">
                <h3 className="step-title">Información Básica e Imagen</h3>
                <label>Código <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              {...register('codigo', {
                onChange: (e) => {
                  codigoInputRef.current = e.target;
                  handleBarcodeInputChange(e);
                }
              })}
              ref={(e) => {
                codigoInputRef.current = e;
                if (barcodeInputRef) {
                  barcodeInputRef.current = e;
                }
              }}
              onKeyDown={handleBarcodeKeyDown}
              className={`input-form ${errors.codigo ? 'error' : ''}`}
              placeholder="Ej: SKU123"
            />
            {errors.codigo && <span className="error-message">{errors.codigo.message}</span>}

            <label>Nombre</label>
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
                  disabled={variantesProducto.length > 0}
                />
                {errors.stock && <span className="error-message">{errors.stock.message}</span>}
                {variantesProducto.length > 0 && (
                  <span className="error-message" style={{ color: '#6b7280' }}>
                    El stock general se calcula con la sumatoria de variantes.
                  </span>
                )}
              </>
            )}

            {/* Checkbox para permitir toppings */}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="permite_toppings"
                {...register('permite_toppings')}
                defaultChecked={defaultPermiteToppings}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="permite_toppings" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.95rem' }}>
                Permitir agregar toppings/adicionales a este producto
              </label>
            </div>

            {/* Imagen del producto (ahora en el paso 1) */}
            <div style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
              <h3 className="step-title" style={{ marginBottom: '0.5rem' }}>Imagen del Producto</h3>
              <p className="step-description" style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Agrega una imagen para identificar mejor tu producto (Opcional)
              </p>
              <label>
                Imagen <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span>
                {!puedeSubirImagenes && <span style={{ color: '#ef4444', fontWeight: 600 }}> 🔒 Solo plan Estándar</span>}
              </label>
              <div className="input-upload-wrapper input-upload-centro" style={{ marginBottom: '1rem' }}>
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
                  {imagen ? imagen.name : puedeSubirImagenes ? 'Seleccionar imagen' : '🔒 Bloqueado'}
                </button>
                <input type="file" accept="image/*" onChange={handleImagenChange} ref={fileInputRef} style={{ display: 'none' }} disabled={!puedeSubirImagenes} />
              </div>

              <label style={{ marginTop: '0.5rem' }}>
                URL de imagen <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span>
              </label>
              <input
                className="input-form"
                placeholder="https://..."
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
                disabled={Boolean(imagen)}
              />
              <p className="step-description" style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                Si pegas una URL, se usará esa imagen sin subir archivo.
              </p>

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

              {!imagen && imagenUrl && (
                <div className="image-preview">
                  <img src={imagenUrl} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => setImagenUrl('')}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            </div>
            )}

            {/* Paso 2: Opciones, variaciones y variantes */}
            {formStep === 2 && (
              <div className="form-step-content">
                <h3 className="step-title">Opciones y Variantes</h3>
                <p className="step-description">Configura variaciones del cliente y variantes con stock.</p>
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
              
              {/* Configuración de variaciones */}
              <VariacionesConfig
                variaciones={variacionesConfig}
                onChange={setVariacionesConfig}
              />

              {/* Variantes con stock y código */}
              <div style={{ marginTop: '1rem' }}>
                <h3 className="step-title" style={{ fontSize: '1.1rem' }}>Variantes con stock (color, talla, presentación...)</h3>
                <p className="step-description">Cada variante puede tener su propio stock y código de barras.</p>

                {variantesProducto.length === 0 && (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    No hay variantes registradas.
                  </p>
                )}

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {variantesProducto.map((vari, index) => (
                    <div key={`variante-${index}`} style={{ display: 'grid', gap: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label>Nombre (color/tono)</label>
                        <input
                          className="input-form"
                          value={vari.nombre || ''}
                          onChange={(e) => actualizarVariante(index, 'nombre', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label>Código de barras (opcional)</label>
                        <input
                          className="input-form"
                          value={vari.codigo || ''}
                          onChange={(e) => actualizarVariante(index, 'codigo', e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label>Stock</label>
                        <input
                          className="input-form"
                          inputMode="numeric"
                          value={vari.stock ?? 0}
                          onChange={(e) => actualizarVariante(index, 'stock', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="inventario-btn inventario-btn-outline eliminar"
                        onClick={() => eliminarVariante(index)}
                      >
                        Eliminar variante
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="inventario-btn inventario-btn-secondary"
                  style={{ marginTop: '0.75rem' }}
                  onClick={agregarVariante}
                >
                  + Agregar variante
                </button>
              </div>
              
              {/* Productos vinculados */}
              <ProductosVinculados
                productosVinculados={productosVinculados}
                onChange={setProductosVinculados}
                organizationId={organization?.id}
              />
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


            {/* Botones de navegación */}
            <div className="form-actions form-actions-centro">
              <button type="button" className="inventario-btn inventario-btn-secondary" onClick={onClose} disabled={subiendo}>
                Cancelar
              </button>
              {(() => {
                const hasStep2 = true;
                const hasStep3 = Object.keys(ADDITIONAL_FIELDS).length > 0;
                const isLastStep = (formStep === 1 && !hasStep2 && !hasStep3) ||
                                  (formStep === 2 && !hasStep3) ||
                                  formStep === 3;
                
                if (isLastStep) {
                  return (
                    <button type="submit" className="inventario-btn inventario-btn-primary" disabled={subiendo || isSubmitting}>
                      {subiendo ? (comprimiendo ? '🗜️ Comprimiendo...' : 'Subiendo...') : 'Agregar Producto'}
                    </button>
                  );
                } else {
                  return (
                    <button type="button" className="inventario-btn inventario-btn-primary" onClick={handleNext}>
                      Siguiente →
                    </button>
                  );
                }
              })()}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AgregarProductoModalV2;
