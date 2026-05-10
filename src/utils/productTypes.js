// Configuración de tipos de productos y sus campos

export const PRODUCT_TYPES = {
  fisico: {
    id: 'fisico',
    label: 'Producto Físico',
    icon: '📦',
    description: 'Productos tangibles con inventario',
    fields: {
      required: ['nombre', 'precio_venta', 'precio_compra', 'stock'],
      optional: ['imagen', 'fecha_vencimiento', 'peso', 'dimensiones', 'marca', 'modelo', 'color', 'talla', 'categoria']
    }
  },
  servicio: {
    id: 'servicio',
    label: 'Servicio',
    icon: '🔧',
    description: 'Servicios intangibles sin inventario',
    fields: {
      required: ['nombre', 'precio_venta'],
      optional: ['imagen', 'duracion', 'descripcion', 'categoria']
    }
  },
  comida: {
    id: 'comida',
    label: 'Comida / Alimento',
    icon: '🍔',
    description: 'Productos alimenticios con ingredientes y variaciones',
    fields: {
      required: ['nombre', 'precio_venta', 'precio_compra', 'stock'],
      optional: ['imagen', 'fecha_vencimiento', 'ingredientes', 'alergenos', 'calorias', 'porcion', 'categoria', 'variaciones']
    }
  },
  accesorio: {
    id: 'accesorio',
    label: 'Accesorio con Peso/Variables',
    icon: '⚖️',
    description: 'Productos con peso, medidas o variaciones personalizables',
    fields: {
      required: ['nombre', 'precio_venta', 'precio_compra'],
      optional: ['imagen', 'peso', 'unidad_peso', 'stock', 'dimensiones', 'color', 'material', 'talla', 'variaciones', 'categoria']
    }
  },
  combo: {
    id: 'combo',
    label: 'Combo / Ancheta',
    icon: '🎁',
    description: 'Pack de productos vinculados con precio calculado',
    fields: {
      required: ['nombre', 'precio_venta', 'precio_compra'],
      optional: ['imagen', 'categoria', 'descripcion', 'variaciones']
    }
  }
};

// Campos adicionales opcionales que pueden agregarse a cualquier tipo
export const ADDITIONAL_FIELDS = {
  peso: {
    id: 'peso',
    label: 'Peso',
    type: 'number',
    unit: 'kg',
    placeholder: 'Ej: 0.5'
  },
  unidad_peso: {
    id: 'unidad_peso',
    label: 'Unidad de Peso',
    type: 'select',
    options: ['kg', 'g', 'lb', 'oz']
  },
  dimensiones: {
    id: 'dimensiones',
    label: 'Dimensiones (L x A x H)',
    type: 'text',
    placeholder: 'Ej: 10x5x3 cm'
  },
  marca: {
    id: 'marca',
    label: 'Marca',
    type: 'text',
    placeholder: 'Ej: Nike'
  },
  modelo: {
    id: 'modelo',
    label: 'Modelo',
    type: 'text',
    placeholder: 'Ej: Air Max 2024'
  },
  color: {
    id: 'color',
    label: 'Color',
    type: 'text',
    placeholder: 'Ej: Azul, Rojo, Negro'
  },
  talla: {
    id: 'talla',
    label: 'Talla',
    type: 'text',
    placeholder: 'Ej: S, M, L, XL'
  },
  material: {
    id: 'material',
    label: 'Material',
    type: 'text',
    placeholder: 'Ej: Algodón, Poliéster'
  },
  pureza: {
    id: 'pureza',
    label: 'Pureza',
    type: 'select',
    options: ['24k', '22k', '18k', '14k', '10k', '925', '950']
  },
  categoria: {
    id: 'categoria',
    label: 'Categoría',
    type: 'text',
    placeholder: 'Ej: Ropa, Electrónica'
  },
  duracion: {
    id: 'duracion',
    label: 'Duración del Servicio',
    type: 'text',
    placeholder: 'Ej: 1 hora, 30 minutos'
  },
  descripcion: {
    id: 'descripcion',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción detallada del producto o servicio'
  },
  ingredientes: {
    id: 'ingredientes',
    label: 'Ingredientes',
    type: 'textarea',
    placeholder: 'Lista de ingredientes (separados por comas)'
  },
  alergenos: {
    id: 'alergenos',
    label: 'Alérgenos',
    type: 'text',
    placeholder: 'Ej: Gluten, Lactosa, Frutos secos'
  },
  calorias: {
    id: 'calorias',
    label: 'Calorías',
    type: 'number',
    placeholder: 'Ej: 250'
  },
  porcion: {
    id: 'porcion',
    label: 'Porción',
    type: 'text',
    placeholder: 'Ej: 1 unidad, 100g'
  },
  variaciones: {
    id: 'variaciones',
    label: 'Variaciones',
    type: 'textarea',
    placeholder: 'Ej: Tamaño: Pequeño, Mediano, Grande'
  }
};

// Función para obtener los campos de un tipo de producto
export const getProductTypeFields = (typeId) => {
  const productType = PRODUCT_TYPES[typeId];
  if (!productType) return { required: [], optional: [] };
  
  return productType.fields;
};

// Función para obtener la configuración de un campo adicional
export const getAdditionalFieldConfig = (fieldId) => {
  return ADDITIONAL_FIELDS[fieldId] || null;
};

// Función para validar si un campo es requerido para un tipo
export const isFieldRequired = (typeId, fieldId) => {
  const fields = getProductTypeFields(typeId);
  return fields.required.includes(fieldId);
};

// Función para validar si un campo es opcional para un tipo
export const isFieldOptional = (typeId, fieldId) => {
  const fields = getProductTypeFields(typeId);
  return fields.optional.includes(fieldId);
};
