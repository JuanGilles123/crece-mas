// 🎯 Componente para seleccionar variaciones/opciones de un producto
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import './VariacionesSelector.css';

const VariacionesSelector = ({
  open,
  onClose,
  producto,
  onConfirm
}) => {
  const [selecciones, setSelecciones] = useState({});

  // Cargar variaciones del producto desde metadata (memoizado para evitar cambios en cada render)
  const variaciones = useMemo(() => {
    return producto?.metadata?.variaciones_config || [];
  }, [producto?.metadata?.variaciones_config]);

  // Inicializar selecciones cuando se abre el modal
  useEffect(() => {
    if (open && variaciones.length > 0) {
      const iniciales = {};
      variaciones.forEach(variacion => {
        const variacionKey = variacion.id || variacion.nombre;
        // Si es checkbox y no es requerido, por defecto "no"
        if (variacion.tipo === 'checkbox' && !variacion.requerido) {
          iniciales[variacionKey] = 'no';
        }
        // Si es select con selección múltiple, inicializar como array vacío
        if (variacion.tipo === 'select' && variacion.seleccion_multiple) {
          iniciales[variacionKey] = [];
        }
        // Si es select sin selección múltiple y tiene opción por defecto, usarla
        else if (variacion.tipo === 'select' && !variacion.seleccion_multiple && variacion.opcion_default) {
          iniciales[variacionKey] = variacion.opcion_default;
        }
      });
      setSelecciones(iniciales);
    } else if (!open) {
      setSelecciones({});
    }
  }, [open, variaciones]);

  const handleSelectChange = (variacionId, valor, esMultiple = false) => {
    if (esMultiple) {
      setSelecciones(prev => {
        const seleccionActual = prev[variacionId] || [];
        const nuevaSeleccion = Array.isArray(seleccionActual) ? [...seleccionActual] : [];
        const indice = nuevaSeleccion.indexOf(valor);
        
        if (indice >= 0) {
          // Si ya está seleccionado, quitarlo
          nuevaSeleccion.splice(indice, 1);
        } else {
          // Si no está seleccionado, agregarlo
          nuevaSeleccion.push(valor);
        }
        
        return {
          ...prev,
          [variacionId]: nuevaSeleccion
        };
      });
    } else {
      setSelecciones(prev => ({
        ...prev,
        [variacionId]: valor
      }));
    }
  };

  const handleCheckboxChange = (variacionId, checked) => {
    setSelecciones(prev => ({
      ...prev,
      [variacionId]: checked ? 'si' : 'no'
    }));
  };

  const handleConfirm = () => {
    // Validar variaciones requeridas
    const faltantes = variaciones
      .filter(v => {
        if (!v.requerido) return false;
        const variacionKey = v.id || v.nombre;
        const seleccion = selecciones[variacionKey];
        // Para checkbox, "no" cuenta como no seleccionado si es requerido
        if (v.tipo === 'checkbox' && seleccion === 'no') return true;
        // Para select con selección múltiple, debe tener al menos un valor
        if (v.tipo === 'select' && v.seleccion_multiple) {
          if (!Array.isArray(seleccion) || seleccion.length === 0) return true;
        }
        // Para select sin selección múltiple, debe tener un valor
        else if (v.tipo === 'select' && !v.seleccion_multiple && !seleccion) {
          return true;
        }
        return false;
      })
      .map(v => v.nombre);

    if (faltantes.length > 0) {
      toast.error(`Debes seleccionar: ${faltantes.join(', ')}`);
      return;
    }

    // Transformar selecciones para usar nombres como claves en lugar de IDs
    const seleccionesConNombres = {};
    variaciones.forEach(v => {
      const variacionKey = v.id || v.nombre;
      if (selecciones[variacionKey] !== undefined) {
        // Usar el nombre como clave, no el ID
        seleccionesConNombres[v.nombre] = selecciones[variacionKey];
      }
    });

    onConfirm(seleccionesConNombres);
  };

  if (!open) return null;

  return (
    <div className="variaciones-selector-overlay" onClick={onClose}>
      <motion.div
        className="variaciones-selector-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="variaciones-selector-header">
          <div>
            <h3>Variaciones: {producto?.nombre}</h3>
            <p className="variaciones-producto-subtitle">
              Selecciona las opciones para este producto
            </p>
          </div>
          <button className="variaciones-selector-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="variaciones-selector-content">
          {variaciones.length === 0 ? (
            <div className="variaciones-selector-empty">
              <p>Este producto no tiene variaciones configuradas</p>
            </div>
          ) : (
            variaciones.map((variacion) => (
              <div key={variacion.id || variacion.nombre} className="variacion-group">
                <label className="variacion-label">
                  {variacion.nombre}
                  {variacion.requerido && <span className="variacion-required">*</span>}
                </label>

                {variacion.tipo === 'select' ? (
                  <div className="variacion-options">
                    {variacion.opciones?.map((opcion) => {
                      const valor = typeof opcion === 'string' ? opcion : opcion.valor;
                      const label = typeof opcion === 'string' ? opcion : opcion.label;
                      const variacionKey = variacion.id || variacion.nombre;
                      const esMultiple = variacion.seleccion_multiple === true;
                      const seleccionActual = selecciones[variacionKey];
                      
                      // Determinar si está seleccionado
                      const isSelected = esMultiple
                        ? (Array.isArray(seleccionActual) && seleccionActual.includes(valor))
                        : (seleccionActual === valor);

                      return (
                        <label
                          key={valor}
                          className={`variacion-option ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type={esMultiple ? "checkbox" : "radio"}
                            name={variacionKey}
                            value={valor}
                            checked={isSelected}
                            onChange={() => handleSelectChange(variacionKey, valor, esMultiple)}
                          />
                          <span className="variacion-option-label">{label}</span>
                          {isSelected && (
                            <Check size={14} className="variacion-option-check" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="variacion-checkbox-group">
                    <label className="variacion-checkbox-option">
                      <input
                        type="checkbox"
                        checked={selecciones[variacion.id || variacion.nombre] === 'si'}
                        onChange={(e) => handleCheckboxChange(variacion.id || variacion.nombre, e.target.checked)}
                      />
                      <span className="variacion-checkbox-label">Sí</span>
                      {selecciones[variacion.id || variacion.nombre] === 'si' && (
                        <Check size={16} className="variacion-checkbox-check" />
                      )}
                    </label>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="variaciones-selector-footer">
          <div className="variaciones-selector-actions">
            <button className="variacion-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="variacion-btn-primary" onClick={handleConfirm}>
              Agregar al Pedido
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VariacionesSelector;
