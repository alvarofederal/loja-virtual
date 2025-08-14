# 🚀 Guia de Deploy - Loja Virtual no Hostinger

## 📋 Pré-requisitos

### 1. Conta Hostinger
- Plano que suporte Node.js (VPS ou Cloud)
- Acesso SSH ou cPanel

### 2. Banco de Dados
- PostgreSQL (recomendado) ou MySQL
- Credenciais de acesso

## 🔧 Passo 1: Preparar o Projeto

### 1.1 Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Servidor
NODE_ENV=production
PORT=3000
SESSION_SECRET=sua-chave-secreta-muito-segura

# Configurações do Banco de Dados
DB_HOST=seu-host-postgresql
DB_PORT=5432
DB_NAME=loja_virtual
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Configurações de Email (opcional)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app
```

### 1.2 Arquivos Necessários
Certifique-se de que estes arquivos estão na raiz:
- `package.json`
- `server.js`
- `config/database.js`
- `models/` (todos os modelos)
- `routes/` (todas as rotas)
- `views/` (todos os templates EJS)
- `public/` (arquivos estáticos)
- `middleware/` (middlewares)
- `scripts/setup-database.js`

## 🔧 Passo 2: Upload para o Hostinger

### Opção A: Via Git (Recomendado)

1. **Criar repositório Git:**
```bash
git init
git add .
git commit -m "Versão inicial para deploy"
git remote add origin https://github.com/seu-usuario/loja-virtual.git
git push -u origin main
```

2. **No Hostinger (SSH):**
```bash
# Conectar via SSH
ssh usuario@seu-servidor.com

# Navegar para o diretório
cd /home/usuario/public_html

# Clonar o repositório
git clone https://github.com/seu-usuario/loja-virtual.git

# Entrar no diretório
cd loja-virtual
```

### Opção B: Via cPanel File Manager

1. Acesse o cPanel
2. Abra o File Manager
3. Navegue até `public_html`
4. Faça upload de todos os arquivos do projeto

## 🔧 Passo 3: Configurar o Servidor

### 3.1 Instalar Dependências
```bash
# No diretório do projeto
npm install --production
```

### 3.2 Configurar Banco de Dados
```bash
# Executar script de setup
node scripts/setup-database.js
```

### 3.3 Configurar Process Manager (PM2)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name "loja-virtual"

# Configurar para iniciar com o servidor
pm2 startup
pm2 save
```

## 🔧 Passo 4: Configurar Proxy Reverso (Nginx)

### 4.1 Criar arquivo de configuração Nginx
```bash
sudo nano /etc/nginx/sites-available/loja-virtual
```

### 4.2 Conteúdo do arquivo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir arquivos estáticos
    location /public {
        alias /home/usuario/public_html/loja-virtual/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4.3 Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/loja-virtual /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Passo 5: Configurar SSL (HTTPS)

### 5.1 Via cPanel:
1. Acesse cPanel
2. Vá em "SSL/TLS"
3. Instale certificado Let's Encrypt

### 5.2 Via Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 🔧 Passo 6: Configurar Banco de Dados

### 6.1 Criar Banco PostgreSQL:
```sql
CREATE DATABASE loja_virtual;
CREATE USER loja_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE loja_virtual TO loja_user;
```

### 6.2 Executar Migrações:
```bash
node scripts/setup-database.js
```

## 🔧 Passo 7: Configurar Upload de Imagens

### 7.1 Criar diretório de uploads:
```bash
mkdir -p public/uploads/products
chmod 755 public/uploads/products
```

### 7.2 Configurar permissões:
```bash
chown -R www-data:www-data public/uploads
```

## 🔧 Passo 8: Configurar Logs

### 8.1 Configurar PM2 logs:
```bash
pm2 logs loja-virtual
```

### 8.2 Configurar Nginx logs:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔧 Passo 9: Configurar Backup

### 9.1 Backup do Banco:
```bash
# Criar script de backup
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U loja_user loja_virtual > backup_$DATE.sql
```

### 9.2 Backup dos Uploads:
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
```

## 🔧 Passo 10: Monitoramento

### 10.1 Status da Aplicação:
```bash
pm2 status
pm2 monit
```

### 10.2 Logs em Tempo Real:
```bash
pm2 logs loja-virtual --lines 100
```

## 🚨 Troubleshooting

### Problema: Aplicação não inicia
```bash
# Verificar logs
pm2 logs loja-virtual

# Verificar se a porta está em uso
netstat -tulpn | grep :3000

# Reiniciar aplicação
pm2 restart loja-virtual
```

### Problema: Banco não conecta
```bash
# Testar conexão
node -e "
import sequelize from './config/database.js';
sequelize.authenticate()
  .then(() => console.log('✅ Conectado'))
  .catch(err => console.error('❌ Erro:', err))
  .finally(() => process.exit());
"
```

### Problema: Uploads não funcionam
```bash
# Verificar permissões
ls -la public/uploads/

# Corrigir permissões
chmod -R 755 public/uploads/
chown -R www-data:www-data public/uploads/
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `pm2 logs loja-virtual`
2. Teste a conexão com o banco
3. Verifique as variáveis de ambiente
4. Consulte a documentação do Hostinger

## 🎉 Deploy Concluído!

Sua loja virtual está online em: `https://seu-dominio.com`

### Próximos Passos:
1. Configurar domínio personalizado
2. Configurar email de notificações
3. Configurar backup automático
4. Configurar monitoramento
5. Otimizar performance
