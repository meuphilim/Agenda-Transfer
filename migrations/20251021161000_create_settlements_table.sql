-- Cria a tabela para registrar os fechamentos de período por agência
CREATE TABLE public.settlements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  agency_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  settled_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT settlements_pkey PRIMARY KEY (id),
  CONSTRAINT settlements_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Habilita Row Level Security
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Cria políticas de acesso para permitir leitura para usuários autenticados
-- e inserção apenas para administradores (ou a role de serviço)
CREATE POLICY "Allow read access to authenticated users" ON public.settlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for service_role" ON public.settlements FOR INSERT TO service_role WITH CHECK (true);
