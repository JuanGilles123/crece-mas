
import React from 'react';
import styles from './Home.module.css';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.landingBox}>
        <h1 className={styles.title}>Bienvenido a Crece+ </h1>
        <p className={styles.subtitle}>Gestiona tu inventario y ventas de forma moderna, segura y desde cualquier lugar.</p>
        <div className={styles.landingActions}>
          <Link to="/login" className={styles.landingBtn + ' ' + styles.loginBtn}>Iniciar sesión</Link>
          <Link to="/registro" className={styles.landingBtn + ' ' + styles.registerBtn}>Registrarse</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
