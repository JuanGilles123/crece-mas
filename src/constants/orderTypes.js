// Tipos de pedido y sus características
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Truck, 
  Zap
} from 'lucide-react';

export const ORDER_TYPES = {
  dine_in: {
    id: 'dine_in',
    label: 'Comer en el Local',
    icon: '🍽️',
    Icon: UtensilsCrossed,
    description: 'Cliente come en el establecimiento',
    requiresMesa: false, // Opcional si mesas habilitadas
    fields: {
      mesa: { required: false, label: 'Mesa', showIf: 'mesas_habilitadas' },
      numero_personas: { required: false, label: 'Número de Personas', default: 1 },
      cliente_nombre: { required: false, label: 'Nombre del Cliente' },
      cliente_telefono: { required: false, label: 'Teléfono' }
    },
    compatibleWith: ['food', 'service', 'other']
  },
  takeout: {
    id: 'takeout',
    label: 'Para Llevar',
    icon: '🥡',
    Icon: ShoppingBag,
    description: 'Cliente recoge en el local',
    requiresMesa: false,
    fields: {
      cliente_nombre: { required: true, label: 'Nombre del Cliente' },
      cliente_telefono: { required: true, label: 'Teléfono' },
      hora_estimada: { required: false, label: 'Hora Estimada de Recogida' }
    },
    compatibleWith: ['food', 'service', 'other']
  },
  delivery: {
    id: 'delivery',
    label: 'Domicilio',
    icon: '🚚',
    Icon: Truck,
    description: 'Entrega a domicilio',
    requiresMesa: false,
    fields: {
      cliente_nombre: { required: true, label: 'Nombre del Cliente' },
      cliente_telefono: { required: true, label: 'Teléfono' },
      direccion_entrega: { required: true, label: 'Dirección de Entrega' },
      costo_envio: { required: false, label: 'Costo de Envío', default: 0 },
      hora_estimada: { required: false, label: 'Hora Estimada de Entrega' }
    },
    compatibleWith: ['food', 'service', 'other']
  },
  express: {
    id: 'express',
    label: 'Express',
    icon: '⚡',
    Icon: Zap,
    description: 'Pedido rápido con prioridad alta',
    requiresMesa: false,
    fields: {
      cliente_nombre: { required: false, label: 'Nombre del Cliente' },
      cliente_telefono: { required: false, label: 'Teléfono' },
      hora_estimada: { required: false, label: 'Hora Estimada' }
    },
    compatibleWith: ['food', 'service', 'other'],
    defaultPriority: 'alta'
  }
};

// Obtener tipos de pedido compatibles con el tipo de negocio
export const getCompatibleOrderTypes = (businessTypeId) => {
  return Object.values(ORDER_TYPES).filter(type => 
    type.compatibleWith.includes(businessTypeId)
  );
};

// Obtener campos requeridos para un tipo de pedido
export const getOrderTypeFields = (orderTypeId, organization) => {
  const orderType = ORDER_TYPES[orderTypeId];
  if (!orderType) return [];

  const fields = [];
  Object.entries(orderType.fields).forEach(([key, config]) => {
    // Verificar si el campo debe mostrarse
    if (config.showIf === 'mesas_habilitadas') {
      if (organization?.mesas_habilitadas || organization?.enabled_features?.includes('mesas')) {
        fields.push({ key, ...config });
      }
    } else {
      fields.push({ key, ...config });
    }
  });

  return fields;
};

// Validar campos de un pedido según su tipo
export const validateOrderFields = (orderTypeId, formData, organization) => {
  const fields = getOrderTypeFields(orderTypeId, organization);
  const errors = [];

  fields.forEach(field => {
    if (field.required && !formData[field.key]) {
      errors.push(`El campo "${field.label}" es requerido`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};
