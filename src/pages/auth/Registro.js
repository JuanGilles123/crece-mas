import { useState } from 'react';
import { supabase } from '../../services/api/supabaseClient';
// ...existing imports...
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, TrendingUp, Users, BarChart3, Phone, Globe } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import ConfirmacionCorreo from '../../components/ConfirmacionCorreo';
import styles from './Registro.module.css';
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
            <li><b>2. Uso del servicio:</b> Esta aplicación SaaS se proporciona "tal cual". Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento sin previo aviso.</li>
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

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const validate = () => {
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return 'Por favor ingresa un correo válido.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una letra mayúscula.';
    if (!/[a-z]/.test(password)) return 'La contraseña debe tener al menos una letra minúscula.';
    if (!/\d/.test(password)) return 'La contraseña debe tener al menos un número.';
    if (!phone || phone.length < 8) return 'Número de teléfono inválido.';
    if (!currency) return 'Selecciona una moneda.';
    if (!acceptTerms) return 'Debes aceptar los términos y condiciones para continuar.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Registro en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: email.split('@')[0],
            phone: '+' + phone,
            currency: currency
          }
        }
      });

      if (signUpError) {
        if (signUpError.status === 429 || signUpError.message.toLowerCase().includes('rate limit') || signUpError.message.toLowerCase().includes('too many')) {
          setError('Demasiados intentos de registro. Por favor espera unos minutos antes de intentarlo de nuevo.');
        } else if (signUpError.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
        } else if (signUpError.message.toLowerCase().includes('email')) {
          setError('El correo no es válido o ya está registrado.');
        } else {
          setError('Error: ' + signUpError.message);
        }
        return;
      }

      // ...eliminar aceptación automática legal...

      try {
        await supabase.functions.invoke('send-welcome', {
          body: {
            userId: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || email.split('@')[0]
          }
        });
      } catch (welcomeError) {
        console.warn('No se pudo enviar correo de bienvenida:', welcomeError);
      }

      // El correo de confirmación es enviado automáticamente por supabase.auth.signUp()
      // Se removió el envío redundante para evitar invalidar el primer token.

      setShowConfirmation(true);
    } catch (error) {
      setError('Error inesperado durante el registro.');
    }
  };

  // Si se debe mostrar la confirmación, renderizar el componente de confirmación
  if (showConfirmation) {
    return <ConfirmacionCorreo email={email} />;
  }

  return (
    <div className={styles.container}>
      <TerminosModal open={showTerms} onClose={() => setShowTerms(false)} />



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
              <ArrowLeft size={20} />
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
          
          <TextAnimate content="¡Únete a Crece+!" animation="slideUp" as="h2" className={styles.loginTitle} />
          <div style={{ maxWidth: '90%', lineHeight: '1.6', fontSize: '1.15rem', opacity: 0.95 }}>
            <TextAnimate content="Comienza a gestionar tu negocio de manera profesional y eficiente. Regístrate y descubre todas las herramientas que necesitas." animation="slideUp" as="p" delay={0.2} className={styles.loginSubtitle} />
          </div>

          <div className={styles.features}>
            <motion.div 
              className={styles.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BarChart3 size={28} style={{ flexShrink: 0, marginTop: '0.2rem', color: '#1ad61a' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#ffffff' }}>Dashboard completo</strong>
                <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.4', color: 'rgba(255,255,255,0.9)' }}>Obtén una visión general de tu negocio en tiempo real.</span>
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
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#ffffff' }}>Gestión de inventario</strong>
                <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.4', color: 'rgba(255,255,255,0.9)' }}>Controla tu stock y evita pérdidas con alertas automáticas.</span>
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
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#ffffff' }}>Reportes financieros</strong>
                <span style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.4', color: 'rgba(255,255,255,0.9)' }}>Analiza tus ventas y toma decisiones basadas en datos.</span>
              </div>
            </motion.div>
          </div>
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
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }}>
            <LightRays />
            <FlickeringGrid 
              className="absolute inset-0 z-0 size-full"
              squareSize={4}
              gridGap={6}
              color="#02a5e0"
              maxOpacity={0.1}
              flickerChance={0.1}
            />
          </div>

          <div className={styles.form} style={{ position: 'relative', zIndex: 10 }}>
            <div className={styles.formHeader}>
              <h2>Crear cuenta</h2>
              <p>Completa los datos para comenzar</p>
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
                    placeholder="Contraseña (mín. 8 caracteres)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={styles.input}
                  />
                  <button type="button" className={styles.eyeButton} onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                  </button>
                </div>
              </motion.div>

              <motion.div 
                className={styles.inputGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className={styles.inputWrapper}>
                  <div className={styles.phoneInputContainer} style={{ width: '100%' }}>
                    <PhoneInput
                      country={'co'}
                      value={phone}
                      onChange={setPhone}
                      inputClass={styles.input}
                      buttonStyle={{
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '1rem 0 0 1rem',
                        paddingLeft: '0.5rem'
                      }}
                      placeholder="Número de teléfono"
                      enableSearch
                      required
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className={styles.inputGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className={styles.inputWrapper}>
                  <Globe size={20} color="#9ca3af" className={styles.inputIcon} />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className={styles.select}
                    required
                  >
                    <option value="">Selecciona tu moneda</option>
                    <option value="USD">USD - Dólar Estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="COP">COP - Peso Colombiano</option>
                      <option value="MXN">MXN - Peso Mexicano</option>
                      <option value="ARS">ARS - Peso Argentino</option>
                      <option value="BRL">BRL - Real Brasileño</option>
                      <option value="CLP">CLP - Peso Chileno</option>
                      <option value="PEN">PEN - Sol Peruano</option>
                      <option value="UYU">UYU - Peso Uruguayo</option>
                      <option value="VES">VES - Bolívar Venezolano</option>
                      <option value="GBP">GBP - Libra Esterlina</option>
                      <option value="JPY">JPY - Yen Japonés</option>
                      <option value="CAD">CAD - Dólar Canadiense</option>
                      <option value="AUD">AUD - Dólar Australiano</option>
                      <option value="CHF">CHF - Franco Suizo</option>
                      <option value="CNY">CNY - Yuan Chino</option>
                      <option value="INR">INR - Rupia India</option>
                      <option value="KRW">KRW - Won Surcoreano</option>
                      <option value="SGD">SGD - Dólar de Singapur</option>
                      <option value="HKD">HKD - Dólar de Hong Kong</option>
                      <option value="NZD">NZD - Dólar Neozelandés</option>
                      <option value="SEK">SEK - Corona Sueca</option>
                      <option value="NOK">NOK - Corona Noruega</option>
                      <option value="DKK">DKK - Corona Danesa</option>
                      <option value="PLN">PLN - Złoty Polaco</option>
                      <option value="CZK">CZK - Corona Checa</option>
                      <option value="HUF">HUF - Forinto Húngaro</option>
                      <option value="RUB">RUB - Rublo Ruso</option>
                      <option value="TRY">TRY - Lira Turca</option>
                      <option value="ZAR">ZAR - Rand Sudafricano</option>
                      <option value="EGP">EGP - Libra Egipcia</option>
                      <option value="MAD">MAD - Dirham Marroquí</option>
                      <option value="NGN">NGN - Naira Nigeriana</option>
                      <option value="KES">KES - Chelín Keniano</option>
                      <option value="GHS">GHS - Cedi Ghanés</option>
                      <option value="TND">TND - Dinar Tunecino</option>
                      <option value="DZD">DZD - Dinar Argelino</option>
                      <option value="LYD">LYD - Dinar Libio</option>
                      <option value="ETB">ETB - Birr Etíope</option>
                      <option value="UGX">UGX - Chelín Ugandés</option>
                      <option value="TZS">TZS - Chelín Tanzano</option>
                      <option value="MWK">MWK - Kwacha Malauí</option>
                      <option value="ZMW">ZMW - Kwacha Zambiano</option>
                      <option value="BWP">BWP - Pula Botsuano</option>
                      <option value="SZL">SZL - Lilangeni Suazi</option>
                      <option value="LSL">LSL - Loti Lesotense</option>
                      <option value="NAD">NAD - Dólar Namibio</option>
                      <option value="MUR">MUR - Rupia Mauriciana</option>
                      <option value="SCR">SCR - Rupia Seychellense</option>
                      <option value="KMF">KMF - Franco Comorense</option>
                      <option value="DJF">DJF - Franco Yibutiano</option>
                      <option value="ERN">ERN - Nakfa Eritreo</option>
                      <option value="SOS">SOS - Chelín Somalí</option>
                      <option value="SLL">SLL - Leone Sierraleonés</option>
                      <option value="GMD">GMD - Dalasi Gambiano</option>
                      <option value="GNF">GNF - Franco Guineano</option>
                      <option value="LRD">LRD - Dólar Liberiano</option>
                      <option value="CDF">CDF - Franco Congoleño</option>
                      <option value="AOA">AOA - Kwanza Angoleño</option>
                      <option value="MZN">MZN - Metical Mozambiqueño</option>
                      <option value="BIF">BIF - Franco Burundés</option>
                      <option value="RWF">RWF - Franco Ruandés</option>
                      <option value="XOF">XOF - Franco CFA BCEAO</option>
                      <option value="XAF">XAF - Franco CFA BEAC</option>
                      <option value="XPF">XPF - Franco CFP</option>
                    </select>
                </div>
              </motion.div>


              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  required
                  className={styles.checkbox}
                />
                <label htmlFor="terms" className={styles.checkboxLabel}>
                  Acepto los{' '}
                  <span className={styles.termsLink} onClick={() => setShowTerms(true)}>términos y condiciones</span>
                </label>
              </div>

              <motion.button
                className={styles.submitButton}
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Crear cuenta
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

              {success && (
                <motion.div
                  className={styles.success}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {success}
                </motion.div>
              )}
            </form>

            <div className={styles.signinLink}>
              <p>¿Ya tienes cuenta? <Link to="/login" className={styles.link}>Inicia sesión aquí</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Registro;
