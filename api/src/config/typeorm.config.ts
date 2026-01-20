import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '..', '..', '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'conference',
  entities: [join(__dirname, '..', '**', '*.entity.ts')],
  migrations: [join(__dirname, '..', 'migrations', '*.ts')],
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === 'development',
});
