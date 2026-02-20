import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCrearGastoFijo, useActualizarGastoFijo, useCategoriasGastos } from '../../hooks/useEgresos';
import { useProveedores } from '../../hooks/useEgresos';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import './ProveedorModal.css';

const gastoFijoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  descripcion: z.string().optional(),
  frecuencia: z.enum(['diario', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual']),
  dia_pago: z.string().optional(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'cheque']).default('transferencia'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().optional(),
  categoria_id: z.string().optional().or(z.literal('')),
  proveedor_id: z.string().uuid().optional().or(z.literal('')),
  notas: z.string().optional(),
  activo: z.boolean().default(true)
});

// Categorías predefinidas comunes para negocios
const CATEGORIAS_PREDEFINIDAS = [
  'Alquiler',
  'Servicios Públicos',
  'Agua',
  'Luz',
  'Gas',
  'Internet',
  'Teléfono',
  'Nómina',
  'Salarios',
  'Seguros',
  'Impuestos',
  'Marketing',
  'Publicidad',
  'Mantenimiento',
  'Suministros de Oficina',
  'Limpieza',
  'Seguridad',
  'Software',
  'Suscripciones',
  'Transporte',
  'Logística',
  'Contabilidad',
  'Legal',
  'Servicios Profesionales',
  'Capacitación',
  'Eventos',
  'Donaciones',
  'Otros'
];

