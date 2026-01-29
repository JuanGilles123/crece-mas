import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/api/supabaseClient';
import toast from 'react-hot-toast';

const RevisionInventarioHistorialModal = ({
  open,
  onClose,
  organizationId,
  productos = [],
  userId,
  canApprove = false
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const productOptions = useMemo(() => {
    return productos
      .filter((producto) => producto && producto.id)
      .map((producto) => ({
        id: producto.id,
        label: `${producto.nombre || 'Producto'}${producto.codigo ? ` (${producto.codigo})` : ''}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [productos]);

  useEffect(() => {
    if (!open || !organizationId) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory_review_items')
          .select(`
            id,
            reviewed_qty,
            difference_qty,
            status,
            review_state,
            reviewed_at,
            product_id,
            inventory_review_sessions(
              id,
              status,
              created_at,
              approved_at,
              approved_by
            ),
            productos(
              id,
              nombre,
              codigo,
              metadata
            )
          `)
          .eq('organization_id', organizationId)
          .order('reviewed_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        setItems(data || []);
        setSelectedItems(new Set());
      } catch (err) {
        console.error('Error cargando historial:', err);
        toast.error('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [open, organizationId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedProductId && item.product_id !== selectedProductId) {
        return false;
      }
      if (showOnlyPending && item.review_state !== 'pending') {
        return false;
      }
      if (fromDate) {
        const from = new Date(fromDate);
        if (new Date(item.reviewed_at) < from) {
          return false;
        }
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(item.reviewed_at) > to) {
          return false;
        }
      }
      return true;
    });
  }, [items, fromDate, toDate, selectedProductId, showOnlyPending]);

  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedItems.has(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleBulkUpdate = async (newState) => {
    if (!canApprove || selectedItems.size === 0) return;
    try {
      const { error } = await supabase
        .from('inventory_review_items')
        .update({ review_state: newState })
        .in('id', Array.from(selectedItems));
      if (error) throw error;
      setItems((prev) =>
        prev.map((item) =>
          selectedItems.has(item.id)
            ? { ...item, review_state: newState }
            : item
        )
      );
      setSelectedItems(new Set());
      toast.success(newState === 'approved' ? 'Revisiones aprobadas' : 'Revisiones devueltas');
    } catch (err) {
      console.error('Error actualizando revisiones:', err);
      toast.error('No se pudo actualizar la revisión');
    }
  };

  const summary = useMemo(() => {
    let totalReviewed = 0;
    let totalDiffs = 0;
    let totalDifference = 0;
    filteredItems.forEach((item) => {
      totalReviewed += 1;
      if (item.difference_qty !== 0) {
        totalDiffs += 1;
      }
      totalDifference += Number(item.difference_qty || 0);
    });
    return { totalReviewed, totalDiffs, totalDifference };
  }, [filteredItems]);

  const handleApproveSession = async (sessionId) => {
    if (!canApprove || !userId) return;

    try {
      const { error } = await supabase
        .from('inventory_review_sessions')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      setItems((prev) =>
        prev.map((item) =>
          item.inventory_review_sessions?.id === sessionId
            ? {
                ...item,
                inventory_review_sessions: {
                  ...item.inventory_review_sessions,
                  status: 'approved',
                  approved_by: userId,
                  approved_at: new Date().toISOString()
                }
              }
            : item
        )
      );
      toast.success('Revisión aprobada');
    } catch (err) {
      console.error('Error aprobando revisión:', err);
      toast.error('No se pudo aprobar la revisión');
    }
  };

  if (!open) return null;

  const renderedSessions = new Set();

  return (
    <div className="modal-bg">
      <div className="modal-card" style={{ maxWidth: '980px' }}>
        <h2>Historial de Revisiones</h2>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600 }}>Filtros</label>
          <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Desde</label>
              <input
                type="date"
                className="input-form"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Hasta</label>
              <input
                type="date"
                className="input-form"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem' }}>Producto</label>
              <select
                className="input-form"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Todos</option>
                {productOptions.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.6rem' }}>
              <input
                type="checkbox"
                id="pendingOnly"
                checked={showOnlyPending}
                onChange={(e) => setShowOnlyPending(e.target.checked)}
              />
              <label htmlFor="pendingOnly" style={{ fontSize: '0.85rem' }}>
                Solo pendientes
              </label>
            </div>
          </div>
        </div>

        <div style={{
          marginBottom: '1rem',
          display: 'grid',
          gap: '0.25rem',
          textAlign: 'center',
          background: 'rgba(148, 163, 184, 0.08)',
          borderRadius: '14px',
          padding: '0.75rem'
        }}>
          <div>Registros: {summary.totalReviewed}</div>
          <div>Con diferencias: {summary.totalDiffs}</div>
          <div>
            Diferencia total: {summary.totalDifference === 0 ? '0' : summary.totalDifference > 0 ? `+${summary.totalDifference}` : summary.totalDifference}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>Cargando historial...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            No hay revisiones con estos filtros
          </div>
        ) : (
          <>
            {canApprove && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  className="inventario-btn inventario-btn-secondary"
                  onClick={() => handleBulkUpdate('approved')}
                  disabled={selectedItems.size === 0}
                >
                  Aprobar seleccionados
                </button>
                <button
                  className="inventario-btn inventario-btn-secondary"
                  onClick={() => handleBulkUpdate('returned')}
                  disabled={selectedItems.size === 0}
                >
                  Devolver seleccionados
                </button>
              </div>
            )}
            <div style={{ overflowX: 'auto', maxHeight: '50vh', overflowY: 'auto', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  {canApprove && (
                    <th style={{ padding: '0.65rem 0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th style={{ padding: '0.65rem 0.75rem' }}>Fecha</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Producto</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Código</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Revisado</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Diferencia</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Revisión</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Aprobación</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const producto = item.productos || {};
                  const session = item.inventory_review_sessions || {};
                  const reviewedDate = item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : '—';
                  const diffLabel = item.difference_qty === 0 ? '0' : item.difference_qty > 0 ? `+${item.difference_qty}` : item.difference_qty;
                  const rowBg = index % 2 === 0 ? 'rgba(148, 163, 184, 0.04)' : 'transparent';
                  const statusPill = item.status === 'diff'
                    ? { label: 'Con dif.', bg: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c' }
                    : { label: 'Ok', bg: 'rgba(16, 185, 129, 0.12)', color: '#047857' };
                  const reviewPill = item.review_state === 'approved'
                    ? { label: 'Aprobada', bg: 'rgba(16, 185, 129, 0.12)', color: '#047857' }
                    : item.review_state === 'returned'
                      ? { label: 'Devuelta', bg: 'rgba(251, 146, 60, 0.12)', color: '#c2410c' }
                      : { label: 'Pendiente', bg: 'rgba(148, 163, 184, 0.12)', color: '#475569' };

                  let approveButton = null;
                  if (canApprove && session.status === 'pending' && session.id && !renderedSessions.has(session.id)) {
                    renderedSessions.add(session.id);
                    approveButton = (
                      <button
                        className="inventario-btn inventario-btn-secondary"
                        onClick={() => handleApproveSession(session.id)}
                      >
                        Aprobar
                      </button>
                    );
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.12)', background: rowBg }}>
                      {canApprove && (
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                          />
                        </td>
                      )}
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>{reviewedDate}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>{producto.nombre || 'Producto'}</td>
                      <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>{producto.codigo || '—'}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>{item.reviewed_qty}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>{diffLabel}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          background: statusPill.bg,
                          color: statusPill.color,
                          fontWeight: 600
                        }}>
                          {statusPill.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          background: reviewPill.bg,
                          color: reviewPill.color,
                          fontWeight: 600
                        }}>
                          {reviewPill.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        {session.status === 'approved' ? 'Aprobado' : 'Pendiente'} {approveButton}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button className="inventario-btn inventario-btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionInventarioHistorialModal;
