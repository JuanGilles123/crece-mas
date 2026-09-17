import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, TrendingUp, Users, BarChart3, MessageCircle } from 'lucide-react';
import styles from './Login.module.css';
import { ReactComponent as LogoSVG } from '../../assets/logo-crece.svg';
import { TextAnimate } from '../../components/animations/TextAnimate';
import FlickeringGrid from '../../components/animations/FlickeringGrid';
import { LightRays } from '../../components/animations/LightRays';

const TerminosModal = ({ open, onClose }) => (
  open ? (
    <div className={styles['modal-bg']}>
      <div className={styles['modal-content']}>
        <h3>Términos y Condiciones</h3>
        <div style={{ maxHeight: '40vh', overflowY: 'auto', margin: '1rem 0', fontSize: '0.98rem', lineHeight: '1.6' }}>
          <ul style={{ paddingLeft: '1.2em' }}>
            <li><b>1. Aceptación de los términos:</b> Al crear una cuenta y utilizar esta plataforma, aceptas estos términos y condiciones. Si no estás de acuerdo, no debes usar la aplicación.</li>
            <li><b>2. Uso del servicio:</b> Esta aplicación SaaS se proporciona "tal cual". Nos reservamos el derecho de modificar, suspendier o discontinuar el servicio en cualquier momento sin previo aviso.</li>
            <li><b>3. Responsabilidad del usuario:</b> Eres responsable de la veracidad de los datos que ingresas y del uso que hagas de la plataforma. No uses la app para actividades ilegales o no autorizadas.</li>
            <li><b>4. Privacidad:</b> Tus datos serán tratados conforme a nuestra política de privacidad. No compartiremos tu información personal con terceros sin tu consentimiento, salvo requerimiento legal.</li>
            <li><b>5. Propiedad intelectual:</b> Todo el contenido, marcas y código fuente de la plataforma son propiedad de la empresa o sus licenciantes. No puedes copiar, modificar ni distribuir sin autorización.</li>
            <li><b>6. Cancelación y eliminación de cuenta:</b> Puedes cancelar tu cuenta en cualquier momento. Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>
            <li><b>7. Modificaciones:</b> Podemos actualizar estos términos en cualquier momento. Te notificaremos de cambios importantes por correo o en la app.</li>
            <li><b>8. Contacto:</b> Para dudas o consultas, contáctanos a <a href="mailto:legal@crecemas.co" style={{ color: 'var(--accent-primary)' }}>legal@crecemas.co</a>.</li>
          </ul>
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
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user;
      if (!sessionUser) {
        setError('Sin internet: solo puedes entrar si ya habías iniciado sesión en este dispositivo.');
        setLoading(false);
        return;
      }
      if (email && sessionUser.email && sessionUser.email.toLowerCase() !== email.toLowerCase()) {
        setError('Sin internet: solo puedes entrar con la cuenta usada anteriormente en este dispositivo.');
        setLoading(false);
        return;
      }
      navigate('/dashboard');
      setLoading(false);
      return;
    }
    
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
      


      <div className={styles.content}>
        {/* Panel izquierdo con información */}
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
              <ArrowLeft size={22} strokeWidth={2.5} style={{ stroke: '#ffffff', color: '#ffffff' }} />
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
          <TextAnimate content="¿Listo para hacer Crecer tu Negocio hoy?" animation="slideUp" as="h2" className={styles.loginTitle} />
          <TextAnimate content="Toma el control absoluto de tus ventas, inventarios y utilidades desde una sola herramienta en la nube." animation="slideUp" as="p" delay={0.2} className={styles.loginSubtitle} />
          
          <div className={styles.features}>
            <motion.div 
              className={styles.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BarChart3 size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#1ad61a' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem', color: '#ffffff' }}>Caja Registradora POS</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.4', color: 'rgba(255,255,255,0.9)' }}>Registra ventas en segundos con pago mixto, facturas y tickets en cualquier dispositivo.</span>
              </div>
            </motion.div>
            <motion.div 
              className={styles.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Users size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#1ad61a' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem', color: '#ffffff' }}>Control de Stock Inteligente</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.4', color: 'rgba(255,255,255,0.9)' }}>Evita pérdidas por descuadres de stock, recibe alertas de productos bajos y organiza tus categorías.</span>
              </div>
            </motion.div>
            <motion.div 
              className={styles.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <TrendingUp size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#1ad61a' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem', color: '#ffffff' }}>Utilidades y Caja Diaria</strong>
                <span style={{ fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.4', color: 'rgba(255,255,255,0.9)' }}>Visualiza tus ganancias netas, saldos e ingresos al instante desde cualquier lugar.</span>
              </div>
            </motion.div>
          </div>

          <motion.div 
            style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#ffffff', backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} color="#1ad61a" />
              <span>¿Tienes problemas de acceso o necesitas ayuda?</span>
            </div>
            <strong style={{ paddingLeft: '1.6rem' }}>Soporte rápido por WhatsApp: <a href="https://wa.me/573046422366" target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 'bold' }}>304 642 2366</a></strong>
          </motion.div>
        </motion.div>

        {/* Panel derecho con formulario */}
        <motion.div 
          className={styles.formPanel}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Animaciones de fondo estilo Home */}
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

          <div className={styles.form} style={{ position: 'relative', zIndex: 10 }}>
            <div className={styles.formHeader}>
              <h2>Iniciar sesión</h2>
              <p>Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit}>
              <motion.div 
                className={styles.inputGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className={styles.inputWrapper}>
                  <Mail size={20} color="#9ca3af" className={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={styles.input}
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
                  <Lock size={20} color="#9ca3af" className={styles.inputIcon} />
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
                    {showPass ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                  </button>
                </div>
              </motion.div>

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

            <motion.div 
              className={styles.switchActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link to="/login-empleado" className={styles.switchButton}>
                ¿Eres empleado? Ir al panel de empleados
              </Link>
            </motion.div>

            <motion.div 
              className={styles.signupLink}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p>¿No tienes cuenta? <Link to="/registro" className={styles.link}>Regístrate aquí</Link></p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
