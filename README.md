# 🛒 Loja Virtual - Node.js

Uma loja virtual simples e completa desenvolvida em Node.js com Express, EJS e Bootstrap.

## ✨ Funcionalidades

- **Catálogo de Produtos**: Visualização e gerenciamento de produtos
- **Carrinho de Compras**: Adicionar, remover e atualizar itens
- **Sistema de Pedidos**: Checkout e finalização de compras
- **Autenticação**: Login, registro e gerenciamento de usuários
- **Painel Administrativo**: Gerenciamento de produtos e pedidos
- **Interface Responsiva**: Design moderno com Bootstrap 5

## 🚀 Tecnologias Utilizadas

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **EJS**: Template engine
- **Bootstrap 5**: Framework CSS
- **Font Awesome**: Ícones
- **bcryptjs**: Criptografia de senhas
- **express-session**: Gerenciamento de sessões
- **connect-flash**: Mensagens flash

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## 🛠️ Instalação

1. **Clone ou navegue para a pasta do projeto:**
   ```bash
   cd loja-virtual
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente (opcional):**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   PORT=3000
   SESSION_SECRET=sua-chave-secreta-aqui
   NODE_ENV=development
   ```

4. **Inicie o servidor:**
   ```bash
   # Modo desenvolvimento (com nodemon)
   npm run dev
   
   # Modo produção
   npm start
   ```

5. **Acesse a aplicação:**
   Abra seu navegador e acesse: `http://localhost:3000`

## 👤 Contas Padrão

### Administrador
- **Email:** admin@loja.com
- **Senha:** password

### Usuário Comum
- Crie uma conta através do formulário de registro

## 📁 Estrutura do Projeto

```
loja-virtual/
├── server.js              # Servidor principal
├── package.json           # Dependências e scripts
├── routes/                # Rotas da aplicação
│   ├── products.js        # Rotas de produtos
│   ├── cart.js           # Rotas do carrinho
│   ├── orders.js         # Rotas de pedidos
│   └── auth.js           # Rotas de autenticação
├── views/                 # Templates EJS
│   ├── partials/         # Partials reutilizáveis
│   ├── products/         # Views de produtos
│   ├── cart/             # Views do carrinho
│   ├── orders/           # Views de pedidos
│   └── auth/             # Views de autenticação
└── public/               # Arquivos estáticos
    ├── css/              # Estilos CSS
    ├── js/               # Scripts JavaScript
    └── images/           # Imagens
```

## 🔧 Funcionalidades Principais

### 🛍️ Produtos
- Listagem de produtos
- Visualização detalhada
- Adicionar ao carrinho
- Gerenciamento (admin): criar, editar, excluir

### 🛒 Carrinho de Compras
- Adicionar produtos
- Atualizar quantidades
- Remover itens
- Limpar carrinho
- Resumo do pedido

### 📦 Pedidos
- Checkout com informações de entrega
- Confirmação de pedido
- Histórico de pedidos (admin)
- Atualização de status (admin)

### 👤 Autenticação
- Login e registro de usuários
- Perfil do usuário
- Painel administrativo
- Logout

## 🎨 Interface

A interface foi desenvolvida com:
- **Bootstrap 5**: Componentes responsivos
- **Font Awesome**: Ícones modernos
- **Design responsivo**: Funciona em desktop e mobile
- **UX intuitiva**: Navegação clara e objetiva

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Sessões seguras
- Validação de formulários
- Proteção contra CSRF (method-override)

## 📝 Dados de Exemplo

A aplicação inclui produtos de exemplo para demonstração:
- Produto 1: R$ 29,99
- Produto 2: R$ 49,99
- Produto 3: R$ 19,99

## 🚀 Deploy

Para fazer deploy em produção:

1. Configure as variáveis de ambiente
2. Use `npm start` para iniciar
3. Configure um proxy reverso (nginx)
4. Use PM2 para gerenciar o processo

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte:
- Email: contato@lojavirtual.com
- GitHub Issues: [Link do repositório]

---

**Desenvolvido com ❤️ usando Node.js e Express** 