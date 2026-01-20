const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Definir campos según tipo de producto
// NOTA: Los campos obligatorios varían según el tipo de producto
// Para la plantilla, incluimos todos los campos comunes y marcamos cuáles son obligatorios por tipo

const camposObligatorios = [
  'codigo',        // Obligatorio para todos
  'nombre',        // Obligatorio para todos
  'tipo',          // Obligatorio para todos (fisico, servicio, comida, accesorio)
  'precio_venta'   // Obligatorio para todos
];

const camposCondicionales = [
  'precio_compra', // Obligatorio para: fisico, comida, accesorio | Opcional para: servicio
  'stock'          // Obligatorio para: fisico, comida | Opcional para: accesorio | No aplica para: servicio
];

const camposOpcionales = [
  'imagen',
  'fecha_vencimiento',
  'peso',
  'unidad_peso',
  'dimensiones',
  'marca',
  'modelo',
  'color',
  'talla',
  'material',
  'categoria',
  'duracion',
  'descripcion',
  'ingredientes',
  'alergenos',
  'calorias',
  'porcion',
  'variaciones'
];

// Crear workbook
const workbook = XLSX.utils.book_new();

// Hoja 1: Plantilla con ejemplos
const headers = [
  ...camposObligatorios.map(c => ({ v: c.toUpperCase().replace('_', ' ') + ' *', t: 's' })),
  ...camposCondicionales.map(c => ({ v: c.toUpperCase().replace('_', ' ') + ' **', t: 's' })),
  ...camposOpcionales.map(c => ({ v: c.toUpperCase().replace('_', ' ') + ' (OPCIONAL)', t: 's' }))
];

// Ejemplos de datos para cada tipo de producto
const ejemplos = [
  // Producto Físico
  {
    codigo: 'PROD-001',
    nombre: 'Camiseta Básica',
    tipo: 'fisico',
    precio_venta: 25000,
    precio_compra: 15000,
    stock: 50,
    imagen: '',
    fecha_vencimiento: '',
    peso: '0.2',
    unidad_peso: 'kg',
    dimensiones: '30x40x5 cm',
    marca: 'Marca Ejemplo',
    modelo: 'Modelo 2024',
    color: 'Azul',
    talla: 'M',
    material: '',
    categoria: 'Ropa',
    duracion: '',
    descripcion: '',
    ingredientes: '',
    alergenos: '',
    calorias: '',
    porcion: '',
    variaciones: ''
  },
  // Servicio
  {
    codigo: 'SERV-001',
    nombre: 'Consulta Médica',
    tipo: 'servicio',
    precio_venta: 50000,
    precio_compra: '',
    stock: '',
    imagen: '',
    fecha_vencimiento: '',
    peso: '',
    unidad_peso: '',
    dimensiones: '',
    marca: '',
    modelo: '',
    color: '',
    talla: '',
    material: '',
    categoria: 'Servicios de Salud',
    duracion: '30 minutos',
    descripcion: 'Consulta médica general',
    ingredientes: '',
    alergenos: '',
    calorias: '',
    porcion: '',
    variaciones: ''
  },
  // Comida
  {
    codigo: 'FOOD-001',
    nombre: 'Hamburguesa Clásica',
    tipo: 'comida',
    precio_venta: 15000,
    precio_compra: 8000,
    stock: 20,
    imagen: '',
    fecha_vencimiento: '2024-12-31',
    peso: '',
    unidad_peso: '',
    dimensiones: '',
    marca: '',
    modelo: '',
    color: '',
    talla: '',
    material: '',
    categoria: 'Comida Rápida',
    duracion: '',
    descripcion: '',
    ingredientes: 'Pan, Carne, Lechuga, Tomate, Queso',
    alergenos: 'Gluten, Lactosa',
    calorias: '450',
    porcion: '1 unidad',
    variaciones: ''
  },
  // Accesorio con peso
  {
    codigo: 'ACC-001',
    nombre: 'Collar de Oro',
    tipo: 'accesorio',
    precio_venta: 500000,
    precio_compra: 400000,
    stock: 5,
    imagen: '',
    fecha_vencimiento: '',
    peso: '10',
    unidad_peso: 'g',
    dimensiones: '',
    marca: '',
    modelo: '',
    color: 'Dorado',
    talla: '',
    material: 'Oro 18k',
    categoria: 'Joyería',
    duracion: '',
    descripcion: '',
    ingredientes: '',
    alergenos: '',
    calorias: '',
    porcion: '',
    variaciones: 'Tamaño: Pequeño, Mediano, Grande'
  }
];

