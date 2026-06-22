import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, FileSpreadsheet, Info, CheckCircle2, Upload, Loader2, Trash2, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useActualizarProducto } from '../../hooks/useProductos';
import { compressProductImage } from '../../services/storage/imageCompression';
import { validateFilename, generateStoragePath } from '../../utils/fileUtils';
import { supabase } from '../../services/api/supabaseClient';
import toast from 'react-hot-toast';
import './EdicionMasivaModal.css';

const EdicionMasivaModal = ({ open, onClose, productosSeleccionados, categoriasDisponibles = [], onProductosActualizados }) => {
  const { organization } = useAuth();
  const actualizarProductoMutation = useActualizarProducto();

  const isJewelry = organization?.business_type === 'jewelry_metals';

  const COLUMNS = useMemo(() => [
    { key: 'codigo', label: 'Código', type: 'text', placeholder: 'ABC-123' },
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Producto Ej', required: true },
    { key: 'tipo', label: 'Tipo', type: 'select', options: ['fisico', 'servicio', 'comida', 'accesorio'] },
    ...(isJewelry ? [
      { key: 'peso', label: 'Peso (g)', type: 'number', placeholder: '0.00' },
      { key: 'pureza', label: 'Pureza', type: 'select', options: ['', '24k', '22k', '18k', '14k', '10k', '925', '950'] },
    ] : []),
    { key: 'precio_compra', label: 'P. Compra', type: 'number', placeholder: '0' },
    { key: 'precio_venta', label: 'P. Venta', type: 'number', placeholder: '0', required: true },
    { key: 'stock', label: 'Stock', type: 'number', placeholder: '0' },
    { key: 'categoria', label: 'Categoría', type: 'datalist', options: categoriasDisponibles },
    { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej. Samsung' },
    { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej. S21' },
    { key: 'color', label: 'Color', type: 'text', placeholder: 'Ej. Rojo' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'Ej. Algodón' },
    { key: 'ocultar_en_catalogo', label: 'Visibilidad', type: 'select', options: ['Mostrar', 'Ocultar'] },
    { key: 'imagen', label: 'Imagen', type: 'image', placeholder: 'Pegar URL o subir local' },
  ], [isJewelry, categoriasDisponibles]);

  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progresoActualizacion, setProgresoActualizacion] = useState({ actual: 0, total: 0 });
  const tableRef = useRef(null);
  const [campoAplicarTodos, setCampoAplicarTodos] = useState('precio_venta');
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaults = ['codigo', 'nombre', 'precio_venta', 'precio_compra', 'stock', 'categoria'];
    if (organization?.business_type === 'jewelry_metals') {
      defaults.push('peso', 'pureza');
    }
    return defaults;
  });

  const activeColumns = useMemo(() => COLUMNS.filter(c => visibleColumns.includes(c.key)), [COLUMNS, visibleColumns]);

  const [uploadingImageId, setUploadingImageId] = useState(null);

  useEffect(() => {
    if (open && productosSeleccionados && productosSeleccionados.length > 0) {
      const initialRows = productosSeleccionados.map(prod => ({
        id: prod.id,
        codigo: prod.codigo || '',
        nombre: prod.nombre || '',
        tipo: prod.tipo || 'fisico',
        peso: prod.metadata?.peso || '',
        pureza: prod.metadata?.pureza || '',
        precio_compra: prod.precio_compra || '',
        precio_venta: prod.precio_venta || '',
        stock: prod.stock || '',
        categoria: prod.metadata?.categoria || '',
        marca: prod.metadata?.marca || '',
        modelo: prod.metadata?.modelo || '',
        color: prod.metadata?.color || '',
        material: prod.metadata?.material || '',
        ocultar_en_catalogo: (prod.metadata?.ocultar_en_catalogo === true || String(prod.metadata?.ocultar_en_catalogo) === 'true') ? 'Ocultar' : 'Mostrar',
        imagen: prod.imagen || ''
      }));
      setRows(initialRows);
      
      const originals = {};
      initialRows.forEach(row => {
        originals[row.id] = { ...row };
      });
      setOriginalRows(originals);
    }
  }, [open, productosSeleccionados]);

  const updateCell = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const removeRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;

    const validation = validateFilename(file.name);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploadingImageId(id);
    try {
      const compressedFile = await compressProductImage(file);
      const storagePath = generateStoragePath(organization.id, compressedFile.name);

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(storagePath, compressedFile);

      if (uploadError) throw uploadError;

      // Guardar el path relativo que Supabase espera para productos
      updateCell(id, 'imagen', storagePath);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleSave = async () => {
    // Filtrar solo los productos que han cambiado
    const changedRows = rows.filter(row => {
      const original = originalRows[row.id];
      if (!original) return false;
      return Object.keys(row).some(key => row[key] !== original[key]);
    });

    if (changedRows.length === 0) {
      toast.success('No hay cambios para guardar');
      onClose();
      return;
    }

    // Validar nombres y precios de venta en los cambiados
    const invalidRows = changedRows.filter(row => !row.nombre || !row.precio_venta);
    if (invalidRows.length > 0) {
      toast.error('Asegúrate de que todos los productos modificados tengan Nombre y Precio de Venta.');
      return;
    }

    if (!window.confirm(`Vas a actualizar ${changedRows.length} productos. ¿Estás seguro?`)) {
      return;
    }

    setIsSubmitting(true);
    setProgresoActualizacion({ actual: 0, total: changedRows.length });
    
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;

    try {
      // Procesar en lotes para no saturar
      const BATCH_SIZE = 10;
      for (let i = 0; i < changedRows.length; i += BATCH_SIZE) {
        const batch = changedRows.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(batch.map(async (row) => {
          const original = originalRows[row.id];
          
          const updates = {};
          if (row.nombre !== original.nombre) updates.nombre = row.nombre;
          if (row.codigo !== original.codigo) updates.codigo = row.codigo || null;
          if (row.tipo !== original.tipo) updates.tipo = row.tipo;
          
          const newPrecioCompra = parseFloat(row.precio_compra) || 0;
          if (newPrecioCompra !== parseFloat(original.precio_compra || 0)) updates.precio_compra = newPrecioCompra;
          
          const newPrecioVenta = parseFloat(row.precio_venta) || 0;
          if (newPrecioVenta !== parseFloat(original.precio_venta || 0)) updates.precio_venta = newPrecioVenta;
          
          const newStock = parseFloat(row.stock) || 0;
          if (newStock !== parseFloat(original.stock || 0)) updates.stock = newStock;
          
          if (row.imagen !== original.imagen) updates.imagen = row.imagen || null;

          // Metadatos
          let metaUpdates = false;
          const metadata = productosSeleccionados.find(p => p.id === row.id)?.metadata || {};
          const newMetadata = { ...metadata };
          
          if (row.categoria !== original.categoria) { newMetadata.categoria = row.categoria || null; metaUpdates = true; }
          if (row.marca !== original.marca) { newMetadata.marca = row.marca || null; metaUpdates = true; }
          if (row.modelo !== original.modelo) { newMetadata.modelo = row.modelo || null; metaUpdates = true; }
          if (row.color !== original.color) { newMetadata.color = row.color || null; metaUpdates = true; }
          if (row.material !== original.material) { newMetadata.material = row.material || null; metaUpdates = true; }
          if (row.ocultar_en_catalogo !== original.ocultar_en_catalogo) { newMetadata.ocultar_en_catalogo = row.ocultar_en_catalogo === 'Ocultar'; metaUpdates = true; }
          
          if (isJewelry) {
            const newPeso = parseFloat(row.peso) || 0;
            if (newPeso !== parseFloat(original.peso || 0)) { newMetadata.peso = newPeso; metaUpdates = true; }
            if (row.pureza !== original.pureza) { newMetadata.pureza = row.pureza || null; metaUpdates = true; }
          }
          
          if (metaUpdates) {
            updates.metadata = newMetadata;
          }

          try {
            await actualizarProductoMutation.mutateAsync({
              id: row.id,
              updates,
              organizationId: organization.id,
              silent: true
            });
            return { success: true };
          } catch (err) {
            console.error('Error actualizando producto:', row, err);
            return { success: false };
          }
        }));

        for (const res of results) {
          if (res.success) successCount++;
          else errorCount++;
        }
        processedCount += batch.length;
        setProgresoActualizacion(prev => ({ ...prev, actual: processedCount }));
      }

      if (successCount > 0) {
        toast.success(`Se actualizaron ${successCount} productos correctamente`);
        if (onProductosActualizados) onProductosActualizados();
        if (errorCount === 0) {
          onClose();
        } else {
          toast.error(`${errorCount} productos fallaron al actualizarse`);
        }
      } else {
        toast.error('No se pudo actualizar ningún producto');
      }
    } catch (err) {
      console.error('Error masivo de edición:', err);
      toast.error('Ocurrió un error al procesar la edición masiva');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="edicion-masiva-overlay">
      <div className="edicion-masiva-modal">
        <div className="edicion-masiva-header">
          <h2><FileSpreadsheet size={24} color="#f97316" /> Edición Masiva de Productos</h2>
          <button className="edicion-masiva-close" onClick={onClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <div className="edicion-masiva-body">
          <div className="edicion-masiva-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary, #888)', fontSize: '0.85rem' }}>
              <Info size={16} />
              <span>Edita los campos directamente. Solo se guardarán los productos que modifiques.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  className="edicion-masiva-btn-secondary" 
                  onClick={() => setColumnMenuOpen(!columnMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  <Settings2 size={16} /> Columnas
                </button>
                {columnMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', 
                    background: 'var(--bg-primary, #1a1a2e)', border: '1px solid var(--border-color, #2a2a4a)', 
                    borderRadius: '8px', padding: '0.5rem', zIndex: 9999, minWidth: '200px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)', maxHeight: '300px', overflowY: 'auto'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Columnas Visibles</div>
                    {COLUMNS.map(col => (
                      <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', cursor: 'pointer', borderRadius: '4px' }}>
                        <input 
                          type="checkbox" 
                          checked={visibleColumns.includes(col.key)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleColumns([...visibleColumns, col.key]);
                            } else {
                              setVisibleColumns(visibleColumns.filter(k => k !== col.key));
                            }
                          }} 
                        />
                        <span style={{ fontSize: '0.85rem' }}>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-highlight, rgba(249, 115, 22, 0.05))', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color, #2a2a4a)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Copiar valor a todos:</span>
                <select 
                  className="edicion-masiva-input" 
                  style={{ width: '140px', padding: '0.3rem 0.5rem' }}
                  value={campoAplicarTodos}
                  onChange={e => setCampoAplicarTodos(e.target.value)}
                  disabled={isSubmitting}
                >
                  {activeColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              <button 
                className="edicion-masiva-btn-secondary" 
                onClick={() => {
                  if (rows.length === 0) return;
                  const primerValor = rows[0][campoAplicarTodos];
                  setRows(prev => prev.map(r => ({ ...r, [campoAplicarTodos]: primerValor })));
                  toast.success(`Valor aplicado a todos los productos`);
                }}
                disabled={isSubmitting}
                title="Toma el valor de la primera fila y lo aplica a todas las demás"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderColor: '#f97316', color: '#f97316' }}
              >
                Aplicar
              </button>
            </div>
            </div>
          </div>

          <div className="edicion-masiva-table-container">
            <table className="edicion-masiva-table" ref={tableRef}>
              <thead>
                <tr>
                  {activeColumns.map(col => (
                    <th key={col.key}>{col.label} {col.required && <span style={{ color: '#ef4444' }}>*</span>}</th>
                  ))}
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isRowChanged = Object.keys(row).some(key => row[key] !== originalRows[row.id]?.[key]);
                  
                  return (
                    <tr key={row.id} style={{ backgroundColor: isRowChanged ? 'var(--bg-highlight, rgba(249, 115, 22, 0.05))' : 'transparent' }}>
                      {activeColumns.map(col => (
                        <td key={col.key}>
                          {col.type === 'select' ? (
                            <select
                              className="edicion-masiva-input"
                              value={row[col.key]}
                              onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                              disabled={isSubmitting}
                            >
                              {col.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : col.type === 'datalist' ? (
                            <>
                              <input
                                type="text"
                                list={`list-${col.key}-${row.id}`}
                                className="edicion-masiva-input"
                                value={row[col.key]}
                                onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                                placeholder={col.placeholder || ''}
                                disabled={isSubmitting}
                              />
                              <datalist id={`list-${col.key}-${row.id}`}>
                                {col.options.map(opt => (
                                  <option key={opt} value={opt} />
                                ))}
                              </datalist>
                            </>
                          ) : col.type === 'image' ? (
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="edicion-masiva-input"
                                value={row[col.key]}
                                onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                                placeholder={col.placeholder}
                                disabled={isSubmitting || uploadingImageId === row.id}
                                style={{ flex: 1 }}
                              />
                              <label className="edicion-masiva-upload-label" title="Subir desde el computador">
                                {uploadingImageId === row.id ? (
                                  <Loader2 size={16} className="spin" />
                                ) : (
                                  <Upload size={16} />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleImageUpload(row.id, e.target.files[0])}
                                  disabled={isSubmitting || uploadingImageId === row.id}
                                />
                              </label>
                            </div>
                          ) : (
                            <input
                              type={col.type}
                              className={`edicion-masiva-input ${col.required && !row[col.key] && (row.nombre || row.codigo) ? 'error' : ''}`}
                              value={row[col.key]}
                              onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                              placeholder={col.placeholder}
                              disabled={isSubmitting}
                            />
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          className="edicion-masiva-close"
                          onClick={() => removeRow(row.id)}
                          style={{ color: '#ef4444' }}
                          title="Quitar de la lista de edición"
                          disabled={isSubmitting}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                      No hay productos seleccionados para editar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="edicion-masiva-tip">
            <CheckCircle2 size={14} color="#f97316" />
            <span>Los productos modificados se resaltarán. Revisa los cambios antes de guardar.</span>
          </div>
        </div>

        <div className="edicion-masiva-footer">
          <div className="edicion-masiva-stats">
            <span>Productos a actualizar: <strong>{rows.filter(row => Object.keys(row).some(key => row[key] !== originalRows[row.id]?.[key])).length}</strong> de {rows.length}</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="edicion-masiva-btn edicion-masiva-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button className="edicion-masiva-btn edicion-masiva-btn-primary" onClick={handleSave} disabled={isSubmitting || rows.length === 0} style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}>
              {isSubmitting ? (progresoActualizacion.total > 0 ? `Guardando (${progresoActualizacion.actual}/${progresoActualizacion.total})...` : 'Guardando...') : (
                <>
                  <Save size={18} /> Actualizar Productos
                </>
              )}
            </button>
          </div>
        </div>

        {isSubmitting && (
          <div className="edicion-masiva-loading-overlay">
            <div style={{ color: '#fff', textAlign: 'center' }}>
              <div className="spin" style={{ marginBottom: '1rem' }}>
                <Save size={48} />
              </div>
              <p>Actualizando {progresoActualizacion.total} productos...</p>
              {progresoActualizacion.total > 0 && (
                <div style={{ marginTop: '0.5rem', width: '200px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#f97316', width: `${(progresoActualizacion.actual / progresoActualizacion.total) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EdicionMasivaModal;
