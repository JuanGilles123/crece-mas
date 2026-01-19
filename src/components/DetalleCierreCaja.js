import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Calculator, DollarSign, TrendingUp, AlertCircle, CheckCircle, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './DetalleCierreCaja.css';

function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function DetalleCierreCaja({ cierre, onCerrar }) {
  if (!cierre) return null;

  const fechaCierre = cierre.fecha 
    ? format(new Date(cierre.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : format(new Date(cierre.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es });

  const horaCierre = cierre.created_at
    ? format(new Date(cierre.created_at), "HH:mm", { locale: es })
    : 'N/A';

  const diferencia = cierre.diferencia || 0;
  const tieneDiferencia = Math.abs(diferencia) > 0.01;

  return (
    <AnimatePresence>
      <motion.div
        className="detalle-cierre-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCerrar}
      >
        <motion.div
          className="detalle-cierre-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="detalle-cierre-header">
            <div className="detalle-cierre-header-content">
              <Calculator className="detalle-cierre-icon" />
              <div>
                <h2 className="detalle-cierre-title">Cierre de Caja</h2>
                <p className="detalle-cierre-fecha">{fechaCierre} - {horaCierre}</p>
              </div>
            </div>
            <button className="detalle-cierre-close" onClick={onCerrar}>
              <X size={20} />
            </button>
          </div>

          {/* Resumen */}
          <div className="detalle-cierre-resumen">
            <div className="detalle-cierre-resumen-item">
              <span className="detalle-cierre-resumen-label">Total Sistema</span>
              <span className="detalle-cierre-resumen-value">{formatCOP(cierre.total_sistema)}</span>
            </div>
            <div className="detalle-cierre-resumen-item">
              <span className="detalle-cierre-resumen-label">Total Real</span>
              <span className="detalle-cierre-resumen-value">{formatCOP(cierre.total_real)}</span>
            </div>
            <div className={`detalle-cierre-resumen-item detalle-cierre-diferencia ${tieneDiferencia ? (diferencia > 0 ? 'positiva' : 'negativa') : ''}`}>
              <span className="detalle-cierre-resumen-label">Diferencia</span>
              <span className="detalle-cierre-resumen-value">
                {tieneDiferencia ? (diferencia > 0 ? '+' : '') : ''}{formatCOP(diferencia)}
              </span>
            </div>
            {tieneDiferencia && (
              <div className="detalle-cierre-alerta">
                <AlertCircle size={16} />
                <span>Hay una diferencia de {formatCOP(Math.abs(diferencia))}</span>
              </div>
            )}
          </div>

          {/* Desglose Sistema */}
          <div className="detalle-cierre-seccion">
            <h3 className="detalle-cierre-seccion-title">
              <TrendingUp size={18} />
              Desglose del Sistema
            </h3>
            <div className="detalle-cierre-desglose">
              <div className="detalle-cierre-desglose-item">
                <Banknote size={16} />
                <span>Efectivo</span>
                <span>{formatCOP(cierre.sistema_efectivo || 0)}</span>
              </div>
              <div className="detalle-cierre-desglose-item">
                <Smartphone size={16} />
                <span>Transferencias</span>
                <span>{formatCOP(cierre.sistema_transferencias || 0)}</span>
              </div>
              <div className="detalle-cierre-desglose-item">
                <CreditCard size={16} />
                <span>Tarjeta</span>
                <span>{formatCOP(cierre.sistema_tarjeta || 0)}</span>
              </div>
              {cierre.sistema_otros > 0 && (
                <div className="detalle-cierre-desglose-item">
                  <DollarSign size={16} />
                  <span>Otros</span>
                  <span>{formatCOP(cierre.sistema_otros || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Desglose Real */}
          <div className="detalle-cierre-seccion">
            <h3 className="detalle-cierre-seccion-title">
              <CheckCircle size={18} />
              Desglose Real (Contado)
            </h3>
            <div className="detalle-cierre-desglose">
              <div className="detalle-cierre-desglose-item">
                <Banknote size={16} />
                <span>Efectivo</span>
                <span>{formatCOP(cierre.real_efectivo || 0)}</span>
              </div>
              <div className="detalle-cierre-desglose-item">
                <Smartphone size={16} />
                <span>Transferencias</span>
                <span>{formatCOP(cierre.real_transferencias || 0)}</span>
              </div>
              <div className="detalle-cierre-desglose-item">
                <CreditCard size={16} />
                <span>Tarjeta</span>
                <span>{formatCOP(cierre.real_tarjeta || 0)}</span>
              </div>
              {cierre.real_otros > 0 && (
                <div className="detalle-cierre-desglose-item">
                  <DollarSign size={16} />
                  <span>Otros</span>
                  <span>{formatCOP(cierre.real_otros || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="detalle-cierre-info">
            <div className="detalle-cierre-info-item">
              <Calendar size={16} />
              <span><strong>Cantidad de ventas:</strong> {cierre.cantidad_ventas || 0}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="detalle-cierre-footer">
            <button className="detalle-cierre-btn detalle-cierre-btn-secondary" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

