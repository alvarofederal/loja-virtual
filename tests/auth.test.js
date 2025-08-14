import request from 'supertest';
import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/index.js';
import authRoutes from '../routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar app de teste
const createTestApp = () => {
  const app = express();
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  
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
  app.locals.sendEmail = jest.fn().mockResolvedValue(true);
  
  app.use('/auth', authRoutes);
  
  return app;
};

describe('Autenticação', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    app = createTestApp();
    
    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('123456', 10);
    testUser = await User.create({
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      password: hashedPassword,
      role: 'user',
      is_active: true
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testUser) {
      await User.destroy({ where: { email: 'teste@exemplo.com' } });
    }
    await User.destroy({ where: { email: 'novousuario@teste.com' } });
  });

  describe('POST /auth/login', () => {
    test('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'teste@exemplo.com',
          password: '123456'
        });

      expect(response.status).toBe(302); // Redirect
      expect(response.header.location).toBe('/');
    });

    test('deve falhar com email inválido', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'email_inexistente@teste.com',
          password: '123456'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/login');
    });

    test('deve falhar com senha incorreta', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'teste@exemplo.com',
          password: 'senha_errada'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/login');
    });

    test('deve falhar com usuário inativo', async () => {
      // Desativar usuário temporariamente
      await testUser.update({ is_active: false });
      
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'teste@exemplo.com',
          password: '123456'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/login');
      
      // Reativar usuário
      await testUser.update({ is_active: true });
    });
  });

  describe('POST /auth/register', () => {
    test('deve registrar novo usuário com sucesso', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Novo Usuário',
          email: 'novousuario@teste.com',
          password: '123456',
          confirmPassword: '123456',
          phone: '11999999999'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/login');
      
      // Verificar se usuário foi criado
      const newUser = await User.findOne({ where: { email: 'novousuario@teste.com' } });
      expect(newUser).toBeTruthy();
      expect(newUser.name).toBe('Novo Usuário');
      expect(newUser.role).toBe('user');
      expect(newUser.is_active).toBe(true);
    });

    test('deve falhar com email já existente', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Outro Usuário',
          email: 'teste@exemplo.com', // Email já existe
          password: '123456',
          confirmPassword: '123456'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/register');
    });

    test('deve falhar com senhas não coincidentes', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Usuário Teste',
          email: 'outro@teste.com',
          password: '123456',
          confirmPassword: '654321'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/register');
    });

    test('deve falhar com senha muito curta', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Usuário Teste',
          email: 'outro@teste.com',
          password: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/register');
    });

    test('deve falhar com campos obrigatórios vazios', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: '',
          email: 'teste@exemplo.com',
          password: '123456',
          confirmPassword: '123456'
        });

      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/auth/register');
    });
  });

  describe('Verificação de senha', () => {
    test('modelo User deve verificar senha correta', async () => {
      const isValid = await testUser.verifyPassword('123456');
      expect(isValid).toBe(true);
    });

    test('modelo User deve rejeitar senha incorreta', async () => {
      const isValid = await testUser.verifyPassword('senha_errada');
      expect(isValid).toBe(false);
    });
  });
});
