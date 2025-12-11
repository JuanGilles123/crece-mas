/**
 * USUARIOS VIP - ACCESO ILIMITADO
 * 
 * Estos usuarios tienen acceso completo a todas las funcionalidades
 * sin importar el plan de suscripción (testers, desarrolladores, admins)
 */

export const VIP_USERS = [
  // Desarrolladores
  'juanjosegilarbelaez@gmail.com',
  'jonathan-9411@hotmail.com',
  
  
  // Testers
  // 'tester1@ejemplo.com',
  // 'tester2@ejemplo.com',
  
  // Admins de la plataforma
  // 'admin@crece-mas.com',
];

/**
 * ORGANIZACIONES VIP - ACCESO ILIMITADO
 * 
 * Estas organizaciones y TODOS sus miembros tienen acceso completo
 * sin importar el plan de suscripción
 */
export const VIP_ORGANIZATIONS = [
  // IDs de organizaciones VIP
  // Se pueden agregar organizaciones de testing, desarrollo, o clientes especiales
  // Ejemplo: '123e4567-e89b-12d3-a456-426614174000'
];

/**
 * NOMBRES DE ORGANIZACIONES VIP
 * 
 * Permite verificar por nombre de organización (útil para testing)
 */
export const VIP_ORGANIZATION_NAMES = [
  // Nombres exactos de organizaciones VIP
  'Crece Mas - Desarrollo',
  'Testing Organization',
  // Agregar aquí nombres de organizaciones VIP
];

/**
 * Verificar si un usuario es VIP por email
 * @param {string} email - Email del usuario
 * @returns {boolean}
 */
export const isVIPUser = (email) => {
  if (!email) return false;
  return VIP_USERS.includes(email.toLowerCase().trim());
};

/**
 * Verificar si una organización es VIP
 * @param {Object} organization - Objeto de organización con id y/o name
 * @returns {boolean}
 */
export const isVIPOrganization = (organization) => {
  if (!organization) {
    return false;
  }
  
  // Verificar por ID de organización
  if (organization.id && VIP_ORGANIZATIONS.includes(organization.id)) {
    return true;
  }
  
  // Verificar por nombre de organización
  if (organization.name && VIP_ORGANIZATION_NAMES.includes(organization.name)) {
    return true;
  }
  
  // Verificar si el dueño de la organización es VIP (herencia de privilegios)
  if (organization.owner_email) {
    const ownerIsVIP = isVIPUser(organization.owner_email);
    if (ownerIsVIP) {
      return true;
    }
  }
  
  return false;
};

/**
 * Verificar si un usuario tiene acceso bypass
 * (puede ser por email, organización, o rol especial)
 * @param {Object} user - Usuario de auth
 * @param {Object} organization - Organización actual (opcional)
 * @returns {boolean}
 */
export const hasBypassAccess = (user, organization = null) => {
  if (!user) {
    return false;
  }
  
  // 1. Verificar por email del usuario
  const userIsVIP = isVIPUser(user.email);
  if (userIsVIP) {
    return true;
  }
  
  // 2. Verificar por organización VIP
  if (organization) {
    const orgIsVIP = isVIPOrganization(organization);
    if (orgIsVIP) {
      return true;
    }
  }
  
  // 3. Verificar por metadata especial del usuario
  if (user.user_metadata?.is_developer) {
    return true;
  }
  if (user.user_metadata?.is_tester) {
    return true;
  }
  if (user.user_metadata?.bypass_limits) {
    return true;
  }
  
  return false;
};
