import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Calendar, DollarSign, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './PreferenciasAplicacion.css';

const PreferenciasAplicacion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [preferencias, setPreferencias] = useState({
    moneda: 'COP',
    formatoFecha: 'DD/MM/YYYY',
    idioma: 'es',
    mostrarStockBajo: true,
    umbralStockBajo: 10
  });

  const cargarPreferencias = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Obtener preferencias del metadata del usuario
      const userMetadata = user.user_metadata || {};
      
      setPreferencias({
        moneda: userMetadata.moneda || 'COP',
        formatoFecha: userMetadata.formatoFecha || 'DD/MM/YYYY',
        idioma: userMetadata.idioma || 'es',
        mostrarStockBajo: userMetadata.mostrarStockBajo !== false,
        umbralStockBajo: userMetadata.umbralStockBajo || 10
      });
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarPreferencias();
  }, [cargarPreferencias]);

  const handleChange = (campo, valor) => {
    setPreferencias(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...preferencias
        }
      });

      if (error) throw error;

      toast.success('✅ Preferencias guardadas exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar las preferencias');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className="loading-preferencias">Cargando preferencias...</div>;
  }

  return (
    <div className="preferencias-aplicacion">
      <div className="preferencias-grid">
        {/* Moneda */}
        <div className="preferencia-item">
          <div className="preferencia-header">
            <DollarSign size={20} />
            <div>
              <h3>Moneda</h3>
              <p>Selecciona la moneda predeterminada</p>
            </div>
          </div>
          <select
            value={preferencias.moneda}
            onChange={(e) => handleChange('moneda', e.target.value)}
            className="preferencia-select"
          >
            <option value="COP">Peso Colombiano (COP)</option>
            <option value="USD">Dólar Estadounidense (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="ARS">Peso Argentino (ARS)</option>
          </select>
        </div>

        {/* Formato de Fecha */}
        <div className="preferencia-item">
          <div className="preferencia-header">
            <Calendar size={20} />
            <div>
              <h3>Formato de Fecha</h3>
              <p>Define cómo se muestran las fechas</p>
            </div>
          </div>
          <select
            value={preferencias.formatoFecha}
            onChange={(e) => handleChange('formatoFecha', e.target.value)}
            className="preferencia-select"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
          </select>
        </div>

        {/* Idioma */}
        <div className="preferencia-item">
          <div className="preferencia-header">
            <Globe size={20} />
            <div>
              <h3>Idioma</h3>
              <p>Idioma de la interfaz</p>
            </div>
          </div>
          <select
            value={preferencias.idioma}
            onChange={(e) => handleChange('idioma', e.target.value)}
            className="preferencia-select"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Alertas de Stock Bajo */}
        <div className="preferencia-item">
          <div className="preferencia-header">
            <div>
              <h3>Alertas de Stock Bajo</h3>
              <p>Recibe notificaciones cuando el stock sea bajo</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferencias.mostrarStockBajo}
              onChange={(e) => handleChange('mostrarStockBajo', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Umbral Stock Bajo */}
        {preferencias.mostrarStockBajo && (
          <div className="preferencia-item">
            <div className="preferencia-header">
              <div>
                <h3>Umbral de Stock Bajo</h3>
                <p>Cantidad mínima para considerar stock bajo</p>
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="100"
              value={preferencias.umbralStockBajo}
              onChange={(e) => handleChange('umbralStockBajo', parseInt(e.target.value) || 10)}
              className="preferencia-input"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="guardar-btn"
      >
        <Save size={20} />
        {guardando ? 'Guardando...' : 'Guardar Preferencias'}
      </button>
    </div>
  );
};

export default PreferenciasAplicacion;
