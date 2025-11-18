// 🍔 Utilidades para el sistema de toppings

/**
 * Verifica si una organización puede usar el sistema de toppings
 * @param {Object} organization - Objeto de organización
 * @param {Object} subscription - Objeto de suscripción
 * @param {Function} hasFeature - Función para verificar features
 * @returns {Object} { canUse: boolean, reason?: string }
 */
export const canUseToppings = (organization, subscription, hasFeature) => {
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
      reason: 'Los toppings solo están disponibles para negocios de comida'
    };
  }

  // Verificar que tenga suscripción premium
  if (!hasFeature || !hasFeature('toppings')) {
    return {
      canUse: false,
      reason: 'Los toppings requieren una suscripción premium (Profesional o superior)'
    };
  }

  return {
    canUse: true
  };
};

/**
 * Calcula el precio total de un item con toppings
 * @param {number} precioBase - Precio base del producto
 * @param {Array} toppings - Array de toppings seleccionados
 * @returns {number} Precio total
 */
export const calcularPrecioConToppings = (precioBase, toppings = []) => {
  const precioToppings = toppings.reduce((sum, topping) => {
    return sum + (topping.precio || 0) * (topping.cantidad || 1);
  }, 0);
  return precioBase + precioToppings;
};

/**
 * Formatea toppings para mostrar en el carrito
 * @param {Array} toppings - Array de toppings
 * @returns {string} Texto formateado
 */
export const formatearToppings = (toppings = []) => {
  if (!toppings || toppings.length === 0) return '';
  return toppings.map(t => `+ ${t.nombre} (${t.cantidad || 1}x)`).join(', ');
};

