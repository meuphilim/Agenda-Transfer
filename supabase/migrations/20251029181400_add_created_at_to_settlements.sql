-- Adiciona a coluna created_at à tabela settlements para rastrear as datas das transações com precisão.
ALTER TABLE public.settlements
ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

-- Preenche os registros existentes que podem não ter o valor padrão aplicado automaticamente.
UPDATE public.settlements SET created_at = NOW() WHERE created_at IS NULL;

-- Torna a coluna não nula para garantir a restrição no futuro.
ALTER TABLE public.settlements
ALTER COLUMN created_at SET NOT NULL;
