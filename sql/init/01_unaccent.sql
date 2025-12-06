-- Habilitar extensión unaccent (idempotente)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Función inmutable para poder indexar expresiones con unaccent
-- Esta función es necesaria porque la función unaccent() nativa de PostgreSQL
-- es VOLATILE, lo que impide usarla directamente en índices funcionales.
-- Al crear una función IMMUTABLE wrapper, podemos usarla en índices.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT unaccent($1) $$;


