import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowLeft, ShoppingBag, Smartphone, Clock } from 'lucide-react';
import { loginEmployee } from '../../services/api/employeeAuthApi';
import { getEmployeeSession } from '../../utils/employeeSession';
import styles from './Login.module.css';

const LoginEmpleado = () => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const session = getEmployeeSession();
      if (!session) {
        setError('Sin internet: solo puedes entrar si ya habías iniciado sesión en este dispositivo.');
        setLoading(false);
        return;
      }
      const cachedUsername = session.employee_username;
      if (cachedUsername && cachedUsername.toLowerCase() !== username.toLowerCase().trim()) {
        setError('Sin internet: solo puedes entrar con el usuario usado anteriormente en este dispositivo.');
        setLoading(false);
        return;
      }
      navigate('/empleado');
      setLoading(false);
      return;
    }

    if (!username.trim()) {
      setError('Por favor ingresa tu usuario.');
      setLoading(false);
      return;
    }

    if (!code.trim()) {
      setError('Por favor ingresa tu código.');
      setLoading(false);
      return;
    }

    try {
      await loginEmployee({ username, code });
      navigate('/empleado');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>


      <div className={styles.content}>
        {/* Panel izquierdo con información para empleados */}
        <motion.div 
          className={styles.infoPanel}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
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

          <div className={styles.logo}>
            <img
              src="/logo-crece.svg"
              alt="Crece+"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h2>¡Hola, equipo de trabajo!</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.95, lineHeight: '1.5', marginBottom: '2.5rem' }}>
            Registra tus ventas de forma rápida, atiende a tus clientes y mantén el cuadre de caja al día de la forma más sencilla.
          </p>
          
          <div className={styles.features}>
            <div className={styles.feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '1rem', border: '1px solid rgba(6,47,135,0.1)', transition: 'all 0.3s ease' }}>
              <ShoppingBag size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#111827' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Atención al Cliente POS</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.4' }}>Registra productos en segundos, aplica descuentos y completa transacciones al instante.</span>
              </div>
            </div>
            <div className={styles.feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '1rem', border: '1px solid rgba(6,47,135,0.1)', transition: 'all 0.3s ease' }}>
              <Clock size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#111827' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Cierre y Control del Turno</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.4' }}>Haz tus entregas de turno de manera impecable y sin dolores de cabeza por descuadres.</span>
              </div>
            </div>
            <div className={styles.feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '1rem', border: '1px solid rgba(6,47,135,0.1)', transition: 'all 0.3s ease' }}>
              <Smartphone size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#111827' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Sincronización en la Nube</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.4' }}>Tus ventas se actualizan automáticamente para que el administrador las vea en tiempo real.</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.5)', borderRadius: '1rem', border: '1px solid rgba(6,47,135,0.15)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#111827' }}>
            <span>💬 ¿Tienes dudas sobre tu usuario o código de acceso?</span>
            <strong>Consulta a tu administrador o escríbenos al WhatsApp: <a href="https://wa.me/573046422366" target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'underline', fontWeight: 'bold' }}>304 642 2366</a></strong>
          </div>
        </motion.div>

        <motion.div 
          className={styles.formPanel}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.form}>
            <div className={styles.formHeader}>
              <h2>Acceso de Empleados</h2>
              <p>Ingresa tu usuario y código</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <User size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    placeholder="Código"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                    required
                    className={styles.input}
                  />
                  <button 
                    type="button" 
                    className={styles.eyeButton}
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button 
                className={styles.submitButton} 
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Iniciando sesión...' : 'Entrar'}
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
              <Link to="/login" className={styles.switchButton}>
                ¿Eres propietario? Ir al panel de propietarios
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginEmpleado;
