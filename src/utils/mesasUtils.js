// 🍽️ Utilidades para el sistema de mesas

/**
 * Verifica si una organización puede usar el sistema de mesas
 * @param {Object} organization - Objeto de organización
 * @param {Function} hasFeature - Función para verificar features
 * @returns {Object} { canUse: boolean, reason?: string }
 */
export const canUseMesas = (organization, hasFeature) => {
  // Verificar que la organización existe
  if (!organization) {
    return {
      canUse: false,
      reason: 'No se encontró la organización'
    };
  }

  // Verificar que el tipo de negocio sea "food"
  if (organization.business_type !== 'food') {
    return {
      canUse: false,
      reason: 'Las mesas solo están disponibles para negocios de comida'
    };
  }

  // Verificar que tenga mesas habilitadas
  if (!organization.mesas_habilitadas) {
    return {
      canUse: false,
      reason: 'El sistema de mesas no está habilitado. Actívalo en Configuración de Facturación'
    };
  }

  // Verificar que tenga suscripción premium
  if (!hasFeature || !hasFeature('mesas')) {
    return {
      canUse: false,
      reason: 'Las mesas requieren una suscripción premium (Profesional o superior)'
    };
  }

  return {
    canUse: true
  };
};

/**
 * Verifica si una organización puede usar el sistema de pedidos
 * @param {Object} organization - Objeto de organización
 * @param {Function} hasFeature - Función para verificar features
 * @returns {Object} { canUse: boolean, reason?: string }
 */
export const canUsePedidos = (organization, hasFeature) => {
  // Verificar que la organización existe
  if (!organization) {
    return {
      canUse: false,
      reason: 'No se encontró la organización'
    };
  }

  // Verificar que el tipo de negocio sea "food"
  if (organization.business_type !== 'food') {
    return {
      canUse: false,
      reason: 'Los pedidos solo están disponibles para negocios de comida'
    };
  }

  // Verificar que tenga pedidos habilitados
  if (!organization.pedidos_habilitados) {
    return {
      canUse: false,
      reason: 'El sistema de pedidos no está habilitado. Actívalo en Configuración de Facturación'
    };
  }

  // Verificar que tenga suscripción premium
  if (!hasFeature || !hasFeature('pedidos')) {
    return {
      canUse: false,
      reason: 'Los pedidos requieren una suscripción premium (Profesional o superior)'
    };
  }

  return {
    canUse: true
  };
};

/**
 * Obtiene el color según el estado de la mesa
 */
export const getMesaEstadoColor = (estado) => {
  switch (estado) {
    case 'disponible':
      return '#10B981'; // Verde
    case 'ocupada':
      return '#EF4444'; // Rojo
    case 'reservada':
      return '#F59E0B'; // Amarillo/Naranja
    case 'mantenimiento':
      return '#6B7280'; // Gris
    default:
      return '#6B7280';
  }
};

/**
 * Obtiene el color según el estado del pedido
 */
export const getPedidoEstadoColor = (estado) => {
  switch (estado) {
    case 'pendiente':
      return '#F59E0B'; // Amarillo/Naranja
    case 'en_preparacion':
      return '#02A5E0'; // Azul
    case 'listo':
      return '#10B981'; // Verde
    case 'completado':
      return '#6B7280'; // Gris
    case 'cancelado':
      return '#EF4444'; // Rojo
    default:
      return '#6B7280';
  }
};

