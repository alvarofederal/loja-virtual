#!/usr/bin/env node
/**
 * 🚀 SCRIPT ÚNICO DE INICIALIZAÇÃO DO BANCO DE DADOS
 * Loja Virtual Arte & Tradição
 * 
 * Este é o ÚNICO script necessário para configurar todo o banco de dados.
 * Criação, migração, dados iniciais - tudo em um só lugar!
 */

import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const CONFIG = {
  adminEmail: 'admin@artetradicao.com.br',
  adminPassword: 'admin123',
  dropExisting: true, // true = apaga tabelas existentes, false = mantém dados
  verbose: true
};

/**
 * 🗑️ Limpar banco de dados existente
 */
const cleanDatabase = async () => {
  if (!CONFIG.dropExisting) return;
  
  console.log('🗑️ Removendo tabelas existentes...');
  
  try {
    await sequelize.query('DROP TABLE IF EXISTS "OrderItem" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Order" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "ProductImage" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Product" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "Category" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "User" CASCADE;');
    
    console.log('✅ Tabelas antigas removidas');
  } catch (error) {
    console.log('ℹ️ Nenhuma tabela para remover (primeira execução)');
  }
};

/**
 * 🏗️ Criar estrutura das tabelas
 */
const createTables = async () => {
  console.log('🏗️ Criando estrutura das tabelas...');
  
  // Tabela Users
  await sequelize.query(`
    CREATE TABLE "User" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(100) NOT NULL,
      "email" VARCHAR(100) NOT NULL UNIQUE,
      "password" VARCHAR(255) NOT NULL,
      "role" VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      "phone" VARCHAR(20),
      "address" TEXT,
      "city" VARCHAR(100),
      "state" VARCHAR(50),
      "zip_code" VARCHAR(10),
      "is_active" BOOLEAN DEFAULT true,
      "email_verified" BOOLEAN DEFAULT false,
      "reset_token" VARCHAR(255),
      "reset_token_expires" TIMESTAMP WITH TIME ZONE,
      "last_login" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela User criada');
  
  // Tabela Categories
  await sequelize.query(`
    CREATE TABLE "Category" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(100) NOT NULL UNIQUE,
      "slug" VARCHAR(100) UNIQUE,
      "description" TEXT,
      "image" VARCHAR(255),
      "is_active" BOOLEAN DEFAULT true,
      "sort_order" INTEGER DEFAULT 0,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela Category criada');
  
  // Tabela Products
  await sequelize.query(`
    CREATE TABLE "Product" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" VARCHAR(200) NOT NULL,
      "slug" VARCHAR(200) UNIQUE,
      "description" TEXT,
      "short_description" TEXT,
      "price" DECIMAL(10,2) NOT NULL CHECK (price >= 0),
      "compare_price" DECIMAL(10,2) CHECK (compare_price >= 0),
      "cost_price" DECIMAL(10,2) CHECK (cost_price >= 0),
      "sku" VARCHAR(100) UNIQUE,
      "stock_quantity" INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
      "weight" DECIMAL(8,2),
      "dimensions" VARCHAR(50),
      "is_active" BOOLEAN DEFAULT true,
      "is_featured" BOOLEAN DEFAULT false,
      "is_bestseller" BOOLEAN DEFAULT false,
      "meta_title" VARCHAR(60),
      "meta_description" VARCHAR(160),
      "sort_order" INTEGER DEFAULT 0,
      "category_id" UUID REFERENCES "Category"("id") ON DELETE SET NULL,
      "image" BYTEA,
      "image_type" VARCHAR(50),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela Product criada');
  
  // Tabela Orders
  await sequelize.query(`
    CREATE TABLE "Order" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" UUID REFERENCES "User"("id") ON DELETE SET NULL,
      "customer_name" VARCHAR(100) NOT NULL,
      "customer_email" VARCHAR(100) NOT NULL,
      "customer_phone" VARCHAR(20),
      "shipping_address" TEXT NOT NULL,
      "shipping_city" VARCHAR(100) NOT NULL,
      "shipping_state" VARCHAR(50) NOT NULL,
      "shipping_zip_code" VARCHAR(10) NOT NULL,
      "billing_address" TEXT,
      "subtotal" DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
      "shipping_cost" DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
      "tax_amount" DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
      "total_amount" DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
      "status" VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
      "payment_method" VARCHAR(50),
      "payment_status" VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      "payment_id" VARCHAR(255),
      "notes" TEXT,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela Order criada');
  
  // Tabela OrderItems
  await sequelize.query(`
    CREATE TABLE "OrderItem" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "order_id" UUID NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
      "product_id" UUID REFERENCES "Product"("id") ON DELETE SET NULL,
      "product_name" VARCHAR(200) NOT NULL,
      "product_sku" VARCHAR(100),
      "quantity" INTEGER NOT NULL CHECK (quantity > 0),
      "unit_price" DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
      "total_price" DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela OrderItem criada');
  
  // Criar índices para performance
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_category_slug ON "Category"(slug);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_product_sku ON "Product"(sku);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_product_active ON "Product"(is_active);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_product_featured ON "Product"(is_featured);');
  await sequelize.query('CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);');
  
  console.log('✅ Índices criados para performance');
};

/**
 * 👑 Criar usuário administrador
 */
const createAdmin = async () => {
  console.log('👑 Criando usuário administrador...');
  
  const hashedPassword = await bcrypt.hash(CONFIG.adminPassword, 12);
  
  const [existing] = await sequelize.query(
    'SELECT id FROM "User" WHERE email = ?',
    { replacements: [CONFIG.adminEmail] }
  );
  
  if (existing.length > 0) {
    console.log('ℹ️ Admin já existe, atualizando senha...');
    await sequelize.query(
      'UPDATE "User" SET password = ?, role = ?, is_active = true, updated_at = NOW() WHERE email = ?',
      { replacements: [hashedPassword, 'admin', CONFIG.adminEmail] }
    );
  } else {
    await sequelize.query(`
      INSERT INTO "User" (name, email, password, role, is_active, phone, created_at, updated_at) 
      VALUES (?, ?, ?, 'admin', true, ?, NOW(), NOW())
    `, {
      replacements: ['Administrador', CONFIG.adminEmail, hashedPassword, '11999887766']
    });
  }
  
  console.log(`✅ Admin criado: ${CONFIG.adminEmail}`);
};

/**
 * 📁 Criar categorias iniciais
 */
const createCategories = async () => {
  console.log('📁 Criando categorias...');
  
  const categories = [
    {
      name: 'Decoração',
      slug: 'decoracao',
      description: 'Produtos decorativos artesanais para sua casa',
      sort_order: 1
    },
    {
      name: 'Utensílios',
      slug: 'utensilios',
      description: 'Utensílios domésticos únicos e funcionais',
      sort_order: 2
    },
    {
      name: 'Arte',
      slug: 'arte',
      description: 'Peças de arte exclusivas feitas à mão',
      sort_order: 3
    },
    {
      name: 'Cerâmica',
      slug: 'ceramica',
      description: 'Produtos em cerâmica tradicional brasileira',
      sort_order: 4
    },
    {
      name: 'Madeira',
      slug: 'madeira',
      description: 'Artigos únicos em madeira natural',
      sort_order: 5
    }
  ];
  
  for (const category of categories) {
    await sequelize.query(`
      INSERT INTO "Category" (name, slug, description, is_active, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, true, ?, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `, {
      replacements: [category.name, category.slug, category.description, category.sort_order]
    });
  }
  
  console.log(`✅ ${categories.length} categorias criadas/atualizadas`);
};

/**
 * 📦 Criar produtos de demonstração
 */
const createProducts = async () => {
  console.log('📦 Criando produtos de demonstração...');
  
  // Buscar IDs das categorias
  const [categories] = await sequelize.query('SELECT id, slug FROM "Category" ORDER BY sort_order');
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });
  
  const products = [
    {
      name: 'Vaso de Cerâmica Artesanal Grande',
      slug: 'vaso-ceramica-artesanal-grande',
      description: 'Lindo vaso de cerâmica feito à mão por artistas locais. Design único com acabamento rústico que combina com qualquer ambiente. Ideal para plantas médias e grandes.',
      short_description: 'Vaso artesanal em cerâmica com design único',
      price: 89.90,
      compare_price: 120.00,
      sku: 'VASO-CER-001',
      stock_quantity: 15,
      category_id: categoryMap['ceramica'],
      is_active: true,
      is_featured: true,
      is_bestseller: false,
      weight: 1.5,
      dimensions: '25x25x30cm'
    },
    {
      name: 'Conjunto de Bowls em Madeira Maciça',
      slug: 'conjunto-bowls-madeira-macica',
      description: 'Set de 4 bowls artesanais em madeira maciça de reflorestamento. Perfeitos para servir saladas, petiscos ou frutas. Cada peça é única.',
      short_description: 'Set de 4 bowls artesanais em madeira',
      price: 65.00,
      compare_price: 85.00,
      sku: 'BOWL-MAD-001',
      stock_quantity: 12,
      category_id: categoryMap['madeira'],
      is_active: true,
      is_featured: false,
      is_bestseller: true,
      weight: 0.8,
      dimensions: 'Ø15x6cm cada'
    },
    {
      name: 'Quadro Decorativo Pintado à Mão',
      slug: 'quadro-decorativo-pintado-mao',
      description: 'Obra de arte única pintada à mão em tela de algodão. Tema natureza com cores vibrantes que trazem vida para qualquer ambiente.',
      short_description: 'Arte original pintada à mão',
      price: 150.00,
      compare_price: 200.00,
      sku: 'QUAD-ART-001',
      stock_quantity: 5,
      category_id: categoryMap['arte'],
      is_active: true,
      is_featured: true,
      is_bestseller: true,
      weight: 0.5,
      dimensions: '40x30x2cm'
    },
    {
      name: 'Jogo de Pratos Rústicos em Cerâmica',
      slug: 'jogo-pratos-rusticos-ceramica',
      description: 'Conjunto de 6 pratos rasos em cerâmica rústica. Perfeitos para jantares especiais ou uso diário. Resistentes e fáceis de limpar.',
      short_description: 'Conjunto de 6 pratos em cerâmica rústica',
      price: 120.00,
      compare_price: 160.00,
      sku: 'PRATO-CER-001',
      stock_quantity: 8,
      category_id: categoryMap['ceramica'],
      is_active: true,
      is_featured: false,
      is_bestseller: false,
      weight: 2.0,
      dimensions: 'Ø26x2cm cada'
    },
    {
      name: 'Luminária Artesanal de Mesa',
      slug: 'luminaria-artesanal-mesa',
      description: 'Luminária única feita com materiais naturais. Base em madeira com cúpula em tecido natural. Cria uma atmosfera aconchegante.',
      short_description: 'Luminária artesanal com base em madeira',
      price: 95.00,
      compare_price: 130.00,
      sku: 'LUM-DEC-001',
      stock_quantity: 6,
      category_id: categoryMap['decoracao'],
      is_active: true,
      is_featured: true,
      is_bestseller: false,
      weight: 1.2,
      dimensions: '20x20x35cm'
    },
    {
      name: 'Tábua de Corte Premium em Madeira',
      slug: 'tabua-corte-premium-madeira',
      description: 'Tábua de corte em madeira nobre com design ergonômico. Acabamento premium com tratamento antibacteriano natural.',
      short_description: 'Tábua de corte premium em madeira nobre',
      price: 45.00,
      compare_price: 60.00,
      sku: 'TAB-UTN-001',
      stock_quantity: 20,
      category_id: categoryMap['utensilios'],
      is_active: true,
      is_featured: false,
      is_bestseller: true,
      weight: 0.6,
      dimensions: '35x25x2cm'
    }
  ];
  
  for (const product of products) {
    await sequelize.query(`
      INSERT INTO "Product" (
        name, slug, description, short_description, price, compare_price, 
        sku, stock_quantity, category_id, is_active, is_featured, is_bestseller,
        weight, dimensions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        stock_quantity = EXCLUDED.stock_quantity,
        updated_at = NOW()
    `, {
      replacements: [
        product.name, product.slug, product.description, product.short_description,
        product.price, product.compare_price, product.sku, product.stock_quantity,
        product.category_id, product.is_active, product.is_featured, product.is_bestseller,
        product.weight, product.dimensions
      ]
    });
  }
  
  console.log(`✅ ${products.length} produtos criados/atualizados`);
};

/**
 * 👥 Criar usuários de teste
 */
const createTestUsers = async () => {
  console.log('👥 Criando usuários de teste...');
  
  const userPassword = await bcrypt.hash('123456', 12);
  
  const users = [
    {
      name: 'Maria Silva Santos',
      email: 'maria@teste.com',
      phone: '11888777666',
      city: 'São Paulo',
      state: 'SP'
    },
    {
      name: 'João Carlos Oliveira',
      email: 'joao@teste.com',
      phone: '11777666555',
      city: 'Rio de Janeiro',
      state: 'RJ'
    },
    {
      name: 'Ana Paula Costa',
      email: 'ana@teste.com',
      phone: '11666555444',
      city: 'Belo Horizonte',
      state: 'MG'
    }
  ];
  
  for (const user of users) {
    await sequelize.query(`
      INSERT INTO "User" (name, email, password, role, is_active, phone, city, state, created_at, updated_at)
      VALUES (?, ?, ?, 'user', true, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        updated_at = NOW()
    `, {
      replacements: [user.name, user.email, userPassword, user.phone, user.city, user.state]
    });
  }
  
  console.log(`✅ ${users.length} usuários de teste criados/atualizados`);
};

/**
 * 📊 Exibir estatísticas finais
 */
const showStats = async () => {
  console.log('\n📊 ESTATÍSTICAS DO BANCO DE DADOS:');
  
  const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM "User"');
  const [categoryCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Category"');
  const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Product"');
  const [featuredCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Product" WHERE is_featured = true');
  const [bestsellerCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Product" WHERE is_bestseller = true');
  
  console.log(`👤 Usuários: ${userCount[0].count}`);
  console.log(`📁 Categorias: ${categoryCount[0].count}`);
  console.log(`📦 Produtos: ${productCount[0].count}`);
  console.log(`⭐ Em destaque: ${featuredCount[0].count}`);
  console.log(`🔥 Best sellers: ${bestsellerCount[0].count}`);
  
  console.log('\n🔑 CREDENCIAIS DE ACESSO:');
  console.log(`👑 Admin: ${CONFIG.adminEmail} / ${CONFIG.adminPassword}`);
  console.log('👤 Usuários de teste: maria@teste.com, joao@teste.com, ana@teste.com / 123456');
  
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. Execute: npm start');
  console.log('2. Acesse: http://localhost:3000');
  console.log('3. Faça login como admin e teste o CRUD');
  console.log('4. Execute os testes: npm test');
};

/**
 * 🚀 FUNÇÃO PRINCIPAL
 */
const setupDatabase = async () => {
  console.log('🚀 INICIALIZANDO BANCO DE DADOS - LOJA ARTE & TRADIÇÃO');
  console.log('='.repeat(60));
  
  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso');
    
    // Executar todas as etapas
    await cleanDatabase();
    await createTables();
    await createAdmin();
    await createCategories();
    await createProducts();
    await createTestUsers();
    await showStats();
    
    console.log('\n🎉 BANCO DE DADOS CONFIGURADO COM SUCESSO!');
    console.log('🎯 A loja está pronta para funcionar!');
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:');
    console.error('Tipo:', error.name);
    console.error('Mensagem:', error.message);
    
    if (CONFIG.verbose && error.original) {
      console.error('Detalhes:', error.original.message);
    }
    
    process.exit(1);
    
  } finally {
    await sequelize.close();
    console.log('\n💤 Conexão com banco fechada');
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase;
