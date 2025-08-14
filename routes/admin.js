import express from 'express';
import { User, Category, Product, Order, OrderItem } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { uploadImageAsBlob, uploadProductImageAsBlob, uploadProductCarouselAsBlob } from '../middleware/upload.js';

const router = express.Router();

// Middleware para verificar se é admin
const requireAdmin = async (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Você precisa estar logado para acessar esta página');
    return res.redirect('/auth/login');
  }
  
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user || user.role !== 'admin' || !user.is_active) {
      req.flash('error', 'Acesso negado. Apenas administradores podem acessar esta página');
      return res.redirect('/');
    }
    next();
  } catch (error) {
    req.flash('error', 'Erro de autenticação');
    return res.redirect('/auth/login');
  }
};

// Aplicar middleware em todas as rotas
router.use(requireAdmin);

// Dashboard
router.get('/', async (req, res) => {
  try {
    // Estatísticas
    const totalProducts = await Product.count();
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const todayOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Vendas do mês
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ordersThisMonth = await Order.findAll({
      where: {
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    });
    const totalSales = ordersThisMonth.reduce((sum, order) => {
      const amount = parseFloat(order.total_amount) || 0;
      return sum + amount;
    }, 0);

    // Pedidos recentes
    const recentOrders = await Order.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Produtos mais vendidos (simulado por enquanto)
    const topProducts = await Product.findAll({
      where: { is_bestseller: true },
      limit: 5
    });

    res.render('admin/dashboard', {
      title: 'Dashboard - Arte & Tradição',
      totalProducts,
      totalUsers,
      totalOrders,
      todayOrders,
      totalSales: totalSales.toFixed(2),
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    req.flash('error', 'Erro ao carregar dashboard');
    res.redirect('/');
  }
});

// Gestão de Produtos
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      include: [{ model: Category, as: 'category' }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const categories = await Category.findAll({ where: { is_active: true } });
    const totalPages = Math.ceil(count / limit);

    res.render('admin/products/index', {
      title: 'Gestão de Produtos - Arte & Tradição',
      products,
      categories,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    req.flash('error', 'Erro ao carregar produtos');
    res.redirect('/admin');
  }
});

// Novo produto
router.get('/products/new', async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { is_active: true } });
    res.render('admin/products/form', {
      title: 'Novo Produto - Arte & Tradição',
      product: null,
      categories
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    req.flash('error', 'Erro ao carregar formulário');
    res.redirect('/admin/products');
  }
});

// Criar produto
router.post('/products', uploadProductCarouselAsBlob, async (req, res) => {
  try {
    const {
      name, description, price, compare_price, sku, stock_quantity,
      category_id, is_active, is_featured, is_bestseller
    } = req.body;

    const productData = {
      name,
      description,
      price: parseFloat(price),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      sku,
      stock_quantity: parseInt(stock_quantity) || 0,
      category_id: category_id || null,
      is_active: is_active === 'on',
      is_featured: is_featured === 'on',
      is_bestseller: is_bestseller === 'on'
    };

    // Processar imagens do carrossel se houver
    if (req.files && req.files.length > 0) {
      const maxImages = Math.min(req.files.length, 3);
      
      for (let i = 0; i < maxImages; i++) {
        const file = req.files[i];
        if (file && file.buffer) {
          if (i === 0) {
            productData.image = file.buffer;
            productData.image_type = file.mimetype;
          } else if (i === 1) {
            productData.image_2 = file.buffer;
            productData.image_2_type = file.mimetype;
          } else if (i === 2) {
            productData.image_3 = file.buffer;
            productData.image_3_type = file.mimetype;
          }
        }
      }
    }

    const product = await Product.create(productData);

    req.flash('success', 'Produto criado com sucesso!');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    req.flash('error', 'Erro ao criar produto');
    res.redirect('/admin/products/new');
  }
});

// Editar produto
router.get('/products/:id/edit', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }]
    });

    if (!product) {
      req.flash('error', 'Produto não encontrado');
      return res.redirect('/admin/products');
    }

    const categories = await Category.findAll({ where: { is_active: true } });

    res.render('admin/products/form', {
      title: 'Editar Produto - Arte & Tradição',
      product,
      categories
    });
  } catch (error) {
    console.error('Erro ao carregar produto:', error);
    req.flash('error', 'Erro ao carregar produto');
    res.redirect('/admin/products');
  }
});

