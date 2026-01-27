import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCrearCreditoProveedor, useProveedores, useOrdenesCompra } from '../../hooks/useEgresos';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import './ProveedorModal.css';

const creditoProveedorSchema = z.object({
  proveedor_id: z.string().uuid('Debes seleccionar un proveedor'),
  monto_total: z.string().min(1, 'El monto es requerido'),
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_vencimiento: z.string().optional(),
  factura_numero: z.string().optional(),
  orden_compra_id: z.string().uuid().optional().or(z.literal('')),
  notas: z.string().optional()
});

const CreditoProveedorModal = ({ open, onClose, credito = null, ordenCompraId = null }) => {
  const { organization } = useAuth();
  const crearCreditoProveedor = useCrearCreditoProveedor();
  const { data: proveedores = [] } = useProveedores(organization?.id, { activo: true });
  const { data: ordenesCompra = [] } = useOrdenesCompra(organization?.id);
  const montoTotalInput = useCurrencyInput();
  
  // Extraer funciones estables del hook (ya están en useCallback)
  const setMontoTotalValue = montoTotalInput.setValue;
  const resetMontoTotal = montoTotalInput.reset;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(creditoProveedorSchema),
    defaultValues: {
      proveedor_id: '',
      monto_total: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      factura_numero: '',
      orden_compra_id: ordenCompraId || '',
      notas: ''
    }
  });

  const ordenCompraSeleccionada = watch('orden_compra_id');
  const ordenCompra = ordenesCompra.find(oc => oc.id === ordenCompraSeleccionada);

  useEffect(() => {
    if (open) {
      if (credito) {
        const montoInicial = credito.monto_total?.toString() || '';
        setMontoTotalValue(montoInicial);
        reset({
          proveedor_id: credito.proveedor_id || '',
          monto_total: montoInicial,
          fecha_emision: credito.fecha_emision || new Date().toISOString().split('T')[0],
          fecha_vencimiento: credito.fecha_vencimiento || '',
          factura_numero: credito.factura_numero || '',
          orden_compra_id: credito.orden_compra_id || '',
          notas: credito.notas || ''
        });
      } else {
        resetMontoTotal();
        reset({
          proveedor_id: '',
          monto_total: '',
          fecha_emision: new Date().toISOString().split('T')[0],
          fecha_vencimiento: '',
          factura_numero: '',
          orden_compra_id: ordenCompraId || '',
          notas: ''
        });
      }
    }
  }, [open, credito, ordenCompraId, reset, setMontoTotalValue, resetMontoTotal]);

  // Si se selecciona una orden de compra, sugerir el monto y proveedor
  useEffect(() => {
    if (ordenCompra && !credito) {
      const currentValues = watch();
      const montoOrden = ordenCompra.total?.toString() || '';
      if (montoOrden) {
        setMontoTotalValue(montoOrden);
      }
      reset({
        ...currentValues,
        proveedor_id: ordenCompra.proveedor_id || currentValues.proveedor_id,
        monto_total: montoOrden || currentValues.monto_total
      });
    }
  }, [ordenCompra, credito, reset, watch, setMontoTotalValue]);

  const onSubmit = async (data) => {
    try {
      // Obtener el valor numérico del input de moneda
      const montoTotal = montoTotalInput.numericValue || parseFloat(data.monto_total.toString().replace(/\./g, '')) || 0;
      
      if (montoTotal <= 0) {
        alert('El monto debe ser mayor a cero');
        return;
      }

      const creditoData = {
        organization_id: organization.id,
        proveedor_id: data.proveedor_id,
        monto_total: montoTotal,
        monto_pagado: 0,
        monto_pendiente: montoTotal,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento || null,
        factura_numero: data.factura_numero || null,
        orden_compra_id: data.orden_compra_id || null,
        notas: data.notas || null,
        estado: 'pendiente'
      };

      await crearCreditoProveedor.mutateAsync(creditoData);
      onClose();
    } catch (error) {
      console.error('Error al crear crédito:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content proveedor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{credito ? 'Editar Crédito con Proveedor' : 'Nuevo Crédito con Proveedor'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-section">
            <h3>Información del Crédito</h3>
            
            <div className="form-group">
              <label htmlFor="proveedor_id">Proveedor *</label>
              <select
                id="proveedor_id"
                {...register('proveedor_id')}
                className={errors.proveedor_id ? 'error' : ''}
                disabled={!!credito}
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
              {errors.proveedor_id && <span className="error-message">{errors.proveedor_id.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monto_total">Monto Total *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', color: '#6b7280' }}>$</span>
                  <input
                    id="monto_total"
                    type="text"
                    value={montoTotalInput.displayValue}
                    onChange={(e) => {
                      montoTotalInput.handleChange(e);
                      setValue('monto_total', montoTotalInput.displayValue, { shouldValidate: true });
                    }}
                    onBlur={() => {
                      setValue('monto_total', montoTotalInput.displayValue, { shouldValidate: true });
                    }}
                    className={errors.monto_total ? 'error' : ''}
                    placeholder="0"
                    style={{ flex: 1 }}
                  />
                </div>
                {errors.monto_total && <span className="error-message">{errors.monto_total.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fecha_emision">Fecha de Emisión *</label>
                <input
                  id="fecha_emision"
                  type="date"
                  {...register('fecha_emision')}
                  className={errors.fecha_emision ? 'error' : ''}
                />
                {errors.fecha_emision && <span className="error-message">{errors.fecha_emision.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha_vencimiento">Fecha de Vencimiento</label>
                <input
                  id="fecha_vencimiento"
                  type="date"
                  {...register('fecha_vencimiento')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="factura_numero">Número de Factura</label>
                <input
                  id="factura_numero"
                  type="text"
                  {...register('factura_numero')}
                  placeholder="Número de factura"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Vincular a Orden de Compra (Opcional)</h3>
            
            <div className="form-group">
              <label htmlFor="orden_compra_id">Orden de Compra</label>
              <select
                id="orden_compra_id"
                {...register('orden_compra_id')}
                disabled={!!credito || !!ordenCompraId}
              >
                <option value="">Sin orden de compra</option>
                {ordenesCompra
                  .filter(oc => oc.estado === 'facturada' || oc.estado === 'recibida')
                  .map(oc => (
                    <option key={oc.id} value={oc.id}>
                      {oc.numero_orden} - {oc.proveedor?.nombre || 'Proveedor'} - {oc.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </option>
                  ))}
              </select>
              <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                Si seleccionas una orden de compra, se sugerirán automáticamente el proveedor y el monto
              </small>
            </div>

            {ordenCompra && (
              <div style={{ 
                padding: '1rem', 
                background: '#f3f4f6', 
                borderRadius: '8px', 
                marginTop: '1rem' 
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Información de la Orden:</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Número:</strong> {ordenCompra.numero_orden}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  <strong>Total:</strong> {ordenCompra.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Notas Adicionales</h3>
            
            <div className="form-group">
              <label htmlFor="notas">Notas</label>
              <textarea
                id="notas"
                {...register('notas')}
                rows="3"
                placeholder="Notas adicionales sobre el crédito"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : credito ? 'Actualizar' : 'Crear Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditoProveedorModal;
