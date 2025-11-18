import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from './UpgradePrompt';
import { Save, Building2, MapPin, Phone, Hash, Mail, AlertCircle, FileText, CreditCard, ShieldAlert, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import './ConfiguracionFacturacion.css';

export default function ConfiguracionFacturacion() {
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
    business_type: 'other'
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
        business_type: organization.business_type || 'other'
      });
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
    setDatosEmpresa(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
      const { error } = await supabase
        .from('organizations')
        .update(datosEmpresa)
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
                {[
                  { value: 'food', icon: '🍔', label: 'Comida', desc: 'Restaurantes, cafeterías, comida rápida' },
                  { value: 'clothing', icon: '👔', label: 'Ropa', desc: 'Tiendas de ropa y accesorios' },
                  { value: 'retail', icon: '🏪', label: 'Retail', desc: 'Tiendas generales, supermercados' },
                  { value: 'other', icon: '📦', label: 'Otro', desc: 'Otros tipos de negocio' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`business-type-option ${datosEmpresa.business_type === type.value ? 'selected' : ''}`}
                    onClick={() => hasRoleOwner && handleInputChange({ target: { name: 'business_type', value: type.value } })}
                    disabled={!hasRoleOwner}
                  >
                    <span className="business-type-icon">{type.icon}</span>
                    <div className="business-type-info">
                      <span className="business-type-label">{type.label}</span>
                      <span className="business-type-desc">{type.desc}</span>
                    </div>
                    {datosEmpresa.business_type === type.value && (
                      <div className="business-type-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
              <input
                type="hidden"
                name="business_type"
                value={datosEmpresa.business_type}
              />
              <small className="field-hint">
                El tipo de negocio determina las funcionalidades disponibles (ej: toppings para comida)
              </small>
            </div>

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
