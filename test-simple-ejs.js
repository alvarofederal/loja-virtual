import ejs from 'ejs';
import fs from 'fs/promises';
import path from 'path';

async function testSimpleEjs() {
  try {
    console.log('🧪 Testando EJS simples...');
    
    // 1. Testar template simples
    console.log('\n📝 1. Testando template simples...');
    const simpleTemplate = '<h1>Teste EJS</h1><p>Olá <%= name %></p>';
    const result = ejs.render(simpleTemplate, { name: 'Mundo' });
    console.log('Resultado:', result);
    
    // 2. Testar arquivo real
    console.log('\n📄 2. Testando arquivo real...');
    const filePath = path.join(process.cwd(), 'views/admin/products/form.ejs');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    console.log(`Arquivo lido: ${fileContent.length} caracteres`);
    
    // 3. Tentar renderizar o arquivo
    console.log('\n🔄 3. Tentando renderizar o arquivo...');
    try {
      const rendered = ejs.render(fileContent, {
        product: null,
        categories: [],
        title: 'Teste'
      }, {
        root: path.join(process.cwd(), 'views')
      });
      console.log(`Renderizado com sucesso: ${rendered.length} caracteres`);
      
      // Verificar se o conteúdo está presente
      const checks = {
        productImages: rendered.includes('name="product_images"'),
        carouselTitle: rendered.includes('Carrossel de Imagens'),
        multiple: rendered.includes('multiple')
      };
      
      console.log('Verificações no resultado:');
      Object.entries(checks).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
      });
      
    } catch (error) {
      console.log('❌ Erro ao renderizar:', error.message);
      
      // Procurar por linha específica com erro
      if (error.message.includes('line')) {
        const lineMatch = error.message.match(/line (\d+)/);
        if (lineMatch) {
          const lineNumber = parseInt(lineMatch[1]);
          const lines = fileContent.split('\n');
          console.log(`\n🔍 Linha ${lineNumber}:`);
          console.log(lines[lineNumber - 1]);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testSimpleEjs();
