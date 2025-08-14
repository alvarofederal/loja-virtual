import request from 'supertest';
import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import { Category, User } from '../models/index.js';
import adminRoutes from '../routes/admin.js';
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
  
  app.use('/admin', adminRoutes);
  
  return app;
};

// Função para fazer login como admin
const loginAsAdmin = async (app) => {
  const agent = request.agent(app);
  
  // Criar usuário admin de teste se não existir
  let adminUser = await User.findOne({ where: { email: 'admin.cat@teste.com' } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      name: 'Admin Categorias',
      email: 'admin.cat@teste.com',
      password: hashedPassword,
      role: 'admin',
      is_active: true
    });
  }
  
  await agent
    .post('/auth/login')
    .send({
      email: 'admin.cat@teste.com',
      password: 'admin123'
    });
    
  return { agent, adminUser };
};

describe('Gestão de Categorias', () => {
  let app;
  let testCategory;

  beforeAll(async () => {
    app = createTestApp();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Category.destroy({ where: {} });
    await User.destroy({ where: { email: 'admin.cat@teste.com' } });
  });

  beforeEach(() => {
    // Setup para cada teste
  });

  describe('CRUD de Categorias - Admin', () => {
    test('deve listar categorias', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const response = await agent.get('/admin/categories');
      expect(response.status).toBe(200);
    });

    test('deve criar nova categoria com sucesso', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const categoryData = {
        name: 'Categoria Teste',
        description: 'Descrição da categoria de teste'
      };

      const response = await agent
        .post('/admin/categories')
        .send(categoryData);

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/categories');
      
      // Verificar se categoria foi criada
      const createdCategory = await Category.findOne({ where: { name: 'Categoria Teste' } });
      expect(createdCategory).toBeTruthy();
      expect(createdCategory.name).toBe('Categoria Teste');
      expect(createdCategory.description).toBe('Descrição da categoria de teste');
      expect(createdCategory.slug).toBe('categoria-teste');
      expect(createdCategory.is_active).toBe(true);
      
      testCategory = createdCategory;
    });

    test('deve falhar ao criar categoria com nome duplicado', async () => {
      const { agent } = await loginAsAdmin(app);
      
      // Primeiro, criar uma categoria
      if (!testCategory) {
        testCategory = await Category.create({
          name: 'Categoria Duplicada',
          slug: 'categoria-duplicada',
          description: 'Primeira categoria',
          is_active: true
        });
      }
      
      // Tentar criar categoria com mesmo nome
      const duplicateData = {
        name: testCategory.name,
        description: 'Tentativa de duplicar categoria'
      };

      const response = await agent
        .post('/admin/categories')
        .send(duplicateData);

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/categories');
    });

    test('deve falhar ao criar categoria sem nome', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const invalidData = {
        name: '', // Nome vazio
        description: 'Categoria sem nome'
      };

      const response = await agent
        .post('/admin/categories')
        .send(invalidData);

      // Deve redirecionar de volta
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/admin/categories');
    });

    test('deve gerar slug automaticamente', async () => {
      const { agent } = await loginAsAdmin(app);
      
      const categoryData = {
        name: 'Categoria com Acentos é Símbolos!',
        description: 'Teste de geração de slug'
      };

      const response = await agent
        .post('/admin/categories')
        .send(categoryData);

      expect(response.status).toBe(302);
      
      // Verificar se slug foi gerado corretamente
      const createdCategory = await Category.findOne({ 
        where: { name: 'Categoria com Acentos é Símbolos!' } 
      });
      
      expect(createdCategory).toBeTruthy();
      expect(createdCategory.slug).toBe('categoria-com-acentos-simbolos');
      
      // Limpar
      await createdCategory.destroy();
    });
  });

  describe('Validações do Modelo Category', () => {
    test('deve criar categoria com dados válidos', async () => {
      const validCategory = await Category.create({
        name: 'Categoria Válida',
        slug: 'categoria-valida',
        description: 'Categoria com dados válidos',
        is_active: true
      });

      expect(validCategory).toBeTruthy();
      expect(validCategory.name).toBe('Categoria Válida');
      expect(validCategory.slug).toBe('categoria-valida');
      expect(validCategory.is_active).toBe(true);
      
      // Limpar
      await validCategory.destroy();
    });

    test('deve falhar com nome muito longo', async () => {
      const longName = 'A'.repeat(101); // Assumindo que o limite é 100 caracteres
      
      await expect(Category.create({
        name: longName,
        slug: 'nome-muito-longo',
        description: 'Categoria com nome muito longo',
        is_active: true
      })).rejects.toThrow();
    });

    test('deve falhar sem nome obrigatório', async () => {
      await expect(Category.create({
        slug: 'sem-nome',
        description: 'Categoria sem nome',
        is_active: true
      })).rejects.toThrow();
    });

    test('deve falhar com slug duplicado', async () => {
      // Criar primeira categoria
      const firstCategory = await Category.create({
        name: 'Primeira Categoria',
        slug: 'categoria-duplicada-slug',
        description: 'Primeira categoria',
        is_active: true
      });

      // Tentar criar segunda categoria com mesmo slug
      await expect(Category.create({
        name: 'Segunda Categoria',
        slug: 'categoria-duplicada-slug',
        description: 'Segunda categoria',
        is_active: true
      })).rejects.toThrow();

      // Limpar
      await firstCategory.destroy();
    });

    test('deve permitir slug único', async () => {
      const uniqueCategory = await Category.create({
        name: 'Categoria Única',
        slug: 'categoria-unica-slug',
        description: 'Categoria com slug único',
        is_active: true
      });

      expect(uniqueCategory).toBeTruthy();
      expect(uniqueCategory.slug).toBe('categoria-unica-slug');
      
      // Limpar
      await uniqueCategory.destroy();
    });

    test('deve ter valor padrão para is_active', async () => {
      const defaultCategory = await Category.create({
        name: 'Categoria Padrão',
        slug: 'categoria-padrao',
        description: 'Categoria com valor padrão'
        // is_active não especificado
      });

      expect(defaultCategory.is_active).toBe(true);
      
      // Limpar
      await defaultCategory.destroy();
    });
  });

  describe('Funcionalidades Avançadas', () => {
    test('deve permitir desativar categoria', async () => {
      const category = await Category.create({
        name: 'Categoria para Desativar',
        slug: 'categoria-desativar',
        description: 'Categoria que será desativada',
        is_active: true
      });

      await category.update({ is_active: false });
      expect(category.is_active).toBe(false);
      
      // Limpar
      await category.destroy();
    });

    test('deve filtrar categorias ativas', async () => {
      // Criar categoria ativa
      const activeCategory = await Category.create({
        name: 'Categoria Ativa',
        slug: 'categoria-ativa',
        description: 'Categoria ativa',
        is_active: true
      });

      // Criar categoria inativa
      const inactiveCategory = await Category.create({
        name: 'Categoria Inativa',
        slug: 'categoria-inativa',
        description: 'Categoria inativa',
        is_active: false
      });

      // Buscar apenas categorias ativas
      const activeCategories = await Category.findAll({
        where: { is_active: true }
      });

      const activeNames = activeCategories.map(cat => cat.name);
      expect(activeNames).toContain('Categoria Ativa');
      expect(activeNames).not.toContain('Categoria Inativa');
      
      // Limpar
      await activeCategory.destroy();
      await inactiveCategory.destroy();
    });
  });
});
