import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Percent, DollarSign, Package, ShoppingCart, Check } from 'lucide-react';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import './DescuentoModal.css';

const DescuentoModal = ({ isOpen, onClose, onAplicar, cart, descuentoActual }) => {
  const [tipoDescuento, setTipoDescuento] = useState(descuentoActual?.tipo || 'porcentaje');
  const [alcance, setAlcance] = useState(descuentoActual?.alcance || 'total');
  const [productosSeleccionados, setProductosSeleccionados] = useState(descuentoActual?.productosIds || []);
  const valorPorcentajeInput = useCurrencyInput(descuentoActual?.tipo === 'porcentaje' ? descuentoActual.valor.toString() : '');
  const valorFijoInput = useCurrencyInput(descuentoActual?.tipo === 'fijo' ? descuentoActual.valor.toString() : '');

  useEffect(() => {
    if (descuentoActual) {
      setTipoDescuento(descuentoActual.tipo);
      setAlcance(descuentoActual.alcance);
      setProductosSeleccionados(descuentoActual.productosIds || []);
      if (descuentoActual.tipo === 'porcentaje') {
        valorPorcentajeInput.setValue(descuentoActual.valor);
      } else {
        valorFijoInput.setValue(descuentoActual.valor);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descuentoActual]);

  const handleAplicar = () => {
    const valor = tipoDescuento === 'porcentaje' 
      ? valorPorcentajeInput.numericValue 
      : valorFijoInput.numericValue;

    if (!valor || valor <= 0) {
      return;
    }

    if (tipoDescuento === 'porcentaje' && valor > 100) {
      return;
    }

    if (alcance === 'productos' && productosSeleccionados.length === 0) {
      return;
    }

    onAplicar({
      tipo: tipoDescuento,
      valor: valor,
      alcance: alcance,
      productosIds: alcance === 'productos' ? productosSeleccionados : []
    });
    onClose();
  };

  const toggleProducto = (productoId) => {
    setProductosSeleccionados(prev => {
      if (prev.includes(productoId)) {
        return prev.filter(id => id !== productoId);
      } else {
        return [...prev, productoId];
      }
    });
  };

  const toggleTodosProductos = () => {
    if (productosSeleccionados.length === cart.length) {
      setProductosSeleccionados([]);
    } else {
      setProductosSeleccionados(cart.map(item => item.id));
    }
  };

  if (!isOpen) return null;

  const valor = tipoDescuento === 'porcentaje' 
    ? valorPorcentajeInput.numericValue 
    : valorFijoInput.numericValue;

  const puedeAplicar = valor > 0 && 
    (tipoDescuento !== 'porcentaje' || valor <= 100) &&
    (alcance !== 'productos' || productosSeleccionados.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        className="descuento-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="descuento-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="descuento-modal-header">
            <div className="descuento-modal-title">
              <Percent size={24} />
              <h2>Aplicar Descuento</h2>
            </div>
            <button
              className="descuento-modal-close"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="descuento-modal-content">
            {/* Tipo de descuento */}
            <div className="descuento-section">
              <label className="descuento-label">Tipo de Descuento</label>
              <div className="descuento-options">
                <button
                  className={`descuento-option ${tipoDescuento === 'porcentaje' ? 'active' : ''}`}
                  onClick={() => setTipoDescuento('porcentaje')}
                >
                  <Percent size={18} />
                  <span>Porcentaje (%)</span>
                </button>
                <button
                  className={`descuento-option ${tipoDescuento === 'fijo' ? 'active' : ''}`}
                  onClick={() => setTipoDescuento('fijo')}
                >
                  <DollarSign size={18} />
                  <span>Valor Fijo</span>
                </button>
              </div>
            </div>

            {/* Valor del descuento */}
            <div className="descuento-section">
              <label className="descuento-label">
                {tipoDescuento === 'porcentaje' ? 'Porcentaje' : 'Valor del Descuento'}
                {tipoDescuento === 'porcentaje' && <span className="required">*</span>}
              </label>
              <div className="descuento-input-wrapper">
                {tipoDescuento === 'porcentaje' ? (
                  <>
                    <input
                      type="text"
                      className="descuento-input"
                      placeholder="0"
                      value={valorPorcentajeInput.displayValue}
                      onChange={(e) => valorPorcentajeInput.handleChange(e)}
                      maxLength={3}
                    />
                    <span className="descuento-input-suffix">%</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={20} className="descuento-input-icon" />
                    <input
                      type="text"
                      className="descuento-input"
                      placeholder="0"
                      value={valorFijoInput.displayValue}
                      onChange={(e) => valorFijoInput.handleChange(e)}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Alcance del descuento */}
            <div className="descuento-section">
              <label className="descuento-label">Aplicar a</label>
              <div className="descuento-options">
                <button
                  className={`descuento-option ${alcance === 'total' ? 'active' : ''}`}
                  onClick={() => setAlcance('total')}
                >
                  <ShoppingCart size={18} />
                  <span>Total de la Venta</span>
                </button>
                <button
                  className={`descuento-option ${alcance === 'productos' ? 'active' : ''}`}
                  onClick={() => setAlcance('productos')}
                >
                  <Package size={18} />
                  <span>Productos Específicos</span>
                </button>
              </div>
            </div>

            {/* Selección de productos */}
            {alcance === 'productos' && (
              <div className="descuento-section">
                <div className="descuento-productos-header">
                  <label className="descuento-label">Seleccionar Productos</label>
                  <button
                    className="descuento-toggle-all"
                    onClick={toggleTodosProductos}
                  >
                    {productosSeleccionados.length === cart.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>
                </div>
                <div className="descuento-productos-list">
                  {cart.map((item) => {
                    const estaSeleccionado = productosSeleccionados.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`descuento-producto-item ${estaSeleccionado ? 'selected' : ''}`}
                        onClick={() => toggleProducto(item.id)}
                      >
                        <div className="descuento-producto-check">
                          {estaSeleccionado && <Check size={16} />}
                        </div>
                        <div className="descuento-producto-info">
                          <span className="descuento-producto-name">{item.nombre}</span>
                          <span className="descuento-producto-price">
                            {item.qty} x {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.precio_venta)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="descuento-modal-footer">
            <button
              className="descuento-btn-cancelar"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="descuento-btn-aplicar"
              onClick={handleAplicar}
              disabled={!puedeAplicar}
            >
              Aplicar Descuento
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DescuentoModal;
