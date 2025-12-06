#!/bin/bash

# Script de instalación automática para scripts SQL iniciales con Docker - PriceSnap API
# Uso: ./scripts/install-sql-docker.sh [entorno]

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [ENTORNO]"
    echo ""
    echo "ENTORNO:"
    echo "  dev      - Desarrollo (docker-compose)"
    echo "  test     - Testing"
    echo "  prod     - Producción"
    echo ""
    echo "Ejemplos:"
    echo "  $0 dev"
    echo "  $0 test"
    echo "  $0 prod"
    echo ""
    echo "Sin parámetros para modo interactivo:"
    echo "  $0"
}

# Función para modo interactivo
interactive_mode() {
    print_message "Modo interactivo - Selecciona el entorno"
    echo ""
    
    echo "1) Desarrollo (docker-compose)"
    echo "2) Testing"
    echo "3) Producción"
    echo ""
    read -p "Selecciona una opción (1-3): " choice
    
    case $choice in
        1) ENVIRONMENT="dev" ;;
        2) ENVIRONMENT="test" ;;
        3) ENVIRONMENT="prod" ;;
        *) print_error "Opción inválida"; exit 1 ;;
    esac
}

# Función para configurar variables según entorno
setup_environment() {
    case $ENVIRONMENT in
        "dev")
            DB_HOST="localhost"
            DB_PORT="5434"
            DB_USER="${DB_USER:-pricesnap_user}"
            DB_NAME="${DB_NAME:-pricesnap_dev}"
            DB_PASSWORD="${DB_PASSWORD:-pricesnap_password}"
            CONTAINER_NAME="pricesnap_dev_db"
            print_message "Configurando entorno de desarrollo con Docker"
            ;;
        "test")
            DB_HOST="localhost"
            DB_PORT="5434"
            DB_USER="${TEST_DB_USER:-pricesnap_user}"
            DB_NAME="${TEST_DB_NAME:-pricesnap_test}"
            DB_PASSWORD="${TEST_DB_PASSWORD:-pricesnap_password}"
            CONTAINER_NAME="pricesnap_test_db"
            print_message "Configurando entorno de testing"
            ;;
        "prod")
            print_error "Para producción, configura manualmente las variables de entorno:"
            print_error "DB_HOST, DB_PORT, DB_USER, DB_NAME, DB_PASSWORD"
            exit 1
            ;;
        *)
            print_error "Entorno inválido: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Función para verificar Docker
check_docker() {
    print_message "Verificando Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado o no está en el PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado o no está en el PATH"
        exit 1
    fi
    
    print_success "Docker y Docker Compose disponibles"
}

# Función para verificar si el contenedor está corriendo
check_container() {
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        print_message "Verificando contenedor de base de datos..."
        
        if ! docker ps | grep -q "$CONTAINER_NAME"; then
            print_warning "El contenedor $CONTAINER_NAME no está corriendo"
            print_message "Iniciando servicios con docker-compose..."
            
            if docker-compose -f docker-compose.dev.yaml up -d db; then
                print_success "Contenedor iniciado correctamente"
                print_message "Esperando 10 segundos para que la base de datos esté lista..."
                sleep 10
            else
                print_error "Error al iniciar el contenedor"
                exit 1
            fi
        else
            print_success "Contenedor $CONTAINER_NAME está corriendo"
        fi
    fi
}

# Función para verificar conexión
check_connection() {
    print_message "Verificando conexión a la base de datos..."
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        # Usar docker exec para conectar al contenedor
        if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Conexión exitosa a $DB_NAME en Docker"
        else
            print_error "No se puede conectar a la base de datos en Docker"
            print_error "Verifica que el contenedor esté corriendo y las credenciales sean correctas"
            exit 1
        fi
    else
        # Para otros entornos, usar conexión directa
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "Conexión exitosa a $DB_NAME"
        else
            print_error "No se puede conectar a la base de datos"
            exit 1
        fi
    fi
}


