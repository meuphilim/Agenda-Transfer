#!/bin/bash

# Este script remove arquivos de código-fonte identificados como não utilizados (mortos)
# ou desnecessários (backups, testes órfãos) durante a auditoria do projeto.
# Execute este script da raiz do repositório.

# Cores para o output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando a remoção de código morto...${NC}"

# Lista de arquivos a serem removidos
files_to_remove=(
  "src/components/Auth/AccountSetup.tsx"
  "src/components/Debug/SessionDebug.tsx"
  "src/contexts/DataContext.tsx"
  "src/hooks/useCachedQuery.ts"
  "src/hooks/useSessionHeartbeat.ts"
  "src/hooks/useSessionMonitor.ts"
  "src/utils/messageFormat.ts.bak"
  "src/utils/supabaseSync.ts"
  "src/utils/testAccountSetup.ts"
)

# Loop para remover cada arquivo
for file in "${files_to_remove[@]}"; do
  if [ -f "$file" ]; then
    echo "Removendo $file..."
    rm "$file"
    echo -e "${GREEN}Arquivo $file removido com sucesso.${NC}"
  else
    echo "Arquivo $file não encontrado (pode já ter sido removido)."
  fi
done

echo -e "${GREEN}Limpeza de código morto concluída!${NC}"
echo -e "${YELLOW}AVISO: Lembre-se de remover as importações e usos desses arquivos (ex: DataProvider em App.tsx) e de ajustar os arquivos de configuração (tsconfig) conforme o relatório de auditoria.${NC}"