// Convertir ejemplos a formato de fila
const rows = [
  headers.map(h => h.v), // Fila de headers
  ...ejemplos.map(ejemplo => {
    const row = [];
    // Campos obligatorios
    camposObligatorios.forEach(campo => {
      row.push(ejemplo[campo] !== undefined ? ejemplo[campo] : '');
    });
    // Campos condicionales
    camposCondicionales.forEach(campo => {
      row.push(ejemplo[campo] !== undefined ? ejemplo[campo] : '');
    });
    // Campos opcionales
    camposOpcionales.forEach(campo => {
      row.push(ejemplo[campo] !== undefined ? ejemplo[campo] : '');
    });
    return row;
  })
];

// Crear worksheet
const worksheet = XLSX.utils.aoa_to_sheet(rows);

// Estilizar headers (fila 1)
const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
};

// Aplicar estilos a headers
const range = XLSX.utils.decode_range(worksheet['!ref']);
for (let C = range.s.c; C <= range.e.c; ++C) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
  if (!worksheet[cellAddress]) continue;
  worksheet[cellAddress].s = headerStyle;
}

// Ajustar ancho de columnas
worksheet['!cols'] = headers.map((h, i) => {
  // Anchos específicos para las primeras columnas
  const widths = [
    15,  // codigo
    30,  // nombre
    12,  // tipo
    15,  // precio_venta
    15,  // precio_compra
    10,  // stock
    30,  // imagen
    15,  // fecha_vencimiento
    10,  // peso
    12,  // unidad_peso
    20,  // dimensiones
    15,  // marca
    15,  // modelo
    12,  // color
    10,  // talla
    15,  // material
    15,  // categoria
    15,  // duracion
    30,  // descripcion
    30,  // ingredientes
    20,  // alergenos
    10,  // calorias
    15,  // porcion
    30   // variaciones
  ];
  return { wch: widths[i] || 20 };
});

// Agregar hoja de instrucciones
const instrucciones = [
  ['INSTRUCCIONES PARA IMPORTAR PRODUCTOS'],
  [''],
  ['CAMPOS OBLIGATORIOS (*):'],
  ['  Estos campos son obligatorios para TODOS los tipos de productos:'],
  ...camposObligatorios.map(c => [`    - ${c.toUpperCase().replace('_', ' ')}: ${getDescripcionCampo(c)}`]),
  [''],
  ['CAMPOS CONDICIONALES (**):'],
  ['  Estos campos son obligatorios según el tipo de producto:'],
  ['    - PRECIO COMPRA:'],
  ['      * Obligatorio para: fisico, comida, accesorio'],
  ['      * Opcional para: servicio'],
  ['    - STOCK:'],
  ['      * Obligatorio para: fisico, comida'],
  ['      * Opcional para: accesorio'],
  ['      * No aplica para: servicio'],
  [''],
  ['CAMPOS OPCIONALES:'],
  ['  Estos campos pueden dejarse vacíos:'],
  ...camposOpcionales.map(c => [`    - ${c.toUpperCase().replace('_', ' ')}: ${getDescripcionCampo(c)}`]),
  [''],
  ['TIPOS DE PRODUCTO:'],
  ['  - fisico: Producto físico con inventario'],
  ['    Requiere: codigo, nombre, tipo, precio_venta, precio_compra, stock'],
  ['    Ejemplo: Ropa, Electrónica, Herramientas'],
  [''],
  ['  - servicio: Servicio intangible'],
  ['    Requiere: codigo, nombre, tipo, precio_venta'],
  ['    NO requiere: precio_compra, stock'],
  ['    Ejemplo: Consultas, Reparaciones, Asesorías'],
  [''],
  ['  - comida: Producto alimenticio'],
  ['    Requiere: codigo, nombre, tipo, precio_venta, precio_compra, stock'],
  ['    Ejemplo: Comidas, Bebidas, Snacks'],
  [''],
  ['  - accesorio: Accesorio con peso/variables'],
  ['    Requiere: codigo, nombre, tipo, precio_venta, precio_compra'],
  ['    Stock es opcional'],
  ['    Ejemplo: Joyería, Productos por peso'],
  [''],
  ['FORMATO DE DATOS:'],
  ['  - Código: Texto único (máx 50 caracteres). Si está vacío, se genera automáticamente'],
  ['  - Nombre: Texto (máx 100 caracteres)'],
  ['  - Tipo: Debe ser exactamente: fisico, servicio, comida o accesorio'],
  ['  - Precios: Números sin puntos ni comas (ej: 25000 para $25.000)'],
  ['  - Stock: Número entero positivo o 0 (ej: 50)'],
  ['  - Fecha vencimiento: Formato YYYY-MM-DD (ej: 2024-12-31)'],
  ['  - Imagen: URL de imagen (http://...) o dejar vacío'],
  ['  - Peso: Número (ej: 0.5, 10, 250)'],
  ['  - Unidad peso: kg, g, lb, oz'],
  [''],
  ['VALIDACIONES:'],
  ['  - El precio de venta debe ser mayor o igual al precio de compra'],
  ['  - El stock debe ser un número positivo o 0'],
  ['  - Los campos obligatorios NO pueden estar vacíos'],
  ['  - Los campos opcionales pueden dejarse vacíos'],
  ['  - Si no proporcionas un código, se generará automáticamente'],
  [''],
  ['EJEMPLOS EN LA PLANTILLA:'],
  ['  La hoja "Plantilla" incluye 4 ejemplos:'],
  ['    1. Producto Físico (Camiseta)'],
  ['    2. Servicio (Consulta Médica)'],
  ['    3. Comida (Hamburguesa)'],
  ['    4. Accesorio (Collar de Oro)'],
  [''],
  ['  Puedes eliminar estos ejemplos y agregar tus propios productos.']
];

