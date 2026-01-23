/**
 * Script para generar iconos PNG para PWA desde logo-crece.svg
 * 
 * Requiere: sharp (npm install --save-dev sharp)
 * Uso: node scripts/generar-iconos-pwa.js
 */

const fs = require('fs');
const path = require('path');

// Verificar si sharp está disponible
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp no está instalado.');
  console.log('📦 Instala sharp ejecutando: npm install --save-dev sharp');
  console.log('\n💡 Alternativa: Puedes convertir manualmente logo-crece.svg a PNG usando:');
  console.log('   - Herramientas online: https://cloudconvert.com/svg-to-png');
  console.log('   - Inkscape: inkscape logo-crece.svg --export-filename=logo192.png --export-width=192');
  console.log('   - ImageMagick: convert -background none -resize 192x192 logo-crece.svg logo192.png');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'logo-crece.svg');
const output192 = path.join(publicDir, 'logo192.png');
const output512 = path.join(publicDir, 'logo512.png');

// Verificar que el SVG existe
if (!fs.existsSync(svgPath)) {
  console.error(`❌ Error: No se encontró ${svgPath}`);
  process.exit(1);
}

console.log('🎨 Generando iconos PWA desde logo-crece.svg...\n');

async function generarIconos() {
  try {
    // Generar logo192.png (192x192)
    await sharp(svgPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente
      })
      .png()
      .toFile(output192);
    
    console.log('✅ Generado: logo192.png (192x192)');

    // Generar logo512.png (512x512)
    await sharp(svgPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente
      })
      .png()
      .toFile(output512);
    
    console.log('✅ Generado: logo512.png (512x512)');
    
    console.log('\n✨ ¡Iconos generados exitosamente!');
    console.log('📱 Ahora puedes:');
    console.log('   1. Limpiar la caché del navegador');
    console.log('   2. Desinstalar y reinstalar la PWA');
    console.log('   3. El icono del negocio debería aparecer correctamente');
    
  } catch (error) {
    console.error('❌ Error al generar iconos:', error.message);
    process.exit(1);
  }
}

generarIconos();
