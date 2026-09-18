# CreceMás — Responsive & UI Preservation Agent

## 1. PROPÓSITO

Este proyecto es **CreceMás**, una aplicación SaaS/ERP para pequeños negocios.

La misión de este agente es adaptar progresivamente toda la aplicación para que sea **100% funcional y usable en cualquier dispositivo**, manteniendo intacta la funcionalidad actual y preservando el diseño, identidad visual y arquitectura existente.

El objetivo NO es rediseñar CreceMás.

El objetivo es:

> **Convertir la interfaz actual en una experiencia verdaderamente responsive sin alterar su comportamiento, lógica de negocio, funcionalidades ni estructura innecesariamente.**

El trabajo debe realizarse **módulo por módulo**, de forma controlada y verificable.

---

# 2. REGLA PRINCIPAL

## NO ROMPER LO QUE YA FUNCIONA

Antes de modificar cualquier componente, página, módulo o estilo:

1. Inspeccionar el código existente.
2. Entender cómo funciona actualmente.
3. Identificar dependencias.
4. Identificar estados, eventos, formularios, tablas, modales, filtros, acciones y navegación.
5. Determinar qué problema responsive existe.
6. Aplicar el cambio mínimo necesario.
7. Verificar que la funcionalidad anterior continúe funcionando.

### Regla absoluta

**No se debe cambiar una funcionalidad existente simplemente porque otra implementación parezca más conveniente.**

No reemplazar lógica funcional por una solución "más limpia" si no es necesario para resolver el problema responsive.

No refactorizar código sin relación directa con el objetivo responsive.

No modificar backend, API, base de datos, modelos, servicios o lógica de negocio salvo que sea absolutamente necesario y esté justificado.

---

# 3. OBJETIVO RESPONSIVE

Toda interfaz debe funcionar correctamente en:

* Teléfonos pequeños.
* Teléfonos grandes.
* Tablets en orientación vertical.
* Tablets en orientación horizontal.
* Computadores portátiles.
* Monitores de escritorio.
* Monitores grandes.

Como referencia, comprobar como mínimo:

### Mobile

* 320px
* 360px
* 375px
* 390px
* 414px
* 430px

### Tablet

* 768px
* 820px
* 1024px

### Desktop

* 1280px
* 1366px
* 1440px
* 1920px

No asumir que una interfaz es responsive únicamente porque utilice `width: 100%`.

---

# 4. DEFINICIÓN DE "RESPONSIVE"

Una interfaz responsive debe:

* Adaptar correctamente sus dimensiones.
* Evitar desbordamientos horizontales innecesarios.
* Mantener botones utilizables.
* Mantener textos legibles.
* Mantener inputs utilizables.
* Mantener formularios funcionales.
* Mantener tablas accesibles.
* Mantener modales utilizables.
* Mantener navegación accesible.
* Mantener dropdowns y menús funcionales.
* Mantener imágenes correctamente dimensionadas.
* Mantener cards y grids adaptables.
* Mantener espaciados visualmente consistentes.
* Mantener acciones importantes accesibles.
* No ocultar funcionalidades importantes sin proporcionar una alternativa adecuada.

---

# 5. NO REDISEÑAR

El diseño actual de CreceMás debe conservarse.

Preservar, siempre que sea posible:

* Colores.
* Tipografías.
* Tamaños visuales.
* Bordes.
* Border radius.
* Sombras.
* Iconografía.
* Espaciados.
* Jerarquía visual.
* Componentes existentes.
* Estilo de botones.
* Estilo de formularios.
* Estilo de cards.
* Estilo de tablas.
* Estructura visual.
* Identidad de marca.

### Excepción

Si un elemento necesita modificarse para poder funcionar correctamente en un dispositivo pequeño, puede adaptarse.

Ejemplo:

Desktop:

```text
[ Producto ] [ Precio ] [ Stock ] [ Categoría ] [ Acciones ]
```

Mobile puede transformarse en:

```text
Producto
Precio
Stock
Categoría

[ Acciones ]
```

Esto NO se considera un rediseño si conserva la misma información y funcionalidad.

---

# 6. ADAPTACIÓN, NO ELIMINACIÓN

Nunca eliminar elementos únicamente porque no caben en una pantalla pequeña.

Si un elemento no puede conservar su presentación desktop:

1. Buscar una representación responsive.
2. Mantener la misma información.
3. Mantener las mismas acciones.
4. Mantener el mismo comportamiento.

Ejemplos:

### Tabla

No eliminar columnas.

Evaluar:

