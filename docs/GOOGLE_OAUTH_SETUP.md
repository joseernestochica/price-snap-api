# Configuración de Google OAuth - Guía Paso a Paso

Esta guía te ayudará a configurar el login con Google desde cero.

## 📋 Requisitos Previos

- Una cuenta de Google (Gmail)
- Acceso a internet
- Tu aplicación corriendo en `http://localhost:3006`

## 🚀 Pasos para Configurar Google OAuth

### Paso 1: Crear un Proyecto en Google Cloud Console

1. **Abre Google Cloud Console**
   - Ve a: https://console.cloud.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear un nuevo proyecto**
   - Haz clic en el selector de proyectos (arriba a la izquierda, junto al logo de Google Cloud)
   - Haz clic en "NUEVO PROYECTO"
   - Nombre del proyecto: `PriceSnap` (o el nombre que prefieras)
   - Organización: Déjalo como está (o selecciona una si tienes)
   - Haz clic en "CREAR"
   - Espera unos segundos mientras se crea el proyecto

3. **Seleccionar el proyecto**
   - Una vez creado, selecciona el proyecto desde el selector de proyectos

### Paso 2: Habilitar la API de Google OAuth

1. **Ir a la página de APIs**
   - En el menú lateral izquierdo, ve a "APIs y servicios" > "Biblioteca"
   - O ve directamente a: https://console.cloud.google.com/apis/library

2. **Buscar y habilitar Google+ API**
   - En el buscador, escribe: "Google+ API"
   - Haz clic en "Google+ API"
   - Haz clic en el botón "HABILITAR"
   - Espera a que se habilite (puede tardar unos segundos)

3. **Nota sobre Google Identity**
   - ⚠️ **IMPORTANTE**: No es necesario buscar "Google Identity" específicamente
   - Las APIs necesarias para OAuth 2.0 se habilitan automáticamente cuando creas las credenciales
   - Si no encuentras "Google Identity", no te preocupes, puedes continuar con el siguiente paso
   - (Opcional) Si quieres buscarla, puede aparecer como "Google Identity Platform API" o simplemente no estar disponible en tu región/proyecto

### Paso 3: Configurar Google Auth Platform

1. **Ir a Google Auth Platform**
   - En el menú lateral izquierdo, busca y haz clic en "Google Auth Platform"
   - O ve directamente a: https://console.cloud.google.com/apis/credentials/consent
   - Verás la página "Descripción general de OAuth"

2. **Iniciar la configuración**
   - Haz clic en el botón azul "Comenzar" (Get started) que aparece en el centro de la pantalla
   - Esto iniciará el proceso de configuración

3. **Seleccionar el tipo de aplicación**
   - Te preguntará si quieres crear una aplicación externa o interna
   - Selecciona **"Externo"** (para desarrollo y permitir que usuarios externos hagan login)
   - Haz clic en "CREAR"

4. **Completar la información de la aplicación**
   - **Nombre de la aplicación**: `PriceSnap` (o el nombre que prefieras)
   - **Correo electrónico de asistencia al usuario**: Tu email de Gmail
   - **Logo de la aplicación**: (Opcional) Puedes subir un logo si tienes uno
   - **Dominio de inicio de la aplicación**: Déjalo vacío por ahora
   - **Dominios autorizados**: Déjalo vacío por ahora
   - **Correo electrónico del desarrollador**: Tu email de Gmail
   - Haz clic en "GUARDAR Y CONTINUAR"

5. **Configurar los alcances (Scopes)**
   - Haz clic en "AGREGAR O QUITAR ALCANCES"
   - Busca y selecciona:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Haz clic en "ACTUALIZAR" y luego "GUARDAR Y CONTINUAR"

6. **Agregar usuarios de prueba (IMPORTANTE para desarrollo)**
   - En "Usuarios de prueba", haz clic en "AGREGAR USUARIOS"
   - Agrega tu email de Gmail (el que usarás para hacer login)
   - Haz clic en "AGREGAR"
   - Haz clic en "GUARDAR Y CONTINUAR"

