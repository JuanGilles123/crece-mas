import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Save, Building2, MapPin, Phone, Hash, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './ConfiguracionFacturacion.css';

export default function ConfiguracionFacturacion() {
  const { organization, hasRoleOwner } = useAuth();
  const [datosEmpresa, setDatosEmpresa] = useState({
    razon_social: '',
    nit: '',
    direccion: '',
    telefono: '',
    email: '',
    ciudad: '',
    regimen_tributario: 'simplificado',
    responsable_iva: false,
    mensaje_factura: 'Gracias por su compra'
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

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
        mensaje_factura: organization.mensaje_factura || 'Gracias por su compra'
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
      toast.success('✅ Información actualizada');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando...</div>;
  if (!organization) return <div className="loading">No se pudo cargar la organización</div>;

  return (
    <div className="config-facturacion">
      <div className="header">
        <Building2 size={32} />
        <div>
          <h2>Información de Facturación</h2>
          <p>Organización: <strong>{organization.name}</strong></p>
        </div>
      </div>

      {!hasRoleOwner && (
        <div className="warning">
          <AlertCircle size={20} />
          <p>Solo el propietario puede modificar esta información</p>
        </div>
      )}

      <div className="form">
        <h3>Datos Básicos</h3>
        <input
          type="text"
          name="razon_social"
          value={datosEmpresa.razon_social}
          onChange={handleInputChange}
          placeholder="Razón Social *"
          disabled={!hasRoleOwner}
        />
        <input
          type="text"
          name="nit"
          value={datosEmpresa.nit}
          onChange={handleInputChange}
          placeholder="NIT"
          disabled={!hasRoleOwner}
        />
        <select
          name="regimen_tributario"
          value={datosEmpresa.regimen_tributario}
          onChange={handleInputChange}
          disabled={!hasRoleOwner}
        >
          <option value="simplificado">Simplificado</option>
          <option value="comun">Común</option>
          <option value="especial">Especial</option>
        </select>
        <label>
          <input
            type="checkbox"
            name="responsable_iva"
            checked={datosEmpresa.responsable_iva}
            onChange={handleInputChange}
            disabled={!hasRoleOwner}
          />
          Responsable de IVA
        </label>

        <h3>Contacto</h3>
        <input
          type="text"
          name="direccion"
          value={datosEmpresa.direccion}
          onChange={handleInputChange}
          placeholder="Dirección"
          disabled={!hasRoleOwner}
        />
        <input
          type="text"
          name="ciudad"
          value={datosEmpresa.ciudad}
          onChange={handleInputChange}
          placeholder="Ciudad"
          disabled={!hasRoleOwner}
        />
        <input
          type="tel"
          name="telefono"
          value={datosEmpresa.telefono}
          onChange={handleInputChange}
          placeholder="Teléfono"
          disabled={!hasRoleOwner}
        />
        <input
          type="email"
          name="email"
          value={datosEmpresa.email}
          onChange={handleInputChange}
          placeholder="Email *"
          disabled={!hasRoleOwner}
        />

        <h3>Personalización</h3>
        <textarea
          name="mensaje_factura"
          value={datosEmpresa.mensaje_factura}
          onChange={handleInputChange}
          placeholder="Mensaje en facturas"
          rows="3"
          disabled={!hasRoleOwner}
        />

        {hasRoleOwner && (
          <button onClick={guardarDatos} disabled={guardando}>
            <Save size={20} />
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>
    </div>
  );
}
