import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Calendar, ArrowUpRight, ArrowDownLeft, Search, FileText, Download } from 'lucide-react';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useAuth } from '../../context/AuthContext';
import LottieLoader from '../ui/LottieLoader';
import * as XLSX from 'xlsx';
import './MovimientosStockGeneral.css';

// Extrae el nombre del producto de todas las fuentes disponibles
const resolverNombreProducto = (mov) => {
  if (mov.producto?.nombre) return mov.producto.nombre;
  if (mov.producto_nombre) return mov.producto_nombre;
  if (mov.topping?.nombre) return `Topping: ${mov.topping.nombre}`;
  if (mov.variante_nombre) return mov.variante_nombre;
  // Fallback: extraer de notas
  if (mov.notas) {
    const match = mov.notas.match(/(?:Venta de producto:|Ajuste de stock:|Venta de variante:|Venta de topping:)\s*(.+)/i);
    if (match) return match[1].trim();
  }
  return '—';
};

const resolverNombreUsuario = (mov) => {
  return mov.usuario_nombre || mov.usuario?.full_name || 'Sistema';
};

const MovimientosStockGeneral = () => {
  const { organization } = useAuth();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const debounceRef = useRef(null);

  // Debounce de búsqueda para no filtrar en cada tecla
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [busqueda]);

  const filters = useMemo(() => ({
    organizationId: organization?.id,
    fechaInicio: fechaInicio ? `${fechaInicio}T00:00:00` : null,
    fechaFin: fechaFin ? `${fechaFin}T23:59:59` : null,
    tipo: filtroTipo
  }), [organization?.id, fechaInicio, fechaFin, filtroTipo]);

  const { data: movimientos = [], isLoading } = useStockMovements(filters);

  const movimientosFiltrados = useMemo(() => {
    if (!busquedaDebounced) return movimientos;
    const lowSearch = busquedaDebounced.toLowerCase();
    return movimientos.filter(mov => {
      const nombre = resolverNombreProducto(mov).toLowerCase();
      const usuario = resolverNombreUsuario(mov).toLowerCase();
      const notas = (mov.notas || '').toLowerCase();
      return nombre.includes(lowSearch) || usuario.includes(lowSearch) || notas.includes(lowSearch);
    });
  }, [movimientos, busquedaDebounced]);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }, []);

  const getTipoBadge = (tipo, cantidad) => {
    switch (tipo) {
      case 'entrada':
        return <span className="msg-badge msg-badge-success"><ArrowUpRight size={11} /> Entrada</span>;
      case 'venta':
        return <span className="msg-badge msg-badge-danger"><ArrowDownLeft size={11} /> Venta</span>;
      case 'salida':
        return <span className="msg-badge msg-badge-danger"><ArrowDownLeft size={11} /> Salida</span>;
      case 'ajuste':
        return cantidad >= 0
          ? <span className="msg-badge msg-badge-ajuste-up"><ArrowUpRight size={11} /> Ajuste ↑</span>
          : <span className="msg-badge msg-badge-warning"><ArrowDownLeft size={11} /> Ajuste ↓</span>;
      default:
        return <span className="msg-badge">{tipo}</span>;
    }
  };

  const exportarExcel = useCallback(() => {
    if (movimientosFiltrados.length === 0) return;

    const data = movimientosFiltrados.map(mov => ({
      'Fecha y Hora': formatDate(mov.created_at),
      'Producto / Ítem': resolverNombreProducto(mov),
      'Tipo': mov.tipo,
      'Cantidad': mov.cantidad,
      'Stock Anterior': mov.stock_anterior ?? 0,
      'Stock Nuevo': mov.stock_nuevo,
      'Usuario': resolverNombreUsuario(mov),
      'Notas': mov.notas || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 20 }, { wch: 35 }, { wch: 10 },
      { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 40 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    XLSX.writeFile(wb, `movimientos_stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [movimientosFiltrados, formatDate]);

  return (
    <div className="msg-container">
      <div className="msg-header">
        <div className="msg-filters-main">
          <div className="msg-search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por producto, usuario o notas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="msg-filter-group">
            <div className="msg-input-with-icon">
              <Calendar size={16} />
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <span className="msg-range-to">a</span>
            <div className="msg-input-with-icon">
              <Calendar size={16} />
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>

          <select className="msg-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="venta">Ventas</option>
            <option value="ajuste">Ajustes</option>
          </select>

          <button className="msg-btn-export" onClick={exportarExcel} title="Exportar a Excel" disabled={movimientosFiltrados.length === 0}>
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>

        {!isLoading && (
          <p className="msg-count">
            {movimientosFiltrados.length} movimiento{movimientosFiltrados.length !== 1 ? 's' : ''}
            {busquedaDebounced ? ` para "${busquedaDebounced}"` : ''}
          </p>
        )}
      </div>

      <div className="msg-content">
        {isLoading ? (
          <div className="msg-loading">
            <LottieLoader />
            <p>Cargando historial de movimientos...</p>
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="msg-empty">
            <FileText size={48} />
            <p>{busquedaDebounced ? `Sin resultados para "${busquedaDebounced}"` : 'No se encontraron movimientos registrados.'}</p>
          </div>
        ) : (
          <div className="msg-table-wrapper">
            <table className="msg-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Fecha y Hora</th>
                  <th style={{ minWidth: '180px', textAlign: 'left' }}>Producto / Ítem</th>
                  <th style={{ width: '90px' }}>Tipo</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Stock</th>
                  <th style={{ width: '130px' }}>Usuario</th>
                  <th style={{ textAlign: 'left' }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((mov) => (
                  <tr key={mov.id}>
                    <td className="msg-td-date">{formatDate(mov.created_at)}</td>
                    <td className="msg-td-product">
                      <div className="msg-prod-info">
                        <span className="msg-prod-name">{resolverNombreProducto(mov)}</span>
                        {mov.variante_nombre && (
                          <span className="msg-variant-tag">{mov.variante_nombre}</span>
                        )}
                      </div>
                    </td>
                    <td>{getTipoBadge(mov.tipo, mov.cantidad)}</td>
                    <td className={`msg-td-qty ${mov.cantidad > 0 ? 'msg-text-success' : 'msg-text-danger'}`} style={{ textAlign: 'center' }}>
                      {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                    </td>
                    <td className="msg-td-stock" style={{ textAlign: 'center' }}>
                      <div className="msg-stock-progression" style={{ justifyContent: 'center' }}>
                        <span className="msg-stock-prev">{mov.stock_anterior ?? 0}</span>
                        <span className="msg-stock-arrow">→</span>
                        <span className="msg-stock-new">{mov.stock_nuevo}</span>
                      </div>
                    </td>
                    <td className="msg-td-user">{resolverNombreUsuario(mov)}</td>
                    <td className="msg-td-notes" title={mov.notas}>{mov.notas || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovimientosStockGeneral;
