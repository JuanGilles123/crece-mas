import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  XCircle, 
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import './EditarCodigoEmpleadoModal.css';

const EditarCodigoEmpleadoModal = ({ open, onClose, onGuardar, usuarioActual, codigoActual, nombreEmpleado, cargando = false }) => {
  const [usuario, setUsuario] = useState(usuarioActual || '');
  const [codigo, setCodigo] = useState(codigoActual || '');

  const normalizarUsuario = (value) => {
    const raw = String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    return raw.slice(0, 12);
  };

  const normalizarCodigo = (value) => {
    const raw = String(value || '').replace(/[^0-9]/g, '');
    return raw.slice(0, 12);
  };

  useEffect(() => {
    if (open) {
      setUsuario(usuarioActual || '');
      setCodigo(codigoActual || '');
      setCodigo(codigoActual || '');
    }
  }, [open, usuarioActual, codigoActual]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuarioSafe = normalizarUsuario(usuario);
    const codigoSafe = normalizarCodigo(codigo);

    if (!usuarioSafe) {
      toast.error('Por favor ingresa un usuario válido');
      return;
    }

    if (usuarioSafe.length < 4 || usuarioSafe.length > 12) {
      toast.error('El usuario debe tener entre 4 y 12 caracteres.');
      return;
    }

    if (!codigoSafe) {
      toast.error('Por favor ingresa un código válido');
      return;
    }

    if (codigoSafe.length < 4 || codigoSafe.length > 12) {
      toast.error('El código debe tener entre 4 y 12 caracteres.');
      return;
    }

    if (codigoSafe === usuarioSafe) {
      toast.error('El código debe ser diferente al usuario.');
      return;
    }

    await onGuardar({ username: usuarioSafe, accessCode: codigoSafe, password: codigoSafe });
  };

  const handleCerrar = () => {
    setUsuario(usuarioActual || '');
    setCodigo(codigoActual || '');
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
            Editar credenciales
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
              Usuario actual
            </label>
            <div className="codigo-input-group">
              <input
                type="text"
                className="form-input"
                value={usuarioActual || ''}
                readOnly
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={16} />
              Código actual
            </label>
            <div className="codigo-input-group">
              <input
                type="text"
                className="form-input"
                value={codigoActual || ''}
                readOnly
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={16} />
              Nuevo usuario
            </label>
            <div className="codigo-input-group">
              <input
                type="text"
                className="form-input"
                value={usuario}
                onChange={(e) => setUsuario(normalizarUsuario(e.target.value))}
                placeholder="Ej: juanperez"
                required
              />
            </div>
            <small className="form-hint">
              Solo letras y números (4 a 12 caracteres).
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={16} />
              Nuevo código (PIN)
            </label>
            <div className="codigo-input-group">
              <input
                type="text"
                className="form-input"
                value={codigo}
                onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
                placeholder="Ej: 1234"
                required
              />
            </div>
            <small className="form-hint">
              Código de 4 a 12 dígitos.
            </small>
            {usuarioActual && codigoActual && usuarioActual === codigoActual && (
              <small className="form-hint" style={{ color: '#ef4444' }}>
                El código debe ser diferente al usuario.
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
              {cargando ? 'Guardando...' : 'Guardar credenciales'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditarCodigoEmpleadoModal;
