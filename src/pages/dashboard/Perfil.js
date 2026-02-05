import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Settings, Building2, LogOut, Edit3, Save, X, Lock, Sliders, Bell, CreditCard, BarChart3, Crown, Sparkles, Shield, Key, Printer } from 'lucide-react';
import { Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { supabase } from '../../services/api/supabaseClient';
import { useUpdateEmployeeCredentials } from '../../hooks/useTeam';
import EditarCodigoEmpleadoModal from '../../components/EditarCodigoEmpleadoModal';
import PreferenciasAplicacion from '../../components/PreferenciasAplicacion';
import ConfiguracionImpresora from '../../components/ConfiguracionImpresora';
import './Perfil.css';

const Perfil = () => {
  const { user, organization, hasRole, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isVIP, planName, hasFeature } = useSubscription();
  const [activeTab, setActiveTab] = useState('datos');
  const [activeConfigSection, setActiveConfigSection] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [mostrarStockBajo, setMostrarStockBajo] = useState(true);
  const [umbralStockBajo, setUmbralStockBajo] = useState('10');
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    const targetTab = location.state?.activeTab;
    if (targetTab) {
      setActiveTab(targetTab);
      setActiveConfigSection(null);
    }
  }, [location.state?.activeTab]);

  useEffect(() => {
    const metadata = user?.user_metadata || {};
    const mostrar = metadata.mostrarStockBajo !== false;
    const umbral = Number(metadata.umbralStockBajo);
    setMostrarStockBajo(mostrar);
    setUmbralStockBajo(Number.isFinite(umbral) && umbral > 0 ? String(umbral) : '10');
  }, [user]);

  const validatePassword = (password) => {
    if (!password || password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe tener al menos una letra mayúscula.';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe tener al menos una letra minúscula.';
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe tener al menos un número.';
    }
    return '';
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const error = validatePassword(newPassword);
    if (error) {
      toast.error(error);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      toast.success('Contraseña actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error actualizando contraseña:', err);
      toast.error('No se pudo actualizar la contraseña.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast.error('No se encontró el correo del usuario.');
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      toast.success('Te enviamos un correo para restablecer la contraseña.');
    } catch (err) {
      console.error('Error enviando correo:', err);
      toast.error('No se pudo enviar el correo de recuperación.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleSignOutOthers = async () => {
    setSigningOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      toast.success('Sesiones en otros dispositivos cerradas.');
    } catch (err) {
      console.error('Error cerrando otras sesiones:', err);
      toast.error('No se pudieron cerrar otras sesiones.');
    } finally {
      setSigningOutOthers(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    const umbral = Number(umbralStockBajo);
    if (!Number.isFinite(umbral) || umbral <= 0) {
      toast.error('Ingresa un umbral válido mayor a 0.');
      return;
    }
    setSavingNotifications(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          mostrarStockBajo,
          umbralStockBajo: umbral
        }
      });
      if (error) throw error;
      toast.success('Preferencias de notificaciones actualizadas.');
    } catch (err) {
      console.error('Error guardando notificaciones:', err);
      toast.error('No se pudieron guardar las notificaciones.');
    } finally {
      setSavingNotifications(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(user?.user_metadata?.full_name || '');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [editandoNombreNegocio, setEditandoNombreNegocio] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState(organization?.name || '');
  const [guardandoNombreNegocio, setGuardandoNombreNegocio] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const updateEmployeeCredentials = useUpdateEmployeeCredentials();

  const isSuperAdmin = user?.email === 'juanjosegilarbelaez@gmail.com';
  const hasDeveloperAccess = isVIP || isSuperAdmin || user?.user_metadata?.is_developer || userProfile?.role === 'developer';

  // Cargar datos del empleado si es empleado
  React.useEffect(() => {
    const cargarDatosEmpleado = async () => {
      if (!user?.id || !organization?.id) return;

      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', organization.id)
          .eq('is_employee', true)
          .maybeSingle();

        if (!error && data) {
          setEmployeeData(data);
        }
      } catch (error) {
        console.error('Error cargando datos de empleado:', error);
      }
    };

    cargarDatosEmpleado();
  }, [user?.id, organization?.id]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Usar signOut con scope local en lugar de global
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        // Forzar limpieza local si falla el logout en servidor
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar limpieza local en caso de error
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleEditarNombre = () => {
    setEditandoNombre(true);
    setNombreCompleto(user?.user_metadata?.full_name || '');
  };

  const handleCancelarEdicion = () => {
    setEditandoNombre(false);
    setNombreCompleto(user?.user_metadata?.full_name || '');
  };

  const handleGuardarNombre = async () => {
    if (!nombreCompleto.trim()) {
      alert('Por favor ingresa un nombre válido');
      return;
    }

    setGuardandoNombre(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nombreCompleto.trim() }
      });

      if (error) {
        console.error('Error actualizando nombre:', error);
        alert('Error al actualizar el nombre. Intenta de nuevo.');
      } else {
        alert('Nombre actualizado exitosamente');
        setEditandoNombre(false);
        // El usuario se actualizará automáticamente por el listener de auth
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el nombre. Intenta de nuevo.');
    } finally {
      setGuardandoNombre(false);
    }
  };

  const handleEditarNombreNegocio = () => {
    setEditandoNombreNegocio(true);
    setNombreNegocio(organization?.name || '');
  };

  const handleCancelarEdicionNombreNegocio = () => {
    setEditandoNombreNegocio(false);
    setNombreNegocio(organization?.name || '');
  };

  const handleGuardarNombreNegocio = async () => {
    if (!nombreNegocio.trim()) {
      alert('Por favor ingresa un nombre de negocio válido');
      return;
    }

    if (!organization?.id) {
      alert('No se pudo identificar la organización');
      return;
    }

    setGuardandoNombreNegocio(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: nombreNegocio.trim() })
        .eq('id', organization.id);

      if (error) {
        console.error('Error actualizando nombre del negocio:', error);
        alert('Error al actualizar el nombre del negocio. Intenta de nuevo.');
      } else {
        alert('Nombre del negocio actualizado exitosamente');
        setEditandoNombreNegocio(false);
        // Recargar la página para actualizar el contexto
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el nombre del negocio. Intenta de nuevo.');
    } finally {
      setGuardandoNombreNegocio(false);
    }
  };

  const tabs = [
    { id: 'datos', label: 'Datos Personales', icon: User },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="perfil-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="perfil-header" variants={itemVariants}>
        <div className="perfil-user-info">
          <motion.div 
            className="perfil-avatar"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <User className="perfil-avatar-icon" />
          </motion.div>
          <div className="perfil-user-details">
            <motion.h1 
              className="perfil-user-name"
              variants={itemVariants}
            >
              {user?.user_metadata?.full_name || user?.email || 'Usuario'}
            </motion.h1>
            <motion.p 
              className="perfil-user-email"
              variants={itemVariants}
            >
              {user?.email}
            </motion.p>
            <motion.p 
              className="perfil-user-role"
              variants={itemVariants}
            >
              Administrador
            </motion.p>
          </div>
        </div>
        <motion.button 
          className="perfil-logout-btn"
          onClick={handleLogout}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          variants={itemVariants}
        >
          <LogOut className="perfil-logout-icon" />
          {loading ? 'Cerrando...' : 'Cerrar Sesión'}
        </motion.button>
      </motion.div>

      <div className="perfil-content">
        <div className="perfil-sidebar">
          <nav className="perfil-nav">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  className={`perfil-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="perfil-nav-icon" />
                  {tab.label}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <motion.div 
          className="perfil-main"
          variants={itemVariants}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'datos' && (
              <motion.div
                key="datos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
            <div className="perfil-section">
              <h2 className="perfil-section-title">Datos Personales</h2>
              
              {/* Banner de Suscripción de la Organización */}
              {!isVIP && (
                <motion.div 
                  className={`org-subscription-banner ${(planName || 'gratis').toLowerCase()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="banner-icon">
                    {(planName === 'Gratis' || !planName) ? (
                      <Building2 size={24} />
                    ) : (
                      <Crown size={24} />
                    )}
                  </div>
                  <div className="banner-content">
                    <h4>Plan de tu Organización</h4>
                    <p>
                      {(planName === 'Gratis' || !planName)
                        ? 'Tu organización está en el plan gratuito. Actualiza para desbloquear más funciones.'
                        : `Tu organización tiene acceso completo con el plan ${planName}. ¡Disfruta de todas las funciones!`
                      }
                    </p>
                  </div>
                  <button 
                    className="banner-btn"
                    onClick={() => navigate('/dashboard/suscripcion')}
                  >
                    Ver Plan
                  </button>
                </motion.div>
              )}

              {/* Banner VIP */}
              {isVIP && (
                <motion.div 
                  className="org-subscription-banner vip"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="banner-icon vip-icon">
                    <Sparkles size={24} />
                  </div>
                  <div className="banner-content">
                    <h4>🌟 VIP Developer Access</h4>
                    <p>
                      Tienes acceso ilimitado a todas las funciones de la plataforma como desarrollador VIP.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="perfil-datos-grid">
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Nombre del Negocio</label>
                  {editandoNombreNegocio ? (
                    <div className="perfil-edit-form">
                      <input
                        type="text"
                        value={nombreNegocio}
                        onChange={(e) => setNombreNegocio(e.target.value)}
                        className="perfil-edit-input"
                        placeholder="Ingresa el nombre de tu negocio"
                        disabled={guardandoNombreNegocio}
                      />
                      <div className="perfil-edit-actions">
                        <button
                          className="perfil-edit-btn perfil-edit-save"
                          onClick={handleGuardarNombreNegocio}
                          disabled={guardandoNombreNegocio}
                        >
                          <Save size={16} />
                          {guardandoNombreNegocio ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          className="perfil-edit-btn perfil-edit-cancel"
                          onClick={handleCancelarEdicionNombreNegocio}
                          disabled={guardandoNombreNegocio}
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value">
                        {organization?.name || 'No especificado'}
                      </p>
                      <button
                        className="perfil-edit-btn perfil-edit-start"
                        onClick={handleEditarNombreNegocio}
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Nombre Completo</label>
                  {editandoNombre ? (
                    <div className="perfil-edit-form">
                      <input
                        type="text"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                        className="perfil-edit-input"
                        placeholder="Ingresa tu nombre completo"
                        disabled={guardandoNombre}
                      />
                      <div className="perfil-edit-actions">
                        <button
                          className="perfil-edit-btn perfil-edit-save"
                          onClick={handleGuardarNombre}
                          disabled={guardandoNombre}
                        >
                          <Save size={16} />
                          {guardandoNombre ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          className="perfil-edit-btn perfil-edit-cancel"
                          onClick={handleCancelarEdicion}
                          disabled={guardandoNombre}
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value">
                        {user?.user_metadata?.full_name || 'No especificado'}
                      </p>
                      <button
                        className="perfil-edit-btn perfil-edit-start"
                        onClick={handleEditarNombre}
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </div>
                  )}
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Email</label>
                  <p className="perfil-dato-value">{user?.email}</p>
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">ID de Usuario</label>
                  <p className="perfil-dato-value">{user?.id}</p>
                </div>
                <div className="perfil-dato-item">
                  <label className="perfil-dato-label">Fecha de Registro</label>
                  <p className="perfil-dato-value">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-CO') : 'No disponible'}
                  </p>
                </div>
                {employeeData && (
                  <div className="perfil-dato-item">
                    <label className="perfil-dato-label">
                      <Key size={16} style={{ marginRight: '0.5rem' }} />
                      Usuario de Empleado
                    </label>
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value" style={{ fontFamily: 'Courier New, monospace' }}>
                        {employeeData.employee_username || employeeData.employee_code || 'Sin usuario'}
                      </p>
                      <button
                        className="perfil-edit-btn perfil-edit-start"
                        onClick={() => setEditandoCodigo(true)}
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'configuracion' && (
            <motion.div
              key="configuracion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="perfil-section">
              <h2 className="perfil-section-title">Configuración General</h2>
              
              {/* Vista por defecto - Grid de opciones */}
              {!activeConfigSection && (
                <div className="perfil-config-grid">
                  <div className="perfil-config-item">
                    <h3>Modo Oscuro</h3>
                    <p>Cambiar entre tema claro y oscuro</p>
                    <ThemeToggle size="medium" showLabel={true} />
                  </div>
                  
                  {/* Mi Suscripción - Todos los usuarios */}
                  <motion.div 
                    className="perfil-config-item clickable suscripcion-item"
                    onClick={() => navigate('/dashboard/suscripcion')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <CreditCard size={24} />
                      {isVIP && <Sparkles size={16} className="vip-sparkle" />}
                    </div>
                    <h3>
                      Mi Suscripción
                      {isVIP && <Crown size={18} className="vip-crown" />}
                    </h3>
                    <p>
                      {isVIP 
                        ? '✨ VIP Developer - Acceso Ilimitado'
                        : `Plan ${planName} - Gestionar suscripción`
                      }
                    </p>
                  </motion.div>

                  {/* Equipo - Solo owner/admin con feature */}
                  {hasRole('owner', 'admin') && hasFeature('teamManagement') && (
                    <motion.div
                      className="perfil-config-item clickable"
                      onClick={() => navigate('/dashboard/equipo')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="config-icon-wrapper">
                        <Shield size={24} />
                      </div>
                      <h3>Equipo</h3>
                      <p>Gestionar roles y miembros del equipo</p>
                    </motion.div>
                  )}

                  {/* Platform Analytics - Solo VIP o Super Admin */}
                  {hasDeveloperAccess && (
                    <motion.div 
                      className="perfil-config-item clickable analytics-item"
                      onClick={() => navigate('/dashboard/analytics')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="config-icon-wrapper">
                        <BarChart3 size={24} />
                        <Crown size={16} className="admin-crown" />
                      </div>
                      <h3>
                        Platform Analytics
                        <Shield size={18} className="admin-badge" />
                      </h3>
                      <p>📊 Métricas y análisis de la plataforma</p>
                    </motion.div>
                  )}

                  {/* Panel de Administración VIP */}
                  {hasDeveloperAccess && (
                    <motion.div 
                      className="perfil-config-item clickable vip-admin-item"
                      onClick={() => navigate('/vip-admin')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="config-icon-wrapper">
                        <Crown size={24} />
                        <Sparkles size={16} className="vip-sparkle-admin" />
                      </div>
                      <h3>
                        Panel VIP
                        <Crown size={18} className="vip-crown-admin" />
                      </h3>
                      <p>👑 Gestionar suscripciones de organizaciones</p>
                    </motion.div>
                  )}
                  
                  {/* Configuración de Facturación */}
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => navigate('/dashboard/configuracion-facturacion')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Building2 size={24} />
                    </div>
                    <h3>Configuración de Facturación</h3>
                    <p>Configurar datos de facturación y tipo de negocio</p>
                  </motion.div>
                  
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('preferencias')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Sliders size={24} />
                    </div>
                    <h3>Preferencias de la Aplicación</h3>
                    <p>Configuraciones generales del sistema</p>
                  </motion.div>
                  
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('notificaciones')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Bell size={24} />
                    </div>
                    <h3>Notificaciones</h3>
                    <p>Configurar alertas y notificaciones</p>
                  </motion.div>

                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('impresora')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Printer size={24} />
                    </div>
                    <h3>Impresora</h3>
                    <p>Configurar impresora predeterminada</p>
                  </motion.div>
                  
                  <motion.div 
                    className="perfil-config-item clickable"
                    onClick={() => setActiveConfigSection('seguridad')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="config-icon-wrapper">
                      <Lock size={24} />
                    </div>
                    <h3>Seguridad</h3>
                    <p>Cambiar contraseña y configuraciones de seguridad</p>
                  </motion.div>
                </div>
              )}

              {/* Vistas de cada sección */}
              {activeConfigSection === 'preferencias' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <PreferenciasAplicacion />
                </motion.div>
              )}

              {activeConfigSection === 'notificaciones' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div className="notifications-section">
                    <div className="notifications-card">
                      <div className="notifications-card-header">
                        <div className="notifications-card-icon">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h3>Alertas de inventario</h3>
                          <p>Configura cuándo deseas recibir alertas de stock.</p>
                        </div>
                      </div>

                      <form className="notifications-form" onSubmit={handleSaveNotifications}>
                        <label className="notifications-toggle">
                          <input
                            type="checkbox"
                            checked={mostrarStockBajo}
                            onChange={(e) => setMostrarStockBajo(e.target.checked)}
                          />
                          <span>Mostrar alertas de stock bajo y sin stock</span>
                        </label>

                        <div className="notifications-field">
                          <label>Umbral de stock bajo</label>
                          <input
                            type="number"
                            min="1"
                            className="perfil-edit-input"
                            value={umbralStockBajo}
                            onChange={(e) => setUmbralStockBajo(e.target.value)}
                          />
                          <small>Se considera stock bajo cuando el inventario es menor o igual a este valor.</small>
                        </div>

                        <div className="notifications-actions">
                          <button
                            type="submit"
                            className="security-btn security-btn-primary"
                            disabled={savingNotifications}
                          >
                            {savingNotifications ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeConfigSection === 'impresora' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <ConfiguracionImpresora />
                </motion.div>
              )}

              {activeConfigSection === 'seguridad' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="config-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div className="security-section">
                    <div className="security-card">
                      <div className="security-card-header">
                        <div className="security-card-icon">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h3>Cambiar contraseña</h3>
                          <p>Protege tu cuenta con una contraseña segura.</p>
                        </div>
                      </div>

                      <form className="security-form" onSubmit={handleUpdatePassword}>
                        <div className="security-field">
                          <label>Nueva contraseña</label>
                          <div className="security-input-row">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              className="perfil-edit-input"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Mínimo 8 caracteres"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="security-toggle"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="security-field">
                          <label>Confirmar contraseña</label>
                          <div className="security-input-row">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              className="perfil-edit-input"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Repite la contraseña"
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="security-toggle"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="security-hint">
                          Debe incluir mayúsculas, minúsculas y números.
                        </div>

                        <div className="security-actions">
                          <button
                            type="submit"
                            className="security-btn security-btn-primary"
                            disabled={updatingPassword}
                          >
                            {updatingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="security-card">
                      <div className="security-card-header">
                        <div className="security-card-icon">
                          <Mail size={20} />
                        </div>
                        <div>
                          <h3>Recuperación de cuenta</h3>
                          <p>Envía un enlace de restablecimiento al correo.</p>
                        </div>
                      </div>
                      <div className="security-meta">
                        <span className="security-meta-label">Correo</span>
                        <span className="security-meta-value">{user?.email || 'No disponible'}</span>
                      </div>
                      <div className="security-actions">
                        <button
                          type="button"
                          className="security-btn security-btn-secondary"
                          onClick={handleSendResetEmail}
                          disabled={sendingReset}
                        >
                          {sendingReset ? 'Enviando...' : 'Enviar enlace de recuperación'}
                        </button>
                      </div>
                    </div>

                    <div className="security-card">
                      <div className="security-card-header">
                        <div className="security-card-icon">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3>Sesiones activas</h3>
                          <p>Cierra sesiones abiertas en otros dispositivos.</p>
                        </div>
                      </div>
                      <div className="security-actions">
                        <button
                          type="button"
                          className="security-btn security-btn-ghost"
                          onClick={handleSignOutOthers}
                          disabled={signingOutOthers}
                        >
                          {signingOutOthers ? 'Cerrando...' : 'Cerrar otras sesiones'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>

      {editandoCodigo && employeeData && (
        <EditarCodigoEmpleadoModal
          open={editandoCodigo}
          onClose={() => setEditandoCodigo(false)}
          onGuardar={async ({ username, accessCode, password }) => {
            await updateEmployeeCredentials.mutateAsync({
              memberId: employeeData.id,
              username,
              accessCode,
              password,
              organizationId: organization?.id
            });
            setEmployeeData({
              ...employeeData,
              employee_username: username,
              employee_code: accessCode
            });
            setEditandoCodigo(false);
          }}
          usuarioActual={employeeData.employee_username || employeeData.employee_code}
          codigoActual={employeeData.employee_code}
          nombreEmpleado={employeeData.employee_name || user?.user_metadata?.full_name}
          cargando={updateEmployeeCredentials.isLoading}
        />
      )}
    </motion.div>
  );
};

export default Perfil;
