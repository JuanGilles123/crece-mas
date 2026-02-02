import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Check } from 'lucide-react';
import { ADDITIONAL_FIELDS } from '../../utils/productTypes';
import { useAuth } from '../../context/AuthContext';
import './InventarioFilters.css';

const InventarioFilters = ({ productos, onFilterChange, filters }) => {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState(null);
  const umbralStockBajo = Number(user?.user_metadata?.umbralStockBajo ?? 10);
  const umbralStockBajoSeguro = Number.isFinite(umbralStockBajo) && umbralStockBajo > 0 ? umbralStockBajo : 10;
  // Definir campos filtrables con su configuración
  const filterableFields = useMemo(() => {
    const fields = [
      // Campos base
      {
        id: 'nombre',
        label: 'Nombre',
        type: 'text',
        field: 'nombre',
        searchType: 'contains',
        compact: true
      },
      {
        id: 'codigo',
        label: 'Código',
        type: 'text',
        field: 'codigo',
        searchType: 'contains',
        compact: true
      },
      {
        id: 'tipo',
        label: 'Tipo',
        type: 'multiselect',
        field: 'tipo',
        options: [
          { value: 'fisico', label: 'Físico' },
          { value: 'servicio', label: 'Servicio' },
          { value: 'comida', label: 'Comida' },
          { value: 'accesorio', label: 'Accesorio' }
        ],
        compact: true
      },
      {
        id: 'precio_venta',
        label: 'Precio Venta',
        type: 'number',
        field: 'precio_venta',
        range: true,
        compact: true
      },
      {
        id: 'precio_compra',
        label: 'Precio Compra',
        type: 'number',
        field: 'precio_compra',
        range: true,
        compact: true
      },
      {
        id: 'stock',
        label: 'Stock',
        type: 'number',
        field: 'stock',
        range: true,
        quickOptions: [
          { value: 'bajo', label: `Stock Bajo (<=${umbralStockBajoSeguro})`, type: 'condition' },
          { value: 'sin', label: 'Sin Stock', type: 'condition' },
          { value: 'con', label: 'Con Stock', type: 'condition' }
        ],
        compact: true
      },
      {
        id: 'created_at',
        label: 'Fecha Creación',
        type: 'date',
        field: 'created_at',
        range: true,
        quickOptions: [
          { value: 'hoy', label: 'Hoy' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mes' },
          { value: 'tres-meses', label: '3 Meses' }
        ],
        compact: true
      },
      {
        id: 'fecha_vencimiento',
        label: 'Fecha Vencimiento',
        type: 'date',
        field: 'fecha_vencimiento',
        range: true,
        metadata: false,
        quickOptions: [
          { value: 'proximo', label: 'Próximos a vencer (7 días)' }
        ],
        compact: true
      },
      // Campos calculados
      {
        id: 'margen_utilidad',
        label: 'Margen Utilidad (%)',
        type: 'number',
        field: 'margen_utilidad',
        range: true,
        calculated: true,
        compact: true
      },
      {
        id: 'alta_utilidad',
        label: 'Alta Utilidad',
        type: 'boolean',
        field: 'alta_utilidad',
        calculated: true,
        compact: true
      }
    ];

    // Agregar campos de metadata con opciones dinámicas
    const metadataFields = [
      'categoria',
      'marca',
      'color',
      'talla',
      'material',
      'alergenos',
      'porcion',
      'duracion',
      'descripcion',
      'ingredientes',
      'variaciones',
      'peso',
      'calorias',
      'dimensiones'
    ];

    metadataFields.forEach(fieldId => {
      const fieldConfig = ADDITIONAL_FIELDS[fieldId];
      if (fieldConfig) {
        // Obtener valores únicos del campo en metadata
        const uniqueValues = [...new Set(
          productos
            .map(p => p.metadata?.[fieldId])
            .filter(v => v !== null && v !== undefined && v !== '')
        )].sort();

        const fieldDefinition = {
          id: fieldId,
          label: fieldConfig.label,
          type: fieldConfig.type || 'text',
          field: fieldId,
          metadata: true,
          searchType: ['text', 'textarea'].includes(fieldConfig.type) ? 'contains' : 'exact',
          compact: true
        };

        // Si hay valores únicos (hasta 15), convertirlo en multiselect
        if (uniqueValues.length > 0 && uniqueValues.length <= 15) {
          fieldDefinition.type = 'multiselect';
          fieldDefinition.options = uniqueValues.map(v => ({ value: v, label: v }));
        } else if (uniqueValues.length > 15) {
          // Muchos valores, mantener como texto con autocompletado visual
          fieldDefinition.type = 'text';
          fieldDefinition.suggestions = uniqueValues.slice(0, 10);
        }

        // Si tiene opciones predefinidas (como unidad_peso)
        if (fieldConfig.options) {
          fieldDefinition.type = 'multiselect';
          fieldDefinition.options = fieldConfig.options.map(opt => ({ value: opt, label: opt }));
        }

        // Si es number, permitir rango
        if (fieldConfig.type === 'number') {
          fieldDefinition.range = true;
        }

        fields.push(fieldDefinition);
      }
    });

    return fields;
  }, [productos, umbralStockBajoSeguro]);

  // Obtener campos ya usados en filtros
  const usedFields = useMemo(() => {
    return Object.keys(filters).map(key => {
      const match = key.match(/^(.+?)(_min|_max|_value|_condition|_multi)?$/);
      return match ? match[1] : key;
    });
  }, [filters]);

  // Campos disponibles para agregar (no usados)
  const availableFields = useMemo(() => {
    return filterableFields.filter(field => !usedFields.includes(field.id));
  }, [filterableFields, usedFields]);

  const handleFilterChange = (fieldId, value) => {
    const newFilters = { ...filters };
    
    if (value === null || value === undefined || value === '') {
      // Eliminar todos los filtros de este campo
      Object.keys(newFilters).forEach(key => {
        if (key.startsWith(fieldId + '_') || key === fieldId) {
          delete newFilters[key];
        }
      });
    } else {
      newFilters[fieldId + '_value'] = value;
    }
    
    onFilterChange(newFilters);
  };

  const handleMultiSelectChange = (fieldId, optionValue) => {
    const newFilters = { ...filters };
    const key = `${fieldId}_multi`;
    const currentValues = newFilters[key] || [];
    
    if (currentValues.includes(optionValue)) {
      // Remover
      newFilters[key] = currentValues.filter(v => v !== optionValue);
      if (newFilters[key].length === 0) {
        delete newFilters[key];
      }
    } else {
      // Agregar
      newFilters[key] = [...currentValues, optionValue];
    }
    
    onFilterChange(newFilters);
  };

  const handleRangeFilterChange = (fieldId, type, value) => {
    const newFilters = { ...filters };
    const key = `${fieldId}_${type}`;
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onFilterChange(newFilters);
  };

  const handleQuickOption = (fieldId, option) => {
    const newFilters = { ...filters };
    const key = `${fieldId}_condition`;
    
    if (newFilters[key] === option.value) {
      delete newFilters[key];
    } else {
      newFilters[key] = option.value;
    }
    
    onFilterChange(newFilters);
  };

  const removeFilter = (fieldId) => {
    const newFilters = { ...filters };
    Object.keys(newFilters).forEach(key => {
      if (key.startsWith(fieldId + '_') || key === fieldId) {
        delete newFilters[key];
      }
    });
    onFilterChange(newFilters);
    setActiveFilterId(null);
  };

  const clearAllFilters = () => {
    onFilterChange({});
    setActiveFilterId(null);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const getFilterValue = (fieldId) => {
    return filters[`${fieldId}_value`] || filters[fieldId] || '';
  };

  const getFilterMultiValues = (fieldId) => {
    return filters[`${fieldId}_multi`] || [];
  };

  const getFilterRange = (fieldId, type) => {
    return filters[`${fieldId}_${type}`] || '';
  };

  const getFilterCondition = (fieldId) => {
    return filters[`${fieldId}_condition`] || null;
  };

  const renderFilterControl = (field) => {
    const currentValue = getFilterValue(field.id);
    const currentMultiValues = getFilterMultiValues(field.id);
    const currentCondition = getFilterCondition(field.id);

    if (field.type === 'multiselect') {
      return (
        <div className="inventario-filter-multiselect">
          {field.options?.map(opt => {
            const isSelected = currentMultiValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={`inventario-filter-multi-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => handleMultiSelectChange(field.id, opt.value)}
              >
                {isSelected && <Check size={14} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <select
          className="inventario-filter-select"
          value={currentValue}
          onChange={(e) => handleFilterChange(field.id, e.target.value || null)}
        >
          <option value="">Seleccione...</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'number' && field.range) {
      const minValue = getFilterRange(field.id, 'min');
      const maxValue = getFilterRange(field.id, 'max');
      
      return (
        <div className="inventario-filter-range-group">
          {field.quickOptions && (
            <div className="inventario-filter-quick-options">
              {field.quickOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`inventario-filter-quick-btn ${currentCondition === opt.value ? 'active' : ''}`}
                  onClick={() => handleQuickOption(field.id, opt)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div className="inventario-filter-range">
            <input
              type="number"
              className="inventario-filter-input"
              placeholder="Mín"
              value={minValue}
              onChange={(e) => handleRangeFilterChange(field.id, 'min', e.target.value ? Number(e.target.value) : null)}
            />
            <span className="inventario-filter-separator">-</span>
            <input
              type="number"
              className="inventario-filter-input"
              placeholder="Máx"
              value={maxValue}
              onChange={(e) => handleRangeFilterChange(field.id, 'max', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          className="inventario-filter-input"
          placeholder="Valor"
          value={currentValue}
          onChange={(e) => handleFilterChange(field.id, e.target.value ? Number(e.target.value) : null)}
        />
      );
    }

    if (field.type === 'date' && field.range) {
      const minValue = getFilterRange(field.id, 'min');
      const maxValue = getFilterRange(field.id, 'max');
      
      return (
        <div className="inventario-filter-range-group">
          {field.quickOptions && (
            <div className="inventario-filter-quick-options">
              {field.quickOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`inventario-filter-quick-btn ${currentValue === opt.value ? 'active' : ''}`}
                  onClick={() => handleFilterChange(field.id, currentValue === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div className="inventario-filter-range">
            <input
              type="date"
              className="inventario-filter-input"
              value={minValue}
              onChange={(e) => handleRangeFilterChange(field.id, 'min', e.target.value || null)}
            />
            <span className="inventario-filter-separator">-</span>
            <input
              type="date"
              className="inventario-filter-input"
              value={maxValue}
              onChange={(e) => handleRangeFilterChange(field.id, 'max', e.target.value || null)}
            />
          </div>
        </div>
      );
    }

    if (field.type === 'date') {
      return (
        <input
          type="date"
          className="inventario-filter-input"
          value={currentValue}
          onChange={(e) => handleFilterChange(field.id, e.target.value || null)}
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <button
          type="button"
          className={`inventario-filter-toggle ${currentValue ? 'active' : ''}`}
          onClick={() => handleFilterChange(field.id, currentValue ? null : true)}
        >
          {currentValue ? 'Sí' : 'No'}
        </button>
      );
    }

    // Por defecto: texto
    return (
      <input
        type="text"
        className="inventario-filter-input"
        placeholder={`Buscar por ${field.label.toLowerCase()}...`}
        value={currentValue}
        onChange={(e) => handleFilterChange(field.id, e.target.value || null)}
      />
    );
  };

  const getActiveFilters = () => {
    const active = [];
    Object.keys(filters).forEach(key => {
      const match = key.match(/^(.+?)(_(min|max|value|condition|multi))?$/);
      if (match) {
        const fieldId = match[1];
        const field = filterableFields.find(f => f.id === fieldId);
        if (field && !active.find(a => a.id === fieldId)) {
          active.push(field);
        }
      }
    });
    return active;
  };

  const getActiveFilterLabel = (field) => {
    const multiValues = getFilterMultiValues(field.id);
    if (multiValues.length > 0) {
      return `${field.label}: ${multiValues.length} seleccionado${multiValues.length > 1 ? 's' : ''}`;
    }
    
    const value = getFilterValue(field.id);
    if (value) {
      if (field.type === 'multiselect') {
        const selected = field.options?.filter(opt => opt.value === value).map(opt => opt.label).join(', ');
        return `${field.label}: ${selected}`;
      }
      return `${field.label}: ${value}`;
    }
    
    const condition = getFilterCondition(field.id);
    if (condition) {
      const opt = field.quickOptions?.find(o => o.value === condition);
      return `${field.label}: ${opt?.label || condition}`;
    }
    
    const min = getFilterRange(field.id, 'min');
    const max = getFilterRange(field.id, 'max');
    if (min || max) {
      return `${field.label}: ${min || '∞'} - ${max || '∞'}`;
    }
    
    return field.label;
  };

  return (
    <div className="inventario-filters-container">
      <div className="inventario-filters-header">
        <button
          className="inventario-filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="inventario-filters-badge">
              {Object.keys(filters).length}
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            className="inventario-filters-clear-all"
            onClick={clearAllFilters}
          >
            <X size={16} />
            Limpiar todo
          </button>
        )}

        <div className="inventario-filters-add">
          <select
            className="inventario-filter-field-selector"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setActiveFilterId(e.target.value);
                setShowFilters(true);
              }
            }}
            disabled={availableFields.length === 0}
          >
            <option value="">+ Agregar filtro</option>
            {availableFields.map(field => (
              <option key={field.id} value={field.id}>{field.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros activos siempre visibles */}
      {hasActiveFilters && (
        <div className="inventario-filters-active-bar">
          <div className="inventario-filters-active-chips">
            {getActiveFilters().map(field => (
              <span key={field.id} className="inventario-filter-active-chip">
                {getActiveFilterLabel(field)}
                <button onClick={() => removeFilter(field.id)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="inventario-filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inventario-filters-grid">
              {/* Mostrar filtros activos */}
              {getActiveFilters().map(field => (
                <div key={field.id} className={`inventario-filter-item ${field.compact ? 'compact' : ''}`}>
                  <div className="inventario-filter-item-header">
                    <label className="inventario-filter-label">{field.label}</label>
                    <button
                      className="inventario-filter-remove"
                      onClick={() => removeFilter(field.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="inventario-filter-control">
                    {renderFilterControl(field)}
                  </div>
                </div>
              ))}

              {/* Mostrar campo seleccionado para agregar */}
              {activeFilterId && availableFields.find(f => f.id === activeFilterId) && (
                <div className={`inventario-filter-item ${availableFields.find(f => f.id === activeFilterId)?.compact ? 'compact' : ''}`}>
                  <div className="inventario-filter-item-header">
                    <label className="inventario-filter-label">
                      {availableFields.find(f => f.id === activeFilterId)?.label}
                    </label>
                    <button
                      className="inventario-filter-remove"
                      onClick={() => {
                        setActiveFilterId(null);
                        const select = document.querySelector('.inventario-filter-field-selector');
                        if (select) select.value = '';
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="inventario-filter-control">
                    {renderFilterControl(availableFields.find(f => f.id === activeFilterId))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay filtros */}
              {!hasActiveFilters && !activeFilterId && (
                <div className="inventario-filters-empty">
                  <p>No hay filtros activos. Agrega uno usando el selector arriba.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventarioFilters;
