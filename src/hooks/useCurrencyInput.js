import { useState, useCallback, useRef } from 'react';

// Formatear número con separador de miles
const formatNumber = (value) => {
  if (!value) return '';
  // Eliminar todo excepto números
  const numero = value.toString().replace(/\D/g, '');
  if (!numero) return '';
  // Formatear con puntos como separador de miles
  return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Hook para manejar inputs de moneda con formato de miles
 * Optimizado para evitar re-renders y pantallazos
 */
export const useCurrencyInput = (initialValue = '') => {
  const [displayValue, setDisplayValue] = useState(
    initialValue ? formatNumber(initialValue.toString()) : ''
  );
  const numericValueRef = useRef(0);

  // Manejar cambio en el input - OPTIMIZADO
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const numero = newValue.replace(/\D/g, '');
    
    if (numero) {
      const formatted = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      numericValueRef.current = parseInt(numero, 10);
      setDisplayValue(formatted);
    } else {
      numericValueRef.current = 0;
      setDisplayValue('');
    }
  }, []);

  // Establecer valor programáticamente
  const setValue = useCallback((value) => {
    const numero = value.toString().replace(/\D/g, '');
    if (numero) {
      const formatted = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      numericValueRef.current = parseInt(numero, 10);
      setDisplayValue(formatted);
    } else {
      numericValueRef.current = 0;
      setDisplayValue('');
    }
  }, []);

  // Resetear valor
  const reset = useCallback(() => {
    numericValueRef.current = 0;
    setDisplayValue('');
  }, []);

  // Obtener valor numérico
  const getNumericValue = useCallback(() => {
    return numericValueRef.current;
  }, []);

  return {
    displayValue,
    get numericValue() {
      return numericValueRef.current;
    },
    handleChange,
    setValue,
    reset,
    getNumericValue
  };
};

/**
 * Función standalone para formatear números
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const numero = value.toString().replace(/\D/g, '');
  if (!numero) return '';
  return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Función standalone para obtener valor numérico
 */
export const getNumericValue = (formattedValue) => {
  if (!formattedValue) return 0;
  return parseFloat(formattedValue.toString().replace(/\./g, '')) || 0;
};
