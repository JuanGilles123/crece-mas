import React, { useState, useEffect } from 'react';
import { Bell, Package, DollarSign, AlertTriangle, TrendingUp, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ConfiguracionNotificaciones.css';

const ConfiguracionNotificaciones = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [notificaciones, setNotificaciones] = useState({
    stockBajo: true,
    proximoVencer: true,
    ventasGrandes: false,
    cierreCaja: true,
    umbralVentaGrande: 100000
  });

  useEffect(() => {
    cargarNotificaciones();
  }, [user]);

  const cargarNotificaciones = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userMetadata = user.user_metadata || {};
      
      setNotificaciones({
        stockBajo: userMetadata.notif_stockBajo !== false,
        proximoVencer: userMetadata.notif_proximoVencer !== false,
        ventasGrandes: userMetadata.notif_ventasGrandes === true,
        cierreCaja: userMetadata.notif_cierreCaja !== false,
        umbralVentaGrande: userMetadata.umbralVentaGrande || 100000
      });
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (campo) => {
    setNotificaciones(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const handleChange = (campo, valor) => {
    setNotificaciones(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          notif_stockBajo: notificaciones.stockBajo,
          notif_proximoVencer: notificaciones.proximoVencer,
          notif_ventasGrandes: notificaciones.ventasGrandes,
          notif_cierreCaja: notificaciones.cierreCaja,
          umbralVentaGrande: notificaciones.umbralVentaGrande
        }
      });

      if (error) throw error;

      toast.success('✅ Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className="loading-notificaciones">Cargando configuración...</div>;
  }

  return (
    <div className="configuracion-notificaciones">
      <div className="notif-info-box">
        <Bell size={20} />
        <p>Personaliza qué notificaciones quieres recibir para mantenerte informado sobre tu negocio.</p>
      </div>

      <div className="notificaciones-grid">
        {/* Stock Bajo */}
        <div className="notif-item">
          <div className="notif-header">
            <div className="notif-icon stock">
              <Package size={24} />
            </div>
            <div className="notif-content">
              <h3>Stock Bajo</h3>
              <p>Recibe alertas cuando un producto tenga stock bajo</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificaciones.stockBajo}
                onChange={() => handleToggle('stockBajo')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Próximo a Vencer */}
        <div className="notif-item">
          <div className="notif-header">
            <div className="notif-icon warning">
              <AlertTriangle size={24} />
            </div>
            <div className="notif-content">
              <h3>Productos por Vencer</h3>
              <p>Alertas sobre productos próximos a vencer</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificaciones.proximoVencer}
                onChange={() => handleToggle('proximoVencer')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Ventas Grandes */}
        <div className="notif-item">
          <div className="notif-header">
            <div className="notif-icon success">
              <TrendingUp size={24} />
            </div>
            <div className="notif-content">
              <h3>Ventas Importantes</h3>
              <p>Notificaciones de ventas por encima del umbral</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificaciones.ventasGrandes}
                onChange={() => handleToggle('ventasGrandes')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          {notificaciones.ventasGrandes && (
            <div className="notif-extra">
              <label htmlFor="umbral">Umbral de venta (monto mínimo):</label>
              <div className="input-with-icon">
                <DollarSign size={18} />
                <input
                  type="number"
                  id="umbral"
                  min="1000"
                  step="1000"
                  value={notificaciones.umbralVentaGrande}
                  onChange={(e) => handleChange('umbralVentaGrande', parseInt(e.target.value) || 100000)}
                  className="notif-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cierre de Caja */}
        <div className="notif-item">
          <div className="notif-header">
            <div className="notif-icon primary">
              <DollarSign size={24} />
            </div>
            <div className="notif-content">
              <h3>Cierre de Caja</h3>
              <p>Recordatorios para cerrar caja al final del día</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificaciones.cierreCaja}
                onChange={() => handleToggle('cierreCaja')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="guardar-btn"
      >
        <Save size={20} />
        {guardando ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </div>
  );
};

export default ConfiguracionNotificaciones;
