-- Renomeia a coluna 'valor_diaria' em 'packages' para 'valor_diaria_servico'
ALTER TABLE public.packages
RENAME COLUMN valor_diaria TO valor_diaria_servico;

-- Adiciona comentários para esclarecer o propósito dos campos financeiros
COMMENT ON COLUMN public.packages.valor_diaria_servico IS 'Valor da diária de serviço cobrada do cliente (RECEITA)';
COMMENT ON COLUMN public.packages.considerar_diaria_motorista IS 'Se TRUE, inclui o custo da diária do motorista nos custos do pacote (DESPESA)';

-- Garante que a coluna 'valor_diaria_motorista' exista na tabela 'drivers' e adiciona um comentário
-- A verificação da existência da coluna é feita de forma idempotente para evitar erros em execuções repetidas.
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='valor_diaria_motorista') THEN
    ALTER TABLE public.drivers ADD COLUMN valor_diaria_motorista DECIMAL(10, 2) DEFAULT 150.00;
  END IF;
END $$;

COMMENT ON COLUMN public.drivers.valor_diaria_motorista IS 'Valor da diária paga ao motorista por dia de trabalho (DESPESA/CUSTO)';