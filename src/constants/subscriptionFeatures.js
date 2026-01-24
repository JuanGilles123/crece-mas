// 🔐 SISTEMA DE FEATURES FLAGS - CRECE+
// Define las características y límites de cada plan de suscripción

export const PLAN_FEATURES = {
  free: {
    // Límites numéricos (null = ilimitado)
    limits: {
      maxOrganizations: 1,
      maxUsers: 1,
      maxProducts: 20,
      maxSalesPerMonth: 50,
      historyDays: 7,
      maxProductImages: 0, // Sin imágenes en plan gratis
    },
    
    // Features booleanas (true = permitido, false = bloqueado)
    features: {
      // Inventario
      inventoryBasic: true,          // Agregar, editar, buscar productos
      inventoryAdvanced: false,      // Operaciones masivas, categorías
      productImages: false,          // Subir imágenes de productos
      importCSV: false,              // Importar productos desde CSV
      exportData: false,             // Exportar a Excel/CSV/PDF
      bulkOperations: false,         // Edición masiva de productos
      
      // Ventas
      quickSale: true,               // Venta rápida básica
      advancedSale: false,           // Venta con descuentos, notas
      multiplePaymentMethods: false, // Solo efectivo
      mixedPayments: false,          // Pagos mixtos (efectivo + tarjeta)
      salesHistory: true,            // Ver últimas ventas (limitado a 7 días)
      salesReports: false,           // Reportes avanzados de ventas
      
      // Caja
      cashRegister: true,            // Abrir/cerrar caja
      cashRegisterReports: false,    // Reportes de caja
      closingHistory: false,         // Historial de cierres
      
      // Equipo
      teamManagement: false,         // Gestión de empleados
      rolesAndPermissions: false,    // Roles personalizados
      inviteUsers: false,            // Invitar usuarios
      
      // Reportes
      basicDashboard: true,          // Dashboard básico
      advancedReports: false,        // Reportes avanzados
      charts: false,                 // Gráficos y estadísticas
      metrics: false,                // Métricas de negocio
      
      // Configuración
      taxConfiguration: false,       // Configurar impuestos
      invoiceCustomization: false,   // Personalizar recibos
      notifications: false,          // Notificaciones avanzadas
      
      // Soporte
      emailSupport: false,           // Soporte por email
      prioritySupport: false,        // Soporte prioritario
      
      // Toppings (solo para negocios de comida)
      toppings: false,               // Sistema de toppings
      
      // Mesas y Pedidos (solo para negocios de comida)
      mesas: false,                  // Sistema de mesas
      pedidos: false,                // Sistema de pedidos
    }
  },
  
  professional: {
    limits: {
      maxOrganizations: 1,
      maxUsers: 10,
      maxProducts: null,        // Ilimitado
      maxSalesPerMonth: null,   // Ilimitado
      historyDays: null,        // Ilimitado
      maxProductImages: null,   // Ilimitado
    },
    
    features: {
      // Todo desbloqueado excepto features empresariales
      inventoryBasic: true,
      inventoryAdvanced: true,
      productImages: true,
      importCSV: true,
      exportData: true,
      bulkOperations: true,
      
      quickSale: true,
      advancedSale: true,
      multiplePaymentMethods: true,
      mixedPayments: true,
      salesHistory: true,
      salesReports: true,
      
      cashRegister: true,
      cashRegisterReports: true,
      closingHistory: true,
      
      teamManagement: true,
      rolesAndPermissions: true,
      inviteUsers: true,
      
      basicDashboard: true,
      advancedReports: true,
      charts: true,
      metrics: true,
      
      taxConfiguration: true,
      invoiceCustomization: true,
      notifications: true,
      
      emailSupport: true,
      prioritySupport: false,
      
      // Toppings (solo para negocios de comida)
      toppings: true,                // Sistema de toppings
      
      // Mesas y Pedidos (solo para negocios de comida)
      mesas: true,                   // Sistema de mesas
      pedidos: true,                 // Sistema de pedidos
      
      // Features empresariales desactivadas
      multiOrg: false,
      branchTransfers: false,
      consolidatedReports: false,
      apiAccess: false,
      customBranding: false,
      clientsModule: false,
      suppliersModule: false,
      electronicInvoicing: false,
    }
  },
  
  enterprise: {
    limits: {
      maxOrganizations: 5,
      maxUsers: null,           // Ilimitado
      maxProducts: null,
      maxSalesPerMonth: null,
      historyDays: null,
      maxProductImages: null,
    },
    
    features: {
      // Todo del profesional + features empresariales
      inventoryBasic: true,
      inventoryAdvanced: true,
      productImages: true,
      importCSV: true,
      exportData: true,
      bulkOperations: true,
      
      quickSale: true,
      advancedSale: true,
      multiplePaymentMethods: true,
      mixedPayments: true,
      salesHistory: true,
      salesReports: true,
      
      cashRegister: true,
      cashRegisterReports: true,
      closingHistory: true,
      
      teamManagement: true,
      rolesAndPermissions: true,
      inviteUsers: true,
      
      basicDashboard: true,
      advancedReports: true,
      charts: true,
      metrics: true,
      
      taxConfiguration: true,
      invoiceCustomization: true,
      notifications: true,
      
      emailSupport: true,
      prioritySupport: true,
      
      // Toppings (solo para negocios de comida)
      toppings: true,                // Sistema de toppings
      
      // Mesas y Pedidos (solo para negocios de comida)
      mesas: true,                   // Sistema de mesas
      pedidos: true,                 // Sistema de pedidos
      
      // Features empresariales
      multiOrg: true,
      branchTransfers: true,
      consolidatedReports: true,
      apiAccess: true,
      customBranding: true,
      clientsModule: true,          // Próximamente
      suppliersModule: true,        // Próximamente
      electronicInvoicing: true,    // Próximamente
      
      whatsappSupport: true,
      onboarding: true,
    }
  },
  
  custom: {
    limits: {
      maxOrganizations: null,   // Ilimitado
      maxUsers: null,
      maxProducts: null,
      maxSalesPerMonth: null,
      historyDays: null,
      maxProductImages: null,
    },
    
    features: {
      // Todo desbloqueado
      inventoryBasic: true,
      inventoryAdvanced: true,
      productImages: true,
      importCSV: true,
      exportData: true,
      bulkOperations: true,
      
      quickSale: true,
      advancedSale: true,
      multiplePaymentMethods: true,
      mixedPayments: true,
      salesHistory: true,
      salesReports: true,
      
      cashRegister: true,
      cashRegisterReports: true,
      closingHistory: true,
      
      teamManagement: true,
      rolesAndPermissions: true,
      inviteUsers: true,
      
      basicDashboard: true,
      advancedReports: true,
      charts: true,
      metrics: true,
      
      taxConfiguration: true,
      invoiceCustomization: true,
      notifications: true,
      
      emailSupport: true,
      prioritySupport: true,
      
      // Toppings (solo para negocios de comida)
      toppings: true,                // Sistema de toppings
      
      // Mesas y Pedidos (solo para negocios de comida)
      mesas: true,                   // Sistema de mesas
      pedidos: true,                 // Sistema de pedidos
      
      multiOrg: true,
      branchTransfers: true,
      consolidatedReports: true,
      apiAccess: true,
      customBranding: true,
      clientsModule: true,
      suppliersModule: true,
      electronicInvoicing: true,
      
      whatsappSupport: true,
      onboarding: true,
      
      // Features exclusivas de Custom
      dedicatedServer: true,
      accountManager: true,
      customDevelopment: true,
      erpIntegration: true,
      slaGuarantee: true,
      phoneSupport: true,
    }
  }
};

