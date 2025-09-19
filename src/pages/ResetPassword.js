import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import styles from './Auth.module.css';
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from './EyeIcon';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase maneja el token internamente al cargar esta pantalla tras el link
    // No es necesario extraer el token manualmente
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('¡Contraseña actualizada! Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className={styles['auth-bg']}>
      <div className={styles['auth-container']}>
        <div className={styles['auth-side']}>
          <h1>Restablecer contraseña</h1>
          <p>Ingresa tu nueva contraseña para continuar.</p>
        </div>
        <div className={styles['auth-card']}>
          <h2>Nueva contraseña</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles['auth-input']} style={{boxShadow:'none',background:'var(--bg-input)',border:'1.5px solid var(--border-primary)'}}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={{flex:1,background:'transparent',boxShadow:'none'}}
              />
              <button type="button" style={{background:'none',border:'none',cursor:'pointer',marginLeft:8,padding:0}} onClick={()=>setShowPass(v=>!v)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            <button className={styles['auth-btn']} type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
            {error && <p style={{color:'red'}}>{error}</p>}
            {success && <p style={{color:'green'}}>{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
