import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showInfo = true,
  maxVisiblePages = 5
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Ajustar start si estamos cerca del final
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    // Agregar primera página si no está visible
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    // Agregar páginas visibles
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Agregar última página si no está visible
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Información de paginación */}
      {showInfo && (
        <div className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </div>
      )}
      
      {/* Controles de paginación */}
      <div className="flex items-center space-x-1">
        {/* Botón anterior */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border
            transition-colors duration-200
            ${currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        
        {/* Páginas */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="flex items-center justify-center w-10 h-10">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-lg border
                  transition-colors duration-200
                  ${currentPage === page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                {page}
              </motion.button>
            )}
          </React.Fragment>
        ))}
        
        {/* Botón siguiente */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border
            transition-colors duration-200
            ${currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default Pagination;
