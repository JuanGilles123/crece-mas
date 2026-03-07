import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captura un elemento HTML y lo retorna como canvas
 */
async function capturarElemento(element) {
    return html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
    });
}

/**
 * Descarga el contenido de un elemento como imagen PNG
 */
export async function descargarImagen(element, nombreArchivo = 'documento') {
    const canvas = await capturarElemento(element);
    const link = document.createElement('a');
    link.download = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

/**
 * Descarga el contenido de un elemento como PDF
 */
export async function descargarPDF(element, nombreArchivo = 'documento') {
    const canvas = await capturarElemento(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.90);
    const imgWidth = 210; // A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, Math.max(297, imgHeight + 20)],
    });
    pdf.addImage(imgData, 'JPEG', 0, 10, imgWidth, imgHeight);

    const fileName = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    return { pdf, fileName };
}

/**
 * Comparte un elemento por WhatsApp como archivo adjunto (PDF en móvil) o
 * como texto plano (fallback para escritorio o navegadores sin Web Share API).
 *
 * @param {HTMLElement} element - El elemento a capturar
 * @param {string} textoFallback - Texto a enviar si no se puede adjuntar archivo
 * @param {string} nombreArchivo - Nombre base del archivo
 * @param {string|null} telefonoCliente - Si se pasa, abre WhatsApp directo al cliente
 */
export async function compartirWhatsApp(element, textoFallback, nombreArchivo = 'documento', telefonoCliente = null) {
    // Intentar compartir con archivo adjunto (solo funciona en móviles con Chrome/Safari)
    if (navigator.share && navigator.canShare) {
        try {
            const canvas = await capturarElemento(element);

            // Intenta primero compartir como PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [210, Math.max(297, (canvas.height * 210) / canvas.width + 20)],
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.90);
            const imgHeight = (canvas.height * 210) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 10, 210, imgHeight);

            const pdfBlob = pdf.output('blob');
            const fileName = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

            if (navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: nombreArchivo,
                });
                return;
            }

            // Si PDF no funciona, intentar como imagen PNG
            const imgBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            const imgFileName = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.png`;
            const imgFile = new File([imgBlob], imgFileName, { type: 'image/png' });

            if (navigator.canShare({ files: [imgFile] })) {
                await navigator.share({
                    files: [imgFile],
                    title: nombreArchivo,
                });
                return;
            }
        } catch (err) {
            // Si el usuario canceló el share dialog, no hacer nada
            if (err.name === 'AbortError') return;
            // Para cualquier otro error, continuar con fallback de WhatsApp texto
        }
    }

    // Fallback: abrir WhatsApp Web con texto plano
    const telefono = telefonoCliente ? telefonoCliente.replace(/\D/g, '') : '';
    const url = telefono
        ? `https://wa.me/${telefono}?text=${encodeURIComponent(textoFallback)}`
        : `https://wa.me/?text=${encodeURIComponent(textoFallback)}`;
    window.open(url, '_blank');
}