// Atualizar produto
router.put('/products/:id', uploadProductCarouselAsBlob, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      req.flash('error', 'Produto não encontrado');
      return res.redirect('/admin/products');
    }

    const {
      name, description, price, compare_price, sku, stock_quantity,
      category_id, is_active, is_featured, is_bestseller
    } = req.body;

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      sku,
      stock_quantity: parseInt(stock_quantity) || 0,
      category_id: category_id || null,
      is_active: is_active === 'on',
      is_featured: is_featured === 'on',
      is_bestseller: is_bestseller === 'on'
    };

    // Processar novas imagens do carrossel se houver
    if (req.files && req.files.length > 0) {
      const maxImages = Math.min(req.files.length, 3);
      
      for (let i = 0; i < maxImages; i++) {
        const file = req.files[i];
        if (file && file.buffer) {
          if (i === 0) {
            updateData.image = file.buffer;
            updateData.image_type = file.mimetype;
          } else if (i === 1) {
            updateData.image_2 = file.buffer;
            updateData.image_2_type = file.mimetype;
          } else if (i === 2) {
            updateData.image_3 = file.buffer;
            updateData.image_3_type = file.mimetype;
          }
        }
      }
    }

    await product.update(updateData);

    req.flash('success', 'Produto atualizado com sucesso!');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    req.flash('error', 'Erro ao atualizar produto');
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
});

// Excluir produto
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      req.flash('error', 'Produto não encontrado');
      return res.redirect('/admin/products');
    }

    await product.destroy();
    req.flash('success', 'Produto excluído com sucesso!');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    req.flash('error', 'Erro ao excluir produto');
    res.redirect('/admin/products');
  }
});

// Rota para exibir imagem do produto
router.get('/products/:id/image', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product || !product.image) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.set('Content-Type', product.image_type || 'image/jpeg');
    res.send(product.image);
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para exibir segunda imagem do carrossel
router.get('/products/:id/image/2', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product || !product.image_2) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.set('Content-Type', product.image_2_type || 'image/jpeg');
    res.send(product.image_2);
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para exibir terceira imagem do carrossel
router.get('/products/:id/image/3', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product || !product.image_3) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.set('Content-Type', product.image_3_type || 'image/jpeg');
    res.send(product.image_3);
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Gestão de Pedidos
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('admin/orders/index', {
      title: 'Gestão de Pedidos - Arte & Tradição',
      orders,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    req.flash('error', 'Erro ao carregar pedidos');
    res.redirect('/admin');
  }
});

// Ver pedido
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    if (!order) {
      req.flash('error', 'Pedido não encontrado');
      return res.redirect('/admin/orders');
    }

    res.render('admin/orders/show', {
      title: `Pedido #${order.id.substring(0, 8)} - Arte & Tradição`,
      order
    });
  } catch (error) {
    console.error('Erro ao carregar pedido:', error);
    req.flash('error', 'Erro ao carregar pedido');
    res.redirect('/admin/orders');
  }
});

// Atualizar status do pedido
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    await order.update({ status });

    // Enviar email de notificação se o status for "shipped" ou "delivered"
    if (status === 'shipped' || status === 'delivered') {
      const emailSubject = status === 'shipped' ? 'Seu pedido foi enviado!' : 'Seu pedido foi entregue!';
      const emailHtml = `
        <h2>${emailSubject}</h2>
        <p>Olá ${order.customer_name},</p>
        <p>Seu pedido #${order.id.substring(0, 8)} foi ${status === 'shipped' ? 'enviado' : 'entregue'}.</p>
        <p>Obrigado por escolher a Arte & Tradição!</p>
      `;

      try {
        await req.app.locals.sendEmail(order.customer_email, emailSubject, emailHtml);
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    }

    res.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Gestão de Usuários
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('admin/users/index', {
      title: 'Gestão de Usuários - Arte & Tradição',
      users,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    req.flash('error', 'Erro ao carregar usuários');
    res.redirect('/admin');
  }
});

