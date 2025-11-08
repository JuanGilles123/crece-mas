import React, { useState, useEffect, useRef, memo } from 'react';

/**
 * Componente de lista virtualizada para renderizar eficientemente listas grandes
 * Solo renderiza los items visibles en el viewport + buffer
 */
const VirtualList = memo(({ 
  items = [], 
  itemHeight = 100, 
  containerHeight = 600, 
  buffer = 3, 
  renderItem,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calcular qué items están visibles
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  );

  // Items visibles
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Altura total de la lista
  const totalHeight = items.length * itemHeight;

  // Offset del primer item visible
  const offsetY = startIndex * itemHeight;

  // Manejar scroll
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Scroll suave al cambiar items
  useEffect(() => {
    if (containerRef.current) {
      const currentScroll = containerRef.current.scrollTop;
      if (currentScroll > totalHeight) {
        containerRef.current.scrollTop = 0;
      }
    }
  }, [items.length, totalHeight]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      onScroll={handleScroll}
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative',
        willChange: 'scroll-position'
      }}
    >
      <div
        className="virtual-list-spacer"
        style={{
          height: `${totalHeight}px`,
          position: 'relative'
        }}
      >
        <div
          className="virtual-list-content"
          style={{
            position: 'absolute',
            top: `${offsetY}px`,
            left: 0,
            right: 0,
            willChange: 'transform'
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id || startIndex + index}
              className="virtual-list-item"
              style={{ height: `${itemHeight}px` }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para optimizar re-renders
  return (
    prevProps.items.length === nextProps.items.length &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.items === nextProps.items
  );
});

VirtualList.displayName = 'VirtualList';

export default VirtualList;
