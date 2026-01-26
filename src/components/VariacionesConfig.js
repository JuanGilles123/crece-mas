// 🎯 Componente para configurar variaciones de un producto
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Edit2, Save, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVariaciones, useCrearVariacion, useActualizarVariacion } from '../hooks/useVariaciones';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './VariacionesConfig.css';

const VariacionesConfig = ({ variaciones = [], onChange, disabled = false }) => {
  const { organization } = useAuth();
  const { data: variacionesDisponibles = [], refetch: refetchVariaciones } = useVariaciones(organization?.id);
  const crearVariacion = useCrearVariacion();
  const actualizarVariacion = useActualizarVariacion();
  const [variacionesList, setVariacionesList] = useState([]);
  const [variacionesVinculadas, setVariacionesVinculadas] = useState([]); // Ahora guarda objetos: { id, opciones_seleccionadas: null | array, max_selecciones: null | number, seleccion_multiple: null | boolean, requerido: null | boolean }
  const [configurandoOpciones, setConfigurandoOpciones] = useState(null); // ID de la variación que se está configurando
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
        
        // Convertir variaciones vinculadas al nuevo formato: { id, opciones_seleccionadas, max_selecciones, seleccion_multiple, requerido }
        setVariacionesVinculadas(vinculadas.map(v => ({
          id: v.id,
          opciones_seleccionadas: v.opciones_seleccionadas || null, // null = todas las opciones
          max_selecciones: v.max_selecciones !== undefined ? v.max_selecciones : null, // null = usar el de la variación global
          seleccion_multiple: v.seleccion_multiple !== undefined ? v.seleccion_multiple : null, // null = usar el de la variación global
          requerido: v.requerido !== undefined ? v.requerido : null // null = usar el de la variación global
        })));
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
  
  // Función helper para comparar arrays de objetos de variaciones vinculadas
  const vinculadasEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => x.id.localeCompare(y.id));
    const sortedB = [...b].sort((x, y) => x.id.localeCompare(y.id));
    return sortedA.every((item, index) => {
      const other = sortedB[index];
      if (item.id !== other.id) return false;
      // Comparar opciones_seleccionadas
      if (item.opciones_seleccionadas === null && other.opciones_seleccionadas === null) return true;
      if (item.opciones_seleccionadas === null || other.opciones_seleccionadas === null) return false;
      if (item.opciones_seleccionadas.length !== other.opciones_seleccionadas.length) return false;
      const sortedOpcionesA = [...item.opciones_seleccionadas].sort();
      const sortedOpcionesB = [...other.opciones_seleccionadas].sort();
      return sortedOpcionesA.every((op, i) => op === sortedOpcionesB[i]);
    });
  };
  
  useEffect(() => {
    if (!onChange || !inicializadoRef.current || bloqueandoNotificacionRef.current) return;
    
    // Comparar con valores anteriores para evitar notificaciones innecesarias
    const listChanged = !arraysEqual(variacionesList, prevVariacionesListRef.current);
    const vinculadasChanged = !vinculadasEqual(variacionesVinculadas, prevVariacionesVinculadasRef.current);
    
    if (listChanged || vinculadasChanged) {
      // Para variaciones vinculadas, crear objetos con la configuración completa
      const todas = [
        ...variacionesDisponibles
          .filter(v => variacionesVinculadas.some(vv => (typeof vv === 'object' ? vv.id : vv) === v.id))
          .map(v => {
            const config = variacionesVinculadas.find(vv => (typeof vv === 'object' ? vv.id : vv) === v.id);
            const resultado = { ...v };
            
            // Si hay opciones_seleccionadas, filtrar las opciones
            if (config && config.opciones_seleccionadas && Array.isArray(config.opciones_seleccionadas)) {
              resultado.opciones = v.opciones ? v.opciones.filter(op => {
                const valor = typeof op === 'string' ? op : op.valor;
                return config.opciones_seleccionadas.includes(valor);
              }) : [];
              resultado.opciones_seleccionadas = config.opciones_seleccionadas;
            } else {
              resultado.opciones_seleccionadas = null;
            }
            
            // Si hay max_selecciones configurado para este producto, usarlo; si no, usar el de la variación global
            if (config && config.max_selecciones !== undefined && config.max_selecciones !== null) {
              resultado.max_selecciones = config.max_selecciones;
            }
            // Si no hay max_selecciones en la config, se mantiene el de la variación global (v.max_selecciones)
            
            // Si hay seleccion_multiple configurado para este producto, usarlo; si no, usar el de la variación global
            if (config && config.seleccion_multiple !== undefined && config.seleccion_multiple !== null) {
              resultado.seleccion_multiple = config.seleccion_multiple;
            }
            // Si no hay seleccion_multiple en la config, se mantiene el de la variación global (v.seleccion_multiple)
            
            // Si hay requerido configurado para este producto, usarlo; si no, usar el de la variación global
            if (config && config.requerido !== undefined && config.requerido !== null) {
              resultado.requerido = config.requerido;
            }
            // Si no hay requerido en la config, se mantiene el de la variación global (v.requerido)
            
            return resultado;
          }),
        ...variacionesList
      ];
      
      // Actualizar referencias antes de llamar onChange (crear copias para evitar mutaciones)
      prevVariacionesListRef.current = variacionesList.map(v => ({ ...v }));
      prevVariacionesVinculadasRef.current = variacionesVinculadas.map(v => ({ ...v }));
      
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

  const actualizarVariacionLocal = (index, campo, valor) => {
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
                  const vinculada = variacionesVinculadas.find(vv => typeof vv === 'object' ? vv.id === variacion.id : vv === variacion.id);
                  const isChecked = !!vinculada;
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
                            // Si ya existe en formato antiguo (string), convertir
                            const nuevas = variacionesVinculadas.filter(vv => 
                              typeof vv === 'object' ? vv.id !== variacion.id : vv !== variacion.id
                            );
                            setVariacionesVinculadas([...nuevas, { id: variacion.id, opciones_seleccionadas: null, max_selecciones: null, seleccion_multiple: null, requerido: null }]);
                          } else {
                            setVariacionesVinculadas(variacionesVinculadas.filter(vv => 
                              typeof vv === 'object' ? vv.id !== variacion.id : vv !== variacion.id
                            ));
                          }
                        }}
                      />
                      <div className="variacion-selector-info">
                        <span className="variacion-selector-nombre">{variacion.nombre}</span>
                        <div className="variacion-selector-badges">
                          <span className={`variacion-badge-mini tipo-${variacion.tipo}`}>
                            {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
                          </span>
                          {variacion.seleccion_multiple && (
                            <span className="variacion-badge-mini multiple">Múltiple</span>
                          )}
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
              .filter(v => variacionesVinculadas.some(vv => typeof vv === 'object' ? vv.id === v.id : vv === v.id))
              .map((variacion) => {
                const config = variacionesVinculadas.find(vv => typeof vv === 'object' ? vv.id === variacion.id : vv === variacion.id);
                const opcionesLimitadas = config && typeof config === 'object' && config.opciones_seleccionadas && Array.isArray(config.opciones_seleccionadas);
                
                // Valores por producto o globales
                const seleccionMultiple = config && typeof config === 'object' && config.seleccion_multiple !== undefined && config.seleccion_multiple !== null 
                  ? config.seleccion_multiple 
                  : variacion.seleccion_multiple || false;
                const requerido = config && typeof config === 'object' && config.requerido !== undefined && config.requerido !== null 
                  ? config.requerido 
                  : variacion.requerido || false;
                const maxSelecciones = config && typeof config === 'object' && config.max_selecciones !== undefined && config.max_selecciones !== null 
                  ? config.max_selecciones 
                  : variacion.max_selecciones || null;
                
                return (
                  <div key={variacion.id} className="variacion-vinculada-card">
                    <div className="variacion-vinculada-header">
                      <h6 className="variacion-vinculada-nombre">{variacion.nombre}</h6>
                      <button
                        type="button"
                        className="variacion-vinculada-remove"
                        onClick={() => setVariacionesVinculadas(variacionesVinculadas.filter(vv => 
                          typeof vv === 'object' ? vv.id !== variacion.id : vv !== variacion.id
                        ))}
                        title="Quitar variación"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="variacion-vinculada-content">
                      <div className="variacion-vinculada-badges-section">
                        <div className="variacion-vinculada-badges">
                          <span className={`variacion-badge-mini tipo-${variacion.tipo}`}>
                            {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
                          </span>
                          {seleccionMultiple && (
                            <span className="variacion-badge-mini multiple">Múltiple</span>
                          )}
                          {requerido && (
                            <span className="variacion-badge-mini requerido">Requerido</span>
                          )}
                          {opcionesLimitadas && (
                            <span className="variacion-badge-mini opciones-limitadas" title={`${config.opciones_seleccionadas.length} de ${variacion.opciones.length} opciones seleccionadas`}>
                              {config.opciones_seleccionadas.length}/{variacion.opciones.length} opc.
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!disabled && (
                        <div className="variacion-vinculada-config-section">
                          {variacion.tipo === 'select' && (
                            <>
                              <div className="variacion-vinculada-config-row">
                                <label className="variacion-vinculada-checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={seleccionMultiple}
                                    onChange={(e) => {
                                      const nuevoValor = e.target.checked;
                                      setVariacionesVinculadas(variacionesVinculadas.map(vv => {
                                        if (typeof vv === 'object' && vv.id === variacion.id) {
                                          return { ...vv, seleccion_multiple: nuevoValor };
                                        }
                                        if (typeof vv !== 'object' && vv === variacion.id) {
                                          return { id: variacion.id, seleccion_multiple: nuevoValor, opciones_seleccionadas: null, max_selecciones: null, requerido: null };
                                        }
                                        return vv;
                                      }));
                                    }}
                                  />
                                  <span>Selección múltiple</span>
                                </label>
                                
                                <label className="variacion-vinculada-checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={requerido}
                                    onChange={(e) => {
                                      const nuevoValor = e.target.checked;
                                      setVariacionesVinculadas(variacionesVinculadas.map(vv => {
                                        if (typeof vv === 'object' && vv.id === variacion.id) {
                                          return { ...vv, requerido: nuevoValor };
                                        }
                                        if (typeof vv !== 'object' && vv === variacion.id) {
                                          return { id: variacion.id, requerido: nuevoValor, opciones_seleccionadas: null, max_selecciones: null, seleccion_multiple: null };
                                        }
                                        return vv;
                                      }));
                                    }}
                                  />
                                  <span>Obligatorio</span>
                                </label>
                              </div>
                              
                              {seleccionMultiple && (
                                <div className="variacion-vinculada-config-row">
                                  <div className="variacion-vinculada-max-selecciones">
                                    <label className="variacion-vinculada-input-label">
                                      Máx. selecciones:
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={maxSelecciones !== null && maxSelecciones !== undefined ? maxSelecciones : ''}
                                      onChange={(e) => {
                                        const valorTexto = e.target.value;
                                        // Si está vacío, establecer null
                                        if (valorTexto === '') {
                                          const valor = null;
                                          setVariacionesVinculadas(variacionesVinculadas.map(vv => {
                                            if (typeof vv === 'object' && vv.id === variacion.id) {
                                              return { ...vv, max_selecciones: valor };
                                            }
                                            if (typeof vv !== 'object' && vv === variacion.id) {
                                              return { id: variacion.id, max_selecciones: valor, opciones_seleccionadas: null, seleccion_multiple: null, requerido: null };
                                            }
                                            return vv;
                                          }));
                                        } else {
                                          // Intentar parsear el número
                                          const valorNum = parseInt(valorTexto, 10);
                                          if (!isNaN(valorNum) && valorNum > 0) {
                                            setVariacionesVinculadas(variacionesVinculadas.map(vv => {
                                              if (typeof vv === 'object' && vv.id === variacion.id) {
                                                return { ...vv, max_selecciones: valorNum };
                                              }
                                              if (typeof vv !== 'object' && vv === variacion.id) {
                                                return { id: variacion.id, max_selecciones: valorNum, opciones_seleccionadas: null, seleccion_multiple: null, requerido: null };
                                              }
                                              return vv;
                                            }));
                                          }
                                        }
                                      }}
                                      placeholder="Sin límite"
                                    />
                                  </div>
                                  
                                  {variacion.opciones && variacion.opciones.length > 0 && (
                                    <button
                                      type="button"
                                      className="variacion-vinculada-config-btn"
                                      onClick={() => setConfigurandoOpciones(variacion.id)}
                                      title={`Configurar opciones (${variacion.opciones.length} disponibles)`}
                                    >
                                      <Edit2 size={14} />
                                      <span>Elegir opciones</span>
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              {!seleccionMultiple && variacion.opciones && variacion.opciones.length > 0 && (
                                <div className="variacion-vinculada-config-row">
                                  <button
                                    type="button"
                                    className="variacion-vinculada-config-btn"
                                    onClick={() => setConfigurandoOpciones(variacion.id)}
                                    title={`Configurar opciones (${variacion.opciones.length} disponibles)`}
                                  >
                                    <Edit2 size={14} />
                                    <span>Elegir opciones</span>
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                          
                          {variacion.tipo === 'checkbox' && (
                            <div className="variacion-vinculada-config-row">
                              <label className="variacion-vinculada-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={requerido}
                                  onChange={(e) => {
                                    const nuevoValor = e.target.checked;
                                    setVariacionesVinculadas(variacionesVinculadas.map(vv => {
                                      if (typeof vv === 'object' && vv.id === variacion.id) {
                                        return { ...vv, requerido: nuevoValor };
                                      }
                                      if (typeof vv !== 'object' && vv === variacion.id) {
                                        return { id: variacion.id, requerido: nuevoValor, opciones_seleccionadas: null, max_selecciones: null, seleccion_multiple: null };
                                      }
                                      return vv;
                                    }));
                                  }}
                                />
                                <span>Obligatorio</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                            actualizarVariacionLocal(index, 'nombre', nombre);
                            // Auto-generar ID si está vacío
                            if (!variacion.id || variacion.id.startsWith('variacion_')) {
                              actualizarVariacionLocal(index, 'id', nombre.toLowerCase().replace(/\s+/g, '_'));
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
                          onChange={(e) => {
                            actualizarVariacionLocal(index, 'tipo', e.target.value);
                            // Si cambia a checkbox, quitar seleccion_multiple
                            if (e.target.value === 'checkbox') {
                              actualizarVariacionLocal(index, 'seleccion_multiple', false);
                            }
                          }}
                          disabled={disabled}
                        >
                          <option value="select">Selección (Radio/Checkbox)</option>
                          <option value="checkbox">Sí/No (Checkbox)</option>
                        </select>
                        <p className="variacion-config-hint">
                          {variacion.tipo === 'select'
                            ? 'El cliente puede elegir una o varias opciones de una lista'
                            : 'El cliente puede marcar o desmarcar (Sí/No)'}
                        </p>
                      </div>

                      {variacion.tipo === 'select' && (
                        <>
                          <div className="variacion-config-field">
                            <label>
                              <input
                                type="checkbox"
                                checked={variacion.seleccion_multiple === true}
                                onChange={(e) => {
                                  actualizarVariacionLocal(index, 'seleccion_multiple', e.target.checked);
                                  // Si se desactiva selección múltiple, eliminar max_selecciones
                                  if (!e.target.checked) {
                                    actualizarVariacionLocal(index, 'max_selecciones', null);
                                  }
                                }}
                                disabled={disabled}
                              />
                              <span>Permitir selección múltiple</span>
                            </label>
                            <p className="variacion-config-hint">
                              Si está marcado, el cliente puede seleccionar varias opciones. Si no, solo puede seleccionar una.
                            </p>
                          </div>
                          
                          {variacion.seleccion_multiple && (
                            <div className="variacion-config-field">
                              <label>
                                Cantidad máxima de opciones seleccionables
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={variacion.max_selecciones || ''}
                                onChange={(e) => {
                                  const valor = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                  actualizarVariacionLocal(index, 'max_selecciones', valor);
                                }}
                                placeholder="Sin límite"
                                disabled={disabled}
                              />
                              <p className="variacion-config-hint">
                                Define cuántas opciones máximo puede seleccionar el cliente. Déjalo vacío para permitir todas.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="variacion-config-field">
                        <label>
                          <input
                            type="checkbox"
                            checked={variacion.requerido}
                            onChange={(e) => actualizarVariacionLocal(index, 'requerido', e.target.checked)}
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
                          onClick={async () => {
                            // Validar que tenga nombre y opciones si es select
                            if (!variacion.nombre || (variacion.tipo === 'select' && (!variacion.opciones || variacion.opciones.length === 0))) {
                              return;
                            }

                            try {
                              // Función auxiliar para verificar si un ID es un UUID válido
                              const isValidUUID = (id) => {
                                if (!id || typeof id !== 'string') return false;
                                // UUID v4 tiene el formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
                                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                                return uuidRegex.test(id);
                              };

                              // Si la variación no tiene ID real (es local o ID inválido), guardarla en la base de datos
                              if (!variacion.id || variacion.id.startsWith('variacion_') || !isValidUUID(variacion.id)) {
                                const nuevaVariacion = await crearVariacion.mutateAsync({
                                  organizationId: organization?.id,
                                  nombre: variacion.nombre,
                                  tipo: variacion.tipo,
                                  requerido: variacion.requerido || false,
                                  seleccion_multiple: variacion.seleccion_multiple || false,
                                  max_selecciones: variacion.max_selecciones || null,
                                  opciones: variacion.opciones || []
                                });

                                // Actualizar la variación local con el ID real de la base de datos
                                const actualizadas = [...variacionesList];
                                actualizadas[index] = {
                                  ...actualizadas[index],
                                  id: nuevaVariacion.id
                                };
                                setVariacionesList(actualizadas);
                                
                                // Refrescar la lista de variaciones disponibles para que aparezca en el módulo de variaciones
                                await refetchVariaciones();
                                
                                toast.success('Variación guardada en el sistema. Ya está disponible para otros productos.');
                              } else {
                                // Si la variación ya tiene ID real, actualizarla en la base de datos
                                await actualizarVariacion.mutateAsync({
                                  id: variacion.id,
                                  organizationId: organization?.id,
                                  nombre: variacion.nombre,
                                  tipo: variacion.tipo,
                                  requerido: variacion.requerido || false,
                                  seleccion_multiple: variacion.seleccion_multiple || false,
                                  max_selecciones: variacion.max_selecciones || null,
                                  opciones: variacion.opciones || []
                                });
                                
                                // Refrescar la lista de variaciones disponibles
                                await refetchVariaciones();
                                
                                toast.success('Variación actualizada correctamente');
                              }
                            } catch (error) {
                              console.error('Error guardando/actualizando variación:', error);
                              toast.error('Error al guardar la variación en el sistema');
                              return; // No cerrar el editor si hay error
                            }

                            setEditingIndex(null);
                          }}
                          disabled={!variacion.nombre || (variacion.tipo === 'select' && (!variacion.opciones || variacion.opciones.length === 0)) || crearVariacion.isLoading || actualizarVariacion.isLoading}
                        >
                          <Save size={14} />
                          {(crearVariacion.isLoading || actualizarVariacion.isLoading) ? 'Guardando...' : 'Guardar'}
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

      {/* Modal para configurar opciones de variación vinculada */}
      {configurandoOpciones && <ConfigurarOpcionesModal
        variacion={variacionesDisponibles.find(v => v.id === configurandoOpciones)}
        config={variacionesVinculadas.find(vv => typeof vv === 'object' ? vv.id === configurandoOpciones : false)}
        onClose={() => setConfigurandoOpciones(null)}
        onSave={(opcionesSeleccionadas, mostrarTodas) => {
          const nuevasVinculadas = variacionesVinculadas.map(vv => {
            if (typeof vv === 'object' && vv.id === configurandoOpciones) {
              return {
                ...vv,
                opciones_seleccionadas: mostrarTodas ? null : opcionesSeleccionadas
              };
            }
            // Convertir formato antiguo (string) a nuevo formato
            if (typeof vv === 'string' && vv === configurandoOpciones) {
              return {
                id: vv,
                opciones_seleccionadas: mostrarTodas ? null : opcionesSeleccionadas
              };
            }
            return vv;
          });
          // Si no existe, agregarlo
          if (!nuevasVinculadas.some(vv => (typeof vv === 'object' ? vv.id : vv) === configurandoOpciones)) {
            nuevasVinculadas.push({
              id: configurandoOpciones,
              opciones_seleccionadas: mostrarTodas ? null : opcionesSeleccionadas
            });
          }
          setVariacionesVinculadas(nuevasVinculadas);
          setConfigurandoOpciones(null);
        }}
      />}
    </div>
  );
};

// Componente modal para configurar opciones de variación vinculada
const ConfigurarOpcionesModal = ({ variacion, config, onClose, onSave }) => {
  const opcionesIniciales = config && typeof config === 'object' && config.opciones_seleccionadas 
    ? [...config.opciones_seleccionadas]
    : variacion && variacion.opciones 
      ? variacion.opciones.map(op => typeof op === 'string' ? op : op.valor)
      : [];
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState(opcionesIniciales);
  const [mostrarTodas, setMostrarTodas] = useState(!config || !config.opciones_seleccionadas);

  if (!variacion || variacion.tipo !== 'select' || !variacion.opciones) return null;

  return (
    <div className="variaciones-selector-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <motion.div
        className="variaciones-selector-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="variaciones-selector-header">
          <div className="variaciones-selector-header-content">
            <h3>{variacion.nombre}</h3>
            <div className="variacion-modal-badges">
              <span className={`variacion-badge-mini tipo-${variacion.tipo}`}>
                {variacion.tipo === 'select' ? 'Selección' : 'Sí/No'}
              </span>
              {variacion.requerido && (
                <span className="variacion-badge-mini requerido">Requerido</span>
              )}
              {variacion.seleccion_multiple && (
                <span className="variacion-badge-mini multiple">Múltiple</span>
              )}
              <span className="variacion-badge-mini opciones-count">
                {variacion.opciones?.length || 0} {variacion.opciones?.length === 1 ? 'opción' : 'opciones'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="variaciones-selector-close-btn">
            <X size={20} />
          </button>
        </div>
        <div className="variaciones-selector-content">
          <div className="variacion-opciones-toggle">
            <label className="variacion-opciones-toggle-label">
              <input
                type="checkbox"
                checked={mostrarTodas}
                onChange={(e) => {
                  setMostrarTodas(e.target.checked);
                  if (e.target.checked) {
                    setOpcionesSeleccionadas([]);
                  } else {
                    setOpcionesSeleccionadas(variacion.opciones.map(op => typeof op === 'string' ? op : op.valor));
                  }
                }}
              />
              <span className="variacion-opciones-toggle-text">Mostrar todas las opciones</span>
            </label>
            <p className="variacion-opciones-toggle-hint">
              Si está marcado, se mostrarán todas las opciones de esta variación. Si no, selecciona las opciones específicas que quieres mostrar para este producto.
            </p>
          </div>

          {!mostrarTodas && (
            <div className="variacion-opciones-selector">
              <h4 className="variacion-opciones-title">Opciones:</h4>
              <div className="variacion-opciones-grid">
                {variacion.opciones.map((opcion) => {
                  const valor = typeof opcion === 'string' ? opcion : opcion.valor;
                  const label = typeof opcion === 'string' ? opcion : opcion.label;
                  const isSelected = opcionesSeleccionadas.includes(valor);
                  return (
                    <label
                      key={valor}
                      className={`variacion-opcion-checkbox ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOpcionesSeleccionadas([...opcionesSeleccionadas, valor]);
                          } else {
                            setOpcionesSeleccionadas(opcionesSeleccionadas.filter(v => v !== valor));
                          }
                        }}
                      />
                      <span className="variacion-opcion-label">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
              <div className="variaciones-selector-footer">
                <button
                  className="variacion-btn-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  className="variacion-btn-primary"
                  onClick={() => onSave(opcionesSeleccionadas, mostrarTodas)}
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
  );
};

export default VariacionesConfig;
