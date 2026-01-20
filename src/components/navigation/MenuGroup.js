import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import './MenuGroup.css';

const MenuGroup = ({ 
  icon: Icon, 
  label, 
  items, 
  isCollapsed, 
  defaultOpen = false,
  onItemClick 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();
  
  // Verificar si algún item del grupo está activo
  const isActive = items.some(item => location.pathname === item.to);
  
  // Si un item está activo, abrir el grupo automáticamente (solo si sidebar no está colapsado)
  React.useEffect(() => {
    if (isActive && !isOpen && !isCollapsed) {
      setIsOpen(true);
    }
    // Si el sidebar se colapsa, cerrar el grupo para no mostrar espacio
    if (isCollapsed && isOpen) {
      setIsOpen(false);
    }
  }, [isActive, isOpen, isCollapsed]);

  const toggleGroup = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Si está colapsado, mostrar solo el icono
  if (isCollapsed) {
    return (
      <div className="menu-group-collapsed">
        <div 
          className={`menu-group-header-collapsed ${isActive ? 'active' : ''}`}
          title={label}
        >
          <Icon size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className={`menu-group ${isActive ? 'has-active' : ''}`}>
      <div 
        className={`menu-group-header ${isActive ? 'active' : ''}`}
        onClick={toggleGroup}
      >
        <div className="menu-group-header-content">
          <Icon className="menu-group-icon" size={20} />
          <span className="menu-group-label">{label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="menu-group-items"
          >
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 
                    `menu-group-item ${isActive ? 'active' : ''}`
                  }
                  onClick={onItemClick}
                  title={item.title || item.label}
                >
                  <ItemIcon className="menu-group-item-icon" size={18} />
                  <span className="menu-group-item-label">{item.label}</span>
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuGroup;
