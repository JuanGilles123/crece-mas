import React, { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, Printer, Share2, Download } from "lucide-react";
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './ReciboVenta.css';

/**
 * Recibo de venta mejorado con opciones de IVA y generación de PDF
 * - Opción de incluir/excluir IVA
 * - Generación de PDF optimizada
 * - Guardado en almacenamiento del usuario
 */

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReciboVenta({ venta, onNuevaVenta, onCerrar }) {
  const { user } = useAuth();
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [datosEmpresa, setDatosEmpresa] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const reciboRef = useRef(null);

  const cargarDatosEmpresa = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('datos_empresa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando datos empresa:', error);
      } else if (data) {
        setDatosEmpresa(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargandoDatos(false);
    }
  }, [user]);

  // Cargar datos de la empresa
  useEffect(() => {
    cargarDatosEmpresa();
  }, [cargarDatosEmpresa]);

  if (!venta) return null;

  const subtotal = venta.items.reduce((s, i) => s + i.qty * i.precio_venta, 0);
  const total = venta.total || subtotal; // Usar el total que viene de la venta
  const cambio = venta.pagoCliente - total;

  // Validar que los datos de empresa estén configurados
  const datosCompletos = datosEmpresa && 
    datosEmpresa.nombre_empresa && 
    datosEmpresa.direccion && 
    datosEmpresa.telefono && 
    datosEmpresa.nit;

  const generarPDF = async () => {
    if (!reciboRef.current) return;

    // Validar datos de empresa
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }
    
    setGenerandoPDF(true);
    try {
      // Crear canvas del recibo con configuración optimizada para menor tamaño
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2, // Reducido de 3 a 2 para menor tamaño
        useCORS: true,
        backgroundColor: 'var(--bg-card)',
        width: reciboRef.current.scrollWidth,
        height: reciboRef.current.scrollHeight,
        logging: false,
        allowTaint: true,
        removeContainer: true, // Optimización adicional
        imageTimeout: 0 // Evitar timeouts
      });

      // Crear PDF con tamaño personalizado basado en el contenido
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // JPEG con 80% calidad en lugar de PNG
      
      // Calcular dimensiones del PDF basadas en el contenido
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Crear PDF con altura dinámica
      const pdf = new jsPDF({
        orientation: imgHeight > 297 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: [210, Math.max(297, imgHeight + 20)] // Altura mínima A4, o más si es necesario
      });
      
      // Agregar imagen al PDF centrada
      const x = 0;
      const y = 10; // Margen superior
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

      // Generar nombre del archivo único
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `recibo_${venta.id}_${fecha}_${hora}.pdf`;
      
      // Guardar en Supabase Storage
      const pdfBlob = pdf.output('blob');
      const { data, error } = await supabase.storage
        .from('recibos')
        .upload(`${user.id}/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error('Error guardando PDF:', error);
        alert('Error al guardar el PDF. Se descargará localmente.');
        pdf.save(fileName);
      } else {
        console.log('PDF guardado en storage:', data);
        alert(`✅ PDF generado exitosamente: ${fileName}`);
        // También descargar localmente
        pdf.save(fileName);
      }

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('❌ Error al generar el PDF. Verifica que todos los datos estén configurados.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const compartir = () => {
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }

    const textoRecibo = `
🏪 ${datosEmpresa.nombre_empresa}
📍 ${datosEmpresa.direccion}
📞 ${datosEmpresa.telefono}
🆔 NIT: ${datosEmpresa.nit}
${datosEmpresa.email ? `📧 ${datosEmpresa.email}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RECIBO DE VENTA #${venta.id}
📅 ${venta.date} - ${venta.time}
👤 Cajero: ${venta.cashier}
🏪 ${venta.register}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 PRODUCTOS:
${venta.items.map(item => 
  `• ${item.nombre} (x${item.qty}) - ${formatCOP(item.qty * item.precio_venta)}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 TOTALES:
Subtotal: ${formatCOP(subtotal)}
TOTAL: ${formatCOP(total)}

💳 PAGO:
Método: ${venta.metodo_pago}
Pago del cliente: ${formatCOP(venta.pagoCliente)}
Cambio: ${cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¡Gracias por su compra! 🎉
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textoRecibo)}`;
    window.open(whatsappUrl, '_blank');
  };

  const imprimir = () => {
    // Validar datos de empresa
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }

    // Crear una ventana nueva para imprimir solo el recibo
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    
    // Obtener el HTML del recibo
    const reciboHTML = reciboRef.current.outerHTML;
    
    // Crear el documento HTML completo para impresión
    const documentoImpresion = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Venta #${venta.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .recibo-container { 
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 20px !important;
                max-width: none !important;
                width: 100% !important;
              }
              .recibo-actions { display: none !important; }
              .recibo-controls { display: none !important; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: var(--bg-card);
            }
            .recibo-container {
              background: var(--bg-card);
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              max-width: 400px;
              margin: 0 auto;
              padding: 20px;
            }
            .recibo-header {
              text-align: center;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .recibo-logo {
              max-width: 80px;
              max-height: 80px;
              margin-bottom: 10px;
            }
            .recibo-empresa {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .recibo-datos {
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            }
            .recibo-info {
              text-align: center;
              margin-bottom: 20px;
            }
            .recibo-success {
              color: #10b981;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .recibo-id {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .recibo-fecha {
              font-size: 12px;
              color: #9ca3af;
            }
            .recibo-cajero {
              font-size: 11px;
              color: #9ca3af;
              margin-top: 5px;
            }
            .recibo-productos {
              margin-bottom: 20px;
            }
            .recibo-productos h3 {
              font-size: 14px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .recibo-tabla {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .recibo-tabla th {
              background-color: #f9fafb;
              padding: 8px 4px;
              text-align: left;
              font-weight: bold;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            .recibo-tabla td {
              padding: 6px 4px;
              border-bottom: 1px solid #f3f4f6;
            }
            .recibo-totales {
              border-top: 2px solid #e5e7eb;
              padding-top: 15px;
              margin-bottom: 20px;
            }
            .recibo-total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .recibo-total-final {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
              margin-top: 10px;
            }
            .recibo-pago {
              border-top: 2px solid #e5e7eb;
              padding-top: 15px;
              margin-bottom: 20px;
            }
            .recibo-pago h3 {
              font-size: 14px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .recibo-cambio {
              font-weight: bold;
            }
            .recibo-cambio.positivo {
              color: #10b981;
            }
            .recibo-cambio.negativo {
              color: #ef4444;
            }
            .recibo-footer {
              text-align: center;
              border-top: 2px solid #e5e7eb;
              padding-top: 15px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          ${reciboHTML}
        </body>
      </html>
    `;
    
    // Escribir el documento en la ventana
    ventanaImpresion.document.write(documentoImpresion);
    ventanaImpresion.document.close();
    
    // Esperar a que se cargue y luego imprimir
    ventanaImpresion.onload = () => {
      ventanaImpresion.focus();
      ventanaImpresion.print();
      // Cerrar la ventana después de imprimir
      ventanaImpresion.onafterprint = () => {
        ventanaImpresion.close();
      };
    };
  };

  const nuevaVenta = () => {
    if (onNuevaVenta) {
      onNuevaVenta();
    }
  };

  // Mostrar mensaje si no hay datos de empresa
  if (cargandoDatos) {
    return (
      <div className="recibo-overlay">
        <div className="recibo-container">
          <div className="recibo-loading">
            <div className="recibo-loading-spinner"></div>
            <p>Cargando datos de la empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!datosCompletos) {
    return (
      <div className="recibo-overlay">
        <div className="recibo-container">
          <div className="recibo-error">
            <div className="recibo-error-icon">⚠️</div>
            <h3>Datos de Facturación Incompletos</h3>
            <p>Para generar recibos profesionales, necesitas configurar los datos de tu empresa.</p>
            <div className="recibo-error-actions">
              <button className="recibo-btn recibo-btn-primary" onClick={onNuevaVenta}>
                Continuar sin recibo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recibo-overlay">
      <div className="recibo-container">

        {/* Contenido del recibo */}
        <div className="recibo-content" ref={reciboRef}>
          {/* Logo y datos del establecimiento */}
          <div className="recibo-header">
            {datosEmpresa.logo_url && (
              <img
                src={datosEmpresa.logo_url}
                alt="Logo establecimiento"
                className="recibo-logo"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <h1 className="recibo-empresa-nombre">{datosEmpresa.nombre_empresa}</h1>
            <p className="recibo-empresa-direccion">{datosEmpresa.direccion}</p>
            {datosEmpresa.ciudad && datosEmpresa.departamento && (
              <p className="recibo-empresa-ciudad">{datosEmpresa.ciudad}, {datosEmpresa.departamento}</p>
            )}
            <p className="recibo-empresa-telefono">Tel: {datosEmpresa.telefono}</p>
            {datosEmpresa.email && (
              <p className="recibo-empresa-email">Email: {datosEmpresa.email}</p>
            )}
            <p className="recibo-empresa-nit">NIT: {datosEmpresa.nit}</p>
          </div>

          {/* Info del recibo */}
          <div className="recibo-info-section">
            <CheckCircle className="recibo-success-icon" />
            <h2 className="recibo-title">Venta registrada</h2>
            <p className="recibo-id">Recibo #{venta.id}</p>
            <p className="recibo-datetime">
              {venta.date} — {venta.time}
            </p>
            <p className="recibo-info">{venta.register} · Cajero: {venta.cashier}</p>
          </div>

          {/* Tabla de productos */}
          <div className="recibo-products">
            <h3 className="recibo-section-title">Detalle de la venta</h3>
            {venta.items.length === 0 ? (
              <p className="recibo-no-products">No hay productos en esta venta.</p>
            ) : (
              <table className="recibo-table">
                <thead>
                  <tr className="recibo-table-header">
                    <th className="recibo-th-cant">Cant.</th>
                    <th className="recibo-th-producto">Producto</th>
                    <th className="recibo-th-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((item, idx) => (
                    <tr key={idx} className="recibo-table-row">
                      <td className="recibo-td-cant">{item.qty}</td>
                      <td className="recibo-td-producto">{item.nombre}</td>
                      <td className="recibo-td-total">{formatCOP(item.qty * item.precio_venta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Totales */}
          <div className="recibo-totals">
            <div className="recibo-total-row">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="recibo-total-row recibo-total-final">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
            <div className="recibo-payment-method">
              <span>Método de pago</span>
              <span>{venta.metodo_pago}</span>
            </div>
          </div>

          {/* Pago y cambio */}
          <div className="recibo-payment">
            <div className="recibo-payment-row">
              <span>Pago del cliente</span>
              <span>{formatCOP(venta.pagoCliente)}</span>
            </div>
            <div className="recibo-payment-row recibo-change">
              <span>Cambio</span>
              <span className={cambio < 0 ? "recibo-change-negative" : "recibo-change-positive"}>
                {cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}
              </span>
            </div>
          </div>

          {/* Pie del recibo */}
          <div className="recibo-footer">
            <p className="recibo-thanks">¡Gracias por su compra!</p>
            <p className="recibo-footer-text">Conserve este recibo como comprobante de pago</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="recibo-actions">
          <button className="recibo-btn recibo-btn-secondary" onClick={compartir}>
            <Share2 className="recibo-btn-icon" /> Compartir
          </button>
          <button className="recibo-btn recibo-btn-secondary" onClick={imprimir}>
            <Printer className="recibo-btn-icon" /> Imprimir
          </button>
          <button 
            className="recibo-btn recibo-btn-secondary" 
            onClick={generarPDF}
            disabled={generandoPDF}
          >
            <Download className="recibo-btn-icon" /> 
            {generandoPDF ? 'Generando...' : 'PDF'}
          </button>
          <button className="recibo-btn recibo-btn-primary" onClick={nuevaVenta}>
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  );
}
