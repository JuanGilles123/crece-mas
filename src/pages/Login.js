import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError('Por favor ingresa un correo válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe tener al menos una letra mayúscula.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('La contraseña debe tener al menos una letra minúscula.');
      return;
    }
    if (!/\d/.test(password)) {
      setError('La contraseña debe tener al menos un número.');
      return;
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else if (error.message.toLowerCase().includes('email')) {
        setError('El correo no es válido o no está registrado.');
      } else {
        setError('Error: ' + error.message);
      }
    } else {
      navigate('/dashboard');
    }
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Iniciar sesión
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
