import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../services/api/supabaseClient';
import toast from 'react-hot-toast';

const DEFAULT_SCOPE = 'all';

const RevisionInventarioModal = ({
  open,
  onClose,
  productos = [],
  filteredProducts = [],
  userId,
  organizationId,
  canViewDifferences = false
}) => {
  const [scope, setScope] = useState(DEFAULT_SCOPE);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [randomCount, setRandomCount] = useState(10);
  const [filters, setFilters] = useState({
    tipo: '',
    marca: '',
    stockMin: '',
    stockMax: ''
  });
  const [reviewedQty, setReviewedQty] = useState({});
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!open) {
      setScope(DEFAULT_SCOPE);
      setSelectedProductIds([]);
      setProductSearch('');
      setRandomCount(10);
      setFilters({
        tipo: '',
        marca: '',
        stockMin: '',
        stockMax: ''
      });
      setReviewedQty({});
      setSaving(false);
      setShowResults(false);
    }
  }, [open]);

  const productOptions = useMemo(() => {
    return productos
      .filter((producto) => producto && producto.id)
      .map((producto) => ({
        id: producto.id,
        label: `${producto.nombre || 'Producto'}${producto.codigo ? ` (${producto.codigo})` : ''}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [productos]);

  const filteredProductOptions = useMemo(() => {
    if (!productSearch.trim()) return productOptions;
    const searchTerm = productSearch.toLowerCase();
    return productOptions.filter((producto) => producto.label.toLowerCase().includes(searchTerm));
  }, [productOptions, productSearch]);

  const filteredByCharacteristics = useMemo(() => {
    return productos.filter((producto) => {
      const marca = producto?.metadata?.marca || '';
      const stock = Number(producto.stock ?? 0);

      if (filters.tipo && producto.tipo !== filters.tipo) return false;
      if (filters.marca && !marca.toLowerCase().includes(filters.marca.toLowerCase())) return false;
      if (filters.stockMin !== '' && stock < Number(filters.stockMin)) return false;
      if (filters.stockMax !== '' && stock > Number(filters.stockMax)) return false;

      return true;
    });
  }, [productos, filters]);

  const targetProducts = useMemo(() => {
    let baseList = filteredByCharacteristics;
    if (scope === 'product') {
      if (selectedProductIds.length > 0) {
        baseList = filteredByCharacteristics.filter((producto) => selectedProductIds.includes(producto.id));
      } else {
        baseList = [];
      }
    } else if (scope === 'random') {
      const shuffled = [...filteredByCharacteristics].sort(() => Math.random() - 0.5);
      const count = Math.max(1, Number(randomCount || 1));
      baseList = shuffled.slice(0, count);
    }

    return baseList.filter(
      (producto) => producto?.stock !== null && producto?.stock !== undefined
    );
  }, [filteredByCharacteristics, scope, selectedProductIds, randomCount]);

  const summary = useMemo(() => {
    let reviewedCount = 0;
    let diffCount = 0;
    let totalDifference = 0;

    targetProducts.forEach((producto) => {
      const value = reviewedQty[producto.id];
      if (value === '' || value === undefined || value === null) {
        return;
      }
      const reviewedValue = Number(value);
      if (Number.isNaN(reviewedValue)) {
        return;
      }
      reviewedCount += 1;
      const actualStock = Number(producto.stock || 0);
      const difference = reviewedValue - actualStock;
      totalDifference += difference;
      if (difference !== 0) {
        diffCount += 1;
      }
    });

    return { reviewedCount, diffCount, totalDifference };
  }, [targetProducts, reviewedQty]);

  const handleQtyChange = (productId, value) => {
    setReviewedQty((prev) => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleSave = async () => {
    if (!userId || !organizationId) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    const reviewItems = targetProducts
      .map((producto) => {
        const value = reviewedQty[producto.id];
        if (value === '' || value === undefined || value === null) {
          return null;
        }
        const reviewedValue = Number(value);
        if (Number.isNaN(reviewedValue)) {
          return null;
        }
        const actualStock = Number(producto.stock || 0);
        const difference = reviewedValue - actualStock;
        const status = difference === 0 ? 'ok' : 'diff';
        const metadata = producto.metadata || {};
        const inventoryReview = {
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
          reviewed_qty: reviewedValue,
          difference_qty: difference,
          status
        };
        return {
          product_id: producto.id,
          reviewed_qty: reviewedValue,
          difference_qty: difference,
          status,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          organization_id: organizationId,
          inventory_review: inventoryReview,
          metadata
        };
      })
      .filter(Boolean);

    if (reviewItems.length === 0) {
      toast.error('Ingresa al menos una cantidad revisada');
      return;
    }

    setSaving(true);
    try {
      let scopeValue = null;
      if (scope === 'product') {
        scopeValue = selectedProductIds.length > 0 ? selectedProductIds.join(',') : null;
      } else if (scope === 'filters') {
        scopeValue = JSON.stringify(filters);
      } else if (scope === 'random') {
        scopeValue = String(randomCount || 0);
      }

      const { data: session, error: sessionError } = await supabase
        .from('inventory_review_sessions')
        .insert({
          organization_id: organizationId,
          scope_type: scope,
          scope_value: scopeValue,
          created_by: userId
        })
        .select()
        .single();

      if (sessionError || !session) {
        throw sessionError || new Error('No se pudo crear la sesión de revisión');
      }

      const itemsPayload = reviewItems.map((item) => ({
        session_id: session.id,
        organization_id: item.organization_id,
        product_id: item.product_id,
        reviewed_by: item.reviewed_by,
        reviewed_at: item.reviewed_at,
        reviewed_qty: item.reviewed_qty,
        difference_qty: item.difference_qty,
        status: item.status
      }));

      const { error: itemsError } = await supabase
        .from('inventory_review_items')
        .insert(itemsPayload);

      if (itemsError) {
        throw itemsError;
      }

      for (const item of reviewItems) {
        const { error } = await supabase
          .from('productos')
          .update({
            metadata: {
              ...item.metadata,
              inventory_review: item.inventory_review
            }
          })
          .eq('id', item.product_id);
        if (error) {
          throw error;
        }
      }

      toast.success('Revisión guardada correctamente');
      setReviewedQty({});
      onClose();
    } catch (err) {
      console.error('Error guardando revisión:', err);
      toast.error('Error al guardar la revisión');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg">
      <div className="modal-card" style={{ maxWidth: '980px' }}>
        <h2>Revisión de Inventario</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Ingresa la cantidad revisada sin ver el stock actual. Al final se mostrará si hay diferencias y en cuánto.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600 }}>Alcance de la revisión</label>
          <select
            className="input-form"
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setSelectedProductIds([]);
              setProductSearch('');
              setRandomCount(10);
            }}
          >
            <option value="all">Todo el inventario</option>
            <option value="product">Por productos</option>
            <option value="random">Aleatorio</option>
          </select>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <select
              className="input-form"
              value={filters.tipo}
              onChange={(e) => setFilters((prev) => ({ ...prev, tipo: e.target.value }))}
            >
              <option value="">Tipo (todos)</option>
              <option value="fisico">Físico</option>
              <option value="servicio">Servicio</option>
              <option value="comida">Comida</option>
              <option value="accesorio">Accesorio</option>
            </select>
            <input
              className="input-form"
              placeholder="Marca"
              value={filters.marca}
              onChange={(e) => setFilters((prev) => ({ ...prev, marca: e.target.value }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                type="number"
                className="input-form"
                placeholder="Stock mínimo"
                value={filters.stockMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, stockMin: e.target.value }))}
              />
              <input
                type="number"
                className="input-form"
                placeholder="Stock máximo"
                value={filters.stockMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, stockMax: e.target.value }))}
              />
            </div>
          </div>

          {scope === 'product' && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <input
                className="input-form"
                placeholder="Buscar producto por nombre o código..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', padding: '0.5rem' }}>
                {filteredProductOptions.length === 0 ? (
                  <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                    No hay productos para mostrar
                  </div>
                ) : (
                  filteredProductOptions.map((producto) => {
                    const isChecked = selectedProductIds.includes(producto.id);
                    return (
                      <label
                        key={producto.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '24px 1fr',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.45rem 0.25rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedProductIds((prev) =>
                              checked ? [...prev, producto.id] : prev.filter((id) => id !== producto.id)
                            );
                          }}
                        />
                        <span style={{ textAlign: 'left' }}>{producto.label}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {scope === 'random' && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <input
                type="number"
                className="input-form"
                placeholder="Cantidad aleatoria"
                value={randomCount}
                onChange={(e) => setRandomCount(e.target.value)}
                min={1}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem', fontWeight: 600 }}>
          Productos a revisar: {targetProducts.length}
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto' }}>
          {targetProducts.map((producto) => {
            const value = reviewedQty[producto.id] ?? '';
            let statusLabel = null;
            let diffLabel = null;
            if (showResults && value !== '' && value !== undefined && value !== null && !Number.isNaN(Number(value))) {
              const reviewedValue = Number(value);
              const actualStock = Number(producto.stock || 0);
              const difference = reviewedValue - actualStock;
              statusLabel = difference === 0 ? 'Sin diferencias' : 'Con diferencias';
              diffLabel = difference === 0 ? '0' : difference > 0 ? `+${difference}` : `${difference}`;
            }

            return (
              <div
                key={producto.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '14px',
                  padding: '0.75rem'
                }}
              >
                <div style={{ fontWeight: 600 }}>{producto.nombre || 'Producto'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {producto.codigo ? `Código: ${producto.codigo}` : 'Sin código'}{' '}
                  {producto?.metadata?.marca ? `• Marca: ${producto.metadata.marca}` : ''}
                </div>
                <label style={{ fontSize: '0.85rem' }}>Cantidad revisada</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input-form"
                  value={value}
                  onChange={(e) => handleQtyChange(producto.id, e.target.value)}
                  placeholder="Ej: 10"
                />
                {showResults && statusLabel && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>{statusLabel}</strong> • Diferencia: {diffLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.25rem', textAlign: 'center' }}>
          <div>Productos revisados: {summary.reviewedCount}</div>
          {canViewDifferences ? (
            <>
              <button
                type="button"
                className="inventario-btn inventario-btn-secondary"
                onClick={() => setShowResults((prev) => !prev)}
                style={{ justifySelf: 'center', marginTop: '0.5rem' }}
              >
                {showResults ? 'Ocultar resultados' : 'Ver resultados'}
              </button>
              {showResults && (
                <>
                  <div>Con diferencias: {summary.diffCount}</div>
                  <div>
                    Diferencia total: {summary.totalDifference === 0 ? '0' : summary.totalDifference > 0 ? `+${summary.totalDifference}` : summary.totalDifference}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>
              Resultados visibles solo para administradores
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="inventario-btn inventario-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="inventario-btn inventario-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar revisión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionInventarioModal;
