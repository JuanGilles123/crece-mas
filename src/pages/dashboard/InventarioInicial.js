import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import './Inventario.css';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/api/supabaseClient';
import toast from 'react-hot-toast';
import { compressProductImage } from '../../services/storage/imageCompression';
import { generateStoragePath, validateFilename } from '../../utils/fileUtils';
import { useSubscription } from '../../hooks/useSubscription';
import { Pencil, Trash2, CheckCircle, RotateCcw, Edit3, FolderOpen } from 'lucide-react';
import { useTeamMembers } from '../../hooks/useTeam';

const InventarioInicial = () => {
  const { user, organization, hasRole } = useAuth();
  const { hasFeature } = useSubscription();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    precio_compra: '',
    precio_venta: '',
    stock: '',
    tipo: 'fisico'
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentImagePath, setCurrentImagePath] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [reviewFilter, setReviewFilter] = useState('all');

  const isAdmin = hasRole?.('owner', 'admin');
  const moneda = user?.user_metadata?.moneda || 'COP';
  const { data: teamMembers = [] } = useTeamMembers(organization?.id);

  const userNameMap = useMemo(() => {
    const map = new Map();
    teamMembers.forEach((member) => {
      if (member.user_id) {
        map.set(member.user_id, member.nombre || member.email || 'Sin nombre');
      }
    });
    return map;
  }, [teamMembers]);

  const getUserName = useCallback(
    (userId) => {
      if (!userId) return '—';
      return userNameMap.get(userId) || '—';
    },
    [userNameMap]
  );
  const formatCurrency = useCallback(
    (value) => {
      if (value === null || value === undefined || value === '') return '—';
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return '—';
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: moneda
      }).format(numeric);
    },
    [moneda]
  );

  const fetchBatches = useCallback(async ({ silent = false } = {}) => {
    if (!organization?.id) return;
    if (!silent) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBatches(data || []);
    } catch (err) {
      console.error('Error cargando lotes:', err);
      if (!silent) {
        toast.error('No se pudieron cargar los lotes');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [organization?.id]);

  const fetchItems = useCallback(async (batchId, { silent = false } = {}) => {
    if (!organization?.id || !batchId) return;
    if (!silent) {
      setItemsLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('inventory_import_items')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
      if (!silent) {
        setSelectedItems(new Set());
      }
    } catch (err) {
      console.error('Error cargando items:', err);
      if (!silent) {
        toast.error('No se pudieron cargar los items');
      }
    } finally {
      if (!silent) {
        setItemsLoading(false);
      }
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (selectedBatch?.id) {
      fetchItems(selectedBatch.id);
    } else {
      setItems([]);
    }
  }, [selectedBatch, fetchItems]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBatches({ silent: true });
      if (selectedBatch?.id) {
        fetchItems(selectedBatch.id, { silent: true });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchBatches, fetchItems, selectedBatch?.id]);

  const handleCreateBatch = async () => {
    if (!organization?.id || !user?.id) return;
    if (!newBatchName.trim()) {
      toast.error('Escribe un nombre para el lote');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .insert({
          organization_id: organization.id,
          name: newBatchName.trim(),
          created_by: user.id,
          assigned_to: user.id
        })
        .select()
        .single();
      if (error) throw error;
      setNewBatchName('');
      setBatches((prev) => [data, ...prev]);
      setSelectedBatch(data);
      toast.success('Lote creado');
    } catch (err) {
      console.error('Error creando lote:', err);
      toast.error('No se pudo crear el lote');
    }
  };

  const handleAssignBatch = async (batch) => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .update({ assigned_to: user.id })
        .eq('id', batch.id)
        .select()
        .single();
      if (error) throw error;
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? data : b)));
      toast.success('Lote asignado');
    } catch (err) {
      console.error('Error asignando lote:', err);
      toast.error('No se pudo asignar el lote');
    }
  };

  const handleEditBatch = async (batch) => {
    const newName = window.prompt('Editar nombre del lote:', batch.name || '');
    if (newName === null) return;
    if (!newName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .update({ name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', batch.id)
        .select()
        .single();
      if (error) throw error;
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? data : b)));
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch(data);
      }
      toast.success('Lote actualizado');
    } catch (err) {
      console.error('Error actualizando lote:', err);
      toast.error('No se pudo actualizar el lote');
    }
  };

  const handleDeleteBatch = async (batch) => {
    const confirmDelete = window.confirm(`¿Eliminar el lote "${batch.name}"?`);
    if (!confirmDelete) return;
    try {
      const { error } = await supabase
        .from('inventory_import_batches')
        .delete()
        .eq('id', batch.id);
      if (error) throw error;
      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch(null);
      }
      toast.success('Lote eliminado');
    } catch (err) {
      console.error('Error eliminando lote:', err);
      toast.error('No se pudo eliminar el lote');
    }
  };

  const handleFinalizeBatch = async (batch) => {
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .update({ status: 'submitted' })
        .eq('id', batch.id)
        .select()
        .single();
      if (error) throw error;
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? data : b)));
      toast.success('Lote enviado para aprobación');
    } catch (err) {
      console.error('Error finalizando lote:', err);
      toast.error('No se pudo finalizar el lote');
    }
  };

  const handleApproveBatch = async (batch) => {
    if (!isAdmin) return;
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_import_items')
        .select('*')
        .eq('batch_id', batch.id);
      if (itemsError) throw itemsError;

      const approvedItems = (itemsData || []).filter((item) => item.review_state === 'approved');
      if (approvedItems.length === 0) {
        toast.error('No hay items aprobados para crear productos');
        return;
      }

      const productosPayload = approvedItems.map((item) => ({
        organization_id: batch.organization_id,
        user_id: batch.created_by,
        codigo: item.codigo,
        nombre: item.nombre,
        precio_compra: Number(item.precio_compra || 0),
        precio_venta: Number(item.precio_venta || 0),
        stock: item.stock !== null && item.stock !== undefined ? Number(item.stock) : null,
        tipo: item.tipo || 'fisico',
        imagen: item.imagen || null
      }));

      const { error: insertError } = await supabase
        .from('productos')
        .insert(productosPayload);
      if (insertError) throw insertError;

      const { data, error } = await supabase
        .from('inventory_import_batches')
        .update({ status: 'approved' })
        .eq('id', batch.id)
        .select()
        .single();
      if (error) throw error;
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? data : b)));
      toast.success('Inventario aprobado y creado');
    } catch (err) {
      console.error('Error aprobando lote:', err);
      toast.error('No se pudo aprobar el lote');
    }
  };

  const handleAddItem = async () => {
    if (!organization?.id || !user?.id || !selectedBatch?.id) return;
    if (!form.nombre.trim() || !form.precio_venta) {
      toast.error('Nombre y precio de venta son obligatorios');
      return;
    }
    if (Number.isNaN(Number(form.precio_venta)) || Number(form.precio_venta) <= 0) {
      toast.error('El precio de venta debe ser mayor a 0');
      return;
    }
    if (form.precio_compra !== '' && Number(form.precio_venta) <= Number(form.precio_compra)) {
      toast.error('El precio de venta debe ser mayor al precio de compra');
      return;
    }
    if (form.tipo !== 'servicio' && form.stock === '') {
      toast.error('El stock es obligatorio para productos físicos');
      return;
    }

    try {
      let imagenPath = currentImagePath || null;
      if (imageFile) {
        if (!hasFeature('productImages')) {
          toast.error('Actualiza tu plan para subir imágenes');
          return;
        }
        const validation = validateFilename(imageFile.name);
        if (!validation.isValid) {
          toast.error(validation.error);
          return;
        }
        setUploadingImage(true);
        const imagenComprimida = await compressProductImage(imageFile);
        const nombreArchivo = generateStoragePath(organization.id, imagenComprimida.name);
        const { error: errorUpload } = await supabase.storage
          .from('productos')
          .upload(nombreArchivo, imagenComprimida);
        if (errorUpload) throw errorUpload;
        imagenPath = nombreArchivo;
      }

      const payload = {
        batch_id: selectedBatch.id,
        organization_id: organization.id,
        codigo: form.codigo || null,
        nombre: form.nombre.trim(),
        precio_compra: Number(form.precio_compra || 0),
        precio_venta: Number(form.precio_venta || 0),
        stock: form.stock !== '' ? Number(form.stock || 0) : null,
        tipo: form.tipo || 'fisico',
        imagen: imagenPath,
        created_by: user.id
      };
      if (editingItemId) {
        const { data, error } = await supabase
          .from('inventory_import_items')
          .update(payload)
          .eq('id', editingItemId)
          .select()
          .single();
        if (error) throw error;
        setItems((prev) => prev.map((item) => (item.id === editingItemId ? data : item)));
        setEditingItemId(null);
      } else {
        const { data, error } = await supabase
          .from('inventory_import_items')
          .insert({ ...payload, review_state: 'pending' })
          .select()
          .single();
        if (error) throw error;
        setItems((prev) => [data, ...prev]);
      }
      setForm({
        codigo: '',
        nombre: '',
        precio_compra: '',
        precio_venta: '',
        stock: '',
        tipo: 'fisico'
      });
      setImageFile(null);
      setCurrentImagePath('');
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error agregando item:', err);
      toast.error('No se pudo agregar el item');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditItem = (item) => {
    if (item.review_state === 'approved') {
      toast.error('Los items aprobados no se pueden editar');
      return;
    }
    setEditingItemId(item.id);
    setForm({
      codigo: item.codigo || '',
      nombre: item.nombre || '',
      precio_compra: item.precio_compra?.toString() || '',
      precio_venta: item.precio_venta?.toString() || '',
      stock: item.stock !== null && item.stock !== undefined ? item.stock.toString() : '',
      tipo: item.tipo || 'fisico'
    });
    setCurrentImagePath(item.imagen || '');
    setImageFile(null);
  };

  const handleDeleteItem = async (item) => {
    if (item.review_state === 'approved') {
      toast.error('Los items aprobados no se pueden eliminar');
      return;
    }
    try {
      const { error } = await supabase
        .from('inventory_import_items')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      if (editingItemId === item.id) {
        setEditingItemId(null);
      }
    } catch (err) {
      console.error('Error eliminando item:', err);
      toast.error('No se pudo eliminar el item');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setForm({
      codigo: '',
      nombre: '',
      precio_compra: '',
      precio_venta: '',
      stock: '',
      tipo: 'fisico'
    });
    setImageFile(null);
    setCurrentImagePath('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleExportCSV = () => {
    if (!selectedBatchItems || selectedBatchItems.length === 0) {
      toast.error('No hay items para exportar');
      return;
    }
    const header = ['codigo', 'nombre', 'precio_compra', 'precio_venta', 'stock', 'tipo'];
    const rows = selectedBatchItems.map((item) => ([
      item.codigo || '',
      item.nombre || '',
      item.precio_compra ?? '',
      item.precio_venta ?? '',
      item.stock ?? '',
      item.tipo || ''
    ]));
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_lote_${selectedBatch?.name || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedBatchItems = useMemo(() => {
    if (reviewFilter === 'all') return items;
    return items.filter((item) => (item.review_state || 'pending') === reviewFilter);
  }, [items, reviewFilter]);

  const contributorNames = useMemo(() => {
    const ids = new Set(selectedBatchItems.map((item) => item.created_by).filter(Boolean));
    return Array.from(ids).map((id) => getUserName(id)).filter((name) => name !== '—');
  }, [selectedBatchItems, getUserName]);

  const allSelected = selectedBatchItems.length > 0 && selectedBatchItems.every((item) => selectedItems.has(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(selectedBatchItems.map((item) => item.id)));
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

  const handleBulkReviewState = async (newState) => {
    if (!isAdmin || selectedItems.size === 0) return;
    let returnReason = null;
    if (newState === 'returned') {
      returnReason = window.prompt('Motivo de devolución (opcional):', '') || null;
    }
    try {
      const { error } = await supabase
        .from('inventory_import_items')
        .update({
          review_state: newState,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          return_reason: newState === 'returned' ? returnReason : null
        })
        .in('id', Array.from(selectedItems));
      if (error) throw error;
      setItems((prev) =>
        prev.map((item) =>
          selectedItems.has(item.id)
            ? {
                ...item,
                review_state: newState,
                reviewed_by: user?.id,
                reviewed_at: new Date().toISOString(),
                return_reason: newState === 'returned' ? returnReason : null
              }
            : item
        )
      );
      setSelectedItems(new Set());
      toast.success(newState === 'approved' ? 'Items aprobados' : 'Items devueltos');
    } catch (err) {
      console.error('Error actualizando items:', err);
      toast.error('No se pudo actualizar la revisión');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmDelete = window.confirm('¿Eliminar los items seleccionados?');
    if (!confirmDelete) return;
    try {
      const { error } = await supabase
        .from('inventory_import_items')
        .delete()
        .in('id', Array.from(selectedItems));
      if (error) throw error;
      setItems((prev) => prev.filter((item) => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      toast.success('Items eliminados');
    } catch (err) {
      console.error('Error eliminando items:', err);
      toast.error('No se pudieron eliminar los items');
    }
  };

  const handleItemReviewState = async (itemId, newState) => {
    if (!isAdmin) return;
    let returnReason = null;
    if (newState === 'returned') {
      returnReason = window.prompt('Motivo de devolución (opcional):', '') || null;
    }
    try {
      const { error } = await supabase
        .from('inventory_import_items')
        .update({
          review_state: newState,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          return_reason: newState === 'returned' ? returnReason : null
        })
        .eq('id', itemId);
      if (error) throw error;
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                review_state: newState,
                reviewed_by: user?.id,
                reviewed_at: new Date().toISOString(),
                return_reason: newState === 'returned' ? returnReason : null
              }
            : item
        )
      );
    } catch (err) {
      console.error('Error actualizando item:', err);
      toast.error('No se pudo actualizar la revisión');
    }
  };

  return (
    <div className="inventario-main">
      <div className="inventario-header-wrapper inventario-revisiones-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="inventario-title">Inventario Inicial (Colaborativo)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Crea lotes, asigna tareas y sincroniza el registro inicial entre varias personas.
          </p>
        </div>
        <div className="inventario-actions inventario-revisiones-actions" style={{ alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            className="inventario-btn inventario-btn-secondary"
            style={{ padding: '0.5rem 1rem', lineHeight: 1.1, whiteSpace: 'nowrap' }}
            onClick={fetchBatches}
          >
            Sincronizar
          </button>
        </div>
      </div>

      <div className="inventario-inicial-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(260px, 1fr) minmax(0, 2fr)' }}>
        <div className="inventario-inicial-card" style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '1rem', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Crear lote</h3>
          <input
            className="input-form"
            placeholder="Nombre del lote (ej: Bodega, Pasillo 1)"
            value={newBatchName}
            onChange={(e) => setNewBatchName(e.target.value)}
          />
          <button className="inventario-btn inventario-btn-primary" onClick={handleCreateBatch} style={{ marginTop: '0.75rem', width: '100%' }}>
            Crear lote
          </button>

          <h3 style={{ margin: '1.5rem 0 0.75rem' }}>Lotes activos</h3>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Cargando...</div>
          ) : batches.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>No hay lotes creados</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {batches.map((batch) => (
                <div key={batch.id} style={{ border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '14px', padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{batch.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Estado: {batch.status}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Responsable: {getUserName(batch.assigned_to)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Creado por: {getUserName(batch.created_by)}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                    <button
                      className="inventario-btn inventario-btn-secondary"
                      style={{ padding: '0.35rem 0.55rem' }}
                      onClick={() => setSelectedBatch(batch)}
                      title="Abrir lote"
                    >
                      <FolderOpen size={16} style={{ color: '#0f172a', stroke: '#0f172a' }} />
                    </button>
                    <button
                      className="inventario-btn inventario-btn-secondary"
                      style={{ padding: '0.35rem 0.55rem' }}
                      onClick={() => handleEditBatch(batch)}
                      title="Editar lote"
                    >
                      <Edit3 size={16} style={{ color: '#2563eb', stroke: '#2563eb' }} />
                    </button>
                    <button
                      className="inventario-btn inventario-btn-secondary"
                      style={{ padding: '0.35rem 0.55rem' }}
                      onClick={() => handleDeleteBatch(batch)}
                      title="Eliminar lote"
                    >
                      <Trash2 size={16} style={{ color: '#dc2626', stroke: '#dc2626' }} />
                    </button>
                    {!batch.assigned_to && (
                      <button className="inventario-btn inventario-btn-secondary" onClick={() => handleAssignBatch(batch)}>
                        Tomar lote
                      </button>
                    )}
                    {batch.status === 'open' && (
                      <button className="inventario-btn inventario-btn-secondary" onClick={() => handleFinalizeBatch(batch)}>
                        Finalizar
                      </button>
                    )}
                    {batch.status === 'submitted' && isAdmin && (
                      <button
                        className="inventario-btn inventario-btn-secondary"
                        style={{ padding: '0.35rem 0.55rem' }}
                        onClick={() => handleApproveBatch(batch)}
                        title="Aprobar lote"
                      >
                        <CheckCircle size={16} style={{ color: '#16a34a', stroke: '#16a34a' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inventario-inicial-card" style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '1rem', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Items del lote</h3>
          {selectedBatch ? (
            <>
              <div style={{ fontWeight: 600 }}>{selectedBatch.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Estado: {selectedBatch.status}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Responsable: {getUserName(selectedBatch.assigned_to)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Registrado por: {contributorNames.length > 0 ? contributorNames.join(', ') : '—'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className="inventario-btn inventario-btn-secondary" onClick={handleExportCSV}>
                  Exportar CSV
                </button>
                {editingItemId && (
                  <button className="inventario-btn inventario-btn-secondary" onClick={handleCancelEdit}>
                    Cancelar edición
                  </button>
                )}
                <select
                  className="input-form"
                  style={{ maxWidth: '220px' }}
                  value={reviewFilter}
                  onChange={(e) => {
                    setReviewFilter(e.target.value);
                    setSelectedItems(new Set());
                  }}
                >
                  <option value="all">Mostrar todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobadas</option>
                  <option value="returned">Devueltas</option>
                </select>
              </div>
              <div className="inventario-inicial-form" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  className="input-form"
                  placeholder="Código"
                  value={form.codigo}
                  onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                />
                <input
                  className="input-form"
                  placeholder="Nombre del producto"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                />
                <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <input
                    type="number"
                    className="input-form"
                    placeholder="Precio compra"
                    value={form.precio_compra}
                    onChange={(e) => setForm((prev) => ({ ...prev, precio_compra: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="input-form"
                    placeholder="Precio venta"
                    value={form.precio_venta}
                    onChange={(e) => setForm((prev) => ({ ...prev, precio_venta: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="input-form"
                    placeholder="Stock"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                </div>
                <select
                  className="input-form"
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                >
                  <option value="fisico">Físico</option>
                  <option value="servicio">Servicio</option>
                  <option value="comida">Comida</option>
                  <option value="accesorio">Accesorio</option>
                </select>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.85rem' }}>
                      Imagen del producto {hasFeature('productImages') ? '(opcional)' : '(plan requerido)'}
                    </label>
                    <button
                      type="button"
                      className="inventario-btn inventario-btn-primary"
                      onClick={() => {
                        if (!hasFeature('productImages')) {
                          toast.error('Actualiza al plan Estándar para subir imágenes');
                          return;
                        }
                        imageInputRef.current?.click();
                      }}
                      disabled={!hasFeature('productImages')}
                      style={{
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.82rem',
                        gap: '0.35rem',
                        height: '32px',
                        whiteSpace: 'nowrap',
                        ...(!hasFeature('productImages') ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                      }}
                    >
                      <FolderOpen size={14} />
                      {imageFile ? imageFile.name : currentImagePath ? 'Cambiar imagen' : 'Cargar'}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    disabled={!hasFeature('productImages')}
                    style={{ display: 'none' }}
                  />
                  {currentImagePath && !imageFile && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Imagen actual cargada
                    </div>
                  )}
                </div>
                <button className="inventario-btn inventario-btn-primary" onClick={handleAddItem}>
                  {uploadingImage ? 'Subiendo imagen...' : (editingItemId ? 'Guardar cambios' : 'Agregar item')}
                </button>
              </div>

              {itemsLoading ? (
                <div style={{ color: 'var(--text-secondary)' }}>Cargando items...</div>
              ) : selectedBatchItems.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>No hay items en este lote</div>
              ) : (
                <>
                  {isAdmin && selectedBatch.status === 'submitted' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <button
                        className="inventario-btn inventario-btn-secondary"
                        onClick={() => handleBulkReviewState('approved')}
                        disabled={selectedItems.size === 0}
                      >
                        Aprobar seleccionados
                      </button>
                      <button
                        className="inventario-btn inventario-btn-secondary"
                        onClick={() => handleBulkReviewState('returned')}
                        disabled={selectedItems.size === 0}
                      >
                        Devolver seleccionados
                      </button>
                      <button
                        className="inventario-btn inventario-btn-secondary"
                        onClick={handleBulkDelete}
                        disabled={selectedItems.size === 0}
                      >
                        Eliminar seleccionados
                      </button>
                    </div>
                  )}
                  <div className="inventario-inicial-table" style={{ maxHeight: '45vh', overflowY: 'auto', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                        {isAdmin && selectedBatch.status === 'submitted' && (
                          <th style={{ padding: '0.5rem 0.75rem' }}>
                            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                          </th>
                        )}
                        <th style={{ padding: '0.5rem 0.75rem' }}>Producto</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Código</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Precio compra</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Precio venta</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Stock</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Imagen</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Revisión</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Revisado por</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBatchItems.map((item, index) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.12)', background: index % 2 === 0 ? 'rgba(148, 163, 184, 0.04)' : 'transparent' }}>
                          {isAdmin && selectedBatch.status === 'submitted' && (
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleSelectItem(item.id)}
                              />
                            </td>
                          )}
                          <td style={{ padding: '0.5rem 0.75rem' }}>{item.nombre}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{item.codigo || '—'}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                            {formatCurrency(item.precio_compra)}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                            {formatCurrency(item.precio_venta)}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{item.stock ?? '—'}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{item.imagen ? 'Sí' : 'No'}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            {item.review_state || 'pending'}
                            {item.review_state === 'returned' && item.return_reason && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {item.return_reason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            {getUserName(item.reviewed_by)}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="inventario-btn inventario-btn-secondary"
                              style={{ padding: '0.35rem 0.55rem', color: '#2563eb' }}
                              onClick={() => handleEditItem(item)}
                              title="Editar"
                              disabled={item.review_state === 'approved'}
                            >
                              <Pencil size={16} style={{ color: '#2563eb', stroke: '#2563eb' }} />
                            </button>
                            <button
                              className="inventario-btn inventario-btn-secondary"
                              style={{ padding: '0.35rem 0.55rem', color: '#dc2626' }}
                              onClick={() => handleDeleteItem(item)}
                              title="Eliminar"
                              disabled={item.review_state === 'approved'}
                            >
                              <Trash2 size={16} style={{ color: '#dc2626', stroke: '#dc2626' }} />
                            </button>
                            {isAdmin && selectedBatch.status === 'submitted' && (
                              <>
                                <button
                                  className="inventario-btn inventario-btn-secondary"
                                  style={{ padding: '0.35rem 0.55rem', color: '#16a34a' }}
                                  onClick={() => handleItemReviewState(item.id, 'approved')}
                                  title="Aprobar"
                                >
                                  <CheckCircle size={16} style={{ color: '#16a34a', stroke: '#16a34a' }} />
                                </button>
                                <button
                                  className="inventario-btn inventario-btn-secondary"
                                  style={{ padding: '0.35rem 0.55rem', color: '#f97316' }}
                                  onClick={() => handleItemReviewState(item.id, 'returned')}
                                  title="Devolver"
                                >
                                  <RotateCcw size={16} style={{ color: '#f97316', stroke: '#f97316' }} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>
              Selecciona un lote para comenzar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventarioInicial;
