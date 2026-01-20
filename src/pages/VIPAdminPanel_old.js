import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Crown,
  Building2,
  Users,
  CreditCard,
  Search,
  Filter,
  ArrowLeft,
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Sparkles,
  Shield,
  Zap,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api/supabaseClient';
import toast from 'react-hot-toast';
import LottieLoader from '../components/ui/LottieLoader';
import './VIPAdminPanel.css';

const PLANES_DISPONIBLES = [
  { 
    slug: 'free', 
    name: 'Gratuito', 
    color: '#8b5cf6',
    icon: Package,
    price: 0,
    description: 'Plan básico gratuito'
  },
  { 
    slug: 'professional', 
    name: 'Profesional', 
    color: '#10b981',
    icon: Zap,
    price: 29000,
    description: 'Para negocios en crecimiento'
  },
  { 
    slug: 'enterprise', 
    name: 'Empresarial', 
    color: '#3b82f6',
    icon: Building2,
    price: 99000,
    description: 'Solución empresarial completa'
  },
  { 
    slug: 'custom', 
    name: 'VIP Developer', 
    color: '#f59e0b',
    icon: Crown,
    price: 0,
    description: 'Acceso completo ilimitado'
  }
];

const VIPAdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'create'
  const [procesando, setProcesando] = useState(false);
  
  // Form data para modal
  const [formData, setFormData] = useState({
    plan_slug: 'professional',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    billing_cycle: 'monthly'
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [searchTerm, filterPlan, organizations]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);

      // Obtener todas las organizaciones
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Para cada organización, obtener su suscripción y estadísticas
      const orgsWithData = await Promise.all(
        orgs.map(async (org) => {
          // Suscripción
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('organization_id', org.id)
            .eq('status', 'active')
            .maybeSingle();

          // Contar miembros
          const { count: membersCount } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Contar productos
          const { count: productsCount } = await supabase
            .from('productos')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          // Contar ventas del último mes
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          
          const { count: salesCount } = await supabase
            .from('ventas')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .gte('fecha', lastMonth.toISOString());

          // Email del owner - simplemente mostrar el ID ya que no tenemos acceso a auth.users
          // En producción, esto se obtendría del backend con service_role
          const ownerEmail = org.owner_id;
          const ownerName = null;

          return {
            ...org,
            subscription,
            stats: {
              members: membersCount || 0,
              products: productsCount || 0,
              salesLastMonth: salesCount || 0
            },
            owner_email: ownerEmail,
            owner_name: ownerName
          };
        })
      );

      setOrganizations(orgsWithData);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Error al cargar organizaciones');
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = [...organizations];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por plan
    if (filterPlan !== 'all') {
      filtered = filtered.filter(org => {
        const planSlug = org.subscription?.plan_slug || 'free';
        return planSlug === filterPlan;
      });
    }

    setFilteredOrgs(filtered);
  };

  const handleEditSubscription = (org) => {
    setSelectedOrg(org);
    setModalMode('edit');
    
    if (org.subscription) {
      setFormData({
        plan_slug: org.subscription.plan_slug,
        status: org.subscription.status,
        start_date: org.subscription.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        billing_cycle: 'monthly' // Valor por defecto ya que no se guarda en DB
      });
    } else {
      setFormData({
        plan_slug: 'professional',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        billing_cycle: 'monthly' // Valor por defecto
      });
    }
    
    setShowModal(true);
  };

  const handleSaveSubscription = async () => {
    if (!selectedOrg) return;

    try {
      setProcesando(true);

      const subscriptionData = {
        organization_id: selectedOrg.id,
        plan_slug: formData.plan_slug,
        status: formData.status,
        start_date: formData.start_date
        // billing_cycle: no existe en DB
        // next_billing_date: no existe en DB
        // amount: no existe en DB
        // created_at: se genera automáticamente
      };

      if (selectedOrg.subscription) {
        // Actualizar suscripción existente
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', selectedOrg.subscription.id);

        if (error) throw error;
        toast.success('Suscripción actualizada correctamente');
      } else {
        // Crear nueva suscripción
        const { error } = await supabase
          .from('subscriptions')
          .insert(subscriptionData);

        if (error) throw error;
        toast.success('Suscripción creada correctamente');
      }

      setShowModal(false);
      loadOrganizations();
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast.error('Error al guardar suscripción');
    } finally {
      setProcesando(false);
    }
  };

  const handleDeleteSubscription = async (org) => {
    if (!org.subscription) return;

    const confirmado = window.confirm(
      `¿Estás seguro de eliminar la suscripción de "${org.name}"? Esto la volverá al plan gratuito.`
    );

    if (!confirmado) return;

    try {
      setProcesando(true);

      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', org.subscription.id);

      if (error) throw error;

      toast.success('Suscripción eliminada correctamente');
      loadOrganizations();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Error al eliminar suscripción');
    } finally {
      setProcesando(false);
    }
  };

  const calculateNextBillingDate = (startDate, cycle) => {
    const date = new Date(startDate);
    
    if (cycle === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (cycle === 'yearly') {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date.toISOString().split('T')[0];
  };

  const getPlanColor = (planSlug) => {
    const plan = PLANES_DISPONIBLES.find(p => p.slug === planSlug);
    return plan?.color || '#8b5cf6';
  };

  const getPlanInfo = (planSlug) => {
    return PLANES_DISPONIBLES.find(p => p.slug === planSlug) || PLANES_DISPONIBLES[0];
  };

  const getPlanPrice = (planSlug) => {
    const plan = getPlanInfo(planSlug);
    return plan.price;
  };

  if (loading) {
    return (
      <div className="vip-admin-loading">
        <LottieLoader size="large" message="Cargando panel VIP..." />
      </div>
    );
  }

  return (
    <div className="vip-admin-panel">
      {/* Header */}
      <div className="vip-admin-header">
        <div className="header-content">
          <button className="btn-volver" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Volver
          </button>
          
          <div className="header-title">
            <Crown className="crown-icon" size={32} />
            <div>
              <h1>Panel de Administración VIP</h1>
              <p className="subtitle">Gestión de suscripciones y organizaciones</p>
            </div>
          </div>

          <button className="btn-refresh" onClick={loadOrganizations}>
            <RefreshCw size={20} />
            Actualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <motion.div 
            className="stat-card total"
            whileHover={{ y: -4 }}
          >
            <Building2 size={24} />
            <div className="stat-info">
              <span className="stat-value">{organizations.length}</span>
              <span className="stat-label">Organizaciones</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card active"
            whileHover={{ y: -4 }}
          >
            <Check size={24} />
            <div className="stat-info">
              <span className="stat-value">
                {organizations.filter(o => o.subscription?.status === 'active').length}
              </span>
              <span className="stat-label">Activas</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card premium"
            whileHover={{ y: -4 }}
          >
            <Sparkles size={24} />
            <div className="stat-info">
              <span className="stat-value">
                {organizations.filter(o => o.subscription && o.subscription.plan_slug !== 'free').length}
              </span>
              <span className="stat-label">Premium</span>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card revenue"
            whileHover={{ y: -4 }}
          >
            <DollarSign size={24} />
            <div className="stat-info">
              <span className="stat-value">
                ${organizations.reduce((sum, o) => {
                  if (!o.subscription) return sum;
                  const price = getPlanPrice(o.subscription.plan_slug);
                  return sum + price;
                }, 0).toLocaleString()}
              </span>
              <span className="stat-label">MRR Total</span>
            </div>
          </motion.div>
        </div>

        {/* Filtros */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre u organización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-select">
            <Filter size={20} />
            <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
              <option value="all">Todos los planes</option>
              <option value="free">Gratuito</option>
              <option value="professional">Profesional</option>
              <option value="enterprise">Empresarial</option>
              <option value="custom">VIP Developer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="organizations-list">
        {filteredOrgs.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <h3>No se encontraron organizaciones</h3>
            <p>Intenta con otros filtros de búsqueda</p>
          </div>
        ) : (
          filteredOrgs.map((org) => {
            const planSlug = org.subscription?.plan_slug || 'free';
            const planInfo = getPlanInfo(planSlug);
            const PlanIcon = planInfo.icon;

            return (
              <motion.div
                key={org.id}
                className="org-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <div className="org-header">
                  <div className="org-info">
                    <Building2 className="org-icon" size={24} />
                    <div>
                      <h3>{org.name}</h3>
                      <p className="org-owner">
                        👤 Owner ID: {org.owner_id?.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div 
                    className="org-plan-badge"
                    style={{ 
                      background: `linear-gradient(135deg, ${planInfo.color}22 0%, ${planInfo.color}44 100%)`,
                      border: `2px solid ${planInfo.color}66`
                    }}
                  >
                    <PlanIcon size={18} />
                    <span>{planInfo.name}</span>
                  </div>
                </div>

                <div className="org-stats">
                  <div className="stat-item">
                    <Users size={16} />
                    <span>{org.stats.members} miembros</span>
                  </div>
                  <div className="stat-item">
                    <Package size={16} />
                    <span>{org.stats.products} productos</span>
                  </div>
                  <div className="stat-item">
                    <TrendingUp size={16} />
                    <span>{org.stats.salesLastMonth} ventas/mes</span>
                  </div>
                </div>

                {org.subscription && (
                  <div className="org-subscription-info">
                    <div className="sub-detail">
                      <Calendar size={16} />
                      <span>Inicio: {new Date(org.subscription.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="sub-detail">
                      <DollarSign size={16} />
                      <span>${getPlanPrice(org.subscription.plan_slug).toLocaleString()}/mes</span>
                    </div>
                    <div className={`sub-status ${org.subscription.status}`}>
                      {org.subscription.status === 'active' ? <Check size={14} /> : <X size={14} />}
                      <span>{org.subscription.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                    </div>
                  </div>
                )}

                <div className="org-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditSubscription(org)}
                  >
                    <Edit2 size={16} />
                    {org.subscription ? 'Editar' : 'Crear'} Suscripción
                  </button>

                  {org.subscription && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteSubscription(org)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal de Edición */}
      <AnimatePresence>
        {showModal && selectedOrg && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>
                    {modalMode === 'edit' ? 'Editar' : 'Crear'} Suscripción
                  </h2>
                  <p>{selectedOrg.name}</p>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Plan</label>
                  <div className="plan-selector">
                    {PLANES_DISPONIBLES.map((plan) => {
                      const Icon = plan.icon;
                      return (
                        <button
                          key={plan.slug}
                          className={`plan-option ${formData.plan_slug === plan.slug ? 'selected' : ''}`}
                          onClick={() => {
                            setFormData({ ...formData, plan_slug: plan.slug });
                          }}
                          style={{
                            borderColor: formData.plan_slug === plan.slug ? plan.color : 'transparent'
                          }}
                        >
                          <Icon size={24} style={{ color: plan.color }} />
                          <div>
                            <strong>{plan.name}</strong>
                            <span>${plan.price.toLocaleString()}</span>
                          </div>
                          {formData.plan_slug === plan.slug && (
                            <Check size={20} style={{ color: plan.color }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="past_due">Vencida</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Ciclo de Facturación</label>
                    <select
                      value={formData.billing_cycle}
                      onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    >
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio del Plan</label>
                    <input
                      type="text"
                      value={`$${getPlanPrice(formData.plan_slug).toLocaleString()} / ${formData.billing_cycle === 'monthly' ? 'mes' : 'año'}`}
                      disabled
                      style={{ background: 'rgba(255, 255, 255, 0.03)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  onClick={handleSaveSubscription}
                  disabled={procesando}
                >
                  {procesando ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Guardar Suscripción
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VIPAdminPanel;