// Nombres amigables de los planes
export const PLAN_NAMES = {
  free: 'Gratis',
  professional: 'Estándar',
  enterprise: 'Premium',
  custom: 'Custom'
};

// Precios de los planes
export const PLAN_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  professional: {
    monthly: 69900,
    yearly: 699000,
  },
  enterprise: {
    monthly: 119900,
    yearly: 1199000,
  },
  custom: {
    monthly: 300000,
    yearly: null, // Personalizado
  }
};

// Helper para obtener features de un plan
export const getPlanFeatures = (planSlug) => {
  return PLAN_FEATURES[planSlug] || PLAN_FEATURES.free;
};

// Helper para verificar si un plan tiene una feature
export const planHasFeature = (planSlug, featureName) => {
  const plan = PLAN_FEATURES[planSlug];
  return plan?.features?.[featureName] === true;
};

// Helper para obtener límite de un plan
export const getPlanLimit = (planSlug, limitName) => {
  const plan = PLAN_FEATURES[planSlug];
  return plan?.limits?.[limitName];
};

// Mapeo de features a planes mínimos requeridos
export const FEATURE_TO_PLAN = {
  // Inventario
  productImages: 'professional',
  importCSV: 'professional',
  exportData: 'professional',
  bulkOperations: 'professional',
  inventoryAdvanced: 'professional',
  
  // Ventas
  advancedSale: 'professional',
  multiplePaymentMethods: 'professional',
  mixedPayments: 'professional',
  salesReports: 'professional',
  
  // Caja
  cashRegisterReports: 'professional',
  closingHistory: 'professional',
  
  // Equipo
  teamManagement: 'professional',
  rolesAndPermissions: 'professional',
  inviteUsers: 'professional',
  
  // Reportes
  advancedReports: 'professional',
  charts: 'professional',
  metrics: 'professional',
  
  // Configuración
  taxConfiguration: 'professional',
  invoiceCustomization: 'professional',
  notifications: 'professional',
  
  // Soporte
  emailSupport: 'professional',
  prioritySupport: 'enterprise',
  
  // Restaurantes
  toppings: 'professional',
  mesas: 'professional',
  pedidos: 'professional',
  
  // Empresariales
  multiOrg: 'enterprise',
  branchTransfers: 'enterprise',
  consolidatedReports: 'enterprise',
  apiAccess: 'enterprise',
  customBranding: 'enterprise',
  clientsModule: 'enterprise',
  suppliersModule: 'enterprise',
  electronicInvoicing: 'enterprise',
  whatsappSupport: 'enterprise',
  onboarding: 'enterprise',
};