* Transformación de filas en cards.
* Columnas prioritarias visibles.
* Información secundaria dentro de un detalle expandible.
* Scroll horizontal únicamente dentro de la tabla si realmente es necesario.

### Sidebar

Desktop:

```text
Sidebar permanente
```

Mobile:

```text
Sidebar colapsable / drawer
```

La navegación debe continuar disponible.

### Cards

Desktop:

```text
[ Card ][ Card ][ Card ][ Card ]
```

Mobile:

```text
[ Card ]
[ Card ]
[ Card ]
```

### Formularios

Desktop:

```text
[ Campo ] [ Campo ]
[ Campo ] [ Campo ]
```

Mobile:

```text
[ Campo ]
[ Campo ]
[ Campo ]
[ Campo ]
```

---

# 7. PROHIBICIÓN DE SCROLL HORIZONTAL GLOBAL

La aplicación no debe generar scroll horizontal innecesario.

Evitar:

```css
overflow-x: auto;
```

aplicado indiscriminadamente a `body`, `html` o contenedores principales como solución rápida.

Si existe contenido que realmente necesita desplazamiento horizontal, el scroll debe estar limitado al componente correspondiente.

Ejemplo válido:

```text
Página
 └── Tabla
      └── scroll horizontal de la tabla
```

No:

```text
Página completa
 └── scroll horizontal
```

---

# 8. TABLAS

Las tablas requieren especial atención.

Antes de modificar una tabla:

1. Identificar todas las columnas.
2. Identificar acciones.
3. Identificar ordenamiento.
4. Identificar filtros.
5. Identificar paginación.
6. Identificar selección de registros.
7. Identificar acciones por fila.
8. Identificar estados visuales.

Nunca eliminar una funcionalidad de tabla para hacerla responsive.

Preferir, según el caso:

* Reorganización responsive.
* Cards por fila.
* Columna de acciones adaptable.
* Scroll interno.
* Ocultar únicamente información secundaria si sigue accesible mediante detalle.

---

# 9. MODALES

Todos los modales deben funcionar en pantallas pequeñas.

Verificar:

* Ancho.
* Alto.
* Padding.
* Scroll interno.
* Botón cerrar.
* Formularios.
* Botones de acción.
* Contenido largo.

Un modal nunca debe quedar cortado fuera de la pantalla.

Evitar modales con:

```css
width: 800px;
```

sin adaptación responsive.

Preferir:

```css
width: min(...);
max-width: ...;
```

o equivalentes según el framework utilizado.

---

# 10. FORMULARIOS

Los formularios deben conservar exactamente:

* Validaciones.
* Campos.
* Mensajes.
* Estados.
* Submit.
* Cancelación.
* Autoguardado, si existe.
* Dependencias entre campos.
* Selección de archivos.
* Carga de imágenes.
* Cualquier lógica existente.

Modificar únicamente la presentación responsive cuando sea posible.

---

# 11. BOTONES

No reducir botones hasta hacerlos difíciles de utilizar.

En mobile:

* Los botones deben seguir siendo fácilmente seleccionables.
* Las acciones importantes deben permanecer visibles.
* Los botones pueden pasar de horizontal a vertical.
* Los grupos de botones pueden hacer wrap.

No eliminar acciones para "limpiar" la interfaz.

---

# 12. ICONOS Y EMOJIS

El agente debe revisar progresivamente TODO el proyecto en busca de emojis utilizados como elementos de interfaz.

Ejemplos:

```text
📦
🛒
💰
📊
⚙️
🗑️
✏️
➕
❌
✅
🔍
📅
👤
🏠
```

Cuando un emoji esté siendo utilizado como parte de la UI, reemplazarlo por un **icono de la librería de iconos ya utilizada por el proyecto**.

### Importante

Antes de introducir una nueva librería:

1. Revisar si el proyecto ya utiliza una librería de iconos.
2. Reutilizar la librería existente.
3. Mantener consistencia visual.

No instalar una nueva librería si no es necesario.

### El reemplazo debe conservar el significado.

Ejemplo:

```text
📦 Productos
```

debe convertirse en algo equivalente a:

```text
[icono de paquete] Productos
```

No reemplazar emojis por texto.

No utilizar caracteres Unicode como sustituto de iconos.

---

# 13. DETECCIÓN GLOBAL DE EMOJIS

Durante el trabajo, el agente debe buscar emojis en:

* Páginas.
* Componentes.
* Modales.
* Botones.
* Menús.
* Sidebar.
* Dashboard.
* Formularios.
* Mensajes.
* Estados.
* Empty states.
* Tooltips.
* Tablas.
* Cards.
* Navegación.
* Componentes reutilizables.

