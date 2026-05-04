import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  RefreshCw, 
  User as UserIcon,
  Power
} from 'lucide-react';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import LottieLoader from '../../components/ui/LottieLoader';
import toast from 'react-hot-toast';
import { X, Receipt, Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';
import './MonitorCajas.css';

const MonitorCajas = () => {
  const { user, organization, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aperturas, setAperturas] = useState([]);
  const [sesionDetalle, setSesionDetalle] = useState(null);
  const [stats, setStats] = useState({
    totalActivas: 0,
    totalVendido: 0,
    masAntigua: null
  });

  const fetchMonitorData = useCallback(async () => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      // 1. Obtener todas las aperturas abiertas de la organización
      // Cambiamos a consulta simple sin join porque falta la Foreign Key en el schema
      const { data: aperturasData, error: errorAperturas } = await supabase
        .from('aperturas_caja')
        .select('*')
        .eq('organization_id', organization.id)
        .is('cierre_id', null);

      if (errorAperturas) throw errorAperturas;

      if (!aperturasData || aperturasData.length === 0) {
        setAperturas([]);
        setStats({ totalActivas: 0, totalVendido: 0, masAntigua: null });
        setLoading(false);
        return;
      }

      // 2. Obtener datos de empleados y usuarios por separado
      const employeeIds = aperturasData.map(a => a.employee_id).filter(Boolean);
      const userIds = aperturasData.map(a => a.user_id).filter(Boolean);

      const [ { data: employeesAuth }, { data: profiles } ] = await Promise.all([
        supabase.from('employees').select('id, team_member_id, code').in('id', employeeIds),
        supabase.from('user_profiles').select('id, user_id, full_name, email').in('user_id', userIds)
      ]);

      let teamMembers = [];
      if (employeesAuth && employeesAuth.length > 0) {
        const teamMemberIds = employeesAuth.map(e => e.team_member_id).filter(Boolean);
        if (teamMemberIds.length > 0) {
          const { data } = await supabase.from('team_members').select('id, employee_name').in('id', teamMemberIds);
          teamMembers = data || [];
        }
      }

      const teamMemberMap = new Map(teamMembers.map(t => [t.id, t.employee_name]));
      const employeeMap = new Map(employeesAuth?.map(e => [e.id, teamMemberMap.get(e.team_member_id) || `Empleado ${e.code}`]));
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // 3. Para cada apertura, calcular su total de ventas actual
      const aperturasConVentas = await Promise.all(aperturasData.map(async (apertura) => {
        // Consultar ventas para esta apertura específica (desde su fecha de creación)
        const { data: ventas, error: errorVentas } = await supabase
          .from('ventas')
          .select('total, metodo_pago, estado, numero_venta, created_at, detalles_pago_mixto, items')
          .eq('organization_id', organization.id)
          .gte('created_at', apertura.created_at)
          .neq('metodo_pago', 'COTIZACION')
          .neq('estado', 'cancelada')
          .neq('estado', 'cotizacion');

        if (errorVentas) console.error('Error fetching ventas for monitor:', errorVentas);

        const ventasReales = ventas || [];
        const totalVendido = ventasReales.reduce((sum, v) => sum + (v.total || 0), 0);
        
        // Calcular desglose de métodos de pago
        const desgloseMetodos = {
          Efectivo: 0,
          Transferencia: 0,
          Tarjeta: 0,
          Nequi: 0,
          Credito: 0
        };

        ventasReales.forEach(venta => {
          if (venta.metodo_pago === 'Mixto' && venta.detalles_pago_mixto) {
            try {
              const detalles = typeof venta.detalles_pago_mixto === 'string' 
                ? JSON.parse(venta.detalles_pago_mixto) 
                : venta.detalles_pago_mixto;
              
              if (detalles.metodos) {
                detalles.metodos.forEach(m => {
                  if (desgloseMetodos[m.metodo] !== undefined) {
                    desgloseMetodos[m.metodo] += (m.monto || 0);
                  }
                });
              }
            } catch (e) {
              console.error("Error parseando pago mixto:", e);
            }
          } else if (desgloseMetodos[venta.metodo_pago] !== undefined) {
            desgloseMetodos[venta.metodo_pago] += (venta.total || 0);
          }
        });
        
        const perfilUsuario = profileMap.get(apertura.user_id);
        const nombreEmpleado = employeeMap.get(apertura.employee_id);

        let labelIdentidad = 'Sesión sin identificar';
        
        if (nombreEmpleado) {
          labelIdentidad = nombreEmpleado;
        } else if (apertura.user_id === userProfile?.user_id || apertura.user_id === userProfile?.id) {
          labelIdentidad = userProfile?.full_name || userProfile?.email || 'Tú (Dueño)';
        } else if (perfilUsuario?.full_name) {
          labelIdentidad = perfilUsuario.full_name;
        } else if (perfilUsuario?.email) {
          labelIdentidad = perfilUsuario.email;
        } else if (apertura.user_id) {
          labelIdentidad = `Usuario (ID: ${apertura.user_id.substring(0, 8)})`;
        } else {
          labelIdentidad = 'Sesión antigua o sin ID';
        }

        return {
          ...apertura,
          totalVendido,
          numVentas: ventasReales.length,
          ventasRecientes: ventasReales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), // Todas las ventas
          desgloseMetodos,
          empleado: { employee_name: nombreEmpleado },
          usuario: perfilUsuario,
          labelIdentidad
        };
      }));

      setAperturas(aperturasConVentas);
      
      // 3. Calcular estadísticas globales
      const totalVendidoGlobal = aperturasConVentas.reduce((sum, a) => sum + a.totalVendido, 0);
      const masAntigua = aperturasConVentas.length > 0 
        ? [...aperturasConVentas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
        : null;

      setStats({
        totalActivas: aperturasConVentas.length,
        totalVendido: totalVendidoGlobal,
        masAntigua: masAntigua?.created_at
      });

    } catch (err) {
      console.error('Error en Monitor de Cajas:', err);
      toast.error('No se pudo cargar el monitor de sesiones');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, userProfile?.user_id, userProfile?.id, userProfile?.full_name, userProfile?.email]);

  useEffect(() => {
    fetchMonitorData();
    
    // Suscripción en tiempo real a cambios en aperturas o ventas
    const channel = supabase
      .channel('monitor-cajas-changes')
      .on('postgres_changes', { event: '*', table: 'aperturas_caja', schema: 'public' }, () => fetchMonitorData())
      .on('postgres_changes', { event: '*', table: 'ventas', schema: 'public' }, () => fetchMonitorData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonitorData]);

  const handleForzarCierre = async (apertura) => {
    const nombre = apertura.empleado?.employee_name || apertura.usuario?.full_name || 'este usuario';
    const confirmar = window.confirm(`¿Estás seguro de forzar el cierre de la caja de ${nombre}? El usuario deberá abrir una nueva caja para seguir vendiendo.`);
    
    if (!confirmar) return;

    try {
      // Crear un cierre de emergencia
      const { data: nuevoCierre, error: errorCierre } = await supabase
        .from('cierres_caja')
        .insert({
          organization_id: organization.id,
          user_id: user.id, // Corrección: user.id en lugar de userProfile.id para FK constraints
          employee_id: apertura.employee_id,
          total_sistema: apertura.totalVendido,
          total_real: apertura.totalVendido,
          diferencia: 0,
          cantidad_ventas: apertura.numVentas,
          sistema_efectivo: apertura.desgloseMetodos?.Efectivo || 0,
          sistema_transferencias: (apertura.desgloseMetodos?.Transferencia || 0) + (apertura.desgloseMetodos?.Nequi || 0),
          sistema_tarjeta: apertura.desgloseMetodos?.Tarjeta || 0,
          sistema_otros: apertura.desgloseMetodos?.Credito || 0,
          real_efectivo: apertura.desgloseMetodos?.Efectivo || 0,
          real_transferencias: (apertura.desgloseMetodos?.Transferencia || 0) + (apertura.desgloseMetodos?.Nequi || 0),
          real_tarjeta: apertura.desgloseMetodos?.Tarjeta || 0,
          real_otros: apertura.desgloseMetodos?.Credito || 0,
          notas: "CIERRE FORZADO POR ADMINISTRADOR DESDE MONITOR",
          fecha: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (errorCierre) throw errorCierre;

      // Actualizar la apertura
      const { error: errorUpdateApertura } = await supabase
        .from('aperturas_caja')
        .update({ cierre_id: nuevoCierre.id, estado: 'cerrada', updated_at: new Date().toISOString() })
        .eq('id', apertura.id);

      if (errorUpdateApertura) throw errorUpdateApertura;

      toast.success('Cierre forzado exitosamente');
      fetchMonitorData();
    } catch (err) {
      console.error('Error forzando cierre:', err);
      toast.error('Error al forzar el cierre');
    }
  };

  const calcularTiempoTranscurrido = (fecha) => {
    const inicio = new Date(fecha);
    const ahora = new Date();
    const difMs = ahora - inicio;
    const horas = Math.floor(difMs / (1000 * 60 * 60));
    const minutos = Math.floor((difMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas === 0) return `${minutos}m`;
    return `${horas}h ${minutos}m`;
  };

  const getMetodoIcon = (metodo) => {
    switch (metodo) {
      case 'Efectivo': return <Banknote size={16} />;
      case 'Transferencia': return <Wallet size={16} />;
      case 'Nequi': return <Smartphone size={16} />;
      case 'Tarjeta': return <CreditCard size={16} />;
      case 'Credito': return <Receipt size={16} />;
      default: return <Wallet size={16} />;
    }
  };

  if (loading && aperturas.length === 0) {
    return (
      <div className="loading-container">
        <LottieLoader size="large" />
        <p>Analizando sesiones activas...</p>
      </div>
    );
  }

  return (
    <div className="monitor-cajas">
      <header className="monitor-header">
        <div>
          <h1>Monitor de Sesiones</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Supervisión de cajas abiertas en tiempo real</p>
        </div>
        <button className="btn-accion secondary" onClick={fetchMonitorData} title="Refrescar">
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
        </button>
      </header>

      <div className="monitor-stats">
        <div className="stat-card">
          <span>Cajas Activas</span>
          <strong>{stats.totalActivas}</strong>
        </div>
        <div className="stat-card">
          <span>Vendido en Sesiones</span>
          <strong style={{ color: 'var(--accent-success)' }}>
            ${stats.totalVendido.toLocaleString('es-CO')}
          </strong>
        </div>
        <div className="stat-card">
          <span>Caja más antigua</span>
          <strong>{stats.masAntigua ? calcularTiempoTranscurrido(stats.masAntigua) : '--'}</strong>
        </div>
      </div>

      <div className="sessions-grid">
        <AnimatePresence>
          {aperturas.map((apertura) => (
            <motion.div 
              key={apertura.id}
              className="session-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="session-card-header">
                <div className="user-avatar">
                  <UserIcon size={24} />
                </div>
                <div className="user-info">
                  <h3>{apertura.labelIdentidad}</h3>
                  <p>{apertura.usuario?.email ? (apertura.empleado?.employee_name ? apertura.usuario.email : 'Sesión de usuario') : 'Sesión de empleado'}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`status-badge ${apertura.is_synced ? 'synced' : 'active'}`}>
                    {apertura.is_synced ? 'Sincronizada' : 'Independiente'}
                  </span>
                </div>
              </div>

              <div className="session-card-body">
                <div className="data-row">
                  <span className="label"><Clock size={16} /> Iniciada</span>
                  <span className="value">
                    {new Date(apertura.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}, {new Date(apertura.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="data-row">
                  <span className="label"><RefreshCw size={16} /> Transcurrido</span>
                  <span className="value">{calcularTiempoTranscurrido(apertura.created_at)}</span>
                </div>
                <div className="data-row" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                  <span className="label">Ventas registradas</span>
                  <span className="value">{apertura.numVentas}</span>
                </div>
                <div className="data-row">
                  <span className="label">Total acumulado</span>
                  <span className="value" style={{ color: 'var(--accent-success)', fontSize: '1.2rem' }}>
                    ${apertura.totalVendido.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              <div className="session-card-footer">
                <button 
                  className="btn-accion secondary"
                  style={{ marginRight: '1rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => setSesionDetalle(apertura)}
                >
                  <Receipt size={16} />
                  Ver Detalle
                </button>
                <button 
                  className="btn-force-close"
                  onClick={() => handleForzarCierre(apertura)}
                >
                  <Power size={16} />
                  Forzar Cierre
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {aperturas.length === 0 && (
          <div className="no-sessions" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <Users size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
            <h3>No hay cajas abiertas en este momento</h3>
            <p style={{ color: '#64748b' }}>Cuando un empleado abra su caja, aparecerá aquí automáticamente.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles de Sesión */}
      <AnimatePresence>
        {sesionDetalle && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSesionDetalle(null)}
            style={{ zIndex: 1000 }}
          >
            <motion.div 
              className="modal-content detalle-sesion-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '900px', width: '95%', padding: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>Detalle de Sesión</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>{sesionDetalle.labelIdentidad}</p>
                </div>
                <button 
                  onClick={() => setSesionDetalle(null)}
                  style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <div className="detalle-seccion">
                  <h3 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>Desglose Financiero</h3>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Transacciones</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{sesionDetalle.numVentas}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Tiempo Activo</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{calcularTiempoTranscurrido(sesionDetalle.created_at)}</div>
                    </div>
                  </div>

                  <div className="desglose-grid" style={{ display: 'grid', gap: '0.75rem' }}>
                    {Object.entries(sesionDetalle.desgloseMetodos)
                      .filter(([_, monto]) => monto > 0)
                      .map(([metodo, monto]) => (
                      <div key={metodo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', fontWeight: '600', fontSize: '1.05rem' }}>
                          {getMetodoIcon(metodo)}
                          {metodo}
                        </div>
                        <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>${monto.toLocaleString('es-CO')}</strong>
                      </div>
                    ))}
                    {Object.values(sesionDetalle.desgloseMetodos).every(m => m === 0) && (
                      <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
                        No hay ventas registradas aún
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1.5rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontWeight: '700', color: '#166534', textTransform: 'uppercase', fontSize: '1rem' }}>Total Acumulado</span>
                    <strong style={{ fontSize: '2rem', color: '#15803d', lineHeight: '1' }}>${sesionDetalle.totalVendido.toLocaleString('es-CO')}</strong>
                  </div>
                </div>

                <div className="detalle-seccion">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0 }}>Historial de Ventas</h3>
                    <span style={{ fontSize: '0.9rem', color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                      {sesionDetalle.ventasRecientes?.length || 0} registros
                    </span>
                  </div>
                
                {sesionDetalle.ventasRecientes && sesionDetalle.ventasRecientes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {sesionDetalle.ventasRecientes.map((venta, idx) => (
                      <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#334155' }}>Venta #{venta.numero_venta}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {new Date(venta.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {venta.metodo_pago}
                            </div>
                          </div>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem' }}>
                            ${(venta.total || 0).toLocaleString('es-CO')}
                          </div>
                        </div>
                        
                        {/* Listado de Productos (Resumen) */}
                        {venta.items && Array.isArray(venta.items) && venta.items.length > 0 && (
                          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', listStyleType: 'disc' }}>
                              {venta.items.slice(0, 3).map((item, i) => (
                                <li key={i}>{item.cantidad}x {item.nombre}</li>
                              ))}
                              {venta.items.length > 3 && (
                                <li style={{ color: '#94a3b8', fontStyle: 'italic', listStyleType: 'none', marginLeft: '-1.2rem', marginTop: '0.2rem' }}>
                                  + {venta.items.length - 3} producto(s) más...
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No hay transacciones recientes</p>
                )}
              </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MonitorCajas;
