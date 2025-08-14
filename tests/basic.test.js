import { User, Product, Category } from '../models/index.js';
import { createTestData, cleanTestData } from './seed-data.js';

describe('Configuração Básica', () => {
  let testData;

  beforeAll(async () => {
    testData = await createTestData();
  });

  afterAll(async () => {
    await cleanTestData();
  });

  test('deve conectar com banco de dados', async () => {
    expect.assertions(1);
    
    // Teste simples para verificar conexão
    const userCount = await User.count();
    expect(typeof userCount).toBe('number');
    expect(userCount).toBeGreaterThan(0);
  });

  test('modelos devem estar definidos', () => {
    expect(User).toBeDefined();
    expect(Product).toBeDefined();
    expect(Category).toBeDefined();
  });

  test('deve ter dados de teste', async () => {
    const userCount = await User.count();
    const categoryCount = await Category.count();
    const productCount = await Product.count();

    expect(userCount).toBeGreaterThan(0);
    expect(categoryCount).toBeGreaterThan(0);
    expect(productCount).toBeGreaterThan(0);
  });

  test('deve encontrar usuário admin', async () => {
    const admin = await User.findOne({ where: { email: 'admin@artetradicao.com.br' } });
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('admin');
    expect(admin.is_active).toBe(true);
  });

  test('deve encontrar produtos com categorias', async () => {
    const products = await Product.findAll({
      include: [{ model: Category, as: 'category' }]
    });

    expect(products.length).toBeGreaterThan(0);
    
    // Verificar se pelo menos um produto tem categoria
    const productWithCategory = products.find(p => p.category);
    expect(productWithCategory).toBeTruthy();
  });
});
