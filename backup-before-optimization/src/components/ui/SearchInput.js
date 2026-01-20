import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';

const SearchInput = ({
  value,
  onChange,
  placeholder = "Buscar productos...",
  className = "",
  debounceMs = 300,
  showClearButton = true,
  loading = false,
  onClear,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const debounceRef = useRef(null);

  // Debounce del valor interno
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [internalValue, onChange, debounceMs, value]);

  // Sincronizar con valor externo
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '');
    }
  }, [value]);

  const handleClear = () => {
    setInternalValue('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Icono de búsqueda */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${loading ? 'bg-gray-50' : 'bg-white'}
          `}
          {...props}
        />

        {/* Botón de limpiar */}
        <AnimatePresence>
          {showClearButton && internalValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Indicador de búsqueda activa */}
      {internalValue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500"
        >
          Buscando: "{internalValue}"
        </motion.div>
      )}
    </div>
  );
};

export default SearchInput;
