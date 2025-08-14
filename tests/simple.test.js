import { User, Product, Category } from '../models/index.js';
import sequelize from '../config/database.js';

describe('Teste Simples das Funcionalidades', () => {
  
  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Conectado para testes');
    } catch (error) {
      console.error('❌ Erro de conexão:', error.message);
    }
  });

  afterAll(async () => {
    try {
      await sequelize.close();
      console.log('✅ Conexão fechada');
    } catch (error) {
      console.error('❌ Erro ao fechar:', error.message);
    }
  });

  test('deve conectar com banco de dados', async () => {
    const result = await sequelize.query('SELECT 1 as test');
    expect(result[0][0].test).toBe(1);
  });

  test('modelos devem estar definidos', () => {
    expect(User).toBeDefined();
    expect(Product).toBeDefined();
    expect(Category).toBeDefined();
  });

  test('deve contar registros existentes', async () => {
    const userCount = await User.count();
    const categoryCount = await Category.count();
    const productCount = await Product.count();
    
    expect(typeof userCount).toBe('number');
    expect(typeof categoryCount).toBe('number');
    expect(typeof productCount).toBe('number');
    
    console.log(`📊 Dados encontrados - Usuários: ${userCount}, Categorias: ${categoryCount}, Produtos: ${productCount}`);
  });

  test('deve encontrar admin', async () => {
    const admin = await User.findOne({ where: { role: 'admin' } });
    expect(admin).toBeTruthy();
    expect(admin.email).toBe('admin@artetradicao.com.br');
  });

  test('deve criar produto com slug automático', async () => {
    const category = await Category.findOne();
    if (!category) {
      console.log('⚠️ Nenhuma categoria encontrada, pulando teste');
      return;
    }

    const testProduct = await Product.create({
      name: 'Produto Teste Automatizado',
      description: 'Teste de criação automática de slug',
      price: 99.99,
      sku: `TEST-${Date.now()}`,
      stock_quantity: 1,
      category_id: category.id,
      is_active: true
    });

    expect(testProduct.slug).toBeTruthy();
    expect(testProduct.slug).toBe('produto-teste-automatizado');
    
    // Limpar
    await testProduct.destroy();
  });

  test('deve validar funcionamento geral', async () => {
    // Teste integrado simples
    const stats = {
      users: await User.count(),
      categories: await Category.count(), 
      products: await Product.count(),
      activeProducts: await Product.count({ where: { is_active: true } }),
      featuredProducts: await Product.count({ where: { is_featured: true } })
    };

    expect(stats.users).toBeGreaterThan(0);
    expect(stats.categories).toBeGreaterThan(0);
    expect(stats.products).toBeGreaterThan(0);
    
    console.log('🎉 Estatísticas finais:', stats);
  });
});
