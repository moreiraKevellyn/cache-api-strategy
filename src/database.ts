import { Pool } from 'pg';
import { dbQueryDuration } from './cache/metrics';

class Database {
  private pool: Pool;

  constructor() {
    // Parse da connection string ou usar valores individuais
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/cache-api-strategy';

    this.pool = new Pool({
      connectionString,
      // Valores explícitos como fallback
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'cache-api-strategy',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('connect', () => {
      console.log('✅ Conectado ao PostgreSQL');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Erro no pool do PostgreSQL:', err);
    });
  }

  // Query com medição de tempo
  async query(text: string, params?: any[]) {
    const start = performance.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = (performance.now() - start) / 1000;
      dbQueryDuration.observe(duration);
      return result;
    } catch (error) {
      console.error('Erro na query:', error);
      throw error;
    }
  }

  // Fechar conexões
  async close() {
    await this.pool.end();
  }

  // Testar conexão
  async testConnection() {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('✅ Database conectado:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar database:', error);
      return false;
    }
  }
}

export const db = new Database();