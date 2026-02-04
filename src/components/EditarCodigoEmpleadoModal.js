import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, 
  XCircle, 
  Save,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import './EditarCodigoEmpleadoModal.css';

const EditarCodigoEmpleadoModal = ({ open, onClose, onGuardar, usuarioActual, nombreEmpleado, cargando = false }) => {
  const [usuario, setUsuario] = useState(usuarioActual || '');
  const [password, setPassword] = useState('');

  const normalizarUsuario = (value) => {
    const raw = String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    return raw.slice(0, 12);
  };

  const generarPassword = (length = 6) => {
    let codigo = '';
    for (let i = 0; i < length; i++) {
      codigo += Math.floor(Math.random() * 10).toString();
    }
    return codigo;
  };

  useEffect(() => {
    if (open) {
      setUsuario(usuarioActual || '');
      setPassword('');
    }
  }, [open, usuarioActual]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuarioSafe = normalizarUsuario(usuario);

    if (!usuarioSafe) {
      toast.error('Por favor ingresa un usuario válido');
      return;
    }

    if (usuarioSafe.length < 4 || usuarioSafe.length > 12) {
      toast.error('El usuario debe tener entre 4 y 12 caracteres.');
      return;
    }

    if (!password.trim()) {
      toast.error('Por favor ingresa una contraseña');
      return;
    }

    if (!/^[a-zA-Z0-9]{4,12}$/.test(password.trim())) {
      toast.error('La contraseña debe tener entre 4 y 12 caracteres (letras y números).');
      return;
    }

    await onGuardar({ username: usuarioSafe, password: password.trim() });
  };

  const handleCerrar = () => {
    setUsuario(usuarioActual || '');
    setPassword('');
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
              Usuario
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
              Contraseña
            </label>
            <div className="codigo-input-group">
              <input
                type="text"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12))}
                placeholder="Ej: 1234 o juan23"
                required
              />
              <button
                type="button"
                className="btn-generar-codigo"
                onClick={() => setPassword(generarPassword(6))}
                title="Generar contraseña"
              >
                <RefreshCw size={18} />
                Generar
              </button>
            </div>
            <small className="form-hint">
              Contraseña de 4 a 12 caracteres (letras y números).
            </small>
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
