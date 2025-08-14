import dotenv from 'dotenv';
import sequelize from '../config/database.js';

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
dotenv.config();

// Configurar banco de dados de teste
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados de teste estabelecida');
    
    // Sincronizar modelos na ordem correta (criar tabelas se não existirem)
    await sequelize.sync({ force: true, alter: true });
    console.log('✅ Modelos sincronizados com banco de teste');
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de teste:', error);
    throw error;
  }
});

// Limpar dados após cada teste
afterEach(async () => {
  // Opcional: limpar dados específicos se necessário
});

// Fechar conexão após todos os testes
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexão com banco de teste fechada');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
  }
});

// Configurações globais de timeout (removida devido a problema com módulos ES6)
// jest.setTimeout(30000);
