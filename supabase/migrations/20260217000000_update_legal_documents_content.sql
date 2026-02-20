-- Migración única: Actualización de documentos legales CrecePlus (Términos, Privacidad, Suscripción, Datos)

-- Eliminar todos los documentos legales existentes
DELETE FROM legal_documents;

-- Insertar TÉRMINOS Y CONDICIONES
INSERT INTO legal_documents (document_type, version, title, content, is_active, published_at) VALUES (
  'TERMS',
  '1.0',
  'Términos y Condiciones de Uso',
  '# CrecePlus

**Versión 1.0**  
**Última actualización:** 20 de febrero de 2026

---

## 1. Identificación del Titular

El presente documento regula el uso de la plataforma CrecePlus, disponible en el dominio creceplus.app.

**Titular del Servicio:** Jonathan Castañeda, persona natural domiciliada en Itagüí, Antioquia, Colombia, propietario de la marca comercial CrecePlus.

**Correo de contacto legal:** legal@creceplus.app

**Correo de soporte:** soporte@creceplus.app

---

## 2. Aceptación de los Términos

Al registrarse, acceder o utilizar la Plataforma, el Usuario declara haber leído, entendido y aceptado estos Términos y Condiciones.

Si no está de acuerdo con estos términos, deberá abstenerse de utilizar el Servicio.

---

## 3. Definiciones

**Plataforma:** Software de gestión empresarial ofrecido bajo modalidad SaaS por CrecePlus.

**Usuario:** Persona natural o jurídica que utiliza el Servicio.

**Cuenta:** Registro único que permite acceder a la Plataforma.

**Suscripción:** Plan contratado que otorga acceso a funcionalidades específicas.

**Plan Gratuito:** Modalidad sin costo con funcionalidades limitadas.

---

## 4. Descripción del Servicio

CrecePlus es una plataforma tecnológica que ofrece herramientas de gestión empresarial, incluyendo:
- Sistema de punto de venta (POS)
- Gestión de inventarios
- Reportes de ventas
- Administración básica financiera
- Gestión de usuarios internos

CrecePlus podrá incorporar funcionalidades adicionales, incluyendo servicios de facturación electrónica conforme a la normativa colombiana vigente.

---

## 5. Uso Permitido

El Usuario se compromete a:
- Utilizar la Plataforma únicamente para fines comerciales lícitos.
- No utilizar el Servicio para actividades fraudulentas o ilícitas.
- No intentar acceder a información de otros usuarios.
- No realizar ingeniería inversa, copia o reproducción no autorizada del software.
- Cumplir con la legislación aplicable en Colombia.

CrecePlus podrá suspender cuentas que incumplan estas disposiciones.

---

## 6. Registro y Seguridad de la Cuenta

El Usuario deberá proporcionar información veraz y actualizada.

Es responsable de:
- Mantener la confidencialidad de sus credenciales.
- Notificar cualquier acceso no autorizado.

CrecePlus no será responsable por daños derivados del uso indebido de credenciales del Usuario.

---

## 7. Exactitud de la Información

El Usuario es el único responsable de la información ingresada en la Plataforma, incluyendo precios, inventarios, impuestos, ventas, reportes y datos contables.

CrecePlus no garantiza la exactitud de resultados derivados de información incorrecta o incompleta proporcionada por el Usuario.

---

## 8. No Asesoría Profesional

CrecePlus es una herramienta tecnológica de gestión empresarial y no constituye asesoría contable, tributaria, financiera o legal.

El Usuario es responsable del cumplimiento de sus obligaciones fiscales y legales ante las autoridades competentes.

---

## 9. Infraestructura y Terceros

La Plataforma utiliza servicios tecnológicos de terceros para su funcionamiento, incluyendo:
- Infraestructura y base de datos provista por Supabase.
- Servicios de envío de correos electrónicos mediante SendGrid.
- Procesamiento de pagos a través de Wompi (según el plan contratado).

CrecePlus no será responsable por fallas atribuibles exclusivamente a proveedores externos.

---

## 10. Disponibilidad del Servicio

CrecePlus procura mantener la disponibilidad continua del Servicio; sin embargo:
- No garantiza disponibilidad ininterrumpida 24/7.
- Podrá realizar mantenimientos programados.
- No será responsable por interrupciones derivadas de fuerza mayor o fallas externas.

---

## 11. Propiedad Intelectual

Todo el software, diseño, código fuente, estructura, bases de datos, interfaces y contenidos de la Plataforma son propiedad exclusiva del titular del Servicio.

Queda prohibida su reproducción, distribución o modificación sin autorización expresa.

---

## 12. Limitación de Responsabilidad

En ningún caso CrecePlus será responsable por:
- Pérdida de ingresos o ganancias.
- Daños indirectos o consecuenciales.
- Pérdida de datos causada por factores externos o por uso indebido del Usuario.

La responsabilidad total de CrecePlus frente al Usuario no excederá el valor pagado por el Usuario durante los últimos tres (3) meses previos al evento que origine la reclamación.

---

## 13. Suspensión y Terminación

CrecePlus podrá suspender o cancelar cuentas cuando:
- Se incumplan estos Términos.
- Exista uso fraudulento del sistema.
- Se incumplan obligaciones de pago conforme al Acuerdo de Suscripción.

El Usuario podrá cancelar su cuenta en cualquier momento.

---

## 14. Conservación y Eliminación de Datos

Tras la cancelación de la cuenta, los datos podrán conservarse por un período razonable por motivos legales, contables o técnicos, tras el cual serán eliminados de forma segura conforme a la normativa aplicable.

---

## 15. Modificaciones

CrecePlus podrá modificar estos Términos en cualquier momento.

Las modificaciones sustanciales serán notificadas con al menos treinta (30) días de anticipación.

El uso continuado del Servicio constituye aceptación de los nuevos términos.

---

## 16. Ley Aplicable y Jurisdicción

Estos Términos se rigen por las leyes de la República de Colombia.

Cualquier controversia será sometida a los jueces competentes del territorio colombiano.

---

## 17. Contacto

Para consultas relacionadas con estos Términos:
- soporte@creceplus.app
',
  true,
  NOW()
);