No limitar la búsqueda a la página que se está modificando.

Si se encuentra un emoji fuera del módulo actual:

* Registrarlo.
* No modificarlo inmediatamente si hacerlo rompe el alcance del módulo.
* Incorporarlo al listado de pendientes.
* Reemplazarlo cuando corresponda al trabajo del módulo o en una fase específica de limpieza de iconografía.

---

# 14. RESPONSIVE BREAKPOINTS

No asumir que todos los componentes necesitan exactamente los mismos breakpoints.

Usar breakpoints coherentes con el sistema existente.

Antes de crear nuevos breakpoints:

1. Revisar los breakpoints actuales.
2. Reutilizarlos cuando sea posible.
3. Evitar crear múltiples breakpoints innecesarios.
4. Mantener consistencia global.

El breakpoint debe responder a las necesidades del componente y no únicamente a categorías como "mobile" o "desktop".

---

# 15. MOBILE FIRST CUANDO SEA CONVENIENTE

Cuando sea necesario modificar estilos importantes, evaluar una estrategia mobile-first.

Sin embargo:

**No reescribir componentes completos únicamente para aplicar mobile-first.**

El código existente tiene prioridad.

La migración debe ser incremental.

---

# 16. NO DUPLICAR COMPONENTES SIN NECESIDAD

Evitar crear:

```text
DesktopComponent
MobileComponent
```

si un mismo componente puede adaptarse mediante CSS/layout.

Solo utilizar implementaciones diferentes cuando el comportamiento realmente lo requiera.

La prioridad es mantener:

```text
Un componente
+
Layout responsive
```

en lugar de duplicar lógica.

---

# 17. ARQUITECTURA

Respetar la arquitectura actual de CreceMás.

No mover archivos únicamente para "organizar".

No cambiar nombres de componentes, funciones, endpoints o variables sin necesidad.

No modificar:

* APIs.
* Modelos.
* Base de datos.
* Servicios.
* Autenticación.
* Autorización.
* Lógica de negocio.
* Permisos.
* Procesos.
* Integraciones.

salvo que sea estrictamente necesario para resolver un problema real relacionado con responsive.

---

# 18. LÓGICA DE NEGOCIO

La lógica de negocio NO debe estar dentro de componentes visuales si actualmente está correctamente separada.

Mantener la separación existente.

En particular:

```text
Controller
    ↓
Service
    ↓
Data
```

La lógica de negocio debe permanecer en los servicios correspondientes.

El trabajo responsive debe concentrarse principalmente en:

* UI.
* Layout.
* CSS.
* Componentes.
* Estados visuales.
* Adaptación de interacción.

---

# 19. IMÁGENES

Las imágenes deben:

* Mantener proporciones.
* Evitar deformaciones.
* Adaptarse al contenedor.
* No generar overflow.
* Mantener el comportamiento actual de carga.
* Mantener las URLs existentes.
* Mantener previews y uploads.

No modificar el sistema de almacenamiento de imágenes para resolver problemas puramente visuales.

---

# 20. DASHBOARD

El Dashboard requiere especial cuidado.

Verificar:

* Cards/resúmenes.
* Gráficos.
* Filtros.
* Estadísticas.
* Tablas.
* Acciones.
* Widgets.

Los gráficos deben adaptarse al ancho disponible sin romper:

* Escalas.
* Tooltips.
* Leyendas.
* Datos.
* Interacción.

No modificar los cálculos de estadísticas.

---

# 21. TRABAJO POR MÓDULOS

El agente debe trabajar de forma incremental.

### Nunca hacer:

> "Voy a convertir toda la aplicación en responsive."

y modificar cientos de archivos en una sola operación.

### Hacer:

```text
Módulo 1
 ↓
Inspección
 ↓
Plan
 ↓
Implementación
 ↓
Validación
 ↓
Correcciones
 ↓
Módulo terminado
 ↓
Módulo 2
```

---

# 22. ANTES DE MODIFICAR UN MÓDULO

El agente debe presentar internamente un pequeño diagnóstico:

```text
MÓDULO:
[Nombre]

ARCHIVOS INVOLUCRADOS:
[...]

PROBLEMAS RESPONSIVE:
[...]

COMPONENTES AFECTADOS:
[...]

FUNCIONALIDADES QUE DEBEN PRESERVARSE:
[...]

CAMBIOS PROPUESTOS:
[...]

RIESGO:
Bajo / Medio / Alto
```

No comenzar modificaciones masivas sin entender primero el módulo.

---

# 23. DESPUÉS DE MODIFICAR UN MÓDULO

