# 📧 Guía de Configuración de Email - PriceSnap API

Esta guía explica cómo configurar el sistema de envío de emails para desarrollo (Gmail) y producción (dominio propio).

---

## 🚀 Configuración para DESARROLLO (Gmail con App Password)

### Paso 1: Activar Verificación en Dos Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Navega a **Seguridad** (Security)
3. Busca la sección **"Verificación en dos pasos"** (2-Step Verification)
4. Haz clic en **"Comenzar"** (Get Started)
5. Sigue las instrucciones para activar la verificación en dos pasos
   - Puedes usar tu teléfono, aplicación de autenticación, o llaves de seguridad

### Paso 2: Generar Contraseña de Aplicación

Una vez activada la verificación en dos pasos (debe aparecer como "✔ Activa"):

**Opción A: Desde la sección "Verificación en dos pasos"**

1. En la página de **Seguridad**, busca la sección **"Verificación en dos pasos"** (2-Step Verification)
2. Haz clic directamente en **"Verificación en dos pasos"** (no en los botones de abajo)
3. Se abrirá una nueva página con los detalles de la verificación en dos pasos
4. Desplázate hacia abajo hasta encontrar la sección **"Contraseñas de aplicaciones"** (App Passwords)
   - Si no la ves inmediatamente, busca un enlace o botón que diga "Contraseñas de aplicaciones" o "App Passwords"
5. Haz clic en **"Contraseñas de aplicaciones"** o **"Generar contraseña de aplicación"**
6. Selecciona:
   - **Aplicación**: "Correo" o "Mail"
   - **Dispositivo**: "Otro (nombre personalizado)" o "Other (Custom name)"
   - **Nombre**: Escribe "PriceSnap API" o "PriceSnap Development"
7. Haz clic en **"Generar"** o **"Create"**
8. **Copia la contraseña de 16 caracteres** que aparece
   - Formato: `xxxx xxxx xxxx xxxx` (4 grupos de 4 caracteres)
   - ⚠️ **IMPORTANTE**: Esta contraseña solo se muestra UNA VEZ. Guárdala en un lugar seguro.

**Opción B: Acceso directo**

Si no encuentras la opción en la página principal:

1. Ve directamente a esta URL: https://myaccount.google.com/apppasswords
2. Si te pide verificar tu identidad, hazlo
3. Selecciona:
   - **Aplicación**: "Correo" o "Mail"
   - **Dispositivo**: "Otro (nombre personalizado)"
   - **Nombre**: "PriceSnap API"
4. Haz clic en **"Generar"**
5. Copia la contraseña de 16 caracteres

**⚠️ Nota importante**: Si no ves la opción "Contraseñas de aplicaciones", puede ser porque:
- La verificación en dos pasos no está completamente activada (verifica que aparezca el checkmark verde)
- Estás usando una cuenta de Google Workspace administrada por una organización (puede estar deshabilitada)
- Tu cuenta es muy nueva y necesita tiempo para activar todas las funciones

En estos casos, puedes usar OAuth2 en su lugar (ver sección de OAuth2 más abajo).

### Paso 3: Configurar Variables de Entorno

Edita tu archivo `.env` o `env.development`:

```env
# Email - Notificaciones SMTP (Gmail para Desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com                    # Tu email de Gmail completo
SMTP_PASS=xxxx xxxx xxxx xxxx                   # La contraseña de aplicación de 16 caracteres (sin espacios o con espacios, ambos funcionan)
SMTP_FROM=tu-email@gmail.com                    # Debe ser el mismo que SMTP_USER para Gmail
```

**Ejemplo real:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=miempresa@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=miempresa@gmail.com
```

### Paso 4: Verificar la Configuración

1. Reinicia tu servidor de desarrollo:
   ```bash
   yarn start:dev
   ```

2. Prueba el endpoint (necesitas estar autenticado como admin):
   ```bash
   POST http://localhost:3006/mail/send
   Authorization: Bearer <tu-token-jwt>
   Content-Type: application/json
   
   {
     "to": "destinatario@example.com",
     "subject": "Prueba de Email",
     "html": "<h1>Email de prueba</h1><p>Si recibes esto, la configuración funciona correctamente.</p>"
   }
   ```

### ⚠️ Notas Importantes para Gmail

- **Límites de envío**: Gmail permite hasta **500 destinatarios por día** en cuentas personales
- **SMTP_FROM**: Gmail siempre reemplazará el remitente con el email autenticado (`SMTP_USER`)
- **Seguridad**: La contraseña de aplicación es específica para esta aplicación y se puede revocar en cualquier momento
- **Espacios en la contraseña**: Puedes usar la contraseña con o sin espacios, ambos formatos funcionan

---

## 🔄 Usar SendGrid en Desarrollo (Opcional)

Si prefieres usar SendGrid también en desarrollo para probar con el mismo servicio que usarás en producción:

### Ventajas de usar SendGrid en desarrollo:
- ✅ Mismo servicio que producción (menos sorpresas)
- ✅ Analytics desde el principio
- ✅ Mejor deliverability
- ✅ 100 emails gratis por día

### Configuración:

1. Sigue los pasos de SendGrid más abajo (Paso 1 y 3)
2. No necesitas verificar dominio para desarrollo (puedes usar email de prueba)
3. Actualiza tu `.env` o `env.development`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Tu API Key de SendGrid
SMTP_FROM=noreply@pricesnap.dev                     # Puede ser un email de prueba
```

