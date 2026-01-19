import { useState } from 'react';
<<<<<<< Updated upstream
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
=======
import { supabase } from '../../services/api/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
>>>>>>> Stashed changes
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, TrendingUp, Users, BarChart3, Phone, Globe } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import ConfirmacionCorreo from '../../components/ConfirmacionCorreo';
import styles from './Registro.module.css';

const TerminosModal = ({ open, onClose }) => (
  open ? (
    <div className={styles['modal-bg']}>
      <div className={styles['modal-content']}>
        <h3>Términos y Condiciones</h3>
        <div style={{maxHeight:'40vh',overflowY:'auto',margin:'1rem 0',fontSize:'0.98rem',lineHeight:'1.6'}}>
          <ul style={{paddingLeft: '1.2em'}}>
            <li><b>1. Aceptación de los términos:</b> Al crear una cuenta y utilizar esta plataforma, aceptas estos términos y condiciones. Si no estás de acuerdo, no debes usar la aplicación.</li>
            <li><b>2. Uso del servicio:</b> Esta aplicación SaaS se proporciona "tal cual". Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento sin previo aviso.</li>
            <li><b>3. Responsabilidad del usuario:</b> Eres responsable de la veracidad de los datos que ingresas y del uso que hagas de la plataforma. No uses la app para actividades ilegales o no autorizadas.</li>
            <li><b>4. Privacidad:</b> Tus datos serán tratados conforme a nuestra política de privacidad. No compartiremos tu información personal con terceros sin tu consentimiento, salvo requerimiento legal.</li>
            <li><b>5. Propiedad intelectual:</b> Todo el contenido, marcas y código fuente de la plataforma son propiedad de la empresa o sus licenciantes. No puedes copiar, modificar ni distribuir sin autorización.</li>
            <li><b>6. Cancelación y eliminación de cuenta:</b> Puedes cancelar tu cuenta en cualquier momento. Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>
            <li><b>7. Modificaciones:</b> Podemos actualizar estos términos en cualquier momento. Te notificaremos de cambios importantes por correo o en la app.</li>
            <li><b>8. Contacto:</b> Para dudas o consultas, contáctanos a <a href="mailto:soporte@tudominio.com" style={{color:'var(--accent-primary)'}}>soporte@tudominio.com</a>.</li>
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
  const [currency, setCurrency] = useState('USD');
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
          data: {
            full_name: email.split('@')[0],
            phone: '+' + phone,
            currency: currency
          }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
        } else if (signUpError.message.toLowerCase().includes('email')) {
          setError('El correo no es válido o ya está registrado.');
        } else {
          setError('Error: ' + signUpError.message);
        }
        return;
      }

      // Si el registro fue exitoso, mostrar confirmación inmediatamente
      if (data.user) {
        setShowConfirmation(true);
      }
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
          <h2>¡Únete a Crece+!</h2>
          <p>Comienza a gestionar tu negocio de manera profesional y eficiente. Regístrate y descubre todas las herramientas que necesitas.</p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <BarChart3 size={20} />
              <span>Dashboard completo</span>
            </div>
            <div className={styles.feature}>
              <Users size={20} />
              <span>Gestión de inventario</span>
            </div>
            <div className={styles.feature}>
              <TrendingUp size={20} />
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
              <h2>Crear cuenta</h2>
              <p>Completa los datos para comenzar</p>
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
                    placeholder="Contraseña (mínimo 8 caracteres)"
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

              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <Phone size={20} className={styles.inputIcon} />
                  <div className={styles.phoneInputContainer}>
                    <PhoneInput
                      country={'co'}
                      value={phone}
                      onChange={setPhone}
                      placeholder="Número de teléfono"
                      enableSearch
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <div className={`${styles.inputWrapper} ${styles.currencySelect}`}>
                  <Globe size={20} className={styles.inputIcon} />
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
              </div>


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
                  Acepto los <span className={styles.termsLink} onClick={() => setShowTerms(true)}>términos y condiciones</span>
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
