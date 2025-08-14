#!/bin/bash

# Script de Deploy Automatizado para Loja Virtual
# Execute: chmod +x deploy-script.sh && ./deploy-script.sh

echo "🚀 Iniciando deploy da Loja Virtual..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto!"
    exit 1
fi

# 1. Backup do banco atual (se existir)
log "📦 Fazendo backup do banco de dados..."
if command -v pg_dump &> /dev/null; then
    DATE=$(date +%Y%m%d_%H%M%S)
    pg_dump -h localhost -U postgres loja_virtual > backup_$DATE.sql 2>/dev/null || warning "Não foi possível fazer backup do banco"
fi

# 2. Parar aplicação atual
log "⏹️ Parando aplicação atual..."
pm2 stop loja-virtual 2>/dev/null || warning "Aplicação não estava rodando"

# 3. Instalar/atualizar dependências
log "📦 Instalando dependências..."
npm install --production

# 4. Criar diretório de logs se não existir
log "📁 Criando diretório de logs..."
mkdir -p logs

# 5. Criar diretório de uploads se não existir
log "📁 Configurando diretório de uploads..."
mkdir -p public/uploads/products
chmod 755 public/uploads/products

# 6. Executar setup do banco
log "🗄️ Configurando banco de dados..."
node scripts/setup-database.js

# 7. Iniciar aplicação com PM2
log "🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js --env production

# 8. Salvar configuração do PM2
log "💾 Salvando configuração do PM2..."
pm2 save

# 9. Verificar status
log "📊 Verificando status da aplicação..."
pm2 status

# 10. Mostrar logs recentes
log "📋 Últimos logs da aplicação:"
pm2 logs loja-virtual --lines 10

echo ""
log "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Comandos úteis:"
echo "  - Ver logs: pm2 logs loja-virtual"
echo "  - Reiniciar: pm2 restart loja-virtual"
echo "  - Status: pm2 status"
echo "  - Monitor: pm2 monit"
echo ""
echo "🌐 Sua aplicação deve estar rodando em: http://localhost:3000"
echo ""
