import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração do __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rotas
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

// Importar middleware
import { requireAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'sua-chave-secreta-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Flash messages
app.use(flash());

// Middleware global para variáveis
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Rotas
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', requireAuth, cartRoutes);
app.use('/orders', requireAuth, orderRoutes);
app.use('/admin', requireAuth, adminRoutes);

// Rota principal
app.get('/', async (req, res) => {
  try {
    const { Product } = await import('./models/index.js');
    const products = await Product.findAll({
      where: { is_active: true },
      limit: 8,
      order: [['created_at', 'DESC']]
    });
    
    res.render('index', { 
      products,
      title: 'Início'
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    res.render('index', { 
      products: [],
      title: 'Início'
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

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página não encontrada' });
});

// Middleware de erro geral
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Erro',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
}); 