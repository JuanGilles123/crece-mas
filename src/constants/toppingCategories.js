// Categorías predefinidas para toppings
export const TOPPING_CATEGORIES = [
  { id: 'salsas', label: 'Salsas', icon: '🌶️' },
  { id: 'adiciones', label: 'Adiciones', icon: '➕' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'quesos', label: 'Quesos', icon: '🧀' },
  { id: 'carnes', label: 'Carnes', icon: '🥩' },
  { id: 'vegetales', label: 'Vegetales', icon: '🥬' },
  { id: 'extras', label: 'Extras', icon: '⭐' },
  { id: 'general', label: 'General', icon: '📦' }
];

// Obtener categoría por ID
export const getCategoriaById = (id) => {
  return TOPPING_CATEGORIES.find(cat => cat.id === id) || TOPPING_CATEGORIES.find(cat => cat.id === 'general');
};

// Obtener todas las categorías como opciones para select
export const getCategoriaOptions = () => {
  return TOPPING_CATEGORIES.map(cat => ({
    value: cat.id,
    label: `${cat.icon} ${cat.label}`
  }));
};
