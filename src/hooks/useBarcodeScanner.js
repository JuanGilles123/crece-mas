import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook para detectar escaneo de código de barras
 * Los escáneres de código de barras escriben muy rápido (típicamente < 100ms entre caracteres)
 * y terminan con Enter o Tab
 * Compatible con dispositivos móviles
 */
export const useBarcodeScanner = (onBarcodeScanned, options = {}) => {
  const {
    minLength = 3, // Longitud mínima para considerar código de barras
    maxTimeBetweenChars = 100, // Tiempo máximo entre caracteres (ms)
    onScanComplete = null // Callback cuando se completa el escaneo
  } = options;

  const inputRef = useRef(null);
  const lastCharTimeRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false); // Prevenir procesamiento múltiple
  const lastInputValueRef = useRef(''); // Para detectar cambios en móviles

  // Función para procesar el código de barras
  const processBarcode = useCallback((barcode) => {
    if (isProcessingRef.current) return; // Ya se está procesando
    
    const trimmedBarcode = barcode.trim();
    if (trimmedBarcode.length >= minLength && onBarcodeScanned) {
      isProcessingRef.current = true;
      
      // Llamar al callback
      onBarcodeScanned(trimmedBarcode);
      
      // Limpiar buffer y estado
      barcodeBufferRef.current = '';
      lastCharTimeRef.current = null;
      lastInputValueRef.current = '';
      
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Limpiar el input después de un pequeño delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = '';
          // Mantener el foco en el input
          inputRef.current.focus();
        }
        isProcessingRef.current = false;
      }, 50);
      
      if (onScanComplete) {
        onScanComplete(trimmedBarcode);
      }
    }
  }, [minLength, onBarcodeScanned, onScanComplete]);

  const handleKeyDown = useCallback((e) => {
    // Si es Enter o Tab, podría ser el final del código de barras
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      
      // Obtener el valor actual del input (para móviles)
      const currentValue = inputRef.current?.value || barcodeBufferRef.current;
      if (currentValue.trim().length >= minLength) {
        processBarcode(currentValue);
      }
      return;
    }
    
    // Si es un carácter imprimible
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      
      // Si pasó mucho tiempo desde el último carácter, resetear buffer
      if (lastCharTimeRef.current && (now - lastCharTimeRef.current) > maxTimeBetweenChars) {
        barcodeBufferRef.current = '';
      }
      
      // Agregar carácter al buffer
      barcodeBufferRef.current += e.key;
      lastCharTimeRef.current = now;
      
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Si después de un tiempo no hay más caracteres, podría ser código de barras
      timeoutRef.current = setTimeout(() => {
        const barcode = barcodeBufferRef.current.trim();
        if (barcode.length >= minLength && !isProcessingRef.current) {
          processBarcode(barcode);
        }
      }, maxTimeBetweenChars + 50);
    }
  }, [maxTimeBetweenChars, minLength, processBarcode]);

  // Manejar cambios en el input (importante para móviles)
  const handleInputChange = useCallback((e) => {
    const currentValue = e.target.value;
    
    // Si el valor cambió significativamente (escaneo rápido), podría ser código de barras
    const valueLength = currentValue.length;
    const lastLength = lastInputValueRef.current.length;
    
    // Si el valor aumentó rápidamente (más de 3 caracteres de diferencia), podría ser escaneo
    if (valueLength > lastLength + 2) {
      const now = Date.now();
      
      // Si pasó poco tiempo desde el último cambio, es probable que sea un escaneo
      if (!lastCharTimeRef.current || (now - lastCharTimeRef.current) < maxTimeBetweenChars * 2) {
        barcodeBufferRef.current = currentValue;
        lastCharTimeRef.current = now;
        
        // Limpiar timeout anterior
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Esperar un poco más para ver si hay más caracteres (móviles pueden ser más lentos)
        timeoutRef.current = setTimeout(() => {
          if (barcodeBufferRef.current === currentValue && currentValue.trim().length >= minLength && !isProcessingRef.current) {
            processBarcode(currentValue);
          }
        }, maxTimeBetweenChars + 100);
      }
    }
    
    lastInputValueRef.current = currentValue;
  }, [maxTimeBetweenChars, minLength, processBarcode]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    barcodeBufferRef.current = '';
    lastCharTimeRef.current = null;
    lastInputValueRef.current = '';
    isProcessingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return {
    inputRef,
    handleKeyDown,
    handleInputChange,
    reset
  };
};
