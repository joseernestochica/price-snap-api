# PriceSnap API - Bruno Requests

Esta colección contiene todos los endpoints de la API de PriceSnap para ser probados con Bruno.

## 📁 Estructura

```
requests/
├── bruno.json                    # Configuración de la colección
├── environments/                 # Entornos de desarrollo y producción
│   ├── Development.bru
│   └── Production.bru
├── Auth/                        # Endpoints de autenticación
│   ├── folder.bru               # Descripción de la colección Auth
│   ├── Registrar usuario.bru    # POST /api/auth/register
│   ├── Login usuario.bru        # POST /api/auth/login
│   ├── Check estado del token.bru # GET /api/auth/check-status
│   ├── Obtener perfil de usuario.bru # GET /api/auth/user
│   ├── Actualizar perfil de usuario.bru # PATCH /api/auth/user
│   ├── Refresh token.bru        # POST /api/auth/refresh-token
│   ├── Listar usuarios (Admin).bru # GET /api/auth/users
│   ├── Obtener usuario por ID (Admin).bru # GET /api/auth/user-admin/:id
│   ├── Actualizar usuario por ID (Admin).bru # PATCH /api/auth/user-admin/:id
│   ├── Eliminar usuario (Admin).bru # DELETE /api/auth/user/:id
│   ├── Eliminar refresh token.bru # DELETE /api/auth/refresh-token/:id/:token
│   ├── Obtener usuarios por IDs (Admin).bru # POST /api/auth/users/by-ids
│   ├── Login con Google - Iniciar.bru # GET /api/auth/google
│   ├── Login con Google - Callback.bru # GET /api/auth/google/callback
│   ├── Google - Exchange Cookie.bru # POST /api/auth/google/exchange-cookie
│   ├── Google - Clear Cookies.bru # POST /api/auth/google/clear-cookies
│   ├── Test Admin - Obtener perfil.bru # Test con tokenAdmin
│   ├── Test User - Obtener perfil.bru # Test con tokenUser
│   ├── Test User - Intentar Admin (Debería fallar).bru # Test de permisos
│   └── Ruta privada - Test.bru # Test de endpoint admin
├── Seed/                        # Endpoints de seed (datos de prueba)
│   ├── folder.bru               # Descripción de la colección Seed
│   └── Insertar usuarios de prueba.bru # POST /api/seed/users
├── File/                        # Endpoints de archivos (usuario)
│   ├── folder.bru               # Descripción de la colección File
│   ├── User-Get-Image.bru       # GET /api/file/user/:imageName/:id
│   ├── User-Upload-Images.bru   # POST /api/file/user/:id
│   └── User-Delete-Images.bru   # DELETE /api/file/user/:id
├── Mail/                        # Endpoints de envío de emails
│   ├── folder.bru               # Descripción de la colección Mail
│   └── Enviar email.bru         # POST /api/mail/send
└── Test/                        # Usuarios de prueba
    ├── folder.bru
    ├── Crear Usuario Admin.bru
    └── Crear Usuario Normal.bru
```

## 🚀 Cómo usar

### 1. Instalar Bruno
```bash
npm install -g @usebruno/cli
```

### 2. Abrir la colección
```bash
cd /Users/ernestochicadelatorre/Documents/APPs/PriceSnap/api/requests
bruno
```

### 3. Configurar entorno
- Seleccionar "Development" en el selector de entorno
- Verificar que `base_url` apunte a `http://localhost:3006/api`

### 4. Flujo de pruebas recomendado

#### Configuración inicial (Test/):
1. **Crear Usuario Admin** - Crear usuario administrador y obtener tokenAdmin
2. **Crear Usuario Normal** - Crear usuario normal y obtener tokenUser

#### Pruebas básicas:
3. **Test Admin - Obtener perfil** - Verificar tokenAdmin funciona
4. **Test User - Obtener perfil** - Verificar tokenUser funciona
5. **Test User - Intentar Admin** - Verificar que usuario normal no puede acceder a admin

