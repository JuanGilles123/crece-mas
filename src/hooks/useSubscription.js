// 🎯 Hook para gestionar suscripciones y verificar límites
import { useAuth } from '../context/AuthContext';
import { PLAN_FEATURES } from '../constants/subscriptionFeatures';
import { hasBypassAccess } from '../constants/vipUsers';
import { supabase } from '../supabaseClient';
import { useState, useEffect, useCallback } from 'react';

export const useSubscription = () => {
  const { organization, user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar suscripción de la organización
  // IMPORTANTE: La suscripción está asociada a la ORGANIZACIÓN, no al usuario individual.
  // Esto significa que TODOS los miembros de una organización (owner, admin, vendedor)
  // tienen acceso a las mismas funciones basadas en el plan de la organización.
  const loadSubscription = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }
    
    // 🌟 PRIORIDAD 1: Verificar si el USUARIO es VIP directamente
    const userIsVIP = hasBypassAccess(user, organization);
    
    // 🌟 PRIORIDAD 2: Verificar si la ORGANIZACIÓN pertenece a un usuario VIP
    // Esto permite que todos los miembros de una org VIP tengan acceso VIP
    let orgIsVIP = false;
    if (organization?.owner_email) {
      orgIsVIP = hasBypassAccess({ email: organization.owner_email }, organization);
    }
    
    // Si el usuario O la organización es VIP, otorgar acceso completo
    if (userIsVIP || orgIsVIP) {
      console.log('🌟 VIP Access detected - Full access granted');
      console.log(`   User: ${user?.email}`);
      console.log(`   Organization: ${organization?.name}`);
      console.log(`   Owner email: ${organization?.owner_email}`);
      console.log(`   User is VIP: ${userIsVIP}`);
      console.log(`   Organization is VIP: ${orgIsVIP}`);
      setSubscription({
        plan: { slug: 'enterprise', name: 'VIP Access' },
        status: 'active',
        is_vip: true
      });
      setLoading(false);
      return;
    }

    try {
      // Obtener la suscripción de la organización
      // TODOS los miembros de esta org obtendrán la misma suscripción
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .single();

      if (subError || !subscriptionData) {
        // Si no tiene suscripción activa, usar plan gratis por defecto
        console.log('No active subscription found, using free plan');
        setSubscription({
          plan: { slug: 'free', name: 'Gratis' },
          status: 'active'
        });
      } else {
        // Obtener el plan por separado
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', subscriptionData.plan_id)
          .single();

        if (planError || !planData) {
          console.error('Error loading plan:', planError);
          setSubscription({
            plan: { slug: 'free', name: 'Gratis' },
            status: 'active'
          });
        } else {
          // Combinar los datos
          const mappedData = {
            ...subscriptionData,
            plan: planData
          };
          
          console.log(`✅ Organization subscription loaded: ${mappedData.plan.name} (${mappedData.plan.slug})`);
          console.log(`   Organization: "${organization.name}"`);
          console.log(`   All members have ${mappedData.plan.name} access`);
          setSubscription(mappedData);
        }
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      // Fallback al plan gratis
      setSubscription({
        plan: { slug: 'free', name: 'Gratis' },
        status: 'active'
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, organization?.name, organization?.owner_email, user?.email]);

  // Obtener el slug del plan actual
  const getPlanSlug = useCallback(() => {
    return subscription?.plan?.slug || 'free';
  }, [subscription]);

  // Obtener las features del plan actual
  const getPlanFeatures = useCallback(() => {
    const planSlug = getPlanSlug();
    return PLAN_FEATURES[planSlug] || PLAN_FEATURES.free;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPlanSlug, user, organization]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Verificar si tiene acceso a una feature específica
  const hasFeature = useCallback((featureName) => {
    // VIP siempre tiene acceso (calcular dinámicamente)
    const userIsVIP = hasBypassAccess(user, organization);
    const orgIsVIP = organization?.owner_email ? 
      hasBypassAccess({ email: organization.owner_email }, organization) : false;
    
    if (userIsVIP || orgIsVIP) return true;
    
    const features = getPlanFeatures();
    return features.features[featureName] === true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, organization, getPlanFeatures]);

  // Obtener un límite específico
  const getLimit = useCallback((limitName) => {
    // VIP no tiene límites (calcular dinámicamente)
    const userIsVIP = hasBypassAccess(user, organization);
    const orgIsVIP = organization?.owner_email ? 
      hasBypassAccess({ email: organization.owner_email }, organization) : false;
    
    if (userIsVIP || orgIsVIP) return null;
    
    const features = getPlanFeatures();
    return features.limits[limitName];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, organization, getPlanFeatures]);

  // Verificar si alcanzó un límite
  const checkLimit = useCallback(async (limitName, entityType, where) => {
    // VIP no tiene límites (calcular dinámicamente)
    const userIsVIP = hasBypassAccess(user, organization);
    const orgIsVIP = organization?.owner_email ? 
      hasBypassAccess({ email: organization.owner_email }, organization) : false;
    
    if (userIsVIP || orgIsVIP) {
      return { canPerform: true, current: 0, limit: null, isVIP: true };
    }

    const limit = getLimit(limitName);
    
    // Si no hay límite (null o undefined), permitir
    if (limit === null || limit === undefined) {
      return { canPerform: true, current: 0, limit: null };
    }

    // Si el límite es infinito, permitir
    if (limit === Infinity || limit === -1) {
      return { canPerform: true, current: 0, limit };
    }

    if (!organization?.id) {
      return { canPerform: false, current: 0, limit, reason: 'No organization' };
    }

    try {
      // Determinar la tabla correcta
      let tableName;
      if (entityType === 'products') {
        tableName = 'productos';  // ✅ Usar nombre en español
      } else if (entityType === 'sales') {
        tableName = 'ventas';     // ✅ Usar nombre en español
      } else {
        tableName = entityType;
      }

      // Construir la consulta
      let query = supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Aplicar filtros adicionales si se proporcionan
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error checking limit:', error);
        return { canPerform: false, current: 0, limit, error: error.message };
      }

      const current = count || 0;
      const canPerform = current < limit;

      return {
        canPerform,
        current,
        limit,
        remaining: limit - current
      };

    } catch (error) {
      console.error('Error in checkLimit:', error);
      return { canPerform: false, current: 0, limit, error: error.message };
    }
  }, [getLimit, organization, user]);

  // Verificar si puede realizar una acción específica
  const canPerformAction = useCallback(async (action) => {
    // VIP siempre puede realizar cualquier acción (calcular dinámicamente)
    const userIsVIP = hasBypassAccess(user, organization);
    const orgIsVIP = organization?.owner_email ? 
      hasBypassAccess({ email: organization.owner_email }, organization) : false;
    
    if (userIsVIP || orgIsVIP) {
      return {
        allowed: true,
        reason: null,
        isVIP: true,
        unlimited: true
      };
    }
    
    const planSlug = getPlanSlug();
    
    switch(action) {
      case 'createProduct': {
        const productLimit = await checkLimit('maxProducts');
        return {
          allowed: productLimit.allowed || productLimit.unlimited,
          reason: !productLimit.allowed && !productLimit.unlimited
            ? `Has alcanzado el límite de ${productLimit.limit} productos en el plan ${planSlug}`
            : null,
          ...productLimit
        };
      }

      case 'createSale': {
        const salesLimit = await checkLimit('maxSalesPerMonth');
        return {
          allowed: salesLimit.allowed || salesLimit.unlimited,
          reason: !salesLimit.allowed && !salesLimit.unlimited
            ? `Has alcanzado el límite de ${salesLimit.limit} ventas este mes`
            : null,
          ...salesLimit
        };
      }

      case 'inviteUser': {
        if (!hasFeature('inviteUsers')) {
          return {
            allowed: false,
            reason: 'La gestión de equipo no está disponible en tu plan'
          };
        }
        const usersLimit = await checkLimit('maxUsers');
        return {
          allowed: usersLimit.allowed || usersLimit.unlimited,
          reason: !usersLimit.allowed && !usersLimit.unlimited
            ? `Has alcanzado el límite de ${usersLimit.limit} usuarios`
            : null,
          ...usersLimit
        };
      }

      case 'uploadProductImage': {
        const allowed = hasFeature('productImages');
        return {
          allowed,
          reason: !allowed 
            ? 'Las imágenes de productos no están disponibles en tu plan' 
            : null
        };
      }

      case 'exportData': {
        const allowed = hasFeature('exportData');
        return {
          allowed,
          reason: !allowed 
            ? 'La exportación de datos no está disponible en tu plan' 
            : null
        };
      }

      case 'importCSV': {
        const allowed = hasFeature('importCSV');
        return {
          allowed,
          reason: !allowed 
            ? 'La importación CSV no está disponible en tu plan' 
            : null
        };
      }

      case 'accessTeam': {
        const allowed = hasFeature('teamManagement');
        return {
          allowed,
          reason: !allowed 
            ? 'La gestión de equipo requiere el plan Profesional o superior' 
            : null
        };
      }

      case 'viewAdvancedReports': {
        const allowed = hasFeature('advancedReports');
        return {
          allowed,
          reason: !allowed 
            ? 'Los reportes avanzados requieren el plan Profesional o superior' 
            : null
        };
      }

      case 'configureMultiOrg': {
        const allowed = hasFeature('multiOrg');
        return {
          allowed,
          reason: !allowed 
            ? 'La gestión multi-sucursal requiere el plan Empresarial' 
            : null
        };
      }

      default:
        return { allowed: true };
    }
  }, [getPlanSlug, checkLimit, hasFeature, user, organization]);

  // Recargar suscripción manualmente
  const refreshSubscription = useCallback(() => {
    return loadSubscription();
  }, [loadSubscription]);

  // Calcular isVIP para retornar
  const userIsVIP = hasBypassAccess(user, organization);
  const orgIsVIP = organization?.owner_email ? 
    hasBypassAccess({ email: organization.owner_email }, organization) : false;
  const isVIPValue = userIsVIP || orgIsVIP;

  return {
    // Estado
    subscription,
    loading,
    
    // Helpers de plan
    planSlug: getPlanSlug(),
    planName: subscription?.plan?.name || 'Gratis',
    planFeatures: getPlanFeatures(),
    
    // Funciones de verificación
    hasFeature,
    getLimit,
    checkLimit,
    canPerformAction,
    
    // Flags útiles
    isFreePlan: getPlanSlug() === 'free',
    isProfessional: getPlanSlug() === 'professional',
    isEnterprise: getPlanSlug() === 'enterprise' || getPlanSlug() === 'custom',
    isVIP: isVIPValue, // Usar el valor calculado
    
    // Acciones
    refreshSubscription,
  };
};
