import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { readdirSync } from 'fs';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'conference',
    entities: [join(__dirname, '..', '**', '*.entity.ts')],
    migrations: [join(__dirname, '..', 'migrations', '*.ts')],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Show pending migrations
    const migrationsDir = join(__dirname, '..', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') && !file.includes('.d.ts'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));

    // Run migrations
    console.log('\nRunning migrations...');
    await dataSource.runMigrations();

    console.log('All migrations completed successfully!');
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