**Nota**: Para desarrollo, Gmail es más rápido de configurar. SendGrid es útil si quieres probar analytics o usar el mismo servicio que en producción.

---

## 🏢 Configuración para PRODUCCIÓN (Dominio Propio)

Cuando tengas un dominio propio (ej: `pricesnap.com`), puedes usar diferentes proveedores:

### Opción 1: Google Workspace (Recomendado si ya usas Gmail)

Si tienes Google Workspace con tu dominio:

1. **Configuración SMTP**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=noreply@pricesnap.com              # Email de tu dominio
   SMTP_PASS=xxxx xxxx xxxx xxxx                # Contraseña de aplicación del email corporativo
   SMTP_FROM=noreply@pricesnap.com
   ```

2. **Ventajas**:
   - Hasta 2,000 destinatarios por día
   - Mejor reputación de envío
   - Integración con Google Workspace

### Opción 2: Servicio de Email Transaccional (Recomendado)

Para producción, se recomienda usar servicios especializados:

#### **SendGrid** (Recomendado)

SendGrid es ideal para producción: ofrece excelente deliverability, analytics y escalabilidad.

##### Paso 1: Crear cuenta en SendGrid

1. Ve a https://sendgrid.com/
2. Haz clic en **"Start for free"** o **"Sign Up"**
3. Completa el formulario de registro:
   - Email
   - Contraseña
   - Nombre de la empresa
   - País
4. Verifica tu email (revisa tu bandeja de entrada)

##### Paso 2: Verificar tu dominio (Recomendado para producción)

**Nota**: Puedes empezar sin verificar dominio, pero tendrás límites más estrictos.

1. En el Dashboard de SendGrid, ve a **Settings** → **Sender Authentication**
2. Haz clic en **"Authenticate Your Domain"**
3. Selecciona tu proveedor DNS (ej: Cloudflare, GoDaddy, etc.)
4. SendGrid te proporcionará registros DNS que debes agregar:
   - **CNAME records** (3 registros)
   - **TXT record** (1 registro)
5. Agrega estos registros en tu proveedor DNS
6. Espera a que SendGrid verifique (puede tardar hasta 24 horas, normalmente menos)

**Ejemplo de registros DNS**:
```
CNAME: em1234.pricesnap.com → u1234567.wl123.sendgrid.net
CNAME: s1._domainkey.pricesnap.com → s1.domainkey.u1234567.wl123.sendgrid.net
CNAME: s2._domainkey.pricesnap.com → s2.domainkey.u1234567.wl123.sendgrid.net
TXT: pricesnap.com → v=spf1 include:sendgrid.net ~all
```

##### Paso 3: Crear API Key para SMTP

1. En el Dashboard, ve a **Settings** → **API Keys**
2. Haz clic en **"Create API Key"**
3. Nombre: "PriceSnap API SMTP" o "PriceSnap Production"
4. Permisos: Selecciona **"Full Access"** o **"Restricted Access"** con permisos de "Mail Send"
5. Haz clic en **"Create & View"**
6. **⚠️ IMPORTANTE**: Copia la API Key inmediatamente (solo se muestra una vez)
   - Formato: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Guárdala en un lugar seguro

##### Paso 4: Configurar variables de entorno

Para **producción** (`env.production` o variables del servidor):

```env
# Email - Notificaciones SMTP (SendGrid para Producción)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey                                    # Literalmente "apikey" (no cambiar)
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Tu API Key de SendGrid (la que copiaste)
SMTP_FROM=noreply@pricesnap.com                    # Tu dominio verificado (ej: noreply@tudominio.com)
```

**Ejemplo real**:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SMTP_FROM=noreply@pricesnap.com
```

##### Paso 5: Verificar la configuración

1. Reinicia tu servidor de producción
2. Prueba el endpoint de envío de email
3. Revisa el Dashboard de SendGrid → **Activity** para ver los emails enviados

**Ventajas de SendGrid**:
- ✅ **100 emails gratis por día** (plan gratuito)
- ✅ **Excelente deliverability** (menos probabilidad de spam)
- ✅ **Analytics avanzados**: aperturas, clics, rebotes, bounces
- ✅ **Escalable**: hasta millones de emails
- ✅ **Templates**: editor visual de emails
- ✅ **API REST**: además de SMTP
- ✅ **Webhooks**: notificaciones de eventos
- ✅ **Soporte**: email y chat (en planes pagos)

