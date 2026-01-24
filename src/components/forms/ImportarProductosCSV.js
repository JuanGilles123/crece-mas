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
  const [inconsistencias, setInconsistencias] = useState([]);

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
          const inconsistenciasEncontradas = [];
          // Procesar solo las filas después de los headers
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const numeroFila = i + 1; // Fila real en Excel (1-indexed)
            
            if (!Array.isArray(row) || row.length === 0) {
              inconsistenciasEncontradas.push({
                fila: numeroFila,
                producto: 'Fila vacía',
                problemas: ['La fila está vacía o no tiene datos']
              });
              continue;
            }
            
            const producto = {};
            headers.forEach((header, index) => {
              producto[header] = row[index] || '';
            });
            // Buscar campos requeridos de forma flexible (incluyendo nombres exactos del Excel)
            const nombre = producto.nombre || producto.name || producto.Nombre || producto.Name || producto.NOMBRE || '';
            const tipo = (producto.tipo || producto.Tipo || producto.TIPO || 'fisico').toLowerCase();
            const precioCompra = producto.precio_compra || producto.precio_compra || producto.Precio_Compra || producto.price_compra || 
                                producto['PRECIO DE COMPRA'] || producto['PRECIO DE COMPRA '] || producto['PRECIO COMPRA **'] || '';
            const precioVenta = producto.precio_venta || producto.precio_venta || producto.Precio_Venta || producto.price_venta || 
                               producto['PRECIO DE VENTA'] || producto['PRECIO VENTA *'] || '';
            const stock = producto.stock || producto.Stock || producto.cantidad || producto.Cantidad || producto.STOCK || '';
            const imagen = producto.imagen || producto.Imagen || producto.IMAGEN || producto['IMAGEN(OPCIONAL)'] || '';
            
            // Validar tipo de producto
            const tiposValidos = ['fisico', 'servicio', 'comida', 'accesorio'];
            const tipoValido = tiposValidos.includes(tipo) ? tipo : 'fisico';
            
            // Acumular problemas encontrados
            const problemas = [];
            
            // Validar campos requeridos según tipo
            if (!nombre || nombre.trim() === '') {
              problemas.push('El nombre del producto es obligatorio');
            }
            
            if (!precioVenta || precioVenta.toString().trim() === '') {
              problemas.push('El precio de venta es obligatorio');
            }
            
            // Validar campos condicionales según tipo
            if ((tipoValido === 'fisico' || tipoValido === 'comida' || tipoValido === 'accesorio') && (!precioCompra || precioCompra.toString().trim() === '')) {
              problemas.push(`El precio de compra es obligatorio para productos tipo "${tipoValido}"`);
            }
            
            if ((tipoValido === 'fisico' || tipoValido === 'comida') && (stock === '' || stock.toString().trim() === '')) {
              problemas.push(`El stock es obligatorio para productos tipo "${tipoValido}"`);
            }

            // Convertir números
            const precioCompraNum = parseFloat(precioCompra);
            const precioVentaNum = parseFloat(precioVenta);
            const stockNum = parseInt(stock);
            
            // Validaciones numéricas
            if (precioCompra && precioCompra.toString().trim() !== '' && isNaN(precioCompraNum)) {
              problemas.push(`El precio de compra "${precioCompra}" no es un número válido`);
            }
            
            if (precioVenta && precioVenta.toString().trim() !== '' && isNaN(precioVentaNum)) {
              problemas.push(`El precio de venta "${precioVenta}" no es un número válido`);
            }
            
            if (stock && stock.toString().trim() !== '' && isNaN(stockNum)) {
              problemas.push(`El stock "${stock}" no es un número válido`);
            }
            
            // Validar que no sean negativos
            if (!isNaN(precioCompraNum) && precioCompraNum < 0) {
              problemas.push('El precio de compra no puede ser negativo');
            }
            
            if (!isNaN(precioVentaNum) && precioVentaNum < 0) {
              problemas.push('El precio de venta no puede ser negativo');
            }
            
            if (!isNaN(stockNum) && stockNum < 0) {
              problemas.push('El stock no puede ser negativo');
            }
            
            // Validar que precio de venta >= precio de compra
            if (!isNaN(precioCompraNum) && !isNaN(precioVentaNum) && precioVentaNum < precioCompraNum) {
              problemas.push(`El precio de venta (${precioVentaNum}) no puede ser menor que el precio de compra (${precioCompraNum})`);
            }
            
            // Si hay problemas, agregar a inconsistencias y continuar
            if (problemas.length > 0) {
              inconsistenciasEncontradas.push({
                fila: numeroFila,
                producto: nombre || 'Sin nombre',
                problemas: problemas
              });
              continue;
            }
            
            // Usar valores numéricos convertidos
            const precioCompraFinal = precioCompraNum || 0;
            const precioVentaFinal = precioVentaNum || 0;
            const stockFinal = stockNum || 0;

            // Crear producto final (solo con columnas que existen en la tabla)
            const productoFinal = {
              nombre: nombre,
              tipo: tipoValido,
              precio_venta: precioVentaFinal,
              organization_id: userProfile?.organization_id,
              codigo: producto['CODIGO PRODUCTO'] || producto.codigo || producto.Codigo || producto['CODIGO *'] || 'PROD-' + Date.now() + '-' + i,
              imagen: imagen || null // Guardamos la imagen original para procesar después
            };
            
            // Agregar precio_compra solo si tiene valor (obligatorio para fisico, comida, accesorio)
            if (precioCompraFinal > 0 || tipoValido === 'fisico' || tipoValido === 'comida' || tipoValido === 'accesorio') {
              productoFinal.precio_compra = precioCompraFinal || 0;
            }
            
            // Agregar stock solo si tiene valor o es obligatorio
            if (stockFinal > 0 || tipoValido === 'fisico' || tipoValido === 'comida') {
              productoFinal.stock = stockFinal || 0;
            } else if (tipoValido === 'accesorio' && stockFinal >= 0) {
              productoFinal.stock = stockFinal; // Opcional para accesorio
            }
            
            // Agregar campos opcionales desde metadata si existen
            const metadata = {};
            const camposMetadata = ['peso', 'unidad_peso', 'dimensiones', 'marca', 'modelo', 'color', 'talla', 'material', 'categoria', 
                                   'duracion', 'descripcion', 'ingredientes', 'alergenos', 'calorias', 'porcion', 'variaciones'];
            
            camposMetadata.forEach(campo => {
              const valor = producto[campo] || producto[campo.toUpperCase()] || producto[campo.replace('_', ' ').toUpperCase()] || '';
              if (valor && valor.toString().trim() !== '') {
                metadata[campo] = valor.toString().trim();
              }
            });
            
            // Agregar fecha_vencimiento si existe
            if (producto.fecha_vencimiento || producto['FECHA VENCIMIENTO (OPCIONAL)'] || producto['FECHA_VENCIMIENTO']) {
              const fecha = producto.fecha_vencimiento || producto['FECHA VENCIMIENTO (OPCIONAL)'] || producto['FECHA_VENCIMIENTO'];
              if (fecha && fecha.toString().trim() !== '') {
                metadata.fecha_vencimiento = fecha.toString().trim();
              }
            }
            
            // Agregar metadata solo si tiene campos
            if (Object.keys(metadata).length > 0) {
              productoFinal.metadata = metadata;
            }
            productos.push(productoFinal);
          }
          
          if (productos.length === 0) {
            // Si hay inconsistencias, retornar objeto con inconsistencias sin lanzar error
            if (inconsistenciasEncontradas.length > 0) {
              resolve({ productos: [], inconsistencias: inconsistenciasEncontradas });
              return;
            }
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

          resolve({ productos: productosConImagenes, inconsistencias: inconsistenciasEncontradas });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo Excel.'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Función auxiliar para buscar campos de forma flexible
  const buscarCampoFlexible = (obj, posiblesNombres, debug = false) => {
    // Primero buscar exacto en el objeto
    for (const nombre of posiblesNombres) {
      if (obj[nombre] !== undefined && obj[nombre] !== null && String(obj[nombre]).trim() !== '') {
        if (debug) console.log(`  ✓ Encontrado exacto: ${nombre} = "${obj[nombre]}"`);
        return String(obj[nombre]).trim();
      }
    }
    
    // Luego buscar normalizando las claves del objeto
    const clavesObjeto = Object.keys(obj);
    for (const nombreBuscado of posiblesNombres) {
      const nombreNormalizado = nombreBuscado.toLowerCase().replace(/[_\s-*()]/g, '');
      for (const clave of clavesObjeto) {
        const claveNormalizada = clave.toLowerCase().replace(/[_\s-*()]/g, '');
        if (claveNormalizada === nombreNormalizado || claveNormalizada.includes(nombreNormalizado) || nombreNormalizado.includes(claveNormalizada)) {
          const valor = obj[clave];
          if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
            if (debug) console.log(`  ✓ Encontrado flexible: ${clave} (buscado: ${nombreBuscado}) = "${valor}"`);
            return String(valor).trim();
          }
        }
      }
    }
    
    if (debug) console.log(`  ✗ No encontrado. Buscado: [${posiblesNombres.join(', ')}], Disponible: [${clavesObjeto.join(', ')}]`);
    return '';
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

    // Función para parsear CSV correctamente (maneja comas dentro de comillas)
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headersRaw = parseCSVLine(lines[headerLineIndex]);
    // Normalizar headers: convertir a minúsculas y limpiar caracteres especiales
    const headers = headersRaw.map(h => {
      let normalized = h.trim().replace(/"/g, '').toLowerCase();
      // Remover asteriscos
      normalized = normalized.replace(/\*/g, '');
      // Remover paréntesis y su contenido (ej: "(OPCIONAL)")
      normalized = normalized.replace(/\([^)]*\)/g, '');
      // Reemplazar espacios por guiones bajos
      normalized = normalized.replace(/\s+/g, '_');
      // Reemplazar guiones por guiones bajos
      normalized = normalized.replace(/-/g, '_');
      // Reemplazar múltiples guiones bajos por uno solo
      normalized = normalized.replace(/__+/g, '_');
      // Remover guiones bajos al inicio y final
      normalized = normalized.replace(/^_+|_+$/g, '');
      return normalized;
    });
    
    // Debug: mostrar headers detectados
    console.log('=== HEADERS DETECTADOS ===');
    console.log('Headers originales:', headersRaw);
    console.log('Headers normalizados:', headers);
    console.log('Mapeo:', headersRaw.map((h, i) => `${h} → ${headers[i]}`).join(', '));
    
    // Crear un mapa de headers normalizados a headers originales para debugging
    const headerMap = {};
    headersRaw.forEach((original, index) => {
      headerMap[headers[index]] = original;
    });

    const productos = [];
    const inconsistenciasEncontradas = [];
    // Procesar solo las líneas después de los headers
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const numeroFila = i + 1; // Fila real en CSV (1-indexed)
      const line = lines[i].trim();
      
      // Saltar líneas de comentarios o vacías
      if (line.startsWith('#') || line === '') {
        continue;
      }
      
      const values = parseCSVLine(line);
      
      // Ajustar valores si hay menos columnas que headers (llenar con strings vacíos)
      while (values.length < headers.length) {
        values.push('');
      }
      
      // Si hay más valores que headers, truncar (puede haber columnas extra)
      if (values.length > headers.length) {
        values.splice(headers.length);
      }
      
      // Solo reportar error si la diferencia es significativa (más de 2 columnas)
      if (Math.abs(values.length - headers.length) > 2) {
        inconsistenciasEncontradas.push({
          fila: numeroFila,
          producto: 'Fila con columnas incorrectas',
          problemas: [`La fila tiene ${values.length} columnas pero se esperan ${headers.length} columnas. Headers esperados: ${headersRaw.join(', ')}`]
        });
        continue;
      }

      // Crear objeto producto con headers normalizados
      const producto = {};
      headers.forEach((header, index) => {
        // Asegurarse de que el índice existe en values (manejar columnas vacías al final)
        const valorRaw = (index < values.length && values[index] !== undefined && values[index] !== null) 
          ? values[index] 
          : '';
        const valor = valorRaw ? String(valorRaw).replace(/^"|"$/g, '').trim() : '';
        producto[header] = valor;
      });
      
      // Debug: mostrar qué se está leyendo para las primeras filas
      if (numeroFila <= headerLineIndex + 3) {
        console.log(`\n=== DEBUG Fila ${numeroFila} ===`);
        console.log('Valores leídos:', values);
        console.log('Objeto producto completo:', producto);
        console.log('Claves disponibles en objeto:', Object.keys(producto));
      }
      
      // Debug: activar para las primeras filas o si hay problemas
      const debugMode = numeroFila <= headerLineIndex + 3;
      
      // Buscar campos de forma flexible usando los headers normalizados
      if (debugMode) console.log(`\nBuscando campos para fila ${numeroFila}:`);
      
      // Buscar nombre (puede ser: nombre, name, producto, product, etc.)
      const nombre = buscarCampoFlexible(producto, ['nombre', 'name', 'producto', 'product', 'descripcion', 'description'], debugMode) || '';
      
      // Buscar tipo
      const tipo = (buscarCampoFlexible(producto, ['tipo', 'type', 'categoria', 'category'], debugMode) || 'fisico').toLowerCase();
      
      // Buscar precio de compra (puede ser: precio_compra, precio compra, costo, cost, etc.)
      const precioCompra = buscarCampoFlexible(producto, ['precio_compra', 'costo', 'cost'], debugMode) || '';
      
      // Buscar precio de venta (puede ser: precio_venta, precio venta, precio, price, etc.)
      const precioVenta = buscarCampoFlexible(producto, ['precio_venta', 'precio', 'price'], debugMode) || '';
      
      // Buscar stock (puede ser: stock, cantidad, quantity, inventario, etc.)
      const stock = buscarCampoFlexible(producto, ['stock', 'cantidad', 'quantity', 'inventario', 'inventory'], debugMode) || '';
      
      // Buscar imagen
      const imagen = buscarCampoFlexible(producto, ['imagen', 'image', 'imagen_url', 'url_imagen'], debugMode) || '';
      
      // Debug: mostrar valores encontrados para las primeras filas o si hay problemas
      if (debugMode || (!nombre || !stock)) {
        console.log(`\nFila ${numeroFila} - Resumen:`);
        console.log('  Nombre:', nombre || '❌ NO ENCONTRADO');
        console.log('  Stock:', stock || '❌ NO ENCONTRADO');
        console.log('  Precio Venta:', precioVenta || '❌ NO ENCONTRADO');
        console.log('  Precio Compra:', precioCompra || '❌ NO ENCONTRADO');
        console.log('  Tipo:', tipo);
      }
      
      // Validar tipo de producto
      const tiposValidos = ['fisico', 'servicio', 'comida', 'accesorio'];
      const tipoValido = tiposValidos.includes(tipo) ? tipo : 'fisico';
      
      // Acumular problemas encontrados
      const problemas = [];
      
      // Validar campos requeridos según tipo
      if (!nombre || nombre.trim() === '') {
        problemas.push('El nombre del producto es obligatorio');
      }
      
      if (!precioVenta || precioVenta.toString().trim() === '') {
        problemas.push('El precio de venta es obligatorio');
      }
      
      // Validar campos condicionales según tipo
      if ((tipoValido === 'fisico' || tipoValido === 'comida' || tipoValido === 'accesorio') && (!precioCompra || precioCompra.toString().trim() === '')) {
        problemas.push(`El precio de compra es obligatorio para productos tipo "${tipoValido}"`);
      }
      
      if ((tipoValido === 'fisico' || tipoValido === 'comida') && (stock === '' || stock.toString().trim() === '')) {
        problemas.push(`El stock es obligatorio para productos tipo "${tipoValido}"`);
      }

      // Convertir números
      const precioCompraNum = parseFloat(precioCompra);
      const precioVentaNum = parseFloat(precioVenta);
      const stockNum = parseInt(stock);
      
      // Validar que sean números válidos
      if (precioCompra && precioCompra.toString().trim() !== '' && isNaN(precioCompraNum)) {
        problemas.push(`El precio de compra "${precioCompra}" no es un número válido`);
      }
      
      if (precioVenta && precioVenta.toString().trim() !== '' && isNaN(precioVentaNum)) {
        problemas.push(`El precio de venta "${precioVenta}" no es un número válido`);
      }
      
      if (stock && stock.toString().trim() !== '' && isNaN(stockNum)) {
        problemas.push(`El stock "${stock}" no es un número válido`);
      }

      // Validar que no sean negativos
      if (!isNaN(precioCompraNum) && precioCompraNum < 0) {
        problemas.push('El precio de compra no puede ser negativo');
      }
      
      if (!isNaN(precioVentaNum) && precioVentaNum < 0) {
        problemas.push('El precio de venta no puede ser negativo');
      }
      
      if (!isNaN(stockNum) && stockNum < 0) {
        problemas.push('El stock no puede ser negativo');
      }
      
      // Validar que precio de venta >= precio de compra
      if (!isNaN(precioCompraNum) && !isNaN(precioVentaNum) && precioVentaNum < precioCompraNum) {
        problemas.push(`El precio de venta (${precioVentaNum}) no puede ser menor que el precio de compra (${precioCompraNum})`);
      }
      
      // Si hay problemas, agregar a inconsistencias y continuar
      if (problemas.length > 0) {
        inconsistenciasEncontradas.push({
          fila: numeroFila,
          producto: nombre || 'Sin nombre',
          problemas: problemas
        });
        continue;
      }
      
      // Usar valores numéricos convertidos
      const precioCompraFinal = precioCompraNum || 0;
      const precioVentaFinal = precioVentaNum || 0;
      const stockFinal = stockNum || 0;

      // Crear producto final (solo con columnas que existen en la tabla)
      const productoFinal = {
        nombre: nombre,
        tipo: tipoValido,
        precio_venta: precioVentaFinal,
        organization_id: userProfile?.organization_id,
        codigo: producto.codigo || producto.Codigo || producto.CODIGO || producto['CODIGO *'] || 'PROD-' + Date.now() + '-' + i,
        imagen: imagen || null // Guardamos la imagen original para procesar después
      };
      
      // Agregar precio_compra solo si tiene valor (obligatorio para fisico, comida, accesorio)
      if (precioCompraFinal > 0 || tipoValido === 'fisico' || tipoValido === 'comida' || tipoValido === 'accesorio') {
        productoFinal.precio_compra = precioCompraFinal || 0;
      }
      
      // Agregar stock solo si tiene valor o es obligatorio
      if (stockFinal > 0 || tipoValido === 'fisico' || tipoValido === 'comida') {
        productoFinal.stock = stockFinal || 0;
      } else if (tipoValido === 'accesorio' && stockFinal >= 0) {
        productoFinal.stock = stockFinal; // Opcional para accesorio
      }
      
      // Agregar campos opcionales desde metadata si existen
      const metadata = {};
      const camposMetadata = ['peso', 'unidad_peso', 'dimensiones', 'marca', 'modelo', 'color', 'talla', 'material', 'categoria', 
                             'duracion', 'descripcion', 'ingredientes', 'alergenos', 'calorias', 'porcion', 'variaciones'];
      
      camposMetadata.forEach(campo => {
        const valor = producto[campo] || producto[campo.toUpperCase()] || producto[campo.replace('_', ' ').toUpperCase()] || '';
        if (valor && valor.toString().trim() !== '') {
          metadata[campo] = valor.toString().trim();
        }
      });
      
      // Agregar fecha_vencimiento si existe
      if (producto.fecha_vencimiento || producto['FECHA VENCIMIENTO (OPCIONAL)'] || producto['FECHA_VENCIMIENTO']) {
        const fecha = producto.fecha_vencimiento || producto['FECHA VENCIMIENTO (OPCIONAL)'] || producto['FECHA_VENCIMIENTO'];
        if (fecha && fecha.toString().trim() !== '') {
          metadata.fecha_vencimiento = fecha.toString().trim();
        }
      }
      
      // Agregar metadata solo si tiene campos
      if (Object.keys(metadata).length > 0) {
        productoFinal.metadata = metadata;
      }
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
    
    // Retornar productos e inconsistencias
    return { productos: productosConImagenes, inconsistencias: inconsistenciasEncontradas };
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
    setInconsistencias([]); // Limpiar inconsistencias previas

    try {
      const isCSV = archivo.type === 'text/csv' || archivo.name.endsWith('.csv');
      const isExcel = archivo.name.endsWith('.xlsx') || archivo.name.endsWith('.xls');
      
      let productos;
      
      let resultado;
      
      if (isExcel) {
        resultado = await parseExcel(archivo);
      } else if (isCSV) {
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(archivo);
        });
        resultado = await parseCSV(text);
      } else {
        throw new Error('Formato de archivo no soportado.');
      }
      
      // Extraer productos e inconsistencias del resultado
      productos = resultado.productos || [];
      const inconsistenciasParseadas = resultado.inconsistencias || [];
      
      // Guardar inconsistencias en el estado
      if (inconsistenciasParseadas.length > 0) {
        setInconsistencias(inconsistenciasParseadas);
      }
      
      if (productos.length === 0) {
        // Si hay inconsistencias, no lanzar error, las inconsistencias ya se mostraron
        if (inconsistenciasParseadas.length > 0) {
          setProcesando(false);
          return;
        }
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
      // Solo mostrar error si NO hay inconsistencias (las inconsistencias tienen prioridad)
      if (inconsistencias.length === 0) {
        setError(err.message || 'Error al procesar el archivo CSV.');
      }
    } finally {
      setProcesando(false);
    }
  };

  const descargarPlantilla = (tipo = 'csv') => {
    const archivos = {
      csv: '/templates/plantilla_productos.csv',
      excel: '/templates/plantilla-importacion-productos.xlsx'
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

          {error && inconsistencias.length === 0 && (
            <div className="importar-csv-error">
              ❌ {error}
            </div>
          )}

          {inconsistencias.length > 0 && (
            <div className="importar-csv-inconsistencias">
              <h3>⚠️ Inconsistencias Encontradas ({inconsistencias.length})</h3>
              <p>Se encontraron problemas en las siguientes filas. Estas filas no se importaron:</p>
              <div className="importar-csv-inconsistencias-list">
                {inconsistencias.map((inc, index) => (
                  <div key={index} className="importar-csv-inconsistencia-item">
                    <div className="importar-csv-inconsistencia-header">
                      <strong>Fila {inc.fila}:</strong> {inc.producto}
                    </div>
                    <ul className="importar-csv-inconsistencia-problemas">
                      {inc.problemas.map((problema, pIndex) => (
                        <li key={pIndex}>• {problema}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
