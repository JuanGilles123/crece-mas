import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { MailIcon, LockIcon } from './Icons';
import { EyeIcon } from './EyeIcon';

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
    <div className={styles['auth-bg']}>
      <TerminosModal open={showTerms} onClose={()=>setShowTerms(false)} />
      <div className={styles['auth-container']}>
        <div className={styles['auth-side']}>
          <h1>Bienvenido de nuevo</h1>
          <p>Accede para gestionar tu caja, inventario y dashboard.</p>
        </div>
        <div className={styles['auth-card']}>
          <h2>Iniciar sesión</h2>
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
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{flex:1,background:'transparent',boxShadow:'none'}}
              />
              <button type="button" style={{background:'none',border:'none',cursor:'pointer',marginLeft:8,padding:0}} onClick={()=>setShowPass(v=>!v)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            <button className={styles['auth-btn']} type="submit">Entrar</button>
            {error && <p style={{color:'red'}}>{error}</p>}
          </form>
          <div>
            <Link className={styles['auth-link']} to="/recuperar">Olvidé mi contraseña</Link>
            <Link className={`${styles['auth-link']} ${styles['green']}`} to="/registro">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
