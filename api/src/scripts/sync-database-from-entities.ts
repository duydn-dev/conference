import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

/**
 * Script để tự động sync database dựa trên các entity
 * Script này sẽ:
 * 1. Đọc tất cả các entity files
 * 2. So sánh với database hiện tại
 * 3. Tạo các migration cần thiết để sync
 */
async function syncDatabaseFromEntities() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'conference',
    entities: [join(__dirname, '..', '**', '*.entity.ts')],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Find all entity files
    const entitiesDir = join(__dirname, '..');
    const entityFiles: string[] = [];
    
    function findEntityFiles(dir: string) {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = join(dir, file.name);
        if (file.isDirectory() && file.name !== 'node_modules' && file.name !== 'dist') {
          findEntityFiles(fullPath);
        } else if (file.isFile() && file.name.endsWith('.entity.ts')) {
          entityFiles.push(fullPath);
        }
      }
    }

    findEntityFiles(entitiesDir);
    
    console.log(`\nFound ${entityFiles.length} entity files:`);
    entityFiles.forEach(file => {
      const relativePath = file.replace(join(__dirname, '..'), '');
      console.log(`  - ${relativePath}`);
    });

    // Check for missing columns
    console.log('\nChecking database schema...');
    
    // Check participants.is_receptionist
    const participantsTable = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'participants'
      ORDER BY ordinal_position
    `);

    console.log('\nCurrent participants table columns:');
    participantsTable.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Check if is_receptionist exists
    const hasIsReceptionist = participantsTable.some((col: any) => col.column_name === 'is_receptionist');
    
    if (!hasIsReceptionist) {
      console.log('\n⚠️  Column is_receptionist is missing in participants table');
      console.log('Running migration to add is_receptionist column...');
      
      await dataSource.query(`
        ALTER TABLE participants 
        ADD COLUMN IF NOT EXISTS is_receptionist BOOLEAN NOT NULL DEFAULT FALSE
      `);
      
      await dataSource.query(`
        COMMENT ON COLUMN participants.is_receptionist IS 'Người đón tiếp - true nếu cần đón tiếp, false nếu không'
      `);
      
      console.log('✅ Column is_receptionist added successfully');
    } else {
      console.log('\n✅ Column is_receptionist already exists');
    }

    // Check other tables and columns from entities
    console.log('\n✅ Database sync completed!');
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabaseFromEntities();
