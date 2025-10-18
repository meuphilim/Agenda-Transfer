-- Migration: Adicionar campos financeiros
-- Criado em: 2025-10-16
-- Descrição: Adiciona campos para controle financeiro de pacotes

-- 1. Adicionar valor_net à tabela attractions
ALTER TABLE public.attractions
ADD COLUMN valor_net DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.attractions.valor_net IS 'Valor NET do atrativo para cálculo de fechamento';

-- 2. Adicionar considerar_valor_net à tabela package_activities
-- 2. Adicionar considerar_valor_net à tabela package_attractions
ALTER TABLE public.package_attractions
ADD COLUMN considerar_valor_net BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN public.package_attractions.considerar_valor_net IS 'Flag para incluir valor NET do atrativo no fechamento';

-- 3. Adicionar valor_diaria à tabela drivers
ALTER TABLE public.drivers
ADD COLUMN valor_diaria DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.drivers.valor_diaria IS 'Valor da diária pago ao motorista';

-- 4. Adicionar considerar_diaria_motorista à tabela packages
ALTER TABLE public.packages
ADD COLUMN considerar_diaria_motorista BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN public.packages.considerar_diaria_motorista IS 'Flag para incluir diária do motorista no fechamento';

-- Índices (opcional, para performance em queries futuras)
CREATE INDEX IF NOT EXISTS idx_attractions_valor_net ON public.attractions(valor_net);
CREATE INDEX IF NOT EXISTS idx_drivers_valor_diaria ON public.drivers(valor_diaria);
CREATE INDEX IF NOT EXISTS idx_package_attractions_considerar_valor ON public.package_attractions(considerar_valor_net);
CREATE INDEX IF NOT EXISTS idx_packages_considerar_diaria ON public.packages(considerar_diaria_motorista);

-- Rollback (exemplo, não faz parte da execução UP)
-- Para reverter, execute o seguinte:
/*
-- Remover índices
DROP INDEX IF EXISTS public.idx_packages_considerar_diaria;
DROP INDEX IF EXISTS public.idx_package_attractions_considerar_valor;
DROP INDEX IF EXISTS public.idx_drivers_valor_diaria;
DROP INDEX IF EXISTS public.idx_attractions_valor_net;

-- Remover colunas
ALTER TABLE public.packages DROP COLUMN IF EXISTS considerar_diaria_motorista;
ALTER TABLE public.drivers DROP COLUMN IF EXISTS valor_diaria;
ALTER TABLE public.package_attractions DROP COLUMN IF EXISTS considerar_valor_net;
ALTER TABLE public.attractions DROP COLUMN IF EXISTS valor_net;
*/