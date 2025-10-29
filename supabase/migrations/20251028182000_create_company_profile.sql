CREATE TABLE company_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    cnpj TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read company profile" ON company_profile
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service_role to manage company profile" ON company_profile
FOR ALL
TO service_role
USING (true);
