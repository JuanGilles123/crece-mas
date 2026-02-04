import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Package, 
  User, 
  TrendingUp,
  ClipboardList,
  Menu,
  X,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import './BottomNav.css';

const BottomNav = ({ menuGroups, onItemClick, items }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const { organization } = useAuth();
  const { hasFeature } = useSubscription();
  
  // Verificar si los pedidos están habilitados
  const pedidosHabilitados = organization?.business_type === 'food' && 
                             organization?.pedidos_habilitados && 
                             hasFeature('pedidos');
  
  // Obtener los menús principales para la barra inferior (sin Inicio, el logo es clickeable)
  const mainItems = items || [
    { to: '/dashboard/caja', icon: CreditCard, label: 'Caja' },
    { to: '/dashboard/inventario', icon: Package, label: 'Inventario' },
    // Mostrar Pedidos si está habilitado, sino mostrar Reportes
    ...(pedidosHabilitados 
      ? [{ to: '/dashboard/tomar-pedido', icon: ClipboardList, label: 'Pedidos' }]
      : [{ to: '/dashboard/resumen-ventas', icon: TrendingUp, label: 'Reportes' }]
    ),
    { to: '/dashboard/perfil', icon: User, label: 'Perfil' },
    { to: '/dashboard/consultar-precio', icon: Tag, label: 'Consultar Precio' },
  ];

  const toggleNav = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    document.body.classList.toggle('bottom-nav-open', isVisible);
    return () => {
      document.body.classList.remove('bottom-nav-open');
    };
  }, [isVisible]);

  const handleItemClick = (e) => {
    // Prevenir que el evento se propague y cause errores de serialización
    try {
      if (onItemClick) {
        // No pasar el evento completo para evitar errores de serialización circular
        onItemClick();
      }
    } catch (error) {
      // Error silencioso
    }
    setIsVisible(false);
  };

  return (
    <>
      {/* Botón flotante para mostrar/ocultar */}
      <motion.button
        className={`bottom-nav-toggle ${isVisible ? 'open' : ''}`}
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
