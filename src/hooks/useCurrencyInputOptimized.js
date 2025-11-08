import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Hook ultra-optimizado para inputs de moneda SIN pantallazos
 * Usa manipulación directa del DOM para el formato pero mantiene estado para validaciones
 */
const useCurrencyInputOptimized = (initialValue = 0) => {
  const inputRef = useRef(null);
  const [numericValue, setNumericValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState('');
  const cursorPositionRef = useRef(0);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumber = (str) => {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, ''), 10) || 0;
  };

  // Inicializar el displayValue
  useEffect(() => {
    setDisplayValue(formatNumber(initialValue));
  }, []);

  const handleChange = useCallback((e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const newValue = e.target.value.replace(/\./g, '');
    
    // Solo permitir números
    if (newValue && !/^\d+$/.test(newValue)) {
      e.preventDefault();
      return;
    }

    const numValue = parseNumber(newValue);
    const formattedValue = formatNumber(numValue);
    
    // Actualizar estados
    setNumericValue(numValue);
    setDisplayValue(formattedValue);
    
    // Calcular nueva posición del cursor
    const oldDots = (oldValue.slice(0, cursorPosition).match(/\./g) || []).length;
    const newDots = (formattedValue.slice(0, cursorPosition).match(/\./g) || []).length;
    const dotDiff = newDots - oldDots;
    
    // Guardar posición del cursor
    const newCursorPosition = Math.max(0, Math.min(
      cursorPosition + dotDiff,
      formattedValue.length
    ));
    cursorPositionRef.current = newCursorPosition;
    
    // Restaurar posición del cursor en el siguiente frame
    requestAnimationFrame(() => {
      if (input === document.activeElement) {
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });
  }, []);

  const setValue = useCallback((value) => {
    const numValue = typeof value === 'number' ? value : parseNumber(value);
    const formatted = formatNumber(numValue);
    setNumericValue(numValue);
    setDisplayValue(formatted);
  }, []);

  const reset = useCallback(() => {
    setNumericValue(0);
    setDisplayValue('');
  }, []);

  return {
    inputRef,
    handleChange,
    numericValue,
    displayValue,
    setValue,
    reset
  };
};

export default useCurrencyInputOptimized;

/**
 * Función para formatear números
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const numero = value.toString().replace(/\D/g, '');
  if (!numero) return '';
  return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Función para obtener valor numérico
 */
export const getNumericValue = (formattedValue) => {
  if (!formattedValue) return 0;
  return parseInt(formattedValue.toString().replace(/\D/g, ''), 10) || 0;
};
