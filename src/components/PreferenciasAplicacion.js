import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Calendar, DollarSign, Save, Receipt, Settings } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './PreferenciasAplicacion.css';

const PreferenciasAplicacion = () => {
  const { user, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [preferencias, setPreferencias] = useState({
    moneda: 'COP',
    formatoFecha: 'DD/MM/YYYY',
    idioma: 'es',
    mostrarStockBajo: true,
    umbralStockBajo: 10,
    mostrarFacturaPantalla: false
  });
  const [jewelryPrefs, setJewelryPrefs] = useState({
    weightUnit: 'g',
    minMarginLocal: '',
    minMarginInternational: '',
    nationalAdjustPct: ''
  });
  const isJewelryBusiness = organization?.business_type === 'jewelry_metals';

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
        umbralStockBajo: userMetadata.umbralStockBajo ?? 10,
        mostrarFacturaPantalla: userMetadata.mostrarFacturaPantalla === true
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

  useEffect(() => {
    if (!organization || !isJewelryBusiness) return;
    setJewelryPrefs({
      weightUnit: organization.jewelry_weight_unit || 'g',
      minMarginLocal: organization.jewelry_min_margin_local !== null && organization.jewelry_min_margin_local !== undefined
        ? String(organization.jewelry_min_margin_local)
        : '',
      minMarginInternational: organization.jewelry_min_margin_international !== null && organization.jewelry_min_margin_international !== undefined
        ? String(organization.jewelry_min_margin_international)
        : '',
      nationalAdjustPct: organization.jewelry_national_adjust_pct !== null && organization.jewelry_national_adjust_pct !== undefined
        ? String(organization.jewelry_national_adjust_pct)
        : ''
    });
  }, [organization, isJewelryBusiness]);

  const handleChange = (campo, valor) => {
    setPreferencias(prev => ({ ...prev, [campo]: valor }));
  };

  const handleJewelryChange = (campo, valor) => {
    setJewelryPrefs(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    const umbralStockBajoSeguro = Number.isFinite(Number(preferencias.umbralStockBajo))
      && Number(preferencias.umbralStockBajo) > 0
      ? Number(preferencias.umbralStockBajo)
      : 10;
    const parseNullableNumber = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...preferencias,
          umbralStockBajo: umbralStockBajoSeguro
        }
      });

      if (error) throw error;

      if (isJewelryBusiness && organization?.id) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({
            jewelry_weight_unit: jewelryPrefs.weightUnit,
            jewelry_min_margin_local: parseNullableNumber(jewelryPrefs.minMarginLocal),
            jewelry_min_margin_international: parseNullableNumber(jewelryPrefs.minMarginInternational),
            jewelry_national_adjust_pct: parseNullableNumber(jewelryPrefs.nationalAdjustPct)
          })
          .eq('id', organization.id);

        if (orgError) throw orgError;
      }

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
              value={preferencias.umbralStockBajo ?? ''}
              onChange={(e) => {
                const { value } = e.target;
                if (value === '') {
                  handleChange('umbralStockBajo', '');
                  return;
                }
                handleChange('umbralStockBajo', parseInt(value, 10));
              }}
              className="preferencia-input"
            />
          </div>
        )}

        {/* Mostrar Factura en Pantalla */}
        <div className="preferencia-item">
          <div className="preferencia-header">
            <Receipt size={20} />
            <div>
              <h3>Mostrar Factura en Pantalla</h3>
              <p>Mostrar automáticamente la factura después de cada venta</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferencias.mostrarFacturaPantalla}
              onChange={(e) => handleChange('mostrarFacturaPantalla', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {isJewelryBusiness && (
          <div className="preferencia-item">
            <div className="preferencia-header">
              <Settings size={20} />
              <div>
                <h3>Joyería y Metales</h3>
                <p>Parámetros de precio por peso y cotización</p>
              </div>
            </div>
            <div className="preferencia-field">
              <label>Unidad de peso por defecto</label>
              <select
                value={jewelryPrefs.weightUnit}
                onChange={(e) => handleJewelryChange('weightUnit', e.target.value)}
                className="preferencia-select"
              >
                <option value="g">Gramos (g)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="oz">Onzas (oz)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </div>
            <div className="preferencia-field">
              <label>Margen mínimo nacional (%)</label>
              <input
                type="number"
                value={jewelryPrefs.minMarginLocal}
                onChange={(e) => handleJewelryChange('minMarginLocal', e.target.value)}
                className="preferencia-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="preferencia-field">
              <label>Margen mínimo internacional (%)</label>
              <input
                type="number"
                value={jewelryPrefs.minMarginInternational}
                onChange={(e) => handleJewelryChange('minMarginInternational', e.target.value)}
                className="preferencia-input"
                min="0"
                step="0.01"
              />
            </div>
            <div className="preferencia-field">
              <label>Ajuste nacional (%)</label>
              <input
                type="number"
                value={jewelryPrefs.nationalAdjustPct}
                onChange={(e) => handleJewelryChange('nationalAdjustPct', e.target.value)}
                className="preferencia-input"
                min="0"
                step="0.01"
              />
            </div>
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
