import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCrearProveedor, useActualizarProveedor } from '../../hooks/useEgresos';
import './ProveedorModal.css';

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  nit: z.string().optional(),
  contacto_nombre: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  tipo_proveedor: z.enum(['productos', 'servicios', 'insumos', 'otros']).optional(),
  condiciones_pago: z.string().optional(),
  notas: z.string().optional(),
  activo: z.boolean().default(true)
});

const ProveedorModal = ({ open, onClose, proveedor = null }) => {
  const { organization } = useAuth();
  const crearProveedor = useCrearProveedor();
  const actualizarProveedor = useActualizarProveedor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: '',
      nit: '',
      contacto_nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      pais: 'Colombia',
      tipo_proveedor: 'productos',
      condiciones_pago: '',
      notas: '',
      activo: true
    }
  });

  useEffect(() => {
    if (open) {
      if (proveedor) {
        // Modo edición
        reset({
          nombre: proveedor.nombre || '',
          nit: proveedor.nit || '',
          contacto_nombre: proveedor.contacto_nombre || '',
          telefono: proveedor.telefono || '',
          email: proveedor.email || '',
          direccion: proveedor.direccion || '',
          ciudad: proveedor.ciudad || '',
          pais: proveedor.pais || 'Colombia',
          tipo_proveedor: proveedor.tipo_proveedor || 'productos',
          condiciones_pago: proveedor.condiciones_pago || '',
          notas: proveedor.notas || '',
          activo: proveedor.activo !== undefined ? proveedor.activo : true
        });
      } else {
        // Modo creación
        reset({
          nombre: '',
          nit: '',
          contacto_nombre: '',
          telefono: '',
          email: '',
          direccion: '',
          ciudad: '',
          pais: 'Colombia',
          tipo_proveedor: 'productos',
          condiciones_pago: '',
          notas: '',
          activo: true
        });
      }
    }
  }, [open, proveedor, reset]);

  const onSubmit = async (data) => {
    try {
      const proveedorData = {
        ...data,
        organization_id: organization.id,
        email: data.email || null,
        nit: data.nit || null
      };

      if (proveedor) {
        // Actualizar
        await actualizarProveedor.mutateAsync({
          id: proveedor.id,
          updates: proveedorData
        });
      } else {
        // Crear
        await crearProveedor.mutateAsync(proveedorData);
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content proveedor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-section">
            <h3>Información Básica</h3>
            
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                {...register('nombre')}
                className={errors.nombre ? 'error' : ''}
                placeholder="Nombre del proveedor"
              />
              {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nit">NIT</label>
                <input
                  id="nit"
                  type="text"
                  {...register('nit')}
                  placeholder="Número de identificación tributaria"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipo_proveedor">Tipo de Proveedor</label>
                <select id="tipo_proveedor" {...register('tipo_proveedor')}>
                  <option value="productos">Productos</option>
                  <option value="servicios">Servicios</option>
                  <option value="insumos">Insumos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Información de Contacto</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contacto_nombre">Nombre de Contacto</label>
                <input
                  id="contacto_nombre"
                  type="text"
                  {...register('contacto_nombre')}
                  placeholder="Nombre de la persona de contacto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  type="tel"
                  {...register('telefono')}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'error' : ''}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Dirección</h3>
            
            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <textarea
                id="direccion"
                {...register('direccion')}
                rows="2"
                placeholder="Dirección completa"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ciudad">Ciudad</label>
                <input
                  id="ciudad"
                  type="text"
                  {...register('ciudad')}
                  placeholder="Ciudad"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pais">País</label>
                <input
                  id="pais"
                  type="text"
                  {...register('pais')}
                  placeholder="País"
                  defaultValue="Colombia"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Información Adicional</h3>
            
            <div className="form-group">
              <label htmlFor="condiciones_pago">Condiciones de Pago</label>
              <input
                id="condiciones_pago"
                type="text"
                {...register('condiciones_pago')}
                placeholder="Ej: Contado, 30 días, 60 días"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas</label>
              <textarea
                id="notas"
                {...register('notas')}
                rows="3"
                placeholder="Notas adicionales sobre el proveedor"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('activo')}
                />
                <span>Proveedor activo</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : proveedor ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProveedorModal;
