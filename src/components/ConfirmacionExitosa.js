import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, LogIn } from 'lucide-react';
import styles from './ConfirmacionExitosa.module.css';

const ConfirmacionExitosa = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir al login después de 5 segundos
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <motion.div 
          className={styles.card}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Icono de éxito */}
          <motion.div 
            className={styles.successIcon}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <CheckCircle size={80} />
          </motion.div>

          {/* Título */}
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            ¡Cuenta confirmada!
          </motion.h1>

          {/* Mensaje */}
          <motion.p 
            className={styles.message}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de Crece+.
          </motion.p>

          {/* Información adicional */}
          <motion.div 
            className={styles.info}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className={styles.infoItem}>
              <CheckCircle size={16} />
              <span>Tu perfil ha sido creado automáticamente</span>
            </div>
            <div className={styles.infoItem}>
              <CheckCircle size={16} />
              <span>Ya puedes gestionar tu inventario y ventas</span>
            </div>
            <div className={styles.countdownInfo}>
              <ArrowRight size={16} />
              <span>Te redirigiremos al login en 5 segundos</span>
            </div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div 
            className={styles.actions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.button
              className={styles.loginButton}
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogIn size={20} />
              Iniciar sesión ahora
            </motion.button>
            
            <motion.button
              className={styles.homeButton}
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={20} />
              Ir al inicio
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Elementos decorativos */}
        <div className={styles.decorations}>
          <div className={styles.circle1}></div>
          <div className={styles.circle2}></div>
          <div className={styles.circle3}></div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionExitosa;
