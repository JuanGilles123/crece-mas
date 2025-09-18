import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';
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
    <div className={styles.container}>
      <TerminosModal open={showTerms} onClose={()=>setShowTerms(false)} />
      <div className={styles.form}>
        <h2 className={styles.title}>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={styles.input}
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button" 
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }} 
                onClick={() => setShowPass(v => !v)}
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
            <button className={styles.button} type="submit">Entrar</button>
            {error && <div className={styles.error}>{error}</div>}
          </form>
          <div className={styles.links}>
            <Link className={styles.link} to="/recuperar">Olvidé mi contraseña</Link>
            <Link className={styles.link} to="/registro">Crear cuenta</Link>
          </div>
        </div>
      </div>
  );
};

export default Login;
