// 🎯 Componente para configurar variaciones de un producto
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Edit2, Save, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVariaciones } from '../hooks/useVariaciones';
import { useAuth } from '../context/AuthContext';
import './VariacionesConfig.css';

const VariacionesConfig = ({ variaciones = [], onChange, disabled = false }) => {
  const { organization } = useAuth();
  const { data: variacionesDisponibles = [] } = useVariaciones(organization?.id);
  const [variacionesList, setVariacionesList] = useState([]);
  const [variacionesVinculadas, setVariacionesVinculadas] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [mostrandoSelector, setMostrandoSelector] = useState(false);
  const inicializadoRef = useRef(false);
  const variacionesInicialesRef = useRef(null);
  const bloqueandoNotificacionRef = useRef(false);

  // Función helper para comparar variaciones sin usar JSON.stringify
  const variacionesEqual = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    
    // Comparar por IDs si existen, o por propiedades relevantes
    for (let i = 0; i < a.length; i++) {
      const aItem = a[i];
      const bItem = b[i];
      if (aItem?.id && bItem?.id) {
        if (aItem.id !== bItem.id) return false;
      } else if (aItem?.nombre !== bItem?.nombre || aItem?.tipo !== bItem?.tipo) {
        return false;
      }
    }
    return true;
  };

  // Inicializar con variaciones existentes (solo una vez o cuando cambian las props iniciales)
  useEffect(() => {
    // Comparar variaciones sin usar JSON.stringify para evitar errores con referencias circulares
    const variacionesChanged = !variacionesEqual(variaciones, variacionesInicialesRef.current);
    
    // Solo inicializar si:
    // 1. No se ha inicializado aún, O
    // 2. Las variaciones iniciales cambiaron (nuevo producto o variaciones diferentes desde el padre)
    if (!inicializadoRef.current || variacionesChanged) {
      bloqueandoNotificacionRef.current = true; // Bloquear notificaciones durante inicialización
      
      if (variaciones && Array.isArray(variaciones) && variaciones.length > 0) {
        // Separar variaciones vinculadas (con id) de variaciones locales (sin id)
        const vinculadas = variaciones.filter(v => v.id && variacionesDisponibles.some(vd => vd.id === v.id));
        const locales = variaciones.filter(v => !v.id || !variacionesDisponibles.some(vd => vd.id === v.id));
        
        setVariacionesVinculadas(vinculadas.map(v => v.id));
        setVariacionesList(locales);
      } else {
        setVariacionesList([]);
        setVariacionesVinculadas([]);
      }
      
      inicializadoRef.current = true;
      // Guardar una copia limpia de las variaciones iniciales (solo propiedades relevantes)
      variacionesInicialesRef.current = variaciones && Array.isArray(variaciones) 
        ? variaciones.map(v => ({
            id: v.id,
            nombre: v.nombre,
            tipo: v.tipo,
            requerido: v.requerido
          }))
        : null;
      
      // Desbloquear después de un pequeño delay para permitir que los estados se actualicen
      setTimeout(() => {
        bloqueandoNotificacionRef.current = false;
      }, 0);
    }
  }, [variaciones, variacionesDisponibles]);

  // Notificar cambios al padre (combinar vinculadas y locales)
  // Solo notificar si ya se inicializó y no estamos bloqueando (durante inicialización)
  const prevVariacionesListRef = useRef([]);
  const prevVariacionesVinculadasRef = useRef([]);
  
  // Función helper para comparar arrays de objetos de forma segura
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const aItem = a[i];
      const bItem = b[i];
      // Comparar IDs si existen
      if (aItem?.id && bItem?.id) {
        if (aItem.id !== bItem.id) return false;
      }
      // Comparar propiedades relevantes sin usar JSON.stringify
      if (aItem?.nombre !== bItem?.nombre) return false;
      if (aItem?.tipo !== bItem?.tipo) return false;
      if (aItem?.requerido !== bItem?.requerido) return false;
    }
    return true;
  };
  
  // Función helper para comparar arrays de IDs
  const idsEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((id, index) => id === sortedB[index]);
  };
  
  useEffect(() => {
    if (!onChange || !inicializadoRef.current || bloqueandoNotificacionRef.current) return;
    
    // Comparar con valores anteriores para evitar notificaciones innecesarias
    const listChanged = !arraysEqual(variacionesList, prevVariacionesListRef.current);
    const vinculadasChanged = !idsEqual(variacionesVinculadas, prevVariacionesVinculadasRef.current);
    
    if (listChanged || vinculadasChanged) {
      // Para variaciones vinculadas, solo guardar el objeto completo (se usará en el selector)
      // Para variaciones locales, guardar como están
      const todas = [
        ...variacionesDisponibles.filter(v => variacionesVinculadas.includes(v.id)),
        ...variacionesList
      ];
      
      // Actualizar referencias antes de llamar onChange (crear copias para evitar mutaciones)
      prevVariacionesListRef.current = variacionesList.map(v => ({ ...v }));
      prevVariacionesVinculadasRef.current = [...variacionesVinculadas];
      
      onChange(todas);
    }
  }, [variacionesList, variacionesVinculadas, variacionesDisponibles, onChange]);

  const agregarVariacion = () => {
    const nuevaVariacion = {
      id: `variacion_${Date.now()}`,
      nombre: '',
      tipo: 'select',
      requerido: false,
      opciones: []
    };
    setVariacionesList([...variacionesList, nuevaVariacion]);
    setEditingIndex(variacionesList.length);
  };

  const eliminarVariacion = (index) => {
    setVariacionesList(variacionesList.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const actualizarVariacion = (index, campo, valor) => {
    const actualizadas = [...variacionesList];
    actualizadas[index] = {
      ...actualizadas[index],
      [campo]: valor
    };
    setVariacionesList(actualizadas);
  };

  const agregarOpcion = (variacionIndex) => {
    const actualizadas = [...variacionesList];
    const nuevaOpcion = { valor: '', label: '' };
    actualizadas[variacionIndex].opciones = [
      ...(actualizadas[variacionIndex].opciones || []),
      nuevaOpcion
    ];
    setVariacionesList(actualizadas);
  };

  const eliminarOpcion = (variacionIndex, opcionIndex) => {
    const actualizadas = [...variacionesList];
    actualizadas[variacionIndex].opciones = actualizadas[variacionIndex].opciones.filter(
      (_, i) => i !== opcionIndex
    );
    setVariacionesList(actualizadas);
  };

  const actualizarOpcion = (variacionIndex, opcionIndex, campo, valor) => {
    const actualizadas = [...variacionesList];
    actualizadas[variacionIndex].opciones[opcionIndex] = {
      ...actualizadas[variacionIndex].opciones[opcionIndex],
      [campo]: valor
    };
    // Si solo se actualiza label, copiar a valor si está vacío
    if (campo === 'label' && !actualizadas[variacionIndex].opciones[opcionIndex].valor) {
      actualizadas[variacionIndex].opciones[opcionIndex].valor = valor.toLowerCase().replace(/\s+/g, '_');
    }
    setVariacionesList(actualizadas);
  };

  const toggleEditar = (index) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
    }
  };

  return (
    <div className="variaciones-config">
      <div className="variaciones-config-header">
        <h4>Variaciones del Producto</h4>
        <p className="variaciones-config-subtitle">
          Vincula variaciones existentes o crea nuevas para este producto
        </p>
        {!disabled && (
          <div className="variaciones-config-actions">
            <button
              type="button"
              className="variaciones-config-btn-vincular"
              onClick={() => setMostrandoSelector(true)}
            >
              <LinkIcon size={16} />
              Vincular Variaciones
            </button>
            <button
              type="button"
              className="variaciones-config-btn-agregar"
              onClick={agregarVariacion}
            >
              <Plus size={16} />
              Crear Nueva
            </button>
          </div>
        )}
      </div>

      {/* Selector de variaciones disponibles */}
      {mostrandoSelector && (
        <div className="variaciones-selector-overlay" onClick={(e) => {
          // Solo cerrar si el click fue directamente en el overlay, no en el modal
          if (e.target === e.currentTarget) {
            setMostrandoSelector(false);
          }
        }}>
          <motion.div
            className="variaciones-selector-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => {
              // Solo prevenir propagación si el click NO fue en un elemento interactivo
              const target = e.target;
              const isInteractive = target.tagName === 'INPUT' || 
                                   target.tagName === 'BUTTON' || 
                                   target.tagName === 'LABEL' ||
                                   target.closest('label') ||
                                   target.closest('button');
              
              if (!isInteractive) {
                e.stopPropagation();
              }
            }}
          >
            <div className="variaciones-selector-header">
              <h3>Vincular Variaciones Existentes</h3>
              <button onClick={() => setMostrandoSelector(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="variaciones-selector-content">
              {variacionesDisponibles.length === 0 ? (
                <p>No hay variaciones disponibles. Crea algunas en el módulo de Gestión de Variaciones.</p>
              ) : (
                variacionesDisponibles.map((variacion) => {
                  const isChecked = variacionesVinculadas.includes(variacion.id);
                  return (
                    <label
                      key={variacion.id}
                      className="variacion-selector-item"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setVariacionesVinculadas([...variacionesVinculadas, variacion.id]);
                          } else {
                            setVariacionesVinculadas(variacionesVinculadas.filter(id => id !== variacion.id));
                          }
                        }}
                      />
                      <div className="variacion-selector-info">
                        <span className="variacion-selector-nombre">{variacion.nombre}</span>
                        <div className="variacion-selector-badges">
                          <span className={`variacion-badge-mini tipo-${variacion.tipo}`}>
                            {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
                          </span>
                          {variacion.requerido && (
                            <span className="variacion-badge-mini requerido">Requerido</span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="variaciones-selector-footer">
              <button
                className="variacion-btn-primary"
                onClick={() => setMostrandoSelector(false)}
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mostrar variaciones vinculadas */}
      {variacionesVinculadas.length > 0 && (
        <div className="variaciones-vinculadas">
          <h5>Variaciones Vinculadas</h5>
          <div className="variaciones-vinculadas-list">
            {variacionesDisponibles
              .filter(v => variacionesVinculadas.includes(v.id))
              .map((variacion) => (
                <div key={variacion.id} className="variacion-vinculada-item">
                  <div className="variacion-vinculada-info">
                    <span className="variacion-vinculada-nombre">{variacion.nombre}</span>
                    <div className="variacion-vinculada-badges">
                      <span className={`variacion-badge-mini tipo-${variacion.tipo}`}>
                        {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
                      </span>
                      {variacion.requerido && (
                        <span className="variacion-badge-mini requerido">Requerido</span>
                      )}
                    </div>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      className="variacion-vinculada-remove"
                      onClick={() => setVariacionesVinculadas(variacionesVinculadas.filter(id => id !== variacion.id))}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {variacionesList.length === 0 ? (
        <div className="variaciones-config-empty">
          <p>No hay variaciones configuradas</p>
          <p className="variaciones-config-empty-hint">
            Las variaciones permiten que los clientes personalicen el producto (ej: elegir salsa, agregar arequipe, etc.)
          </p>
        </div>
      ) : (
        <div className="variaciones-config-list">
          <AnimatePresence>
            {variacionesList.map((variacion, index) => (
              <motion.div
                key={variacion.id || index}
                className={`variacion-config-item ${editingIndex === index ? 'editing' : ''}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {editingIndex === index ? (
                  // Modo edición
                  <div className="variacion-config-edit">
                    <div className="variacion-config-edit-header">
                      <h5>Editar Variación</h5>
                      <button
                        type="button"
                        className="variacion-config-btn-cerrar"
                        onClick={() => setEditingIndex(null)}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="variacion-config-form">
                      <div className="variacion-config-field">
                        <label>
                          Nombre de la Variación <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          value={variacion.nombre}
                          onChange={(e) => {
                            const nombre = e.target.value;
                            actualizarVariacion(index, 'nombre', nombre);
                            // Auto-generar ID si está vacío
                            if (!variacion.id || variacion.id.startsWith('variacion_')) {
                              actualizarVariacion(index, 'id', nombre.toLowerCase().replace(/\s+/g, '_'));
                            }
                          }}
                          placeholder="Ej: Salsa, Arequipe, Tamaño"
                          disabled={disabled}
                        />
                      </div>

                      <div className="variacion-config-field">
                        <label>
                          Tipo <span className="required">*</span>
                        </label>
                        <select
                          value={variacion.tipo}
                          onChange={(e) => actualizarVariacion(index, 'tipo', e.target.value)}
                          disabled={disabled}
                        >
                          <option value="select">Selección única (Radio)</option>
                          <option value="checkbox">Sí/No (Checkbox)</option>
                        </select>
                        <p className="variacion-config-hint">
                          {variacion.tipo === 'select'
                            ? 'El cliente debe elegir una opción de una lista'
                            : 'El cliente puede marcar o desmarcar (Sí/No)'}
                        </p>
                      </div>

                      <div className="variacion-config-field">
                        <label>
                          <input
                            type="checkbox"
                            checked={variacion.requerido}
                            onChange={(e) => actualizarVariacion(index, 'requerido', e.target.checked)}
                            disabled={disabled}
                          />
                          <span>Variación requerida</span>
                        </label>
                        <p className="variacion-config-hint">
                          Si está marcado, el cliente debe seleccionar una opción antes de agregar al pedido
                        </p>
                      </div>

                      {variacion.tipo === 'select' && (
                        <div className="variacion-config-opciones">
                          <div className="variacion-config-opciones-header">
                            <label>Opciones disponibles</label>
                            <button
                              type="button"
                              className="variacion-config-btn-agregar-opcion"
                              onClick={() => agregarOpcion(index)}
                              disabled={disabled}
                            >
                              <Plus size={14} />
                              Agregar Opción
                            </button>
                          </div>

                          {variacion.opciones && variacion.opciones.length > 0 ? (
                            <div className="variacion-config-opciones-list">
                              {variacion.opciones.map((opcion, opcionIndex) => (
                                <div key={opcionIndex} className="variacion-config-opcion">
                                  <input
                                    type="text"
                                    placeholder="Etiqueta (ej: Mora)"
                                    value={opcion.label || ''}
                                    onChange={(e) => {
                                      const label = e.target.value;
                                      actualizarOpcion(index, opcionIndex, 'label', label);
                                      // Auto-generar valor si está vacío
                                      if (!opcion.valor) {
                                        actualizarOpcion(index, opcionIndex, 'valor', label.toLowerCase().replace(/\s+/g, '_'));
                                      }
                                    }}
                                    disabled={disabled}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Valor interno (ej: mora)"
                                    value={opcion.valor || ''}
                                    onChange={(e) => actualizarOpcion(index, opcionIndex, 'valor', e.target.value)}
                                    disabled={disabled}
                                    className="variacion-config-opcion-valor"
                                  />
                                  <button
                                    type="button"
                                    className="variacion-config-btn-eliminar-opcion"
                                    onClick={() => eliminarOpcion(index, opcionIndex)}
                                    disabled={disabled}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="variacion-config-opciones-empty">
                              Agrega al menos una opción para que el cliente pueda elegir
                            </p>
                          )}
                        </div>
                      )}

                      <div className="variacion-config-actions">
                        <button
                          type="button"
                          className="variacion-config-btn-guardar"
                          onClick={() => setEditingIndex(null)}
                          disabled={!variacion.nombre || (variacion.tipo === 'select' && (!variacion.opciones || variacion.opciones.length === 0))}
                        >
                          <Save size={14} />
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Modo visualización
                  <div className="variacion-config-view">
                    <div className="variacion-config-view-header">
                      <div className="variacion-config-view-info">
                        <h5>{variacion.nombre || 'Variación sin nombre'}</h5>
                        <div className="variacion-config-view-badges">
                          <span className={`variacion-config-badge tipo-${variacion.tipo}`}>
                            {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
                          </span>
                          {variacion.requerido && (
                            <span className="variacion-config-badge requerido">Requerido</span>
                          )}
                          {variacion.tipo === 'select' && variacion.opciones && (
                            <span className="variacion-config-badge opciones">
                              {variacion.opciones.length} opción{variacion.opciones.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="variacion-config-view-actions">
                        {!disabled && (
                          <>
                            <button
                              type="button"
                              className="variacion-config-btn-editar"
                              onClick={() => toggleEditar(index)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="variacion-config-btn-eliminar"
                              onClick={() => eliminarVariacion(index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {variacion.tipo === 'select' && variacion.opciones && variacion.opciones.length > 0 && (
                      <div className="variacion-config-view-opciones">
                        <p className="variacion-config-view-opciones-label">Opciones:</p>
                        <div className="variacion-config-view-opciones-list">
                          {variacion.opciones.map((opcion, opcionIndex) => (
                            <span key={opcionIndex} className="variacion-config-view-opcion">
                              {opcion.label || opcion.valor || 'Sin etiqueta'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default VariacionesConfig;
