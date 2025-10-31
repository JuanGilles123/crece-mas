import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Calculator, TrendingUp, DollarSign, ShoppingCart, AlertCircle, CheckCircle, XCircle, Save, Banknote, CreditCard, Smartphone, Share2, Download } from 'lucide-react';
import './CierreCaja.css';

const CierreCaja = () => {
  const { userProfile } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [totalSistema, setTotalSistema] = useState(0);
  const [efectivoReal, setEfectivoReal] = useState('');
  const [transferenciasReal, setTransferenciasReal] = useState('');
  const [tarjetaReal, setTarjetaReal] = useState('');
  const [mixtosReal, setMixtosReal] = useState('');
  const [totalReal, setTotalReal] = useState(0);
  const [diferencia, setDiferencia] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cierreGuardado, setCierreGuardado] = useState(false); // Nuevo estado para controlar los botones
  const [yaCerrado, setYaCerrado] = useState(false); // Nuevo estado para saber si ya se cerró hoy
  
  // Desglose por método de pago
  const [desgloseSistema, setDesgloseSistema] = useState({
    efectivo: 0,
    transferencias: 0,
    tarjeta: 0,
    mixto: 0
  });

  useEffect(() => {
    cargarVentasHoy();
  }, [userProfile?.organization_id]);

  // Función para formatear número con separador de miles
  const formatearNumero = (valor) => {
    if (!valor) return '';
    // Eliminar todo excepto números
    const numero = valor.toString().replace(/\D/g, '');
    // Formatear con puntos
    return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para obtener valor numérico limpio
  const obtenerValorNumerico = (valorFormateado) => {
    if (!valorFormateado) return 0;
    return parseFloat(valorFormateado.replace(/\./g, '')) || 0;
  };

  useEffect(() => {
    const efectivo = obtenerValorNumerico(efectivoReal);
    const transferencias = obtenerValorNumerico(transferenciasReal);
    const tarjeta = obtenerValorNumerico(tarjetaReal);
    const mixto = obtenerValorNumerico(mixtosReal);
    const total = efectivo + transferencias + tarjeta + mixto;
    setTotalReal(total);
    
    if (efectivoReal !== '' || transferenciasReal !== '' || tarjetaReal !== '' || mixtosReal !== '') {
      setDiferencia(total - totalSistema);
    } else {
      setDiferencia(null);
    }
  }, [efectivoReal, transferenciasReal, tarjetaReal, mixtosReal, totalSistema]);

  const cargarVentasHoy = async () => {
    if (!userProfile?.organization_id) return;

    setCargando(true);
    try {
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
        .gte('created_at', inicioHoy.toISOString());

      // 2. Si ya hay un cierre hoy, solo mostrar ventas posteriores al último cierre
      if (hayUltioCierre) {
        const ultimoCierre = cierresHoy[0].created_at;
        ventasQuery = ventasQuery.gt('created_at', ultimoCierre);
      }

      const { data, error } = await ventasQuery.order('created_at', { ascending: false });

      if (error) throw error;

      setVentasHoy(data || []);
      const total = data?.reduce((sum, venta) => sum + (venta.total || 0), 0) || 0;
      setTotalSistema(total);
      
      // Calcular desglose por método de pago
      const desglose = data?.reduce((acc, venta) => {
        const metodo = (venta.metodo_pago || 'Mixto').toLowerCase();
        if (metodo === 'efectivo') {
          acc.efectivo += venta.total || 0;
        } else if (metodo === 'transferencia') {
          acc.transferencias += venta.total || 0;
        } else if (metodo === 'tarjeta') {
          acc.tarjeta += venta.total || 0;
        } else {
          acc.mixto += venta.total || 0;
        }
        return acc;
      }, { efectivo: 0, transferencias: 0, tarjeta: 0, mixto: 0 });
      
      setDesgloseSistema(desglose || { efectivo: 0, transferencias: 0, tarjeta: 0, mixto: 0 });
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar las ventas del día' });
    } finally {
      setCargando(false);
    }
  };

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

📊 RESUMEN DEL SISTEMA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Efectivo: ${formatCOP(desgloseSistema.efectivo)}
📲 Transferencias: ${formatCOP(desgloseSistema.transferencias)}
💳 Tarjeta: ${formatCOP(desgloseSistema.tarjeta)}
💰 Mixto: ${formatCOP(desgloseSistema.mixto)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL SISTEMA: ${formatCOP(totalSistema)}

💼 CONTEO REAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Efectivo: ${formatCOP(parseFloat(efectivoReal) || 0)}
📲 Transferencias: ${formatCOP(parseFloat(transferenciasReal) || 0)}
💳 Tarjeta: ${formatCOP(parseFloat(tarjetaReal) || 0)}
💰 Mixto: ${formatCOP(parseFloat(mixtosReal) || 0)}
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
    if (efectivoReal === '' && transferenciasReal === '' && tarjetaReal === '' && mixtosReal === '') {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa al menos un monto' });
      return;
    }

    setGuardando(true);
    try {
      const { data, error } = await supabase
        .from('cierres_caja')
        .insert({
          organization_id: userProfile.organization_id,
          user_id: userProfile.user_id,
          fecha: new Date().toISOString().split('T')[0],
          // Desglose del sistema
          sistema_efectivo: desgloseSistema.efectivo,
          sistema_transferencias: desgloseSistema.transferencias,
          sistema_tarjeta: desgloseSistema.tarjeta,
          sistema_otros: desgloseSistema.mixto,
          total_sistema: totalSistema,
          // Desglose real contado
          real_efectivo: obtenerValorNumerico(efectivoReal),
          real_transferencias: obtenerValorNumerico(transferenciasReal),
          real_tarjeta: obtenerValorNumerico(tarjetaReal),
          real_otros: obtenerValorNumerico(mixtosReal),
          total_real: totalReal,
          // Diferencia y metadata
          diferencia: diferencia,
          cantidad_ventas: ventasHoy.length,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }
      setMensaje({ tipo: 'success', texto: 'Cierre de caja guardado correctamente' });
      setCierreGuardado(true); // Activar botones de compartir/descargar
      
      // Limpiar después de 3 segundos
      setTimeout(() => {
        setEfectivoReal('');
        setTransferenciasReal('');
        setTarjetaReal('');
        setMixtosReal('');
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
          <h2><ShoppingCart size={20} /> Resumen del Sistema</h2>
          
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
                <p className="resumen-label">Total Sistema</p>
                <h3>{formatCOP(totalSistema)}</h3>
              </div>
            </div>
          </div>
          
          {/* Desglose por método de pago */}
          <div className="desglose-metodos">
            <h3>Desglose por Método</h3>
            <div className="metodo-item">
              <Banknote size={18} />
              <span>Efectivo:</span>
              <strong>{formatCOP(desgloseSistema.efectivo)}</strong>
            </div>
            <div className="metodo-item">
              <Smartphone size={18} />
              <span>Transferencias:</span>
              <strong>{formatCOP(desgloseSistema.transferencias)}</strong>
            </div>
            <div className="metodo-item">
              <CreditCard size={18} />
              <span>Tarjeta:</span>
              <strong>{formatCOP(desgloseSistema.tarjeta)}</strong>
            </div>
            {desgloseSistema.mixto > 0 && (
              <div className="metodo-item">
                <DollarSign size={18} />
                <span>Mixto:</span>
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
            <div className="input-group">
              <label>
                <Banknote size={20} />
                Efectivo Real
              </label>
              <input
                type="text"
                value={efectivoReal}
                onChange={(e) => setEfectivoReal(formatearNumero(e.target.value))}
                placeholder="0"
                className="input-total-real"
              />
              <span className="input-hint">Cuenta el efectivo físico en caja</span>
              <span className="sistema-vs-real">Sistema: {formatCOP(desgloseSistema.efectivo)}</span>
            </div>
            
            <div className="input-group">
              <label>
                <Smartphone size={20} />
                Transferencias Real
              </label>
              <input
                type="text"
                value={transferenciasReal}
                onChange={(e) => setTransferenciasReal(formatearNumero(e.target.value))}
                placeholder="0"
                className="input-total-real"
              />
              <span className="input-hint">Verifica las transferencias recibidas</span>
              <span className="sistema-vs-real">Sistema: {formatCOP(desgloseSistema.transferencias)}</span>
            </div>
            
            <div className="input-group">
              <label>
                <CreditCard size={20} />
                Tarjeta Real
              </label>
              <input
                type="text"
                value={tarjetaReal}
                onChange={(e) => setTarjetaReal(formatearNumero(e.target.value))}
                placeholder="0"
                className="input-total-real"
              />
              <span className="input-hint">Verifica los pagos con tarjeta</span>
              <span className="sistema-vs-real">Sistema: {formatCOP(desgloseSistema.tarjeta)}</span>
            </div>
            
            <div className="input-group">
              <label>
                <DollarSign size={20} />
                Mixto Real
              </label>
              <input
                type="text"
                value={mixtosReal}
                onChange={(e) => setMixtosReal(formatearNumero(e.target.value))}
                placeholder="0"
                className="input-total-real"
              />
              <span className="input-hint">Pagos mixtos o combinados</span>
              <span className="sistema-vs-real">Sistema: {formatCOP(desgloseSistema.mixto)}</span>
            </div>
            
            {(efectivoReal !== '' || transferenciasReal !== '' || tarjetaReal !== '' || mixtosReal !== '') && (
              <div className="total-real-calculado">
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
                      <p>No hay diferencias entre el sistema y el efectivo real</p>
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
              <div className="comparacion-row">
                <span><TrendingUp size={16} /> Total Sistema</span>
                <span className="sistema">{formatCOP(totalSistema)}</span>
              </div>
              <div className="comparacion-row">
                <span><DollarSign size={16} /> Total Real</span>
                <span className="real">{formatCOP(totalReal)}</span>
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
              disabled={guardando || (efectivoReal === '' && transferenciasReal === '' && tarjetaReal === '' && mixtosReal === '')}
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
