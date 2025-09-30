-- Adiciona as colunas category e ear na tabela drivers
ALTER TABLE drivers
ADD COLUMN category text NOT NULL DEFAULT 'B' CHECK (category IN ('A', 'B', 'C', 'D', 'E', 'AB')),
ADD COLUMN ear boolean NOT NULL DEFAULT false;

-- Atualiza os registros existentes com valores padrão
UPDATE drivers SET category = 'B', ear = false WHERE category IS NULL;

-- Adiciona comentários nas colunas para documentação
COMMENT ON COLUMN drivers.category IS 'Categoria da CNH do motorista (A, B, C, D, E, AB)';
COMMENT ON COLUMN drivers.ear IS 'Indica se o motorista possui EAR (Exerce Atividade Remunerada)';

-- Atualiza os dados de exemplo com informações mais completas
UPDATE drivers SET 
  category = 'D', 
  ear = true 
WHERE name = 'Carlos Motorista';

UPDATE drivers SET 
  category = 'D', 
  ear = true 
WHERE name = 'Ana Condutora';

UPDATE drivers SET 
  category = 'E', 
  ear = true 
WHERE name = 'Roberto Silva';

UPDATE drivers SET 
  category = 'D', 
  ear = true 
WHERE name = 'Lucia Santos';