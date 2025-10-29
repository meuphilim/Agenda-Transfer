-- Adiciona colunas detalhadas à tabela company_profile para abranger todas as novas informações do perfil da empresa.

ALTER TABLE public.company_profile
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS state_registration TEXT,
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state VARCHAR(2),
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS fleet_size INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_types TEXT,
  ADD COLUMN IF NOT EXISTS total_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS licenses TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS responsible_name TEXT,
  ADD COLUMN IF NOT EXISTS responsible_cpf TEXT,
  ADD COLUMN IF NOT EXISTS responsible_role TEXT,
  ADD COLUMN IF NOT EXISTS responsible_phone TEXT,
  ADD COLUMN IF NOT EXISTS bank_details TEXT,
  ADD COLUMN IF NOT EXISTS billing_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT;

-- Nota: As políticas de RLS existentes para 'authenticated' (SELECT, INSERT, UPDATE)
-- já permitem o acesso a nível de linha ('row').
-- Portanto, as novas colunas são automaticamente incluídas nessas políticas
-- sem a necessidade de especificar cada coluna individualmente.
-- A segurança está garantida pela política a nível de linha.
