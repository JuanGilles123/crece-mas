import { useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from './Auth.module.css';
import { MailIcon } from './Icons';
import { Link } from 'react-router-dom';

const Recuperar = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/restablecer-contraseña'
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
    }
  };

  return (
    <div className={styles['auth-bg']}>
      <div className={styles['auth-container']}>
        <div className={styles['auth-side']}>
          <h1>¿Olvidaste tu contraseña?</h1>
          <p>Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
        </div>
        <div className={styles['auth-card']}>
          <h2>Recuperar contraseña</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles['auth-input']}>
              <MailIcon />
              <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className={styles['auth-btn']} type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            {error && <p style={{color:'red'}}>{error}</p>}
            {success && <p style={{color:'green'}}>{success}</p>}
          </form>
          <Link className={styles['auth-link']} to="/login">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Recuperar;