7. **Revisar y finalizar**
   - Revisa la información
   - Haz clic en "VOLVER AL PANEL" o "GUARDAR Y CONTINUAR"

**Nota**: Si ya estás en la página de "Google Auth Platform" y ves el botón "Comenzar", simplemente haz clic en él para iniciar el proceso. Si no ves ese botón y ya tienes configuración previa, ve directamente al Paso 4 para crear las credenciales.

### Paso 4: Crear las Credenciales OAuth 2.0 (Cliente de OAuth)

Tienes dos opciones para crear el cliente de OAuth:

**Opción A: Desde la página de descripción general**
1. En la sección "Métricas", verás un mensaje que dice "Aún no configuraste ningún cliente de OAuth"
2. Haz clic en el botón gris "Crear cliente de OAuth" que aparece a la derecha del mensaje

**Opción B: Desde el menú lateral**
1. En el menú lateral izquierdo, haz clic en "Clientes" (debajo de "Google Auth Platform")
2. Haz clic en el botón "+ CREAR CLIENTE" o "+ CREAR" (arriba a la izquierda)

**Configurar el cliente de OAuth:**

1. **Tipo de aplicación**
   - Selecciona "Aplicación web"
   - Haz clic en "CREAR"

2. **Configurar el ID de cliente**
   - **Nombre**: `PriceSnap Web Client` (o el nombre que prefieras)
   
   - **Orígenes autorizados de JavaScript** (opcional, pero recomendado):
     - Este campo es para el origen sin ruta
     - Haz clic en "+ Agregar URI"
     - Agrega solo: `http://localhost:3006`
     - ⚠️ **IMPORTANTE**: Solo el origen (protocolo + dominio + puerto), SIN la ruta `/api/auth/google/callback`
   
   - **URIs de redireccionamiento autorizados** (OBLIGATORIO):
     - Este campo es para la URI completa con la ruta
     - Haz clic en "+ Agregar URI"
     - Agrega exactamente: `http://localhost:3006/api/auth/google/callback`
     - ⚠️ **IMPORTANTE**: 
       - Debe ser exactamente esta URI completa, sin trailing slash (`/` al final)
       - Debe incluir el puerto `3006`
       - Debe usar `http://` (no `https://` en desarrollo)
       - Debe incluir la ruta completa `/api/auth/google/callback`
   
   - Haz clic en "CREAR" o "GUARDAR"

