-- Permitir que a coluna agency_id na tabela packages aceite valores nulos
-- para suportar a funcionalidade de "Venda Direta".
ALTER TABLE public.packages
ALTER COLUMN agency_id DROP NOT NULL;
