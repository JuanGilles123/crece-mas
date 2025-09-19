import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Save, Upload, Building2, MapPin, Phone, Hash, Mail, MapPin as City } from 'lucide-react';
import './ConfiguracionFacturacion.css';

export default function ConfiguracionFacturacion() {
  const { user } = useAuth();
  const [datosEmpresa, setDatosEmpresa] = useState({
    nombre_empresa: '',
    direccion: '',
    telefono: '',
    nit: '',
    email: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    logo_url: ''
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar datos existentes
  useEffect(() => {
    cargarDatosEmpresa();
  }, [user]);

  const cargarDatosEmpresa = async () => {
    if (!user) return;
    
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('datos_empresa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error cargando datos:', error);
        setMensaje('Error al cargar los datos de la empresa');
      } else if (data) {
        setDatosEmpresa(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosEmpresa(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const subirLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMensaje('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMensaje('El archivo debe ser menor a 2MB');
      return;
    }

    setSubiendoLogo(true);
    try {
      const fileName = `logo_${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error subiendo logo:', error);
        setMensaje('Error al subir el logo');
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setDatosEmpresa(prev => ({
        ...prev,
        logo_url: urlData.publicUrl
      }));

      setMensaje('Logo subido exitosamente');
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al subir el logo');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const guardarDatos = async () => {
    if (!user) return;

    // Validar campos requeridos
    if (!datosEmpresa.nombre_empresa || !datosEmpresa.direccion || !datosEmpresa.telefono || !datosEmpresa.nit) {
      setMensaje('Por favor complete todos los campos requeridos');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('datos_empresa')
        .upsert({
          user_id: user.id,
          ...datosEmpresa
        });

      if (error) {
        console.error('Error guardando datos:', error);
        setMensaje('Error al guardar los datos');
        return;
      }

      setMensaje('Datos guardados exitosamente');
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar los datos');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="config-facturacion-loading">
        <div className="config-facturacion-skeleton">
          <div className="config-skeleton-header"></div>
          <div className="config-skeleton-form">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="config-skeleton-input"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="config-facturacion">
      <div className="config-facturacion-header">
        <Building2 className="config-facturacion-icon" />
        <h2 className="config-facturacion-title">Configuración de Facturación</h2>
        <p className="config-facturacion-subtitle">
          Configure los datos de su empresa para generar recibos profesionales
        </p>
      </div>

      {mensaje && (
        <div className={`config-mensaje ${mensaje.includes('Error') ? 'config-mensaje-error' : 'config-mensaje-success'}`}>
          {mensaje}
        </div>
      )}

      <div className="config-facturacion-form">
        {/* Logo */}
        <div className="config-form-group config-logo-group">
          <label className="config-form-label">Logo de la Empresa</label>
          <div className="config-logo-container">
            {datosEmpresa.logo_url && (
              <img 
                src={datosEmpresa.logo_url} 
                alt="Logo empresa" 
                className="config-logo-preview"
              />
            )}
            <div className="config-logo-upload">
              <input
                type="file"
                accept="image/*"
                onChange={subirLogo}
                className="config-logo-input"
                id="logo-upload"
                disabled={subiendoLogo}
              />
              <label htmlFor="logo-upload" className="config-logo-button">
                <Upload className="config-logo-icon" />
                {subiendoLogo ? 'Subiendo...' : 'Subir Logo'}
              </label>
              <p className="config-logo-help">PNG, JPG o GIF (máx. 2MB)</p>
            </div>
          </div>
        </div>

        {/* Datos básicos */}
        <div className="config-form-row">
          <div className="config-form-group">
            <label className="config-form-label">
              <Building2 className="config-input-icon" />
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              name="nombre_empresa"
              value={datosEmpresa.nombre_empresa}
              onChange={handleInputChange}
              className="config-form-input"
              placeholder="Ej: Mi Empresa S.A.S."
              required
            />
          </div>

          <div className="config-form-group">
            <label className="config-form-label">
              <Hash className="config-input-icon" />
              NIT *
            </label>
            <input
              type="text"
              name="nit"
              value={datosEmpresa.nit}
              onChange={handleInputChange}
              className="config-form-input"
              placeholder="Ej: 900.123.456-7"
              required
            />
          </div>
        </div>

        <div className="config-form-group">
          <label className="config-form-label">
            <MapPin className="config-input-icon" />
            Dirección *
          </label>
          <input
            type="text"
            name="direccion"
            value={datosEmpresa.direccion}
            onChange={handleInputChange}
            className="config-form-input"
            placeholder="Ej: Calle 123 #45-67, Medellín"
            required
          />
        </div>

        <div className="config-form-row">
          <div className="config-form-group">
            <label className="config-form-label">
              <Phone className="config-input-icon" />
              Teléfono *
            </label>
            <input
              type="tel"
              name="telefono"
              value={datosEmpresa.telefono}
              onChange={handleInputChange}
              className="config-form-input"
              placeholder="Ej: +57 300 123 4567"
              required
            />
          </div>

          <div className="config-form-group">
            <label className="config-form-label">
              <Mail className="config-input-icon" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={datosEmpresa.email}
              onChange={handleInputChange}
              className="config-form-input"
              placeholder="Ej: contacto@miempresa.com"
            />
          </div>
        </div>

        <div className="config-form-row">
          <div className="config-form-group">
            <label className="config-form-label">
              <City className="config-input-icon" />
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              value={datosEmpresa.ciudad}
              onChange={handleInputChange}
              className="config-form-input"
              placeholder="Ej: Medellín"
            />
          </div>

          <div className="config-form-group">
            <label className="config-form-label">
              <MapPin className="config-input-icon" />
              Departamento
            </label>
            <input
              type="text"
              name="departamento"
              value={datosEmpresa.departamento}
              onChange={handleInputChange}
              className="config-form-input"
              placeholder="Ej: Antioquia"
            />
          </div>
        </div>

        <div className="config-form-group">
          <label className="config-form-label">
            <Hash className="config-input-icon" />
            Código Postal
          </label>
          <input
            type="text"
            name="codigo_postal"
            value={datosEmpresa.codigo_postal}
            onChange={handleInputChange}
            className="config-form-input"
            placeholder="Ej: 050001"
          />
        </div>

        <div className="config-form-actions">
          <button 
            className="config-save-button"
            onClick={guardarDatos}
            disabled={guardando}
          >
            <Save className="config-save-icon" />
            {guardando ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
