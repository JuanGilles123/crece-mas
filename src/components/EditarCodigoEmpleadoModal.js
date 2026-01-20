import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  XCircle, 
  Save,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import './EditarCodigoEmpleadoModal.css';

const EditarCodigoEmpleadoModal = ({ open, onClose, onGuardar, codigoActual, nombreEmpleado, cargando = false }) => {
  const [nuevoCodigo, setNuevoCodigo] = useState(codigoActual || '');
  const [tipoCodigo, setTipoCodigo] = useState(codigoActual?.includes('|') ? 'telefono' : 'corto');
  const [telefono, setTelefono] = useState(codigoActual?.includes('|') ? codigoActual.split('|')[0] : '');
  const [pin, setPin] = useState(codigoActual?.includes('|') ? codigoActual.split('|')[1] : '');

  // Generar código corto único (5 dígitos numéricos)
  const generarCodigoCorto = () => {
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += Math.floor(Math.random() * 10).toString();
    }
    return codigo;
  };

  // Generar PIN de 4 dígitos
  const generarPIN = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleGenerarCodigo = () => {
    if (tipoCodigo === 'telefono' && telefono) {
      const pinGenerado = generarPIN();
      setPin(pinGenerado);
      const telefonoLimpio = telefono.replace(/\D/g, '');
      setNuevoCodigo(`${telefonoLimpio}|${pinGenerado}`);
    } else {
      setNuevoCodigo(generarCodigoCorto());
    }
  };

  const handleTipoCodigoChange = (tipo) => {
    setTipoCodigo(tipo);
    if (tipo === 'telefono' && telefono) {
      const pinGenerado = generarPIN();
      setPin(pinGenerado);
      const telefonoLimpio = telefono.replace(/\D/g, '');
      setNuevoCodigo(`${telefonoLimpio}|${pinGenerado}`);
    } else {
      setNuevoCodigo(generarCodigoCorto());
    }
  };

  const handleTelefonoChange = (value) => {
    setTelefono(value);
    if (tipoCodigo === 'telefono' && value) {
      const pinGenerado = pin || generarPIN();
      setPin(pinGenerado);
      const telefonoLimpio = value.replace(/\D/g, '');
      setNuevoCodigo(`${telefonoLimpio}|${pinGenerado}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nuevoCodigo.trim()) {
      toast.error('Por favor ingresa o genera un código');
      return;
    }

    if (tipoCodigo === 'telefono' && !telefono) {
      toast.error('Debes ingresar un teléfono para usar este método');
      return;
    }

    await onGuardar(nuevoCodigo);
  };

  const handleCerrar = () => {
    setNuevoCodigo(codigoActual || '');
    setTipoCodigo(codigoActual?.includes('|') ? 'telefono' : 'corto');
    setTelefono(codigoActual?.includes('|') ? codigoActual.split('|')[0] : '');
    setPin(codigoActual?.includes('|') ? codigoActual.split('|')[1] : '');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleCerrar}>
      <motion.div 
        className="modal-container editar-codigo-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h3>
            <Key size={24} /> 
            Editar Código de Empleado
          </h3>
          <button className="modal-close" onClick={handleCerrar}>
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {nombreEmpleado && (
            <div className="form-info">
              <p><strong>Empleado:</strong> {nombreEmpleado}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Key size={16} />
              Tipo de Código
            </label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input
                  type="radio"
                  name="tipoCodigo"
                  value="corto"
                  checked={tipoCodigo === 'corto'}
                  onChange={(e) => handleTipoCodigoChange(e.target.value)}
                />
                <span>Código Corto (5 dígitos)</span>
                <small>Fácil de recordar, ejemplo: 12345</small>
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  name="tipoCodigo"
                  value="telefono"
                  checked={tipoCodigo === 'telefono'}
                  onChange={(e) => handleTipoCodigoChange(e.target.value)}
                />
                <span>Teléfono + PIN (4 dígitos)</span>
                <small>Usa el teléfono + PIN único</small>
              </label>
            </div>
          </div>

          {tipoCodigo === 'telefono' && (
            <div className="form-group">
              <label className="form-label">
                Teléfono
              </label>
              <input
                type="tel"
                className="form-input"
                value={telefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="+57 300 123 4567"
                required={tipoCodigo === 'telefono'}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Key size={16} />
              Nuevo Código
            </label>
            <div className="codigo-input-group">
              <input
                type="text"
                className="form-input"
                value={nuevoCodigo}
                onChange={(e) => setNuevoCodigo(e.target.value)}
                placeholder={tipoCodigo === 'corto' ? '12345' : '3001234567|1234'}
                required
                readOnly={tipoCodigo === 'corto'}
              />
              <button
                type="button"
                className="btn-generar-codigo"
                onClick={handleGenerarCodigo}
                title="Generar nuevo código"
              >
                <RefreshCw size={18} />
                Generar
              </button>
            </div>
            {tipoCodigo === 'telefono' && pin && (
              <small className="form-hint">
                PIN generado: <strong>{pin}</strong>
              </small>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCerrar}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={cargando}
            >
              <Save size={16} />
              {cargando ? 'Guardando...' : 'Guardar Código'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditarCodigoEmpleadoModal;
