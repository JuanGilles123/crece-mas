import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Settings, Building2, LogOut, Edit3, Save, X } from 'lucide-react';
import ConfiguracionFacturacion from '../components/ConfiguracionFacturacion';
import { supabase } from '../supabaseClient';
import './Perfil.css';

const Perfil = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('datos');
  const [loading, setLoading] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState(user?.user_metadata?.full_name || '');
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-user-info">
          <div className="perfil-avatar">
            <User className="perfil-avatar-icon" />
          </div>
          <div className="perfil-user-details">
            <h1 className="perfil-user-name">
              {user?.user_metadata?.full_name || user?.email || 'Usuario'}
            </h1>
            <p className="perfil-user-email">{user?.email}</p>
            <p className="perfil-user-role">Administrador</p>
          </div>
        </div>
        <button 
          className="perfil-logout-btn"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="perfil-logout-icon" />
          {loading ? 'Cerrando...' : 'Cerrar Sesión'}
        </button>
      </div>

      <div className="perfil-content">
        <div className="perfil-sidebar">
          <nav className="perfil-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`perfil-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="perfil-nav-icon" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="perfil-main">
          {activeTab === 'datos' && (
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
          )}

          {activeTab === 'facturacion' && (
            <div className="perfil-section">
              <h2 className="perfil-section-title">Configuración de Facturación</h2>
              <p className="perfil-section-description">
                Configure los datos de su empresa para generar recibos profesionales.
              </p>
              <ConfiguracionFacturacion />
            </div>
          )}

          {activeTab === 'configuracion' && (
            <div className="perfil-section">
              <h2 className="perfil-section-title">Configuración General</h2>
              <div className="perfil-config-grid">
                <div className="perfil-config-item">
                  <h3>Preferencias de la Aplicación</h3>
                  <p>Configuraciones generales del sistema</p>
                  <button className="perfil-config-btn" disabled>
                    Próximamente
                  </button>
                </div>
                <div className="perfil-config-item">
                  <h3>Notificaciones</h3>
                  <p>Configurar alertas y notificaciones</p>
                  <button className="perfil-config-btn" disabled>
                    Próximamente
                  </button>
                </div>
                <div className="perfil-config-item">
                  <h3>Seguridad</h3>
                  <p>Cambiar contraseña y configuraciones de seguridad</p>
                  <button className="perfil-config-btn" disabled>
                    Próximamente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
