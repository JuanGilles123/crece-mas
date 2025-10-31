const fs = require('fs');
const path = require('path');

function removeConsoleLogs(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      removeConsoleLogs(fullPath);
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // Eliminar console.log de una línea
      content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
      
      // Eliminar console.log multi-línea
      content = content.replace(/^\s*console\.log\(\s*$/gm, '');
      content = content.replace(/console\.log\([^)]*\);?/g, '');
      
      // Eliminar líneas vacías consecutivas (máximo 2)
      content = content.replace(/\n\n\n+/g, '\n\n');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Limpiado: ${fullPath}`);
      }
    }
  }
}

removeConsoleLogs(path.join(__dirname, 'src'));
console.log('\n🎉 Todos los console.log han sido eliminados!');
