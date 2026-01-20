import { DataSource } from 'typeorm';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

async function generateMigration() {
  const migrationName = process.argv[2] || 'SyncEntities';

  if (!migrationName) {
    console.error('Usage: npm run migration:generate -- <MigrationName>');
    process.exit(1);
  }

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
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Generate migration using TypeORM CLI
    const timestamp = Date.now();
    const migrationPath = join(__dirname, '..', 'migrations', `${timestamp}-${migrationName}.ts`);
    
    console.log(`Generating migration: ${migrationName}`);
    console.log(`Migration will be created at: ${migrationPath}`);

    // Use TypeORM CLI to generate migration
    const command = `npx typeorm migration:generate ${migrationPath} -d ${join(__dirname, '..', 'config', 'typeorm.config.ts')}`;
    
    console.log('Running:', command);
    execSync(command, { stdio: 'inherit' });

    console.log(`Migration generated successfully: ${migrationName}`);
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error generating migration:', error);
    process.exit(1);
  }
}

generateMigration();
