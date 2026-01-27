import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  useGastosFijos, 
  useGastosVariables, 
  useProveedores, 
  useOrdenesCompra,
  useCreditosProveedores,
  useEstadisticasEgresos
} from '../../hooks/useEgresos';
import { 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  Plus,
  FileText,
  ShoppingCart,
  Building2,
  CreditCard,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProveedorModal from '../../components/modals/ProveedorModal';
import GastoFijoModal from '../../components/modals/GastoFijoModal';
import GastoVariableModal from '../../components/modals/GastoVariableModal';
import OrdenCompraModal from '../../components/modals/OrdenCompraModal';
import PagoProveedorModal from '../../components/modals/PagoProveedorModal';
import CreditoProveedorModal from '../../components/modals/CreditoProveedorModal';
import { 
  useEliminarProveedor, 
  useEliminarGastoFijo, 
  useEliminarGastoVariable,
  useEliminarOrdenCompra
} from '../../hooks/useEgresos';
import './Egresos.css';

function formatCOP(value) {
  try {
    return new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      maximumFractionDigits: 0 
    }).format(value);
  } catch {
    return "$" + value.toLocaleString("es-CO");
  }
}

export default function Egresos() {
  const { organization } = useAuth();
  const [pestañaActiva, setPestañaActiva] = useState('resumen');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalProveedor, setModalProveedor] = useState({ open: false, proveedor: null });
  const [modalGastoFijo, setModalGastoFijo] = useState({ open: false, gasto: null });
  const [modalGastoVariable, setModalGastoVariable] = useState({ open: false, gasto: null });
  const [modalOrdenCompra, setModalOrdenCompra] = useState({ open: false, orden: null });
  const [modalPagoProveedor, setModalPagoProveedor] = useState({ open: false, creditoId: null });
  const [modalCreditoProveedor, setModalCreditoProveedor] = useState({ open: false, credito: null, ordenCompraId: null });
  const eliminarProveedor = useEliminarProveedor();
  const eliminarGastoFijo = useEliminarGastoFijo();
  const eliminarGastoVariable = useEliminarGastoVariable();
  const eliminarOrdenCompra = useEliminarOrdenCompra();

  const { data: estadisticas } = useEstadisticasEgresos(organization?.id, 'mes');
  const { data: gastosFijos = [], isLoading: loadingFijos } = useGastosFijos(organization?.id, { activo: true });
  const { data: gastosVariables = [], isLoading: loadingVariables } = useGastosVariables(organization?.id);
  const { data: proveedores = [], isLoading: loadingProveedores } = useProveedores(organization?.id, { activo: true });
  const { data: ordenesCompra = [], isLoading: loadingOrdenes } = useOrdenesCompra(organization?.id, {
    estado: filtroEstado !== 'todos' ? filtroEstado : undefined
  });
  const { data: creditosProveedores = [], isLoading: loadingCreditos } = useCreditosProveedores(organization?.id, {
    estado: filtroEstado !== 'todos' ? filtroEstado : undefined
  });

  // Filtrar datos por búsqueda
  const proveedoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return proveedores;
    const query = busqueda.toLowerCase();
    return proveedores.filter(p => 
      p.nombre?.toLowerCase().includes(query) ||
      p.nit?.toLowerCase().includes(query) ||
      p.contacto_nombre?.toLowerCase().includes(query) ||
      p.telefono?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query)
    );
  }, [proveedores, busqueda]);

  const ordenesFiltradas = useMemo(() => {
    let filtradas = ordenesCompra;
    
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase();
      filtradas = filtradas.filter(o => 
        o.numero_orden?.toLowerCase().includes(query) ||
        o.proveedor?.nombre?.toLowerCase().includes(query) ||
        o.proveedor?.nit?.toLowerCase().includes(query)
      );
    }
    
    return filtradas;
  }, [ordenesCompra, busqueda]);

  if (!organization) {
    return (
      <div className="egresos-container">
        <div className="egresos-loading">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="egresos-container">
      <div className="egresos-header">
        <div>
          <h1>Gestión de Egresos</h1>
          <p>Administra gastos, proveedores y órdenes de compra</p>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="egresos-estadisticas">
          <div className="egreso-stat-card">
            <div className="egreso-stat-icon" style={{ background: '#fee2e2' }}>
              <TrendingDown size={24} color="#dc2626" />
            </div>
            <div className="egreso-stat-content">
              <p className="egreso-stat-label">Total Egresos (Mes)</p>
              <p className="egreso-stat-value">{formatCOP(estadisticas.totalEgresos)}</p>
            </div>
          </div>
          <div className="egreso-stat-card">
            <div className="egreso-stat-icon" style={{ background: '#fef3c7' }}>
              <DollarSign size={24} color="#d97706" />
            </div>
            <div className="egreso-stat-content">
              <p className="egreso-stat-label">Gastos Variables</p>
              <p className="egreso-stat-value">{formatCOP(estadisticas.totalGastosVariables)}</p>
              <p className="egreso-stat-subvalue">{estadisticas.cantidadGastosVariables} registros</p>
            </div>
          </div>
          <div className="egreso-stat-card">
            <div className="egreso-stat-icon" style={{ background: '#dbeafe' }}>
              <Calendar size={24} color="#1e40af" />
            </div>
            <div className="egreso-stat-content">
              <p className="egreso-stat-label">Gastos Fijos (Proy.)</p>
              <p className="egreso-stat-value">{formatCOP(estadisticas.totalGastosFijos)}</p>
              <p className="egreso-stat-subvalue">{estadisticas.cantidadGastosFijos} activos</p>
            </div>
          </div>
          <div className="egreso-stat-card egreso-stat-card-danger">
            <div className="egreso-stat-icon" style={{ background: '#fee2e2' }}>
              <AlertCircle size={24} color="#dc2626" />
            </div>
            <div className="egreso-stat-content">
              <p className="egreso-stat-label">Créditos Pendientes</p>
              <p className="egreso-stat-value">{formatCOP(estadisticas.totalCreditosPendientes)}</p>
              <p className="egreso-stat-subvalue">{estadisticas.cantidadCreditos} créditos</p>
            </div>
          </div>
        </div>
      )}

      {/* Pestañas */}
      <div className="egresos-tabs">
        <button
          className={`egreso-tab ${pestañaActiva === 'resumen' ? 'active' : ''}`}
          onClick={() => setPestañaActiva('resumen')}
        >
          <FileText size={16} />
          Resumen
        </button>
        <button
          className={`egreso-tab ${pestañaActiva === 'gastos-fijos' ? 'active' : ''}`}
          onClick={() => setPestañaActiva('gastos-fijos')}
        >
          <Calendar size={16} />
          Gastos Fijos ({gastosFijos.length})
        </button>
        <button
          className={`egreso-tab ${pestañaActiva === 'gastos-variables' ? 'active' : ''}`}
          onClick={() => setPestañaActiva('gastos-variables')}
        >
          <DollarSign size={16} />
          Gastos Variables ({gastosVariables.length})
        </button>
        <button
          className={`egreso-tab ${pestañaActiva === 'proveedores' ? 'active' : ''}`}
          onClick={() => setPestañaActiva('proveedores')}
        >
          <Building2 size={16} />
          Proveedores ({proveedores.length})
        </button>
        <button
          className={`egreso-tab ${pestañaActiva === 'ordenes-compra' ? 'active' : ''}`}
          onClick={() => setPestañaActiva('ordenes-compra')}
        >
          <ShoppingCart size={16} />
          Órdenes de Compra ({ordenesCompra.length})
        </button>
        <button
          className={`egreso-tab ${pestañaActiva === 'creditos-proveedores' ? 'active' : ''}`}
          onClick={() => setPestañaActiva('creditos-proveedores')}
        >
          <CreditCard size={16} />
          Créditos Proveedores ({creditosProveedores.length})
        </button>
      </div>

      {/* Contenido de pestañas */}
      <div className="egresos-content">
        {pestañaActiva === 'resumen' && (
          <div className="egresos-resumen">
            <h2>Resumen de Egresos</h2>
            <p>Vista general de todos los egresos del mes actual</p>
            {/* Aquí irá el resumen detallado */}
          </div>
        )}

        {pestañaActiva === 'gastos-fijos' && (
          <div className="egresos-gastos-fijos">
            <div className="egresos-section-header">
              <h2>Gastos Fijos</h2>
              <button 
                className="egreso-btn egreso-btn-primary"
                onClick={() => setModalGastoFijo({ open: true, gasto: null })}
              >
                <Plus size={16} />
                Nuevo Gasto Fijo
              </button>
            </div>
            {loadingFijos ? (
              <div className="egresos-loading">
                <p>Cargando gastos fijos...</p>
              </div>
            ) : gastosFijos.length === 0 ? (
              <div className="egresos-empty">
                <Calendar size={48} color="#9ca3af" />
                <p>No hay gastos fijos registrados</p>
              </div>
            ) : (
              <div className="egresos-lista">
                {gastosFijos.map(gasto => (
                  <div key={gasto.id} className="egreso-card">
                    <div className="egreso-card-header">
                      <h3>{gasto.nombre}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {gasto.activo && <span className="egreso-badge egreso-badge-activo">Activo</span>}
                        <button
                          className="egreso-btn-icon"
                          onClick={() => setModalGastoFijo({ open: true, gasto })}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="egreso-btn-icon egreso-btn-icon-danger"
                          onClick={async () => {
                            if (window.confirm('¿Estás seguro de eliminar este gasto fijo?')) {
                              await eliminarGastoFijo.mutateAsync({
                                id: gasto.id,
                                organizationId: organization.id
                              });
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="egreso-card-body">
                      <p><strong>Monto:</strong> {formatCOP(gasto.monto)}</p>
                      <p><strong>Frecuencia:</strong> {gasto.frecuencia}</p>
                      {gasto.proveedor && <p><strong>Proveedor:</strong> {gasto.proveedor.nombre}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'gastos-variables' && (
          <div className="egresos-gastos-variables">
            <div className="egresos-section-header">
              <h2>Gastos Variables</h2>
              <button 
                className="egreso-btn egreso-btn-primary"
                onClick={() => setModalGastoVariable({ open: true, gasto: null })}
              >
                <Plus size={16} />
                Nuevo Gasto Variable
              </button>
            </div>
            {loadingVariables ? (
              <div className="egresos-loading">
                <p>Cargando gastos variables...</p>
              </div>
            ) : gastosVariables.length === 0 ? (
              <div className="egresos-empty">
                <DollarSign size={48} color="#9ca3af" />
                <p>No hay gastos variables registrados</p>
              </div>
            ) : (
              <div className="egresos-lista">
                {gastosVariables.map(gasto => (
                  <div key={gasto.id} className="egreso-card">
                    <div className="egreso-card-header">
                      <h3>{gasto.nombre}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="egreso-fecha">{format(new Date(gasto.fecha), "dd/MM/yyyy", { locale: es })}</span>
                        <button
                          className="egreso-btn-icon"
                          onClick={() => setModalGastoVariable({ open: true, gasto })}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="egreso-btn-icon egreso-btn-icon-danger"
                          onClick={async () => {
                            if (window.confirm('¿Estás seguro de eliminar este gasto variable?')) {
                              await eliminarGastoVariable.mutateAsync({
                                id: gasto.id,
                                organizationId: organization.id
                              });
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="egreso-card-body">
                      <p><strong>Monto:</strong> {formatCOP(gasto.monto)}</p>
                      {gasto.proveedor && <p><strong>Proveedor:</strong> {gasto.proveedor.nombre}</p>}
                      {gasto.categoria && <p><strong>Categoría:</strong> {gasto.categoria.nombre}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'proveedores' && (
          <div className="egresos-proveedores">
            <div className="egresos-section-header">
              <h2>Proveedores</h2>
              <button 
                className="egreso-btn egreso-btn-primary"
                onClick={() => setModalProveedor({ open: true, proveedor: null })}
              >
                <Plus size={16} />
                Nuevo Proveedor
              </button>
            </div>
            <div className="egresos-filtros">
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="egresos-search-input"
              />
            </div>
            {loadingProveedores ? (
              <div className="egresos-loading">
                <p>Cargando proveedores...</p>
              </div>
            ) : proveedoresFiltrados.length === 0 ? (
              <div className="egresos-empty">
                <Building2 size={48} color="#9ca3af" />
                <p>No se encontraron proveedores</p>
              </div>
            ) : (
              <div className="egresos-lista">
                {proveedoresFiltrados.map(proveedor => (
                  <div key={proveedor.id} className="egreso-card">
                    <div className="egreso-card-header">
                      <h3>{proveedor.nombre}</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {proveedor.activo && <span className="egreso-badge egreso-badge-activo">Activo</span>}
                        <button
                          className="egreso-btn-icon"
                          onClick={() => setModalProveedor({ open: true, proveedor })}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="egreso-btn-icon egreso-btn-icon-danger"
                          onClick={async () => {
                            if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
                              await eliminarProveedor.mutateAsync({
                                id: proveedor.id,
                                organizationId: organization.id
                              });
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="egreso-card-body">
                      {proveedor.nit && <p><strong>NIT:</strong> {proveedor.nit}</p>}
                      {proveedor.contacto_nombre && <p><strong>Contacto:</strong> {proveedor.contacto_nombre}</p>}
                      {proveedor.telefono && <p><strong>Teléfono:</strong> {proveedor.telefono}</p>}
                      {proveedor.email && <p><strong>Email:</strong> {proveedor.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'ordenes-compra' && (
          <div className="egresos-ordenes-compra">
            <div className="egresos-section-header">
              <h2>Órdenes de Compra</h2>
              <button 
                className="egreso-btn egreso-btn-primary"
                onClick={() => setModalOrdenCompra({ open: true, orden: null })}
              >
                <Plus size={16} />
                Nueva Orden de Compra
              </button>
            </div>
            <div className="egresos-filtros">
              <input
                type="text"
                placeholder="Buscar orden de compra..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="egresos-search-input"
              />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="egresos-select-filtro"
              >
                <option value="todos">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aprobada">Aprobada</option>
                <option value="recibida">Recibida</option>
                <option value="facturada">Facturada</option>
              </select>
            </div>
            {loadingOrdenes ? (
              <div className="egresos-loading">
                <p>Cargando órdenes de compra...</p>
              </div>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="egresos-empty">
                <ShoppingCart size={48} color="#9ca3af" />
                <p>No se encontraron órdenes de compra</p>
              </div>
            ) : (
              <div className="egresos-lista">
                {ordenesFiltradas.map(orden => (
                  <div key={orden.id} className="egreso-card">
                    <div className="egreso-card-header">
                      <div>
                        <h3>Orden {orden.numero_orden}</h3>
                        <p className="egreso-card-meta">
                          {orden.proveedor?.nombre && <span>Proveedor: {orden.proveedor.nombre}</span>}
                          <span>Fecha: {format(new Date(orden.fecha_orden), "dd/MM/yyyy", { locale: es })}</span>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`egreso-badge egreso-badge-${orden.estado}`} title={
                          orden.estado === 'borrador' ? 'Orden en proceso, no enviada al proveedor' :
                          orden.estado === 'enviada' ? 'Orden enviada al proveedor' :
                          orden.estado === 'aprobada' ? 'Orden aprobada por el proveedor' :
                          orden.estado === 'recibida' ? 'Orden recibida físicamente' :
                          orden.estado === 'facturada' ? 'Orden facturada' :
                          orden.estado === 'cancelada' ? 'Orden cancelada' : ''
                        }>
                          {orden.estado === 'borrador' && '📝 Borrador'}
                          {orden.estado === 'enviada' && '📤 Enviada'}
                          {orden.estado === 'aprobada' && '✅ Aprobada'}
                          {orden.estado === 'recibida' && '📦 Recibida'}
                          {orden.estado === 'facturada' && '🧾 Facturada'}
                          {orden.estado === 'cancelada' && '❌ Cancelada'}
                          {!['borrador', 'enviada', 'aprobada', 'recibida', 'facturada', 'cancelada'].includes(orden.estado) && orden.estado}
                        </span>
                        {orden.estado === 'borrador' && (
                          <button
                            className="egreso-btn-icon egreso-btn-icon-blue"
                            onClick={() => setModalOrdenCompra({ open: true, orden })}
                            title="Continuar orden"
                          >
                            <Edit size={18} strokeWidth={2.5} />
                          </button>
                        )}
                        {orden.estado !== 'borrador' && (
                          <button
                            className="egreso-btn-icon"
                            onClick={() => setModalOrdenCompra({ open: true, orden })}
                            title="Ver orden"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button
                          className="egreso-btn-icon egreso-btn-icon-danger"
                          onClick={async () => {
                            if (window.confirm(`¿Estás seguro de eliminar la orden ${orden.numero_orden}? Esta acción no se puede deshacer.`)) {
                              try {
                                await eliminarOrdenCompra.mutateAsync({
                                  id: orden.id,
                                  organizationId: organization.id
                                });
                              } catch (error) {
                                console.error('Error al eliminar orden:', error);
                                alert('Error al eliminar la orden. Por favor, intenta nuevamente.');
                              }
                            }
                          }}
                          title="Eliminar orden"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="egreso-card-body">
                      <p><strong>Total:</strong> {formatCOP(orden.total)}</p>
                      {orden.items && <p><strong>Items:</strong> {orden.items.length}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === 'creditos-proveedores' && (
          <div className="egresos-creditos-proveedores">
            <div className="egresos-section-header">
              <h2>Créditos con Proveedores</h2>
              <button 
                className="egreso-btn egreso-btn-primary"
                onClick={() => setModalCreditoProveedor({ open: true, credito: null, ordenCompraId: null })}
              >
                <Plus size={16} />
                Nuevo Crédito
              </button>
            </div>
            <div className="egresos-filtros">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="egresos-select-filtro"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="parcial">Parciales</option>
                <option value="pagado">Pagados</option>
                <option value="vencido">Vencidos</option>
              </select>
            </div>
            {loadingCreditos ? (
              <div className="egresos-loading">
                <p>Cargando créditos...</p>
              </div>
            ) : creditosProveedores.length === 0 ? (
              <div className="egresos-empty">
                <CreditCard size={48} color="#9ca3af" />
                <p>No se encontraron créditos con proveedores</p>
              </div>
            ) : (
              <div className="egresos-lista">
                {creditosProveedores.map(credito => (
                  <div key={credito.id} className="egreso-card">
                    <div className="egreso-card-header">
                      <div>
                        <h3>{credito.proveedor?.nombre || 'Proveedor'}</h3>
                        <p className="egreso-card-meta">
                          {credito.factura_numero && <span>Factura: {credito.factura_numero}</span>}
                          {credito.fecha_vencimiento && (
                            <span>Vence: {format(new Date(credito.fecha_vencimiento), "dd/MM/yyyy", { locale: es })}</span>
                          )}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`egreso-badge egreso-badge-${credito.estado}`}>
                          {credito.estado}
                        </span>
                        {credito.monto_pendiente > 0 && (
                          <button
                            className="egreso-btn egreso-btn-primary"
                            onClick={() => setModalPagoProveedor({ open: true, creditoId: credito.id })}
                            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                          >
                            Registrar Pago
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="egreso-card-body">
                      <div className="egreso-montos">
                        <div className="egreso-monto-item">
                          <span className="egreso-monto-label">Total:</span>
                          <span className="egreso-monto-value">{formatCOP(credito.monto_total)}</span>
                        </div>
                        <div className="egreso-monto-item">
                          <span className="egreso-monto-label">Pagado:</span>
                          <span className="egreso-monto-value egreso-monto-pagado">
                            {formatCOP(credito.monto_pagado)}
                          </span>
                        </div>
                        <div className="egreso-monto-item">
                          <span className="egreso-monto-label">Pendiente:</span>
                          <span className="egreso-monto-value egreso-monto-pendiente">
                            {formatCOP(credito.monto_pendiente)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <ProveedorModal
        open={modalProveedor.open}
        onClose={() => setModalProveedor({ open: false, proveedor: null })}
        proveedor={modalProveedor.proveedor}
      />
      <GastoFijoModal
        open={modalGastoFijo.open}
        onClose={() => setModalGastoFijo({ open: false, gasto: null })}
        gasto={modalGastoFijo.gasto}
      />
      <GastoVariableModal
        open={modalGastoVariable.open}
        onClose={() => setModalGastoVariable({ open: false, gasto: null })}
        gasto={modalGastoVariable.gasto}
      />
      <OrdenCompraModal
        open={modalOrdenCompra.open}
        onClose={() => setModalOrdenCompra({ open: false, orden: null })}
        orden={modalOrdenCompra.orden}
      />
      <PagoProveedorModal
        open={modalPagoProveedor.open}
        onClose={() => setModalPagoProveedor({ open: false, creditoId: null })}
        creditoId={modalPagoProveedor.creditoId}
      />
      <CreditoProveedorModal
        open={modalCreditoProveedor.open}
        onClose={() => setModalCreditoProveedor({ open: false, credito: null, ordenCompraId: null })}
        credito={modalCreditoProveedor.credito}
        ordenCompraId={modalCreditoProveedor.ordenCompraId}
      />
    </div>
  );
}
