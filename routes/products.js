import express from 'express';
import { Product, Category } from '../models/index.js';

const router = express.Router();

// Listar produtos
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      include: [{ model: Category, as: 'category' }],
      order: [['created_at', 'DESC']]
    });
    
    res.render('products/index', { 
      title: 'Produtos',
      products 
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    req.flash('error', 'Erro ao carregar produtos');
    res.render('products/index', { 
      title: 'Produtos',
      products: []
    });
  }
});

// Rota pública para exibir imagem do produto
router.get('/:id/image', async (req, res) => {
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

// Rota pública para exibir segunda imagem do carrossel
router.get('/:id/image/2', async (req, res) => {
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

// Rota pública para exibir terceira imagem do carrossel
router.get('/:id/image/3', async (req, res) => {
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

// Mostrar produto específico
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }]
    });
    
    if (!product) {
      req.flash('error', 'Produto não encontrado');
      return res.redirect('/products');
    }
    
    res.render('products/show', { 
      title: product.name,
      product 
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    req.flash('error', 'Erro ao carregar produto');
    res.redirect('/products');
  }
});

export default router; 