const instruccionesSheet = XLSX.utils.aoa_to_sheet(instrucciones);
instruccionesSheet['!cols'] = [{ wch: 80 }];

// Agregar hojas al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
XLSX.utils.book_append_sheet(workbook, instruccionesSheet, 'Instrucciones');

// Función para obtener descripción de campos
function getDescripcionCampo(campo) {
  const descripciones = {
    codigo: 'Código único del producto (máx 50 caracteres)',
    nombre: 'Nombre del producto (máx 100 caracteres)',
    tipo: 'Tipo: fisico, servicio, comida o accesorio',
    precio_venta: 'Precio de venta (número sin puntos)',
    precio_compra: 'Precio de compra (número sin puntos)',
    stock: 'Cantidad en inventario (número entero)',
    imagen: 'URL de la imagen del producto',
    fecha_vencimiento: 'Fecha de vencimiento (YYYY-MM-DD)',
    peso: 'Peso del producto (número)',
    unidad_peso: 'Unidad de peso: kg, g, lb, oz',
    dimensiones: 'Dimensiones (ej: 10x5x3 cm)',
    marca: 'Marca del producto',
    modelo: 'Modelo del producto',
    color: 'Color del producto',
    talla: 'Talla (ej: S, M, L, XL)',
    material: 'Material del producto',
    categoria: 'Categoría del producto',
    duracion: 'Duración del servicio (ej: 1 hora)',
    descripcion: 'Descripción detallada',
    ingredientes: 'Lista de ingredientes (separados por comas)',
    alergenos: 'Alérgenos presentes',
    calorias: 'Cantidad de calorías',
    porcion: 'Tamaño de porción',
    variaciones: 'Variaciones disponibles'
  };
  return descripciones[campo] || 'Campo adicional';
}

// Guardar archivo
const outputPath = path.join(__dirname, '../public/templates/plantilla-importacion-productos.xlsx');
const outputDir = path.dirname(outputPath);

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

XLSX.writeFile(workbook, outputPath);

console.log('✅ Plantilla de Excel generada exitosamente!');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('');
console.log('La plantilla incluye:');
console.log('  - Campos obligatorios con ejemplos');
console.log('  - Campos opcionales');
console.log('  - Ejemplos para cada tipo de producto');
console.log('  - Hoja de instrucciones detalladas');
