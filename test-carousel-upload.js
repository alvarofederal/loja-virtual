import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { Product } from './models/index.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'dbarteetradicao',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function testCarouselUpload() {
  try {
    console.log('🔍 Testando upload do carrossel de produtos...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar estrutura da tabela Product
    console.log('\n📋 Verificando estrutura da tabela Product...');
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      AND column_name LIKE 'image%'
      ORDER BY column_name;
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('Colunas de imagem encontradas:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar produtos existentes com imagens
    console.log('\n🖼️ Verificando produtos com imagens...');
    const productsWithImages = await Product.findAll({
      where: {
        [Sequelize.Op.or]: [
          { image: { [Sequelize.Op.ne]: null } },
          { image_2: { [Sequelize.Op.ne]: null } },
          { image_3: { [Sequelize.Op.ne]: null } }
        ]
      },
      attributes: ['id', 'name', 'image', 'image_type', 'image_2', 'image_2_type', 'image_3', 'image_3_type']
    });
    
    console.log(`Encontrados ${productsWithImages.length} produtos com imagens:`);
    productsWithImages.forEach(product => {
      console.log(`\n  Produto: ${product.name} (ID: ${product.id})`);
      console.log(`    - Imagem 1: ${product.image ? 'Sim' : 'Não'} (${product.image_type || 'N/A'})`);
      console.log(`    - Imagem 2: ${product.image_2 ? 'Sim' : 'Não'} (${product.image_2_type || 'N/A'})`);
      console.log(`    - Imagem 3: ${product.image_3 ? 'Sim' : 'Não'} (${product.image_3_type || 'N/A'})`);
    });
    
    // Testar método getImages() se existir
    if (productsWithImages.length > 0) {
      console.log('\n🧪 Testando método getImages()...');
      const testProduct = productsWithImages[0];
      
      if (typeof testProduct.getImages === 'function') {
        const images = testProduct.getImages();
        console.log('Método getImages() retornou:', images);
      } else {
        console.log('❌ Método getImages() não encontrado no modelo Product');
      }
    }
    
    // Verificar se há produtos sem imagens para teste
    console.log('\n🔍 Verificando produtos sem imagens para teste...');
    const productsWithoutImages = await Product.findAll({
      where: {
        image: null,
        image_2: null,
        image_3: null
      },
      limit: 3
    });
    
    console.log(`Encontrados ${productsWithoutImages.length} produtos sem imagens`);
    if (productsWithoutImages.length > 0) {
      console.log('Produtos disponíveis para teste:');
      productsWithoutImages.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id})`);
      });
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await sequelize.close();
  }
}

testCarouselUpload();
