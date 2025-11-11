import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './SubscriptionCallback.css';

const SubscriptionCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('Verificando tu pago...');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const id = searchParams.get('id'); // Transaction ID de Wompi
        const isTest = searchParams.get('test') === 'true'; // Pago de test
        
        // Si es un pago de test, mostrar éxito inmediatamente
        if (isTest) {
          setStatus('success');
          setMessage('¡Tu suscripción de prueba está activa!');
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            navigate('/dashboard');
            // Recargar para actualizar la suscripción
            window.location.href = '/dashboard';
          }, 3000);
          return;
        }
        
        if (!id) {
          setStatus('error');
          setMessage('No se encontró información del pago');
          return;
        }

        // Esperar un momento para que el webhook procese
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verificar si el pago fue procesado
        const { data: payment, error } = await supabase
          .from('payments')
          .select('status, plan_id, subscriptions(plan:subscription_plans(name))')
          .eq('wompi_transaction_id', id)
          .single();

        if (error || !payment) {
          setStatus('error');
          setMessage('No pudimos verificar tu pago. Por favor contacta a soporte.');
          return;
        }

        if (payment.status === 'completed') {
          setStatus('success');
          const planName = payment.subscriptions?.plan?.name || 'tu nuevo plan';
          setMessage(`¡Tu suscripción a ${planName} está activa!`);
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else if (payment.status === 'failed') {
          setStatus('error');
          setMessage('El pago fue rechazado. Por favor intenta de nuevo.');
        } else {
          setStatus('loading');
          setMessage('Tu pago está siendo procesado...');
          
          // Reintentar después de 5 segundos
          setTimeout(checkPaymentStatus, 5000);
        }

      } catch (error) {
        console.error('Error verificando pago:', error);
        setStatus('error');
        setMessage('Hubo un error verificando tu pago');
      }
    };

    checkPaymentStatus();
  }, [searchParams, navigate]);

  return (
    <div className="subscription-callback">
      <motion.div
        className="callback-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {status === 'loading' && (
          <>
            <div className="callback-icon loading">
              <Loader size={64} />
            </div>
            <h1>Procesando pago</h1>
            <p>{message}</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              className="callback-icon success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <CheckCircle size={64} />
            </motion.div>
            <h1>¡Pago exitoso!</h1>
            <p>{message}</p>
            <button className="callback-btn" onClick={() => navigate('/dashboard')}>
              Ir al Dashboard
              <ArrowRight size={20} />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="callback-icon error">
              <XCircle size={64} />
            </div>
            <h1>Error en el pago</h1>
            <p>{message}</p>
            <div className="callback-actions">
              <button className="callback-btn secondary" onClick={() => navigate('/pricing')}>
                Intentar de nuevo
              </button>
              <button className="callback-btn" onClick={() => navigate('/dashboard')}>
                Volver al Dashboard
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionCallback;
