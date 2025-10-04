-- Adiciona o campo client_name na tabela packages
ALTER TABLE packages ADD COLUMN IF NOT EXISTS client_name text;

-- Atualiza registros existentes
UPDATE packages SET client_name = 'Cliente não informado' WHERE client_name IS NULL;