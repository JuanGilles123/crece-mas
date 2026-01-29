import React, { useState } from 'react';
import './Inventario.css';
import { useAuth } from '../../context/AuthContext';
import { useProductos } from '../../hooks/useProductos';
import RevisionInventarioModal from '../../components/modals/RevisionInventarioModal';
import RevisionInventarioHistorialModal from '../../components/modals/RevisionInventarioHistorialModal';

const InventarioRevisiones = () => {
  const { user, organization, hasRole, hasPermission } = useAuth();
  const [revisionInventarioOpen, setRevisionInventarioOpen] = useState(false);
  const [revisionHistorialOpen, setRevisionHistorialOpen] = useState(false);
  const { data: productos = [] } = useProductos(organization?.id);

  return (
    <div className="inventario-main">
      <div className="inventario-header-wrapper inventario-revisiones-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="inventario-title">Revisiones de Inventario</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Realiza revisiones ciegas y consulta el historial con filtros por fecha o producto.
          </p>
        </div>
        <div className="inventario-actions inventario-revisiones-actions" style={{ alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            className="inventario-btn inventario-btn-primary"
            onClick={() => setRevisionInventarioOpen(true)}
          >
            Nueva revisión
          </button>
          <button
            className="inventario-btn inventario-btn-secondary"
            onClick={() => setRevisionHistorialOpen(true)}
          >
            Ver historial
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Nueva revisión (ciega)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ingresa cantidades revisadas sin ver el stock actual. Los resultados solo se muestran a administradores.
          </p>
          <button
            className="inventario-btn inventario-btn-secondary"
            onClick={() => setRevisionInventarioOpen(true)}
          >
            Iniciar revisión
          </button>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Historial y aprobaciones</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Consulta el detalle de revisiones, filtra por fechas o productos y aprueba cuando corresponda.
          </p>
          <button
            className="inventario-btn inventario-btn-secondary"
            onClick={() => setRevisionHistorialOpen(true)}
          >
            Abrir historial
          </button>
        </div>
      </div>

      <RevisionInventarioModal
        open={revisionInventarioOpen}
        onClose={() => setRevisionInventarioOpen(false)}
        productos={productos}
        filteredProducts={productos}
        userId={user?.id}
        organizationId={organization?.id}
        canViewDifferences={hasRole?.('owner', 'admin') || hasPermission?.('inventario.review_differences')}
      />
      <RevisionInventarioHistorialModal
        open={revisionHistorialOpen}
        onClose={() => setRevisionHistorialOpen(false)}
        organizationId={organization?.id}
        productos={productos}
        userId={user?.id}
        canApprove={hasRole?.('owner', 'admin')}
      />
    </div>
  );
};

export default InventarioRevisiones;
