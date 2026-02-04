import React, { useState } from 'react';
import { supabase } from '../../services/api/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, TrendingUp, Users, BarChart3 } from 'lucide-react';
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
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Login normal con email y contraseña (solo owner)
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
            <img
              src="/logo-crece.svg"
              alt="Crece+"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
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

            <div className={styles.switchActions}>
              <Link to="/login-empleado" className={styles.switchButton}>
                ¿Eres empleado? Ir al panel de empleados
              </Link>
            </div>

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
