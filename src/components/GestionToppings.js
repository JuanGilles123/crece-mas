// 🍔 Componente para gestionar toppings
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, Package, Upload } from 'lucide-react';
import { useToppings, useCrearTopping, useActualizarTopping, useEliminarTopping } from '../hooks/useToppings';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { canUseToppings } from '../utils/toppingsUtils';
import { supabase } from '../supabaseClient';
import { compressProductImage } from '../utils/imageCompression';
import OptimizedProductImage from './OptimizedProductImage';
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
  const [stock, setStock] = useState('');
  const [stockDisplay, setStockDisplay] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const fileInputRef = React.useRef();
  const puedeSubirImagenes = hasFeature('productImages');

  React.useEffect(() => {
    if (topping) {
      setNombre(topping.nombre || '');
      setPrecio(topping.precio?.toString() || '');
      setPrecioDisplay(formatNumber(topping.precio?.toString() || ''));
      setStock(topping.stock !== null ? topping.stock.toString() : '');
      setStockDisplay(topping.stock !== null ? formatNumber(topping.stock.toString()) : '');
      setImagenPreview(topping.imagen_url || null);
      setImagen(null);
    } else {
      setNombre('');
      setPrecio('');
      setPrecioDisplay('');
      setStock('');
      setStockDisplay('');
      setImagen(null);
      setImagenPreview(null);
    }
  }, [topping, open]);

  const handlePrecioChange = (e) => {
    const value = e.target.value;
    const numeric = getNumericValue(value);
    setPrecio(numeric.toString());
    setPrecioDisplay(formatNumber(numeric.toString()));
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

    let imagenPath = topping?.imagen_url || null;

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

        // Eliminar imagen anterior si existe
        if (topping?.imagen_url) {
          await supabase.storage.from('productos').remove([topping.imagen_url]);
        }

        imagenPath = nombreArchivo;
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        toast.error('Error al procesar la imagen');
        setComprimiendo(false);
        return;
      }
    }

    onSave({
      nombre: nombre.trim(),
      precio: precioNum,
      stock: isServiceBusiness ? null : stockNum,
      imagen_url: imagenPath,
      tipo: isServiceBusiness ? 'servicio' : 'comida'
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
            <label>Precio Adicional (COP) *</label>
            <input
              type="text"
              value={precioDisplay}
              onChange={handlePrecioChange}
              placeholder="0"
              inputMode="numeric"
              required
            />
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
                      onClick={() => {
                        setImagen(null);
                        setImagenPreview(topping?.imagen_url || null);
                        fileInputRef.current.value = '';
                      }}
                    >
                      <X size={16} />
                    </button>
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
        <div className="toppings-grid">
          {toppings.map((topping) => (
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
                    <span className="topping-label">Precio:</span>
                    <span className="topping-value">{formatCOP(topping.precio)}</span>
                  </div>
                  <div className="topping-info">
                    <span className="topping-label">Stock:</span>
                    {topping.tipo === 'servicio' || topping.stock === null ? (
                      <span className="topping-value" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>N/A</span>
                    ) : (
                      <span className={`topping-value ${topping.stock <= 5 ? 'stock-bajo' : ''}`}>
                        {topping.stock} unidades
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
  );
};

export default GestionToppings;

