import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, User, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCrearAperturaCaja } from '../../hooks/useAperturasCaja';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import './AperturaCajaModal.css';

const AperturaCajaModal = ({ isOpen, onClose, onAperturaExitosa }) => {
  const { user, organization, userProfile } = useAuth();
  const crearApertura = useCrearAperturaCaja();
  const montoInicialInput = useCurrencyInput();
  const [error, setError] = useState('');

  const handleAbrirCaja = async () => {
    if (!user || !organization) {
      setError('Error: No hay usuario u organización activa');
      return;
    }

    const montoInicial = montoInicialInput.numericValue || 0;
    
    if (montoInicial < 0) {
      setError('El monto inicial no puede ser negativo');
      return;
    }

    setError('');
    
    try {
      const apertura = await crearApertura.mutateAsync({
        organizationId: organization.id,
        userId: user.id,
        montoInicial: montoInicial
      });

      if (apertura && onAperturaExitosa) {
        onAperturaExitosa(apertura);
      }
      
      onClose();
    } catch (error) {
      setError(error.message || 'Error al abrir la caja');
    }
  };

  const handleClose = () => {
    if (!crearApertura.isLoading) {
      setError('');
      montoInicialInput.reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="apertura-caja-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="apertura-caja-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="apertura-caja-modal-header">
            <div className="apertura-caja-modal-title">
              <DollarSign size={24} />
              <h2>Abrir Caja</h2>
            </div>
            <button
              className="apertura-caja-modal-close"
              onClick={handleClose}
              disabled={crearApertura.isLoading}
            >
              <X size={20} />
            </button>
          </div>

          <div className="apertura-caja-modal-content">
            <div className="apertura-caja-info">
              <div className="apertura-caja-info-item">
                <User size={18} />
                <span>
                  <strong>Usuario:</strong> {userProfile?.nombre || user?.email || 'Usuario'}
                </span>
              </div>
              <div className="apertura-caja-info-item">
                <span>
                  <strong>Organización:</strong> {organization?.name || 'N/A'}
                </span>
              </div>
            </div>

            <div className="apertura-caja-form">
              <label htmlFor="monto-inicial">
                Monto Inicial <span className="required">*</span>
              </label>
              <div className="apertura-caja-input-wrapper">
                <DollarSign size={20} className="apertura-caja-input-icon" />
                <input
                  id="monto-inicial"
                  type="text"
                  className="apertura-caja-input"
                  placeholder="0"
                  value={montoInicialInput.displayValue}
                  onChange={(e) => montoInicialInput.handleChange(e)}
                  disabled={crearApertura.isLoading}
                  autoFocus
                />
              </div>
              <p className="apertura-caja-hint">
                Ingresa el monto inicial con el que abres la caja hoy
              </p>
            </div>

            {error && (
              <motion.div
                className="apertura-caja-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          <div className="apertura-caja-modal-footer">
            <button
              className="apertura-caja-btn-cancelar"
              onClick={handleClose}
              disabled={crearApertura.isLoading}
            >
              Cancelar
            </button>
            <button
              className="apertura-caja-btn-abrir"
              onClick={handleAbrirCaja}
              disabled={crearApertura.isLoading || !montoInicialInput.displayValue}
            >
              {crearApertura.isLoading ? (
                <>
                  <motion.div
                    className="spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Abriendo...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Abrir Caja
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AperturaCajaModal;
