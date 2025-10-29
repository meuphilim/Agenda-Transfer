-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read company profile" ON company_profile;
DROP POLICY IF EXISTS "Allow service_role to manage company profile" ON company_profile;
DROP POLICY IF EXISTS "Allow authenticated users to insert company profile" ON company_profile;
DROP POLICY IF EXISTS "Allow authenticated users to update company profile" ON company_profile;

-- Create a new, unified policy for authenticated users
CREATE POLICY "Allow authenticated users to manage company profile"
ON company_profile
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
