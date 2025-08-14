import request from 'supertest';
import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product, Category, User } from '../models/index.js';
import adminRoutes from '../routes/admin.js';
import productRoutes from '../routes/products.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar app de teste
const createTestApp = () => {
  const app = express();
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride('_method'));
  
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));
  
  app.use(flash());
  
  // Configurar EJS
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  
  // Middleware global simulado
  app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.categories = [];
    next();
  });
  
  // Mock da função sendEmail
  app.locals.sendEmail = () => Promise.resolve(true);
  
  app.use('/admin', adminRoutes);
  app.use('/products', productRoutes);
  
  return app;
};

// Função para fazer login como admin
const loginAsAdmin = async (app) => {
  const agent = request.agent(app);
  
  // Criar usuário admin de teste se não existir
  let adminUser = await User.findOne({ where: { email: 'admin@teste.com' } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      name: 'Admin Teste',
      email: 'admin@teste.com',
      password: hashedPassword,
      role: 'admin',
      is_active: true
    });
  }
  
  await agent
    .post('/auth/login')
    .send({
      email: 'admin@teste.com',
      password: 'admin123'
    });
    
  return { agent, adminUser };
};

describe('Gestão de Produtos', () => {
  let app;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    app = createTestApp();
    
    // Criar categoria de teste
    testCategory = await Category.create({
      name: 'Categoria Teste',
      slug: 'categoria-teste',
      description: 'Categoria para testes',
      is_active: true
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Product.destroy({ where: {} });
    await Category.destroy({ where: { name: 'Categoria Teste' } });
    await User.destroy({ where: { email: 'admin@teste.com' } });
  });

  beforeEach(() => {
    // Setup para cada teste
  });

  describe('CRUD de Produtos - Admin', () => {
    test('deve listar produtos', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const response = await agent.get('/admin/products');
      expect(response.status).toBe(200);
    });

    test('deve exibir formulário de novo produto', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const response = await agent.get('/admin/products/new');
      expect(response.status).toBe(200);
    });

    test('deve criar novo produto com sucesso', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const productData = {
        name: 'Produto Teste',
        description: 'Descrição do produto teste',
        price: '99.99',
        compare_price: '129.99',
        sku: 'PROD-TEST-001',
        stock_quantity: '10',
        category_id: testCategory.id,
        is_active: 'on',
        is_featured: 'on',
        is_bestseller: 'on'
      };

      const response = await agent
        .post('/admin/products')
        .send(productData);

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/products');
      
      // Verificar se produto foi criado
      const createdProduct = await Product.findOne({ where: { name: 'Produto Teste' } });
      expect(createdProduct).toBeTruthy();
      expect(createdProduct.name).toBe('Produto Teste');
      expect(createdProduct.price).toBe(99.99);
      expect(createdProduct.compare_price).toBe(129.99);
      expect(createdProduct.sku).toBe('PROD-TEST-001');
      expect(createdProduct.stock_quantity).toBe(10);
      expect(createdProduct.category_id).toBe(testCategory.id);
      expect(createdProduct.is_active).toBe(true);
      expect(createdProduct.is_featured).toBe(true);
      expect(createdProduct.is_bestseller).toBe(true);
      
      testProduct = createdProduct;
    });

    test('deve exibir formulário de edição de produto', async () => {
      const { agent } = await loginAsAdmin(app);
      
      if (!testProduct) {
        testProduct = await Product.create({
          name: 'Produto para Editar',
          description: 'Descrição',
          price: 50.00,
          sku: 'EDIT-001',
          stock_quantity: 5,
          category_id: testCategory.id,
          is_active: true
        });
      }
      
      const response = await agent.get(`/admin/products/${testProduct.id}/edit`);
      expect(response.status).toBe(200);
    });

    test('deve atualizar produto existente', async () => {
      const { agent } = await loginAsAdmin(app);
      
      if (!testProduct) {
        testProduct = await Product.create({
          name: 'Produto para Atualizar',
          description: 'Descrição',
          price: 50.00,
          sku: 'UPDATE-001',
          stock_quantity: 5,
          category_id: testCategory.id,
          is_active: true
        });
      }

      const updatedData = {
        name: 'Produto Atualizado',
        description: 'Descrição atualizada',
        price: '79.99',
        compare_price: '99.99',
        sku: 'PROD-UPDATE-001',
        stock_quantity: '15',
        category_id: testCategory.id,
        is_active: 'on',
        is_featured: 'on'
      };

      const response = await agent
        .put(`/admin/products/${testProduct.id}`)
        .send(updatedData);

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/products');
      
      // Verificar se produto foi atualizado
      await testProduct.reload();
      expect(testProduct.name).toBe('Produto Atualizado');
      expect(testProduct.price).toBe(79.99);
      expect(testProduct.sku).toBe('PROD-UPDATE-001');
      expect(testProduct.stock_quantity).toBe(15);
    });

    test('deve excluir produto', async () => {
      const { agent } = await loginAsAdmin(app);
      
      // Criar produto para exclusão
      const productToDelete = await Product.create({
        name: 'Produto para Excluir',
        description: 'Descrição',
        price: 25.00,
        sku: 'DELETE-001',
        stock_quantity: 3,
        category_id: testCategory.id,
        is_active: true
      });

      const response = await agent
        .delete(`/admin/products/${productToDelete.id}`);

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/products');
      
      // Verificar se produto foi excluído
      const deletedProduct = await Product.findByPk(productToDelete.id);
      expect(deletedProduct).toBeNull();
    });

    test('deve falhar ao criar produto sem dados obrigatórios', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const invalidData = {
        name: '', // Nome vazio
        description: 'Descrição',
        price: 'invalid_price', // Preço inválido
        stock_quantity: 'invalid_stock' // Estoque inválido
      };

      const response = await agent
        .post('/admin/products')
        .send(invalidData);

      // Deve redirecionar de volta para o formulário
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/products/new');
    });

    test('deve falhar ao tentar editar produto inexistente', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const response = await agent.get('/admin/products/999999999-9999-9999-9999-999999999999/edit');
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/products');
    });
  });

  describe('Visualização Pública de Produtos', () => {
    test('deve listar produtos ativos', async () => {
      // Criar produto ativo para teste
      const activeProduct = await Product.create({
        name: 'Produto Público Ativo',
        description: 'Produto visível publicamente',
        price: 39.99,
        sku: 'PUBLIC-001',
        stock_quantity: 20,
        category_id: testCategory.id,
        is_active: true
      });

      const response = await request(app).get('/products');
      expect(response.status).toBe(200);
      
      // Limpar produto de teste
      await activeProduct.destroy();
    });

    test('deve exibir produto específico', async () => {
      // Criar produto para visualização
      const viewProduct = await Product.create({
        name: 'Produto para Visualizar',
        description: 'Produto para teste de visualização',
        price: 49.99,
        sku: 'VIEW-001',
        stock_quantity: 15,
        category_id: testCategory.id,
        is_active: true
      });

      const response = await request(app).get(`/products/${viewProduct.id}`);
      expect(response.status).toBe(200);
      
      // Limpar produto de teste
      await viewProduct.destroy();
    });

    test('deve retornar erro 404 para produto inexistente', async () => {
      const response = await request(app).get('/products/999999999-9999-9999-9999-999999999999');
      expect(response.status).toBe(302); // Redirect para /products
    });
  });

  describe('Validações do Modelo Product', () => {
    test('deve criar produto com dados válidos', async () => {
      const validProduct = await Product.create({
        name: 'Produto Válido',
        description: 'Produto com dados válidos',
        price: 29.99,
        sku: 'VALID-001',
        stock_quantity: 100,
        category_id: testCategory.id,
        is_active: true
      });

      expect(validProduct).toBeTruthy();
      expect(validProduct.name).toBe('Produto Válido');
      expect(validProduct.price).toBe(29.99);
      
      // Limpar
      await validProduct.destroy();
    });

    test('deve falhar com preço negativo', async () => {
      await expect(Product.create({
        name: 'Produto com Preço Inválido',
        description: 'Produto com preço negativo',
        price: -10.00,
        sku: 'INVALID-001',
        stock_quantity: 10,
        category_id: testCategory.id,
        is_active: true
      })).rejects.toThrow();
    });

    test('deve falhar sem nome', async () => {
      await expect(Product.create({
        description: 'Produto sem nome',
        price: 19.99,
        sku: 'INVALID-002',
        stock_quantity: 5,
        category_id: testCategory.id,
        is_active: true
      })).rejects.toThrow();
    });
  });
});
