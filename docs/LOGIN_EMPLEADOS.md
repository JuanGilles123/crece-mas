# 🔐 Sistema de Login para Empleados

## 📋 Resumen

Los empleados pueden iniciar sesión usando su código único sin necesidad de tener un email registrado previamente. El sistema crea automáticamente una cuenta de autenticación cuando el empleado intenta hacer login por primera vez.

## 🚀 Cómo Funciona

### 1. Creación del Empleado

Cuando un administrador crea un empleado, puede elegir entre dos tipos de códigos de acceso:

#### Opción A: Código Corto (Recomendado)
- Se genera un código corto de 5 dígitos numéricos (ej: `12345`)
- Fácil de recordar y escribir
- No requiere teléfono

#### Opción B: Teléfono + PIN
- Usa el teléfono del empleado + un PIN de 4 dígitos
- Formato: `{telefono}|{PIN}` (ej: `3001234567|1234`)
- Más seguro y personalizado
- Requiere que el empleado tenga teléfono registrado

**Nota**: El empleado se guarda en `team_members` con `is_employee = true` e inicialmente `user_id` es `null` (no tiene cuenta de autenticación aún).

### 2. Primer Login del Empleado

Cuando el empleado intenta hacer login por primera vez:

1. **Busca el empleado** por código en `team_members`
2. **Si no tiene `user_id`**:
   - Crea automáticamente un usuario en Supabase Auth
   - Email: `{codigo}@empleado.creceplus.local`
   - Contraseña inicial: El mismo código
   - Actualiza `team_members` con el `user_id` generado
3. **Si ya tiene `user_id`**:
   - Intenta login con el email generado y el código como contraseña
   - Si la contraseña fue cambiada, solicita la contraseña

### 3. Login Subsecuente

- El empleado ingresa su código en la página de login:
  - **Código corto**: Ingresa el código de 5 dígitos (ej: `12345`)
  - **Teléfono + PIN**: Ingresa el teléfono completo + PIN (ej: `3001234567|1234`)
  - **Solo teléfono**: Si el código parece ser un número largo, el sistema intentará buscar por teléfono
- Si el código requiere contraseña (fue cambiada), se solicita
- Si no, el código funciona como contraseña también

## 📱 Interfaz de Usuario

### Página de Login

La página de login tiene dos modos:

1. **Modo Usuario** (por defecto):
   - Email y contraseña tradicional
   - Para usuarios normales

2. **Modo Empleado**:
   - Campo de código de empleado (acepta código corto o teléfono + PIN)
   - Campo de contraseña (opcional, solo si fue cambiada)
   - Toggle para cambiar entre modos
   - Placeholder indica los formatos aceptados

### Instrucciones para el Empleado

Cuando se crea un empleado, se muestra:
- **Código corto**: El código de 5 dígitos generado
- **Teléfono + PIN**: El teléfono y el PIN de 4 dígitos por separado, más el código completo
- Instrucciones de cómo acceder:
  1. Ir a la página de login
  2. Seleccionar "Empleado"
  3. Ingresar el código (corto o teléfono|PIN)
  4. La contraseña inicial es el mismo código/PIN

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

1. **`src/utils/employeeAuth.js`**:
   - `findEmployeeByCode()`: Busca empleado por código corto, teléfono + PIN, o solo teléfono
   - `loginEmployee()`: Autentica empleado solo con código
   - `loginEmployeeWithPassword()`: Autentica con código y contraseña
   - `createEmployeeAuthAndLogin()`: Crea usuario en Auth automáticamente

2. **`src/pages/auth/Login.js`**:
   - Toggle entre login de usuario y empleado
   - Campos específicos para login de empleado
   - Manejo de errores y estados de carga

3. **`src/hooks/useTeam.js`**:
   - `useCreateEmployee()`: Crea empleado sin user_id inicialmente

4. **`src/pages/GestionEquipo.js`**:
   - Botón "Agregar Empleado" además de "Invitar Miembro"
   - Visualización de empleados con badge distintivo

### Flujo de Autenticación

```
Empleado ingresa código
    ↓
Buscar en team_members por employee_code
    ↓
¿Tiene user_id?
    ├─ NO → Crear usuario en Auth
    │        ↓
    │    Actualizar team_members con user_id
    │        ↓
    └─ SÍ → Intentar login con código como contraseña
             ↓
         ¿Login exitoso?
             ├─ SÍ → Redirigir a dashboard
             └─ NO → Solicitar contraseña
                      ↓
                  Intentar login con código + contraseña
                      ↓
                  ¿Login exitoso?
                      ├─ SÍ → Redirigir a dashboard
                      └─ NO → Mostrar error
```

## 🔒 Seguridad

- Los códigos son únicos y no se pueden duplicar
- Los códigos cortos son numéricos de 5 dígitos (00000-99999)
- El email generado (`{codigo}@empleado.creceplus.local`) no es accesible externamente
- La contraseña inicial es el código/PIN, pero puede cambiarse después
- Los empleados solo pueden acceder a las funcionalidades según su rol asignado
- El formato teléfono + PIN es más seguro ya que requiere dos factores (teléfono conocido + PIN único)

## 📝 Notas Importantes

1. **Primer Login**: El primer login puede tomar unos segundos más porque crea la cuenta de autenticación
2. **Cambio de Contraseña**: Los empleados pueden cambiar su contraseña después del primer login
3. **Código Perdido**: Si un empleado pierde su código, el administrador debe proporcionarle uno nuevo o verificar el código en la gestión de equipo
4. **Email Generado**: El email `{codigo}@empleado.creceplus.local` es solo para autenticación interna, no es un email real
5. **Formato de Código**: 
   - Código corto: 5 dígitos numéricos (ej: `12345`)
   - Teléfono + PIN: `{telefono}|{PIN}` (ej: `3001234567|1234`)
   - El separador `|` es importante para distinguir entre teléfono y PIN
6. **Búsqueda Flexible**: El sistema puede buscar por código exacto, teléfono + PIN, o solo teléfono (si es un número largo)

## 🎯 Próximos Pasos (Opcional)

- Implementar recuperación de código para empleados
- Permitir que empleados cambien su contraseña desde su perfil
- Agregar notificaciones cuando se crea un empleado
- Implementar códigos QR para login rápido
