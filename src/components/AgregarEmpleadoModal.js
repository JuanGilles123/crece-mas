import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  XCircle, 
  Shield, 
  User,
  Mail,
  Phone,
  Copy,
  CheckCircle,
  Lock,
  Eye,
  EyeOff
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
  const [usuario, setUsuario] = useState(''); // Email o teléfono para login
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('cashier');
  const [customRoleId, setCustomRoleId] = useState('');
  const [empleadoCreado, setEmpleadoCreado] = useState(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [sugerenciasPassword, setSugerenciasPassword] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [sugerenciasUsuario, setSugerenciasUsuario] = useState([]);
  const [mostrarSugerenciasUsuario, setMostrarSugerenciasUsuario] = useState(false);


  // Generar sugerencias de usuario basadas en el nombre
  const generarSugerenciasUsuario = (nombreCompleto) => {
    if (!nombreCompleto || nombreCompleto.trim().length < 3) {
      return [];
    }

    const partes = nombreCompleto.trim().toLowerCase().split(' ');
    const nombre = partes[0] || '';
    const apellido = partes[partes.length - 1] || '';
    
    const sugerencias = [];
    
    // Sugerencia 1: nombre.apellido@ejemplo.com
    if (nombre && apellido) {
      sugerencias.push(`${nombre}.${apellido}@ejemplo.com`);
    }
    
    // Sugerencia 2: nombreapellido@ejemplo.com
    if (nombre && apellido) {
      sugerencias.push(`${nombre}${apellido}@ejemplo.com`);
    }
    
    // Sugerencia 3: primera letra nombre + apellido@ejemplo.com
    if (nombre && apellido) {
      sugerencias.push(`${nombre[0]}${apellido}@ejemplo.com`);
    }
    
    // Sugerencia 4: nombre + primera letra apellido@ejemplo.com
    if (nombre && apellido) {
      sugerencias.push(`${nombre}${apellido[0]}@ejemplo.com`);
    }
    
    // Sugerencia 5: Teléfono simple (ejemplo)
    if (nombre) {
      sugerencias.push(`3001234567`);
    }

    return sugerencias.slice(0, 5); // Máximo 5 sugerencias
  };

  // Generar sugerencias de contraseña basadas en el nombre
  const generarSugerenciasPassword = (nombreCompleto) => {
    if (!nombreCompleto || nombreCompleto.trim().length < 3) {
      return [];
    }

    const partes = nombreCompleto.trim().toLowerCase().split(' ');
    const nombre = partes[0] || '';
    const apellido = partes[partes.length - 1] || '';
    
    const sugerencias = [];
    
    // Sugerencia 1: Nombre + año actual (últimos 2 dígitos)
    if (nombre) {
      const año = new Date().getFullYear().toString().slice(-2);
      sugerencias.push(`${nombre}${año}`);
    }
    
    // Sugerencia 2: Primera letra nombre + apellido + número
    if (nombre && apellido) {
      sugerencias.push(`${nombre[0]}${apellido}123`);
    }
    
    // Sugerencia 3: Nombre + apellido (primeras 3 letras)
    if (nombre && apellido) {
      sugerencias.push(`${nombre}${apellido.slice(0, 3)}`);
    }
    
    // Sugerencia 4: Apellido + número simple
    if (apellido) {
      sugerencias.push(`${apellido}2024`);
    }
    
    // Sugerencia 5: Nombre completo sin espacios + número
    if (nombre && apellido) {
      sugerencias.push(`${nombre}${apellido}1`);
    }

    return sugerencias.slice(0, 5); // Máximo 5 sugerencias
  };

  // Actualizar sugerencias cuando cambia el nombre
  useEffect(() => {
    if (nombre && nombre.trim().length >= 3) {
      const sugerenciasPass = generarSugerenciasPassword(nombre);
      const sugerenciasUser = generarSugerenciasUsuario(nombre);
      setSugerenciasPassword(sugerenciasPass);
      setSugerenciasUsuario(sugerenciasUser);
      setMostrarSugerencias(true);
      setMostrarSugerenciasUsuario(true);
    } else {
      setSugerenciasPassword([]);
      setSugerenciasUsuario([]);
      setMostrarSugerencias(false);
      setMostrarSugerenciasUsuario(false);
    }
  }, [nombre]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !role) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    // Generar usuario automáticamente si no se proporciona
    let usuarioFinal = usuario && usuario.trim() ? usuario.trim() : null;
    if (!usuarioFinal) {
      // Generar usuario basado en el nombre
      if (nombre && nombre.trim()) {
        const partes = nombre.trim().toLowerCase().split(' ').filter(p => p.length > 0);
        const nombreParte = partes[0] || '';
        const apellidoParte = partes.length > 1 ? partes[partes.length - 1] : '';
        
        if (nombreParte && apellidoParte) {
          usuarioFinal = `${nombreParte}.${apellidoParte}@empleado.local`;
        } else if (nombreParte) {
          usuarioFinal = `${nombreParte}@empleado.local`;
        } else {
          // Fallback si no hay nombre válido
          usuarioFinal = `empleado${Date.now()}@empleado.local`;
        }
      } else {
        // Fallback si no hay nombre
        usuarioFinal = `empleado${Date.now()}@empleado.local`;
      }
    }

    // Generar contraseña automáticamente si no se proporciona
    let passwordFinal = password && password.trim() ? password.trim() : null;
    if (!passwordFinal) {
      // Generar contraseña basada en el nombre
      if (nombre && nombre.trim()) {
        const partes = nombre.trim().toLowerCase().split(' ').filter(p => p.length > 0);
        const nombreParte = partes[0] || '';
        const apellidoParte = partes.length > 1 ? partes[partes.length - 1] : '';
        const año = new Date().getFullYear().toString().slice(-2);
        
        if (nombreParte && apellidoParte) {
          passwordFinal = `${nombreParte}${año}`;
        } else if (nombreParte) {
          passwordFinal = `${nombreParte}123`;
        } else {
          passwordFinal = 'empleado123';
        }
      } else {
        // Fallback si no hay nombre
        passwordFinal = 'empleado123';
      }
    }

    // Validar formato de contraseña si se proporcionó manualmente
    if (password && password.trim() && password.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      setIsSubmitting(false);
      return;
    }

    // Validar que tenemos usuario y contraseña (deberían estar generados si no se proporcionaron)
    if (!usuarioFinal || !usuarioFinal.trim()) {
      toast.error('Error: No se pudo generar el usuario automáticamente. Por favor, proporciona un usuario manualmente.');
      setIsSubmitting(false);
      return;
    }

    if (!passwordFinal || !passwordFinal.trim()) {
      toast.error('Error: No se pudo generar la contraseña automáticamente. Por favor, proporciona una contraseña manualmente.');
      setIsSubmitting(false);
      return;
    }

    // Determinar si el usuario es email o teléfono
    const isEmail = usuarioFinal && usuarioFinal.includes('@');
    const emailFinal = isEmail && usuarioFinal ? usuarioFinal.trim().toLowerCase() : null;
    const telefonoFinal = !isEmail && usuarioFinal ? usuarioFinal.replace(/\D/g, '') : null;

    // Llamar a onAgregar y esperar la respuesta
    try {
      const result = await onAgregar({ 
        nombre, 
        email: emailFinal || email || null, 
        telefono: telefonoFinal || telefono || null,
        usuario: usuarioFinal.trim(),
        password: passwordFinal.trim(),
        role, 
        customRoleId: customRoleId || null
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
    setEmail('');
    setTelefono('');
    setUsuario('');
    setPassword('');
    setShowPassword(false);
    setRole('cashier');
    setCustomRoleId('');
    setEmpleadoCreado(null);
    setCodigoCopiado(false);
    setSugerenciasPassword([]);
    setSugerenciasUsuario([]);
    setMostrarSugerencias(false);
    setMostrarSugerenciasUsuario(false);
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
              El empleado ha sido creado con sus credenciales de acceso. 
              En su primer inicio de sesión, se le solicitará cambiar su contraseña.
            </p>
            <p className="codigo-instructions" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <strong>Instrucciones de acceso:</strong><br />
              1. Ve a la página de login<br />
              2. Selecciona "Empleado"<br />
              3. Ingresa el usuario y contraseña mostrados abajo<br />
              4. En el primer acceso, deberá cambiar su contraseña
            </p>
            
            <div className="codigo-display">
              <div className="codigo-label">
                <Mail size={16} />
                Usuario (Email o Teléfono):
              </div>
              <div className="codigo-value-container">
                <code className="codigo-value">{empleadoCreado.usuario || empleadoCreado.employee_email || empleadoCreado.employee_phone}</code>
                <button 
                  className="btn-copiar-codigo"
                  onClick={() => {
                    const usuarioTexto = empleadoCreado.usuario || empleadoCreado.employee_email || empleadoCreado.employee_phone;
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
                <Lock size={16} />
                Contraseña inicial:
              </div>
              <div className="codigo-value-container">
                <code className="codigo-value" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {empleadoCreado.password || '********'}
                </code>
                <button 
                  className="btn-copiar-codigo"
                  onClick={() => {
                    const passwordTexto = empleadoCreado.password || '';
                    navigator.clipboard.writeText(passwordTexto);
                    setCodigoCopiado(true);
                    toast.success('Contraseña copiada');
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
            </div>

            <div className="codigo-warning">
              <p>⚠️ Guarda estas credenciales de forma segura. Se mostrarán solo una vez.</p>
              <p style={{ marginTop: '0.5rem', color: '#3b82f6' }}>
                💡 El empleado deberá cambiar su contraseña en el primer inicio de sesión.
              </p>
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
                Correo electrónico del empleado (opcional, para contacto)
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
                Teléfono del empleado (opcional, para contacto)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Usuario para Login (opcional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="email@ejemplo.com o 3001234567 (se generará automáticamente si no se proporciona)"
                />
              </div>
              
              {mostrarSugerenciasUsuario && sugerenciasUsuario.length > 0 && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: '#f0fdf4', 
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <small style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#166534',
                    fontWeight: '600'
                  }}>
                    💡 Sugerencias de usuario (basadas en el nombre):
                  </small>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem' 
                  }}>
                    {sugerenciasUsuario.map((sugerencia, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setUsuario(sugerencia);
                          setMostrarSugerenciasUsuario(false);
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: usuario === sugerencia ? '#22c55e' : 'white',
                          color: usuario === sugerencia ? 'white' : '#22c55e',
                          border: '1px solid #22c55e',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: usuario === sugerencia ? '600' : '400'
                        }}
                        onMouseEnter={(e) => {
                          if (usuario !== sugerencia) {
                            e.target.style.background = '#dcfce7';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (usuario !== sugerencia) {
                            e.target.style.background = 'white';
                          }
                        }}
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <small className="form-hint">
                El empleado usará este email o teléfono para iniciar sesión. Si no lo proporcionas, se generará automáticamente basado en el nombre.
                Puedes usar una sugerencia o crear tu propio usuario.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                Contraseña Inicial (opcional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres (se generará automáticamente si no se proporciona)"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {mostrarSugerencias && sugerenciasPassword.length > 0 && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: '#f0f9ff', 
                  borderRadius: '0.5rem',
                  border: '1px solid #bae6fd'
                }}>
                  <small style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#0369a1',
                    fontWeight: '600'
                  }}>
                    💡 Sugerencias de contraseña (basadas en el nombre):
                  </small>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem' 
                  }}>
                    {sugerenciasPassword.map((sugerencia, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setPassword(sugerencia);
                          setMostrarSugerencias(false);
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: password === sugerencia ? '#3b82f6' : 'white',
                          color: password === sugerencia ? 'white' : '#3b82f6',
                          border: '1px solid #3b82f6',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: password === sugerencia ? '600' : '400'
                        }}
                        onMouseEnter={(e) => {
                          if (password !== sugerencia) {
                            e.target.style.background = '#dbeafe';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (password !== sugerencia) {
                            e.target.style.background = 'white';
                          }
                        }}
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <small className="form-hint">
                La contraseña debe tener al menos 4 caracteres si la proporcionas manualmente. 
                Si no la proporcionas, se generará automáticamente basada en el nombre.
                Puedes usar una sugerencia o crear tu propia contraseña. 
                El empleado deberá cambiarla en su primer acceso.
              </small>
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
