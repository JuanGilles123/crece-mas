import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  CreditCard, 
  Package, 
  User, 
  TrendingUp
} from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ menuGroups, onItemClick }) => {
  const location = useLocation();
  
  // Obtener los 5 menús principales para la barra inferior
  const mainItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Inicio' },
    { to: '/dashboard/caja', icon: CreditCard, label: 'Caja' },
    { to: '/dashboard/inventario', icon: Package, label: 'Inventario' },
    { to: '/dashboard/resumen-ventas', icon: TrendingUp, label: 'Reportes' },
    { to: '/dashboard/perfil', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="bottom-nav">
      {mainItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to || 
                        (item.to === '/dashboard' && location.pathname === '/dashboard');
        
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
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
    </nav>
  );
};

export default BottomNav;
