import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem, Product, User } from '../models/index.js';

const router = express.Router();

// Inicializar array de pedidos se não existir
if (!global.orders) {
  global.orders = [];
}

// Mostrar formulário de checkout
router.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  
  if (cart.length === 0) {
    req.flash('error', 'Seu carrinho está vazio');
    return res.redirect('/cart');
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.render('orders/checkout', { 
    title: 'Finalizar Compra',
    cart,
    total 
  });
});

// Processar pedido
router.post('/checkout', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    
    if (cart.length === 0) {
      req.flash('error', 'Seu carrinho está vazio');
      return res.redirect('/cart');
    }
    
    const { name, email, address, city, state, zipCode, phone } = req.body;
    
    // Validação básica
    if (!name || !email || !address || !city || !state || !zipCode || !phone) {
      req.flash('error', 'Por favor, preencha todos os campos obrigatórios');
      return res.redirect('/orders/checkout');
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping_amount = 0; // Frete grátis
    const tax_amount = 0; // Sem impostos por enquanto
    const total_amount = subtotal + shipping_amount + tax_amount;
    
    // Criar pedido no banco de dados
    const order = await Order.create({
      user_id: req.session.user ? req.session.user.id : null,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      shipping_city: city,
      shipping_state: state,
      shipping_zip_code: zipCode,
      billing_address: address,
      subtotal: subtotal,
      shipping_amount: shipping_amount,
      tax_amount: tax_amount,
      total_amount: total_amount,
      status: 'pending',
      payment_status: 'pending',
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
    
    // Criar itens do pedido
    for (const item of cart) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku || 'N/A',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      });
    }
    
    // Limpar carrinho
    req.session.cart = [];
    
    req.flash('success', `Pedido realizado com sucesso! Número do pedido: ${order.order_number}`);
    res.redirect(`/orders/${order.id}`);
    
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    req.flash('error', 'Erro ao processar pedido. Tente novamente.');
    res.redirect('/cart');
  }
});

// Mostrar pedido específico
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });
    
    if (!order) {
      req.flash('error', 'Pedido não encontrado');
      return res.redirect('/');
    }
    
    // Verificar se o usuário tem permissão para ver este pedido
    if (!req.session.user || (req.session.user.role !== 'admin' && order.user_id !== req.session.user.id)) {
      req.flash('error', 'Você não tem permissão para ver este pedido');
      return res.redirect('/orders');
    }
    
    res.render('orders/show', { 
      title: `Pedido ${order.order_number}`,
      order 
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    req.flash('error', 'Erro ao carregar pedido');
    res.redirect('/');
  }
});

// Listar pedidos (admin vê todos, usuário vê apenas os seus)
router.get('/', async (req, res) => {
  try {
    let whereClause = {};
    
    // Se não for admin, mostrar apenas pedidos do usuário logado
    if (!req.session.user || req.session.user.role !== 'admin') {
      if (!req.session.user) {
        req.flash('error', 'Você precisa estar logado para ver seus pedidos');
        return res.redirect('/auth/login');
      }
      whereClause.user_id = req.session.user.id;
    }
    
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user' },
        { model: OrderItem, as: 'items' }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.render('orders/index', { 
      title: req.session.user && req.session.user.role === 'admin' ? 'Todos os Pedidos' : 'Meus Pedidos',
      orders 
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    req.flash('error', 'Erro ao carregar pedidos');
    res.render('orders/index', { 
      title: 'Pedidos',
      orders: []
    });
  }
});

// Atualizar status do pedido (admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      req.flash('error', 'Pedido não encontrado');
      return res.redirect('/orders');
    }
    
    await order.update({ status });
    
    req.flash('success', 'Status do pedido atualizado!');
    res.redirect('/orders');
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    req.flash('error', 'Erro ao atualizar status do pedido');
    res.redirect('/orders');
  }
});

// Rota para acompanhamento de pedido (público)
router.get('/track/:order_number', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { order_number: req.params.order_number },
      include: [
        { model: User, as: 'user' },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });
    
    if (!order) {
      req.flash('error', 'Pedido não encontrado');
      return res.redirect('/');
    }
    
    res.render('orders/track', { 
      title: `Acompanhar Pedido ${order.order_number}`,
      order 
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    req.flash('error', 'Erro ao carregar pedido');
    res.redirect('/');
  }
});

export default router; 