import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  XCircle, 
  User,
  Phone,
  Copy,
  CheckCircle,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import './AgregarEmpleadoModal.css';

const AgregarEmpleadoModal = ({ open, onClose, onAgregar, cargando }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empleadoCreado, setEmpleadoCreado] = useState(null);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [usernameManual, setUsernameManual] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  const normalizarUsuario = (value) => {
    const raw = String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    return raw.slice(0, 12);
  };

  const asegurarLongitudMinima = (value) => {
    let result = value;
    while (result.length < 4) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result.slice(0, 12);
  };

  const generarPin = (length = 6) => {
    let codigo = '';
    for (let i = 0; i < length; i++) {
      codigo += Math.floor(Math.random() * 10).toString();
    }
    return codigo;
  };

  useEffect(() => {
    if (open && !pin) {
      setPin(generarPin(4));
    }
  }, [open, pin]);

  useEffect(() => {
    if (!nombre) return;
    if (!usernameManual) {
      const base = normalizarUsuario(nombre);
      setUsername(asegurarLongitudMinima(base));
    }
  }, [nombre, usernameManual]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usernameSafe = normalizarUsuario(username);
    if (!nombre || !usernameSafe || !pin) {
      toast.error('Por favor completa nombre, usuario y contraseña');
      return;
    }
    if (usernameSafe.length < 4 || usernameSafe.length > 12) {
      toast.error('El usuario debe tener entre 4 y 12 caracteres.');
      return;
    }
    if (!/^[a-zA-Z0-9]{4,12}$/.test(pin)) {
      toast.error('La contraseña debe tener entre 4 y 12 caracteres (letras y números).');
      return;
    }

    setIsSubmitting(true);

    const usernameFinal = usernameSafe;
    const accessCodeFinal = usernameFinal;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/67cbae63-1d62-454e-a79c-6473cc85ec06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H8',location:'AgregarEmpleadoModal.js:82',message:'employee:create_submit',data:{hasNombre:!!nombre,hasUsername:!!usernameFinal,hasPin:!!pin,hasAccessCode:!!accessCodeFinal},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    // Llamar a onAgregar y esperar la respuesta
    try {
      const result = await onAgregar({ 
        nombre, 
        telefono: telefono.trim(),
        accessCode: accessCodeFinal,
        username: usernameFinal,
        pin: pin.trim(),
        role: 'cashier',
        customRoleId: null
      });
      
      // Si la creación fue exitosa, mostrar la información
      if (result) {
        setEmpleadoCreado(result);
      }
    } catch (error) {
      console.error('Error al agregar empleado:', error);
      // Mostrar el mensaje de error al usuario
      toast.error(error.message || 'Error al agregar empleado. Por favor, intenta nuevamente.');
      setIsSubmitting(false);
    }
  };


  const handleCerrar = () => {
    setNombre('');
    setTelefono('');
    setEmpleadoCreado(null);
    setUsername('');
    setPin('');
    setUsernameManual(false);
    setCodigoCopiado(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleCerrar}>
      <motion.div 
        className="modal-container agregar-empleado-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="modal-header">
          <h3>
            <UserPlus size={24} /> 
            {empleadoCreado ? 'Empleado Creado' : 'Agregar Empleado'}
          </h3>
          <button className="modal-close" onClick={handleCerrar}>
            <XCircle size={24} />
          </button>
        </div>

        {empleadoCreado ? (
          <div className="codigo-generado-container">
            <div className="codigo-success-icon">
              <CheckCircle size={48} />
            </div>
            <h4>¡Empleado agregado exitosamente!</h4>
            <p className="codigo-instructions">
              El empleado quedó vinculado a la organización.
            </p>
            
            <div className="codigo-display">
              <div className="codigo-label">
                <User size={16} />
                Usuario:
              </div>
              <div className="codigo-value-container">
                <code className="codigo-value">{empleadoCreado.employee_username || empleadoCreado.username || '—'}</code>
                <button 
                  className="btn-copiar-codigo"
                  onClick={() => {
                    const usuarioTexto = empleadoCreado.employee_username || empleadoCreado.username || '';
                    navigator.clipboard.writeText(usuarioTexto);
                    setCodigoCopiado(true);
                    toast.success('Usuario copiado');
                    setTimeout(() => setCodigoCopiado(false), 2000);
                  }}
                  title="Copiar usuario"
                >
                  {codigoCopiado ? (
                    <CheckCircle size={18} />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>

              <div className="codigo-label" style={{ marginTop: '1rem' }}>
                <Key size={16} />
                Contraseña:
              </div>
              <div className="codigo-value-container">
                <code className="codigo-value" style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#16a34a' }}>
                  {pin}
                </code>
                <button 
                  className="btn-copiar-codigo"
                  onClick={() => {
                    const pinTexto = pin || '';
                    navigator.clipboard.writeText(pinTexto);
                    setCodigoCopiado(true);
                    toast.success('PIN copiado');
                    setTimeout(() => setCodigoCopiado(false), 2000);
                  }}
                  title="Copiar contraseña"
                >
                  {codigoCopiado ? (
                    <CheckCircle size={18} />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>

              <div className="codigo-label" style={{ marginTop: '1rem' }}>
                <Phone size={16} />
                Teléfono:
              </div>
              <div className="codigo-value-container">
                <code className="codigo-value">{empleadoCreado.employee_phone || '—'}</code>
              </div>
            </div>

            <div className="codigo-warning">
              <p>⚠️ Guarda esta contraseña de forma segura. Se mostrará solo una vez.</p>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCerrar}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-hint" style={{ marginBottom: '0.75rem' }}>
              Obligatorios: <strong>Nombre Completo</strong>, <strong>Usuario</strong> y <strong>Contraseña</strong>.
            </div>
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Nombre Completo *
              </label>
              <input
                type="text"
                className="form-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Usuario *
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => {
                  setUsernameManual(true);
                  setUsername(normalizarUsuario(e.target.value));
                }}
                placeholder="Ej: juanperez"
                required
              />
              <small className="form-hint">
                Se genera desde el nombre, puedes ajustarlo. Solo letras y números (4 a 12).
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Key size={16} />
                Contraseña *
              </label>
              <div className="codigo-input-group">
                <input
                  type="text"
                  className="form-input"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12))}
                  placeholder="Ej: 1234 o juan23"
                  required
                />
                <button
                  type="button"
                  className="btn-generar-codigo"
                  onClick={() => setPin(generarPin(6))}
                  title="Generar contraseña"
                >
                  Generar
                </button>
              </div>
              <small className="form-hint">
                Contraseña de 4 a 12 caracteres (letras y números).
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Phone size={16} />
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                className="form-input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="3001234567"
              />
              <small className="form-hint">
                Solo si deseas guardar un contacto.
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
                disabled={cargando || isSubmitting}
              >
                <UserPlus size={16} />
                {(cargando || isSubmitting) ? 'Agregando...' : 'Agregar Empleado'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AgregarEmpleadoModal;