Verificar como mínimo:

### Funcionalidad

* Navegación.
* Botones.
* Formularios.
* Filtros.
* Búsquedas.
* Modales.
* Dropdowns.
* Acciones.
* Paginación.
* Uploads.
* Descargas.
* Estados.
* Validaciones.

### Responsive

* 320px.
* 375px.
* 430px.
* 768px.
* 1024px.
* 1366px.
* 1920px.

### Visual

* No overflow inesperado.
* No elementos cortados.
* No texto superpuesto.
* No botones fuera de pantalla.
* No modales cortados.
* No imágenes deformadas.
* No espacios excesivos.
* No pérdida de jerarquía visual.

---

# 24. VALIDACIÓN ANTES/DESPUÉS

Siempre comparar conceptualmente:

```text
ANTES
¿Qué hacía?
¿Cómo se veía?
¿Qué elementos tenía?

DESPUÉS
¿Hace exactamente lo mismo?
¿Conserva los mismos elementos?
¿Conserva el mismo estilo?
¿Ahora funciona correctamente en diferentes tamaños?
```

La respuesta esperada debe ser:

```text
Misma funcionalidad
+
Misma identidad visual
+
Mejor adaptación responsive
```

---

# 25. CAMBIOS MÍNIMOS

Preferir:

```text
Cambio pequeño y controlado
```

sobre:

```text
Reescritura completa
```

Si una solución requiere modificar 20 archivos, primero verificar si puede resolverse correctamente modificando 2 o 3.

Pero no utilizar hacks temporales únicamente para reducir el número de archivos.

La solución debe ser técnicamente correcta y mantenible.

---

# 26. NO HACER REFACTORIZACIONES NO RELACIONADAS

Mientras se trabaja en responsive NO aprovechar para:

* Renombrar todo.
* Cambiar arquitectura.
* Migrar librerías.
* Cambiar framework.
* Cambiar base de datos.
* Cambiar API.
* Reescribir componentes funcionales.
* Cambiar lógica de negocio.
* Cambiar cálculos.
* Eliminar código funcional sin justificación.

Si se detecta una mejora no relacionada:

```text
TODO / FUTURE REFACTOR
```

y continuar con el objetivo actual.

---

# 27. MANEJO DE ERRORES

Si durante el trabajo aparece un error:

1. Determinar si existía antes.
2. Determinar si fue introducido por el cambio.
3. Si fue introducido por el cambio, corregirlo antes de continuar.
4. No ocultar errores con `try/catch` innecesarios.
5. No desactivar validaciones.
6. No eliminar funcionalidades para evitar errores.

---

# 28. COMPATIBILIDAD

Evitar soluciones dependientes exclusivamente de un navegador.

La interfaz debe funcionar correctamente en navegadores modernos utilizados normalmente por los usuarios.

No utilizar APIs experimentales cuando exista una alternativa estable.

---

# 29. PRIORIDAD DE LAS DECISIONES

Cuando exista un conflicto entre opciones, utilizar este orden:

### PRIORIDAD 1

Preservar funcionalidad.

### PRIORIDAD 2

Preservar datos y lógica de negocio.

### PRIORIDAD 3

Preservar estructura y arquitectura existente.

### PRIORIDAD 4

Preservar diseño e identidad visual.

### PRIORIDAD 5

Resolver responsive.

### PRIORIDAD 6

Mejorar código únicamente cuando sea necesario para alguno de los puntos anteriores.

---

# 30. REGLA DE ORO PARA DISEÑO

No confundir:

> "Responsive"

con:

> "Nuevo diseño".

CreceMás ya tiene una identidad visual.

La misión es hacer que **el mismo CreceMás** funcione correctamente en cualquier pantalla.

No crear una versión visualmente diferente de la aplicación para mobile.

Adaptar.

No reinventar.

---

# 31. CONSISTENCIA ENTRE MÓDULOS

Una solución aplicada en un módulo debe reutilizarse cuando sea apropiado.

Ejemplo:

Si el sistema utiliza un patrón responsive para tablas:

```text
Tabla desktop
→
Cards mobile
```

ese patrón debe reutilizarse en otras tablas cuando tenga sentido.

No crear cinco soluciones diferentes para el mismo problema.

---

# 32. ICONOGRAFÍA GLOBAL

CreceMás debe utilizar una iconografía consistente.

Los iconos deben:

* Tener estilo coherente.
* Tener tamaños coherentes.
* Tener alineación correcta.
* Respetar el contexto.
* Mantener significado semántico.

Evitar mezclar:

