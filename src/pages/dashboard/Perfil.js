import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Building2, LogOut, Edit3, Save, X, Lock, Sliders, Bell, CreditCard, BarChart3, Crown, Sparkles, Shield, Key } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { supabase } from '../../services/api/supabaseClient';
import { useUpdateEmployeeCode } from '../../hooks/useTeam';
import EditarCodigoEmpleadoModal from '../../components/EditarCodigoEmpleadoModal';
import './Perfil.css';

const Perfil = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const { isVIP, planName } = useSubscription();
  const [activeTab, setActiveTab] = useState('datos');
  const [activeConfigSection, setActiveConfigSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(user?.user_metadata?.full_name || '');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [editandoCodigo, setEditandoCodigo] = useState(false);
  const updateEmployeeCode = useUpdateEmployeeCode();

  const isSuperAdmin = user?.email === 'juanjosegilarbelaez@gmail.com';

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
          .single();

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
                      Código de Empleado
                    </label>
                    <div className="perfil-dato-display">
                      <p className="perfil-dato-value" style={{ fontFamily: 'Courier New, monospace' }}>
                        {employeeData.employee_code || 'Sin código'}
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

                  {/* Platform Analytics - Solo VIP o Super Admin */}
                  {(isVIP || isSuperAdmin) && (
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
                  {(isVIP || isSuperAdmin) && (
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
                    className="perfil-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Sección en desarrollo</p>
                  </div>
                  {/* <PreferenciasAplicacion /> */}
                </motion.div>
              )}

              {activeConfigSection === 'notificaciones' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="perfil-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Sección en desarrollo</p>
                  </div>
                  {/* <ConfiguracionNotificaciones /> */}
                </motion.div>
              )}

              {activeConfigSection === 'seguridad' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button 
                    className="perfil-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Sección en desarrollo</p>
                  </div>
                  {/* <CambiarContrasena /> */}
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
          onGuardar={async (nuevoCodigo) => {
            await updateEmployeeCode.mutateAsync({
              memberId: employeeData.id,
              newCode: nuevoCodigo,
              organizationId: organization?.id
            });
            setEmployeeData({ ...employeeData, employee_code: nuevoCodigo });
            setEditandoCodigo(false);
          }}
          codigoActual={employeeData.employee_code}
          nombreEmpleado={employeeData.employee_name || user?.user_metadata?.full_name}
          cargando={updateEmployeeCode.isLoading}
        />
      )}
    </motion.div>
  );
};

export default Perfil;
