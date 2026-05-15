import React, { useState, useMemo } from 'react';
import { X, Calendar, ArrowUpRight, ArrowDownLeft, Search, Filter, FileText } from 'lucide-react';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useAuth } from '../../context/AuthContext';
import LottieLoader from '../ui/LottieLoader';
import './MovimientosStockModal.css';

const MovimientosStockModal = ({ open, onClose, producto, varianteId = null }) => {
  const { organization } = useAuth();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const filters = useMemo(() => ({
    organizationId: organization?.id,
    productoId: producto?.id,
    varianteId,
    fechaInicio: fechaInicio ? `${fechaInicio}T00:00:00` : null,
    fechaFin: fechaFin ? `${fechaFin}T23:59:59` : null,
    tipo: filtroTipo
  }), [organization?.id, producto?.id, varianteId, fechaInicio, fechaFin, filtroTipo]);

  const { data: movimientos = [], isLoading } = useStockMovements(filters);

  const movimientosFiltrados = useMemo(() => {
    if (!busqueda) return movimientos;
    const lowSearch = busqueda.toLowerCase();
    return movimientos.filter(mov =>
      (mov.notas && mov.notas.toLowerCase().includes(lowSearch)) ||
      (mov.usuario_nombre && mov.usuario_nombre.toLowerCase().includes(lowSearch)) ||
      (mov.usuario?.full_name && mov.usuario.full_name.toLowerCase().includes(lowSearch))
    );
  }, [movimientos, busqueda]);

  if (!open) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoBadge = (tipo, cantidad) => {
    switch (tipo) {
      case 'entrada':
        return <span className="ms-badge ms-badge-success"><ArrowUpRight size={12} /> Entrada</span>;
      case 'venta':
        return <span className="ms-badge ms-badge-danger"><ArrowDownLeft size={12} /> Venta</span>;
      case 'salida':
        return <span className="ms-badge ms-badge-danger"><ArrowDownLeft size={12} /> Salida</span>;
      case 'ajuste':
        return cantidad >= 0
          ? <span className="ms-badge ms-badge-ajuste-up"><ArrowUpRight size={12} /> Ajuste ↑</span>
          : <span className="ms-badge ms-badge-warning"><ArrowDownLeft size={12} /> Ajuste ↓</span>;
      case 'devolucion':
        return <span className="ms-badge ms-badge-info">Devolución</span>;
      default:
        return <span className="ms-badge">{tipo}</span>;
    }
  };

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="ms-modal-header">
          <div className="ms-header-info">
            <h2>Historial de Stock</h2>
            <p>{producto?.nombre} {varianteId ? '(Variante seleccionada)' : ''}</p>
          </div>
          <button className="ms-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ms-modal-filters">
          <div className="ms-filter-group">
            <label><Calendar size={14} /> Desde</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)} 
            />
          </div>
          <div className="ms-filter-group">
            <label><Calendar size={14} /> Hasta</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
            />
          </div>
          <div className="ms-filter-group">
            <label><Filter size={14} /> Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="venta">Ventas</option>
              <option value="ajuste">Ajustes</option>
              <option value="devolucion">Devoluciones</option>
            </select>
          </div>
          <div className="ms-filter-group ms-search-group">
            <label><Search size={14} /> Buscar</label>
            <div className="ms-search-input-wrapper">
              <input 
                type="text" 
                placeholder="Notas o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ms-modal-body">
          {isLoading ? (
            <div className="ms-loading">
              <LottieLoader />
              <p>Cargando movimientos...</p>
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="ms-empty">
              <FileText size={48} />
              <p>{movimientos.length === 0 ? 'No se encontraron movimientos para este producto.' : 'No hay coincidencias con la búsqueda.'}</p>
            </div>
          ) : (
            <div className="ms-table-container">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cant.</th>
                    <th>Stock</th>
                    <th>Usuario</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((mov) => (
                    <tr key={mov.id}>
                      <td className="ms-date">{formatDate(mov.created_at)}</td>
                      <td>{getTipoBadge(mov.tipo, mov.cantidad)}</td>
                      <td className={`ms-qty ${mov.cantidad > 0 ? 'text-success' : 'text-danger'}`}>
                        {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                      </td>
                      <td className="ms-stock">
                        <span className="stock-prev">{mov.stock_anterior || 0}</span>
                        <span className="stock-arrow">→</span>
                        <span className="stock-new">{mov.stock_nuevo}</span>
                      </td>
                      <td className="ms-user">{mov.usuario_nombre || mov.usuario?.full_name || 'Sistema'}</td>
                      <td className="ms-notes" title={mov.notas}>{mov.notas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovimientosStockModal;
