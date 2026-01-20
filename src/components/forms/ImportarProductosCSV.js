import React, { useState } from 'react';
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { compressProductImage } from '../../services/storage/imageCompression';
import { ClipboardList } from 'lucide-react';
import './ImportarProductosCSV.css';

const ImportarProductosCSV = ({ open, onProductosImportados, onClose }) => {
  const { user, userProfile } = useAuth();
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  // Función para procesar imagen desde Excel
  const procesarImagenExcel = async (imagenData, nombreProducto) => {
    if (!imagenData || imagenData === '') {
      return null;
    }

    try {
      // Si es una URL o ruta, la convertimos a archivo
      let archivoImagen;
      
      if (typeof imagenData === 'string') {
        // Si es una URL o ruta de archivo
        if (imagenData.startsWith('http') || imagenData.startsWith('data:')) {
          // Es una URL o data URL
          const response = await fetch(imagenData);
          const blob = await response.blob();
          archivoImagen = new File([blob], `${nombreProducto}.jpg`, { type: blob.type });
        } else {
          // Es una ruta de archivo local, no podemos procesarla
          console.warn('No se puede procesar ruta de archivo local:', imagenData);
          return null;
        }
      } else if (imagenData instanceof File) {
        // Ya es un archivo
        archivoImagen = imagenData;
      } else {
        console.warn('Tipo de imagen no soportado:', typeof imagenData);
        return null;
      }

      // Comprimir la imagen
      const imagenComprimida = await compressProductImage(archivoImagen);
      
      // Subir a Supabase Storage
      const nombreArchivo = `${user.id}/${Date.now()}_${imagenComprimida.name}`;
      const { error: errorUpload } = await supabase.storage
        .from('productos')
        .upload(nombreArchivo, imagenComprimida);
        
      if (errorUpload) {
        console.error('Error subiendo imagen:', errorUpload);
        return null;
      }
      return nombreArchivo;
      
    } catch (error) {
      console.error('Error procesando imagen:', error);
      return null;
    }
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isCSV && !isExcel) {
        setError('Por favor selecciona un archivo CSV o Excel (.xlsx) válido.');
        return;
      }
      
      setArchivo(file);
      setError('');
      setResultado(null);
      
      if (isCSV) {
        previewCSV(file);
      } else if (isExcel) {
        previewExcel(file);
      }
    }
  };

  const previewCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 6); // Primeras 5 líneas + header
      setPreview(lines);
    };
    reader.readAsText(file);
  };

  const previewExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Mostrar solo las primeras 6 filas
        const previewLines = jsonData.slice(0, 6).map(row => 
          Array.isArray(row) ? row.join(',') : JSON.stringify(row)
        );
        setPreview(previewLines);
      } catch (error) {
        console.error('Error leyendo archivo Excel:', error);
        setError('Error al leer el archivo Excel. Verifica que el formato sea correcto.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('El archivo Excel debe tener al menos una fila de datos.');
          }

          // Buscar la fila con los headers (validación ultra flexible)
          let headerRowIndex = -1;
          const requiredHeaders = ['nombre', 'precio_compra', 'precio_venta', 'stock'];
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (Array.isArray(row)) {
              const headers = row.map(h => String(h || '').toLowerCase().trim());
              // Verificar si esta fila contiene al menos 2 de los 4 headers requeridos
              const foundHeaders = requiredHeaders.filter(required => 
                headers.some(header => 
                  header.includes(required) || 
                  header.includes(required.replace('_', ' ')) ||
                  header.includes(required.replace('_', '')) ||
                  (header.includes('precio') && required.includes('precio')) ||
                  (header.includes('price') && required.includes('precio'))
                )
              );
              // Aceptar si encuentra al menos 2 de los 4 headers requeridos
              if (foundHeaders.length >= 2) {
                headerRowIndex = i;
                break;
              }
            }
          }

          if (headerRowIndex === -1) {
            // Intentar usar la primera fila como headers si no se encuentra nada
            headerRowIndex = 0;
          }

          const headers = jsonData[headerRowIndex];
          // Verificar headers requeridos (validación muy flexible)
          const missingHeaders = requiredHeaders.filter(required => 
            !headers.some(header => 
              String(header || '').toLowerCase().includes(required) ||
              String(header || '').toLowerCase().includes(required.replace('_', ' ')) ||
              String(header || '').toLowerCase().includes(required.replace('_', ''))
            )
          );
          // Solo mostrar advertencia si faltan más de 2 headers críticos
          if (missingHeaders.length > 2) {
            console.warn('Advertencia Excel: Faltan headers:', missingHeaders.join(', '));
          }

          const productos = [];
          // Procesar solo las filas después de los headers
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!Array.isArray(row) || row.length === 0) {
              continue;
            }
            
            const producto = {};
            headers.forEach((header, index) => {
              producto[header] = row[index] || '';
            });
            // Buscar campos requeridos de forma flexible (incluyendo nombres exactos del Excel)
            const nombre = producto.nombre || producto.name || producto.Nombre || producto.Name || producto.NOMBRE || '';
            const precioCompra = producto.precio_compra || producto.precio_compra || producto.Precio_Compra || producto.price_compra || 
                                producto['PRECIO DE COMPRA'] || producto['PRECIO DE COMPRA '] || '';
            const precioVenta = producto.precio_venta || producto.precio_venta || producto.Precio_Venta || producto.price_venta || 
                               producto['PRECIO DE VENTA'] || '';
            const stock = producto.stock || producto.Stock || producto.cantidad || producto.Cantidad || producto.STOCK || '';
            const imagen = producto.imagen || producto.Imagen || producto.IMAGEN || producto['IMAGEN(OPCIONAL)'] || '';
            
            // Validar que tenga los campos requeridos
            if (!nombre || !precioCompra || !precioVenta || !stock) {
              continue;
            }

            // Convertir números
            const precioCompraNum = parseFloat(precioCompra) || 0;
            const precioVentaNum = parseFloat(precioVenta) || 0;
            const stockNum = parseInt(stock) || 0;
            
            // Validaciones
            if (precioCompraNum < 0 || precioVentaNum < 0) {
              continue;
            }
            if (stockNum < 0) {
              continue;
            }

            // Crear producto final (solo con columnas que existen en la tabla)
            const productoFinal = {
              nombre: nombre,
              precio_compra: precioCompraNum,
              precio_venta: precioVentaNum,
              stock: stockNum,
              organization_id: userProfile?.organization_id,
              codigo: producto['CODIGO PRODUCTO'] || producto.codigo || producto.Codigo || 'PROD-' + Date.now() + '-' + i,
              imagen: imagen || null // Guardamos la imagen original para procesar después
            };
            productos.push(productoFinal);
          }
          
          if (productos.length === 0) {
            throw new Error('No se encontraron productos válidos en el archivo.');
          }

          // Procesar imágenes de todos los productos
          const productosConImagenes = await Promise.all(
            productos.map(async (producto) => {
              if (producto.imagen && producto.imagen !== '') {
                try {
                  const imagenProcesada = await procesarImagenExcel(producto.imagen, producto.nombre);
                  return {
                    ...producto,
                    imagen: imagenProcesada
                  };
                } catch (error) {
                  console.error('Error procesando imagen para', producto.nombre, ':', error);
                  // Continuar sin imagen si hay error
                  return {
                    ...producto,
                    imagen: null
                  };
                }
              } else {
                return {
                  ...producto,
                  imagen: null
                };
              }
            })
          );

          resolve(productosConImagenes);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo Excel.'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSV = async (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de datos.');
    }

    // Buscar la línea con los headers (validación ultra flexible)
    let headerLineIndex = -1;
    const requiredHeaders = ['nombre', 'precio_compra', 'precio_venta', 'stock'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const headers = line.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      // Verificar si esta línea contiene al menos 2 de los 4 headers requeridos
      const foundHeaders = requiredHeaders.filter(required => 
        headers.some(header => 
          header.includes(required) || 
          header.includes(required.replace('_', ' ')) ||
          header.includes(required.replace('_', '')) ||
          (header.includes('precio') && required.includes('precio')) ||
          (header.includes('price') && required.includes('precio'))
        )
      );
      // Aceptar si encuentra al menos 2 de los 4 headers requeridos
      if (foundHeaders.length >= 2) {
        headerLineIndex = i;
        break;
      }
    }

    if (headerLineIndex === -1) {
      // Intentar usar la primera línea como headers si no se encuentra nada
      headerLineIndex = 0;
    }

    const headers = lines[headerLineIndex].split(',').map(h => h.trim().replace(/"/g, ''));
    // Verificar headers requeridos (validación muy flexible)
    const missingHeaders = requiredHeaders.filter(required => 
      !headers.some(header => 
        header.toLowerCase().includes(required) ||
        header.toLowerCase().includes(required.replace('_', ' ')) ||
        header.toLowerCase().includes(required.replace('_', ''))
      )
    );
    // Solo mostrar advertencia si faltan más de 2 headers críticos
    if (missingHeaders.length > 2) {
      console.warn('Advertencia: Faltan headers:', missingHeaders.join(', '));
    }

    const productos = [];
    // Procesar solo las líneas después de los headers
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      // Saltar líneas de comentarios o vacías
      if (line.startsWith('#') || line === '') {
        continue;
      }
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) {
        continue;
      }

      const producto = {};
      headers.forEach((header, index) => {
        producto[header] = values[index];
      });
      // Buscar campos requeridos de forma flexible (incluyendo nombres exactos del Excel)
      const nombre = producto.nombre || producto.name || producto.Nombre || producto.Name || producto.NOMBRE || '';
      const precioCompra = producto.precio_compra || producto.precio_compra || producto.Precio_Compra || producto.price_compra || 
                          producto['PRECIO DE COMPRA'] || producto['PRECIO DE COMPRA '] || '';
      const precioVenta = producto.precio_venta || producto.precio_venta || producto.Precio_Venta || producto.price_venta || 
                         producto['PRECIO DE VENTA'] || '';
      const stock = producto.stock || producto.Stock || producto.cantidad || producto.Cantidad || producto.STOCK || '';
      const imagen = producto.imagen || producto.Imagen || producto.IMAGEN || producto['IMAGEN(OPCIONAL)'] || '';
      
      // Validar datos requeridos
      if (!nombre || !precioCompra || !precioVenta || !stock) {
        continue;
      }

      // Convertir números
      const precioCompraNum = parseFloat(precioCompra);
      const precioVentaNum = parseFloat(precioVenta);
      const stockNum = parseInt(stock);
      
      // Validar que sean números válidos
      if (isNaN(precioCompraNum) || isNaN(precioVentaNum) || isNaN(stockNum)) {
        continue;
      }

      // Validar que no sean negativos
      if (precioCompraNum < 0 || precioVentaNum < 0 || stockNum < 0) {
        continue;
      }

      // Crear producto final (solo con columnas que existen en la tabla)
      const productoFinal = {
        nombre: nombre,
        precio_compra: precioCompraNum,
        precio_venta: precioVentaNum,
        stock: stockNum,
        organization_id: userProfile?.organization_id,
        codigo: producto.codigo || producto.Codigo || producto.CODIGO || 'PROD-' + Date.now() + '-' + i,
        imagen: imagen || null // Guardamos la imagen original para procesar después
      };
      productos.push(productoFinal);
    }
    
    // Procesar imágenes de todos los productos
    const productosConImagenes = await Promise.all(
      productos.map(async (producto) => {
        if (producto.imagen && producto.imagen !== '') {
          try {
            const imagenProcesada = await procesarImagenExcel(producto.imagen, producto.nombre);
            return {
              ...producto,
              imagen: imagenProcesada
            };
          } catch (error) {
            console.error('Error procesando imagen para', producto.nombre, ':', error);
            // Continuar sin imagen si hay error
            return {
              ...producto,
              imagen: null
            };
          }
        } else {
          return {
            ...producto,
            imagen: null
          };
        }
      })
    );
    
    return productosConImagenes;
  };

  const handleImportar = async () => {
    if (!archivo) {
      setError('Por favor selecciona un archivo CSV o Excel.');
      return;
    }

    // Validar que tengamos organization_id
    if (!userProfile || !userProfile.organization_id) {
      setError('Error: No se pudo obtener la organización. Por favor recarga la página e intenta de nuevo.');
      return;
    }
    setProcesando(true);
    setError('');

    try {
      const isCSV = archivo.type === 'text/csv' || archivo.name.endsWith('.csv');
      const isExcel = archivo.name.endsWith('.xlsx') || archivo.name.endsWith('.xls');
      
      let productos;
      
      if (isExcel) {
        productos = await parseExcel(archivo);
      } else if (isCSV) {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(archivo);
        });
        productos = await parseCSV(text);
      } else {
        throw new Error('Formato de archivo no soportado.');
      }
      
      if (productos.length === 0) {
        throw new Error('No se encontraron productos válidos en el archivo.');
      }

      // Insertar productos en lotes
      const batchSize = 10;
      let insertados = 0;
      let errores = 0;

      for (let i = 0; i < productos.length; i += batchSize) {
        const batch = productos.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('productos')
          .insert(batch)
          .select();

        if (error) {
          console.error('Error insertando lote:', error);
          errores += batch.length;
        } else {
          insertados += data.length;
        }
      }

      setResultado({
        total: productos.length,
        insertados,
        errores,
        productos: productos.slice(0, 5) // Primeros 5 para preview
      });

      if (insertados > 0 && onProductosImportados) {
        onProductosImportados();
      }

    } catch (err) {
      console.error('Error procesando CSV:', err);
      setError(err.message || 'Error al procesar el archivo CSV.');
    } finally {
      setProcesando(false);
    }
  };

  const descargarPlantilla = (tipo = 'csv') => {
    const archivos = {
      csv: '/plantilla_productos.csv',
      excel: '/plantilla-importacion-productos.xlsx'
    };
    
    const link = document.createElement('a');
    link.href = archivos[tipo];
    link.download = tipo === 'csv' ? 'plantilla_productos.csv' : 'plantilla-importacion-productos.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!open) return null;

  return (
    <div className="importar-csv-modal">
      <div className="importar-csv-content">
        <div className="importar-csv-header">
          <h2>📊 Importar Productos</h2>
          <button className="importar-csv-close" onClick={onClose}>×</button>
        </div>

        <div className="importar-csv-body">
          <div className="importar-csv-section">
            <h3><ClipboardList size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Plantillas de Importación</h3>
            <p>Descarga la plantilla oficial para importar tus productos:</p>
            <div className="importar-csv-plantilla-container">
              <button 
                className="importar-csv-btn importar-csv-btn-primary"
                onClick={() => descargarPlantilla('excel')}
              >
                📊 Descargar Plantilla Excel
              </button>
            </div>
            <div className="importar-csv-instructions">
              <h4>📝 Instrucciones:</h4>
              <ul>
                <li><strong>NO modifiques</strong> los títulos (celdas bloqueadas)</li>
                <li><strong>Completa</strong> los datos en las filas vacías</li>
                <li><strong>Usa números</strong> para precios y stock</li>
                <li><strong>Excel:</strong> Guarda como .xlsx antes de importar</li>
                <li><strong>CSV:</strong> Usa comillas solo para textos con espacios</li>
                <li><strong>Formato:</strong> Acepta archivos .xlsx, .xls y .csv</li>
                <li><strong>Imágenes:</strong> Puedes insertar imágenes directamente en las celdas del Excel</li>
                <li><strong>URLs:</strong> También puedes usar URLs de imágenes en la columna de imagen</li>
              </ul>
            </div>
          </div>

          <div className="importar-csv-section">
            <h3>📁 Seleccionar Archivo</h3>
            <div className="importar-csv-file-input">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleArchivoChange}
                className="importar-csv-input"
                id="csv-file"
              />
              <label htmlFor="csv-file" className="importar-csv-label">
                {archivo ? `📄 ${archivo.name}` : '📁 Seleccionar archivo (CSV o Excel)'}
              </label>
            </div>
          </div>

          {preview && (
            <div className="importar-csv-section">
              <h3>👀 Vista Previa</h3>
              <div className="importar-csv-preview">
                {preview.map((line, index) => (
                  <div key={index} className={`importar-csv-preview-line ${index === 0 ? 'header' : ''}`}>
                    {line}
                  </div>
                ))}
                {preview.length > 5 && <div className="importar-csv-preview-more">...</div>}
              </div>
            </div>
          )}

          {error && (
            <div className="importar-csv-error">
              ❌ {error}
            </div>
          )}

          {resultado && (
            <div className="importar-csv-resultado">
              <h3>✅ Resultado de la Importación</h3>
              <div className="importar-csv-stats">
                <div className="importar-csv-stat">
                  <span className="importar-csv-stat-label">Total procesados:</span>
                  <span className="importar-csv-stat-value">{resultado.total}</span>
                </div>
                <div className="importar-csv-stat">
                  <span className="importar-csv-stat-label">Insertados:</span>
                  <span className="importar-csv-stat-value success">{resultado.insertados}</span>
                </div>
                {resultado.errores > 0 && (
                  <div className="importar-csv-stat">
                    <span className="importar-csv-stat-label">Errores:</span>
                    <span className="importar-csv-stat-value error">{resultado.errores}</span>
                  </div>
                )}
              </div>
              
              {resultado.productos.length > 0 && (
                <div className="importar-csv-productos-preview">
                  <h4>Primeros productos importados:</h4>
                  <div className="importar-csv-productos-list">
                    {resultado.productos.map((producto, index) => (
                      <div key={index} className="importar-csv-producto">
                        <span className="importar-csv-producto-nombre">{producto.nombre}</span>
                        <span className="importar-csv-producto-precio">
                          ${producto.precio_venta.toLocaleString()}
                        </span>
                        <span className="importar-csv-producto-stock">Stock: {producto.stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="importar-csv-actions">
            <button 
              className="importar-csv-btn importar-csv-btn-primary"
              onClick={handleImportar}
              disabled={!archivo || procesando}
            >
              {procesando ? '⏳ Procesando...' : '📊 Importar Productos'}
            </button>
            <button 
              className="importar-csv-btn importar-csv-btn-secondary"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportarProductosCSV;
