-- Primeiro, garantir que o registro existe na tabela profiles
INSERT INTO profiles (id, full_name, phone, is_admin, status)
VALUES (
    'fd73d474-018d-4a27-b220-c948b91eed11',
    'Celso Lima Cavalheiro',
    '67 99262-4818',
    true,
    'active'
)
ON CONFLICT (id) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    is_admin = EXCLUDED.is_admin,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Garantir que o usuário está marcado como confirmado no auth.users
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11';