const GastoFijoModal = ({ open, onClose, gasto = null }) => {
  const { organization } = useAuth();
  const crearGastoFijo = useCrearGastoFijo();
  const actualizarGastoFijo = useActualizarGastoFijo();
  const { data: categorias = [] } = useCategoriasGastos(organization?.id, 'fijo');
  const { data: proveedores = [] } = useProveedores(organization?.id, { activo: true });
  const montoInput = useCurrencyInput();
  
  // Extraer funciones estables del hook (ya están en useCallback)
  const setMontoValue = montoInput.setValue;
  const resetMonto = montoInput.reset;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(gastoFijoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      frecuencia: 'mensual',
      dia_pago: '',
      metodo_pago: 'transferencia',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      categoria_id: '',
      proveedor_id: '',
      notas: '',
      activo: true
    }
  });

  useEffect(() => {
    if (open) {
      if (gasto) {
        const montoInicial = gasto.monto?.toString() || '';
        setMontoValue(montoInicial);
        reset({
          nombre: gasto.nombre || '',
          descripcion: gasto.descripcion || '',
          frecuencia: gasto.frecuencia || 'mensual',
          dia_pago: gasto.dia_pago?.toString() || '',
          metodo_pago: gasto.metodo_pago || 'transferencia',
          fecha_inicio: gasto.fecha_inicio || new Date().toISOString().split('T')[0],
          fecha_fin: gasto.fecha_fin || '',
          categoria_id: gasto.categoria_id || '',
          proveedor_id: gasto.proveedor_id || '',
          notas: gasto.notas || '',
          activo: gasto.activo !== undefined ? gasto.activo : true
        });
      } else {
        resetMonto();
        reset({
          nombre: '',
          descripcion: '',
          frecuencia: 'mensual',
          dia_pago: '',
          metodo_pago: 'transferencia',
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: '',
          categoria_id: '',
          proveedor_id: '',
          notas: '',
          activo: true
        });
      }
    }
  }, [open, gasto, reset, setMontoValue, resetMonto]);

  // Función optimizada para manejar input de monto
  const handleMontoChange = (e) => {
    montoInput.handleChange(e);
    // No llamamos setValue porque monto no está registrado en el formulario
  };

  const onSubmit = async (data) => {
    try {
      // Validar monto manualmente ya que no está registrado en el formulario
      if (!montoInput.displayValue || montoInput.numericValue <= 0) {
        throw new Error('El monto es requerido');
      }
      // Si la categoría es un texto (categoría predefinida), buscar si existe o guardarla en notas
      let categoriaId = data.categoria_id || null;
      let notasFinal = data.notas || null;
      
      // Si es un texto (no UUID), buscar si existe la categoría con ese nombre
      if (categoriaId && !categoriaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Es una categoría predefinida (texto)
        const nombreCategoria = categoriaId;
        // Buscar si ya existe una categoría con ese nombre
        const categoriaExistente = categorias.find(cat => cat.nombre.toLowerCase() === nombreCategoria.toLowerCase());
        if (categoriaExistente) {
          categoriaId = categoriaExistente.id;
        } else {
          // Si no existe, guardar el nombre como texto en notas
          categoriaId = null;
          // Agregar la categoría a las notas si no está vacía
          notasFinal = notasFinal 
            ? `${notasFinal}\nCategoría: ${nombreCategoria}`
            : `Categoría: ${nombreCategoria}`;
        }
      }
      
      // Obtener el valor numérico del input de moneda
      const monto = montoInput.numericValue || parseFloat(data.monto.toString().replace(/\./g, '')) || 0;
      
      const gastoData = {
        ...data,
        organization_id: organization.id,
        monto: monto,
        dia_pago: data.dia_pago ? parseInt(data.dia_pago) : null,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin || null,
        categoria_id: categoriaId,
        proveedor_id: data.proveedor_id || null,
        descripcion: data.descripcion || null,
        notas: notasFinal
      };

      if (gasto) {
        await actualizarGastoFijo.mutateAsync({
          id: gasto.id,
          updates: gastoData
        });
      } else {
        await crearGastoFijo.mutateAsync(gastoData);
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar gasto fijo:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content proveedor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{gasto ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}</h2>
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
                placeholder="Ej: Alquiler, Servicios públicos, etc."
              />
              {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                {...register('descripcion')}
                rows="2"
                placeholder="Descripción del gasto"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monto">Monto *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', color: '#6b7280' }}>$</span>
                  <input
                    id="monto"
                    type="text"
                    value={montoInput.displayValue}
                    onChange={handleMontoChange}
                    className={errors.monto ? 'error' : ''}
                    placeholder="0"
                    style={{ flex: 1 }}
                    autoComplete="off"
                  />
                </div>
                {errors.monto && <span className="error-message">{errors.monto.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="frecuencia">Frecuencia *</label>
                <select id="frecuencia" {...register('frecuencia')}>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dia_pago">Día de Pago</label>
                <input
                  id="dia_pago"
                  type="number"
                  min="1"
                  max="31"
                  {...register('dia_pago')}
                  placeholder="Día del mes (1-31)"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Día del mes en que se realiza el pago
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="metodo_pago">Método de Pago</label>
                <select id="metodo_pago" {...register('metodo_pago')}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Fechas</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha_inicio">Fecha de Inicio *</label>
                <input
                  id="fecha_inicio"
                  type="date"
                  {...register('fecha_inicio')}
                  className={errors.fecha_inicio ? 'error' : ''}
                />
                {errors.fecha_inicio && <span className="error-message">{errors.fecha_inicio.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fecha_fin">Fecha de Finalización</label>
                <input
                  id="fecha_fin"
                  type="date"
                  {...register('fecha_fin')}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Dejar vacío si es permanente
                </small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Clasificación</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categoria_id">Categoría</label>
                <select id="categoria_id" {...register('categoria_id')}>
                  <option value="">Sin categoría</option>
                  <optgroup label="Categorías Comunes">
                    {CATEGORIAS_PREDEFINIDAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                  {categorias.length > 0 && (
                    <optgroup label="Categorías Personalizadas">
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="proveedor_id">Proveedor</label>
                <select id="proveedor_id" {...register('proveedor_id')}>
                  <option value="">Sin proveedor</option>
                  {proveedores.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas</label>
              <textarea
                id="notas"
                {...register('notas')}
                rows="3"
                placeholder="Notas adicionales"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  {...register('activo')}
                />
                <span>Gasto activo</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : gasto ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GastoFijoModal;
