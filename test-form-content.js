import fetch from 'node-fetch';

async function testFormContent() {
  try {
    console.log('🔍 Verificando conteúdo específico do formulário...');
    
    // Testar acesso ao formulário de produtos
    const formResponse = await fetch('http://localhost:3000/admin/products/new');
    console.log(`Status do formulário: ${formResponse.status}`);
    
    if (formResponse.status === 200) {
      const formHtml = await formResponse.text();
      
      console.log('\n📋 Verificando elementos específicos:');
      
      // Verificar campo de múltiplas imagens
      const hasProductImages = formHtml.includes('name="product_images"');
      console.log(`Campo product_images: ${hasProductImages ? '✅ Encontrado' : '❌ NÃO encontrado'}`);
      
      // Verificar atributo multiple
      const hasMultiple = formHtml.includes('multiple');
      console.log(`Atributo multiple: ${hasMultiple ? '✅ Encontrado' : '❌ NÃO encontrado'}`);
      
      // Verificar JavaScript de preview
      const hasImagePreview = formHtml.includes('imagePreview');
      console.log(`JavaScript imagePreview: ${hasImagePreview ? '✅ Encontrado' : '❌ NÃO encontrado'}`);
      
      // Verificar validação
      const hasValidation = formHtml.includes('files.length > 3');
      console.log(`Validação files.length > 3: ${hasValidation ? '✅ Encontrado' : '❌ NÃO encontrado'}`);
      
      // Verificar título do carrossel
      const hasCarouselTitle = formHtml.includes('Carrossel de Imagens');
      console.log(`Título do carrossel: ${hasCarouselTitle ? '✅ Encontrado' : '❌ NÃO encontrado'}`);
      
      // Verificar texto de ajuda
      const hasHelpText = formHtml.includes('Máximo 3 imagens');
      console.log(`Texto de ajuda: ${hasHelpText ? '✅ Encontrado' : '❌ NÃO encontrado'}`);
      
      // Mostrar trecho relevante do HTML
      console.log('\n📄 Trecho relevante do HTML:');
      const startIndex = formHtml.indexOf('Carrossel de Imagens');
      if (startIndex !== -1) {
        const endIndex = startIndex + 500;
        const relevantHtml = formHtml.substring(startIndex, endIndex);
        console.log(relevantHtml);
      } else {
        console.log('❌ Seção do carrossel não encontrada no HTML');
      }
      
    } else {
      console.log('❌ Não foi possível acessar o formulário');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFormContent();
