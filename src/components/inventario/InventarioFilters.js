import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Search, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { ADDITIONAL_FIELDS } from '../../utils/productTypes';

import './InventarioFilters.css';

const InventarioFilters = ({ productos, onFilterChange, filters, onClose }) => {

  const [searchField, setSearchField] = useState('');
  const [activeFilterId, setActiveFilterId] = useState(null);
  


  // Definir campos filtrables
  const filterableFields = useMemo(() => {
    const fields = [
      { id: 'nombre', label: 'Nombre', type: 'text', field: 'nombre' },
      { id: 'codigo', label: 'Código', type: 'text', field: 'codigo' },
      { id: 'precio_venta', label: 'Precio Venta', type: 'number', field: 'precio_venta', range: true },
      { id: 'precio_compra', label: 'Precio Compra', type: 'number', field: 'precio_compra', range: true },
      { id: 'stock', label: 'Stock Total', type: 'number', field: 'stock', range: true },
      { id: 'created_at', label: 'Fecha Creación', type: 'date', field: 'created_at', range: true },
      { id: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date', field: 'fecha_vencimiento', range: true },
      { id: 'margen_utilidad', label: 'Margen Utilidad (%)', type: 'number', field: 'margen_utilidad', range: true, calculated: true },
    ];

    const metadataFields = [
      'categoria', 'marca', 'color', 'talla', 'material', 'alergenos', 'porcion', 
      'duracion', 'descripcion', 'ingredientes', 'peso', 'calorias', 'dimensiones'
    ];

    metadataFields.forEach(fieldId => {
      const fieldConfig = ADDITIONAL_FIELDS[fieldId];
      if (fieldConfig) {
        const uniqueValues = [...new Set(
          productos.map(p => p.metadata?.[fieldId]).filter(v => v !== null && v !== undefined && v !== '')
        )].sort();

        const fieldDefinition = {
          id: fieldId,
          label: fieldConfig.label,
          type: fieldConfig.type || 'text',
          field: fieldId,
          metadata: true
        };

        if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
          fieldDefinition.type = 'multiselect';
          fieldDefinition.options = uniqueValues.map(v => ({ value: v, label: v }));
          
          // Añadir opción de "Sin [campo]" para encontrar productos con campos vacíos
          fieldDefinition.options.unshift({ 
            value: '__sin_categoria__', // Mantenemos el ID interno para compatibilidad con la lógica de filtrado
            label: `Sin ${fieldConfig.label}` 
          });
        } else if (fieldConfig.type === 'number') {
          fieldDefinition.range = true;
        }

        fields.push(fieldDefinition);
      }
    });

    return fields;
  }, [productos]);

  const usedFields = useMemo(() => {
    return Object.keys(filters).map(key => {
      const match = key.match(/^(.+?)(_min|_max|_value|_condition|_multi)?$/);
      return match ? match[1] : key;
    });
  }, [filters]);

  const filteredFields = useMemo(() => {
    if (!searchField) return filterableFields;
    return filterableFields.filter(f => 
      f.label.toLowerCase().includes(searchField.toLowerCase())
    );
  }, [filterableFields, searchField]);

  const handleFilterChange = (fieldId, type, value) => {
    const newFilters = { ...filters };
    const key = type === 'value' ? fieldId : `${fieldId}_${type}`;
    
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFilterChange(newFilters);
  };

  const toggleMultiSelect = (fieldId, val) => {
    const newFilters = { ...filters };
    const key = `${fieldId}_multi`;
    const current = newFilters[key] || [];
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    
    if (next.length === 0) delete newFilters[key];
    else newFilters[key] = next;
    
    onFilterChange(newFilters);
  };

  const removeFilter = (fieldId) => {
    const newFilters = { ...filters };
    Object.keys(newFilters).forEach(key => {
      if (key.startsWith(fieldId)) delete newFilters[key];
    });
    onFilterChange(newFilters);
  };

  const renderControl = (field) => {
    if (field.type === 'multiselect') {
      const selected = filters[`${field.id}_multi`] || [];
      return (
        <div className="adv-filter-multi">
          {field.options.map(opt => (
            <button
              key={opt.value}
              className={`adv-multi-chip ${selected.includes(opt.value) ? 'active' : ''}`}
              onClick={() => toggleMultiSelect(field.id, opt.value)}
            >
              {selected.includes(opt.value) && <Check size={12} />}
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    if (field.range) {
      return (
        <div className="adv-filter-range">
          <input
            type={field.type === 'date' ? 'date' : 'number'}
            placeholder="Mín"
            value={filters[`${field.id}_min`] || ''}
            onChange={(e) => handleFilterChange(field.id, 'min', e.target.value)}
          />
          <span>-</span>
          <input
            type={field.type === 'date' ? 'date' : 'number'}
            placeholder="Máx"
            value={filters[`${field.id}_max`] || ''}
            onChange={(e) => handleFilterChange(field.id, 'max', e.target.value)}
          />
        </div>
      );
    }

    return (
      <input
        type={field.type === 'date' ? 'date' : 'text'}
        className="adv-filter-input"
        placeholder="Valor..."
        value={filters[`${field.id}_value`] || filters[field.id] || ''}
        onChange={(e) => handleFilterChange(field.id, 'value', e.target.value)}
      />
    );
  };

  return (
    <motion.div
      className="adv-filters-dropdown"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
    >
      <div className="adv-filters-header">
        <h3>Filtros Avanzados</h3>
        <button className="adv-clear-btn" onClick={() => onFilterChange({})}>Limpiar</button>
      </div>

      <div className="adv-search-container">
        <Search size={14} />
        <input 
          type="text" 
          placeholder="Buscar campo..." 
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
        />
      </div>

      <div className="adv-fields-list">
        {filteredFields.map(field => {
          const isActive = usedFields.includes(field.id);
          const isExpanded = activeFilterId === field.id;

          return (
            <div key={field.id} className={`adv-field-item ${isActive ? 'active' : ''}`}>
              <div 
                className="adv-field-label-row"
                onClick={() => setActiveFilterId(isExpanded ? null : field.id)}
              >
                <div className="adv-field-info">
                  <span className="adv-field-dot" />
                  <span className="adv-field-name">{field.label}</span>
                </div>
                <div className="adv-field-actions">
                  {isActive && (
                    <button className="adv-remove-icon" onClick={(e) => { e.stopPropagation(); removeFilter(field.id); }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>

              {isExpanded && (
                <div className="adv-field-control-wrapper">
                  {renderControl(field)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="adv-filters-footer">
        <button className="adv-close-btn" onClick={onClose}>Listo</button>
      </div>
    </motion.div>
  );
};

export default InventarioFilters;
