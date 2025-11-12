#!/bin/bash

# Script de Deploy da Função Balance Sync
# Este script automatiza o processo de build e preparação para deploy

set -e  # Exit on error

echo "🚀 Balance Sync Function - Deploy Script"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado. Execute este script de dentro da pasta functions/balance-sync/"
    exit 1
fi

print_info "Verificando dependências..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado. Instale Node.js 20.x ou superior."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js versão $NODE_VERSION detectada. Recomendado: 20.x ou superior"
fi

print_success "Node.js $(node -v) detectado"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm não está instalado."
    exit 1
fi

print_success "npm $(npm -v) detectado"

# Limpar builds anteriores
print_info "Limpando builds anteriores..."
rm -rf dist/
rm -f balance-sync.tar.gz
print_success "Limpeza concluída"

# Instalar dependências
print_info "Instalando dependências..."
npm install
print_success "Dependências instaladas"

# Build TypeScript
print_info "Compilando TypeScript..."
npm run build
print_success "Build concluído"

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    print_error "Build falhou. Diretório dist/ não foi criado."
    exit 1
fi

# Criar arquivo tar.gz para deploy
print_info "Criando arquivo de deploy..."
# Incluir apenas os arquivos necessários na raiz do tar.gz
tar -czf balance-sync.tar.gz src/ package.json tsconfig.json
print_success "Arquivo balance-sync.tar.gz criado"

# Verificar tamanho do arquivo
FILE_SIZE=$(du -h balance-sync.tar.gz | cut -f1)
print_info "Tamanho do arquivo: $FILE_SIZE"

# Verificar se Appwrite CLI está instalado
if command -v appwrite &> /dev/null; then
    print_success "Appwrite CLI detectado"
    echo ""
    print_info "Você pode fazer deploy usando:"
    echo "  1. Appwrite Console (Manual): Faça upload de balance-sync.tar.gz"
    echo "  2. Appwrite CLI: appwrite deploy function"
    echo ""
    read -p "Deseja fazer deploy via CLI agora? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Iniciando deploy via CLI..."
        appwrite deploy function
        print_success "Deploy concluído!"
    else
        print_info "Deploy cancelado. Faça upload manual de balance-sync.tar.gz no Appwrite Console."
    fi
else
    print_warning "Appwrite CLI não detectado"
    echo ""
    print_info "Para fazer deploy:"
    echo "  1. Acesse o Appwrite Console"
    echo "  2. Vá em Functions > Balance Sync > Deployments"
    echo "  3. Faça upload do arquivo balance-sync.tar.gz"
    echo ""
    print_info "Ou instale o Appwrite CLI:"
    echo "  npm install -g appwrite-cli"
fi

echo ""
print_success "Preparação para deploy concluída!"
echo ""
print_info "Próximos passos:"
echo "  1. Configure as variáveis de ambiente no Appwrite Console"
echo "  2. Configure os triggers (eventos e schedule)"
echo "  3. Teste a função após o deploy"
echo ""
print_info "Consulte DEPLOYMENT.md para instruções detalhadas"
