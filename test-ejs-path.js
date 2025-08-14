import ejs from 'ejs';
import fs from 'fs/promises';
import path from 'path';

async function testEjsPath() {
  try {
    console.log('🔍 Testando caminhos do EJS...');
    
    // Verificar se o arquivo existe
    const headerPath = path.join(process.cwd(), 'views', 'partials', 'admin-header.ejs');
    const formPath = path.join(process.cwd(), 'views', 'admin', 'products', 'form.ejs');
    
    console.log('\n📄 Verificando arquivos:');
    console.log(`Header path: ${headerPath}`);
    console.log(`Form path: ${formPath}`);
    
    try {
      await fs.access(headerPath);
      console.log('✅ admin-header.ejs existe');
    } catch (error) {
      console.log('❌ admin-header.ejs NÃO existe');
    }
    
    try {
      await fs.access(formPath);
      console.log('✅ form.ejs existe');
    } catch (error) {
      console.log('❌ form.ejs NÃO existe');
    }
    
    // Testar include simples
    console.log('\n🧪 Testando include simples...');
    const simpleTemplate = '<%- include("partials/admin-header") %>';
    
    try {
      const result = ejs.render(simpleTemplate, {}, {
        root: path.join(process.cwd(), 'views')
      });
      console.log('✅ Include simples funcionou');
    } catch (error) {
      console.log('❌ Include simples falhou:', error.message);
    }
    
    // Testar include com caminho relativo
    console.log('\n🧪 Testando include com caminho relativo...');
    const relativeTemplate = '<%- include("../../partials/admin-header") %>';
    
    try {
      const result = ejs.render(relativeTemplate, {}, {
        root: path.join(process.cwd(), 'views', 'admin', 'products')
      });
      console.log('✅ Include relativo funcionou');
    } catch (error) {
      console.log('❌ Include relativo falhou:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testEjsPath();
