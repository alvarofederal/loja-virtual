import fetch from 'node-fetch';
import fs from 'fs/promises';

async function debugTemplate() {
  try {
    console.log('🔍 Debugando problema do template...');
    
    // 1. Verificar arquivo local
    console.log('\n📄 1. Verificando arquivo local...');
    const fileContent = await fs.readFile('views/admin/products/form.ejs', 'utf8');
    
    const localChecks = {
      productImages: fileContent.includes('name="product_images"'),
      carouselTitle: fileContent.includes('Carrossel de Imagens'),
      multiple: fileContent.includes('multiple'),
      imagePreview: fileContent.includes('imagePreview'),
      validation: fileContent.includes('files.length > 3')
    };
    
    console.log('Arquivo local:');
    Object.entries(localChecks).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
    });
    
    // 2. Verificar HTML servido
    console.log('\n🌐 2. Verificando HTML servido...');
    const formResponse = await fetch('http://localhost:3000/admin/products/new');
    const formHtml = await formResponse.text();
    
    const servedChecks = {
      productImages: formHtml.includes('name="product_images"'),
      carouselTitle: formHtml.includes('Carrossel de Imagens'),
      multiple: formHtml.includes('multiple'),
      imagePreview: formHtml.includes('imagePreview'),
      validation: formHtml.includes('files.length > 3')
    };
    
    console.log('HTML servido:');
    Object.entries(servedChecks).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
    });
    
    // 3. Comparar tamanhos
    console.log('\n📊 3. Comparando tamanhos...');
    console.log(`Arquivo local: ${fileContent.length} caracteres`);
    console.log(`HTML servido: ${formHtml.length} caracteres`);
    
    // 4. Procurar por diferenças específicas
    console.log('\n🔍 4. Procurando por seções específicas...');
    
    // Procurar por seção de imagens no arquivo local
    const localImageSection = fileContent.indexOf('Carrossel de Imagens');
    console.log(`Seção de carrossel no arquivo local: ${localImageSection !== -1 ? 'Encontrada' : 'NÃO encontrada'}`);
    
    // Procurar por seção de imagens no HTML servido
    const servedImageSection = formHtml.indexOf('Carrossel de Imagens');
    console.log(`Seção de carrossel no HTML servido: ${servedImageSection !== -1 ? 'Encontrada' : 'NÃO encontrada'}`);
    
    // 5. Mostrar trechos relevantes
    if (localImageSection !== -1) {
      console.log('\n📄 Trecho do arquivo local (carrossel):');
      const localTrecho = fileContent.substring(localImageSection, localImageSection + 200);
      console.log(localTrecho);
    }
    
    if (servedImageSection !== -1) {
      console.log('\n🌐 Trecho do HTML servido (carrossel):');
      const servedTrecho = formHtml.substring(servedImageSection, servedImageSection + 200);
      console.log(servedTrecho);
    } else {
      console.log('\n🌐 Procurando por seção de imagens no HTML servido...');
      const imageSection = formHtml.indexOf('Imagens');
      if (imageSection !== -1) {
        const trecho = formHtml.substring(imageSection, imageSection + 200);
        console.log(trecho);
      } else {
        console.log('❌ Nenhuma seção de imagens encontrada no HTML servido');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugTemplate();
