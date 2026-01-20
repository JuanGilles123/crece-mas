import React, { useState, useRef } from "react";
import { CheckCircle, Printer, Share2, Download, Banknote, CreditCard, Smartphone } from "lucide-react";
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
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
  const { user, organization } = useAuth();
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const reciboRef = useRef(null);

  // Usar datos de la organización directamente desde AuthContext
  const datosEmpresa = organization ? {
    razon_social: organization.razon_social || organization.name || 'Mi Negocio',
    nit: organization.nit || '',
    direccion: organization.direccion || '',
    telefono: organization.telefono || '',
    email: organization.email || '',
    ciudad: organization.ciudad || '',
    mensaje_factura: organization.mensaje_factura || 'Gracias por su compra'
  } : null;

  if (!venta) return null;

  // Calcular subtotal incluyendo toppings si existen
  const calcularSubtotalItem = (item) => {
    let precioItem = item.precio_venta || 0;
    // Si tiene precio_total (incluye toppings), usarlo; si no, calcular
    if (item.precio_total) {
      return item.precio_total * item.qty;
    }
    // Si tiene toppings, sumar sus precios
    if (item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0) {
      const precioToppings = item.toppings.reduce((sum, topping) => {
        return sum + (topping.precio || 0) * (topping.cantidad || 1);
      }, 0);
      precioItem = precioItem + precioToppings;
    }
    return precioItem * item.qty;
  };

  const subtotal = venta.items.reduce((s, i) => s + calcularSubtotalItem(i), 0);
  const total = venta.total || subtotal; // Usar el total que viene de la venta
  const cambio = venta.pagoCliente - total;

  // Detectar si es pago mixto y extraer detalles del string si no vienen en el objeto
  const esPagoMixto = venta.metodo_pago === 'Mixto' || venta.metodo_pago?.startsWith('Mixto (');
  let detallesPagoMixto = venta.detalles_pago_mixto;
  
  // Si no hay detalles pero el método de pago es un string con formato "Mixto (...)"
  if (esPagoMixto && !detallesPagoMixto && typeof venta.metodo_pago === 'string') {
    // Intentar extraer los detalles del string
    const match = venta.metodo_pago.match(/Mixto \((.+?): (.+?) \+ (.+?): (.+?)\)/);
    if (match) {
      detallesPagoMixto = {
        metodo1: match[1],
        monto1: parseFloat(match[2].replace(/[^\d]/g, '')),
        metodo2: match[3],
        monto2: parseFloat(match[4].replace(/[^\d]/g, ''))
      };
    }
  }

  // Función para obtener icono según método de pago
  const getIconoMetodoPago = (metodo) => {
    const iconStyle = { width: '14px', height: '14px', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' };
    switch(metodo?.toLowerCase()) {
      case 'efectivo':
        return <Banknote style={iconStyle} />;
      case 'transferencia':
        return <Smartphone style={iconStyle} />;
      case 'tarjeta':
        return <CreditCard style={iconStyle} />;
      default:
        return null;
    }
  };

  // Validar que los datos de organización estén configurados
  const datosCompletos = datosEmpresa && 
    datosEmpresa.razon_social; // Solo requerimos razon_social como mínimo

  const generarPDF = async () => {
    if (!reciboRef.current) {
      console.error('❌ Error: reciboRef no está disponible');
      alert('❌ Error al generar el PDF. Intenta de nuevo.');
      return;
    }

    // Validar datos de empresa
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }
    
    setGenerandoPDF(true);
    console.log('📄 Iniciando generación de PDF...');
    
    try {
      // Crear canvas del recibo con configuración optimizada
      console.log('📸 Capturando recibo como imagen...');
      const canvas = await html2canvas(reciboRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: reciboRef.current.scrollWidth,
        height: reciboRef.current.scrollHeight,
        logging: true, // Activar logging para debugging
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 15000
      });

      console.log('✅ Imagen capturada:', canvas.width, 'x', canvas.height);

      // Crear PDF con tamaño personalizado basado en el contenido
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Calcular dimensiones del PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('📋 Creando PDF con dimensiones:', imgWidth, 'x', imgHeight, 'mm');
      
      // Crear PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, Math.max(297, imgHeight + 20)]
      });
      
      // Agregar imagen al PDF
      const x = 0;
      const y = 10;
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

      // Generar nombre del archivo único
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `recibo_${venta.id}_${fecha}_${hora}.pdf`;
      
      console.log('💾 Descargando PDF:', fileName);
      
      // Descargar el PDF directamente
      pdf.save(fileName);
      
      // Intentar guardar en Supabase Storage (opcional, no bloqueante)
      try {
        const pdfBlob = pdf.output('blob');
        console.log('☁️ Intentando guardar en Supabase Storage...');
        
        const { data, error: storageError } = await supabase.storage
          .from('recibos')
          .upload(`${organization?.id || user.id}/${fileName}`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (storageError) {
          console.warn('⚠️ No se pudo guardar en Storage:', storageError.message);
        } else {
          console.log('✅ PDF guardado en Storage:', data);
        }
      } catch (storageError) {
        console.warn('⚠️ Error opcional de Storage:', storageError);
      }
      
      alert(`✅ PDF descargado exitosamente: ${fileName}`);

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      console.error('Detalles del error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`❌ Error al generar el PDF: ${error.message || 'Error desconocido'}\n\nRevisa la consola del navegador para más detalles.`);
    } finally {
      setGenerandoPDF(false);
      console.log('✅ Proceso de generación PDF finalizado');
    }
  };

  const compartir = () => {
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }

    const textoRecibo = `
🏪 ${datosEmpresa.razon_social}
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

  // Mostrar mensaje si no hay organización cargada
  if (!organization) {
    return (
      <div className="recibo-overlay">
        <div className="recibo-container">
          <div className="recibo-loading">
            <div className="recibo-loading-spinner"></div>
            <p>Cargando información de la organización...</p>
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
        <div className="recibo-content" ref={reciboRef} style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          fontFamily: 'Arial, sans-serif',
          color: '#111827',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          {/* Logo y datos del establecimiento */}
          <div className="recibo-header" style={{
            textAlign: 'center',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            {datosEmpresa.logo_url && (
              <img
                src={datosEmpresa.logo_url}
                alt="Logo establecimiento"
                className="recibo-logo"
                style={{
                  width: '4rem',
                  height: '4rem',
                  objectFit: 'contain',
                  margin: '0 auto 0.5rem',
                  borderRadius: '0.5rem'
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <h1 className="recibo-empresa-nombre" style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>{datosEmpresa.razon_social}</h1>
            <p className="recibo-empresa-direccion" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 0.25rem 0'
            }}>{datosEmpresa.direccion}</p>
            {datosEmpresa.ciudad && (
              <p className="recibo-empresa-ciudad" style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 0.25rem 0'
              }}>{datosEmpresa.ciudad}</p>
            )}
            <p className="recibo-empresa-telefono" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 0.25rem 0'
            }}>Tel: {datosEmpresa.telefono}</p>
            {datosEmpresa.email && (
              <p className="recibo-empresa-email" style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 0.25rem 0'
              }}>Email: {datosEmpresa.email}</p>
            )}
            <p className="recibo-empresa-nit" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0',
              fontWeight: '500'
            }}>NIT: {datosEmpresa.nit}</p>
          </div>

          {/* Info del recibo */}
          <div className="recibo-info-section" style={{
            textAlign: 'center',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle className="recibo-success-icon" style={{
              width: '3rem',
              height: '3rem',
              color: '#10b981',
              margin: '0 auto 0.5rem',
              display: 'block'
            }} />
            <h2 className="recibo-title" style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>Venta registrada</h2>
            <p className="recibo-id" style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0 0 0.25rem 0',
              fontWeight: '600'
            }}>Recibo #{venta.id}</p>
            <p className="recibo-datetime" style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              margin: '0 0 0.25rem 0'
            }}>
              {venta.date} — {venta.time}
            </p>
            <p className="recibo-info" style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: '0'
            }}>{venta.register} · Cajero: {venta.cashier}</p>
          </div>

          {/* Tabla de productos */}
          <div className="recibo-products" style={{
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <h3 className="recibo-section-title" style={{
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.75rem 0',
              fontSize: '1rem'
            }}>Detalle de la venta</h3>
            {venta.items.length === 0 ? (
              <p className="recibo-no-products" style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                textAlign: 'center',
                padding: '1rem'
              }}>No hay productos en esta venta.</p>
            ) : (
              <table className="recibo-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr className="recibo-table-header" style={{
                    background: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <th className="recibo-th-cant" style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.25rem',
                      fontWeight: '600',
                      color: '#111827',
                      width: '15%'
                    }}>Cant.</th>
                    <th className="recibo-th-producto" style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.25rem',
                      fontWeight: '600',
                      color: '#111827',
                      width: '60%'
                    }}>Producto</th>
                    <th className="recibo-th-total" style={{
                      textAlign: 'right',
                      padding: '0.5rem 0.25rem',
                      fontWeight: '600',
                      color: '#111827',
                      width: '25%'
                    }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((item, idx) => {
                    const tieneToppings = item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0;
                    const precioItemBase = item.precio_venta || 0;
                    const precioToppings = tieneToppings 
                      ? item.toppings.reduce((sum, t) => sum + (t.precio || 0) * (t.cantidad || 1), 0)
                      : 0;
                    const precioTotalItem = item.precio_total || (precioItemBase + precioToppings);
                    const totalItem = precioTotalItem * item.qty;

                    return (
                      <React.Fragment key={idx}>
                        <tr className="recibo-table-row" style={{
                          borderBottom: tieneToppings ? 'none' : '1px solid #f3f4f6'
                        }}>
                          <td className="recibo-td-cant" style={{
                            padding: '0.5rem 0.25rem',
                            color: '#111827',
                            fontWeight: '500',
                            verticalAlign: 'top',
                            paddingTop: '0.75rem'
                          }}>{item.qty}</td>
                          <td className="recibo-td-producto" style={{
                            padding: '0.5rem 0.25rem',
                            color: '#374151',
                            verticalAlign: 'top',
                            paddingTop: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontWeight: '500' }}>{item.nombre}</span>
                              {tieneToppings && (
                                <div style={{
                                  marginTop: '0.25rem',
                                  paddingLeft: '0.75rem',
                                  fontSize: '0.8rem',
                                  color: '#6b7280'
                                }}>
                                  <div style={{ 
                                    marginBottom: '0.25rem',
                                    fontWeight: '500',
                                    color: '#4b5563'
                                  }}>
                                    Toppings:
                                  </div>
                                  {item.toppings.map((topping, tIdx) => (
                                    <div key={tIdx} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      marginBottom: '0.125rem'
                                    }}>
                                      <span>
                                        • {topping.nombre}
                                        {topping.cantidad > 1 && ` (x${topping.cantidad})`}
                                      </span>
                                      <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                                        {formatCOP((topping.precio || 0) * (topping.cantidad || 1))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="recibo-td-total" style={{
                            padding: '0.5rem 0.25rem',
                            color: '#111827',
                            fontWeight: '600',
                            textAlign: 'right',
                            verticalAlign: 'top',
                            paddingTop: '0.75rem'
                          }}>{formatCOP(totalItem)}</td>
                        </tr>
                        {tieneToppings && (
                          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td colSpan="3" style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              Precio base: {formatCOP(precioItemBase)} {tieneToppings && `+ Toppings: ${formatCOP(precioToppings)}`} = {formatCOP(precioTotalItem)} c/u
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Totales */}
          <div className="recibo-totals" style={{
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <div className="recibo-total-row" style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              padding: '0.25rem 0',
              color: '#374151'
            }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: '500' }}>{formatCOP(subtotal)}</span>
            </div>
            <div className="recibo-total-row recibo-total-final" style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '700',
              fontSize: '1.25rem',
              color: '#111827',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <span>TOTAL</span>
              <span>{formatCOP(total)}</span>
            </div>
            <div className="recibo-payment-method" style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid #f3f4f6'
            }}>
              <span>Método de pago</span>
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                {esPagoMixto ? 'Mixto' : venta.metodo_pago}
              </span>
            </div>
            
            {/* Detalles de pago mixto */}
            {esPagoMixto && detallesPagoMixto && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginTop: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}>Desglose de Pago Mixto</div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {getIconoMetodoPago(detallesPagoMixto.metodo1)}
                    {detallesPagoMixto.metodo1}
                  </span>
                  <span style={{ fontWeight: '600', color: '#0284c7' }}>
                    {formatCOP(detallesPagoMixto.monto1)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#374151'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {getIconoMetodoPago(detallesPagoMixto.metodo2)}
                    {detallesPagoMixto.metodo2}
                  </span>
                  <span style={{ fontWeight: '600', color: '#0284c7' }}>
                    {formatCOP(detallesPagoMixto.monto2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pago y cambio */}
          <div className="recibo-payment" style={{
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '1rem',
            marginBottom: '1rem'
          }}>
            <div className="recibo-payment-row" style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              padding: '0.25rem 0',
              color: '#374151'
            }}>
              <span>Pago del cliente</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{formatCOP(venta.pagoCliente)}</span>
            </div>
            <div className="recibo-payment-row recibo-change" style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              fontWeight: '600',
              paddingTop: '0.5rem',
              borderTop: '1px solid #f3f4f6',
              marginTop: '0.25rem'
            }}>
              <span style={{ color: '#374151' }}>Cambio</span>
              <span style={{
                color: cambio < 0 ? '#ef4444' : '#10b981',
                fontWeight: '700',
                fontSize: '1rem'
              }}>
                {cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}
              </span>
            </div>
          </div>

          {/* Pie del recibo */}
          <div className="recibo-footer" style={{
            textAlign: 'center',
            borderTop: '2px solid #e5e7eb',
            paddingTop: '1rem'
          }}>
            <p className="recibo-thanks" style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#10b981',
              margin: '0 0 0.5rem 0'
            }}>¡Gracias por su compra!</p>
            <p className="recibo-footer-text" style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: '0'
            }}>Conserve este recibo como comprobante de pago</p>
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
