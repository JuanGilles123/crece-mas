# 🚀 Crece Más - Sistema de Gestión de Ventas

Un sistema completo de gestión de ventas, inventario y facturación desarrollado con React y Supabase.

## 📋 Características Principales

### 🛒 **Gestión de Ventas**
- Sistema de caja completo
- Cálculo automático de cambio
- Generación de recibos en PDF
- Historial de ventas con filtros
- Resumen de ventas por período

### 📦 **Gestión de Inventario**
- CRUD completo de productos
- Importación masiva desde CSV/Excel
- Gestión de imágenes de productos
- Control de stock
- Categorización de productos

### 🏢 **Gestión de Empresa**
- Configuración de datos de empresa
- Subida y gestión de logos
- Personalización de recibos
- Datos de facturación completos

### 👤 **Sistema de Usuarios**
- Autenticación segura con Supabase
- Perfiles de usuario personalizables
- Recuperación de contraseña
- Confirmación por email

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 19.1.1** - Framework principal
- **React Router DOM** - Navegación
- **React Query (TanStack)** - Gestión de estado del servidor
- **React Hook Form + Zod** - Formularios y validación
- **Framer Motion** - Animaciones
- **Chart.js** - Gráficos y reportes
- **jsPDF + html2canvas** - Generación de PDFs

### **Backend**
- **Supabase** - Base de datos PostgreSQL
- **Supabase Auth** - Autenticación
- **Supabase Storage** - Almacenamiento de archivos
- **Row Level Security (RLS)** - Seguridad de datos

### **UI/UX**
- **CSS Modules** - Estilos modulares
- **Lucide React** - Iconografía
- **React Hot Toast** - Notificaciones
- **Lottie React** - Animaciones de carga

## 📁 Estructura del Proyecto

```
crece-mas/
├── 📁 src/                          # Código fuente principal
│   ├── 📁 components/               # Componentes reutilizables
│   │   ├── 📁 ui/                   # Componentes base (botones, inputs, etc.)
│   │   ├── 📁 forms/                # Componentes de formularios
│   │   ├── 📁 modals/               # Modales específicos
│   │   ├── 📁 layout/               # Componentes de layout
│   │   └── 📁 business/             # Componentes de negocio
│   ├── 📁 pages/                    # Páginas principales
│   │   ├── 📁 auth/                 # Páginas de autenticación
│   │   ├── 📁 dashboard/            # Páginas del dashboard
│   │   └── 📁 public/               # Páginas públicas
│   ├── 📁 hooks/                    # Custom hooks
│   ├── 📁 context/                  # Context providers
│   ├── 📁 services/                 # Servicios y API calls
│   │   ├── 📁 api/                  # Cliente de Supabase
│   │   └── 📁 storage/              # Gestión de archivos
│   ├── 📁 utils/                    # Utilidades
│   ├── 📁 constants/                # Constantes
│   └── 📁 styles/                   # Estilos globales
├── 📁 database/                     # Scripts de base de datos
│   ├── 📁 setup/                    # Scripts de configuración inicial
│   ├── 📁 migrations/               # Migraciones
│   ├── 📁 seeds/                    # Datos de prueba
│   ├── 📁 fixes/                    # Scripts de corrección
│   └── 📁 diagnostics/              # Scripts de diagnóstico
├── 📁 docs/                         # Documentación
│   ├── 📁 setup/                    # Guías de configuración
│   ├── 📁 api/                      # Documentación de API
│   └── 📁 deployment/               # Guías de despliegue
├── 📁 public/                       # Archivos públicos
│   ├── 📁 templates/                # Plantillas
│   └── 📁 assets/                   # Assets estáticos
├── 📁 scripts/                      # Scripts de automatización
└── 📁 config/                       # Archivos de configuración
```

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### **1. Clonar el Repositorio**
```bash
git clone <repository-url>
cd crece-mas
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Supabase**
1. Crear un proyecto en [Supabase](https://supabase.com)
2. Copiar las variables de entorno:
```bash
cp .env.example .env.local
```

3. Configurar las variables en `.env.local`:
```env
REACT_APP_SUPABASE_URL=tu_supabase_url
REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### **4. Configurar Base de Datos**
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Ejecutar el script: `database/setup/setup_completo.sql`

### **5. Ejecutar el Proyecto**
```bash
npm start
```

El proyecto estará disponible en `http://localhost:3000`

## 📚 Documentación Adicional

### **Configuración de Base de Datos**
- [Setup de Base de Datos](docs/setup/SETUP_BASE_DATOS.md)
- [Configuración de Recibos](docs/setup/CONFIGURACION_RECIBOS.md)

### **Importación de Datos**
- [Importación CSV](docs/setup/IMPORTACION_CSV.md)
- [Importación de Imágenes](docs/setup/IMPORTACION_IMAGENES.md)

### **Gestión de Usuarios**
- [Perfil de Usuario](docs/setup/PERFIL_USUARIO.md)
- [Recibos Mejorados](docs/setup/RECIBOS_MEJORADOS.md)

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start                 # Iniciar servidor de desarrollo
npm test                  # Ejecutar tests
npm run build             # Construir para producción

# Base de datos
npm run db:setup          # Configurar base de datos
npm run db:migrate        # Ejecutar migraciones
npm run db:seed           # Poblar con datos de prueba
```

## 🏗️ Arquitectura del Sistema

### **Frontend Architecture**
- **Componentes**: Organizados por funcionalidad (UI, Forms, Business, Layout)
- **Páginas**: Separadas por contexto (Auth, Dashboard, Public)
- **Hooks**: Lógica reutilizable para estado y efectos
- **Context**: Gestión global de autenticación y temas
- **Services**: Comunicación con APIs y servicios externos

### **Backend Architecture**
- **Supabase**: Base de datos PostgreSQL con RLS
- **Storage**: Almacenamiento de archivos (imágenes, PDFs)
- **Auth**: Autenticación y autorización
- **Real-time**: Actualizaciones en tiempo real

### **Seguridad**
- **Row Level Security (RLS)**: Cada usuario solo accede a sus datos
- **Políticas de Storage**: Archivos privados por usuario
- **Validación**: Zod para validación de formularios
- **Sanitización**: Prevención de inyección SQL

## 🚀 Despliegue

### **Vercel (Recomendado)**
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### **Netlify**
1. Conectar repositorio a Netlify
2. Configurar build command: `npm run build`
3. Configurar publish directory: `build`

### **Supabase Hosting**
1. Configurar proyecto en Supabase
2. Habilitar hosting estático
3. Conectar con el repositorio

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación en `/docs`

---

**Desarrollado con ❤️ para optimizar la gestión de ventas y inventario**