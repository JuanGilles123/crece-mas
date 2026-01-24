const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generarImagenPlanes(tipo = 'ambas') {
  console.log('🚀 Iniciando generación de imágenes de planes...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar viewport para una imagen de alta calidad
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2 // Para mejor calidad
    });
    
    // Crear directorio de salida si no existe
    const outputDir = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const archivos = [];
    
    if (tipo === 'ambas' || tipo === 'general') {
      // Generar imagen general
      const htmlPathGeneral = path.join(__dirname, '..', 'public', 'comparativa-planes-general.html');
      const fileUrlGeneral = `file://${htmlPathGeneral.replace(/\\/g, '/')}`;
      
      console.log(`📄 Cargando versión general: ${fileUrlGeneral}`);
      
      await page.goto(fileUrlGeneral, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const outputPathGeneral = path.join(outputDir, 'comparativa-planes-general.png');
      
      console.log('📸 Generando imagen general...');
      
      await page.screenshot({
        path: outputPathGeneral,
        fullPage: true,
        type: 'png'
      });
      
      console.log(`✅ Imagen general generada: ${outputPathGeneral}`);
      archivos.push(outputPathGeneral);
    }
    
    if (tipo === 'ambas' || tipo === 'detallada') {
      // Generar imagen detallada
      const htmlPathDetallada = path.join(__dirname, '..', 'public', 'comparativa-planes-detallada.html');
      const fileUrlDetallada = `file://${htmlPathDetallada.replace(/\\/g, '/')}`;
      
      console.log(`📄 Cargando versión detallada: ${fileUrlDetallada}`);
      
      await page.goto(fileUrlDetallada, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const outputPathDetallada = path.join(outputDir, 'comparativa-planes-detallada.png');
      
      console.log('📸 Generando imagen detallada...');
      
      await page.screenshot({
        path: outputPathDetallada,
        fullPage: true,
        type: 'png'
      });
      
      console.log(`✅ Imagen detallada generada: ${outputPathDetallada}`);
      archivos.push(outputPathDetallada);
    }
    
    console.log(`\n✨ Proceso completado. ${archivos.length} imagen(es) generada(s)`);
    archivos.forEach(archivo => {
      console.log(`📁 ${path.resolve(archivo)}`);
    });
    
    return archivos;
    
  } catch (error) {
    console.error('❌ Error al generar las imágenes:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const tipo = process.argv[2] || 'ambas'; // 'general', 'detallada', o 'ambas'
  
  generarImagenPlanes(tipo)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = generarImagenPlanes;