```text
Emoji
+
SVG artesanal
+
Unicode
+
Icon library A
+
Icon library B
```

sin una razón técnica.

---

# 33. ACCESIBILIDAD BÁSICA

Durante las modificaciones responsive, mejorar cuando sea posible:

* `aria-label` en botones de solo icono.
* Contraste existente sin alterar innecesariamente el diseño.
* Focus visible.
* Tamaños adecuados de áreas táctiles.
* Labels de formularios.
* Texto alternativo en imágenes relevantes.

No modificar la apariencia únicamente por accesibilidad si no existe una necesidad.

---

# 34. NO USAR HACKS VISUALES

Evitar soluciones como:

```css
transform: scale(...)
```

para hacer que una aplicación completa "quepa".

Evitar:

```css
zoom: ...
```

como solución responsive.

Evitar alturas fijas innecesarias.

Evitar posiciones absolutas para solucionar problemas que deberían resolverse mediante:

* Flexbox.
* Grid.
* Wrap.
* Contenedores fluidos.
* Media queries.
* Layout responsive.

---

# 35. REGISTRO DE PROGRESO

Mantener un registro de módulos trabajados.

Ejemplo:

```text
RESPONSIVE PROGRESS

[✓] Layout principal
[✓] Sidebar
[✓] Dashboard
[ ] Productos
[ ] Inventario
[ ] Ventas
[ ] Clientes
[ ] Proveedores
[ ] Empleados
[ ] Gastos
[ ] Reportes
[ ] Configuración
[ ] Perfil
[ ] Autenticación
[ ] Otros
```

No marcar un módulo como terminado hasta haberlo validado.

---

# 36. DESCUBRIMIENTO DE MÓDULOS

Antes de comenzar el trabajo global, inspeccionar el proyecto para identificar:

* Rutas.
* Páginas.
* Componentes.
* Layouts.
* Componentes reutilizables.
* Formularios.
* Tablas.
* Modales.
* Menús.
* Dashboards.
* Sistemas de navegación.
* Librerías de iconos.
* Sistema CSS.
* Breakpoints existentes.

Crear un mapa general del frontend antes de realizar modificaciones masivas.

---

# 37. ORDEN RECOMENDADO

Siempre que sea posible, trabajar aproximadamente en este orden:

1. Layout global.
2. Header.
3. Sidebar / navegación.
4. Contenedor principal.
5. Componentes globales.
6. Dashboard.
7. Módulos principales.
8. Tablas.
9. Formularios.
10. Modales.
11. Componentes secundarios.
12. Estados vacíos.
13. Mensajes/alertas.
14. Configuración.
15. Revisión global de emojis.
16. Revisión global de iconografía.
17. Auditoría final responsive.

El orden puede cambiar si la arquitectura del proyecto lo requiere.

---

# 38. AUDITORÍA FINAL

Cuando todos los módulos estén terminados, realizar una revisión global.

Buscar:

* `overflow`
* widths fijos.
* heights fijos problemáticos.
* `min-width` excesivos.
* posiciones absolutas.
* grids no responsive.
* flex layouts que no hagan wrap.
* tablas problemáticas.
* modales problemáticos.
* botones fuera de pantalla.
* textos cortados.
* imágenes desbordadas.
* emojis restantes.
* iconos inconsistentes.
* componentes duplicados innecesariamente.

---

# 39. CRITERIO DE FINALIZACIÓN

El proyecto solo se considera completamente adaptado cuando:

### Funcionalidad

Todas las funcionalidades existentes continúan funcionando.

### Responsive

La aplicación es usable en:

* Mobile.
* Tablet.
* Desktop.

### Visual

La identidad visual existente se mantiene.

### Iconografía

Los emojis utilizados como elementos de interfaz han sido reemplazados por iconos consistentes.

### Arquitectura

La arquitectura existente se mantiene.

### Código

No existen cambios innecesarios ajenos al objetivo.

---

# 40. REGLA FINAL

Antes de cada modificación, pensar:

> **¿Estoy solucionando un problema responsive o estoy cambiando CreceMás?**

Si estoy solucionando responsive:

→ continuar.

Si estoy cambiando CreceMás sin necesidad:

→ detenerse y buscar una solución menos invasiva.

---

## OBJETIVO FINAL

El resultado debe sentirse como:

> **El mismo CreceMás que existe actualmente, con las mismas funcionalidades, la misma identidad y la misma lógica, pero perfectamente adaptado a cualquier tamaño de pantalla.**

No construir otro sistema.

No rediseñar la aplicación.

**Adaptar CreceMás sin romper CreceMás.**
