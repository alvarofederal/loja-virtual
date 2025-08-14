import { User, Category, Product } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const createTestData = async () => {
  try {
    // Criar usuário admin de teste
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin de Teste',
      email: 'admin@artetradicao.com.br',
      password: hashedPassword,
      role: 'admin',
      is_active: true
    });

    // Criar algumas categorias de teste
    const category1 = await Category.create({
      name: 'Decoração',
      slug: 'decoracao',
      description: 'Produtos de decoração artesanal',
      is_active: true
    });

    const category2 = await Category.create({
      name: 'Utensílios',
      slug: 'utensilios',
      description: 'Utensílios domésticos artesanais',
      is_active: true
    });

    // Criar alguns produtos de teste
    const product1 = await Product.create({
      name: 'Vaso de Cerâmica',
      slug: 'vaso-de-ceramica',
      description: 'Lindo vaso de cerâmica feito à mão',
      price: 89.90,
      compare_price: 120.00,
      sku: 'VASO-001',
      stock_quantity: 15,
      category_id: category1.id,
      is_active: true,
      is_featured: true,
      is_bestseller: false
    });

    const product2 = await Product.create({
      name: 'Jogo de Bowls',
      slug: 'jogo-de-bowls',
      description: 'Set de bowls artesanais em madeira',
      price: 65.00,
      compare_price: 85.00,
      sku: 'BOWL-001',
      stock_quantity: 8,
      category_id: category2.id,
      is_active: true,
      is_featured: false,
      is_bestseller: true
    });

    const product3 = await Product.create({
      name: 'Quadro Decorativo',
      slug: 'quadro-decorativo',
      description: 'Quadro decorativo pintado à mão',
      price: 120.00,
      sku: 'QUADRO-001',
      stock_quantity: 5,
      category_id: category1.id,
      is_active: true,
      is_featured: true,
      is_bestseller: true
    });

    console.log('✅ Dados de teste criados com sucesso');
    
    return {
      adminUser,
      categories: [category1, category2],
      products: [product1, product2, product3]
    };

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    throw error;
  }
};

export const cleanTestData = async () => {
  try {
    // Remover dados de teste (na ordem correta para evitar problemas de FK)
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    console.log('✅ Dados de teste removidos');
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error);
  }
};
