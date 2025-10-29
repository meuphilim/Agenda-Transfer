CREATE POLICY "Allow authenticated users to insert company profile" ON company_profile
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update company profile" ON company_profile
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
