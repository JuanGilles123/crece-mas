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
  professional: 'Profesional',
  enterprise: 'Empresarial',
  custom: 'Custom'
};

// Precios de los planes
export const PLAN_PRICES = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  professional: {
    monthly: 60000,
    yearly: 600000,
  },
  enterprise: {
    monthly: 150000,
    yearly: 1500000,
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
