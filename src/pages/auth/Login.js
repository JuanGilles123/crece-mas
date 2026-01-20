import React, { useState } from 'react';
import { supabase } from '../../services/api/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, TrendingUp, Users, BarChart3, Key } from 'lucide-react';
import { loginEmployee, loginEmployeeWithPassword } from '../../utils/employeeAuth';
import styles from './Login.module.css';

const TerminosModal = ({ open, onClose }) => (
  open ? (
    <div className={styles['modal-bg']}>
      <div className={styles['modal-content']}>
        <h3>Términos y Condiciones</h3>
        <div style={{maxHeight:'40vh',overflowY:'auto',margin:'1rem 0'}}>
          <p>Aquí van los términos y condiciones de uso de la plataforma. Puedes personalizarlos según tu negocio.</p>
        </div>
        <button className={styles['auth-btn']} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  ) : null
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  
  // Estados para login de empleado
  const [isEmployeeLogin, setIsEmployeeLogin] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showEmployeePass, setShowEmployeePass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (isEmployeeLogin) {
      // Login de empleado con código
      if (!employeeCode.trim()) {
        setError('Por favor ingresa tu código de empleado.');
        setLoading(false);
        return;
      }

      try {
        // Intentar login solo con código primero
        let result = await loginEmployee(employeeCode.trim().toUpperCase());
        
        // Si necesita contraseña, intentar con contraseña
        if (!result.success && result.needsPassword) {
          if (!employeePassword) {
            setError('Este código requiere contraseña. Por favor ingresa tu contraseña.');
            setLoading(false);
            return;
          }
          result = await loginEmployeeWithPassword(employeeCode.trim().toUpperCase(), employeePassword);
        }

        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      } catch (err) {
        setError('Error al autenticar empleado. Por favor intenta nuevamente.');
        console.error('Error en login de empleado:', err);
      }
    } else {
      // Login normal con email y contraseña
      if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
        setError('Por favor ingresa un correo válido.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('La contraseña debe tener al menos una letra mayúscula.');
        setLoading(false);
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError('La contraseña debe tener al menos una letra minúscula.');
        setLoading(false);
        return;
      }
      if (!/\d/.test(password)) {
        setError('La contraseña debe tener al menos un número.');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Usar sistema de manejo de errores seguro
        const { getErrorMessage } = await import('../../utils/errorHandler');
        setError(getErrorMessage(error));
      } else {
        navigate('/dashboard');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <TerminosModal open={showTerms} onClose={()=>setShowTerms(false)} />
      
      {/* Botón de regreso */}
      <motion.div 
        className={styles.backButton}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={20} />
          Volver al inicio
        </Link>
      </motion.div>

      <div className={styles.content}>
        {/* Panel izquierdo con información */}
        <motion.div 
          className={styles.infoPanel}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.logo}>
            <TrendingUp size={40} />
            <h1>Crece+</h1>
          </div>
          <h2>¡Bienvenido de vuelta!</h2>
          <p>Accede a tu panel de control y continúa gestionando tu negocio de manera eficiente.</p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <BarChart3 size={24} />
              <span>Dashboard completo</span>
            </div>
            <div className={styles.feature}>
              <Users size={24} />
              <span>Gestión de inventario</span>
            </div>
            <div className={styles.feature}>
              <TrendingUp size={24} />
              <span>Reportes en tiempo real</span>
            </div>
          </div>
        </motion.div>

        {/* Panel derecho con formulario */}
        <motion.div 
          className={styles.formPanel}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.form}>
            <div className={styles.formHeader}>
              <h2>Iniciar sesión</h2>
              <p>Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Toggle entre login normal y empleado */}
              <div className={styles.loginTypeToggle}>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${!isEmployeeLogin ? styles.active : ''}`}
                  onClick={() => {
                    setIsEmployeeLogin(false);
                    setError('');
                    setEmployeeCode('');
                    setEmployeePassword('');
                  }}
                >
                  <Mail size={24} />
                  <span>Administrador</span>
                </button>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${isEmployeeLogin ? styles.active : ''}`}
                  onClick={() => {
                    setIsEmployeeLogin(true);
                    setError('');
                    setEmail('');
                    setPassword('');
                  }}
                >
                  <Key size={24} />
                  <span>Empleado</span>
                </button>
              </div>

              {isEmployeeLogin ? (
                <>
                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Key size={20} className={styles.inputIcon} />
                      <input
                        type="text"
                        placeholder="Código (ej: 12345) o Teléfono + PIN (ej: 3001234567|1234)"
                        value={employeeCode}
                        onChange={e => {
                          const value = e.target.value;
                          // Si contiene |, mantener el formato, sino convertir a mayúsculas
                          setEmployeeCode(value.includes('|') ? value : value.toUpperCase());
                        }}
                        required
                        className={styles.input}
                      />
                    </div>
                    <small className={styles.hint}>
                      Puedes usar un código corto (5 dígitos) o tu teléfono + PIN (4 dígitos)
                    </small>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showEmployeePass ? 'text' : 'password'}
                        placeholder="Contraseña (opcional)"
                        value={employeePassword}
                        onChange={e => setEmployeePassword(e.target.value)}
                        className={styles.input}
                      />
                      <button 
                        type="button" 
                        className={styles.eyeButton}
                        onClick={() => setShowEmployeePass(v => !v)}
                      >
                        {showEmployeePass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <small className={styles.hint}>
                      Si tu código requiere contraseña, ingrésala aquí. Si no, deja este campo vacío.
                    </small>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Mail size={20} className={styles.inputIcon} />
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className={styles.input}
                      />
                      <button 
                        type="button" 
                        className={styles.eyeButton}
                        onClick={() => setShowPass(v => !v)}
                      >
                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.forgotPassword}>
                    <Link to="/recuperar" className={styles.forgotLink}>
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </>
              )}

              <motion.button 
                className={styles.submitButton} 
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </motion.button>

              {error && (
                <motion.div 
                  className={styles.error}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </form>

            <div className={styles.signupLink}>
              <p>¿No tienes cuenta? <Link to="/registro" className={styles.link}>Regístrate aquí</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
