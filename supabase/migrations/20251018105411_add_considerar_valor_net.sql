-- Adicionar coluna considerar_valor_net à tabela package_attractions
ALTER TABLE package_attractions
ADD COLUMN considerar_valor_net BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN package_attractions.considerar_valor_net IS 'Flag para incluir valor NET do atrativo no fechamento financeiro';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_package_attractions_valor_net
ON package_attractions(considerar_valor_net);