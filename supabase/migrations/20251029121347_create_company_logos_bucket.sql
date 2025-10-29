-- 1. Cria o bucket 'company-logos' com as restrições necessárias
-- A cláusula ON CONFLICT garante que o script pode ser executado várias vezes sem erro,
-- tornando-o idempotente.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152, -- Limite de 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Define as políticas de segurança (RLS) para o bucket

-- Política de Leitura (SELECT): Permite que qualquer pessoa (público) visualize os logos.
-- A cláusula `IF EXISTS` previne erros se a política não existir ao tentar removê-la.
DROP POLICY IF EXISTS "Public read access for company logos" ON storage.objects;
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Política de Escrita (INSERT): Permite que usuários autenticados façam upload de logos.
DROP POLICY IF EXISTS "Authenticated insert for company logos" ON storage.objects;
CREATE POLICY "Authenticated insert for company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Política de Atualização (UPDATE): Permite que usuários autenticados atualizem logos.
-- Para este sistema de perfil único, a verificação do 'authenticated' role é suficiente.
DROP POLICY IF EXISTS "Authenticated update for company logos" ON storage.objects;
CREATE POLICY "Authenticated update for company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos');

-- Política de Remoção (DELETE): Permite que usuários autenticados removam logos.
DROP POLICY IF EXISTS "Authenticated delete for company logos" ON storage.objects;
CREATE POLICY "Authenticated delete for company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');
