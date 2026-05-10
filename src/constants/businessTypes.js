// Configuración de tipos de negocio y sus características
import { UtensilsCrossed, Scissors, ShoppingBag, Shirt, Package, Scale } from 'lucide-react';

export const BUSINESS_TYPES = {
  // GRUPO 1: Negocios de Alimentación (con toppings, mesas, pedidos)
  food: {
    id: 'food',
    label: 'Alimentación',
    icon: '🍔',
    Icon: UtensilsCrossed,
    description: 'Restaurantes, cafeterías, comida rápida',
    category: 'food_service',
    defaultProductType: 'comida',
    availableProductTypes: ['comida', 'fisico', 'servicio', 'combo'],
    features: ['Toppings', 'Mesas', 'Pedidos', 'Ingredientes', 'Alérgenos'],
    group: 'Alimentación'
  },
  
  // GRUPO 2: Negocios de Servicios Personales (con adicionales sin stock)
  service: {
    id: 'service',
    label: 'Servicios Personales',
    icon: '💇',
    Icon: Scissors,
    description: 'Barbería, Spa, Salón de belleza, Consultoría',
    category: 'personal_service',
    defaultProductType: 'servicio',
    availableProductTypes: ['servicio', 'fisico'],
    features: ['Adicionales', 'Duración de servicio'],
    group: 'Servicios'
  },
  
  // GRUPO 3: Retail y Comercio (productos físicos estándar)
  retail: {
    id: 'retail',
    label: 'Retail / Comercio',
    icon: '🛒',
    Icon: ShoppingBag,
    description: 'Supermercados, tiendas generales, bodegas',
    category: 'retail',
    defaultProductType: 'fisico',
    availableProductTypes: ['fisico', 'accesorio', 'combo'],
    features: ['Inventario estándar', 'Categorías'],
    group: 'Comercio'
  },
  
  // GRUPO 4: Moda y Accesorios (con variaciones: tallas, colores)
  clothing: {
    id: 'clothing',
    label: 'Moda y Accesorios',
    icon: '👔',
    Icon: Shirt,
    description: 'Tiendas de ropa, calzado, accesorios',
    category: 'fashion',
    defaultProductType: 'accesorio',
    availableProductTypes: ['accesorio', 'fisico', 'combo'],
    features: ['Variaciones', 'Tallas', 'Colores', 'Materiales'],
    group: 'Comercio'
  },

  // GRUPO 5: Joyería y Metales (ventas por peso y precio variable)
  jewelry_metals: {
    id: 'jewelry_metals',
    label: 'Joyería y Metales',
    icon: '💎',
    Icon: Scale,
    description: 'Joyerías, compra/venta de metales y gemas',
    category: 'jewelry',
    defaultProductType: 'accesorio',
    availableProductTypes: ['accesorio', 'fisico', 'servicio'],
    features: ['Peso', 'Precio variable', 'Metales preciosos'],
    group: 'Comercio'
  },
  
  // GRUPO 6: Otros (flexible)
  other: {
    id: 'other',
    label: 'Otro',
    icon: '📦',
    Icon: Package,
    description: 'Otros tipos de negocio',
    category: 'other',
    defaultProductType: 'fisico',
    availableProductTypes: ['fisico', 'servicio', 'accesorio', 'comida', 'combo'],
    features: [],
    group: 'General'
  }
};

// Agrupaciones para mostrar en UI
export const BUSINESS_TYPE_GROUPS = [
  {
    label: 'Alimentación',
    types: ['food']
  },
  {
    label: 'Servicios',
    types: ['service']
  },
  {
    label: 'Comercio',
    types: ['retail', 'clothing', 'jewelry_metals']
  },
  {
    label: 'Otros',
    types: ['other']
  }
];

// Función helper para obtener configuración de tipo de negocio
export const getBusinessTypeConfig = (businessTypeId) => {
  return BUSINESS_TYPES[businessTypeId] || BUSINESS_TYPES.other;
};

// Función helper para obtener el tipo de producto por defecto
export const getDefaultProductType = (businessTypeId) => {
  const config = getBusinessTypeConfig(businessTypeId);
  return config.defaultProductType;
};

// Función helper para obtener tipos de producto disponibles
export const getAvailableProductTypes = (businessTypeId) => {
  const config = getBusinessTypeConfig(businessTypeId);
  return config.availableProductTypes;
};

// Función helper para verificar si debe saltarse el selector de tipo
export const shouldSkipProductTypeSelector = (businessTypeId) => {
  const available = getAvailableProductTypes(businessTypeId);
  return available && available.length <= 1;
};
