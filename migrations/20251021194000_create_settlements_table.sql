-- Cria a tabela para registrar os fechamentos de período por agência
CREATE TABLE public.settlements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  agency_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  settled_at timestamz DEFAULT now() NOT NULL,
  settled_by_user_id uuid NULL,
  details jsonb NULL,

  CONSTRAINT settlements_pkey PRIMARY KEY (id),
  CONSTRAINT settlements_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  CONSTRAINT settlements_settled_by_user_id_fkey FOREIGN KEY (settled_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.settlements IS 'Registra os fechamentos financeiros realizados para cada agência, marcando um período como pago.';
COMMENT ON COLUMN public.settlements.details IS 'Armazena um resumo dos valores e atividades incluídas no fechamento para fins de auditoria.';

-- Habilita Row Level Security
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Cria políticas de acesso
CREATE POLICY "Allow read access to authenticated users" ON public.settlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow full access for service_role" ON public.settlements FOR ALL TO service_role WITH CHECK (true);