// Ativar/Desativar usuário
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    await user.update({ is_active: !user.is_active });
    
    res.json({ 
      success: true, 
      message: `Usuário ${user.is_active ? 'ativado' : 'desativado'} com sucesso`,
      is_active: user.is_active
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Criar usuário
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findOne({ 
      where: { email: email } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Um usuário com este email já existe' 
      });
    }

    await User.create({
      name,
      email,
      password: password,
      role: role || 'user',
      is_active: true
    });

    res.json({ 
      success: true, 
      message: 'Usuário criado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Atualizar usuário
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar se email já existe (exceto para o usuário atual)
    const existingUser = await User.findOne({ 
      where: { 
        email: email,
        id: { [Op.ne]: userId }
      } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Um usuário com este email já existe' 
      });
    }

    // Preparar dados para atualização
    const updateData = {
      name,
      email,
      role: role || 'user'
    };

    // Se uma nova senha foi fornecida, ela será hasheada automaticamente pelo hook
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    await user.update(updateData);

    res.json({ 
      success: true, 
      message: 'Usuário atualizado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Excluir usuário
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Não permitir excluir o próprio usuário logado
    if (user.id === req.session.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível excluir sua própria conta' 
      });
    }

    await user.destroy();

    res.json({ 
      success: true, 
      message: 'Usuário excluído com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Gestão de Categorias
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    res.render('admin/categories/index', {
      title: 'Gestão de Categorias - Arte & Tradição',
      categories
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    req.flash('error', 'Erro ao carregar categorias');
    res.redirect('/admin');
  }
});

// Criar categoria
router.post('/categories', async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Verificar se categoria já existe
    const existingCategory = await Category.findOne({ 
      where: { 
        name: name 
      } 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Uma categoria com este nome já existe' 
      });
    }

    await Category.create({
      name,
      slug,
      description,
      is_active: is_active === 'true' || is_active === true
    });

    res.json({ 
      success: true, 
      message: 'Categoria criada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Atualizar categoria
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const categoryId = req.params.id;
    
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }

    // Verificar se nome já existe (exceto para a categoria atual)
    const existingCategory = await Category.findOne({ 
      where: { 
        name: name,
        id: { [Op.ne]: categoryId }
      } 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Uma categoria com este nome já existe' 
      });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    await category.update({
      name,
      slug,
      description,
      is_active: is_active === 'true' || is_active === true
    });

    res.json({ 
      success: true, 
      message: 'Categoria atualizada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Ativar/Desativar categoria
router.put('/categories/:id/toggle-status', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    }

    await category.update({ is_active: !category.is_active });
    
    res.json({ 
      success: true, 
      message: `Categoria ${category.is_active ? 'ativada' : 'desativada'} com sucesso`,
      is_active: category.is_active
    });
  } catch (error) {
    console.error('Erro ao alterar status da categoria:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Excluir categoria
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }

    // Verificar se há produtos associados
    const productCount = await Product.count({ where: { category_id: category.id } });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Não é possível excluir a categoria. Existem ${productCount} produto(s) associado(s).` 
      });
    }

    await category.destroy();

    res.json({ 
      success: true, 
      message: 'Categoria excluída com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Configurações
router.get('/settings', async (req, res) => {
  try {
    res.render('admin/settings', {
      title: 'Configurações - Arte & Tradição'
    });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    req.flash('error', 'Erro ao carregar configurações');
    res.redirect('/admin');
  }
});

export default router;
