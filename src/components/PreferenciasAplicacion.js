import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Calendar, DollarSign, Save, Receipt, Settings, Store, Check, Plus } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCurrencyInput, getNumericValue } from '../hooks/useCurrencyInput';
import { BUSINESS_TYPES } from '../constants/businessTypes';
import { BUSINESS_FEATURES, getCompatibleFeatures, getDefaultFeatures, checkFeatureDependencies } from '../constants/businessFeatures';
import { useSubscription } from '../hooks/useSubscription';
import { hasBypassAccess } from '../constants/vipUsers';
import toast from 'react-hot-toast';
import './PreferenciasAplicacion.css';

const PreferenciasAplicacion = () => {
  const { user, organization, hasRoleOwner, hasPermission } = useAuth();
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [businessType, setBusinessType] = useState('other');
  const [enabledFeatures, setEnabledFeatures] = useState([]);
  
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
  const jewelryMinLocalInput = useCurrencyInput();
  const jewelryMinIntlInput = useCurrencyInput();
  
  const canEditOrgSettings = hasRoleOwner || 
                             hasPermission('config.edit_billing') || 
                             (user && hasBypassAccess(user, organization));
                             
  const isJewelryBusiness = businessType === 'jewelry_metals';

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
    if (!organization) return;
    
    const currentType = organization.business_type || 'other';
    setBusinessType(currentType);
    
    // Si no hay funciones habilitadas pero hay mesas/pedidos, migrar a nuevo sistema
    if ((organization.mesas_habilitadas || organization.pedidos_habilitados) && !organization.enabled_features) {
      const features = [];
      if (organization.mesas_habilitadas) features.push('mesas');
      if (organization.pedidos_habilitados) features.push('pedidos');
      setEnabledFeatures(features);
    } else {
      setEnabledFeatures(organization.enabled_features || []);
    }
  }, [organization]);

  useEffect(() => {
    if (!organization || !isJewelryBusiness) return;
    const nextPrefs = {
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
    };
    setJewelryPrefs(nextPrefs);
    jewelryMinLocalInput.setValue(nextPrefs.minMarginLocal || '');
    jewelryMinIntlInput.setValue(nextPrefs.minMarginInternational || '');
  }, [organization, isJewelryBusiness, jewelryMinLocalInput, jewelryMinIntlInput]);

  const handleChange = (campo, valor) => {
    setPreferencias(prev => ({ ...prev, [campo]: valor }));
  };

  const handleJewelryChange = (campo, valor) => {
    setJewelryPrefs(prev => ({ ...prev, [campo]: valor }));
  };

  const handleFeatureToggle = (featureId) => {
    if (!canEditOrgSettings) return;
    
    const feature = BUSINESS_FEATURES[featureId];
    if (!feature) return;
    
    // Verificar compatibilidad con tipo de negocio
    if (!feature.compatibleWith.includes(businessType)) {
      toast.error(`Esta función no es compatible con el tipo de negocio seleccionado`);
      return;
    }
    
    // Verificar si requiere premium
    if (feature.requiresPremium) {
      if (featureId === 'mesas' && !hasFeature('mesas')) {
        toast.error(`Esta función requiere el plan Estándar o superior`);
        return;
      }
      if (featureId === 'pedidos' && !hasFeature('pedidos')) {
        toast.error(`Esta función requiere el plan Estándar o superior`);
        return;
      }
    }
    
    const currentFeatures = enabledFeatures || [];
    const isEnabled = currentFeatures.includes(featureId);
    
    if (isEnabled) {
      // Desactivar función
      let newFeatures = currentFeatures.filter(id => id !== featureId);
      
      // Si se desactiva una función requerida, desactivar dependientes
      Object.values(BUSINESS_FEATURES).forEach(f => {
        if (f.requires && f.requires.includes(featureId) && newFeatures.includes(f.id)) {
          newFeatures = newFeatures.filter(id => id !== f.id);
        }
      });
      
      setEnabledFeatures(newFeatures);
    } else {
      // Activar función - verificar dependencias
      const dependencyCheck = checkFeatureDependencies(featureId, currentFeatures);
      if (!dependencyCheck.valid) {
        toast.error(dependencyCheck.message);
        return;
      }
      
      setEnabledFeatures([...currentFeatures, featureId]);
    }
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
      // 1. Guardar preferencias de usuario en metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...preferencias,
          umbralStockBajo: umbralStockBajoSeguro
        }
      });

      if (error) throw error;

      // 2. Guardar tipo de negocio, características e información de joyería en la organización
      if (organization?.id && canEditOrgSettings) {
        const defaultFeaturesForNewType = getDefaultFeatures(businessType);
        const featuresToSave = (enabledFeatures && enabledFeatures.length > 0)
          ? enabledFeatures
          : defaultFeaturesForNewType;

        const updateData = {
          business_type: businessType,
          enabled_features: featuresToSave,
          mesas_habilitadas: featuresToSave.includes('mesas'),
          pedidos_habilitados: featuresToSave.includes('pedidos')
        };

        // Si es joyería, incluir los campos de joyería
        if (isJewelryBusiness) {
          updateData.jewelry_weight_unit = jewelryPrefs.weightUnit;
          updateData.jewelry_min_margin_local = jewelryPrefs.minMarginLocal
            ? getNumericValue(jewelryPrefs.minMarginLocal)
            : null;
          updateData.jewelry_min_margin_international = jewelryPrefs.minMarginInternational
            ? getNumericValue(jewelryPrefs.minMarginInternational)
            : null;
          updateData.jewelry_national_adjust_pct = parseNullableNumber(jewelryPrefs.nationalAdjustPct);
        }

        const { error: orgError } = await supabase
          .from('organizations')
          .update(updateData)
          .eq('id', organization.id);

        if (orgError) throw orgError;
      }

      toast.success('✅ Preferencias guardadas exitosamente');
      
      // Recargar para aplicar los cambios de tipo de negocio a toda la aplicación
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
        {/* Tipo de Negocio */}
        <div className="preferencia-item full-width" style={{ gridColumn: '1 / -1' }}>
          <div className="preferencia-header">
            <Store size={20} />
            <div>
              <h3>Tipo de Negocio</h3>
              <p>Define las funcionalidades principales de tu negocio (mesas, pedidos, toppings)</p>
            </div>
          </div>
          
          <div className="business-type-selector">
            {Object.values(BUSINESS_TYPES).map((type) => {
              const IconComponent = type.Icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`business-type-option ${businessType === type.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (!canEditOrgSettings) {
                      toast.error('No tienes permisos para cambiar el tipo de negocio');
                      return;
                    }
                    setBusinessType(type.id);
                    const defaultFeatures = getDefaultFeatures(type.id);
                    setEnabledFeatures(defaultFeatures);
                  }}
                  disabled={!canEditOrgSettings}
                >
                  <span className="business-type-icon">
                    <IconComponent size={24} />
                  </span>
                  <div className="business-type-info">
                    <span className="business-type-label">{type.label}</span>
                    <span className="business-type-desc">{type.description}</span>
                    {type.features.length > 0 && (
                      <span className="business-type-features">
                        {type.features.join(' • ')}
                      </span>
                    )}
                  </div>
                  {businessType === type.id && (
                    <div className="business-type-check">
                      <Check size={20} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Funciones Personalizables */}
          {getCompatibleFeatures(businessType).length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div className="preferencia-header" style={{ marginBottom: '12px' }}>
                <Settings size={18} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Funciones Personalizables</h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>Activa o desactiva funciones adicionales según las necesidades de tu negocio</p>
                </div>
              </div>
              
              <div className="business-features-grid">
                {getCompatibleFeatures(businessType).map((feature) => {
                  const IconComponent = feature.Icon;
                  const isEnabled = enabledFeatures.includes(feature.id);
                  
                  // Verificar acceso premium
                  let hasPremiumAccess = true;
                  if (feature.requiresPremium) {
                    if (feature.id === 'mesas') {
                      hasPremiumAccess = hasFeature('mesas');
                    } else if (feature.id === 'pedidos') {
                      hasPremiumAccess = hasFeature('pedidos');
                    }
                  }
                  
                  const dependencyCheck = checkFeatureDependencies(feature.id, enabledFeatures);
                  const canToggle = canEditOrgSettings && hasPremiumAccess && dependencyCheck.valid;
                  
                  return (
                    <div
                      key={feature.id}
                      className={`business-feature-card ${isEnabled ? 'enabled' : ''} ${!canToggle ? 'disabled' : ''}`}
                      onClick={() => canToggle && handleFeatureToggle(feature.id)}
                      style={{ cursor: canToggle ? 'pointer' : 'not-allowed' }}
                    >
                      <div className="business-feature-header">
                        <div className="business-feature-icon">
                          <IconComponent size={20} />
                        </div>
                        {feature.id === 'mesas' && isEnabled ? (
                          <button
                            className="business-feature-add-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/dashboard/mesas');
                            }}
                            title="Ir a Gestión de Mesas"
                            type="button"
                          >
                            <Plus size={18} />
                          </button>
                        ) : (
                          <div className="business-feature-checkbox">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => {}}
                              disabled={!canToggle}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </div>
                      <div className="business-feature-content">
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>{feature.label}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', lineHeight: '1.4' }}>{feature.description}</p>
                        {feature.requiresPremium && !hasFeature(feature.id) && (
                          <span className="feature-premium-badge">Requiere Estándar+</span>
                        )}
                        {!dependencyCheck.valid && (
                          <span className="feature-dependency-warning">{dependencyCheck.message}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {!canEditOrgSettings && (
            <small style={{ color: '#E53E3E', display: 'block', marginTop: '12px', fontStyle: 'italic' }}>
              * Solo el propietario o usuarios con permisos de edición de facturación pueden cambiar el tipo de negocio o sus funciones.
            </small>
          )}
        </div>

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
              <label>Margen mínimo nacional</label>
              <input
                type="text"
                value={jewelryMinLocalInput.displayValue}
                onChange={(e) => {
                  const formatted = jewelryMinLocalInput.handleChange(e);
                  handleJewelryChange('minMarginLocal', formatted);
                }}
                className="preferencia-input"
              />
            </div>
            <div className="preferencia-field">
              <label>Margen mínimo internacional</label>
              <input
                type="text"
                value={jewelryMinIntlInput.displayValue}
                onChange={(e) => {
                  const formatted = jewelryMinIntlInput.handleChange(e);
                  handleJewelryChange('minMarginInternational', formatted);
                }}
                className="preferencia-input"
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
