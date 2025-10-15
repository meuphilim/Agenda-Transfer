#!/bin/bash

# Este script remove as pastas node_modules e dist para limpar o ambiente de desenvolvimento.

# Cores para o output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando limpeza do projeto...${NC}"

# Verifica e remove a pasta node_modules
if [ -d "node_modules" ]; then
  echo "Removendo node_modules..."
  rm -rf node_modules
  echo -e "${GREEN}Pasta node_modules removida com sucesso.${NC}"
else
  echo "Pasta node_modules não encontrada."
fi

# Verifica e remove a pasta dist
if [ -d "dist" ]; then
  echo "Removendo dist..."
  rm -rf dist
  echo -e "${GREEN}Pasta dist removida com sucesso.${NC}"
else
  echo "Pasta dist não encontrada."
fi

echo -e "${GREEN}Limpeza concluída!${NC}"