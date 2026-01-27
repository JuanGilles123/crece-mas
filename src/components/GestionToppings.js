// 🍔 Componente para gestionar toppings
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, Package, Upload } from 'lucide-react';
import { useToppings, useCrearTopping, useActualizarTopping, useEliminarTopping } from '../hooks/useToppings';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import FeatureGuard from './FeatureGuard';
import { canUseToppings } from '../utils/toppingsUtils';
import { getCategoriaOptions } from '../constants/toppingCategories';
import { supabase } from '../services/api/supabaseClient';
import { compressProductImage } from '../services/storage/imageCompression';
import OptimizedProductImage from './business/OptimizedProductImage';
import toast from 'react-hot-toast';
import './GestionToppings.css';

// Formato de moneda
const formatCOP = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
};

// Función para formatear número con separadores de miles
const formatNumber = (value) => {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString().replace(/\D/g, '');
  if (!num) return '';
  return parseInt(num).toLocaleString('es-CO');
};

// Función para obtener valor numérico de un string formateado
const getNumericValue = (value) => {
  if (!value) return 0;
  const num = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString().replace(/\D/g, '');
  return parseInt(num) || 0;
};

// Modal para crear/editar topping
const ToppingModal = ({ open, onClose, topping, onSave, organizationId, isServiceBusiness }) => {
  const { hasFeature } = useSubscription();
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [precioDisplay, setPrecioDisplay] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioCompraDisplay, setPrecioCompraDisplay] = useState('');
  const [stock, setStock] = useState('');
  const [stockDisplay, setStockDisplay] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenAEliminar, setImagenAEliminar] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [categoria, setCategoria] = useState('general');
  const fileInputRef = React.useRef();
  const puedeSubirImagenes = hasFeature('productImages');

  React.useEffect(() => {
    if (topping) {
      setNombre(topping.nombre || '');
      setPrecio(topping.precio?.toString() || '');
      setPrecioDisplay(formatNumber(topping.precio?.toString() || ''));
      setPrecioCompra(topping.precio_compra?.toString() || '');
      setPrecioCompraDisplay(formatNumber(topping.precio_compra?.toString() || ''));
      setStock(topping.stock !== null ? topping.stock.toString() : '');
      setStockDisplay(topping.stock !== null ? formatNumber(topping.stock.toString()) : '');
      setCategoria(topping.categoria || 'general');
      setImagenPreview(topping.imagen_url || null);
      setImagen(null);
      setImagenAEliminar(null);
    } else {
      setNombre('');
      setPrecio('');
      setPrecioDisplay('');
      setPrecioCompra('');
      setPrecioCompraDisplay('');
      setStock('');
      setStockDisplay('');
      setCategoria('general');
      setImagen(null);
      setImagenPreview(null);
      setImagenAEliminar(null);
    }
  }, [topping, open]);

  const handlePrecioChange = (e) => {
    const value = e.target.value;
    const numeric = getNumericValue(value);
    setPrecio(numeric.toString());
    setPrecioDisplay(formatNumber(numeric.toString()));
  };

  const handlePrecioCompraChange = (e) => {
    const value = e.target.value;
    const numeric = getNumericValue(value);
    setPrecioCompra(numeric.toString());
    setPrecioCompraDisplay(formatNumber(numeric.toString()));
  };

  const handleStockChange = (e) => {
    const value = e.target.value;
    const numeric = getNumericValue(value);
    setStock(numeric.toString());
    setStockDisplay(formatNumber(numeric.toString()));
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      // Si había una imagen guardada y se está cambiando, marcar la anterior para eliminación
      if (topping?.imagen_url && !imagenAEliminar) {
        setImagenAEliminar(true);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    const precioNum = getNumericValue(precio);
    const stockNum = stock ? getNumericValue(stock) : null;

    if (precioNum < 0) {
      toast.error('El precio no puede ser negativo');
      return;
    }
    if (!isServiceBusiness && (stockNum === null || stockNum < 0)) {
      toast.error('El stock es requerido y no puede ser negativo');
      return;
    }

    let imagenPath = null;

    // Si se marcó para eliminar, eliminar del storage
    if (imagenAEliminar && topping?.imagen_url) {
      try {
        const { error } = await supabase.storage.from('productos').remove([topping.imagen_url]);
        if (error) {
          console.error('Error eliminando imagen anterior:', error);
          // No bloquear el guardado si falla la eliminación
        } else {
          console.log('✅ Imagen anterior eliminada del storage');
        }
      } catch (error) {
        console.error('Error eliminando imagen:', error);
        // No bloquear el guardado si falla la eliminación
      }
    }

    // Si hay nueva imagen y tiene permiso, subirla con compresión
    if (imagen && puedeSubirImagenes && organizationId) {
      try {
        setComprimiendo(true);
        // Aplicar la misma compresión que se usa en productos
        const imagenComprimida = await compressProductImage(imagen);
        setComprimiendo(false);

        // Limpiar el nombre del archivo (remover caracteres especiales)
        const nombreLimpio = imagenComprimida.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const nombreArchivo = `toppings/${organizationId}/${Date.now()}_${nombreLimpio}`;

        const { error: errorUpload } = await supabase.storage
          .from('productos')
          .upload(nombreArchivo, imagenComprimida, {
            cacheControl: '3600',
            upsert: false
          });

        if (errorUpload) {
          console.error('Error subiendo imagen de topping:', errorUpload);
          toast.error(`Error al subir la imagen: ${errorUpload.message || 'Error desconocido'}`);
          setComprimiendo(false);
          return;
        }

        console.log('✅ Imagen de topping subida exitosamente:', nombreArchivo);

        // Eliminar imagen anterior si existe y no se había marcado para eliminar antes
        if (topping?.imagen_url && !imagenAEliminar) {
          const { error: errorRemove } = await supabase.storage.from('productos').remove([topping.imagen_url]);
          if (errorRemove) {
            console.error('Error eliminando imagen anterior:', errorRemove);
            // No bloquear el guardado si falla la eliminación
          }
        }

        imagenPath = nombreArchivo;
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        toast.error('Error al procesar la imagen');
        setComprimiendo(false);
        return;
      }
    } else if (!imagenAEliminar && topping?.imagen_url) {
      // Si no hay nueva imagen y no se marcó para eliminar, mantener la imagen actual
      imagenPath = topping.imagen_url;
    }

    const precioCompraNum = getNumericValue(precioCompra);

    onSave({
      nombre: nombre.trim(),
      precio: precioNum,
      precio_compra: precioCompraNum,
      stock: isServiceBusiness ? null : stockNum,
      imagen_url: imagenPath,
      tipo: isServiceBusiness ? 'servicio' : 'comida',
      categoria: categoria || 'general'
    });
  };

  if (!open) return null;

  return (
    <div className="topping-modal-overlay" onClick={onClose}>
      <motion.div
        className="topping-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="topping-modal-header">
          <h2>{topping ? (isServiceBusiness ? 'Editar Servicio Adicional' : 'Editar Topping') : (isServiceBusiness ? 'Nuevo Servicio Adicional' : 'Nuevo Topping')}</h2>
          <button className="topping-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="topping-modal-form">
          <div className="topping-form-group">
            <label>Nombre del {isServiceBusiness ? 'Adicional' : 'Topping'} *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={isServiceBusiness ? "Ej: Barba, Cejas, Mascarilla..." : "Ej: Queso, Tocino, Lechuga..."}
              required
            />
          </div>

          <div className="topping-form-group">
            <label>Precio de Venta (COP) *</label>
            <input
              type="text"
              value={precioDisplay}
              onChange={handlePrecioChange}
              placeholder="0"
              inputMode="numeric"
              required
            />
          </div>

          <div className="topping-form-group">
            <label>Precio de Compra (COP)</label>
            <input
              type="text"
              value={precioCompraDisplay}
              onChange={handlePrecioCompraChange}
              placeholder="0"
              inputMode="numeric"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Precio al que compras este topping para calcular la ganancia
            </small>
          </div>

          <div className="topping-form-group">
            <label>Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="topping-categoria-select"
            >
              {getCategoriaOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Organiza tus toppings por categorías (salsas, adiciones, etc.)
            </small>
          </div>

          {!isServiceBusiness && (
            <div className="topping-form-group">
              <label>Stock Inicial *</label>
              <input
                type="text"
                value={stockDisplay}
                onChange={handleStockChange}
                placeholder="0"
                inputMode="numeric"
                required
              />
            </div>
          )}

          {puedeSubirImagenes && (
            <div className="topping-form-group">
              <label>Imagen <span style={{ color: '#6b7280', fontWeight: 400 }}>(Opcional)</span></label>
              <div className="topping-image-upload">
                {imagenPreview ? (
                  <div className="topping-image-preview">
                    <img src={imagenPreview} alt="Preview" />
                    <button
                      type="button"
                      className="topping-remove-image"
                      onClick={async () => {
                        // Si hay una imagen guardada, marcarla para eliminación
                        if (topping?.imagen_url && imagenPreview === topping.imagen_url) {
                          setImagenAEliminar(true);
                        }
                        setImagen(null);
                        setImagenPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      title="Eliminar imagen"
                    >
                      <X size={16} />
                    </button>
                    {imagen && (
                      <button
                        type="button"
                        className="topping-change-image"
                        onClick={() => fileInputRef.current?.click()}
                        title="Cambiar imagen"
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="topping-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={20} />
                    <span>Subir imagen</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          <div className="topping-modal-actions">
            <button type="button" className="topping-btn-secondary" onClick={onClose} disabled={comprimiendo}>
              Cancelar
            </button>
            <button type="submit" className="topping-btn-primary" disabled={comprimiendo}>
              {comprimiendo ? '🗜️ Comprimiendo...' : (topping ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const GestionToppings = () => {
  const { organization } = useAuth();
  const { hasFeature } = useSubscription();
  const { data: toppings = [], isLoading } = useToppings(organization?.id);

  const isServiceBusiness = organization?.business_type === 'service';
  const itemLabel = isServiceBusiness ? 'Adicional' : 'Topping';
  const itemLabelPlural = isServiceBusiness ? 'Adicionales' : 'Toppings';
  const crearTopping = useCrearTopping();
  const actualizarTopping = useActualizarTopping();
  const eliminarTopping = useEliminarTopping();

  const [modalOpen, setModalOpen] = useState(false);
  const [toppingEditando, setToppingEditando] = useState(null);
  const [toppingEliminando, setToppingEliminando] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Verificar si puede usar toppings
  const acceso = canUseToppings(organization, null, hasFeature);

  if (!acceso.canUse) {
    return (
      <div className="gestion-toppings">
        <div className="toppings-disabled">
          <Package size={48} />
          <h3>{itemLabelPlural} no disponibles</h3>
          <p>{acceso.reason}</p>
        </div>
      </div>
    );
  }

  const handleCrear = () => {
    setToppingEditando(null);
    setModalOpen(true);
  };

  const handleEditar = (topping) => {
    setToppingEditando(topping);
    setModalOpen(true);
  };

  const handleGuardar = async (datos) => {
    try {
      if (toppingEditando) {
        await actualizarTopping.mutateAsync({
          id: toppingEditando.id,
          organizationId: organization.id,
          ...datos
        });
      } else {
        await crearTopping.mutateAsync({
          organizationId: organization.id,
          ...datos
        });
      }
      setModalOpen(false);
      setToppingEditando(null);
    } catch (error) {
      console.error('Error guardando topping:', error);
    }
  };

  const handleEliminar = async () => {
    if (!toppingEliminando) return;
    try {
      await eliminarTopping.mutateAsync({
        id: toppingEliminando.id,
        organizationId: organization.id
      });
      setToppingEliminando(null);
    } catch (error) {
      console.error('Error eliminando topping:', error);
    }
  };

  return (
    <FeatureGuard
      feature="toppings"
      recommendedPlan="professional"
      showInline={false}
    >
    <div className="gestion-toppings">
      <div className="toppings-header">
        <div className="toppings-header-content">
          <Package size={24} />
          <h2>Gestión de {itemLabelPlural}</h2>
        </div>
        <button className="topping-btn-primary" onClick={handleCrear}>
          <Plus size={18} />
          Nuevo {itemLabel}
        </button>
      </div>

      {isLoading ? (
        <div className="toppings-loading">
          <p>Cargando toppings...</p>
        </div>
      ) : toppings.length === 0 ? (
        <div className="toppings-empty">
          <Package size={48} />
          <h3>No hay {itemLabelPlural.toLowerCase()} creados</h3>
          <p>Crea tu primer {itemLabel.toLowerCase()} para empezar a usarlo en las ventas</p>
          <button className="topping-btn-primary" onClick={handleCrear}>
            <Plus size={18} />
            Crear Primer {itemLabel}
          </button>
        </div>
      ) : (
        <>
          {/* Buscador de toppings */}
          <div className="gestion-toppings-busqueda-container">
            <span className="gestion-toppings-busqueda-icon-outside">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="gestion-toppings-busqueda-input"
            />
          </div>

          <div className="toppings-grid">
            {toppings
              .filter(topping => {
                if (!busqueda.trim()) return true;
                const query = busqueda.toLowerCase();
                return topping.nombre?.toLowerCase().includes(query) ||
                       topping.categoria?.toLowerCase().includes(query);
              })
              .map((topping) => (
            <motion.div
              key={topping.id}
              className="topping-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {topping.imagen_url && (
                <div className="topping-card-image">
                  <OptimizedProductImage
                    imagePath={topping.imagen_url}
                    alt={topping.nombre}
                    className="topping-image"
                  />
                </div>
              )}
              <div className="topping-card-content">
                <div className="topping-card-header">
                  <h3>{topping.nombre}</h3>
                  <div className="topping-card-actions">
                    <button
                      className="topping-btn-icon"
                      onClick={() => handleEditar(topping)}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="topping-btn-icon topping-btn-danger"
                      onClick={() => setToppingEliminando(topping)}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="topping-card-body">
                  <div className="topping-info">
                    <span className="topping-label">Precio Venta:</span>
                    <span className="topping-value">{formatCOP(topping.precio)}</span>
                  </div>
                  {topping.precio_compra > 0 && (
                    <div className="topping-info">
                      <span className="topping-label">Ganancia:</span>
                      <span className="topping-value" style={{ color: '#10b981' }}>
                        {formatCOP(topping.precio - (topping.precio_compra || 0))}
                      </span>
                    </div>
                  )}
                  <div className="topping-info">
                    <span className="topping-label">Stock:</span>
                    {topping.tipo === 'servicio' || topping.stock === null ? (
                      <span className="topping-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>N/A</span>
                    ) : (
                      <span className={`topping-value ${topping.stock <= 5 ? 'stock-bajo' : ''}`}>
                        {parseFloat(topping.stock).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} unidades
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </>
      )}

      <ToppingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setToppingEditando(null);
        }}
        topping={toppingEditando}
        onSave={handleGuardar}
        organizationId={organization?.id}
        isServiceBusiness={isServiceBusiness}
      />

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {toppingEliminando && (
          <motion.div
            className="topping-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setToppingEliminando(null)}
          >
            <motion.div
              className="topping-modal topping-modal-confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>¿Eliminar {itemLabel.toLowerCase()}?</h3>
              <p>Estás a punto de eliminar "{toppingEliminando.nombre}". Esta acción no se puede deshacer.</p>
              <div className="topping-modal-actions">
                <button
                  className="topping-btn-secondary"
                  onClick={() => setToppingEliminando(null)}
                >
                  Cancelar
                </button>
                <button
                  className="topping-btn-danger"
                  onClick={handleEliminar}
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </FeatureGuard>
  );
};

export default GestionToppings;