3. **Copiar las credenciales**
   - Se mostrará un modal o página con:
     - **ID de cliente**: Copia este valor completo (algo como: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
     - **Secreto de cliente**: Copia este valor completo (algo como: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)
   - ⚠️ **IMPORTANTE**: 
     - Guarda estos valores de forma segura
     - El secreto de cliente solo se muestra UNA VEZ
     - Si lo pierdes, tendrás que crear un nuevo cliente
   - Haz clic en "LISTO" o "CERRAR" cuando hayas copiado ambos valores

### Paso 5: Configurar las Variables de Entorno

1. **Abrir el archivo de entorno**
   - Abre el archivo `env.development` en la raíz del proyecto

2. **Actualizar las variables de Google OAuth**
   ```env
   OAUTH_GOOGLE_CLIENT_ID=tu-id-de-cliente-aqui
   OAUTH_GOOGLE_CLIENT_SECRET=tu-secreto-de-cliente-aqui
   OAUTH_GOOGLE_REDIRECT_URI=http://localhost:3006/api/auth/google/callback
   ```

3. **Reemplazar los valores**
   - Reemplaza `tu-id-de-cliente-aqui` con el **ID de cliente** que copiaste
   - Reemplaza `tu-secreto-de-cliente-aqui` con el **Secreto de cliente** que copiaste
   - La `OAUTH_GOOGLE_REDIRECT_URI` ya está correcta, no la cambies

4. **Guardar el archivo**

### Paso 6: Reiniciar el Servidor

1. **Detener el servidor** (si está corriendo)
   - Presiona `Ctrl + C` en la terminal

2. **Iniciar el servidor nuevamente**
   ```bash
   npm run start:dev
   # o
   yarn start:dev
   ```

3. **Verificar la configuración**
   - En la consola del servidor, cuando inicies el login con Google, deberías ver:
     ```
     🔐 Google OAuth Configuration:
       - Client ID: tu-client-id...
       - Redirect URI: http://localhost:3006/api/auth/google/callback
     ```

### Paso 7: Probar el Login

1. **Abrir el endpoint de inicio**
   - Ve a: `http://localhost:3006/api/auth/google`
   - O con parámetro de redirección: `http://localhost:3006/api/auth/google?redirect_uri=http://localhost:4210/auth/callback`

2. **Deberías ser redirigido a Google**
   - Verás la pantalla de consentimiento de Google
   - Selecciona tu cuenta
   - Acepta los permisos

3. **Verificar el callback**
   - Después de aceptar, serás redirigido de vuelta a tu aplicación
   - Deberías recibir las cookies de autenticación

## 🔧 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: La URI de redirección no coincide exactamente con la configurada en Google Cloud Console.

**Solución**:
1. Verifica que en Google Cloud Console, en "URI de redirección autorizadas", tengas exactamente:
   ```
   http://localhost:3006/api/auth/google/callback
   ```
2. Verifica que en `env.development` tengas:
   ```env
   OAUTH_GOOGLE_REDIRECT_URI=http://localhost:3006/api/auth/google/callback
   ```
3. Asegúrate de que no haya espacios extra o caracteres especiales
4. Reinicia el servidor después de cambiar las variables de entorno

### Error: "Access blocked: This app's request is invalid"

**Causa**: La aplicación está en modo de prueba y tu email no está en la lista de usuarios de prueba.

**Solución**:
1. Ve a "Pantalla de consentimiento de OAuth" en Google Cloud Console
2. En "Usuarios de prueba", agrega tu email de Gmail
3. Espera unos minutos y vuelve a intentar

### Error: "Invalid client"

**Causa**: El Client ID o Client Secret son incorrectos.

**Solución**:
1. Verifica que copiaste correctamente el Client ID y Client Secret
2. Asegúrate de que no haya espacios extra en las variables de entorno
3. Verifica que el archivo `.env` o `env.development` esté siendo cargado correctamente

### El servidor no muestra los logs de configuración

**Causa**: Las variables de entorno no están cargadas correctamente.

**Solución**:
1. Verifica que el archivo se llama `env.development` o `.env`
2. Verifica que el archivo está en la raíz del proyecto (mismo nivel que `package.json`)
3. Reinicia el servidor completamente

## 📝 Notas Importantes

1. **Modo de Prueba**: Tu aplicación estará en "modo de prueba" hasta que la publiques. En modo de prueba, solo los usuarios agregados en "Usuarios de prueba" pueden hacer login.

2. **Producción**: Para producción, necesitarás:
   - Cambiar el tipo de usuario a "Interno" o publicar la aplicación
   - Agregar la URI de producción en "URI de redirección autorizadas"
   - Actualizar las variables de entorno con las URIs de producción

3. **Seguridad**: 
   - Nunca compartas tu Client Secret públicamente
   - No subas el archivo `.env` a repositorios públicos
   - Usa variables de entorno diferentes para desarrollo y producción

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] APIs habilitadas (Google+ API y Google Identity)
- [ ] Pantalla de consentimiento configurada
- [ ] Usuarios de prueba agregados
- [ ] Credenciales OAuth 2.0 creadas
- [ ] URI de redirección configurada en Google Cloud Console
- [ ] Variables de entorno actualizadas en `env.development`
- [ ] Servidor reiniciado
- [ ] Login probado exitosamente

## 🆘 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún tienes problemas:

1. Verifica los logs del servidor para ver qué URI se está usando
2. Revisa la consola del navegador para ver errores específicos
3. Verifica que todas las URIs coincidan exactamente (sin espacios, sin trailing slash)

