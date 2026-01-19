import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const InfiniteScroll = ({ 
  children, 
  hasNextPage, 
  isFetchingNextPage, 
  fetchNextPage, 
  threshold = 200,
  className = '',
  loadingComponent = null 
}) => {
  const observerRef = useRef();
  const lastElementRef = useRef();

  const lastElementCallback = useCallback((node) => {
    if (isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, {
      threshold: 0.1,
      rootMargin: `${threshold}px`
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage, threshold]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className={className}>
      {children}
      
      {/* Elemento trigger para infinite scroll */}
      <div ref={lastElementCallback} className="h-4" />
      
      {/* Loading indicator */}
      {isFetchingNextPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex justify-center items-center py-8"
        >
          {loadingComponent || (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Cargando más productos...</span>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Mensaje cuando no hay más datos */}
      {!hasNextPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          <p>No hay más productos para mostrar</p>
        </motion.div>
      )}
    </div>
  );
};

export default InfiniteScroll;
