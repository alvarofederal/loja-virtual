import fetch from 'node-fetch';

async function forceReload() {
  try {
    console.log('🔄 Forçando recarga do template...');
    
    // Fazer várias requisições para forçar a recarga
    for (let i = 0; i < 3; i++) {
      console.log(`\n📝 Tentativa ${i + 1}: Acessando formulário...`);
      
      const formResponse = await fetch('http://localhost:3000/admin/products/new', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`Status: ${formResponse.status}`);
      
      if (formResponse.status === 200) {
        const formHtml = await formResponse.text();
        
        // Verificar elementos específicos
        const hasProductImages = formHtml.includes('name="product_images"');
        const hasCarouselTitle = formHtml.includes('Carrossel de Imagens');
        const hasMultiple = formHtml.includes('multiple');
        
        console.log(`  - Campo product_images: ${hasProductImages ? '✅' : '❌'}`);
        console.log(`  - Título do carrossel: ${hasCarouselTitle ? '✅' : '❌'}`);
        console.log(`  - Atributo multiple: ${hasMultiple ? '✅' : '❌'}`);
        
        if (hasProductImages && hasCarouselTitle && hasMultiple) {
          console.log('🎉 Template carregado corretamente!');
          break;
        }
      }
      
      // Aguardar um pouco entre as tentativas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Testar também acessando diretamente o arquivo
    console.log('\n📄 Verificando arquivo diretamente...');
    const fs = await import('fs/promises');
    
    try {
      const fileContent = await fs.readFile('views/admin/products/form.ejs', 'utf8');
      const hasProductImages = fileContent.includes('name="product_images"');
      const hasCarouselTitle = fileContent.includes('Carrossel de Imagens');
      const hasMultiple = fileContent.includes('multiple');
      
      console.log(`Arquivo local:`);
      console.log(`  - Campo product_images: ${hasProductImages ? '✅' : '❌'}`);
      console.log(`  - Título do carrossel: ${hasCarouselTitle ? '✅' : '❌'}`);
      console.log(`  - Atributo multiple: ${hasMultiple ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`❌ Erro ao ler arquivo: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

forceReload();
