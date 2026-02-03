// Sistema de funciones personalizables para negocios
import { 
  UtensilsCrossed, 
  Scissors, 
  ShoppingBag, 
  Circle, 
  Users,
  BarChart3,
  FileText
} from 'lucide-react';

// Funciones disponibles que se pueden activar independientemente del tipo de negocio
export const BUSINESS_FEATURES = {
  toppings: {
    id: 'toppings',
    label: 'Toppings / Ingredientes Adicionales',
    icon: '🍕',
    Icon: UtensilsCrossed,
    description: 'Permite agregar ingredientes adicionales a productos (ej: queso extra, tocino)',
    category: 'product',
    requiresPremium: false,
    compatibleWith: ['food', 'service', 'other', 'jewelry_metals'], // Tipos de negocio compatibles
    defaultFor: ['food'] // Tipos que lo tienen por defecto
  },
  adicionales: {
    id: 'adicionales',
    label: 'Adicionales de Servicio',
    icon: '✨',
    Icon: Scissors,
    description: 'Permite agregar servicios adicionales sin stock (ej: barba, cejas en barbería)',
    category: 'service',
    requiresPremium: false,
    compatibleWith: ['service', 'food', 'other', 'jewelry_metals'],
    defaultFor: ['service']
  },
  mesas: {
    id: 'mesas',
    label: 'Sistema de Mesas',
    icon: '🪑',
    Icon: Circle,
    description: 'Gestiona mesas para restaurantes y establecimientos con servicio de mesa',
    category: 'operations',
    requiresPremium: true,
    compatibleWith: ['food', 'service', 'other', 'jewelry_metals'],
    defaultFor: ['food']
  },
  pedidos: {
    id: 'pedidos',
    label: 'Sistema de Pedidos',
    icon: '📋',
    Icon: FileText,
    description: 'Toma pedidos por mesa y envíalos a cocina o preparación',
    category: 'operations',
    requiresPremium: true,
    compatibleWith: ['food', 'service', 'other', 'jewelry_metals'],
    defaultFor: ['food'],
    requires: ['mesas'] // Requiere que mesas esté activo
  },
  variaciones: {
    id: 'variaciones',
    label: 'Variaciones de Producto',
    icon: '👕',
    Icon: ShoppingBag,
    description: 'Permite productos con variaciones (tallas, colores, materiales)',
    category: 'product',
    requiresPremium: false,
    compatibleWith: ['clothing', 'retail', 'other', 'jewelry_metals'],
    defaultFor: ['clothing']
  },
  clientes: {
    id: 'clientes',
    label: 'Gestión de Clientes',
    icon: '👥',
    Icon: Users,
    description: 'Registra y gestiona información de clientes',
    category: 'crm',
    requiresPremium: false,
    compatibleWith: ['food', 'service', 'retail', 'clothing', 'other', 'jewelry_metals'],
    defaultFor: []
  },
  reportes_avanzados: {
    id: 'reportes_avanzados',
    label: 'Reportes Avanzados',
    icon: '📊',
    Icon: BarChart3,
    description: 'Reportes detallados y análisis de ventas',
    category: 'analytics',
    requiresPremium: true,
    compatibleWith: ['food', 'service', 'retail', 'clothing', 'other', 'jewelry_metals'],
    defaultFor: []
  }
};

// Obtener funciones por defecto según tipo de negocio
export const getDefaultFeatures = (businessTypeId) => {
  const defaultFeatures = [];
  Object.values(BUSINESS_FEATURES).forEach(feature => {
    if (feature.defaultFor.includes(businessTypeId)) {
      defaultFeatures.push(feature.id);
    }
  });
  return defaultFeatures;
};

// Obtener funciones compatibles con un tipo de negocio
export const getCompatibleFeatures = (businessTypeId) => {
  return Object.values(BUSINESS_FEATURES).filter(feature => 
    feature.compatibleWith.includes(businessTypeId)
  );
};

// Verificar si una función es compatible con el tipo de negocio
export const isFeatureCompatible = (featureId, businessTypeId) => {
  const feature = BUSINESS_FEATURES[featureId];
  if (!feature) return false;
  return feature.compatibleWith.includes(businessTypeId);
};

// Verificar dependencias de funciones
export const checkFeatureDependencies = (featureId, enabledFeatures) => {
  const feature = BUSINESS_FEATURES[featureId];
  if (!feature || !feature.requires) return { valid: true };
  
  const missing = feature.requires.filter(req => !enabledFeatures.includes(req));
  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Esta función requiere: ${missing.map(id => BUSINESS_FEATURES[id]?.label || id).join(', ')}`
    };
  }
  
  return { valid: true };
};
