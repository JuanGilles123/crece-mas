import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook mejorado para detectar escaneo de código de barras
 * Los escáneres de código de barras escriben muy rápido (típicamente < 50ms entre caracteres)
 * y terminan con Enter o Tab
 * Compatible con dispositivos móviles, tablet y PC
 */
export const useBarcodeScanner = (onBarcodeScanned, options = {}) => {
  const {
    minLength = 3, // Longitud mínima para considerar código de barras
    maxTimeBetweenChars = 50, // Tiempo máximo entre caracteres (ms) - reducido para mejor detección
    onScanComplete = null, // Callback cuando se completa el escaneo
    autoSubmit = true, // Si debe procesar automáticamente después de detectar
    maxLength = 50, // Longitud máxima esperada para código de barras
    clearInput = true // Si debe limpiar el input después de escanear (por defecto true)
  } = options;

  const inputRef = useRef(null);
  const lastCharTimeRef = useRef(null);
  const barcodeBufferRef = useRef('');
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false); // Prevenir procesamiento múltiple
  const lastInputValueRef = useRef(''); // Para detectar cambios en móviles
  const scanStartTimeRef = useRef(null); // Tiempo de inicio del escaneo

  // Función para procesar el código de barras
  const processBarcode = useCallback((barcode) => {
    if (isProcessingRef.current) return; // Ya se está procesando
    
    const trimmedBarcode = barcode.trim();
    if (trimmedBarcode.length >= minLength && trimmedBarcode.length <= maxLength && onBarcodeScanned) {
      isProcessingRef.current = true;
      
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Llamar al callback
      onBarcodeScanned(trimmedBarcode);
      
      // Limpiar buffer y estado
      barcodeBufferRef.current = '';
      lastCharTimeRef.current = null;
      lastInputValueRef.current = '';
      scanStartTimeRef.current = null;
      
      // Limpiar el input solo si clearInput es true
      if (clearInput && inputRef.current) {
        inputRef.current.value = '';
        // Disparar evento input para sincronizar estado
        const event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
      
      // Resetear flag después de un delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 200);
      
      if (onScanComplete) {
        onScanComplete(trimmedBarcode);
      }
    }
  }, [minLength, maxLength, onBarcodeScanned, onScanComplete, clearInput]);

  const handleKeyDown = useCallback((e) => {
    // Si es Enter o Tab, es definitivamente el final del código de barras
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      
      // Obtener el valor actual del input
      const currentValue = inputRef.current?.value || barcodeBufferRef.current;
      const trimmedValue = currentValue.trim();
      
      if (trimmedValue.length >= minLength && !isProcessingRef.current) {
        processBarcode(trimmedValue);
      } else {
        // Si no cumple la longitud mínima, limpiar
        barcodeBufferRef.current = '';
        lastCharTimeRef.current = null;
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
      return;
    }
    
    // Si es un carácter imprimible
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      
      // Si pasó mucho tiempo desde el último carácter, resetear buffer (usuario escribiendo manualmente)
      if (lastCharTimeRef.current && (now - lastCharTimeRef.current) > maxTimeBetweenChars * 3) {
        barcodeBufferRef.current = '';
        scanStartTimeRef.current = null;
      }
      
      // Si es el primer carácter del escaneo, registrar tiempo de inicio
      if (!scanStartTimeRef.current) {
        scanStartTimeRef.current = now;
      }
      
      // Agregar carácter al buffer
      barcodeBufferRef.current += e.key;
      lastCharTimeRef.current = now;
      
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Si alcanzamos la longitud máxima, procesar inmediatamente
      if (barcodeBufferRef.current.length >= maxLength) {
        processBarcode(barcodeBufferRef.current);
        return;
      }
      
      // Si después de un tiempo no hay más caracteres, podría ser código de barras completo
      if (autoSubmit) {
        timeoutRef.current = setTimeout(() => {
          const barcode = barcodeBufferRef.current.trim();
          
          // Si pasó suficiente tiempo desde el último carácter y tenemos una longitud válida
          if (barcode.length >= minLength && 
              barcode.length <= maxLength && 
              !isProcessingRef.current &&
              (Date.now() - lastCharTimeRef.current) >= maxTimeBetweenChars) {
            processBarcode(barcode);
          }
        }, maxTimeBetweenChars + 30);
      }
    }
  }, [maxTimeBetweenChars, minLength, maxLength, autoSubmit, processBarcode]);

  // Manejar cambios en el input (importante para móviles y tablet)
  const handleInputChange = useCallback((e) => {
    const currentValue = e.target.value;
    const now = Date.now();
    
    // Si el valor cambió significativamente (escaneo rápido), podría ser código de barras
    const valueLength = currentValue.length;
    const lastLength = lastInputValueRef.current.length;
    
    // Si el valor aumentó rápidamente (más de 2 caracteres de diferencia), podría ser escaneo
    if (valueLength > lastLength + 1) {
      // Si pasó poco tiempo desde el último cambio, es probable que sea un escaneo
      if (!lastCharTimeRef.current || (now - lastCharTimeRef.current) < maxTimeBetweenChars * 2) {
        barcodeBufferRef.current = currentValue;
        lastCharTimeRef.current = now;
        
        if (!scanStartTimeRef.current) {
          scanStartTimeRef.current = now;
        }
        
        // Limpiar timeout anterior
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Si alcanzamos la longitud máxima, procesar inmediatamente
        if (currentValue.length >= maxLength) {
          processBarcode(currentValue);
          return;
        }
        
        // Esperar un poco más para ver si hay más caracteres (móviles pueden ser más lentos)
        if (autoSubmit) {
          timeoutRef.current = setTimeout(() => {
            if (barcodeBufferRef.current === currentValue && 
                currentValue.trim().length >= minLength && 
                currentValue.trim().length <= maxLength &&
                !isProcessingRef.current &&
                (Date.now() - lastCharTimeRef.current) >= maxTimeBetweenChars) {
              processBarcode(currentValue);
            }
          }, maxTimeBetweenChars + 50);
        }
      }
    } else if (valueLength < lastLength) {
      // Si el valor disminuyó, el usuario está borrando manualmente
      barcodeBufferRef.current = currentValue;
      lastCharTimeRef.current = now;
      scanStartTimeRef.current = null;
      
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    
    lastInputValueRef.current = currentValue;
  }, [maxTimeBetweenChars, minLength, maxLength, autoSubmit, processBarcode]);

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
    scanStartTimeRef.current = null;
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