-- Insertar POLÍTICA DE PRIVACIDAD
INSERT INTO legal_documents (document_type, version, title, content, is_active, published_at) VALUES (
  'PRIVACY',
  '1.0',
  'Política de Privacidad',
  'CrecePlus
Versión 1.0
Última actualización: 20 de febrero de 2026

## 1. Información General

La presente Política de Privacidad describe cómo CrecePlus recopila, utiliza, almacena y protege la información personal de los Usuarios que utilizan la plataforma disponible en creceplus.app.

**Responsable del tratamiento:**
Jonathan Castañeda, persona natural domiciliada en Itagüí, Antioquia, Colombia, propietario de la marca comercial CrecePlus.

**Correo de contacto en materia de privacidad:**
privacidad@creceplus.app

soporte@creceplus.app

## 2. Información que Recopilamos

### 2.1 Información de Registro
- Nombre del titular del negocio
- Nombre comercial
- Correo electrónico
- Número de contacto
- Información básica de facturación
- Credenciales de acceso

### 2.2 Información Operativa del Negocio
- Datos de productos
- Inventarios
- Ventas y transacciones
- Reportes financieros generados por el sistema
- Información de empleados registrados por el Usuario

### 2.3 Información Técnica
- Dirección IP
- Tipo de navegador
- Dispositivo utilizado
- Registros de actividad dentro del sistema

## 3. Finalidad del Tratamiento

La información recopilada se utiliza para:
- Proporcionar y mantener el Servicio
- Procesar pagos y suscripciones
- Generar reportes y estadísticas
- Brindar soporte técnico
- Mejorar funcionalidades
- Cumplir obligaciones legales

CrecePlus no vende ni comercializa datos personales.

## 4. Proveedores de Servicios y Encargados del Tratamiento

Para operar la Plataforma utilizamos servicios tecnológicos de terceros, incluyendo:
- Infraestructura y base de datos mediante Supabase
- Envío de correos electrónicos transaccionales mediante SendGrid
- Procesamiento de pagos a través de Wompi

Estos proveedores actúan como encargados del tratamiento y cumplen con estándares de seguridad adecuados.

## 5. Base Legal del Tratamiento

El tratamiento de datos se fundamenta en:
- La ejecución del contrato de prestación de servicios.
- El consentimiento otorgado por el Usuario.
- El cumplimiento de obligaciones legales en Colombia.

## 6. Seguridad de la Información

Implementamos medidas técnicas y organizativas razonables para proteger la información, incluyendo:
- Cifrado de datos en tránsito (HTTPS/SSL).
- Almacenamiento seguro en infraestructura especializada.
- Controles de acceso y autenticación.
- Copias de seguridad periódicas.

No obstante, ningún sistema es completamente invulnerable.

## 7. Transferencias Internacionales

Algunos datos pueden almacenarse o procesarse en servidores ubicados fuera de Colombia, a través de proveedores tecnológicos internacionales.

En estos casos, CrecePlus garantiza que se aplican medidas de seguridad y salvaguardas adecuadas conforme a la normativa colombiana.

## 8. Derechos del Usuario

El Usuario podrá:
- Acceder a sus datos personales.
- Solicitar corrección o actualización.
- Solicitar eliminación cuando sea legalmente procedente.
- Revocar el consentimiento.
- Solicitar copia de sus datos en formato portable.

Las solicitudes deberán enviarse a privacidad@creceplus.app
.
CrecePlus responderá dentro de los plazos establecidos por la legislación colombiana.

## 9. Retención de Datos

Los datos serán conservados mientras la cuenta esté activa.

Tras la cancelación, podrán conservarse por un período razonable para:
- Cumplimiento de obligaciones legales o fiscales.
- Resolución de disputas.
- Auditorías internas.

Posteriormente serán eliminados de forma segura.

## 10. Cookies y Tecnologías Similares

CrecePlus utiliza cookies y tecnologías similares para:
- Mantener sesiones activas.
- Recordar preferencias.
- Analizar uso de la Plataforma.

El Usuario puede deshabilitarlas desde su navegador, aunque esto puede afectar funcionalidades.

## 11. Menores de Edad

El Servicio está dirigido exclusivamente a mayores de 18 años.
No recopilamos intencionalmente información de menores.

## 12. Cambios a la Política

CrecePlus podrá modificar esta Política.

Los cambios materiales serán notificados mediante:
- Aviso en la Plataforma
- Correo electrónico registrado

## 13. Autoridad de Control

En caso de inconformidad relacionada con el tratamiento de datos personales, el Usuario podrá acudir ante la autoridad competente en Colombia:

Superintendencia de Industria y Comercio.

## 14. Contacto

Para consultas relacionadas con privacidad:

privacidad@creceplus.app

soporte@creceplus.app
',
  true,
  NOW()
);

