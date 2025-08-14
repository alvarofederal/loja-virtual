import express from 'express';
import { Product } from '../models/index.js';

const router = express.Router();

// Mostrar carrinho
router.get('/', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  
  res.render('cart/index', { 
    title: 'Carrinho de Compras',
    cart,
    total 
  });
});

// Adicionar produto ao carrinho
router.post('/add/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const quantity = parseInt(req.body.quantity) || 1;
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      req.flash('error', 'Produto não encontrado');
      return res.redirect('/products');
    }
    
    // Inicializar carrinho se não existir
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    // Verificar se produto já está no carrinho
    const existingItem = req.session.cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      req.session.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '/images/default-product.jpg',
        quantity
      });
    }
    
    req.flash('success', 'Produto adicionado ao carrinho!');
    res.redirect('/cart');
  } catch (error) {
    console.error('Erro ao adicionar produto ao carrinho:', error);
    req.flash('error', 'Erro ao adicionar produto ao carrinho');
    res.redirect('/products');
  }
});

// Atualizar quantidade no carrinho
router.put('/update/:id', (req, res) => {
  const productId = req.params.id;
  const quantity = parseInt(req.body.quantity);
  
  if (quantity <= 0) {
    // Remover item se quantidade for 0 ou menor
    req.session.cart = req.session.cart.filter(item => item.id !== productId);
  } else {
    // Atualizar quantidade
    const item = req.session.cart.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  
  req.flash('success', 'Carrinho atualizado!');
  res.redirect('/cart');
});

// Remover produto do carrinho
router.delete('/remove/:id', (req, res) => {
  const productId = req.params.id;
  
  req.session.cart = req.session.cart.filter(item => item.id !== productId);
  
  req.flash('success', 'Produto removido do carrinho!');
  res.redirect('/cart');
});

// Limpar carrinho
router.delete('/clear', (req, res) => {
  req.session.cart = [];
  
  req.flash('success', 'Carrinho limpo!');
  res.redirect('/cart');
});

export default router; 