# Función para instalar scripts SQL iniciales
install_sql() {
    print_message "Instalando scripts SQL iniciales..."
    
    local sql_file="sql/init/01_unaccent.sql"
    
    if [[ ! -f "$sql_file" ]]; then
        print_error "Archivo $sql_file no encontrado"
        print_error "Ejecuta este script desde la raíz del proyecto"
        exit 1
    fi
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        # Copiar archivo al contenedor y ejecutar
        docker cp "$sql_file" "$CONTAINER_NAME:/tmp/01_unaccent.sql"
        
        if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/01_unaccent.sql; then
            print_success "Scripts SQL instalados correctamente en Docker"
        else
            print_error "Error al instalar los scripts SQL en Docker"
            exit 1
        fi
    else
        # Para otros entornos, conexión directa
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"; then
            print_success "Scripts SQL instalados correctamente"
        else
            print_error "Error al instalar los scripts SQL"
            exit 1
        fi
    fi
}

# Función para verificar instalación
verify_installation() {
    print_message "Verificando instalación..."
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        # Verificar extensión unaccent
        local extension_exists=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM pg_extension WHERE extname = 'unaccent';
        " | tr -d ' ')
        
        # Verificar función immutable_unaccent
        local function_exists=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM pg_proc WHERE proname = 'immutable_unaccent';
        " | tr -d ' ')
    else
        # Verificar extensión unaccent
        local extension_exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM pg_extension WHERE extname = 'unaccent';
        " | tr -d ' ')
        
        # Verificar función immutable_unaccent
        local function_exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM pg_proc WHERE proname = 'immutable_unaccent';
        " | tr -d ' ')
    fi
    
    if [[ "$extension_exists" == "1" && "$function_exists" == "1" ]]; then
        print_success "Instalación verificada correctamente"
        
        # Mostrar información instalada
        echo ""
        print_message "Extensiones instaladas:"
        if [[ "$ENVIRONMENT" == "dev" ]]; then
            docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
                SELECT extname AS extension_name, extversion AS version
                FROM pg_extension 
                WHERE extname = 'unaccent';
            "
            echo ""
            print_message "Funciones instaladas:"
            docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
                SELECT 
                    proname AS function_name,
                    pg_get_function_identity_arguments(oid) AS arguments
                FROM pg_proc 
                WHERE proname = 'immutable_unaccent'
                ORDER BY proname;
            "
        else
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
                SELECT extname AS extension_name, extversion AS version
                FROM pg_extension 
                WHERE extname = 'unaccent';
            "
            echo ""
            print_message "Funciones instaladas:"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
                SELECT 
                    proname AS function_name,
                    pg_get_function_identity_arguments(oid) AS arguments
                FROM pg_proc 
                WHERE proname = 'immutable_unaccent'
                ORDER BY proname;
            "
        fi
    else
        print_error "No se encontraron las extensiones/funciones instaladas"
        print_error "Extensión unaccent: $extension_exists, Función immutable_unaccent: $function_exists"
        exit 1
    fi
}

# Función para mostrar información de uso
show_usage_info() {
    echo ""
    print_success "¡Instalación completada exitosamente!"
    echo ""
    print_message "Información de uso:"
    echo "  - Entorno: $ENVIRONMENT"
    echo "  - Base de datos: $DB_NAME"
    echo "  - Usuario: $DB_USER"
    echo "  - Host: $DB_HOST"
    echo "  - Puerto: $DB_PORT"
    echo ""
    
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        print_message "Para conectarte a la base de datos Docker:"
        echo "  docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
        echo ""
        print_message "Para ejecutar comandos SQL desde el host:"
        echo "  docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \"SELECT * FROM products;\""
    else
        print_message "Para conectarte a la base de datos:"
        echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    fi
    
    echo ""
    print_message "Ejemplo de uso de la función immutable_unaccent:"
    echo "  SELECT * FROM users WHERE immutable_unaccent(full_name) ILIKE immutable_unaccent('%búsqueda%');"
    echo ""
    print_message "Documentación completa en: sql/README.md"
}

# Función principal
main() {
    echo "=========================================="
    echo "  Instalador SQL Inicial - PriceSnap API"
    echo "=========================================="
    echo ""
    
    # Verificar si se pasaron parámetros
    if [[ $# -eq 0 ]]; then
        interactive_mode
    else
        ENVIRONMENT="$1"
    fi
    
    setup_environment
    check_docker
    check_container
    check_connection
    install_sql
    verify_installation
    show_usage_info
}

# Ejecutar función principal
main "$@"
