import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import './TopNav.css';

const TopNav = ({ menuGroups, userProfile, onMenuClick }) => {
  const location = useLocation();
  const { user, organization } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRefs = useRef({});
  const profileRef = useRef(null);

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
    };

    // Actualizar posición al hacer scroll
    const handleScroll = () => {
      if (openDropdown) {
        const element = dropdownRefs.current[openDropdown];
        if (element) {
          const rect = element.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            left: rect.left
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
  }, [openDropdown]);

  const toggleDropdown = (groupLabel) => {
    if (openDropdown === groupLabel) {
      setOpenDropdown(null);
    } else {
      const element = dropdownRefs.current[groupLabel];
      if (element) {
        const rect = element.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left
        });
      }
      setOpenDropdown(groupLabel);
    }
  };

  const handleItemClick = () => {
    setOpenDropdown(null);
    setProfileDropdownOpen(false);
    if (onMenuClick) onMenuClick();
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
    const icons = {
      food: '🍔',
      clothing: '👔',
      retail: '🏪',
      other: '📦'
    };
    return icons[type] || '📦';
  };

  // Verificar si algún item del grupo está activo
  const isGroupActive = (group) => {
    if (group.type === 'single') {
      return location.pathname === group.to;
    }
    return group.items?.some(item => location.pathname === item.to);
  };

  return (
    <nav className="top-nav">
      <div className="top-nav-container">
        {/* Logos: Crece Mas y Empresa */}
        <div className="top-nav-logo-section">
          {/* Logo Crece Mas */}
          <div className="top-nav-logo">
            <img 
              src="/logo-crece.svg" 
              alt="Crece+" 
              className="top-nav-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span style="color: #007AFF; font-size: 1.5rem; font-weight: 700;">Crece+</span>';
              }}
            />
          </div>
          
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
            if (group.type === 'single') {
              const Icon = group.icon;
              const isActive = location.pathname === group.to;
              
              return (
                <NavLink
                  key={group.to}
                  to={group.to}
                  end={group.end}
                  className={`top-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleItemClick}
                >
                  <Icon size={18} />
                  <span>{group.label}</span>
                </NavLink>
              );
            } else {
              const Icon = group.icon;
              const isActive = isGroupActive(group);
              const isOpen = openDropdown === group.label;
              
              return (
                <div 
                  key={`group-${group.label}`}
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
                          left: `${dropdownPosition.left}px`
                        }}
                      >
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = location.pathname === item.to;
                          
                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={`top-nav-dropdown-item ${isItemActive ? 'active' : ''}`}
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
              );
            }
          })}
        </div>

        {/* Badge de rol y perfil con dropdown */}
        <div className="top-nav-right">
          {userProfile && (
            <div className={`top-nav-role-badge role-${userProfile.role}`}>
              {userProfile.role === 'owner' && (
                <>
                  <Crown size={14} />
                  <span>Propietario</span>
                </>
              )}
              {userProfile.role === 'admin' && (
                <>
                  <Shield size={14} />
                  <span>Administrador</span>
                </>
              )}
              {userProfile.role === 'inventory_manager' && (
                <>
                  <Package2 size={14} />
                  <span>Encargado</span>
                </>
              )}
              {userProfile.role === 'cashier' && (
                <>
                  <Wallet size={14} />
                  <span>Cajero</span>
                </>
              )}
              {userProfile.role === 'viewer' && (
                <>
                  <Eye size={14} />
                  <span>Visualizador</span>
                </>
              )}
            </div>
          )}
          
          <div className="top-nav-profile-wrapper" ref={profileRef}>
            <button
              className={`top-nav-profile ${location.pathname === '/dashboard/perfil' ? 'active' : ''}`}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <User size={20} />
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
                    right: '24px'
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
                                  <span>{getBusinessTypeIcon(org.business_type)}</span>
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
};

export default TopNav;
