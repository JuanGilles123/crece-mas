import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Package,
  User,
  TrendingUp,
  ClipboardList,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import './BottomNav.css';

const BottomNav = ({ onItemClick, items }) => {
  const location = useLocation();
  const { organization } = useAuth();
  const { hasFeature } = useSubscription();

  const pedidosHabilitados = organization?.business_type === 'food' &&
    organization?.pedidos_habilitados &&
    hasFeature('pedidos');

  const mainItems = items || [
    { to: '/dashboard/caja', icon: CreditCard, label: 'Caja' },
    { to: '/dashboard/inventario', icon: Package, label: 'Inventario' },
    ...(pedidosHabilitados
      ? [{ to: '/dashboard/tomar-pedido', icon: ClipboardList, label: 'Pedidos' }]
      : [{ to: '/dashboard/resumen-ventas', icon: TrendingUp, label: 'Reportes' }]
    ),
    { to: '/dashboard/perfil', icon: User, label: 'Perfil' },
    { to: '/dashboard/consultar-precio', icon: Tag, label: 'Precio' },
  ];

  const handleItemClick = () => {
    try {
      if (onItemClick) onItemClick();
    } catch (_) { }
  };

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
            onClick={handleItemClick}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className="bottom-nav-item-content"
            >
              {isActive && (
                <motion.div
                  className="bottom-nav-indicator"
                  layoutId="bottomNavIndicator"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon size={22} />
              <span className="bottom-nav-item-label">{item.label}</span>
            </motion.div>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
