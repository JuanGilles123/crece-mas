import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft, Clock, RefreshCw, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import styles from './ConfirmacionCorreo.module.css';

const ConfirmacionCorreo = ({ email = 'usuario@ejemplo.com' }) => {
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  // Countdown para redirigir al home
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/');
    }
  }, [countdown, navigate]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error('Error al reenviar el correo: ' + error.message);
      } else {
        toast.success('¡Correo reenviado! Revisa tu bandeja de entrada.');
      }
    } catch (error) {
      toast.error('Error inesperado al reenviar el correo.');
    } finally {
      setIsResending(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <motion.div 
          className={styles.card}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Icono principal */}
          <motion.div 
            className={styles.iconContainer}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <Mail size={48} className={styles.mailIcon} />
            <div className={styles.checkIcon}>
              <CheckCircle size={24} />
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            ¡Correo enviado!
          </motion.h1>

          {/* Subtítulo */}
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Hemos enviado un enlace de confirmación a:
          </motion.p>

          {/* Email destacado */}
          <motion.div 
            className={styles.emailContainer}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Mail size={20} />
            <span className={styles.email}>{email}</span>
          </motion.div>

          {/* Instrucciones */}
          <motion.div 
            className={styles.instructions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepText}>
                <strong>Revisa tu bandeja de entrada</strong>
                <span>Busca un correo de Crece+</span>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepText}>
                <strong>Haz clic en el enlace</strong>
                <span>Confirma tu cuenta para activarla</span>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepText}>
                <strong>¡Listo!</strong>
                <span>Ya puedes acceder a tu cuenta</span>
              </div>
            </div>
          </motion.div>

          {/* Información adicional */}
          <motion.div 
            className={styles.info}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className={styles.infoItem}>
              <Clock size={16} />
              <span>El enlace expira en 24 horas</span>
            </div>
            <div className={styles.infoItem}>
              <RefreshCw size={16} />
              <span>¿No recibiste el correo? Revisa tu carpeta de spam</span>
            </div>
            <div className={styles.countdownInfo}>
              <Home size={16} />
              <span>Te redirigiremos al inicio en {countdown} segundos</span>
            </div>
          </motion.div>

          {/* Botones de acción */}
          <motion.div 
            className={styles.actions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.button
              className={styles.resendButton}
              onClick={handleResendEmail}
              disabled={isResending}
              whileHover={{ scale: isResending ? 1 : 1.05 }}
              whileTap={{ scale: isResending ? 1 : 0.95 }}
            >
              <RefreshCw size={20} className={isResending ? styles.spinning : ''} />
              {isResending ? 'Reenviando...' : 'Reenviar correo'}
            </motion.button>
            
            <motion.button
              className={styles.homeButton}
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={20} />
              Ir al inicio ahora
            </motion.button>
            
            <Link to="/confirmacion-exitosa" className={styles.backButton}>
              <ArrowLeft size={20} />
              Ver confirmación
            </Link>
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

export default ConfirmacionCorreo;
