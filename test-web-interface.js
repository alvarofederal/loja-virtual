import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testWebInterface() {
  try {
    console.log('🔍 Testando interface web do carrossel...');
    
    // Testar se a aplicação está rodando
    console.log('\n🌐 Verificando se a aplicação está rodando...');
    const response = await fetch('http://localhost:3000');
    console.log(`Status da aplicação: ${response.status}`);
    
    if (response.status !== 200) {
      console.log('❌ Aplicação não está rodando corretamente');
      return;
    }
    
    // Testar acesso ao formulário de produtos
    console.log('\n📝 Testando acesso ao formulário de produtos...');
    const formResponse = await fetch('http://localhost:3000/admin/products/new');
    console.log(`Status do formulário: ${formResponse.status}`);
    
    if (formResponse.status === 200) {
      const formHtml = await formResponse.text();
      
      // Verificar se o campo de múltiplas imagens está presente
      if (formHtml.includes('name="product_images"')) {
        console.log('✅ Campo de múltiplas imagens encontrado no formulário');
      } else {
        console.log('❌ Campo de múltiplas imagens NÃO encontrado no formulário');
      }
      
      // Verificar se o JavaScript de preview está presente
      if (formHtml.includes('imagePreview')) {
        console.log('✅ JavaScript de preview encontrado');
      } else {
        console.log('❌ JavaScript de preview NÃO encontrado');
      }
      
      // Verificar se há validação de máximo 3 imagens
      if (formHtml.includes('files.length > 3')) {
        console.log('✅ Validação de máximo 3 imagens encontrada');
      } else {
        console.log('❌ Validação de máximo 3 imagens NÃO encontrada');
      }
    } else {
      console.log('❌ Não foi possível acessar o formulário');
    }
    
    // Testar rotas de imagem
    console.log('\n🖼️ Testando rotas de imagem...');
    
    // Testar rota de imagem 1
    try {
      const img1Response = await fetch('http://localhost:3000/admin/products/d99fe58c-39d9-4be4-8b84-3bb676bfcb77/image');
      console.log(`Rota imagem 1: ${img1Response.status}`);
    } catch (error) {
      console.log(`Rota imagem 1: ❌ Erro - ${error.message}`);
    }
    
    // Testar rota de imagem 2
    try {
      const img2Response = await fetch('http://localhost:3000/admin/products/d99fe58c-39d9-4be4-8b84-3bb676bfcb77/image/2');
      console.log(`Rota imagem 2: ${img2Response.status}`);
    } catch (error) {
      console.log(`Rota imagem 2: ❌ Erro - ${error.message}`);
    }
    
    // Testar rota de imagem 3
    try {
      const img3Response = await fetch('http://localhost:3000/admin/products/d99fe58c-39d9-4be4-8b84-3bb676bfcb77/image/3');
      console.log(`Rota imagem 3: ${img3Response.status}`);
    } catch (error) {
      console.log(`Rota imagem 3: ❌ Erro - ${error.message}`);
    }
    
    // Testar rotas públicas
    console.log('\n🌍 Testando rotas públicas...');
    
    try {
      const publicImg1Response = await fetch('http://localhost:3000/products/d99fe58c-39d9-4be4-8b84-3bb676bfcb77/image');
      console.log(`Rota pública imagem 1: ${publicImg1Response.status}`);
    } catch (error) {
      console.log(`Rota pública imagem 1: ❌ Erro - ${error.message}`);
    }
    
    try {
      const publicImg2Response = await fetch('http://localhost:3000/products/d99fe58c-39d9-4be4-8b84-3bb676bfcb77/image/2');
      console.log(`Rota pública imagem 2: ${publicImg2Response.status}`);
    } catch (error) {
      console.log(`Rota pública imagem 2: ❌ Erro - ${error.message}`);
    }
    
    try {
      const publicImg3Response = await fetch('http://localhost:3000/products/d99fe58c-39d9-4be4-8b84-3bb676bfcb77/image/3');
      console.log(`Rota pública imagem 3: ${publicImg3Response.status}`);
    } catch (error) {
      console.log(`Rota pública imagem 3: ❌ Erro - ${error.message}`);
    }
    
    console.log('\n✅ Teste da interface web concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testWebInterface();
