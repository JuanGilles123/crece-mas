import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  CreditCard, 
  Package, 
  User, 
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ menuGroups, onItemClick }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  
  // Obtener los 5 menús principales para la barra inferior
  const mainItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Inicio' },
    { to: '/dashboard/caja', icon: CreditCard, label: 'Caja' },
    { to: '/dashboard/inventario', icon: Package, label: 'Inventario' },
    { to: '/dashboard/resumen-ventas', icon: TrendingUp, label: 'Reportes' },
    { to: '/dashboard/perfil', icon: User, label: 'Perfil' },
  ];

  const toggleNav = () => {
    setIsVisible(!isVisible);
  };

  const handleItemClick = (e) => {
    if (onItemClick) {
      onItemClick(e);
    }
    setIsVisible(false);
  };

  return (
    <>
      {/* Botón flotante para mostrar/ocultar */}
      <motion.button
        className="bottom-nav-toggle"
        onClick={toggleNav}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isVisible ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Navegación inferior */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            className="bottom-nav"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || 
                              (item.to === '/dashboard' && location.pathname === '/dashboard');
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleItemClick}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="bottom-nav-item-content"
                  >
                    <Icon size={22} />
                    <span className="bottom-nav-item-label">{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="bottom-nav-indicator"
                        layoutId="bottomNavIndicator"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </NavLink>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