-- Insertar ACUERDO DE SUSCRIPCIÓN
INSERT INTO legal_documents (document_type, version, title, content, is_active, published_at) VALUES (
  'SUBSCRIPTION',
  '1.0',
  'Acuerdo de Suscripción',
  'CrecePlus
Versión 1.0
Última actualización: 20 de febrero de 2026

## 1. Objeto

El presente Acuerdo regula las condiciones comerciales aplicables a los planes de suscripción ofrecidos por CrecePlus, plataforma de gestión empresarial disponible en creceplus.app.

## 2. Planes Disponibles

CrecePlus ofrece los siguientes planes:

### Plan Básico
- Hasta 100 productos
- 1 usuario principal
- Reportes básicos
- Soporte por email

### Plan Profesional
- Hasta 1.000 productos
- Hasta 5 usuarios simultáneos
- Reportes avanzados
- Gestión de empleados
- Soporte prioritario

### Plan Empresarial
- Productos ilimitados
- Usuarios ilimitados
- Reportes personalizados
- Acceso a API
- Soporte prioritario extendido

CrecePlus podrá modificar funcionalidades futuras previo aviso razonable.

## 3. Modalidades de Pago

Las suscripciones pueden contratarse bajo modalidad:
- Mensual
- Anual (con descuento aplicado)

Todos los pagos se realizan por adelantado.

El procesamiento de pagos se realiza a través de Wompi, proveedor externo de servicios de pago. CrecePlus no almacena información financiera sensible del Usuario.

Los precios incluyen impuestos cuando legalmente aplique.

## 4. Renovación Automática

Las suscripciones se renuevan automáticamente al finalizar cada período contratado, salvo cancelación previa por parte del Usuario.

El cobro se realizará utilizando el método de pago registrado.

CrecePlus podrá modificar precios notificando con al menos 30 días de anticipación.
Los cambios no afectarán períodos ya pagados.

## 5. Cambios de Plan

### Upgrade (Mejora de plan)
- Puede realizarse en cualquier momento.
- El valor adicional se prorrateará por el tiempo restante del período actual.

### Downgrade (Reducción de plan)
- Se hará efectivo al siguiente ciclo de facturación.
- El Usuario deberá ajustarse a los límites del nuevo plan.

## 6. Cancelación

El Usuario puede cancelar en cualquier momento desde su cuenta.

La cancelación:
- No genera penalidades.
- Mantiene activo el servicio hasta el final del período pagado.
- No se realizan reembolsos proporcionales por períodos parcialmente utilizados, salvo lo establecido en la cláusula de reembolsos.

## 7. Política de Reembolsos

**Primeros 14 días desde la primera suscripción paga:**

El Usuario podrá solicitar reembolso completo siempre que:
- No exista uso abusivo del sistema.
- No se haya superado el 50% de los límites del plan contratado.

Después de 14 días no se otorgarán reembolsos por cancelación voluntaria.

En caso de fallas técnicas graves atribuibles exclusivamente a CrecePlus que impidan el uso sustancial del servicio, podrá otorgarse reembolso proporcional.

Los reembolsos se procesarán dentro de 5 a 10 días hábiles al mismo método de pago original.

## 8. Suspensión por Falta de Pago

Si un pago no puede procesarse:
- Se notificará al Usuario.
- Se otorgará un período de gracia de 7 días.
- Transcurrido ese plazo, la cuenta podrá ser suspendida.
- La reactivación se realizará automáticamente al regularizar el pago.

## 9. Conservación de Datos tras Cancelación

Tras la cancelación:
- Los datos se conservarán por 90 días.
- Durante este período el Usuario podrá reactivar la cuenta sin pérdida de información.
- Después de 90 días los datos podrán eliminarse de forma permanente.

## 10. Plan Gratuito

CrecePlus puede ofrecer un plan gratuito con funcionalidades limitadas.

El plan gratuito:
- Puede ser modificado o eliminado en cualquier momento.
- No genera obligación de continuidad indefinida.
- Está sujeto a límites de uso razonable.

## 11. Limitaciones de Uso

Cada plan está sujeto a límites de:
- Número de productos
- Número de usuarios
- Transacciones mensuales
- Almacenamiento

El uso excesivo o abusivo podrá dar lugar a restricciones o requerimiento de upgrade.

## 12. Modificaciones del Acuerdo

CrecePlus podrá modificar este Acuerdo notificando con 30 días de anticipación.

El uso continuado del Servicio constituye aceptación de los cambios.

## 13. Contacto

Para consultas relacionadas con su suscripción:
- suscripciones@creceplus.app
- soporte@creceplus.app
',
  true,
  NOW()
);

