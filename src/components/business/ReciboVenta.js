import React, { useState, useRef } from "react";
import { CheckCircle, Printer, Share2, Download, Banknote, CreditCard, Smartphone, MessageCircle, Loader2, Image, X, Plus } from "lucide-react";
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
  const [anchoPapel, setAnchoPapel] = useState(() => {
    return localStorage.getItem('crecemas_ancho_papel') || 
      user?.user_metadata?.impresora_configuracion?.ancho_papel || 
      '58mm';
  });
  const reciboRef = useRef(null);

  const cambiarAnchoPapel = (nuevoAncho) => {
    setAnchoPapel(nuevoAncho);
    localStorage.setItem('crecemas_ancho_papel', nuevoAncho);
  };

  const [mensajeFacturaCustom, setMensajeFacturaCustom] = useState(organization?.mensaje_factura || '');

  React.useEffect(() => {
    if (organization?.mensaje_factura) {
      setMensajeFacturaCustom(organization.mensaje_factura);
    }
    if (organization?.id) {
      supabase
        .from('organizations')
        .select('mensaje_factura')
        .eq('id', organization.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.mensaje_factura) {
            setMensajeFacturaCustom(data.mensaje_factura);
          }
        })
        .catch(err => console.warn('Error cargando mensaje_factura:', err));
    }
  }, [organization?.id, organization?.mensaje_factura]);

  const mensajeFinalFactura = mensajeFacturaCustom || organization?.mensaje_factura || '¡Gracias por su compra!';

  // Usar datos de la organización directamente desde AuthContext
  const datosEmpresa = organization ? {
    razon_social: organization.razon_social || organization.name || 'Mi Negocio',
    nit: organization.nit || '',
    direccion: organization.direccion || '',
    telefono: organization.telefono || '',
    email: organization.email || '',
    ciudad: organization.ciudad || '',
    mensaje_factura: mensajeFinalFactura,
    logo_url: organization.logo_url || ''
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

      await printReceipt(venta, datosEmpresa, user, { anchoPapel });
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
    const ventanaImpresion = window.open('', '_blank', 'width=450,height=650');
    if (!ventanaImpresion) {
      alert('⚠️ Las ventanas emergentes están bloqueadas en tu navegador. Habilítalas para poder imprimir.');
      return;
    }

    // Obtener el HTML del recibo
    const reciboHTML = reciboRef.current.outerHTML;

    const is58mm = anchoPapel === '58mm';
    const paperWidth = is58mm ? '58mm' : '80mm';
    const printableWidth = is58mm ? '47mm' : '72mm';
    const baseFontSize = is58mm ? '10.5px' : '12px';

    // Crear el documento HTML completo para impresión optimizado para impresoras térmicas
    const documentoImpresion = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Recibo de Venta #${venta.id}</title>
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              margin: 0;
              padding: 0;
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
              border-color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: ${paperWidth} !important;
              max-width: ${paperWidth} !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              font-size: ${baseFontSize} !important;
              font-weight: 700 !important;
              line-height: 1.25 !important;
              text-rendering: geometricPrecision !important;
              -webkit-font-smoothing: antialiased !important;
            }
            .recibo-paper {
              width: 100% !important;
              max-width: ${printableWidth} !important;
              margin: 0 auto !important;
              padding: ${is58mm ? '1.5mm 3.5mm 5mm 1.5mm' : '3mm 3mm 8mm 2mm'} !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            .recibo-actions, 
            .recibo-controls, 
            .recibo-formato-bar, 
            .recibo-quick-print-btn, 
            .recibo-paper-success-icon {
              display: none !important;
            }
            .recibo-paper-header {
              text-align: center !important;
              border-bottom: 1px dashed #000000 !important;
              padding-bottom: 5px !important;
              margin-bottom: 6px !important;
            }
            .recibo-paper-logo {
              max-width: ${is58mm ? '36mm' : '50mm'} !important;
              max-height: 24mm !important;
              margin: 0 auto 4px auto !important;
              display: block !important;
              filter: grayscale(100%) contrast(200%) !important;
            }
            .recibo-paper-empresa {
              font-size: ${is58mm ? '15px' : '17px'} !important;
              font-weight: 900 !important;
              margin: 0 0 2px 0 !important;
              text-align: center !important;
              line-height: 1.15 !important;
              text-transform: uppercase !important;
            }
            .recibo-paper-dato, .recibo-paper-nit-val {
              font-size: ${is58mm ? '10px' : '11px'} !important;
              font-weight: 700 !important;
              margin: 0 0 1px 0 !important;
              text-align: center !important;
              line-height: 1.2 !important;
            }
            .recibo-paper-info {
              text-align: center !important;
              border-bottom: 1px dashed #000000 !important;
              padding-bottom: 5px !important;
              margin-bottom: 6px !important;
            }
            .recibo-paper-title {
              font-size: ${is58mm ? '12px' : '13px'} !important;
              font-weight: 900 !important;
              margin: 0 0 2px 0 !important;
              text-align: center !important;
              text-transform: uppercase !important;
            }
            .recibo-paper-id-val {
              font-size: ${is58mm ? '11px' : '12px'} !important;
              font-weight: 900 !important;
              margin: 0 0 2px 0 !important;
              text-align: center !important;
            }
            .recibo-paper-date-val, .recibo-paper-extra-info {
              font-size: ${is58mm ? '9.5px' : '10.5px'} !important;
              font-weight: 700 !important;
              margin: 0 0 2px 0 !important;
              text-align: center !important;
            }
            .recibo-paper-order {
              font-size: ${is58mm ? '10.5px' : '11.5px'} !important;
              font-weight: 900 !important;
              text-align: center !important;
              padding: 1px 5px !important;
              border: 1px solid #000000 !important;
              display: inline-block !important;
              margin-top: 3px !important;
            }
            .recibo-paper-cliente {
              margin-top: 5px !important;
              padding: 4px 5px !important;
              border: 1px dashed #000000 !important;
              background: transparent !important;
              text-align: left !important;
            }
            .cliente-label {
              font-size: 8.5px !important;
              font-weight: 900 !important;
              text-transform: uppercase !important;
              margin: 0 0 1px 0 !important;
            }
            .cliente-nombre {
              font-size: ${is58mm ? '11px' : '12px'} !important;
              font-weight: 800 !important;
              margin: 0 0 1px 0 !important;
            }
            .cliente-dato {
              font-size: ${is58mm ? '9.5px' : '10.5px'} !important;
              font-weight: 700 !important;
              margin: 0 !important;
            }
            .recibo-paper-products {
              margin-bottom: 6px !important;
            }
            .recibo-paper-section-title {
              font-size: ${is58mm ? '10px' : '11px'} !important;
              font-weight: 900 !important;
              text-align: center !important;
              text-transform: uppercase !important;
              margin: 3px 0 !important;
              letter-spacing: 0.5px !important;
            }
            .recibo-paper-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              font-size: ${is58mm ? '10.5px' : '11.5px'} !important;
            }
            .recibo-paper-table-header {
              border-top: 1px solid #000000 !important;
              border-bottom: 1px solid #000000 !important;
            }
            .recibo-paper-table-header th {
              padding: 3px 1px !important;
              font-weight: 900 !important;
              font-size: ${is58mm ? '9.5px' : '10.5px'} !important;
              text-transform: uppercase !important;
            }
            .th-cant, .recibo-td-cant {
              width: 14% !important;
              text-align: left !important;
              font-weight: 800 !important;
              padding: 3px 1px !important;
              vertical-align: top !important;
            }
            .th-producto, .recibo-td-producto {
              width: 50% !important;
              text-align: left !important;
              font-weight: 700 !important;
              padding: 3px 1px !important;
              vertical-align: top !important;
              word-break: break-word !important;
            }
            .th-total, .recibo-td-total {
              width: 36% !important;
              text-align: right !important;
              font-weight: 800 !important;
              padding: 3px 2px 3px 1px !important;
              vertical-align: top !important;
              white-space: nowrap !important;
            }
            .recibo-table-row td {
              border-bottom: 1px dotted #000000 !important;
            }
            .recibo-paper-table-detail-row td {
              padding: 1px 1px 3px 1px !important;
              border-bottom: 1px dotted #000000 !important;
            }
            .unit-price-info {
              font-size: 9px !important;
              font-style: italic !important;
              font-weight: 700 !important;
            }
            .recibo-paper-variaciones, .recibo-paper-toppings {
              margin-top: 2px !important;
              padding-left: 4px !important;
              border-left: 1px solid #000000 !important;
            }
            .variaciones-title, .toppings-title {
              font-size: 8.5px !important;
              font-weight: 900 !important;
            }
            .variacion-item, .recibo-paper-topping-fila {
              font-size: 9.5px !important;
              font-weight: 700 !important;
            }
            .recibo-paper-topping-fila {
              display: flex !important;
              justify-content: space-between !important;
            }
            .topping-precio {
              font-weight: 800 !important;
            }
            .recibo-paper-totals {
              border-top: 1px solid #000000 !important;
              border-bottom: 1px dashed #000000 !important;
              padding: 4px 1px 5px 0 !important;
              margin-bottom: 6px !important;
            }
            .recibo-paper-total-row {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              font-size: ${is58mm ? '10.5px' : '12px'} !important;
              font-weight: 700 !important;
              margin-bottom: 2px !important;
              padding-right: 2px !important;
            }
            .recibo-paper-total-row .val {
              font-weight: 800 !important;
              padding-right: 1px !important;
            }
            .recibo-paper-total-row.discount {
              font-weight: 800 !important;
            }
            .recibo-paper-total-row.final {
              font-size: ${is58mm ? '13px' : '15px'} !important;
              font-weight: 900 !important;
              border-top: 1px solid #000000 !important;
              padding-top: 4px !important;
              margin-top: 4px !important;
              padding-right: 2px !important;
            }
            .recibo-paper-payment-info {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              font-size: ${is58mm ? '9.5px' : '11px'} !important;
              font-weight: 700 !important;
              margin-top: 3px !important;
              padding-right: 2px !important;
            }
            .recibo-paper-payment-info .method {
              font-weight: 900 !important;
              text-transform: uppercase !important;
            }
            .cotizacion-badge-container {
              border: 2px dashed #000000 !important;
              padding: 4px !important;
              margin-top: 4px !important;
              text-align: center !important;
            }
            .cotizacion-label {
              font-weight: 900 !important;
              font-size: 11px !important;
            }
            .cotizacion-sublabel {
              font-size: 9px !important;
              font-weight: 700 !important;
            }
            .pago-mixto-container {
              border: 1px dashed #000000 !important;
              padding: 4px 5px !important;
              margin-top: 4px !important;
            }
            .pago-mixto-title {
              font-size: 9.5px !important;
              font-weight: 900 !important;
              text-align: center !important;
              text-transform: uppercase !important;
              margin-bottom: 3px !important;
            }
            .pago-mixto-fila {
              display: flex !important;
              justify-content: space-between !important;
              font-size: 10px !important;
              font-weight: 700 !important;
              padding-right: 2px !important;
            }
            .pago-mixto-fila .monto {
              font-weight: 800 !important;
            }
            .recibo-paper-payment {
              border-bottom: 1px dashed #000000 !important;
              padding-bottom: 5px !important;
              margin-bottom: 6px !important;
            }
            .payment-row {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              font-size: ${is58mm ? '11px' : '12px'} !important;
              font-weight: 700 !important;
              margin-bottom: 2px !important;
            }
            .payment-row .val {
              font-weight: 800 !important;
            }
            .payment-row.change {
              margin-top: 3px !important;
              padding-top: 3px !important;
              border-top: 1px dotted #000000 !important;
              font-size: ${is58mm ? '11px' : '12px'} !important;
              font-weight: 800 !important;
            }
            .payment-row.change .val {
              font-weight: 900 !important;
            }
            .recibo-paper-footer {
              text-align: center !important;
              padding-top: 4px !important;
              margin-top: 4px !important;
            }
            .thanks-msg {
              font-size: ${is58mm ? '10px' : '11.5px'} !important;
              font-weight: 800 !important;
              text-align: center !important;
              margin: 0 0 3px 0 !important;
              white-space: pre-wrap !important;
              line-height: 1.35 !important;
            }
            .footer-note {
              font-size: ${is58mm ? '8.5px' : '9.5px'} !important;
              font-weight: 700 !important;
              text-align: center !important;
              font-style: italic !important;
              margin: 0 !important;
            }
          </style>
        </head>
        <body>
          ${reciboHTML}
        </body>
      </html>
    `;

    // Escribir el documento en la ventana
    ventanaImpresion.document.open();
    ventanaImpresion.document.write(documentoImpresion);
    ventanaImpresion.document.close();

    let printDisparado = false;
    const ejecutarImpresion = () => {
      if (printDisparado) return;
      printDisparado = true;
      try {
        ventanaImpresion.focus();
        ventanaImpresion.print();
      } catch (e) {
        console.error('Error al invocar impresión:', e);
      }
    };

    // Esperar a que el DOM y los estilos estén completamente listos
    if (ventanaImpresion.document.readyState === 'complete') {
      setTimeout(ejecutarImpresion, 250);
    } else {
      ventanaImpresion.onload = () => {
        setTimeout(ejecutarImpresion, 250);
      };
      // Fallback en caso de que onload no dispare
      setTimeout(ejecutarImpresion, 800);
    }

    ventanaImpresion.onafterprint = () => {
      try {
        ventanaImpresion.close();
      } catch (e) {}
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
      <div className={`recibo-container ${anchoPapel === '58mm' ? 'formato-58mm' : 'formato-80mm'}`}>

        {/* Barra superior con selección de papel y botón rápido de imprimir */}
        <div className="recibo-formato-bar">
          <div className="recibo-formato-left">
            <span className="recibo-formato-label">Papel:</span>
            <div className="recibo-formato-pills">
              <button
                type="button"
                className={`recibo-formato-pill ${anchoPapel === '58mm' ? 'active' : ''}`}
                onClick={() => cambiarAnchoPapel('58mm')}
                title="Formato de 58 mm"
              >
                58 mm
              </button>
              <button
                type="button"
                className={`recibo-formato-pill ${anchoPapel === '80mm' ? 'active' : ''}`}
                onClick={() => cambiarAnchoPapel('80mm')}
                title="Formato de 80 mm"
              >
                80 mm
              </button>
            </div>
          </div>
          <button
            type="button"
            className="recibo-quick-print-btn"
            onClick={imprimir}
            disabled={imprimiendoBluetooth}
            title="Imprimir recibo"
            aria-label="Imprimir recibo"
            data-tooltip={imprimiendoBluetooth ? "Imprimiendo..." : "Imprimir"}
          >
            {imprimiendoBluetooth ? (
              <Loader2 className="recibo-quick-icon rotating" size={15} />
            ) : (
              <Printer className="recibo-quick-icon" size={15} />
            )}
          </button>
        </div>

        {/* Contenedor con scroll para el ticket del recibo */}
        <div className="recibo-scroll-area">
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
                              <span className="producto-nombre-val" style={{ fontWeight: '600' }}>{item.nombre}</span>
                              {item.variant_nombre && (
                                <div className="producto-variante-val" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
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
                                      backgroundColor: item.metadata.jewelry_material_type === 'local' ? '#fef3c7' : '#E6F0FF',
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
            <p className="thanks-msg">{mensajeFinalFactura}</p>
            <p className="footer-note">Conserve este recibo como comprobante de pago</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="recibo-actions">
        <button
          className="recibo-btn recibo-btn-whatsapp"
          onClick={() => compartirWA(false)}
          disabled={compartiendoWA}
          title="Compartir por WhatsApp"
          aria-label="Compartir por WhatsApp"
          data-tooltip={compartiendoWA ? "Enviando..." : "WhatsApp"}
        >
          {compartiendoWA ? <Loader2 className="recibo-btn-icon rotating" /> : <Share2 className="recibo-btn-icon" />}
        </button>

        {venta.cliente?.telefono && (
          <button
            className="recibo-btn recibo-btn-whatsapp-cliente"
            onClick={() => compartirWA(true)}
            disabled={compartiendoWA}
            title="Enviar a WhatsApp del Cliente"
            aria-label="Enviar a WhatsApp del Cliente"
            data-tooltip={compartiendoWA ? "Enviando..." : "Al cliente"}
          >
            {compartiendoWA ? <Loader2 className="recibo-btn-icon rotating" /> : <MessageCircle className="recibo-btn-icon" />}
          </button>
        )}

        <button
          className="recibo-btn recibo-btn-secondary"
          onClick={imprimir}
          disabled={imprimiendoBluetooth}
          title="Imprimir recibo"
          aria-label="Imprimir recibo"
          data-tooltip={imprimiendoBluetooth ? "Imprimiendo..." : "Imprimir"}
        >
          {imprimiendoBluetooth ? (
            <Loader2 className="recibo-btn-icon rotating" />
          ) : (
            <Printer className="recibo-btn-icon" />
          )}
        </button>

        <button
          className="recibo-btn recibo-btn-secondary"
          onClick={descargarImagenRecibo}
          disabled={descargandoImagen}
          title="Descargar como imagen PNG"
          aria-label="Descargar como imagen PNG"
          data-tooltip={descargandoImagen ? "Generando..." : "Imagen"}
        >
          {descargandoImagen ? <Loader2 className="recibo-btn-icon rotating" /> : <Image className="recibo-btn-icon" />}
        </button>

        <button
          className="recibo-btn recibo-btn-secondary"
          onClick={generarPDF}
          disabled={generandoPDF}
          title="Descargar como PDF"
          aria-label="Descargar como PDF"
          data-tooltip={generandoPDF ? "Generando..." : "PDF"}
        >
          {generandoPDF ? <Loader2 className="recibo-btn-icon rotating" /> : <Download className="recibo-btn-icon" />}
        </button>

        {mostrarCerrar ? (
          <button
            className="recibo-btn recibo-btn-close"
            onClick={cerrarRecibo}
            title="Cerrar recibo"
            aria-label="Cerrar recibo"
            data-tooltip="Cerrar"
          >
            <X className="recibo-btn-icon" />
          </button>
        ) : (
          <button
            className="recibo-btn recibo-btn-primary"
            onClick={nuevaVenta}
            title="Nueva venta"
            aria-label="Nueva venta"
            data-tooltip="Nueva venta"
          >
            <Plus className="recibo-btn-icon" />
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
