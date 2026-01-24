import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCurrencyInput } from '../hooks/useCurrencyInput';
import { Calculator, TrendingUp, DollarSign, ShoppingCart, AlertCircle, CheckCircle, XCircle, Save, Banknote, CreditCard, Smartphone, Share2, Download } from 'lucide-react';
import './CierreCaja.css';

const CierreCaja = () => {
  const { userProfile } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [cotizacionesHoy, setCotizacionesHoy] = useState([]); // Cotizaciones informativas (no cuentan en totales)
  const [totalSistema, setTotalSistema] = useState(0);
  
  // Currency inputs optimizados
  const efectivoRealInput = useCurrencyInput();
  const transferenciasRealInput = useCurrencyInput();
  const tarjetaRealInput = useCurrencyInput();
  
  const [totalReal, setTotalReal] = useState(0);
  const [diferencia, setDiferencia] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cierreGuardado, setCierreGuardado] = useState(false);
  const [yaCerrado, setYaCerrado] = useState(false);
  const [montoInicialApertura, setMontoInicialApertura] = useState(0);
  
  // Desglose por método de pago
  const [desgloseSistema, setDesgloseSistema] = useState({
    efectivo: 0,
    transferencias: 0,
    tarjeta: 0,
    mixto: 0
  });

  const cargarVentasHoy = useCallback(async () => {
    if (!userProfile?.organization_id) return;

    setCargando(true);
    try {
      // Obtener la apertura activa para obtener el monto inicial
      const { data: aperturaActiva, error: errorApertura } = await supabase
        .from('aperturas_caja')
        .select('monto_inicial')
        .eq('organization_id', userProfile.organization_id)
        .is('cierre_id', null)
        .eq('estado', 'abierta')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorApertura) {
        console.error('Error obteniendo apertura activa:', errorApertura);
        setMontoInicialApertura(0);
      } else {
        setMontoInicialApertura(aperturaActiva?.monto_inicial || 0);
      }

      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);

      // 1. Verificar si ya existe un cierre de caja para hoy
      const { data: cierresHoy, error: errorCierres } = await supabase
        .from('cierres_caja')
        .select('created_at')
        .eq('organization_id', userProfile.organization_id)
        .gte('created_at', inicioHoy.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (errorCierres) throw errorCierres;

      // Actualizar estado de si ya hay un cierre hoy
      const hayUltioCierre = cierresHoy && cierresHoy.length > 0;
      setYaCerrado(hayUltioCierre);

      let ventasQuery = supabase
        .from('ventas')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .gte('created_at', inicioHoy.toISOString())
        // Excluir cotizaciones: no deben contar en el cierre de caja hasta que se conviertan en ventas
        .neq('metodo_pago', 'COTIZACION');

      // 2. Si ya hay un cierre hoy, solo mostrar ventas posteriores al último cierre
      if (hayUltioCierre) {
        const ultimoCierre = cierresHoy[0].created_at;
        ventasQuery = ventasQuery.gt('created_at', ultimoCierre);
      }

      const { data, error } = await ventasQuery.order('created_at', { ascending: false });

      if (error) throw error;

      // Separar ventas reales de cotizaciones (por si alguna se filtró)
      const ventasReales = (data || []).filter(venta => {
        const metodo = (venta.metodo_pago || '').toUpperCase();
        const estado = (venta.estado || '').toLowerCase();
        // Excluir cotizaciones: método COTIZACION o estado cotizacion
        return metodo !== 'COTIZACION' && estado !== 'cotizacion';
      });

      setVentasHoy(ventasReales);
      const total = ventasReales.reduce((sum, venta) => sum + (venta.total || 0), 0);
      setTotalSistema(total);
      
      // Calcular desglose por método de pago - procesando pagos mixtos (solo ventas reales)
      const desglose = ventasReales.reduce((acc, venta) => {
        const metodo = (venta.metodo_pago || '').toLowerCase();
        const montoTotal = venta.total || 0;
        let procesado = false;
        
        // OPCIÓN 1: Si existe la columna detalles_pago_mixto con JSONB (prioridad)
        if (venta.detalles_pago_mixto && typeof venta.detalles_pago_mixto === 'object') {
          const detalles = venta.detalles_pago_mixto;
          const metodo1 = (detalles.metodo1 || '').toLowerCase();
          const metodo2 = (detalles.metodo2 || '').toLowerCase();
          const monto1 = parseFloat(detalles.monto1) || 0;
          const monto2 = parseFloat(detalles.monto2) || 0;
          
          // Distribuir según método
          if (metodo1 === 'efectivo') acc.efectivo += monto1;
          else if (metodo1 === 'transferencia') acc.transferencias += monto1;
          else if (metodo1 === 'tarjeta') acc.tarjeta += monto1;
          else if (metodo1 === 'nequi') acc.transferencias += monto1; // Nequi se cuenta como transferencia
          
          if (metodo2 === 'efectivo') acc.efectivo += monto2;
          else if (metodo2 === 'transferencia') acc.transferencias += monto2;
          else if (metodo2 === 'tarjeta') acc.tarjeta += monto2;
          else if (metodo2 === 'nequi') acc.transferencias += monto2; // Nequi se cuenta como transferencia
          
          procesado = true;
        }
        // OPCIÓN 2: Si es pago mixto pero en formato string (compatibilidad con ventas antiguas)
        else if (metodo === 'mixto' || metodo.startsWith('mixto (') || metodo.startsWith('mixto(')) {
          // Intentar múltiples formatos de regex para mayor compatibilidad
          // Formato esperado: "Mixto (Efectivo: $ 20.000 + Transferencia: $ 20.000)"
          // El formatCOP genera: "$ 20.000" (con espacio después del $)
          let match = venta.metodo_pago.match(/Mixto\s*\((.+?):\s*\$?\s*([\d,.]+)\s*\+\s*(.+?):\s*\$?\s*([\d,.]+)\)/i);
          
          if (!match) {
            // Intentar formato alternativo sin paréntesis
            match = venta.metodo_pago.match(/Mixto\s+(.+?):\s*\$?\s*([\d,.]+)\s*\+\s*(.+?):\s*\$?\s*([\d,.]+)/i);
          }
          
          if (match) {
            const metodo1 = match[1].toLowerCase().trim();
            // Remover puntos (separadores de miles) y convertir coma a punto si existe
            const monto1String = match[2].replace(/\./g, '').replace(',', '.');
            const monto1 = parseFloat(monto1String) || 0;
            const metodo2 = match[3].toLowerCase().trim();
            const monto2String = match[4].replace(/\./g, '').replace(',', '.');
            const monto2 = parseFloat(monto2String) || 0;
            
            // Distribuir los montos según el método
            if (metodo1 === 'efectivo') acc.efectivo += monto1;
            else if (metodo1 === 'transferencia') acc.transferencias += monto1;
            else if (metodo1 === 'tarjeta') acc.tarjeta += monto1;
            else if (metodo1 === 'nequi') acc.transferencias += monto1; // Nequi se cuenta como transferencia
            
            if (metodo2 === 'efectivo') acc.efectivo += monto2;
            else if (metodo2 === 'transferencia') acc.transferencias += monto2;
            else if (metodo2 === 'tarjeta') acc.tarjeta += monto2;
            else if (metodo2 === 'nequi') acc.transferencias += monto2; // Nequi se cuenta como transferencia
            
            procesado = true;
          } else {
            // Si no se puede parsear, intentar usar el total y distribuir proporcionalmente
            // o registrar en consola para debugging
            console.warn('No se pudo parsear pago mixto, intentando fallback:', venta.metodo_pago, venta.id);
            // Como último recurso, si tiene detalles_pago_mixto pero no se procesó antes, intentar de nuevo
            if (venta.detalles_pago_mixto && typeof venta.detalles_pago_mixto === 'string') {
              try {
                const detalles = JSON.parse(venta.detalles_pago_mixto);
                const metodo1 = (detalles.metodo1 || '').toLowerCase();
                const metodo2 = (detalles.metodo2 || '').toLowerCase();
                const monto1 = parseFloat(detalles.monto1) || 0;
                const monto2 = parseFloat(detalles.monto2) || 0;
                
                if (metodo1 === 'efectivo') acc.efectivo += monto1;
                else if (metodo1 === 'transferencia') acc.transferencias += monto1;
                else if (metodo1 === 'tarjeta') acc.tarjeta += monto1;
                else if (metodo1 === 'nequi') acc.transferencias += monto1;
                
                if (metodo2 === 'efectivo') acc.efectivo += monto2;
                else if (metodo2 === 'transferencia') acc.transferencias += monto2;
                else if (metodo2 === 'tarjeta') acc.tarjeta += monto2;
                else if (metodo2 === 'nequi') acc.transferencias += monto2;
                
                procesado = true;
              } catch (e) {
                console.error('Error parseando detalles_pago_mixto como string:', e);
              }
            }
          }
        }
        
        // Si no se procesó como pago mixto, procesar como método único
        if (!procesado) {
          if (metodo === 'efectivo') {
            acc.efectivo += montoTotal;
          } else if (metodo === 'transferencia') {
            acc.transferencias += montoTotal;
          } else if (metodo === 'tarjeta') {
            acc.tarjeta += montoTotal;
          } else if (metodo === 'nequi') {
            acc.transferencias += montoTotal; // Nequi se cuenta como transferencia
          } else {
            // Métodos desconocidos o sin clasificar
            acc.mixto += montoTotal;
          }
        }
        
        return acc;
      }, { efectivo: 0, transferencias: 0, tarjeta: 0, mixto: 0 });
      
      setDesgloseSistema(desglose || { efectivo: 0, transferencias: 0, tarjeta: 0, mixto: 0 });

      // Cargar cotizaciones por separado (solo informativas, no cuentan en totales)
      try {
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        
        let cotizacionesQuery = supabase
          .from('ventas')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .gte('created_at', inicioHoy.toISOString())
          .eq('metodo_pago', 'COTIZACION');

        // Si ya hay un cierre hoy, solo mostrar cotizaciones posteriores al último cierre
        if (hayUltioCierre) {
          const ultimoCierre = cierresHoy[0].created_at;
          cotizacionesQuery = cotizacionesQuery.gt('created_at', ultimoCierre);
        }

        const { data: cotizacionesData, error: cotizacionesError } = await cotizacionesQuery
          .order('created_at', { ascending: false });

        if (!cotizacionesError) {
          setCotizacionesHoy(cotizacionesData || []);
        }
      } catch (cotizError) {
        console.warn('Error cargando cotizaciones (no crítico):', cotizError);
        // No es crítico si falla, solo no se mostrarán las cotizaciones informativas
        setCotizacionesHoy([]);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar las ventas del día' });
    } finally {
      setCargando(false);
    }
  }, [userProfile?.organization_id]);

  useEffect(() => {
    cargarVentasHoy();
  }, [cargarVentasHoy]);

  useEffect(() => {
    // Calcular valores numéricos desde displayValue para asegurar que se actualicen correctamente
    const efectivo = efectivoRealInput.displayValue ? parseFloat(efectivoRealInput.displayValue.replace(/\./g, '')) || 0 : 0;
    const transferencias = transferenciasRealInput.displayValue ? parseFloat(transferenciasRealInput.displayValue.replace(/\./g, '')) || 0 : 0;
    const tarjeta = tarjetaRealInput.displayValue ? parseFloat(tarjetaRealInput.displayValue.replace(/\./g, '')) || 0 : 0;
    // El monto inicial NO se suma al total real porque ya está incluido en el efectivo físico que cuenta el usuario
    // El usuario cuenta TODO el efectivo en caja (monto inicial + ventas en efectivo del día)
    const total = efectivo + transferencias + tarjeta;
    setTotalReal(total);
    
    if (efectivoRealInput.displayValue !== '' || transferenciasRealInput.displayValue !== '' || tarjetaRealInput.displayValue !== '') {
      // La diferencia se calcula: Total Real - (Total Sistema + Monto Inicial)
      // Porque el Total Real incluye el monto inicial, pero el Total Sistema solo incluye las ventas del día
      const totalEsperado = totalSistema + montoInicialApertura;
      setDiferencia(total - totalEsperado);
    } else {
      setDiferencia(null);
    }
  }, [efectivoRealInput.displayValue, transferenciasRealInput.displayValue, tarjetaRealInput.displayValue, totalSistema, montoInicialApertura]);

  const generarTextoCierre = () => {
    const fecha = new Date().toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
🧾 CIERRE DE CAJA - ${fecha}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESUMEN REGISTRADO EN SISTEMA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Efectivo registrado en sistema: ${formatCOP(desgloseSistema.efectivo)}
📲 Transferencias registradas en sistema: ${formatCOP(desgloseSistema.transferencias)}
💳 Tarjeta registrada en sistema: ${formatCOP(desgloseSistema.tarjeta)}${desgloseSistema.mixto > 0 ? `
💰 Mixto registrado en sistema: ${formatCOP(desgloseSistema.mixto)}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL REGISTRADO EN SISTEMA: ${formatCOP(totalSistema)}

�💰 CONTEO REAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏦 Monto Inicial (referencia): ${formatCOP(montoInicialApertura)}
💵 Efectivo real en caja: ${formatCOP(efectivoRealInput.numericValue)}
📲 Transferencias reales recibidas: ${formatCOP(transferenciasRealInput.numericValue)}
💳 Pago con tarjetas real recibido: ${formatCOP(tarjetaRealInput.numericValue)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL REAL: ${formatCOP(totalReal)}

${diferencia !== null ? `
📈 RESULTADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${diferencia === 0 ? '✅ Cuadra exacto' : 
  diferencia > 0 ? `⬆️ Sobrante: ${formatCOP(Math.abs(diferencia))}` : 
  `⬇️ Faltante: ${formatCOP(Math.abs(diferencia))}`}
` : ''}
📦 Total de ventas: ${ventasHoy.length}

Generado por Crece+ 🚀
    `.trim();
  };

  const compartirCierre = async () => {
    const texto = generarTextoCierre();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cierre de Caja',
          text: texto
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error compartiendo:', error);
          copiarAlPortapapeles(texto);
        }
      }
    } else {
      copiarAlPortapapeles(texto);
    }
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto).then(() => {
      setMensaje({ tipo: 'success', texto: 'Cierre copiado al portapapeles' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }).catch(err => {
      console.error('Error copiando al portapapeles:', err);
      setMensaje({ tipo: 'error', texto: 'No se pudo copiar' });
    });
  };

  const descargarCierre = () => {
    const texto = generarTextoCierre();
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cierre_caja_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMensaje({ tipo: 'success', texto: 'Cierre descargado correctamente' });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const guardarCierre = async () => {
    if (efectivoRealInput.displayValue === '' && transferenciasRealInput.displayValue === '' && tarjetaRealInput.displayValue === '') {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa al menos un monto' });
      return;
    }

    setGuardando(true);
    try {
      // Primero, obtener la apertura activa para cerrarla
      const { data: aperturaActiva, error: errorApertura } = await supabase
        .from('aperturas_caja')
        .select('id, monto_inicial')
        .eq('organization_id', userProfile.organization_id)
        .is('cierre_id', null)
        .eq('estado', 'abierta')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorApertura) {
        console.error('Error obteniendo apertura activa:', errorApertura);
      }

      // Crear el cierre de caja
      const { data: cierreData, error } = await supabase
        .from('cierres_caja')
        .insert({
          organization_id: userProfile.organization_id,
          user_id: userProfile.user_id,
          fecha: new Date().toISOString().split('T')[0],
          // Desglose del sistema
          sistema_efectivo: desgloseSistema.efectivo,
          sistema_transferencias: desgloseSistema.transferencias,
          sistema_tarjeta: desgloseSistema.tarjeta,
          sistema_otros: 0,
          total_sistema: totalSistema,
          // Desglose real contado
          real_efectivo: efectivoRealInput.numericValue,
          real_transferencias: transferenciasRealInput.numericValue,
          real_tarjeta: tarjetaRealInput.numericValue,
          real_otros: 0,
          total_real: totalReal,
          // Diferencia y metadata
          diferencia: diferencia,
          cantidad_ventas: ventasHoy.length,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      // Si hay una apertura activa, cerrarla vinculándola con el cierre
      if (aperturaActiva && cierreData) {
        const { error: errorCerrarApertura } = await supabase
          .from('aperturas_caja')
          .update({
            cierre_id: cierreData.id,
            estado: 'cerrada',
            updated_at: new Date().toISOString()
          })
          .eq('id', aperturaActiva.id);

        if (errorCerrarApertura) {
          console.error('Error cerrando apertura:', errorCerrarApertura);
          // No lanzar error, solo loguear, ya que el cierre ya se guardó
        }
      }

      setMensaje({ tipo: 'success', texto: 'Cierre de caja guardado correctamente' });
      setCierreGuardado(true); // Activar botones de compartir/descargar
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        efectivoRealInput.reset();
        transferenciasRealInput.reset();
        tarjetaRealInput.reset();
        setTotalReal(0);
        setDiferencia(null);
        setMensaje({ tipo: '', texto: '' });
        setVentasHoy([]); // Limpiar lista de ventas
        setTotalSistema(0); // Limpiar total del sistema
        setDesgloseSistema({ efectivo: 0, transferencias: 0, tarjeta: 0, mixto: 0 }); // Limpiar desglose
        setCierreGuardado(false); // Ocultar botones después de limpiar
        cargarVentasHoy(); // Recargar ventas para el siguiente cierre
      }, 3000);
    } catch (error) {
      console.error('Error guardando cierre:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar el cierre de caja' });
    } finally {
      setGuardando(false);
    }
  };

  const formatCOP = (value) => {
    // Formato colombiano: $ 1.000.000 (puntos para miles)
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getMetodoIcon = (metodo) => {
    switch(metodo) {
      case 'efectivo': return <Banknote size={16} />;
      case 'tarjeta': return <CreditCard size={16} />;
      case 'transferencia': return <Smartphone size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  if (cargando) {
    return (
      <div className="cierre-caja-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Calculator size={48} />
        </motion.div>
        <p>Cargando ventas del día...</p>
      </div>
    );
  }

  return (
    <div className="cierre-caja">
      <motion.div
        className="cierre-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Calculator size={32} />
        <h1>Cierre de Caja</h1>
        <p>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {yaCerrado && ventasHoy.length === 0 && (
        <motion.div
          className="cierre-info-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle size={20} />
          <span>
            <strong>Cierre realizado:</strong> Ya se realizó el cierre de caja de hoy. 
            {' '}Las ventas nuevas se mostrarán aquí para el próximo cierre.
          </span>
        </motion.div>
      )}

      {mensaje.texto && (
        <motion.div
          className={`cierre-mensaje ${mensaje.tipo}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </motion.div>
      )}

      <div className="cierre-grid">
        {/* Panel de resumen */}
        <motion.div
          className="cierre-panel resumen"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2><ShoppingCart size={20} /> Resumen Registrado en Sistema</h2>
          
          <div className="resumen-cards">
            <div className="resumen-card">
              <ShoppingCart size={24} />
              <div>
                <p className="resumen-label">Ventas Registradas</p>
                <h3>{ventasHoy.length}</h3>
              </div>
            </div>

            <div className="resumen-card total">
              <TrendingUp size={24} />
              <div>
                <p className="resumen-label">Total Registrado en Sistema</p>
                <h3>{formatCOP(totalSistema)}</h3>
              </div>
            </div>
          </div>
          
          {/* Desglose por método de pago */}
          <div className="desglose-metodos">
            <h3>Desglose por Método</h3>
            <div className="metodo-item">
              <Banknote size={18} />
              <span>Efectivo registrado en sistema:</span>
              <strong>{formatCOP(desgloseSistema.efectivo)}</strong>
            </div>
            <div className="metodo-item">
              <Smartphone size={18} />
              <span>Transferencias registradas en sistema:</span>
              <strong>{formatCOP(desgloseSistema.transferencias)}</strong>
            </div>
            <div className="metodo-item">
              <CreditCard size={18} />
              <span>Tarjeta registrada en sistema:</span>
              <strong>{formatCOP(desgloseSistema.tarjeta)}</strong>
            </div>
            {desgloseSistema.mixto > 0 && (
              <div className="metodo-item">
                <DollarSign size={18} />
                <span>Mixto registrado en sistema:</span>
                <strong>{formatCOP(desgloseSistema.mixto)}</strong>
              </div>
            )}
          </div>

          <div className="ventas-lista">
            <h3>Ventas de Hoy</h3>
            {ventasHoy.length === 0 ? (
              <div className="no-ventas">
                <CheckCircle size={32} />
                <p>No hay ventas pendientes de cerrar</p>
                <small>Todas las ventas de hoy ya fueron cerradas</small>
              </div>
            ) : (
              <div className="ventas-scroll">{ventasHoy.map((venta, index) => (
                  <motion.div
                    key={venta.id}
                    className="venta-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="venta-hora">{formatHora(venta.created_at)}</div>
                    <div className="venta-metodo">
                      {getMetodoIcon(venta.metodo_pago)}
                      <span>{venta.metodo_pago}</span>
                    </div>
                    <div className="venta-total">{formatCOP(venta.total)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sección informativa de cotizaciones (no cuentan en totales) */}
          {cotizacionesHoy.length > 0 && (
            <div className="cotizaciones-lista" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={16} />
                Cotizaciones Pendientes (Informativo)
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                Estas cotizaciones no se cuentan en el cierre de caja hasta que se conviertan en ventas efectivas.
              </p>
              <div className="ventas-scroll" style={{ maxHeight: '200px' }}>
                {cotizacionesHoy.map((cotizacion, index) => (
                  <motion.div
                    key={cotizacion.id}
                    className="venta-item"
                    style={{ opacity: 0.7, backgroundColor: '#f9fafb' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 0.7, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="venta-hora">{formatHora(cotizacion.created_at)}</div>
                    <div className="venta-metodo">
                      <AlertCircle size={16} />
                      <span>Cotización</span>
                    </div>
                    <div className="venta-total" style={{ color: '#6b7280' }}>{formatCOP(cotizacion.total)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Panel de cierre */}
        <motion.div
          className="cierre-panel calculo"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2><Calculator size={20} /> Cierre Real</h2>

          <div className="calculo-container">
            {montoInicialApertura > 0 && (
              <div className="monto-inicial-info" style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1rem',
                border: '1px solid var(--border-primary)',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <DollarSign size={18} />
                  <strong>Monto Inicial de Apertura</strong>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                  {formatCOP(montoInicialApertura)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Este monto ya está incluido cuando cuentas el efectivo físico en caja
                </div>
              </div>
            )}
            
            <div className="input-group">
              <label>
                <Banknote size={20} />
                Efectivo Real en Caja
              </label>
              <input
                type="text"
                value={efectivoRealInput.displayValue}
                onChange={efectivoRealInput.handleChange}
                placeholder="0"
                inputMode="numeric"
                className="input-total-contado"
              />
              <span className="input-hint">Cuenta el efectivo físico en caja</span>
              <span className="sistema-vs-contado">Efectivo registrado en sistema: {formatCOP(desgloseSistema.efectivo)}</span>
            </div>
            
            <div className="input-group">
              <label>
                <Smartphone size={20} />
                Transferencias Reales Recibidas
              </label>
              <input
                type="text"
                value={transferenciasRealInput.displayValue}
                onChange={transferenciasRealInput.handleChange}
                placeholder="0"
                inputMode="numeric"
                className="input-total-contado"
              />
              <span className="input-hint">Verifica las transferencias recibidas</span>
              <span className="sistema-vs-contado">Transferencias registradas en sistema: {formatCOP(desgloseSistema.transferencias)}</span>
            </div>
            
            <div className="input-group">
              <label>
                <CreditCard size={20} />
                Pago con Tarjetas Real Recibido
              </label>
              <input
                type="text"
                value={tarjetaRealInput.displayValue}
                onChange={tarjetaRealInput.handleChange}
                placeholder="0"
                inputMode="numeric"
                className="input-total-contado"
              />
              <span className="input-hint">Verifica los pagos con tarjeta</span>
              <span className="sistema-vs-contado">Tarjeta registrada en sistema: {formatCOP(desgloseSistema.tarjeta)}</span>
            </div>
            
            {(efectivoRealInput.displayValue !== '' || transferenciasRealInput.displayValue !== '' || tarjetaRealInput.displayValue !== '') && (
              <div className="total-contado-calculado">
                <DollarSign size={20} />
                <span>Total Real:</span>
                <strong>{formatCOP(totalReal)}</strong>
              </div>
            )}

            {diferencia !== null && (
              <motion.div
                className={`diferencia-box ${diferencia === 0 ? 'exacto' : diferencia > 0 ? 'sobrante' : 'faltante'}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {diferencia === 0 ? (
                  <>
                    <CheckCircle size={32} />
                    <div>
                      <h3>¡Perfecto! Cuadra exacto</h3>
                      <p>No hay diferencias entre lo esperado (sistema + monto inicial) y el efectivo real</p>
                    </div>
                  </>
                ) : diferencia > 0 ? (
                  <>
                    <TrendingUp size={32} />
                    <div>
                      <h3>Sobrante: {formatCOP(Math.abs(diferencia))}</h3>
                      <p>Hay más efectivo del que indica el sistema</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={32} />
                    <div>
                      <h3>Faltante: {formatCOP(Math.abs(diferencia))}</h3>
                      <p>Hay menos efectivo del que indica el sistema</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <div className="comparacion-table">
              <div className="comparacion-row header">
                <span>Concepto</span>
                <span>Monto</span>
              </div>
              {montoInicialApertura > 0 && (
                <div className="comparacion-row">
                  <span><DollarSign size={16} /> Monto Inicial</span>
                  <span className="sistema">{formatCOP(montoInicialApertura)}</span>
                </div>
              )}
              <div className="comparacion-row">
                <span><TrendingUp size={16} /> Total Registrado en Sistema</span>
                <span className="sistema">{formatCOP(totalSistema)}</span>
              </div>
              {montoInicialApertura > 0 && (
                <div className="comparacion-row">
                  <span><Calculator size={16} /> Total Esperado (Sistema + Inicial)</span>
                  <span className="sistema">{formatCOP(totalSistema + montoInicialApertura)}</span>
                </div>
              )}
              <div className="comparacion-row">
                <span><DollarSign size={16} /> Total Real</span>
                <span className="contado">{formatCOP(totalReal)}</span>
              </div>
              {diferencia !== null && (
                <div className="comparacion-row total">
                  <span>{diferencia >= 0 ? <TrendingUp size={16} /> : <XCircle size={16} />} Diferencia</span>
                  <span className={diferencia >= 0 ? 'positivo' : 'negativo'}>
                    {diferencia >= 0 ? '+' : ''}{formatCOP(diferencia)}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn-guardar-cierre"
              onClick={guardarCierre}
              disabled={guardando || (efectivoRealInput.displayValue === '' && transferenciasRealInput.displayValue === '' && tarjetaRealInput.displayValue === '')}
            >
              <Save size={20} />
              {guardando ? 'Guardando...' : 'Guardar Cierre de Caja'}
            </button>

            {cierreGuardado && (
              <motion.div 
                className="botones-acciones"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  className="btn-accion compartir"
                  onClick={compartirCierre}
                  title="Compartir cierre"
                >
                  <Share2 size={18} />
                  Compartir
                </button>
                
                <button
                  className="btn-accion descargar"
                  onClick={descargarCierre}
                  title="Descargar cierre"
                >
                  <Download size={18} />
                  Descargar
                </button>
              </motion.div>
            )}

            <div className="cierre-nota">
              <AlertCircle size={16} />
              <p>
                <strong>Nota:</strong> El cierre de caja debe realizarse al final del día. 
                Asegúrate de contar todo el efectivo y verificar transferencias antes de guardar.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CierreCaja;
