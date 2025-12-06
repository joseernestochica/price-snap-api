# SQL: Instalación inicial

Este directorio contiene scripts SQL para la configuración inicial de la base de datos.

## Estructura

- `init/01_unaccent.sql`: Instala la extensión `unaccent` y crea la función `immutable_unaccent()` necesaria para búsquedas sin acentos.

## Instalación

### Opción 1: Script automático (recomendado)

```bash
# Desde la raíz del proyecto
./scripts/install-sql-docker.sh
```

O si prefieres especificar los parámetros manualmente:

```bash
./scripts/install-sql-docker.sh <usuario> <database>
```

### Opción 2: Manual con psql

```bash
# Desde la raíz del proyecto
psql -U <usuario> -d <database> -f sql/init/01_unaccent.sql
```

### Opción 3: Con Docker

Si estás usando Docker Compose:

```bash
# Ejecutar el script dentro del contenedor de PostgreSQL
docker-compose exec postgres psql -U <usuario> -d <database> -f /docker-entrypoint-initdb.d/init/01_unaccent.sql
```

O copiar el archivo al contenedor y ejecutarlo:

```bash
docker cp sql/init/01_unaccent.sql <container_name>:/tmp/
docker-compose exec postgres psql -U <usuario> -d <database> -f /tmp/01_unaccent.sql
```

## Qué hace este script

1. **Instala la extensión `unaccent`**: Permite realizar búsquedas insensibles a acentos en PostgreSQL.

2. **Crea la función `immutable_unaccent()`**: 
   - Wrapper inmutable de la función `unaccent()` nativa
   - Necesaria para poder crear índices funcionales con `unaccent`
   - La función nativa es `VOLATILE`, lo que impide usarla directamente en índices

## Uso en la aplicación

La función `immutable_unaccent()` se utiliza en las consultas de búsqueda para normalizar texto sin acentos:

```sql
SELECT * FROM users 
WHERE immutable_unaccent(full_name) ILIKE immutable_unaccent('%búsqueda%');
```

## Notas

- El script es idempotente: puede ejecutarse múltiples veces sin problemas
- La extensión `unaccent` requiere permisos de superusuario para instalarse
- Una vez instalada, cualquier usuario puede usar la función `immutable_unaccent()`
