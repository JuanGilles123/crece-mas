// 🎯 Componente para gestionar variaciones centralizadas
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, Settings } from 'lucide-react';
import { useVariaciones, useCrearVariacion, useActualizarVariacion, useEliminarVariacion } from '../hooks/useVariaciones';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './GestionVariaciones.css';

// Modal para crear/editar variación
const VariacionModal = ({ open, onClose, variacion, onSave, organizationId }) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('select');
  const [requerido, setRequerido] = useState(false);
  const [seleccionMultiple, setSeleccionMultiple] = useState(false);
  const [maxSelecciones, setMaxSelecciones] = useState(null);
  const [opciones, setOpciones] = useState([]);

  React.useEffect(() => {
    if (variacion) {
      setNombre(variacion.nombre || '');
      setTipo(variacion.tipo || 'select');
      setRequerido(variacion.requerido || false);
      setSeleccionMultiple(variacion.seleccion_multiple || false);
      setMaxSelecciones(variacion.max_selecciones || null);
      setOpciones(variacion.opciones || []);
    } else {
      setNombre('');
      setTipo('select');
      setRequerido(false);
      setSeleccionMultiple(false);
      setMaxSelecciones(null);
      setOpciones([]);
    }
  }, [variacion, open]);

  const agregarOpcion = () => {
    setOpciones([...opciones, { valor: '', label: '' }]);
  };

  const eliminarOpcion = (index) => {
    setOpciones(opciones.filter((_, i) => i !== index));
  };

  const actualizarOpcion = (index, campo, valor) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index] = {
      ...nuevasOpciones[index],
      [campo]: valor
    };
    // Si se actualiza label y valor está vacío, generar valor automáticamente
    if (campo === 'label' && !nuevasOpciones[index].valor) {
      nuevasOpciones[index].valor = valor.toLowerCase().replace(/\s+/g, '_');
    }
    setOpciones(nuevasOpciones);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (tipo === 'select' && opciones.length === 0) {
      toast.error('Debes agregar al menos una opción para variaciones de tipo selección');
      return;
    }

    // Validar que todas las opciones tengan label
    if (tipo === 'select') {
      const opcionesInvalidas = opciones.some(op => !op.label || !op.label.trim());
      if (opcionesInvalidas) {
        toast.error('Todas las opciones deben tener una etiqueta');
        return;
      }
    }

    onSave({
      nombre: nombre.trim(),
      tipo,
      requerido,
      seleccion_multiple: tipo === 'select' ? seleccionMultiple : false,
      max_selecciones: tipo === 'select' && seleccionMultiple ? maxSelecciones : null,
      opciones: tipo === 'select' ? opciones : []
    });
  };

  if (!open) return null;

  return (
    <div className="variacion-modal-overlay" onClick={onClose}>
      <motion.div
        className="variacion-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="variacion-modal-header">
          <h3>{variacion ? 'Editar Variación' : 'Nueva Variación'}</h3>
          <button className="variacion-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="variacion-modal-form">
          <div className="variacion-form-group">
            <label>
              Nombre de la Variación <span className="required">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Salsa, Arequipe, Tamaño"
              required
            />
          </div>

          <div className="variacion-form-group">
            <label>
              Tipo <span className="required">*</span>
            </label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="select">Selección única (Radio)</option>
              <option value="checkbox">Sí/No (Checkbox)</option>
            </select>
            <p className="variacion-form-hint">
              {tipo === 'select'
                ? 'El cliente debe elegir una opción de una lista'
                : 'El cliente puede marcar o desmarcar (Sí/No)'}
            </p>
          </div>

          {tipo === 'select' && (
            <>
              <div className="variacion-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={seleccionMultiple}
                    onChange={(e) => {
                      setSeleccionMultiple(e.target.checked);
                      if (!e.target.checked) {
                        setMaxSelecciones(null);
                      }
                    }}
                  />
                  <span>Permitir selección múltiple</span>
                </label>
                <p className="variacion-form-hint">
                  Si está marcado, el cliente puede seleccionar varias opciones. Si no, solo puede seleccionar una.
                </p>
              </div>

              {seleccionMultiple && (
                <div className="variacion-form-group">
                  <label>
                    Cantidad máxima de opciones seleccionables
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxSelecciones || ''}
                    onChange={(e) => {
                      const valor = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      setMaxSelecciones(valor);
                    }}
                    placeholder="Sin límite"
                  />
                  <p className="variacion-form-hint">
                    Define cuántas opciones máximo puede seleccionar el cliente. Déjalo vacío para permitir todas.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="variacion-form-group">
            <label>
              <input
                type="checkbox"
                checked={requerido}
                onChange={(e) => setRequerido(e.target.checked)}
              />
              <span>Variación requerida</span>
            </label>
            <p className="variacion-form-hint">
              Si está marcado, el cliente debe seleccionar una opción antes de agregar al pedido
            </p>
          </div>

          {tipo === 'select' && (
            <div className="variacion-form-group">
              <div className="variacion-opciones-header">
                <label>Opciones disponibles <span className="required">*</span></label>
                <button
                  type="button"
                  className="variacion-btn-agregar-opcion"
                  onClick={agregarOpcion}
                >
                  <Plus size={14} />
                  Agregar Opción
                </button>
              </div>

              {opciones.length > 0 ? (
                <div className="variacion-opciones-list">
                  {opciones.map((opcion, index) => (
                    <div key={index} className="variacion-opcion-item">
                      <input
                        type="text"
                        placeholder="Etiqueta (ej: Mora)"
                        value={opcion.label || ''}
                        onChange={(e) => actualizarOpcion(index, 'label', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Valor interno (ej: mora)"
                        value={opcion.valor || ''}
                        onChange={(e) => actualizarOpcion(index, 'valor', e.target.value)}
                        className="variacion-opcion-valor"
                        required
                      />
                      <button
                        type="button"
                        className="variacion-btn-eliminar-opcion"
                        onClick={() => eliminarOpcion(index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="variacion-opciones-empty">
                  Agrega al menos una opción para que el cliente pueda elegir
                </p>
              )}
            </div>
          )}

          <div className="variacion-modal-actions">
            <button type="button" className="variacion-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="variacion-btn-primary">
              {variacion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const GestionVariaciones = () => {
  const { organization } = useAuth();
  const { data: variaciones = [], isLoading } = useVariaciones(organization?.id);

  const crearVariacion = useCrearVariacion();
  const actualizarVariacion = useActualizarVariacion();
  const eliminarVariacion = useEliminarVariacion();

  const [modalOpen, setModalOpen] = useState(false);
  const [variacionSeleccionada, setVariacionSeleccionada] = useState(null);

  const handleCrear = () => {
    setVariacionSeleccionada(null);
    setModalOpen(true);
  };

  const handleEditar = (variacion) => {
    setVariacionSeleccionada(variacion);
    setModalOpen(true);
  };

  const handleEliminar = async (variacion) => {
    if (!window.confirm(`¿Estás seguro de eliminar la variación "${variacion.nombre}"?`)) {
      return;
    }

    eliminarVariacion.mutate({
      id: variacion.id,
      organizationId: organization?.id
    });
  };

  const handleSave = async (data) => {
    try {
      if (variacionSeleccionada) {
        await actualizarVariacion.mutateAsync({
          id: variacionSeleccionada.id,
          organizationId: organization?.id,
          ...data
        });
      } else {
        await crearVariacion.mutateAsync({
          organizationId: organization?.id,
          ...data
        });
      }
      setModalOpen(false);
      setVariacionSeleccionada(null);
    } catch (error) {
      console.error('Error saving variacion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="gestion-variaciones">
        <div className="gestion-variaciones-loading">
          <p>Cargando variaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-variaciones">
      <div className="gestion-variaciones-header">
        <div>
          <h1>Gestión de Variaciones</h1>
          <p className="gestion-variaciones-subtitle">
            Crea y gestiona variaciones que pueden ser vinculadas a tus productos
          </p>
        </div>
        <button className="gestion-variaciones-btn-crear" onClick={handleCrear}>
          <Plus size={20} />
          Nueva Variación
        </button>
      </div>

      {variaciones.length === 0 ? (
        <div className="gestion-variaciones-empty">
          <Settings size={48} />
          <h3>No hay variaciones creadas</h3>
          <p>Crea tu primera variación para comenzar a personalizar tus productos</p>
          <button className="gestion-variaciones-btn-crear-empty" onClick={handleCrear}>
            <Plus size={20} />
            Crear Primera Variación
          </button>
        </div>
      ) : (
        <div className="variaciones-grid">
          <AnimatePresence>
            {variaciones.map((variacion) => (
              <motion.div
                key={variacion.id}
                className="variacion-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="variacion-card-header">
                  <h3>{variacion.nombre}</h3>
                  <div className="variacion-card-actions">
                    <button
                      className="variacion-card-btn-editar"
                      onClick={() => handleEditar(variacion)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="variacion-card-btn-eliminar"
                      onClick={() => handleEliminar(variacion)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="variacion-card-body">
                  <div className="variacion-card-badges">
                    <span className={`variacion-badge tipo-${variacion.tipo}`}>
                      {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
                    </span>
                    {variacion.requerido && (
                      <span className="variacion-badge requerido">Requerido</span>
                    )}
                    {variacion.tipo === 'select' && variacion.opciones && (
                      <span className="variacion-badge opciones">
                        {variacion.opciones.length} opción{variacion.opciones.length !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>

                  {variacion.tipo === 'select' && variacion.opciones && variacion.opciones.length > 0 && (
                    <div className="variacion-card-opciones">
                      <p className="variacion-card-opciones-label">Opciones:</p>
                      <div className="variacion-card-opciones-list">
                        {variacion.opciones.map((opcion, index) => (
                          <span key={index} className="variacion-card-opcion">
                            {opcion.label || opcion.valor || 'Sin etiqueta'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <VariacionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setVariacionSeleccionada(null);
        }}
        variacion={variacionSeleccionada}
        onSave={handleSave}
        organizationId={organization?.id}
      />
    </div>
  );
};

export default GestionVariaciones;
