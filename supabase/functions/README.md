# Edge Functions - Guia de Deploy

Este projeto utiliza Supabase Edge Functions para operações administrativas seguras.

## Funções Disponíveis

### admin-users

Gerencia operações administrativas de usuários (listar, editar, deletar).

**Endpoint**: `{SUPABASE_URL}/functions/v1/admin-users`

**Autenticação**: Requer token JWT de usuário admin ativo

**Métodos Suportados**:
- `GET`: Lista todos os usuários com seus emails
- `PUT`: Atualiza dados de um usuário
- `DELETE`: Remove um usuário do sistema

## Deploy Manual

Não é necessário deploy manual. As Edge Functions são deployadas automaticamente pelo sistema Supabase MCP.

## Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente no ambiente das Edge Functions:

- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave pública do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave administrativa do Supabase

## Segurança

✅ **Validações Implementadas**:
1. Verificação de token JWT válido
2. Verificação de perfil de usuário admin
3. Verificação de status ativo do admin
4. Uso de service_role_key apenas no backend
5. CORS configurado para permitir requisições do frontend

## Testando Localmente

Para testar as funções localmente, você pode usar o curl:

```bash
# Listar usuários
curl -X GET \\
  {SUPABASE_URL}/functions/v1/admin-users \\
  -H "Authorization: Bearer {JWT_TOKEN}"

# Atualizar usuário
curl -X PUT \\
  {SUPABASE_URL}/functions/v1/admin-users \\
  -H "Authorization: Bearer {JWT_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "uuid", "updates": {"status": "active"}}'

# Deletar usuário
curl -X DELETE \\
  {SUPABASE_URL}/functions/v1/admin-users \\
  -H "Authorization: Bearer {JWT_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "uuid"}'
```

## Logs e Monitoramento

Os logs das Edge Functions podem ser visualizados no dashboard do Supabase em:
`Project > Edge Functions > Logs`

## Troubleshooting

### Erro 401: Unauthorized
- Verifique se o token JWT está sendo enviado corretamente no header Authorization
- Confirme que o usuário está autenticado

### Erro 403: Forbidden
- Verifique se o usuário tem privilégios de administrador (`is_admin = true`)
- Confirme que o status do usuário é `active`

### Erro 500: Internal Server Error
- Verifique os logs da função no dashboard do Supabase
- Confirme que as variáveis de ambiente estão configuradas corretamente
