import React, { useState, useRef } from "react";
import { CheckCircle, Printer, Share2, Download, Banknote, CreditCard, Smartphone, MessageCircle, Loader2, Image } from "lucide-react";
import { supabase } from '../../services/api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { printReceipt, isBluetoothSupported } from '../../utils/thermalPrinter';
import { descargarImagen, compartirWhatsApp } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
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

export default function ReciboVenta({ venta, onNuevaVenta, onCerrar, mostrarCerrar = false }) {
  const { user, organization } = useAuth();
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [descargandoImagen, setDescargandoImagen] = useState(false);
  const [compartiendoWA, setCompartiendoWA] = useState(false);
  const [imprimiendoBluetooth, setImprimiendoBluetooth] = useState(false);
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

  // Usar subtotal de la venta si existe, sino calcularlo
  const subtotalCalculado = venta.items.reduce((s, i) => s + calcularSubtotalItem(i), 0);
  const subtotal = venta.subtotal || subtotalCalculado;

  // Obtener información del descuento
  const descuentoInfo = venta.descuento || null;
  const montoDescuento = descuentoInfo?.monto || 0;

  const total = venta.total || (subtotal - montoDescuento); // Usar el total que viene de la venta
  const cambio = venta.pagoCliente - total;

  // Detectar si es pago mixto y extraer detalles del string si no vienen en el objeto
  const esCotizacion = venta.esCotizacion || venta.metodo_pago === 'COTIZACION';
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
    switch (metodo?.toLowerCase()) {
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

    try {
      // Crear canvas del recibo con configuración optimizada
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

      // Crear PDF con tamaño personalizado basado en el contenido
      const imgData = canvas.toDataURL('image/jpeg', 0.85);

      // Calcular dimensiones del PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

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

      // Descargar el PDF directamente
      pdf.save(fileName);

      // Intentar guardar en Supabase Storage (opcional, no bloqueante)
      try {
        const pdfBlob = pdf.output('blob');

        const { error: storageError } = await supabase.storage
          .from('recibos')
          .upload(`${organization?.id || user.id}/${fileName}`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });

        // Error silencioso si falla el guardado en Storage
        if (storageError) {
          // No hacer nada, es opcional
        }
      } catch (storageError) {
        // Error silencioso
      }

      alert(`✅ PDF descargado exitosamente: ${fileName}`);

    } catch (error) {
      alert(`❌ Error al generar el PDF: ${error.message || 'Error desconocido'}`);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const buildTextoRecibo = () => `
🏪 ${datosEmpresa.razon_social}
📍 ${datosEmpresa.direccion}
📞 ${datosEmpresa.telefono}
🆔 NIT: ${datosEmpresa.nit}
${datosEmpresa.email ? `📧 ${datosEmpresa.email}` : ''}

📋 RECIBO DE VENTA #${venta.id}
📅 ${venta.date} - ${venta.time}
👤 Cajero: ${venta.cashier}
${venta.cliente ? `👤 Cliente: ${venta.cliente.nombre}` : ''}

📦 PRODUCTOS:
${venta.items.map(item => {
    const variante = item.variant_nombre ? ` (${item.variant_nombre})` : '';
    return `• ${item.nombre}${variante} (x${item.qty}) - ${formatCOP(item.qty * item.precio_venta)}`;
  }).join('\n')}

💰 Subtotal: ${formatCOP(subtotal)}
${montoDescuento > 0 ? `Descuento: -${formatCOP(montoDescuento)}` : ''}
TOTAL: ${formatCOP(total)}
${esCotizacion ? '\n📋 COTIZACIÓN — Pendiente de pago' : `\n💳 Método: ${venta.metodo_pago}\nCambio: ${cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}`}

¡Gracias por su compra! 🎉`.trim();

  const compartirWA = async (enviarDirecto = false) => {
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.');
      return;
    }
    if (!reciboRef.current) return;
    setCompartiendoWA(true);
    try {
      const telefono = enviarDirecto && venta.cliente?.telefono
        ? venta.cliente.telefono.replace(/\D/g, '')
        : null;
      await compartirWhatsApp(
        reciboRef.current,
        buildTextoRecibo(),
        `recibo_${venta.id}`,
        telefono
      );
    } catch (err) {
      toast.error('Error al compartir por WhatsApp');
    } finally {
      setCompartiendoWA(false);
    }
  };

  const descargarImagenRecibo = async () => {
    if (!reciboRef.current) return;
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.');
      return;
    }
    setDescargandoImagen(true);
    try {
      await descargarImagen(reciboRef.current, `recibo_${venta.id}`);
      toast.success('Imagen descargada');
    } catch (err) {
      toast.error('Error al descargar imagen');
    } finally {
      setDescargandoImagen(false);
    }
  };

  const imprimirBluetooth = async () => {
    // Validar datos de empresa
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }

    // Verificar soporte de Bluetooth
    if (!isBluetoothSupported()) {
      alert('⚠️ Tu navegador no soporta impresión térmica directa.\n\nUsa Chrome, Edge u Opera para esta funcionalidad.\n\nPuedes usar el botón "Imprimir" normal como alternativa.');
      return;
    }

    // Verificar HTTPS (excepto localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert('⚠️ Se requiere HTTPS para impresión térmica directa.\n\nLa impresión térmica solo funciona en conexiones seguras (HTTPS) o en localhost.');
      return;
    }

    setImprimiendoBluetooth(true);

    try {
      // Verificar si es la primera vez en esta sesión
      const impresoraGuardada = user?.user_metadata?.impresora_bluetooth;
      if (impresoraGuardada && typeof navigator.bluetooth?.getDevices === 'function') {
        try {
          const devices = await navigator.bluetooth.getDevices();
          const deviceEncontrado = devices.find(d => d.id === impresoraGuardada.id);
          if (!deviceEncontrado) {
            // Es la primera vez en esta sesión, mostrar mensaje informativo
            toast('Selecciona tu impresora configurada en el diálogo', {
              icon: 'ℹ️',
              duration: 3000
            });
          }
        } catch (e) {
          // Si getDevices no está disponible, mostrar mensaje
          toast('Selecciona tu impresora configurada en el diálogo', {
            icon: 'ℹ️',
            duration: 3000
          });
        }
      }

      await printReceipt(venta, datosEmpresa, user);
      toast.success('✅ Recibo impreso correctamente');
    } catch (error) {
      console.error('Error imprimiendo Bluetooth:', error);
      let mensajeError = 'Error al imprimir: ';

      if (error.message) {
        mensajeError += error.message;
      } else if (error.name === 'NotFoundError') {
        mensajeError += 'No se encontró ninguna impresora térmica. Asegúrate de que esté encendida y en modo de emparejamiento.';
      } else if (error.name === 'SecurityError') {
        mensajeError += 'Se requiere HTTPS para impresión térmica directa.';
      } else if (error.name === 'NetworkError') {
        mensajeError += 'Error de conexión. Verifica que la impresora esté cerca y encendida.';
      } else {
        mensajeError += 'Error desconocido. Intenta de nuevo.';
      }

      toast.error(mensajeError);
    } finally {
      setImprimiendoBluetooth(false);
    }
  };

  const imprimir = async () => {
    // Validar datos de empresa
    if (!datosCompletos) {
      alert('⚠️ No has configurado los datos de facturación.\n\nVe a tu perfil → Configuración de Facturación para completar los datos de tu empresa.');
      return;
    }

    // Verificar si hay impresora térmica configurada y disponible
    const impresoraConfigurada = user?.user_metadata?.impresora_configuracion || user?.user_metadata?.impresora_bluetooth;
    const tieneImpresoraTermica = impresoraConfigurada && impresoraConfigurada.tipo === 'bluetooth';

    // Si hay impresora térmica configurada y Bluetooth está disponible, usar impresión térmica
    if (tieneImpresoraTermica && isBluetoothSupported()) {
      // Verificar HTTPS (excepto localhost)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Si no hay HTTPS, continuar con impresión estándar
      } else {
        // Usar impresión térmica Bluetooth
        await imprimirBluetooth();
        return;
      }
    }

    // Si no hay impresora térmica o no está disponible, usar impresión estándar
    // Crear una ventana nueva para imprimir solo el recibo
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

    // Obtener el HTML del recibo
    const reciboHTML = reciboRef.current.outerHTML;

    // Crear el documento HTML completo para impresión
    // Optimizado para impresoras térmicas (58mm y 80mm)
    const documentoImpresion = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Venta #${venta.id}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body { 
                margin: 0; 
                padding: 0;
                width: 80mm;
                font-size: 10pt;
              }
              .recibo-container { 
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 10mm !important;
                max-width: 80mm !important;
                width: 80mm !important;
                background: white !important;
              }
              .recibo-actions { display: none !important; }
              .recibo-controls { display: none !important; }
              * {
                color: black !important;
                background: white !important;
              }
            }
            body {
              font-family: 'Courier New', monospace, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              font-size: 10pt;
              line-height: 1.2;
            }
            .recibo-container {
              background: white;
              border: none;
              max-width: 80mm;
              margin: 0 auto;
              padding: 10mm;
              width: 80mm;
              box-sizing: border-box;
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
    if (onCerrar) {
      onCerrar();
    }
  };

  const cerrarRecibo = () => {
    if (onCerrar) {
      onCerrar();
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
        <div className="recibo-paper" ref={reciboRef}>
          {/* Logo y datos del establecimiento */}
          <div className="recibo-paper-header">
            {datosEmpresa.logo_url && (
              <img
                src={datosEmpresa.logo_url}
                alt="Logo establecimiento"
                className="recibo-paper-logo"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <h1 className="recibo-paper-empresa">{datosEmpresa.razon_social}</h1>
            <p className="recibo-paper-dato">{datosEmpresa.direccion}</p>
            {datosEmpresa.ciudad && (
              <p className="recibo-paper-dato">{datosEmpresa.ciudad}</p>
            )}
            <p className="recibo-paper-dato">Tel: {datosEmpresa.telefono}</p>
            {datosEmpresa.email && (
              <p className="recibo-paper-dato">Email: {datosEmpresa.email}</p>
            )}
            <p className="recibo-paper-nit-val">NIT: {datosEmpresa.nit}</p>
          </div>

          {/* Info del recibo */}
          <div className="recibo-paper-info">
            <CheckCircle className="recibo-paper-success-icon" />
            <h2 className="recibo-paper-title">Venta registrada</h2>
            <p className="recibo-paper-id-val">Recibo #{venta.id}</p>
            <p className="recibo-paper-date-val">
              {venta.date} — {venta.time}
            </p>
            <p className="recibo-paper-extra-info">{venta.register} · Cajero: {venta.cashier}</p>
            {venta.numero_venta && (
              <p className="recibo-paper-order">Orden: {venta.numero_venta}</p>
            )}
            {venta.cliente && (
              <div className="recibo-paper-cliente">
                <p className="cliente-label">Cliente:</p>
                <p className="cliente-nombre">{venta.cliente.nombre}</p>
                {venta.cliente.documento && (
                  <p className="cliente-dato">Documento: {venta.cliente.documento}</p>
                )}
                {venta.cliente.telefono && (
                  <p className="cliente-dato">Tel: {venta.cliente.telefono}</p>
                )}
                {venta.cliente.direccion && (
                  <p className="cliente-dato">{venta.cliente.direccion}</p>
                )}
              </div>
            )}
          </div>

          {/* Tabla de productos */}
          <div className="recibo-paper-products">
            <h3 className="recibo-paper-section-title">Detalle de la venta</h3>
            {venta.items.length === 0 ? (
              <p className="recibo-paper-no-products">No hay productos en esta venta.</p>
            ) : (
              <table className="recibo-paper-table">
                <thead>
                  <tr className="recibo-paper-table-header">
                    <th className="th-cant">Cant.</th>
                    <th className="th-producto">Producto</th>
                    <th className="th-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((item, idx) => {
                    const tieneToppings = item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0;
                    const tieneVariaciones = item.variaciones && Object.keys(item.variaciones).length > 0;
                    const tieneJewelryInfo = item.metadata && (item.metadata.peso || item.metadata.material || (item.metadata.jewelry_material_type && item.metadata.jewelry_material_type !== 'na'));
                    const precioItemBase = item.precio_venta || 0;
                    const precioToppings = tieneToppings
                      ? item.toppings.reduce((sum, t) => sum + (t.precio || 0) * (t.cantidad || 1), 0)
                      : 0;
                    const precioTotalItem = item.precio_total || (precioItemBase + precioToppings);
                    const totalItem = precioTotalItem * item.qty;
                    const tieneDetalles = tieneToppings || tieneVariaciones || tieneJewelryInfo;

                    return (
                      <React.Fragment key={idx}>
                        <tr className="recibo-table-row" style={{
                          borderBottom: tieneDetalles ? 'none' : '1px solid #f3f4f6'
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
                              {item.variant_nombre && (
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                  Variante: {item.variant_nombre}
                                </div>
                              )}
                              {/* Mostrar información de joyería */}
                              {tieneJewelryInfo && (
                                <div style={{
                                  marginTop: '0.25rem',
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem'
                                }}>
                                  {item.metadata.peso && (
                                    <span style={{
                                      backgroundColor: '#f3f4f6',
                                      padding: '0.1rem 0.3rem',
                                      borderRadius: '3px',
                                      fontWeight: '500'
                                    }}>
                                      Peso: {item.metadata.peso}g
                                    </span>
                                  )}
                                  {item.metadata.material && (
                                    <span style={{
                                      backgroundColor: '#f3f4f6',
                                      padding: '0.1rem 0.3rem',
                                      borderRadius: '3px',
                                      fontWeight: '500'
                                    }}>
                                      Material: {item.metadata.material}
                                    </span>
                                  )}
                                  {item.metadata.jewelry_material_type && item.metadata.jewelry_material_type !== 'na' && (
                                    <span style={{
                                      backgroundColor: item.metadata.jewelry_material_type === 'local' ? '#fef3c7' : '#dbeafe',
                                      color: item.metadata.jewelry_material_type === 'local' ? '#92400e' : '#1e40af',
                                      padding: '0.1rem 0.3rem',
                                      borderRadius: '3px',
                                      fontWeight: '500',
                                      fontSize: '0.7rem'
                                    }}>
                                      {item.metadata.jewelry_material_type === 'local' ? 'Nacional' : 'Internacional'}
                                    </span>
                                  )}
                                </div>
                              )}
                              {tieneVariaciones && (
                                <div className="recibo-paper-variaciones">
                                  <div className="variaciones-title">Variaciones:</div>
                                  {Object.entries(item.variaciones).map(([key, value], vIdx) => {
                                    const variacionNombre = key;
                                    const opcionLabel = typeof value === 'boolean'
                                      ? (value ? 'Sí' : 'No')
                                      : String(value);
                                    return (
                                      <div key={vIdx} className="variacion-item">
                                        <span>• {variacionNombre}: {opcionLabel}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {tieneToppings && (
                                <div className="recibo-paper-toppings">
                                  <div className="toppings-title">Toppings:</div>
                                  {item.toppings.map((topping, tIdx) => (
                                    <div key={tIdx} className="recibo-paper-topping-fila">
                                      <span>
                                        • {topping.nombre}
                                        {topping.cantidad > 1 && ` (x${topping.cantidad})`}
                                      </span>
                                      <span className="topping-precio">
                                        {formatCOP((topping.precio || 0) * (topping.cantidad || 1))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="recibo-td-total">{formatCOP(totalItem)}</td>
                        </tr>
                        {tieneDetalles && (
                          <tr className="recibo-paper-table-detail-row">
                            <td colSpan="3">
                              {/* Mostrar precio unitario y total solo cuando cantidad > 1 */}
                              {item.qty > 1 && (
                                <div className="unit-price-info">
                                  Precio unitario: {formatCOP(precioTotalItem)} | Total: {formatCOP(totalItem)}
                                </div>
                              )}
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
          <div className="recibo-paper-totals">
            <div className="recibo-paper-total-row">
              <span>Subtotal</span>
              <span className="val">{formatCOP(subtotal)}</span>
            </div>
            {montoDescuento > 0 && descuentoInfo && (
              <div className="recibo-paper-total-row discount">
                <span>
                  Descuento
                  {descuentoInfo.tipo === 'porcentaje' && ` (${descuentoInfo.valor}%)`}
                  {descuentoInfo.alcance === 'productos' && ' en productos'}
                </span>
                <span className="val">
                  -{formatCOP(montoDescuento)}
                </span>
              </div>
            )}
            <div className="recibo-paper-total-row final">
              <span>TOTAL</span>
              <span>{formatCOP(total)}</span>
            </div>
            <div className="recibo-paper-payment-info">
              <span>Método de pago</span>
              <span className="method">
                {esCotizacion ? 'COTIZACIÓN' : esPagoMixto ? 'Mixto' : venta.metodo_pago}
              </span>
            </div>

            {esCotizacion && (
              <div className="cotizacion-badge-container">
                <span className="cotizacion-label">📋 COTIZACIÓN</span>
                <div className="cotizacion-sublabel">
                  Pendiente de pago
                </div>
              </div>
            )}

            {/* Detalles de pago mixto */}
            {esPagoMixto && detallesPagoMixto && (
              <div className="pago-mixto-container">
                <div className="pago-mixto-title">Desglose de Pago Mixto</div>
                <div className="pago-mixto-fila">
                  <span className="metodo">
                    {getIconoMetodoPago(detallesPagoMixto.metodo1)}
                    {detallesPagoMixto.metodo1}
                  </span>
                  <span className="monto">
                    {formatCOP(detallesPagoMixto.monto1)}
                  </span>
                </div>
                <div className="pago-mixto-fila">
                  <span className="metodo">
                    {getIconoMetodoPago(detallesPagoMixto.metodo2)}
                    {detallesPagoMixto.metodo2}
                  </span>
                  <span className="monto">
                    {formatCOP(detallesPagoMixto.monto2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pago y cambio */}
          <div className="recibo-paper-payment">
            <div className="payment-row">
              <span>Pago del cliente</span>
              <span className="val">{formatCOP(venta.pagoCliente)}</span>
            </div>
            <div className="payment-row change">
              <span className="label">Cambio</span>
              <span className={`val ${cambio < 0 ? 'negativo' : 'positivo'}`}>
                {cambio < 0 ? `Faltan ${formatCOP(Math.abs(cambio))}` : formatCOP(cambio)}
              </span>
            </div>
          </div>

          {/* Pie del recibo */}
          <div className="recibo-paper-footer">
            <p className="thanks-msg">¡Gracias por su compra!</p>
            <p className="footer-note">Conserve este recibo como comprobante de pago</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="recibo-actions">
          <button
            className="recibo-btn recibo-btn-whatsapp"
            onClick={() => compartirWA(false)}
            disabled={compartiendoWA}
            title="Compartir por WhatsApp"
          >
            {compartiendoWA ? <Loader2 className="recibo-btn-icon rotating" /> : <Share2 className="recibo-btn-icon" />}
            <span className="recibo-btn-text">WhatsApp</span>
          </button>
          {venta.cliente?.telefono && (
            <button
              className="recibo-btn recibo-btn-whatsapp"
              onClick={() => compartirWA(true)}
              disabled={compartiendoWA}
              title="Enviar a WhatsApp del Cliente"
            >
              <MessageCircle className="recibo-btn-icon" />
              <span className="recibo-btn-text recibo-btn-text-mobile-hidden">Al cliente</span>
            </button>
          )}
          <button
            className="recibo-btn recibo-btn-secondary"
            onClick={imprimir}
            disabled={imprimiendoBluetooth}
            title="Imprimir recibo"
          >
            {imprimiendoBluetooth ? (
              <Loader2 className="recibo-btn-icon rotating" />
            ) : (
              <Printer className="recibo-btn-icon" />
            )}
            <span className="recibo-btn-text">{imprimiendoBluetooth ? 'Imprimiendo...' : 'Imprimir'}</span>
          </button>
          <button
            className="recibo-btn recibo-btn-secondary"
            onClick={descargarImagenRecibo}
            disabled={descargandoImagen}
            title="Descargar como imagen PNG"
          >
            {descargandoImagen ? <Loader2 className="recibo-btn-icon rotating" /> : <Image className="recibo-btn-icon" />}
            <span className="recibo-btn-text">{descargandoImagen ? 'Generando...' : 'Imagen'}</span>
          </button>
          <button
            className="recibo-btn recibo-btn-secondary"
            onClick={generarPDF}
            disabled={generandoPDF}
            title="Descargar como PDF"
          >
            <Download className="recibo-btn-icon" />
            <span className="recibo-btn-text">{generandoPDF ? 'Generando...' : 'PDF'}</span>
          </button>
          {mostrarCerrar ? (
            <button className="recibo-btn recibo-btn-primary" onClick={cerrarRecibo}>
              Cerrar
            </button>
          ) : (
            <button className="recibo-btn recibo-btn-primary" onClick={nuevaVenta}>
              Nueva venta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
