import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Trash2, Save, FileSpreadsheet, Info, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAgregarProducto } from '../../hooks/useProductos';
import { compressProductImage } from '../../services/storage/imageCompression';
import { validateFilename, generateStoragePath } from '../../utils/fileUtils';
import { supabase } from '../../services/api/supabaseClient';
import toast from 'react-hot-toast';
import './CreacionMasivaModal.css';

const CreacionMasivaModal = ({ open, onClose, onProductosCreados }) => {
  const { organization, user } = useAuth();
  const agregarProductoMutation = useAgregarProducto();

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
    { key: 'categoria', label: 'Categoría', type: 'text', placeholder: 'Electrónica' },
    //{ key: 'marca', label: 'Marca', type: 'text', placeholder: 'Samsung' },
    //{ key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'S21' },
    { key: 'imagen', label: 'Imagen', type: 'image', placeholder: 'Pegar URL o subir local' },
  ], [isJewelry]);

  const INITIAL_ROW = useMemo(() => ({
    codigo: '',
    nombre: '',
    tipo: 'fisico',
    peso: '',
    pureza: '',
    precio_compra: '',
    precio_venta: '',
    stock: '',
    categoria: '',
    marca: '',
    modelo: '',
    imagen: ''
  }), []);

  const [rows, setRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasteIndicator, setShowPasteIndicator] = useState(false);
  const tableRef = useRef(null);

  const [uploadingImageId, setUploadingImageId] = useState(null);

  useEffect(() => {
    if (open && rows.length === 0) {
      setRows([{ ...INITIAL_ROW, id: Date.now() }]);
    }
  }, [open, rows.length, INITIAL_ROW]);

  const addRow = () => {
    setRows([...rows, { ...INITIAL_ROW, id: Date.now() + Math.random() }]);
  };

  const removeRow = (id) => {
    if (rows.length === 1) {
      setRows([{ ...INITIAL_ROW, id: Date.now() }]);
      return;
    }
    setRows(rows.filter(row => row.id !== id));
  };

  const updateCell = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
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

  const handlePaste = (e) => {
    // Detectar si el foco está en un input para no interferir con el pegado normal en una celda
    if (e.target.tagName === 'INPUT' && e.target.value !== '') {
      // Si el input tiene algo, quizás el usuario quiere pegar dentro del input.
      // Pero si es un pegado de tabla (múltiples celdas), deberíamos interceptarlo.
    }

    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    // Verificar si parece una tabla (contiene tabuladores o nuevas líneas)
    if (pasteData.includes('\t') || pasteData.includes('\n')) {
      e.preventDefault();

      const lines = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');
      const newRowsFromPaste = lines.map((line, index) => {
        const cells = line.split('\t');
        const row = { ...INITIAL_ROW, id: Date.now() + index + Math.random() };

        // Mapear celdas a campos según el orden de COLUMNS
        COLUMNS.forEach((col, colIdx) => {
          if (cells[colIdx] !== undefined) {
            let val = cells[colIdx].trim();
            if (col.type === 'number') {
              val = val.replace(/[^\d.-]/g, '');
            }
            if (col.key === 'tipo') {
              val = val.toLowerCase();
              if (!col.options.includes(val)) val = 'fisico';
            }
            row[col.key] = val;
          }
        });

        return row;
      });

      // Si la primera fila actual está vacía, reemplazarla
      const isFirstRowEmpty = rows.length === 1 && !rows[0].nombre && !rows[0].codigo;
      if (isFirstRowEmpty) {
        setRows(newRowsFromPaste);
      } else {
        setRows([...rows, ...newRowsFromPaste]);
      }

      setShowPasteIndicator(true);
      setTimeout(() => setShowPasteIndicator(false), 3000);
      toast.success(`${newRowsFromPaste.length} filas pegadas desde el portapapeles`);
    }
  };

  const validateRows = () => {
    const validRows = rows.filter(row => row.nombre && row.precio_venta);
    const invalidRows = rows.filter(row => (row.codigo || row.nombre || row.precio_venta || row.stock) && (!row.nombre || !row.precio_venta));

    return { validRows, invalidRows };
  };

  const handleSave = async () => {
    const { validRows, invalidRows } = validateRows();

    if (validRows.length === 0) {
      toast.error('No hay productos válidos para guardar. Asegúrate de llenar al menos Nombre y Precio de Venta.');
      return;
    }

    if (invalidRows.length > 0) {
      if (!window.confirm(`Hay ${invalidRows.length} filas incompletas que serán ignoradas. ¿Deseas continuar?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Procesar en lotes para no saturar
      const BATCH_SIZE = 10;
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(batch.map(async (row) => {
          const payload = {
            organization_id: organization.id,
            user_id: user.id,
            nombre: row.nombre,
            codigo: row.codigo || null,
            tipo: row.tipo || 'fisico',
            precio_compra: parseFloat(row.precio_compra) || 0,
            precio_venta: parseFloat(row.precio_venta) || 0,
            stock: parseFloat(row.stock) || 0,
            imagen: row.imagen || null,
            metadata: {
              categoria: row.categoria || null,
              marca: row.marca || null,
              modelo: row.modelo || null,
              creado_masivamente: true,
              permite_toppings: organization?.business_type === 'food',
              ...(isJewelry ? {
                peso: parseFloat(row.peso) || 0,
                pureza: row.pureza || null
              } : {})
            }
          };

          try {
            await agregarProductoMutation.mutateAsync(payload);
            return { success: true };
          } catch (err) {
            console.error('Error guardando fila:', row, err);
            return { success: false };
          }
        }));

        for (const res of results) {
          if (res.success) successCount++;
          else errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Se crearon ${successCount} productos correctamente`);
        if (onProductosCreados) onProductosCreados();
        if (errorCount === 0) {
          onClose();
          setRows([{ ...INITIAL_ROW, id: Date.now() }]);
        } else {
          // Si hubo errores, dejar solo las filas que fallaron
          // (En este MVP simple, solo cerramos si todo salió bien o informamos)
          toast.error(`${errorCount} productos fallaron al guardarse`);
        }
      } else {
        toast.error('No se pudo guardar ningún producto');
      }
    } catch (err) {
      console.error('Error masivo:', err);
      toast.error('Ocurrió un error al procesar la creación masiva');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="creacion-masiva-overlay" onPaste={handlePaste}>
      <div className="creacion-masiva-modal">
        <div className="creacion-masiva-header">
          <h2><FileSpreadsheet size={24} color="#7c3aed" /> Creación Masiva de Productos</h2>
          <button className="creacion-masiva-close" onClick={onClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <div className="creacion-masiva-body">
          <div className="creacion-masiva-toolbar">
            <div className="creacion-masiva-actions">
              <button className="creacion-masiva-btn creacion-masiva-btn-secondary" onClick={addRow} disabled={isSubmitting}>
                <Plus size={18} /> Agregar Fila
              </button>
              <button className="creacion-masiva-btn creacion-masiva-btn-secondary" onClick={() => setRows([{ ...INITIAL_ROW, id: Date.now() }])} disabled={isSubmitting}>
                <Trash2 size={18} /> Limpiar Todo
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary, #888)', fontSize: '0.85rem' }}>
              <Info size={16} />
              <span>Tip: Puedes copiar desde Excel y pegar aquí (Ctrl+V)</span>
            </div>
          </div>

          <div className="creacion-masiva-table-container">
            <table className="creacion-masiva-table" ref={tableRef}>
              <thead>
                <tr>
                  {COLUMNS.map(col => (
                    <th key={col.key}>{col.label} {col.required && <span style={{ color: '#ef4444' }}>*</span>}</th>
                  ))}
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS.map(col => (
                      <td key={col.key}>
                        {col.type === 'select' ? (
                          <select
                            className="creacion-masiva-input"
                            value={row[col.key]}
                            onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                            disabled={isSubmitting}
                          >
                            {col.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : col.type === 'image' ? (
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              className="creacion-masiva-input"
                              value={row[col.key]}
                              onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                              placeholder={col.placeholder}
                              disabled={isSubmitting || uploadingImageId === row.id}
                              style={{ flex: 1 }}
                            />
                            <label className="creacion-masiva-upload-label" title="Subir desde el computador">
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
                            className={`creacion-masiva-input ${col.required && !row[col.key] && (row.nombre || row.codigo) ? 'error' : ''}`}
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
                        className="creacion-masiva-close"
                        onClick={() => removeRow(row.id)}
                        style={{ color: '#ef4444' }}
                        disabled={isSubmitting}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="creacion-masiva-tip">
            <CheckCircle2 size={14} color="#10b981" />
            <span>Los productos con Nombre y Precio de Venta serán creados. Las filas vacías serán ignoradas.</span>
          </div>
        </div>

        <div className="creacion-masiva-footer">
          <div className="creacion-masiva-stats">
            <span>Filas totales: <strong>{rows.length}</strong></span>
            <span>Listos para crear: <strong>{rows.filter(r => r.nombre && r.precio_venta).length}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="creacion-masiva-btn creacion-masiva-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button className="creacion-masiva-btn creacion-masiva-btn-primary" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (
                <>
                  <Save size={18} /> Guardar Productos
                </>
              )}
            </button>
          </div>
        </div>

        {isSubmitting && (
          <div className="creacion-masiva-loading-overlay">
            <div style={{ color: '#fff', textAlign: 'center' }}>
              <div className="spin" style={{ marginBottom: '1rem' }}>
                <Save size={48} />
              </div>
              <p>Creando productos masivamente...</p>
            </div>
          </div>
        )}
      </div>

      {showPasteIndicator && (
        <div className="creacion-masiva-pasted-indicator">
          ¡Datos pegados exitosamente!
        </div>
      )}
    </div>
  );
};

export default CreacionMasivaModal;
