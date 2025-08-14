import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import flash from 'connect-flash';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { User, Category, Product, Order, OrderItem } from './models/index.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Inicializar variáveis globais (se necessário)

// Importar rotas
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

// Configuração do dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Desabilitar cache do EJS em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.set('view cache', false);
}

// Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'sua-chave-secreta-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true em produção com HTTPS
}));

// Configuração do Flash
app.use(flash());

// Middleware global para variáveis
app.use(async (req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.cart = req.session.cart || [];
  
  // Buscar categorias para o menu
  try {
    const categories = await Category.findAll({ where: { is_active: true } });
    res.locals.categories = categories;
  } catch (error) {
    res.locals.categories = [];
  }
  
  // Buscar dados completos do usuário se estiver logado
  if (req.session.user) {
    try {
      const user = await User.findByPk(req.session.user.id);
      if (user) {
        res.locals.user = {
          ...req.session.user,
          profile_image: user.profile_image,
          profile_image_type: user.profile_image_type
        };
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  }
  
  next();
});

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'seu-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'sua-senha-app'
  }
});

// Função para enviar emails
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'arteetradicao@gmail.com',
      to,
      subject,
      html
    });
    console.log('✅ Email enviado:', subject);
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
  }
};

// Rotas
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Rota principal
app.get('/', async (req, res) => {
  try {
    const featuredProducts = await Product.findAll({
      where: { is_active: true, is_featured: true },
      include: [{ model: Category, as: 'category' }],
      limit: 8
    });
    
    const bestSellers = await Product.findAll({
      where: { is_active: true, is_bestseller: true },
      include: [{ model: Category, as: 'category' }],
      limit: 4
    });
    
    res.render('index', { 
      title: 'Arte & Tradição - Página Inicial',
      featuredProducts,
      bestSellers
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    res.render('index', { 
      title: 'Arte & Tradição - Página Inicial',
      featuredProducts: [],
      bestSellers: []
    });
  }
});

// Rota sobre
app.get('/sobre', (req, res) => {
  res.render('sobre', { title: 'Sobre Nós' });
});

// Rota contato
app.get('/contato', (req, res) => {
  res.render('contato', { title: 'Contato' });
});

// Rota de busca
app.get('/search', async (req, res) => {
  const { q, category } = req.query;
  
  try {
    let whereClause = { is_active: true };
    
    if (category) {
      whereClause.category_id = category;
    }
    
    const products = await Product.findAll({
      where: whereClause,
      include: [{ model: Category, as: 'category' }],
      order: [['created_at', 'DESC']]
    });
    
    const filteredProducts = q 
      ? products.filter(p => 
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.description.toLowerCase().includes(q.toLowerCase())
        )
      : products;
    
    res.render('search', {
      title: 'Resultados da Busca',
      products: filteredProducts,
      query: q,
      category
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.render('search', {
      title: 'Resultados da Busca',
      products: [],
      query: q,
      category
    });
  }
});

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página não encontrada' });
});

// Middleware de erro geral
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Erro interno',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Inicializar servidor
const initializeServer = async () => {
  try {
    // Testar conexão com banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📦 Loja Arte & Tradição iniciada com sucesso!`);
      console.log(`👤 Admin: admin@artetradicao.com.br / admin123`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Exportar função de envio de email para uso em outras rotas
app.locals.sendEmail = sendEmail;

initializeServer(); 