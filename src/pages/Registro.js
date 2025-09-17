import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styles from './Auth.module.css';
import { MailIcon, LockIcon } from './Icons';
import { EyeIcon } from './EyeIcon';
import { currencyList } from './currencies';

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
            <li><b>8. Contacto:</b> Para dudas o consultas, contáctanos a <a href="mailto:soporte@tudominio.com" style={{color:'#1e90ff'}}>soporte@tudominio.com</a>.</li>
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
  const navigate = useNavigate();

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
    // Registro en Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      phone: '+' + phone
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
    // Guardar perfil en tabla perfiles (usando el id del usuario creado)
    // Esperar a que el usuario esté confirmado
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setError('No se pudo obtener el usuario para crear el perfil.');
      return;
    }
    const { error: perfilError } = await supabase.from('perfiles').insert([
      { id: userData.user.id, moneda: currency }
    ]);
    if (perfilError) {
      setError(perfilError.message);
    } else {
      setSuccess('¡Registro exitoso! Revisa tu correo o SMS para confirmar.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className={styles['auth-bg']}>
      <TerminosModal open={showTerms} onClose={() => setShowTerms(false)} />
      <div className={styles['auth-container']}>
        <div className={styles['auth-side']}>
          <h1>¡Crea tu cuenta!</h1>
          <p>Regístrate para gestionar tu caja, inventario y dashboard.</p>
        </div>
        <div className={styles['auth-card']}>
          <h2>Registro</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles['auth-input']} style={{boxShadow:'none',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e0e0e0'}}>
              <MailIcon />
              <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{background:'transparent',boxShadow:'none'}}
              />
            </div>
            <div className={styles['auth-input']} style={{boxShadow:'none',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e0e0e0'}}>
              <LockIcon />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{flex:1,background:'transparent',boxShadow:'none'}}
              />
              <button type="button" style={{background:'none',border:'none',cursor:'pointer',marginLeft:8,padding:0}} onClick={()=>setShowPass(v=>!v)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <PhoneInput
                country={'co'}
                value={phone}
                onChange={setPhone}
                inputStyle={{width:'100%',background:'rgba(255,255,255,0.95)',boxShadow:'none',border:'1.5px solid #e0e0e0'}}
                inputClass={styles['auth-input']}
                specialLabel=""
                placeholder="Número de teléfono"
                enableSearch
                required
              />
            </div>
            <div style={{marginBottom:'1rem'}}>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #e0e0e0',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',background:'rgba(255,255,255,0.95)'}} required>
                <option value="">Selecciona tu moneda</option>
                {currencyList.map(c => (
                  <option key={c.code} value={c.code} style={{whiteSpace:'nowrap',textOverflow:'ellipsis',overflow:'hidden'}}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:'1rem',display:'flex',alignItems:'center',fontSize:'0.97rem'}}>
              <input type="checkbox" id="terms" checked={acceptTerms} onChange={e=>setAcceptTerms(e.target.checked)} required style={{marginRight:8}} />
              <label htmlFor="terms">Acepto los <span style={{color:'#1e90ff',cursor:'pointer'}} onClick={()=>setShowTerms(true)}>términos y condiciones</span></label>
            </div>
            <button className={styles['auth-btn']} type="submit">Registrarse</button>
            {error && <p style={{color:'red'}}>{error}</p>}
            {success && <p style={{color:'green'}}>{success}</p>}
          </form>
          <Link className={styles['auth-link']} to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Registro;
