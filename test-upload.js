import { Product } from './models/index.js';
import sequelize from './config/database.js';

async function testUpload() {
  try {
    // Testar conexão com o banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Buscar um produto para testar
    const product = await Product.findOne();
    
    if (product) {
      console.log('Produto encontrado:', product.name);
      console.log('Tem imagem 1:', !!product.image);
      console.log('Tem imagem 2:', !!product.image_2);
      console.log('Tem imagem 3:', !!product.image_3);
      console.log('Tipo imagem 1:', product.image_type);
      console.log('Tipo imagem 2:', product.image_2_type);
      console.log('Tipo imagem 3:', product.image_3_type);
    } else {
      console.log('Nenhum produto encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testUpload();
