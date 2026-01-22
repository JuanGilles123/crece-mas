import React, { useState } from 'react';
import { supabase } from '../services/api/supabaseClient';
import { generarCodigoVenta } from '../utils/generarCodigoVenta';
import { useAuth } from '../context/AuthContext';
import { Zap, DollarSign, FileText, CreditCard, Check, X, Banknote, Building2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrencyInput } from '../hooks/useCurrencyInput';
import './VentaRapida.css';

export default function VentaRapida() {
  const { user, organization } = useAuth();
  const montoInput = useCurrencyInput();
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [procesando, setProcesando] = useState(false);

  // Montos rápidos comunes
  const montosRapidos = [
    { valor: 5000, label: '$5.000' },
    { valor: 10000, label: '$10.000' },
    { valor: 20000, label: '$20.000' },
    { valor: 50000, label: '$50.000' },
    { valor: 100000, label: '$100.000' },
    { valor: 200000, label: '$200.000' }
  ];

  const handleMontoRapido = (valor) => {
    montoInput.setValue(valor);
  };

  const formatearMonto = (valor) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numero);
  };

  const limpiarFormulario = () => {
    montoInput.reset();
    setDescripcion('');
    setMetodoPago('efectivo');
  };

  const registrarVenta = async () => {
    if (!user || !organization) {
      toast.error('Error: No hay usuario u organización activa');
      return;
    }

    const montoNumerico = montoInput.numericValue;
    if (!montoNumerico || montoNumerico <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    // Descripción ahora es opcional
    // if (!descripcion.trim()) {
    //   toast.error('Ingresa una descripción de la venta');
    //   return;
    // }

    setProcesando(true);

    try {
      // Generar código de venta
      const numeroVenta = await generarCodigoVenta(organization.id, metodoPago);
      
      // Registrar venta rápida - COLUMNAS ACTUALIZADAS
      const ventaData = {
        organization_id: organization.id,
        user_id: user.id,
        total: montoNumerico,
        metodo_pago: metodoPago,
        tipo_venta: 'rapida',
        descripcion: descripcion.trim() || 'Venta rápida',
        items: [],
        fecha: new Date().toISOString(),
        numero_venta: numeroVenta
      };

      const { error: ventaError } = await supabase
        .from('ventas')
        .insert(ventaData)
        .select()
        .single();

      if (ventaError) {
        console.error('❌ Error detallado de Supabase:', ventaError);
        console.error('❌ Código:', ventaError.code);
        console.error('❌ Mensaje:', ventaError.message);
        console.error('❌ Detalles:', ventaError.details);
        throw ventaError;
      }
      toast.success(`✅ Venta registrada: ${formatearMonto(montoNumerico)}`);
      limpiarFormulario();
    } catch (error) {
      console.error('❌ Error al registrar venta:', error);
      
      // Mostrar mensaje de error más detallado
      let errorMessage = 'Error al registrar la venta';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.details) {
        errorMessage += ` - ${error.details}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="venta-rapida">
      <div className="venta-rapida-header">
        <div className="header-icon">
          <Zap size={40} />
        </div>
        <div className="header-text">
          <h1>Venta Rápida</h1>
          <p className="subtitle">Registra ventas sin usar el inventario</p>
        </div>
      </div>

      <div className="venta-rapida-container">
        {/* Monto */}
        <div className="monto-section">
          <label>
            <DollarSign size={20} />
            Monto de la Venta
          </label>
          <div className="monto-input-wrapper">
            <span className="monto-simbolo">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={montoInput.displayValue}
              onChange={montoInput.handleChange}
              placeholder="0"
              className="monto-input"
              autoFocus
            />
          </div>
          {montoInput.displayValue && (
            <div className="monto-preview">
              {formatearMonto(montoInput.numericValue)}
            </div>
          )}
        </div>

        {/* Montos Rápidos */}
        <div className="montos-rapidos">
          <p className="montos-label">Montos Comunes:</p>
          <div className="montos-grid">
            {montosRapidos.map((item) => (
              <button
                key={item.valor}
                onClick={() => handleMontoRapido(item.valor)}
                className={`monto-btn ${montoInput.numericValue === item.valor ? 'active' : ''}`}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div className="form-section">
          <label htmlFor="descripcion">
            <FileText size={20} />
            Descripción de la Venta <span className="opcional">(Opcional)</span>
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Servicio técnico, Consultoría, Producto sin inventario... (opcional)"
            rows="3"
            maxLength="200"
          />
          <small className="char-count">{descripcion.length}/200</small>
        </div>

        {/* Método de Pago */}
        <div className="form-section">
          <label htmlFor="metodo_pago">
            <CreditCard size={20} />
            Método de Pago
          </label>
          <div className="metodos-pago">
            <button
              type="button"
              onClick={() => setMetodoPago('efectivo')}
              className={`metodo-btn ${metodoPago === 'efectivo' ? 'active' : ''}`}
            >
              <Banknote size={20} />
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago('tarjeta')}
              className={`metodo-btn ${metodoPago === 'tarjeta' ? 'active' : ''}`}
            >
              <CreditCard size={20} />
              Tarjeta
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago('transferencia')}
              className={`metodo-btn ${metodoPago === 'transferencia' ? 'active' : ''}`}
            >
              <Building2 size={20} />
              Transferencia
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago('otro')}
              className={`metodo-btn ${metodoPago === 'otro' ? 'active' : ''}`}
            >
              <RefreshCw size={20} />
              Otro
            </button>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="acciones">
          <button
            onClick={limpiarFormulario}
            className="btn-cancelar"
            disabled={procesando}
          >
            <X size={24} />
            Limpiar
          </button>
          <button
            onClick={registrarVenta}
            className="btn-registrar"
            disabled={procesando || !montoInput.numericValue}
          >
            <Check size={24} />
            {procesando ? 'Procesando...' : 'Registrar Venta'}
          </button>
        </div>

        {/* Info */}
        <div className="info-box">
          <p>
            💡 <strong>Venta Rápida:</strong> Úsala para registrar ventas de servicios, 
            productos no inventariados o cualquier ingreso que no esté en tu catálogo.
          </p>
        </div>
      </div>
    </div>
  );
}
