import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowLeft, ShoppingBag, Smartphone, Clock, MessageCircle } from 'lucide-react';
import { loginEmployee } from '../../services/api/employeeAuthApi';
import { getEmployeeSession } from '../../utils/employeeSession';
import styles from './Login.module.css';
import { ReactComponent as LogoSVG } from '../../assets/logo-crece.svg';
import { TextAnimate } from '../../components/animations/TextAnimate';
import FlickeringGrid from '../../components/animations/FlickeringGrid';
import { LightRays } from '../../components/animations/LightRays';

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
    <div className={`${styles.container} ${styles.inverted}`}>
      <div className={styles.content}>
        
        {/* Panel izquierdo con información (Fondo Blanco) */}
        <motion.div 
          className={styles.infoPanel}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Animaciones de fondo estilo Home (ahora en el lado blanco) */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.8 }}>
            <LightRays />
            <FlickeringGrid 
              className="absolute inset-0 z-0 size-full"
              squareSize={4}
              gridGap={6}
              color="#02a5e0"
              maxOpacity={0.12}
              flickerChance={0.1}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Botón de regreso */}
            <motion.div 
              className={styles.backButton}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/" className={styles.backLink}>
                <ArrowLeft size={22} strokeWidth={2.5} style={{ stroke: '#111827' }} />
                Volver al inicio
              </Link>
            </motion.div>

            <div className={styles.logo}>
              <motion.div
                className={styles.logoAnimated}
                whileHover={{ rotate: -45, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <LogoSVG style={{ width: '100%', height: '100%' }} />
              </motion.div>
            </div>
            
            <TextAnimate content="¡Hola, equipo de trabajo!" animation="slideUp" as="h2" className={styles.loginTitle} />
            <div style={{ maxWidth: '90%', lineHeight: '1.6', fontSize: '1.05rem', opacity: 0.95, textAlign: 'center', margin: '0 auto', marginBottom: '2.5rem' }}>
              <TextAnimate content="Registra tus ventas de forma rápida, atiende a tus clientes y mantén el cuadre de caja al día de la forma más sencilla." animation="slideUp" as="p" delay={0.2} className={styles.loginSubtitle} />
            </div>
          
            <div className={styles.features}>
              <motion.div 
                className={styles.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ShoppingBag size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#014abb' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#111827' }}>Ventas en Tiempo Récord</strong>
                  <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.4', color: '#374151' }}>Registra productos, aplica descuentos y atiende a tus clientes rápidamente sin complicaciones.</span>
                </div>
              </motion.div>
              <motion.div 
                className={styles.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Clock size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#014abb' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#111827' }}>Control y Cierre de Turno</strong>
                  <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.4', color: '#374151' }}>Inicia y cierra tu jornada con cuadres de caja exactos. Entregas impecables garantizadas.</span>
                </div>
              </motion.div>
              <motion.div 
                className={styles.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Smartphone size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#014abb' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#111827' }}>Herramientas a la Mano</strong>
                  <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.4', color: '#374151' }}>Accede a tu historial de ventas y gestiona devoluciones fácilmente desde tu dispositivo.</span>
                </div>
              </motion.div>
            </div>

            <motion.div 
              style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(1,74,187,0.05)', borderRadius: '1rem', border: '1px solid rgba(1,74,187,0.1)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#111827' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageCircle size={18} color="#014abb" />
                <span>¿Tienes dudas sobre tu usuario o código de acceso?</span>
              </div>
              <strong style={{ paddingLeft: '1.6rem' }}>Consulta a tu administrador o escríbenos al WhatsApp: <a href="https://wa.me/573046422366" target="_blank" rel="noopener noreferrer" style={{ color: '#014abb', textDecoration: 'underline', fontWeight: 'bold' }}>304 642 2366</a></strong>
            </motion.div>
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
              <motion.div 
                className={styles.inputGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className={styles.inputWrapper}>
                  <User size={20} color="#ffffff" className={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={styles.input}
                    style={{ paddingLeft: '3rem', color: '#ffffff' }}
                  />
                </div>
              </motion.div>

              <motion.div 
                className={styles.inputGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className={styles.inputWrapper}>
                  <Lock size={20} color="#ffffff" className={styles.inputIcon} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Código"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                    required
                    className={styles.input}
                    style={{ paddingLeft: '3rem', color: '#ffffff' }}
                  />
                  <button 
                    type="button" 
                    className={styles.eyeButton}
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? <EyeOff size={20} color="#ffffff" /> : <Eye size={20} color="#ffffff" />}
                  </button>
                </div>
              </motion.div>

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

            <motion.div 
              className={styles.switchActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              <div className={styles.switchButton} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.9rem' }}>¿Eres propietario de la tienda?</span>
                <span style={{ color: '#1ad61a', fontWeight: 'bold', fontSize: '1rem' }}>Ir al panel de administradores</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginEmpleado;
