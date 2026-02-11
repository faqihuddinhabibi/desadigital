import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://desadigital:secret@localhost:5432/desadigital';

async function runMigrations() {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log('🔄 Running migrations...');
  
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('✅ Migrations completed!');
  
  await client.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
