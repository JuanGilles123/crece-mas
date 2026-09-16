import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const AnimatedList = ({ children, delay = 2500, className = '', maxItems = 4 }) => {
  const [items, setItems] = useState([]);
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);
  
  useEffect(() => {
    let index = 0;
    
    // Función para agregar items
    const addItem = () => {
      if (index < childrenArray.length) {
        setItems((prev) => {
          const newItems = [childrenArray[index], ...prev];
          return newItems.slice(0, maxItems);
        });
        index++;
      } else {
        index = 0; // Reiniciar para crear el loop infinito
        setItems((prev) => {
          const newItems = [childrenArray[index], ...prev];
          return newItems.slice(0, maxItems);
        });
        index++;
      }
    };

    // Agregar el primer item inmediatamente
    addItem();

    const interval = setInterval(addItem, delay);
    return () => clearInterval(interval);
  }, [childrenArray, delay, maxItems]);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', position: 'relative', overflow: 'hidden', padding: '1rem' }}>
      <AnimatePresence initial={false}>
        {items.filter(Boolean).map((item, i) => (
          <motion.div
            key={item?.key || i}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ width: '100%', transformOrigin: 'top center' }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
