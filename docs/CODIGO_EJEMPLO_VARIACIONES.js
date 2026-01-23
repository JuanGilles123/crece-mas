// 📝 EJEMPLO DE CÓDIGO: Sistema de Variaciones

// ============================================
// 1. COMPONENTE: VariacionesSelector.js
// ============================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import './VariacionesSelector.css';

const VariacionesSelector = ({ 
  open, 
  onClose, 
  producto, 
  onConfirm 
}) => {
  const [selecciones, setSelecciones] = useState({});

  // Cargar variaciones del producto
  const variaciones = producto?.metadata?.variaciones_config || [];

  const handleSelectChange = (variacionId, valor) => {
    setSelecciones(prev => ({
      ...prev,
      [variacionId]: valor
    }));
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
      .filter(v => v.requerido && !selecciones[v.id])
      .map(v => v.nombre);

    if (faltantes.length > 0) {
      toast.error(`Debes seleccionar: ${faltantes.join(', ')}`);
      return;
    }

    onConfirm(selecciones);
  };

  if (!open) return null;

  return (
    <div className="variaciones-selector-overlay" onClick={onClose}>
      <motion.div
        className="variaciones-selector-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="variaciones-selector-header">
          <h3>Variaciones: {producto.nombre}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="variaciones-selector-content">
          {variaciones.map((variacion) => (
            <div key={variacion.id} className="variacion-group">
              <label>
                {variacion.nombre}
                {variacion.requerido && <span className="required">*</span>}
              </label>

              {variacion.tipo === 'select' ? (
                <div className="variacion-options">
                  {variacion.opciones.map((opcion) => (
                    <label key={opcion.valor} className="variacion-option">
                      <input
                        type="radio"
                        name={variacion.id}
                        value={opcion.valor}
                        checked={selecciones[variacion.id] === opcion.valor}
                        onChange={() => handleSelectChange(variacion.id, opcion.valor)}
                      />
                      <span>{opcion.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="variacion-checkbox">
                  <label className="variacion-option">
                    <input
                      type="checkbox"
                      checked={selecciones[variacion.id] === 'si'}
                      onChange={(e) => handleCheckboxChange(variacion.id, e.target.checked)}
                    />
                    <span>Sí</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="variaciones-selector-footer">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleConfirm} className="btn-primary">
            Agregar al Pedido
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VariacionesSelector;


// ============================================
// 2. USO EN TomarPedido.js
// ============================================

// Estado para variaciones
const [mostrandoVariaciones, setMostrandoVariaciones] = useState(false);
const [productoParaVariaciones, setProductoParaVariaciones] = useState(null);

// Función para detectar si un producto tiene variaciones
const tieneVariaciones = (producto) => {
  const variaciones = producto?.metadata?.variaciones_config;
  return variaciones && variaciones.length > 0;
};

// Modificar handleSeleccionarProducto
const handleSeleccionarProducto = (producto) => {
  if (tieneVariaciones(producto)) {
    // Si tiene variaciones, mostrar selector
    setProductoParaVariaciones(producto);
    setMostrandoVariaciones(true);
  } else {
    // Si no tiene variaciones, agregar directamente
    agregarItem(producto, [], producto.precio_venta);
  }
};

// Modificar agregarItem para incluir variaciones
const agregarItem = (producto, toppings = [], precioTotal, variaciones = {}) => {
  setItems(prev => {
    // Crear clave única incluyendo variaciones
    const variacionesKey = JSON.stringify(variaciones);
    const idx = prev.findIndex(i =>
      i.producto_id === producto.id &&
      JSON.stringify(i.toppings || []) === JSON.stringify(toppings) &&
      JSON.stringify(i.variaciones || {}) === variacionesKey
    );

    if (idx >= 0) {
      // Si existe, aumentar cantidad
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        cantidad: next[idx].cantidad + 1,
        precio_total: precioTotal * (next[idx].cantidad + 1)
      };
      return next;
    }

    // Si no existe, agregar nuevo
    return [...prev, {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      producto_imagen: producto.imagen,
      cantidad: 1,
      precio_unitario: producto.precio_venta,
      precio_total: precioTotal,
      toppings: toppings.length > 0 ? toppings : [],
      variaciones: variaciones, // ← NUEVO
      notas: ''
    }];
  });
};

// Handler para confirmar variaciones
const handleVariacionesConfirm = (variaciones) => {
  if (!productoParaVariaciones) return;
  
  agregarItem(
    productoParaVariaciones,
    [],
    productoParaVariaciones.precio_venta,
    variaciones // ← Pasar variaciones seleccionadas
  );
  
  setMostrandoVariaciones(false);
  setProductoParaVariaciones(null);
};

// En el JSX, agregar el selector
{mostrandoVariaciones && productoParaVariaciones && (
  <VariacionesSelector
    open={mostrandoVariaciones}
    onClose={() => {
      setMostrandoVariaciones(false);
      setProductoParaVariaciones(null);
    }}
    producto={productoParaVariaciones}
    onConfirm={handleVariacionesConfirm}
  />
)}


// ============================================
// 3. MOSTRAR EN PanelCocina.js
// ============================================

// En PedidoCard, mostrar variaciones
{pedido.items && pedido.items.slice(0, 3).map((item, idx) => (
  <span key={idx} className="pedido-item-preview">
    {item.cantidad}x {item.producto?.nombre || 'Producto'}
    
    {/* Mostrar variaciones si existen */}
    {item.variaciones_seleccionadas && 
     Object.keys(item.variaciones_seleccionadas).length > 0 && (
      <span className="pedido-item-variaciones">
        {' | '}
        {Object.entries(item.variaciones_seleccionadas).map(([key, value], i) => {
          // Buscar el label de la opción
          const variacion = item.producto?.metadata?.variaciones_config?.find(v => v.id === key);
          const opcion = variacion?.opciones?.find(o => o.valor === value);
          const label = opcion?.label || value;
          
          return (
            <span key={i}>
              {variacion?.nombre}: {label}
              {i < Object.keys(item.variaciones_seleccionadas).length - 1 && ', '}
            </span>
          );
        })}
      </span>
    )}
    
    {item.notas_item && (
      <span className="pedido-item-notas-preview"> • {item.notas_item}</span>
    )}
  </span>
))}


// ============================================
// 4. GUARDAR EN usePedidos.js
// ============================================

// Al crear el pedido, incluir variaciones_seleccionadas
items.forEach(async (item) => {
  await supabase.from('pedido_items').insert({
    pedido_id: pedidoResult.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    precio_total: item.precio_total,
    toppings: item.toppings || [],
    variaciones_seleccionadas: item.variaciones || {}, // ← NUEVO
    notas_item: item.notas || null
  });
});


// ============================================
// 5. ESTILOS CSS (VariacionesSelector.css)
// ============================================

.variaciones-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.variaciones-selector-modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.variacion-group {
  margin-bottom: 1.5rem;
}

.variacion-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.variacion-group .required {
  color: var(--accent-error);
}

.variacion-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variacion-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.variacion-option:hover {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.05);
}

.variacion-option input[type="radio"]:checked + span,
.variacion-option input[type="checkbox"]:checked + span {
  font-weight: 600;
  color: var(--accent-primary);
}

.variacion-option input[type="radio"]:checked ~ *,
.variacion-option:has(input[type="radio"]:checked) {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.1);
}

.pedido-item-variaciones {
  color: var(--accent-primary);
  font-weight: 500;
  font-size: 0.9em;
}