-- Insertar POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES
INSERT INTO legal_documents (document_type, version, title, content, is_active, published_at) VALUES (
  'DATA_POLICY',
  '1.0',
  'Política de Tratamiento de Datos Personales',
  '📄 **POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES**

CrecePlus
Versión 1.0
Última actualización: 20 de febrero de 2026

## 1. Identificación del Responsable del Tratamiento

En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, se informa que el responsable del tratamiento de los datos personales es:

**Responsable:** Jonathan Castañeda
**Naturaleza jurídica:** Persona natural
**Domicilio:** Itagüí, Antioquia, Colombia
**Correo electrónico:** privacidad@creceplus.app

## 2. Alcance

Esta política aplica a todos los datos personales recolectados a través de la plataforma creceplus.app en el marco de la prestación del servicio de gestión empresarial.

## 3. Finalidades del Tratamiento

### 3.1 Finalidades Principales
- Prestación del servicio SaaS de gestión empresarial
- Gestión de la relación contractual con el Usuario
- Procesamiento de pagos
- Soporte técnico
- Generación de reportes operativos y financieros

### 3.2 Finalidades Secundarias
- Mejora continua del servicio
- Análisis estadístico interno
- Comunicaciones informativas relacionadas con el servicio
- Cumplimiento de obligaciones legales y regulatorias

CrecePlus no comercializa datos personales.

## 4. Tipos de Datos Tratados

### 4.1 Datos de Identificación
- Nombre completo
- Número de identificación o NIT
- Correo electrónico
- Teléfono de contacto

### 4.2 Datos Comerciales
- Información de facturación
- Historial de pagos
- Información de productos y ventas registradas
- Datos de empleados registrados por el Usuario

### 4.3 Datos Técnicos
- Dirección IP
- Registros de acceso
- Información del navegador
- Cookies

No se recolectan datos sensibles salvo que el Usuario los ingrese voluntariamente dentro de su propia operación comercial.

## 5. Derechos de los Titulares

De conformidad con la Ley 1581 de 2012, el titular podrá:
- Conocer, actualizar y rectificar sus datos personales.
- Solicitar prueba de la autorización otorgada.
- Ser informado sobre el uso dado a sus datos.
- Presentar quejas ante la Superintendencia de Industria y Comercio.
- Revocar la autorización y solicitar la supresión cuando sea procedente.

## 6. Procedimiento para Consultas y Reclamos

Las solicitudes deberán enviarse a:

privacidad@creceplus.app

La solicitud debe contener:
- Nombre completo del titular
- Número de identificación
- Descripción clara de la solicitud
- Medio de contacto para respuesta

**Tiempos de respuesta**
- Consultas: máximo 10 días hábiles.
- Reclamos: máximo 15 días hábiles.
- En caso necesario, el plazo podrá prorrogarse conforme a la ley, informando al titular.

## 7. Autorización

El tratamiento de datos personales se realiza con autorización previa, expresa e informada del titular, otorgada al momento del registro en la Plataforma.

El titular podrá revocar dicha autorización cuando no exista deber legal o contractual que impida su eliminación.

## 8. Transferencias y Transmisiones

Para la operación del servicio, CrecePlus puede transmitir datos a encargados del tratamiento tales como:
- Proveedores de infraestructura tecnológica como Supabase
- Procesadores de pagos como Wompi
- Servicios de correo electrónico como SendGrid

Cuando exista transferencia internacional de datos, se garantizarán medidas adecuadas de protección conforme a la normativa colombiana.

## 9. Medidas de Seguridad

CrecePlus adopta medidas técnicas y administrativas razonables para proteger los datos personales, incluyendo:
- Cifrado de datos en tránsito
- Controles de acceso restringido
- Copias de seguridad periódicas
- Monitoreo de actividad

## 10. Tiempo de Conservación

Los datos personales serán conservados:
- Durante la vigencia de la relación contractual.
- Hasta 5 años posteriores por obligaciones tributarias y comerciales.
- Por períodos mayores cuando la ley lo exija.

Una vez cumplida la finalidad, los datos serán eliminados o anonimizados.

## 11. Área Responsable

Responsable del cumplimiento de esta política:

Jonathan Castañeda
Correo: privacidad@creceplus.app

## 12. Vigencia

La presente política rige desde su publicación y podrá ser modificada en cualquier momento. Las modificaciones serán informadas a través de la Plataforma.

Este tratamiento de datos',
  true,
  NOW()
);