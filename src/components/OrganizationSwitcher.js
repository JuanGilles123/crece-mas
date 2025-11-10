import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './OrganizationSwitcher.css';

const OrganizationSwitcher = () => {
  const { user, organization } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      // Obtener todas las organizaciones donde es miembro
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

      // Agregar organización principal si existe
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

      // Agregar organizaciones de team_members
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

  // Cerrar modal con clicks fuera o tecla ESC
  useEffect(() => {
    if (!isOpen) {
      document.body.removeAttribute('data-modal-open');
      return;
    }

    // Prevenir scroll del body y marcar modal abierto
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-modal-open', 'true');

    const handleClickOutside = (event) => {
      // Solo cerrar si se hace click en el overlay (no en el modal)
      if (event.target.classList.contains('org-switcher-modal-overlay')) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const switchOrganization = async (orgId) => {
    if (orgId === organization?.id) {
      // Ya estás en esa organización
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Guardar la organización seleccionada en localStorage
      localStorage.setItem('selected_organization_id', orgId);
      
      // Recargar la página para que el AuthContext use la nueva organización
      window.location.reload();
      
    } catch (error) {
      console.error('Error switching organization:', error);
      setLoading(false);
    }
  };

  if (organizations.length <= 1) {
    // Si solo tiene una organización, no mostrar el selector
    return null;
  }

  return (
    <div className="organization-switcher">
      <button 
        className="org-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Building2 size={20} />
        <div className="org-info">
          <span className="org-name">{organization?.name || 'Organización'}</span>
          <span className="org-count">{organizations.length} organizaciones</span>
        </div>
        <ChevronDown size={18} className={isOpen ? 'rotate' : ''} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="org-switcher-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="org-switcher-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="org-modal-header">
                <h2>Selecciona una Organización</h2>
                <p>Cambiar entre tus negocios</p>
              </div>
              
              <div className="org-modal-content">
              {organizations.map(org => (
                <button
                  key={org.id}
                  className={`org-option ${org.id === organization?.id ? 'active' : ''}`}
                  onClick={() => switchOrganization(org.id)}
                  disabled={loading}
                >
                  <div className="org-option-content">
                    <Building2 size={18} />
                    <div>
                      <div className="org-option-name">
                        {org.name}
                        {org.isPrimary && <span className="badge-primary">Principal</span>}
                      </div>
                      <div className="org-option-meta">
                        <span className="role-badge">{getRoleLabel(org.role)}</span>
                        <span className="business-type">{getBusinessTypeIcon(org.business_type)}</span>
                      </div>
                    </div>
                  </div>
                  {org.id === organization?.id && <Check size={18} />}
                </button>
              ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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

export default OrganizationSwitcher;