**Límites del plan gratuito**:
- 100 emails por día
- Hasta 40,000 emails por mes
- Sin límite de tiempo (siempre gratis)

#### **Mailgun**

1. **Crear cuenta**: https://www.mailgun.com/
2. **Verificar dominio**: Agrega los registros DNS
3. **Configuración**:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@pricesnap.com           # Tu dominio verificado
   SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxx          # Tu contraseña SMTP de Mailgun
   SMTP_FROM=noreply@pricesnap.com
   ```

**Ventajas**:
- ✅ 5,000 emails gratis por mes (primeros 3 meses)
- ✅ Excelente para emails transaccionales
- ✅ API REST además de SMTP

#### **Amazon SES**

1. **Crear cuenta AWS**: https://aws.amazon.com/ses/
2. **Verificar dominio**: Agrega los registros DNS
3. **Configuración**:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Región de tu SES
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=AKIAIOSFODNN7EXAMPLE                # Tu SMTP Username
   SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Tu SMTP Password
   SMTP_FROM=noreply@pricesnap.com
   ```

**Ventajas**:
- ✅ Muy económico ($0.10 por 1,000 emails)
- ✅ Escalable
- ✅ Integración con AWS

### Opción 3: Servidor SMTP Propio

Si tienes tu propio servidor de correo:

```env
SMTP_HOST=mail.pricesnap.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@pricesnap.com
SMTP_PASS=tu-contraseña-segura
SMTP_FROM=noreply@pricesnap.com
```

---

## 🔧 Configuración del Archivo de Producción

Edita `env.production` con las variables correspondientes:

```env
# Email - Notificaciones SMTP (Producción)
SMTP_HOST=smtp.sendgrid.net                    # O el host de tu proveedor
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey                               # O tu usuario SMTP
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx     # Tu contraseña/API key
SMTP_FROM=noreply@pricesnap.com                # Email de tu dominio verificado
```

---

## 🧪 Pruebas y Troubleshooting

### Verificar Conexión SMTP

Puedes crear un script de prueba temporal:

```typescript
// test-email.ts (temporal)
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error de conexión:', error);
  } else {
    console.log('✅ Servidor SMTP listo para enviar emails');
  }
});
```

### Errores Comunes

#### Error: "Invalid login"
- ✅ Verifica que `SMTP_USER` sea el email completo
- ✅ Verifica que `SMTP_PASS` sea la contraseña de aplicación correcta (Gmail)
- ✅ Asegúrate de que la verificación en dos pasos esté activada (Gmail)

#### Error: "Connection timeout"
- ✅ Verifica que el puerto sea correcto (587 para TLS, 465 para SSL)
- ✅ Verifica que `SMTP_SECURE` coincida con el puerto
- ✅ Revisa el firewall de tu servidor

#### Error: "Authentication failed"
- ✅ Para Gmail: Usa contraseña de aplicación, no tu contraseña normal
- ✅ Verifica que no haya espacios extra en las variables
- ✅ Revisa que las credenciales sean correctas

---

## 📊 Comparación de Proveedores

| Proveedor | Plan Gratuito | Precio | Deliverability | Recomendado Para |
|-----------|---------------|--------|----------------|------------------|
| **Gmail** | ✅ Ilimitado* | Gratis | Buena | Desarrollo |
| **SendGrid** | 100/día | $19.95/mes (40k) | Excelente | Producción |
| **Mailgun** | 5k/mes (3 meses) | $35/mes (50k) | Excelente | Producción |
| **Amazon SES** | ✅ 62k/mes** | $0.10/1k | Excelente | Producción |

\* Límite de 500 destinatarios/día  
\** Solo si estás en EC2

---

## 🔒 Seguridad

- ⚠️ **NUNCA** subas tus credenciales SMTP a Git
- ✅ Usa variables de entorno
- ✅ Rota las contraseñas periódicamente
- ✅ Usa contraseñas de aplicación específicas por entorno
- ✅ En producción, usa servicios gestionados con autenticación fuerte

---

## 📝 Checklist de Configuración

### Desarrollo
- [ ] Verificación en dos pasos activada en Gmail
- [ ] Contraseña de aplicación generada
- [ ] Variables de entorno configuradas en `.env`
- [ ] Prueba de envío exitosa

### Producción
- [ ] Dominio verificado en el proveedor de email
- [ ] Registros DNS configurados correctamente
- [ ] Variables de entorno configuradas en el servidor
- [ ] Prueba de envío exitosa
- [ ] Monitoreo de emails configurado
- [ ] Rate limiting configurado

---

## 📚 Recursos Adicionales

- [Documentación de Nodemailer](https://nodemailer.com/)
- [Configuración SMTP de Gmail](https://support.google.com/mail/answer/7126229)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)

---

**Última actualización**: 2024

