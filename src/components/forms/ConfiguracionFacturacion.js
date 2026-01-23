import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import UpgradePrompt from '../UpgradePrompt';
import { Save, Building2, MapPin, Phone, Hash, Mail, AlertCircle, FileText, CreditCard, ShieldAlert, Store, Check, Settings, Plus } from 'lucide-react';
import { BUSINESS_TYPES } from '../../constants/businessTypes';
import { BUSINESS_FEATURES, getCompatibleFeatures, getDefaultFeatures, checkFeatureDependencies } from '../../constants/businessFeatures';
import toast from 'react-hot-toast';
import './ConfiguracionFacturacion.css';

export default function ConfiguracionFacturacion() {
  const navigate = useNavigate();
  const { organization, hasRoleOwner } = useAuth();
  const { hasFeature, planSlug, loading: subscriptionLoading } = useSubscription();
  const [datosEmpresa, setDatosEmpresa] = useState({
    razon_social: '',
    nit: '',
    direccion: '',
    telefono: '',
    email: '',
    ciudad: '',
    regimen_tributario: 'simplificado',
    responsable_iva: false,
    mensaje_factura: 'Gracias por su compra',
    business_type: 'other',
    mesas_habilitadas: false,
    pedidos_habilitados: false,
    enabled_features: [] // Array de funciones habilitadas
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Verificar si tiene acceso a configuración de facturas
  const tieneAccesoConfiguracion = hasFeature('invoiceCustomization');

  const cargarDatosEmpresa = useCallback(async () => {
    if (!organization) return;

    setCargando(true);
    try {
      setDatosEmpresa({
        razon_social: organization.razon_social || '',
        nit: organization.nit || '',
        direccion: organization.direccion || '',
        telefono: organization.telefono || '',
        email: organization.email || '',
        ciudad: organization.ciudad || '',
        regimen_tributario: organization.regimen_tributario || 'simplificado',
        responsable_iva: organization.responsable_iva || false,
        mensaje_factura: organization.mensaje_factura || 'Gracias por su compra',
        business_type: organization.business_type || 'other',
        mesas_habilitadas: organization.mesas_habilitadas || false,
        pedidos_habilitados: organization.pedidos_habilitados || false,
        enabled_features: organization.enabled_features || []
      });
      
      // Si no hay funciones habilitadas pero hay mesas/pedidos, migrar a nuevo sistema
      if ((organization.mesas_habilitadas || organization.pedidos_habilitados) && !organization.enabled_features) {
        const features = [];
        if (organization.mesas_habilitadas) features.push('mesas');
        if (organization.pedidos_habilitadas) features.push('pedidos');
        setDatosEmpresa(prev => ({ ...prev, enabled_features: features }));
      }
      
      // Si cambia el tipo de negocio, sugerir funciones por defecto
      if (organization.business_type) {
        const defaultFeatures = getDefaultFeatures(organization.business_type);
        const currentFeatures = organization.enabled_features || [];
        // Agregar funciones por defecto si no están ya habilitadas y no hay funciones configuradas
        if (currentFeatures.length === 0 && defaultFeatures.length > 0) {
          setDatosEmpresa(prev => ({ ...prev, enabled_features: defaultFeatures }));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  }, [organization]);

  useEffect(() => {
    cargarDatosEmpresa();
  }, [cargarDatosEmpresa]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si cambia el tipo de negocio, actualizar funciones compatibles
    if (name === 'business_type') {
      const defaultFeatures = getDefaultFeatures(value);
      setDatosEmpresa(prev => ({
        ...prev,
        [name]: value,
        enabled_features: prev.enabled_features.length === 0 ? defaultFeatures : prev.enabled_features
      }));
      return;
    }
    
    setDatosEmpresa(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Manejar toggle de funciones
  const handleFeatureToggle = (featureId) => {
    if (!hasRoleOwner) return;
    
    const feature = BUSINESS_FEATURES[featureId];
    if (!feature) return;
    
    // Verificar compatibilidad con tipo de negocio
    if (!feature.compatibleWith.includes(datosEmpresa.business_type)) {
      toast.error(`Esta función no es compatible con el tipo de negocio seleccionado`);
      return;
    }
    
    // Verificar si requiere premium
    if (feature.requiresPremium) {
      // Para mesas y pedidos, verificar features específicas
      if (featureId === 'mesas' && !hasFeature('mesas')) {
        toast.error(`Esta función requiere una suscripción premium`);
        return;
      }
      if (featureId === 'pedidos' && !hasFeature('pedidos')) {
        toast.error(`Esta función requiere una suscripción premium`);
        return;
      }
      // Para otras funciones premium, verificar según el plan (si aplica)
      // Por ahora, solo mesas y pedidos requieren premium explícito
    }
    
    const currentFeatures = datosEmpresa.enabled_features || [];
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
      
      setDatosEmpresa(prev => ({
        ...prev,
        enabled_features: newFeatures
      }));
    } else {
      // Activar función - verificar dependencias
      const dependencyCheck = checkFeatureDependencies(featureId, currentFeatures);
      if (!dependencyCheck.valid) {
        toast.error(dependencyCheck.message);
        return;
      }
      
      setDatosEmpresa(prev => ({
        ...prev,
        enabled_features: [...currentFeatures, featureId]
      }));
    }
  };
  
  // Obtener funciones compatibles con el tipo de negocio actual
  const compatibleFeatures = getCompatibleFeatures(datosEmpresa.business_type);

  const guardarDatos = async () => {
    if (!organization || !hasRoleOwner) {
      toast.error('Solo el propietario puede actualizar la información');
      return;
    }

    if (!datosEmpresa.razon_social || !datosEmpresa.email) {
      toast.error('Complete los campos requeridos');
      return;
    }

    setGuardando(true);
    try {
      // Sincronizar enabled_features con mesas_habilitadas y pedidos_habilitados para compatibilidad
      const updateData = { ...datosEmpresa };
      const enabledFeatures = updateData.enabled_features || [];
      
      // Mantener compatibilidad con sistema antiguo
      updateData.mesas_habilitadas = enabledFeatures.includes('mesas');
      updateData.pedidos_habilitados = enabledFeatures.includes('pedidos');
      
      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (error) throw error;
      toast.success('Información actualizada correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="config-facturacion">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="config-facturacion">
        <div className="error-state">
          <AlertCircle size={48} />
          <p>No se pudo cargar la organización</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, mostrar prompt de upgrade
  if (!subscriptionLoading && !tieneAccesoConfiguracion) {
    return (
      <div className="config-facturacion">
        <UpgradePrompt
          feature="Configuración de Facturación"
          reason="La personalización de facturas está disponible en el plan Profesional. Actualiza para configurar tu información tributaria, logotipo y mensajes personalizados."
          currentPlan={planSlug}
          recommendedPlan="professional"
          inline={true}
        />
      </div>
    );
  }

  return (
    <div className="config-facturacion">
      <div className="config-header">
        <div className="header-content">
          <div className="header-icon">
            <Building2 size={40} />
          </div>
          <div className="header-text">
            <h1>Configuración de Facturación</h1>
            <p className="subtitle">{organization.name}</p>
          </div>
        </div>
        {hasRoleOwner && (
          <button
            className="btn-guardar-principal"
            onClick={guardarDatos}
            disabled={guardando}
          >
            <Save size={20} />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      {!hasRoleOwner && (
        <div className="alert-warning">
          <div className="alert-icon">
            <ShieldAlert size={24} />
          </div>
          <div className="alert-content">
            <h3>Permisos Restringidos</h3>
            <p>Solo el propietario del negocio puede modificar la información de facturación. Si necesitas hacer cambios, contacta al propietario.</p>
          </div>
        </div>
      )}

      <div className="config-grid">
        {/* Información Legal */}
        <div className="config-card">
          <div className="card-header">
            <FileText size={24} />
            <h2>Información Legal</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="razon_social">
                Razón Social <span className="required">*</span>
              </label>
              <input
                id="razon_social"
                type="text"
                name="razon_social"
                value={datosEmpresa.razon_social}
                onChange={handleInputChange}
                placeholder="Nombre legal de la empresa"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nit">
                <Hash size={16} /> NIT / RUC
              </label>
              <input
                id="nit"
                type="text"
                name="nit"
                value={datosEmpresa.nit}
                onChange={handleInputChange}
                placeholder="Número de identificación tributaria"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="regimen_tributario">
                <CreditCard size={16} /> Régimen Tributario
              </label>
              <select
                id="regimen_tributario"
                name="regimen_tributario"
                value={datosEmpresa.regimen_tributario}
                onChange={handleInputChange}
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              >
                <option value="simplificado">Régimen Simplificado</option>
                <option value="comun">Régimen Común</option>
                <option value="especial">Régimen Especial</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="responsable_iva"
                  checked={datosEmpresa.responsable_iva}
                  onChange={handleInputChange}
                  disabled={!hasRoleOwner}
                />
                <span className="checkbox-text">
                  <strong>Responsable de IVA</strong>
                  <small>Marca esta opción si tu negocio cobra IVA</small>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="config-card">
          <div className="card-header">
            <MapPin size={24} />
            <h2>Información de Contacto</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="direccion">
                <MapPin size={16} /> Dirección
              </label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={datosEmpresa.direccion}
                onChange={handleInputChange}
                placeholder="Dirección completa del negocio"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ciudad">
                <Building2 size={16} /> Ciudad
              </label>
              <input
                id="ciudad"
                type="text"
                name="ciudad"
                value={datosEmpresa.ciudad}
                onChange={handleInputChange}
                placeholder="Ciudad donde opera el negocio"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_type">
                <Store size={16} /> Tipo de Negocio
              </label>
              <div className="business-type-selector">
                {Object.values(BUSINESS_TYPES).map((type) => {
                  const IconComponent = type.Icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      className={`business-type-option ${datosEmpresa.business_type === type.id ? 'selected' : ''}`}
                      onClick={() => hasRoleOwner && handleInputChange({ target: { name: 'business_type', value: type.id } })}
                      disabled={!hasRoleOwner}
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
                      {datosEmpresa.business_type === type.id && (
                        <div className="business-type-check">
                          <Check size={20} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <input
                type="hidden"
                name="business_type"
                value={datosEmpresa.business_type}
              />
              <small className="field-hint">
                <strong>Nota:</strong> El tipo de negocio define las funcionalidades principales disponibles (ej: toppings para comida, mesas y pedidos). 
                Sin embargo, puedes crear productos de cualquier tipo independientemente del tipo de negocio seleccionado.
              </small>
            </div>

            {/* Funciones Personalizables */}
            {compatibleFeatures.length > 0 && (
              <div className="form-group">
                <label>
                  <Settings size={16} /> Funciones Personalizables
                </label>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Activa o desactiva funciones adicionales según las necesidades de tu negocio
                </p>
                <div className="business-features-grid">
                  {compatibleFeatures.map((feature) => {
                    const IconComponent = feature.Icon;
                    const isEnabled = (datosEmpresa.enabled_features || []).includes(feature.id);
                    // Verificar acceso premium
                    let hasPremiumAccess = true;
                    if (feature.requiresPremium) {
                      if (feature.id === 'mesas') {
                        hasPremiumAccess = hasFeature('mesas');
                      } else if (feature.id === 'pedidos') {
                        hasPremiumAccess = hasFeature('pedidos');
                      } else {
                        hasPremiumAccess = true; // Otras funciones no requieren premium por ahora
                      }
                    }
                    const dependencyCheck = checkFeatureDependencies(feature.id, datosEmpresa.enabled_features || []);
                    const canToggle = hasRoleOwner && hasPremiumAccess && dependencyCheck.valid;
                    
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
                          <h4>{feature.label}</h4>
                          <p>{feature.description}</p>
                          {feature.requiresPremium && !hasFeature(feature.id) && (
                            <span className="feature-premium-badge">Requiere Premium</span>
                          )}
                          {!dependencyCheck.valid && (
                            <span className="feature-dependency-warning">{dependencyCheck.message}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <small className="field-hint">
                  Las funciones marcadas con "Requiere Premium" necesitan una suscripción profesional o superior
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="telefono">
                <Phone size={16} /> Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                value={datosEmpresa.telefono}
                onChange={handleInputChange}
                placeholder="Número de contacto"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} /> Email <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={datosEmpresa.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
            </div>
          </div>
        </div>

        {/* Personalización de Facturas */}
        <div className="config-card full-width">
          <div className="card-header">
            <FileText size={24} />
            <h2>Personalización de Facturas</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="mensaje_factura">
                Mensaje en Facturas
              </label>
              <textarea
                id="mensaje_factura"
                name="mensaje_factura"
                value={datosEmpresa.mensaje_factura}
                onChange={handleInputChange}
                placeholder="Mensaje que aparecerá al final de cada factura"
                rows="4"
                disabled={!hasRoleOwner}
                className={!hasRoleOwner ? 'disabled' : ''}
              />
              <small className="field-hint">
                Este mensaje aparecerá impreso en todas las facturas que generes
              </small>
            </div>
          </div>
        </div>
      </div>

      {hasRoleOwner && (
        <div className="config-footer">
          <button
            className="btn-guardar"
            onClick={guardarDatos}
            disabled={guardando}
          >
            <Save size={20} />
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      )}
    </div>
  );
}