#### Funcionalidades completas:
6. **Registrar usuario** - Crear usuarios adicionales
7. **Login usuario** - Iniciar sesión con credenciales
8. **Check estado del token** - Verificar estado de autenticación
9. **Obtener perfil de usuario** - Verificar autenticación
10. **Actualizar perfil de usuario** - Modificar información del perfil
11. **Refresh token** - Renovar tokens
12. **Listar usuarios (Admin)** - Endpoint solo para administradores y expertos
13. **Obtener usuario por ID (Admin)** - Obtener usuario específico
14. **Actualizar usuario por ID (Admin)** - Actualizar usuario específico
15. **Eliminar usuario (Admin)** - Soft delete de usuario
16. **Eliminar refresh token** - Eliminar token específico
17. **Obtener usuarios por IDs (Admin)** - Obtener múltiples usuarios

#### Google OAuth:
18. **Login con Google - Iniciar** - Iniciar flujo OAuth
19. **Google - Exchange Cookie** - Intercambiar cookies por tokens
20. **Google - Clear Cookies** - Limpiar cookies

#### Seed (datos de prueba):
21. **Insertar usuarios de prueba** - Inserta 30 usuarios de prueba en la base de datos

#### Mail (envío de emails):
22. **Enviar email** - Envía un email usando el servicio SMTP configurado (requiere rol admin)

## 🔧 Variables de entorno

### Development
- `base_url`: http://localhost:3006/api
- `accessToken`: Token temporal de acceso
- `refreshToken`: Token temporal de renovación
- `tokenAdmin`: Token permanente del usuario administrador
- `tokenUser`: Token permanente del usuario normal
- `userId`: ID del usuario para pruebas
- `userId1`: ID del primer usuario para pruebas múltiples
- `userId2`: ID del segundo usuario para pruebas múltiples
- `refreshTokenId`: ID del refresh token para eliminación
- `appRedirect`: http://localhost:4200/auth/callback

### Production
- `base_url`: https://api.pricesnap.dev
- `accessToken`: Se llena automáticamente después del login
- `refreshToken`: Se llena automáticamente después del login
- `tokenAdmin`: Token permanente del usuario administrador
- `tokenUser`: Token permanente del usuario normal
- `userId`: ID del usuario para pruebas
- `userId1`: ID del primer usuario para pruebas múltiples
- `userId2`: ID del segundo usuario para pruebas múltiples
- `refreshTokenId`: ID del refresh token para eliminación
- `appRedirect`: https://pricesnap.dev/auth/callback

## 📝 Notas importantes

- Los tokens se almacenan automáticamente en las variables de entorno después de login/registro
- Para Google OAuth, el flujo completo requiere un navegador web
- Todas las rutas protegidas requieren Bearer token en el header Authorization
- Los endpoints siguen el patrón REST estándar
- Las respuestas utilizan la estructura GetResponse<T> con data, message, statusCode
- Los endpoints de administración requieren roles 'admin' o 'expert'
- El endpoint de envío de email requiere rol 'admin'
- El directorio Test/ contiene archivos para crear usuarios de prueba
- Los usuarios se eliminan con soft delete (marcados como eliminados)
- Los refresh tokens tienen expiración de 7 días

## 🐛 Troubleshooting

### Puerto ocupado
```bash
lsof -i :3006
kill <PID>
```

### Base de datos no conecta
```bash
cd /Users/ernestochicadelatorre/Documents/APPs/PriceSnap/api
docker compose -f docker-compose.dev.yaml up -d
```

### Variables de entorno faltantes
Verificar que el archivo `.env` tenga todas las variables necesarias:
- `ENCRYPT_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OAUTH_GOOGLE_CLIENT_ID`
- `OAUTH_GOOGLE_CLIENT_SECRET`
- `OAUTH_GOOGLE_REDIRECT_URI`
