import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import './SubscriptionCallback.css';

const SubscriptionCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const { refreshSubscription } = useSubscription();
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

        // Esperar un momento para que el webhook procese (el webhook puede tardar unos segundos)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verificar el estado del pago y suscripción
        // Buscar por transaction_id primero, si no por reference
        const reference = searchParams.get('reference') || searchParams.get('ref');
        
        let payment = null;
        let attempts = 0;
        const maxAttempts = 10; // Intentar por hasta 30 segundos (10 intentos x 3 segundos)

        while (attempts < maxAttempts && !payment) {
          // Buscar pago por transaction_id (puede estar en diferentes formatos)
          if (id) {
            // Intentar búsqueda exacta primero
            let { data: paymentById } = await supabase
              .from('payments')
              .select('*, subscription_id, plan_id, organization_id')
              .eq('wompi_transaction_id', id)
              .maybeSingle();
            
            // Si no se encuentra, buscar por LIKE (por si el ID está parcialmente)
            if (!paymentById && id.length > 10) {
              const { data: paymentByPartial } = await supabase
                .from('payments')
                .select('*, subscription_id, plan_id, organization_id')
                .like('wompi_transaction_id', `%${id}%`)
                .maybeSingle();
              
              paymentById = paymentByPartial;
            }
            
            if (paymentById) {
              payment = paymentById;
              break;
            }
          }

          // Si no se encontró y hay reference, buscar por reference
          if (reference && !payment) {
            const { data: paymentByRef } = await supabase
              .from('payments')
              .select('*, subscription_id, plan_id, organization_id')
              .eq('wompi_reference', reference)
              .maybeSingle();
            
            if (paymentByRef) {
              payment = paymentByRef;
              break;
            }
          }
          
          // También buscar por ID en el reference (Wompi a veces pasa el ID como reference)
          if (id && !payment) {
            const { data: paymentByRefId } = await supabase
              .from('payments')
              .select('*, subscription_id, plan_id, organization_id')
              .eq('wompi_reference', id)
              .maybeSingle();
            
            if (paymentByRefId) {
              payment = paymentByRefId;
              break;
            }
          }

          // Si no se encontró, esperar y reintentar
          if (!payment) {
            attempts++;
            if (attempts < maxAttempts) {
              setMessage(`Verificando pago... (${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        }

        if (!payment) {
          console.warn('⚠️ Pago no encontrado en BD. Transaction ID:', id);
          console.warn('   Esto puede significar:');
          console.warn('   1. El webhook aún no ha procesado el pago');
          console.warn('   2. El pago se guardó con un reference diferente');
          console.warn('   3. Necesitas activar manualmente la suscripción');
          
          setStatus('loading');
          setMessage('Tu pago está siendo procesado. Esto puede tardar unos momentos...');
          
          // Intentar buscar por organization_id del usuario actual como último recurso
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('organization_id')
                .eq('user_id', user.id)
                .maybeSingle();
              
              if (profile?.organization_id) {
                // Buscar el último pago pendiente de esta organización
                const { data: lastPayment } = await supabase
                  .from('payments')
                  .select('*, subscription_id, plan_id, organization_id')
                  .eq('organization_id', profile.organization_id)
                  .in('status', ['pending', 'completed'])
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                
                if (lastPayment) {
                  console.log('✅ Encontrado último pago de la organización:', lastPayment.id);
                  payment = lastPayment;
                }
              }
            }
          } catch (err) {
            console.error('Error buscando último pago:', err);
          }
          
          // Si aún no hay pago, redirigir
          if (!payment) {
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 5000);
            return;
          }
        }

        // Verificar estado del pago
        if (payment.status === 'failed' || payment.status === 'declined') {
          setStatus('error');
          setMessage('El pago fue rechazado. Por favor intenta de nuevo.');
          return;
        }

        // Verificar si la suscripción está activa
        let subscription = null;
        if (payment.subscription_id) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, plan_id, status')
            .eq('id', payment.subscription_id)
            .maybeSingle();
          
          subscription = sub;
        } else {
          // Si no hay subscription_id, buscar por organization_id
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, plan_id, status')
            .eq('organization_id', payment.organization_id)
            .eq('status', 'active')
            .maybeSingle();
          
          subscription = sub;
        }

        // Obtener nombre del plan
        let planName = 'tu nuevo plan';
        if (payment.plan_id) {
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('name')
            .eq('id', payment.plan_id)
            .maybeSingle();
          
          if (plan) {
            planName = plan.name;
          }
        }

        if (subscription && subscription.status === 'active') {
          // ✅ Suscripción activa
          setStatus('success');
          setMessage(`¡Tu suscripción a ${planName} está activa!`);
          
          // Forzar actualización de suscripción y perfil
          try {
            await refreshSubscription();
            await refreshProfile();
          } catch (err) {
            console.warn('Error refrescando datos:', err);
          }
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else if (payment.status === 'completed' || payment.status === 'approved') {
          // Pago completado pero suscripción aún no activa (webhook en proceso)
          setStatus('loading');
          setMessage(`¡Pago recibido! Activando tu suscripción a ${planName}...`);
          
          // Esperar un poco más y recargar
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 5000);
        } else if (payment.status === 'pending') {
          // Pago aún pendiente
          setStatus('loading');
          setMessage('Tu pago está siendo procesado. Esto puede tardar unos momentos...');
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 5000);
        } else {
          // Estado desconocido
          setStatus('success');
          setMessage('¡Tu pago ha sido recibido! Tu suscripción será activada en breve.');
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        }

      } catch (error) {
        console.error('Error verificando pago:', error);
        setStatus('error');
        setMessage('Hubo un error verificando tu pago');
      }
    };

    checkPaymentStatus();
  }, [searchParams, navigate, refreshProfile, refreshSubscription]);

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
