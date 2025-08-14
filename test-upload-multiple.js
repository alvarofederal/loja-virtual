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

async function testMultipleImageUpload() {
  try {
    console.log('🔍 Testando upload de múltiplas imagens...');
    
    // Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Criar um produto de teste com múltiplas imagens
    console.log('\n📝 Criando produto de teste com carrossel...');
    
    // Simular dados de arquivo (buffers de imagem)
    const image1Buffer = Buffer.from('fake-image-1-data');
    const image2Buffer = Buffer.from('fake-image-2-data');
    const image3Buffer = Buffer.from('fake-image-3-data');
    
    const testProduct = await Product.create({
      name: 'Produto Teste Carrossel',
      description: 'Produto para testar o carrossel de imagens',
      price: 99.99,
      sku: 'TEST-CAROUSEL-001',
      stock_quantity: 10,
      is_active: true,
      image: image1Buffer,
      image_type: 'image/jpeg',
      image_2: image2Buffer,
      image_2_type: 'image/png',
      image_3: image3Buffer,
      image_3_type: 'image/webp'
    });
    
    console.log(`✅ Produto criado com ID: ${testProduct.id}`);
    
    // Verificar se as imagens foram salvas
    console.log('\n🔍 Verificando imagens salvas...');
    const savedProduct = await Product.findByPk(testProduct.id);
    
    console.log('Status das imagens:');
    console.log(`  - Imagem 1: ${savedProduct.image ? '✅ Salva' : '❌ Não salva'} (${savedProduct.image_type})`);
    console.log(`  - Imagem 2: ${savedProduct.image_2 ? '✅ Salva' : '❌ Não salva'} (${savedProduct.image_2_type})`);
    console.log(`  - Imagem 3: ${savedProduct.image_3 ? '✅ Salva' : '❌ Não salva'} (${savedProduct.image_3_type})`);
    
    // Testar método getImages()
    console.log('\n🧪 Testando método getImages()...');
    if (typeof savedProduct.getImages === 'function') {
      const images = savedProduct.getImages();
      console.log(`Método retornou ${images.length} imagens:`);
      images.forEach((img, index) => {
        console.log(`  - Imagem ${index + 1}: ${img.type} (${img.data ? img.data.length : 0} bytes)`);
      });
    } else {
      console.log('❌ Método getImages() não encontrado');
    }
    
    // Testar método setImages()
    console.log('\n🧪 Testando método setImages()...');
    if (typeof savedProduct.setImages === 'function') {
      const newImages = [
        { buffer: Buffer.from('new-image-1'), mimetype: 'image/jpeg' },
        { buffer: Buffer.from('new-image-2'), mimetype: 'image/png' }
      ];
      
      savedProduct.setImages(newImages);
      await savedProduct.save();
      
      console.log('✅ Novas imagens definidas via setImages()');
      
      // Verificar se foram salvas
      const updatedProduct = await Product.findByPk(testProduct.id);
      console.log('Status após setImages():');
      console.log(`  - Imagem 1: ${updatedProduct.image ? '✅ Salva' : '❌ Não salva'} (${updatedProduct.image_type})`);
      console.log(`  - Imagem 2: ${updatedProduct.image_2 ? '✅ Salva' : '❌ Não salva'} (${updatedProduct.image_2_type})`);
      console.log(`  - Imagem 3: ${updatedProduct.image_3 ? '✅ Salva' : '❌ Não salva'} (${updatedProduct.image_3_type})`);
    } else {
      console.log('❌ Método setImages() não encontrado');
    }
    
    // Limpar produto de teste
    console.log('\n🧹 Limpando produto de teste...');
    await testProduct.destroy();
    console.log('✅ Produto de teste removido');
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await sequelize.close();
  }
}

testMultipleImageUpload();
