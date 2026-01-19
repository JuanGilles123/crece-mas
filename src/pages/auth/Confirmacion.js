import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';

const Confirmacion = () => {
  const navigate = useNavigate();

  return (
    <div className={styles['auth-container']} style={{minHeight:'60vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
      <div className={styles['auth-box']} style={{maxWidth:400,padding:'2.5rem 2rem',textAlign:'center'}}>
        <h2 style={{marginBottom:'1.2rem'}}>¡Correo confirmado!</h2>
        <p style={{marginBottom:'2rem'}}>Tu cuenta ha sido verificada correctamente.<br />Ya puedes iniciar sesión y comenzar a usar la plataforma.</p>
        <button className={styles['auth-btn']} onClick={() => navigate('/login')}>
          Ir a iniciar sesión
        </button>
      </div>
    </div>
  );
};

export default Confirmacion;
