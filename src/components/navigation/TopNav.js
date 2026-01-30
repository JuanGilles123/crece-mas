import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ChevronDown,
  Crown,
  Shield,
  Package2,
  Wallet,
  Eye,
  Building2,
  Check,
  UtensilsCrossed,
  Shirt,
  Store,
  Package,
  Bell,
  CreditCard,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import { useProductos } from '../../hooks/useProductos';
import { useCreditos } from '../../hooks/useCreditos';
import { useCreditosProveedores } from '../../hooks/useEgresos';
import './TopNav.css';

const TopNav = ({ menuGroups, userProfile, onMenuClick }) => {
  const location = useLocation();
  const { user, organization } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 });
  const [notificationsPosition, setNotificationsPosition] = useState({ top: 0, left: 0, right: null });
  const dropdownRefs = useRef({});
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  const { data: productos = [] } = useProductos(organization?.id);
  const { data: creditosVencidos = [] } = useCreditos(organization?.id, { vencidos: true });
  const { data: creditosProveedores = [] } = useCreditosProveedores(organization?.id);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs.current).forEach(key => {
        if (dropdownRefs.current[key] && !dropdownRefs.current[key].contains(event.target)) {
          setOpenDropdown(null);
        }
      });
      
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    // Actualizar posición al hacer scroll
    const handleScroll = () => {
      if (openDropdown) {
        const element = dropdownRefs.current[openDropdown];
        if (element) {
          const rect = element.getBoundingClientRect();
          const isMobile = window.innerWidth <= 768;

          if (isMobile) {
            // En móvil, posicionar justo debajo del botón
            // Asegurar que no se salga de la pantalla
            const dropdownWidth = 200; // min-width del dropdown
            const screenWidth = window.innerWidth;
            let left = rect.left;

            // Si el dropdown se sale por la derecha, ajustarlo
            if (left + dropdownWidth > screenWidth - 12) {
              left = screenWidth - dropdownWidth - 12;
            }

            // Si el dropdown se sale por la izquierda, ajustarlo
            if (left < 12) {
              left = 12;
            }

            setDropdownPosition({
              top: rect.bottom + 8,
              left: left,
              right: 'auto'
            });
          } else {
            setDropdownPosition({
              top: rect.bottom + 8,
              left: rect.left
            });
          }
        }
      }

      if (notificationsOpen && notificationsRef.current) {
        const rect = notificationsRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          const dropdownWidth = 320;
          const screenWidth = window.innerWidth;
          let left = rect.left;

          if (left + dropdownWidth > screenWidth - 12) {
            left = screenWidth - dropdownWidth - 12;
          }
          if (left < 12) {
            left = 12;
          }

          setNotificationsPosition({
            top: rect.bottom + 8,
            left,
            right: null
          });
        } else {
          setNotificationsPosition({
            top: rect.top,
            left: 86,
            right: null
          });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [openDropdown, notificationsOpen]);

  const toggleDropdown = (groupLabel) => {
    if (openDropdown === groupLabel) {
      setOpenDropdown(null);
    } else {
      const element = dropdownRefs.current[groupLabel];
      if (element) {
        const rect = element.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
          // En móvil, posicionar justo debajo del botón
          // Asegurar que no se salga de la pantalla
          const dropdownWidth = 200; // min-width del dropdown
          const screenWidth = window.innerWidth;
          let left = rect.left;
          
          // Si el dropdown se sale por la derecha, ajustarlo
          if (left + dropdownWidth > screenWidth - 12) {
            left = screenWidth - dropdownWidth - 12;
          }
          
          // Si el dropdown se sale por la izquierda, ajustarlo
          if (left < 12) {
            left = 12;
          }
          
          setDropdownPosition({
            top: rect.bottom + 8,
            left: left,
            right: 'auto'
          });
        } else {
          // En desktop, posicionar fuera del sidebar
          setDropdownPosition({
            top: rect.top,
            left: 86 // 70px (sidebar) + 16px (margen)
          });
        }
      }
      setOpenDropdown(groupLabel);
    }
  };

  const handleItemClick = () => {
    setOpenDropdown(null);
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
    if (onMenuClick) onMenuClick();
  };

  const toggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    if (!nextOpen) {
      setNotificationsOpen(false);
      return;
    }

    if (notificationsRef.current) {
      const rect = notificationsRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        const dropdownWidth = 320;
        const screenWidth = window.innerWidth;
        let left = rect.left;

        if (left + dropdownWidth > screenWidth - 12) {
          left = screenWidth - dropdownWidth - 12;
        }
        if (left < 12) {
          left = 12;
        }

        setNotificationsPosition({
          top: rect.bottom + 8,
          left,
          right: null
        });
      } else {
        setNotificationsPosition({
          top: rect.top,
          left: 86,
          right: null
        });
      }
    }

    setNotificationsOpen(true);
  };

  // Cargar organizaciones
  const loadOrganizations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      const { data: memberships } = await supabase
        .from('team_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            business_type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      const allOrgs = [];

      if (profile?.organization_id) {
        const { data: mainOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (mainOrg) {
          allOrgs.push({
            ...mainOrg,
            role: profile.role,
            isPrimary: true
          });
        }
      }

      if (memberships) {
        memberships.forEach(m => {
          if (m.organizations && m.organizations.id !== profile?.organization_id) {
            allOrgs.push({
              ...m.organizations,
              role: m.role,
              isPrimary: false
            });
          }
        });
      }

      setOrganizations(allOrgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user, loadOrganizations]);

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const switchOrganization = async (orgId) => {
    if (orgId === organization?.id) {
      setProfileDropdownOpen(false);
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('selected_organization_id', orgId);
      window.location.reload();
    } catch (error) {
      console.error('Error switching organization:', error);
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      owner: 'Propietario',
      admin: 'Administrador',
      inventory_manager: 'Inventario',
      cashier: 'Cajero',
      viewer: 'Visualizador'
    };
    return labels[role] || role;
  };

  const getBusinessTypeIcon = (type) => {
    const iconMap = {
      food: UtensilsCrossed,
      clothing: Shirt,
      retail: Store,
      other: Package
    };
    const IconComponent = iconMap[type] || Package;
    return <IconComponent size={14} />;
  };

  // Verificar si algún item del grupo está activo
  const isGroupActive = (group) => {
    if (group.type === 'single') {
      return location.pathname === group.to;
    }
    return group.items?.some(item => location.pathname === item.to);
  };

  // Calcular posición del tooltip
  const handleItemHover = (label, element) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({ top: rect.top + rect.height / 2 });
      setHoveredItem(label);
    }
  };

  // Renderizar tooltip
  const renderTooltip = (label) => {
    // No mostrar tooltip si el dropdown está abierto o si es móvil
    if (label === 'Notificaciones' && notificationsOpen) return null;
    if (!isMobile && hoveredItem === label && openDropdown !== label) {
      return (
        <motion.div
          className="top-nav-tooltip"
          style={{ top: `${tooltipPosition.top}px` }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          {label}
        </motion.div>
      );
    }
    return null;
  };

  const notificationsSections = useMemo(() => {
    const sections = [];
    const mostrarStockBajo = user?.user_metadata?.mostrarStockBajo !== false;
    const umbralStockBajo = Number(user?.user_metadata?.umbralStockBajo ?? 10);
    const umbralSeguro = Number.isFinite(umbralStockBajo) && umbralStockBajo > 0 ? umbralStockBajo : 10;

    const stockNumerico = productos
      .filter(p => p.stock !== null && p.stock !== undefined)
      .map(p => ({ ...p, stock: Number(p.stock) }));
    const agotados = mostrarStockBajo ? stockNumerico.filter(p => p.stock <= 0) : [];
    const bajos = mostrarStockBajo ? stockNumerico.filter(p => p.stock > 0 && p.stock <= umbralSeguro) : [];
    const productosCount = agotados.length + bajos.length;

    if (productosCount > 0) {
      const parts = [];
      if (agotados.length > 0) parts.push(`Agotados: ${agotados.length}`);
      if (bajos.length > 0) parts.push(`Stock bajo: ${bajos.length}`);

      sections.push({
        id: 'productos',
        label: `Productos (${productosCount})`,
        icon: Package,
        subtitle: parts.join('\n'),
        to: '/dashboard/inventario?stock=bajo',
        count: productosCount
      });
    }

    if (creditosVencidos.length > 0) {
      sections.push({
        id: 'clientes',
        label: `Clientes (${creditosVencidos.length})`,
        icon: CreditCard,
        subtitle: 'Pagos vencidos',
        to: '/dashboard/creditos?estado=vencido',
        count: creditosVencidos.length
      });
    }

    const ahora = new Date();
    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);
    const limite = new Date(inicioHoy);
    limite.setDate(limite.getDate() + 2);
    limite.setHours(23, 59, 59, 999);

    const proveedoresVencidosOProximos = (creditosProveedores || []).filter(credito => {
      if (Number(credito.monto_pendiente || 0) <= 0) return false;
      const estado = (credito.estado || '').toLowerCase();
      if (!credito.fecha_vencimiento) return estado === 'vencido';
      const fecha = new Date(credito.fecha_vencimiento);
      if (estado === 'vencido' || fecha < inicioHoy) return true;
      return fecha >= inicioHoy && fecha <= limite;
    });

    if (proveedoresVencidosOProximos.length > 0) {
      sections.push({
        id: 'proveedores',
        label: `Proveedores (${proveedoresVencidosOProximos.length})`,
        icon: Truck,
        subtitle: 'Vencidos o por vencer',
        to: '/dashboard/egresos?tab=creditos-proveedores&alerta=proveedores',
        count: proveedoresVencidosOProximos.length
      });
    }

    return sections;
  }, [productos, creditosVencidos, creditosProveedores, user?.user_metadata]);

  const notificationsCount = notificationsSections.reduce((acc, section) => acc + (section.count || 0), 0);

  const NotificationsDropdown = () => {
    if (!notificationsOpen) return null;
    const dropdownClass = isMobile ? 'top-nav-notification-dropdown' : 'top-nav-sidebar-dropdown';
    return (
      <motion.div
        className={dropdownClass}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        style={{
          top: `${notificationsPosition.top}px`,
          left: `${notificationsPosition.left}px`,
          right: notificationsPosition.right ? `${notificationsPosition.right}px` : 'auto'
        }}
      >
        <div className="top-nav-notification-header">
          <span>Notificaciones</span>
        </div>
        {notificationsCount === 0 ? (
          <div className="top-nav-notification-empty">No hay notificaciones.</div>
        ) : (
          <div className="top-nav-notification-list">
            {notificationsSections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <NavLink
                  key={section.id}
                  to={section.to}
                  className="top-nav-notification-item"
                  onClick={handleItemClick}
                >
                  <SectionIcon size={16} />
                  <div>
                    <div className="top-nav-notification-title">{section.label}</div>
                    {section.subtitle && (
                      <div className="top-nav-notification-subtitle">{section.subtitle}</div>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  // Si es móvil, renderizar la navegación superior normal
  if (isMobile) {
    return (
      <nav className="top-nav top-nav-mobile">
        <div className="top-nav-container">
        {/* Logos: Crece Mas y Empresa */}
        <div className="top-nav-logo-section">
          {/* Logo Crece Mas - clickeable para ir a inicio */}
          <NavLink 
            to="/dashboard" 
            className="top-nav-logo"
            onClick={handleItemClick}
          >
            <img 
              src="/logo-crece.svg" 
              alt="Crece+" 
              className="top-nav-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span style="color: #007AFF; font-size: 1.5rem; font-weight: 700;">Crece+</span>';
              }}
            />
          </NavLink>
          
          {/* Logo de la empresa del usuario */}
          {organization?.logo_url && (
            <div className="top-nav-org-logo">
              <img 
                src={organization.logo_url} 
                alt={organization.name || 'Logo empresa'} 
                className="top-nav-org-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Menús principales */}
        <div className="top-nav-menu">
          {menuGroups.map((group, index) => {
            const notificationsNode = (
              <div className="top-nav-notifications top-nav-notifications-menu" ref={notificationsRef}>
                <button
                  className={`top-nav-notification-btn ${notificationsOpen ? 'open' : ''}`}
                  onClick={toggleNotifications}
                  aria-label="Notificaciones"
                >
                  <Bell size={18} />
                  {notificationsCount > 0 && (
                    <span className="top-nav-notification-badge">{notificationsCount}</span>
                  )}
                </button>
                <AnimatePresence>
                  {notificationsOpen && <NotificationsDropdown />}
                </AnimatePresence>
              </div>
            );

            if (group.type === 'single') {
              const Icon = group.icon;
              const isActive = location.pathname === group.to;
              
              return (
                <React.Fragment key={group.to}>
                  <NavLink
                    to={group.to}
                    end={group.end}
                    className={`top-nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleItemClick}
                  >
                    <Icon size={18} />
                    <span>{group.label}</span>
                  </NavLink>
                  {group.label === 'Inventario' && notificationsNode}
                </React.Fragment>
              );
            } else {
              const Icon = group.icon;
              const isActive = isGroupActive(group);
              const isOpen = openDropdown === group.label;
              
              return (
                <React.Fragment key={`group-${group.label}`}>
                  <div 
                    className={`top-nav-dropdown ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                    ref={el => dropdownRefs.current[group.label] = el}
                  >
                    <button
                      className="top-nav-dropdown-button"
                      onClick={() => toggleDropdown(group.label)}
                    >
                      <Icon size={18} />
                      <span>{group.label}</span>
                      <ChevronDown 
                        size={16} 
                        className={`dropdown-chevron ${isOpen ? 'open' : ''}`}
                      />
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="top-nav-dropdown-menu"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: dropdownPosition.left === 'auto' ? 'auto' : `${dropdownPosition.left}px`,
                            right: dropdownPosition.right ? `${dropdownPosition.right}px` : 'auto'
                          }}
                        >
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `top-nav-dropdown-item ${isActive ? 'active' : ''}`}
                                onClick={handleItemClick}
                              >
                                <ItemIcon size={16} />
                                <span>{item.label}</span>
                              </NavLink>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {group.label === 'Inventario' && notificationsNode}
                </React.Fragment>
              );
            }
          })}
        </div>

        {/* Badge de rol y perfil con dropdown - Combinado */}
        <div className="top-nav-right">
          <div className="top-nav-profile-wrapper" ref={profileRef}>
            <button
              className={`top-nav-profile ${location.pathname === '/dashboard/perfil' ? 'active' : ''} ${userProfile ? `role-${userProfile.role}` : ''}`}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              {userProfile ? (
                <>
                  {userProfile.role === 'owner' && <Crown size={16} />}
                  {userProfile.role === 'admin' && <Shield size={16} />}
                  {userProfile.role === 'inventory_manager' && <Package2 size={16} />}
                  {userProfile.role === 'cashier' && <Wallet size={16} />}
                  {userProfile.role === 'viewer' && <Eye size={16} />}
                  {!['owner', 'admin', 'inventory_manager', 'cashier', 'viewer'].includes(userProfile.role) && <User size={16} />}
                </>
              ) : (
                <User size={20} />
              )}
            </button>
            
            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="top-nav-profile-dropdown"
                  style={{
                    top: `${profileRef.current?.getBoundingClientRect().bottom + 8}px`,
                    right: window.innerWidth <= 768 ? '12px' : '24px'
                  }}
                >
                  {/* Selector de organizaciones */}
                  {organizations.length > 1 && (
                    <div className="profile-dropdown-section">
                      <div className="profile-dropdown-section-title">
                        <Building2 size={16} />
                        <span>Organizaciones</span>
                      </div>
                      <div className="profile-dropdown-orgs">
                        {organizations.map(org => (
                          <button
                            key={org.id}
                            className={`profile-dropdown-org ${org.id === organization?.id ? 'active' : ''}`}
                            onClick={() => switchOrganization(org.id)}
                            disabled={loading}
                          >
                            <div className="profile-dropdown-org-content">
                              <Building2 size={16} />
                              <div>
                                <div className="profile-dropdown-org-name">
                                  {org.name}
                                  {org.isPrimary && <span className="org-badge-primary">Principal</span>}
                                </div>
                                <div className="profile-dropdown-org-meta">
                                  <span>{getRoleLabel(org.role)}</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>{getBusinessTypeIcon(org.business_type)}</span>
                                </div>
                              </div>
                            </div>
                            {org.id === organization?.id && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Enlace al perfil */}
                  <NavLink
                    to="/dashboard/perfil"
                    className="profile-dropdown-item"
                    onClick={handleItemClick}
                  >
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
    );
  }

  // Desktop: Barra lateral izquierda con iconos
  return (
    <nav className="top-nav top-nav-sidebar">
      <div className="top-nav-sidebar-container">
        {/* Logo - clickeable para ir a inicio */}
        <NavLink 
          to="/dashboard" 
          className="top-nav-sidebar-logo"
          onClick={handleItemClick}
        >
          <img 
            src="/logo-crece.svg" 
            alt="Crece+" 
            className="top-nav-sidebar-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span style="color: #007AFF; font-size: 1.5rem; font-weight: 700;">Crece+</span>';
            }}
          />
        </NavLink>

        {/* Menús principales como iconos */}
        <div className="top-nav-sidebar-menu">
          {menuGroups.map((group, index) => {
            const notificationsNode = (
              <div
                className="top-nav-sidebar-item-wrapper"
                onMouseEnter={(e) => handleItemHover('Notificaciones', e.currentTarget)}
                onMouseLeave={() => setHoveredItem(null)}
                ref={notificationsRef}
              >
                <button
                  className={`top-nav-sidebar-item ${notificationsOpen ? 'open' : ''}`}
                  onClick={toggleNotifications}
                  aria-label="Notificaciones"
                >
                  <Bell size={22} />
                  {notificationsCount > 0 && (
                    <span className="top-nav-notification-badge top-nav-notification-badge-sidebar">
                      {notificationsCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {renderTooltip('Notificaciones')}
                </AnimatePresence>
                <AnimatePresence>
                  {notificationsOpen && <NotificationsDropdown />}
                </AnimatePresence>
              </div>
            );

            if (group.type === 'single') {
              const Icon = group.icon;
              const isActive = location.pathname === group.to;
              
              return (
                <React.Fragment key={group.to}>
                  <div
                    className="top-nav-sidebar-item-wrapper"
                    onMouseEnter={(e) => handleItemHover(group.label, e.currentTarget)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <NavLink
                      to={group.to}
                      end={group.end}
                      className={`top-nav-sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={handleItemClick}
                    >
                      <Icon size={22} />
                    </NavLink>
                    <AnimatePresence>
                      {renderTooltip(group.label)}
                    </AnimatePresence>
                  </div>
                  {group.label === 'Inventario' && notificationsNode}
                </React.Fragment>
              );
            } else {
              const Icon = group.icon;
              const isActive = isGroupActive(group);
              const isOpen = openDropdown === group.label;
              
              return (
                <React.Fragment key={`group-${group.label}`}>
                  <div
                    className={`top-nav-sidebar-item-wrapper ${isActive ? 'active' : ''}`}
                    ref={el => dropdownRefs.current[group.label] = el}
                    onMouseEnter={(e) => handleItemHover(group.label, e.currentTarget)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      className={`top-nav-sidebar-item ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleDropdown(group.label)}
                    >
                      <Icon size={22} />
                    </button>
                    <AnimatePresence>
                      {renderTooltip(group.label)}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="top-nav-sidebar-dropdown"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                          }}
                        >
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `top-nav-sidebar-dropdown-item ${isActive ? 'active' : ''}`}
                                onClick={handleItemClick}
                              >
                                <ItemIcon size={18} />
                                <span>{item.label}</span>
                              </NavLink>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {group.label === 'Inventario' && notificationsNode}
                </React.Fragment>
              );
            }
          })}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
