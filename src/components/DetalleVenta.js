import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, CreditCard, Smartphone, Calendar, User, CheckCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './DetalleVenta.css';

function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DetalleVenta({ venta, onCerrar, organization }) {
  if (!venta) return null;

  // Formatear fecha
  const fechaVenta = venta.created_at 
    ? format(new Date(venta.created_at), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
    : 'Fecha no disponible';

  // Calcular subtotal
  const calcularSubtotalItem = (item) => {
    if (item.precio_total) {
      return item.precio_total * (item.qty || 1);
    }
    const precioBase = item.precio_venta || 0;
    const precioToppings = (item.toppings || []).reduce((sum, t) => 
      sum + (t.precio || 0) * (t.cantidad || 1), 0
    );
    return (precioBase + precioToppings) * (item.qty || 1);
  };

  const subtotal = (venta.items || []).reduce((s, i) => s + calcularSubtotalItem(i), 0);
  const total = venta.total || subtotal;
  const esCredito = venta.es_credito === true || venta.metodo_pago === 'Credito';
  const pagoCliente = esCredito ? 0 : (venta.pago_cliente || total);
  const cambio = esCredito ? 0 : (pagoCliente - total);

  // Detectar pago mixto
  const esPagoMixto = venta.metodo_pago === 'Mixto' || venta.metodo_pago?.startsWith('Mixto (');
  let detallesPagoMixto = venta.detalles_pago_mixto;
  
  if (esPagoMixto && !detallesPagoMixto && typeof venta.metodo_pago === 'string') {
    const match = venta.metodo_pago.match(/Mixto \((.+?): (.+?) \+ (.+?): (.+?)\)/);
    if (match) {
      detallesPagoMixto = {
        metodo1: match[1],
        monto1: parseFloat(match[2].replace(/[^\d]/g, '')),
        metodo2: match[3],
        monto2: parseFloat(match[4].replace(/[^\d]/g, ''))
      };
    }
  }

  const getIconoMetodoPago = (metodo) => {
    switch(metodo?.toLowerCase()) {
      case 'efectivo':
        return <Banknote size={16} />;
      case 'transferencia':
        return <Smartphone size={16} />;
      case 'tarjeta':
        return <CreditCard size={16} />;
      case 'credito':
        return <Receipt size={16} />;
      default:
        return null;
    }
  };

  // Agregar clase al body cuando el modal está abierto
  React.useEffect(() => {
    document.body.classList.add('detalle-venta-open');
    return () => {
      document.body.classList.remove('detalle-venta-open');
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="detalle-venta-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCerrar}
      >
        <motion.div
          className="detalle-venta-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="detalle-venta-header">
            <div className="detalle-venta-header-content">
              <CheckCircle className="detalle-venta-icon" />
              <div>
                <h2 className="detalle-venta-title">Detalle de Venta</h2>
                <p className="detalle-venta-id">ID: {venta.id?.substring(0, 8) || 'N/A'}</p>
              </div>
            </div>
            <button className="detalle-venta-close" onClick={onCerrar}>
              <X size={20} />
            </button>
          </div>

          {/* Información de la venta */}
          <div className="detalle-venta-info">
            <div className="detalle-venta-info-row">
              <Calendar size={16} />
              <span><strong>Fecha:</strong> {fechaVenta}</span>
            </div>
            {venta.usuario_nombre && (
              <div className="detalle-venta-info-row">
                <User size={16} />
                <span><strong>Cajero:</strong> {venta.usuario_nombre}</span>
              </div>
            )}
            <div className="detalle-venta-info-row">
              {getIconoMetodoPago(venta.metodo_pago)}
              <span>
                <strong>Método de pago:</strong> {esPagoMixto ? 'Mixto' : (esCredito ? 'Crédito' : venta.metodo_pago || 'N/A')}
                {esCredito && (
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    padding: '0.25rem 0.5rem', 
                    background: '#fef3c7', 
                    color: '#d97706', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Pendiente de pago
                  </span>
                )}
              </span>
            </div>
            {esCredito && venta.cliente && (
              <div className="detalle-venta-info-row">
                <User size={16} />
                <span><strong>Cliente:</strong> {venta.cliente.nombre || 'N/A'}</span>
              </div>
            )}
            {venta.mesa_id && (
              <div className="detalle-venta-info-row">
                <span><strong>Mesa:</strong> {venta.mesa_id}</span>
              </div>
            )}
            {venta.pedido_id && (
              <div className="detalle-venta-info-row">
                <span><strong>Pedido:</strong> {venta.pedido_id}</span>
              </div>
            )}
          </div>

          {/* Detalles de pago mixto */}
          {esPagoMixto && detallesPagoMixto && (
            <div className="detalle-venta-pago-mixto">
              <h3>Desglose de Pago Mixto</h3>
              <div className="detalle-venta-pago-mixto-item">
                <span>
                  {getIconoMetodoPago(detallesPagoMixto.metodo1)}
                  {detallesPagoMixto.metodo1}
                </span>
                <span>{formatCOP(detallesPagoMixto.monto1)}</span>
              </div>
              <div className="detalle-venta-pago-mixto-item">
                <span>
                  {getIconoMetodoPago(detallesPagoMixto.metodo2)}
                  {detallesPagoMixto.metodo2}
                </span>
                <span>{formatCOP(detallesPagoMixto.monto2)}</span>
              </div>
            </div>
          )}


          {/* Items de la venta */}
          <div className="detalle-venta-items">
            <h3>Productos</h3>
            {(!venta.items || venta.items.length === 0) ? (
              <p className="detalle-venta-no-items">No hay productos en esta venta.</p>
            ) : (
              <div className="detalle-venta-items-list">
                {venta.items.map((item, idx) => {
                  const tieneToppings = item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0;
                  const precioBase = item.precio_venta || 0;
                  const precioToppings = tieneToppings 
                    ? item.toppings.reduce((sum, t) => sum + (t.precio || 0) * (t.cantidad || 1), 0)
                    : 0;
                  const precioTotalItem = item.precio_total || (precioBase + precioToppings);
                  const totalItem = precioTotalItem * (item.qty || 1);

                  return (
                    <div key={idx} className="detalle-venta-item">
                      <div className="detalle-venta-item-header">
                        <span className="detalle-venta-item-cantidad">{item.qty || 1}x</span>
                        <span className="detalle-venta-item-nombre">{item.nombre || 'Producto'}</span>
                        <span className="detalle-venta-item-total">{formatCOP(totalItem)}</span>
                      </div>
                      {item.variant_nombre && (
                        <div className="detalle-venta-item-precio" style={{ color: '#6b7280' }}>
                          Variante: {item.variant_nombre}
                        </div>
                      )}
                      {tieneToppings && (
                        <div className="detalle-venta-item-toppings">
                          <strong>Toppings:</strong>
                          {item.toppings.map((topping, tIdx) => (
                            <div key={tIdx} className="detalle-venta-topping">
                              <span>• {topping.nombre} {topping.cantidad > 1 && `(x${topping.cantidad})`}</span>
                              <span>{formatCOP((topping.precio || 0) * (topping.cantidad || 1))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="detalle-venta-item-precio">
                        Precio: {formatCOP(precioBase)} c/u
                        {tieneToppings && ` + Toppings: ${formatCOP(precioToppings)} = ${formatCOP(precioTotalItem)} c/u`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="detalle-venta-totales">
            <div className="detalle-venta-total-row">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="detalle-venta-total-row detalle-venta-total-final">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
            {!esCredito && (
              <>
                <div className="detalle-venta-total-row">
                  <span>Pago del cliente</span>
                  <span>{formatCOP(pagoCliente)}</span>
                </div>
                <div className="detalle-venta-total-row detalle-venta-cambio">
                  <span>Cambio</span>
                  <span className={cambio < 0 ? 'negativo' : 'positivo'}>
                    {cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}
                  </span>
                </div>
              </>
            )}
            {esCredito && (
              <div className="detalle-venta-total-row" style={{ 
                background: '#fef3c7', 
                padding: '0.75rem', 
                borderRadius: '8px',
                marginTop: '0.5rem'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={16} />
                  <strong>Venta a Crédito</strong>
                </span>
                <span style={{ color: '#d97706', fontWeight: 600 }}>
                  Pendiente de pago
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="detalle-venta-footer">
            <button className="detalle-venta-btn detalle-venta-btn-secondary" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

