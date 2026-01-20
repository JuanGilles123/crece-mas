import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  XCircle, 
  Shield, 
  User,
  Mail,
  Phone,
  Key,
  Copy,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './AgregarEmpleadoModal.css';

const ROLES = {
  admin: {
    label: 'Administrador',
    description: 'Gestión completa excepto facturación'
  },
  inventory_manager: {
    label: 'Encargado de Inventario',
    description: 'Gestión de inventario y ventas'
  },
  cashier: {
    label: 'Cajero',
    description: 'Solo módulo de caja'
  },
  viewer: {
    label: 'Visualizador',
    description: 'Solo lectura de reportes'
  }
};

const AgregarEmpleadoModal = ({ open, onClose, onAgregar, cargando, customRoles = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [role, setRole] = useState('cashier');
  const [customRoleId, setCustomRoleId] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [tipoCodigo, setTipoCodigo] = useState('corto'); // 'corto' o 'telefono'
  const [pin, setPin] = useState('');

  // Generar código corto único (5 dígitos numéricos)
  const generarCodigoCorto = () => {
    // Generar un código de 5 dígitos numéricos
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

  // Generar código según el tipo seleccionado
  const generarCodigo = () => {
    if (tipoCodigo === 'telefono' && telefono) {
      // Si usa teléfono, el código será el teléfono + PIN
      // El PIN se generará automáticamente
      const pinGenerado = generarPIN();
      setPin(pinGenerado);
      // El código será: telefono|PIN (sin espacios ni caracteres especiales)
      const telefonoLimpio = telefono.replace(/\D/g, ''); // Solo números
      return `${telefonoLimpio}|${pinGenerado}`;
    } else {
      // Código corto
      return generarCodigoCorto();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !role) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar que si usa teléfono, debe tener teléfono ingresado
    if (tipoCodigo === 'telefono' && !telefono) {
      toast.error('Debes ingresar un teléfono para usar este método');
      return;
    }

    setIsSubmitting(true);
    
    // Generar código único
    const codigo = generarCodigo();

    // Llamar a onAgregar y esperar la respuesta
    try {
      const result = await onAgregar({ 
        nombre, 
        email: email || null, 
        telefono: telefono || null,
        role, 
        customRoleId: customRoleId || null,
        codigo,
        pin: tipoCodigo === 'telefono' ? pin : null
      });
      
      // Si la creación fue exitosa, mostrar el código
      if (result && result.codigo) {
        setCodigoGenerado(result.codigo);
      } else {
        setCodigoGenerado(codigo);
      }
    } catch (error) {
      // El error ya se maneja en el hook
      console.error('Error al agregar empleado:', error);
      setIsSubmitting(false);
    }
  };

  const handleCopiarCodigo = () => {
    if (codigoGenerado) {
      navigator.clipboard.writeText(codigoGenerado);
      setCodigoCopiado(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCodigoCopiado(false), 2000);
    }
  };

  const handleCerrar = () => {
    setNombre('');
    setEmail('');
    setTelefono('');
    setRole('cashier');
    setCustomRoleId('');
    setCodigoGenerado(null);
    setCodigoCopiado(false);
    setTipoCodigo('corto');
    setPin('');
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
            {codigoGenerado ? 'Empleado Creado' : 'Agregar Empleado'}
          </h3>
          <button className="modal-close" onClick={handleCerrar}>
            <XCircle size={24} />
          </button>
        </div>

        {codigoGenerado ? (
          <div className="codigo-generado-container">
            <div className="codigo-success-icon">
              <CheckCircle size={48} />
            </div>
            <h4>¡Empleado agregado exitosamente!</h4>
            <p className="codigo-instructions">
              {codigoGenerado.includes('|') ? (
                <>
                  Se ha generado un código de acceso usando teléfono + PIN para este empleado.
                  <br /><br />
                  <strong>Para iniciar sesión:</strong><br />
                  - Ingresa el teléfono completo + PIN (4 dígitos)
                  <br />
                  - O usa el código completo mostrado abajo
                </>
              ) : (
                <>
                  Se ha generado un código corto único para este empleado. 
                  Este código se puede usar para iniciar sesión en la aplicación.
                </>
              )}
            </p>
            <p className="codigo-instructions" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <strong>Instrucciones de acceso:</strong><br />
              1. Ve a la página de login<br />
              2. Selecciona "Empleado"<br />
              3. Ingresa el código o teléfono + PIN<br />
              4. La contraseña inicial es el mismo código/PIN (puede cambiarse después)
            </p>
            
            <div className="codigo-display">
              {codigoGenerado.includes('|') ? (
                <>
                  <div className="codigo-label">
                    <Phone size={16} />
                    Teléfono:
                  </div>
                  <div className="codigo-value-container">
                    <code className="codigo-value">{codigoGenerado.split('|')[0]}</code>
                    <button 
                      className="btn-copiar-codigo"
                      onClick={() => {
                        navigator.clipboard.writeText(codigoGenerado.split('|')[0]);
                        setCodigoCopiado(true);
                        toast.success('Teléfono copiado');
                        setTimeout(() => setCodigoCopiado(false), 2000);
                      }}
                      title="Copiar teléfono"
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
                    PIN de 4 dígitos:
                  </div>
                  <div className="codigo-value-container">
                    <code className="codigo-value">{codigoGenerado.split('|')[1]}</code>
                    <button 
                      className="btn-copiar-codigo"
                      onClick={() => {
                        navigator.clipboard.writeText(codigoGenerado.split('|')[1]);
                        setCodigoCopiado(true);
                        toast.success('PIN copiado');
                        setTimeout(() => setCodigoCopiado(false), 2000);
                      }}
                      title="Copiar PIN"
                    >
                      {codigoCopiado ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                  <div className="codigo-label" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                    Código completo (para copiar):
                  </div>
                  <div className="codigo-value-container">
                    <code className="codigo-value" style={{ fontSize: '0.9rem' }}>{codigoGenerado}</code>
                    <button 
                      className="btn-copiar-codigo"
                      onClick={handleCopiarCodigo}
                      title="Copiar código completo"
                    >
                      {codigoCopiado ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="codigo-label">
                    <Key size={16} />
                    Código del Empleado:
                  </div>
                  <div className="codigo-value-container">
                    <code className="codigo-value">{codigoGenerado}</code>
                    <button 
                      className="btn-copiar-codigo"
                      onClick={handleCopiarCodigo}
                      title="Copiar código"
                    >
                      {codigoCopiado ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="codigo-warning">
              <p>⚠️ Guarda este código de forma segura. Se mostrará una vez.</p>
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
                <Mail size={16} />
                Correo electrónico (opcional)
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
              <small className="form-hint">
                El correo es opcional. Puede agregarse más adelante.
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
                placeholder="+57 300 123 4567"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Key size={16} />
                Tipo de Código de Acceso
              </label>
              <div className="form-radio-group">
                <label className="form-radio">
                  <input
                    type="radio"
                    name="tipoCodigo"
                    value="corto"
                    checked={tipoCodigo === 'corto'}
                    onChange={(e) => setTipoCodigo(e.target.value)}
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
                    onChange={(e) => setTipoCodigo(e.target.value)}
                    disabled={!telefono}
                  />
                  <span>Teléfono + PIN (4 dígitos)</span>
                  <small>Usa el teléfono ingresado + PIN único</small>
                </label>
              </div>
              {tipoCodigo === 'telefono' && !telefono && (
                <small className="form-hint" style={{ color: '#f59e0b' }}>
                  ⚠️ Debes ingresar un teléfono para usar este método
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={16} />
                Rol Base *
              </label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setCustomRoleId(''); // Limpiar rol personalizado al cambiar rol base
                }}
                required
              >
                {Object.entries(ROLES).map(([key, roleInfo]) => (
                  <option key={key} value={key}>
                    {roleInfo.label} - {roleInfo.description}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                Selecciona el nivel de acceso base para este empleado
              </small>
            </div>

            {customRoles.length > 0 && (
              <div className="form-group">
                <label className="form-label">
                  <Shield size={16} />
                  Rol Personalizado (Opcional)
                </label>
                <select
                  className="form-select"
                  value={customRoleId}
                  onChange={(e) => setCustomRoleId(e.target.value)}
                >
                  <option value="">Sin rol personalizado</option>
                  {customRoles.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {rol.name}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  Puedes asignar un rol personalizado además del rol base
                </small>
              </div>
            )}

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