// Nombres amigables de features
export const FEATURE_NAMES = {
  productImages: 'Imágenes de Productos',
  importCSV: 'Importar CSV',
  exportData: 'Exportar Datos',
  bulkOperations: 'Operaciones Masivas',
  inventoryAdvanced: 'Inventario Avanzado',
  advancedSale: 'Ventas con Descuentos',
  multiplePaymentMethods: 'Múltiples Métodos de Pago',
  mixedPayments: 'Pagos Mixtos',
  salesReports: 'Reportes de Ventas',
  cashRegisterReports: 'Reportes de Caja',
  closingHistory: 'Historial de Cierres',
  teamManagement: 'Gestión de Equipo',
  rolesAndPermissions: 'Roles y Permisos',
  inviteUsers: 'Invitar Usuarios',
  advancedReports: 'Reportes Avanzados',
  charts: 'Gráficos',
  metrics: 'Métricas',
  taxConfiguration: 'Configuración de Impuestos',
  invoiceCustomization: 'Personalización de Facturas',
  notifications: 'Notificaciones',
  emailSupport: 'Soporte por Email',
  prioritySupport: 'Soporte Prioritario',
  toppings: 'Sistema de Toppings',
  mesas: 'Sistema de Mesas',
  pedidos: 'Sistema de Pedidos',
  multiOrg: 'Multi-sucursal',
  branchTransfers: 'Transferencias entre Sucursales',
  consolidatedReports: 'Reportes Consolidados',
  apiAccess: 'Acceso a API',
  customBranding: 'Branding Personalizado',
  clientsModule: 'Módulo de Clientes',
  suppliersModule: 'Módulo de Proveedores',
  electronicInvoicing: 'Facturación Electrónica',
  whatsappSupport: 'Soporte por WhatsApp',
  onboarding: 'Onboarding Personalizado',
};

// Helper para obtener el plan mínimo requerido para una feature
export const getRequiredPlanForFeature = (featureName) => {
  return FEATURE_TO_PLAN[featureName] || 'professional';
};

// Helper para obtener el nombre amigable de una feature
export const getFeatureName = (featureName) => {
  return FEATURE_NAMES[featureName] || featureName;
};
