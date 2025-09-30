-- Atualizar o perfil do usuário administrador
UPDATE profiles 
SET 
    full_name = 'Celso Lima Cavalheiro',
    phone = '67 99262-4818',
    is_admin = true,
    status = 'active'
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'meuphilim@gmail.com'
);