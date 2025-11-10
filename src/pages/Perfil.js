import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Settings, Building2, LogOut, Edit3, Save, X, Lock, Sliders, Bell } from 'lucide-react';
import ConfiguracionFacturacion from '../components/ConfiguracionFacturacion';
import ThemeToggle from '../components/ThemeToggle';
import CambiarContrasena from '../components/CambiarContrasena';
import PreferenciasAplicacion from '../components/PreferenciasAplicacion';
import ConfiguracionNotificaciones from '../components/ConfiguracionNotificaciones';
import { supabase } from '../supabaseClient';
import './Perfil.css';

const Perfil = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('datos');
  const [activeConfigSection, setActiveConfigSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(user?.user_metadata?.full_name || '');
  const [guardandoNombre, setGuardandoNombre] = useState(false);

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
    { id: 'facturacion', label: 'Configuración de Facturación', icon: Building2 },
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
              </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'facturacion' && (
            <motion.div
              key="facturacion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="perfil-section">
                <h2 className="perfil-section-title">Configuración de Facturación</h2>
                <p className="perfil-section-description">
                  Configure los datos de su empresa para generar recibos profesionales.
                </p>
                <ConfiguracionFacturacion />
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
                    className="perfil-back-btn"
                    onClick={() => setActiveConfigSection(null)}
                  >
                    ← Volver a Configuración
                  </button>
                  <ConfiguracionNotificaciones />
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
                  <CambiarContrasena />
                </motion.div>
              )}
              
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Perfil;
