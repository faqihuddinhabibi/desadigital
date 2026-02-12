import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://desadigital:secret@localhost:5432/desadigital';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'superadmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA === 'true';

const hashOptions = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

async function seed() {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  // ── Always create superadmin (skip if exists) ──

  const [existingAdmin] = await db.select().from(schema.users).where(eq(schema.users.role, 'superadmin')).limit(1);

  let superadminId: string;

  if (existingAdmin) {
    console.log('ℹ️  Superadmin already exists:', existingAdmin.username);
    superadminId = existingAdmin.id;
  } else {
    const passwordHash = await hash(ADMIN_PASSWORD, hashOptions);

    const [superadmin] = await db.insert(schema.users).values({
      username: ADMIN_USERNAME,
      passwordHash,
      name: ADMIN_NAME,
      role: 'superadmin',
      isActive: true,
    }).returning();

    superadminId = superadmin.id;
    console.log(`✅ Created superadmin: ${superadmin.username} (password: ${ADMIN_PASSWORD})`);
  }

  // ── Demo data (optional) ──

  if (!SEED_DEMO_DATA) {
    console.log('ℹ️  SEED_DEMO_DATA=false — skipping demo data');
    console.log('🎉 Seed completed!');
    await client.end();
    process.exit(0);
  }

  const [existingDesa] = await db.select().from(schema.desas).limit(1);
  if (existingDesa) {
    console.log('ℹ️  Demo data already exists — skipping');
    console.log('🎉 Seed completed!');
    await client.end();
    process.exit(0);
  }

  const [desa1] = await db.insert(schema.desas).values({
    name: 'Desa Sukamaju',
    address: 'Jl. Raya Sukamaju No. 1',
  }).returning();

  const [desa2] = await db.insert(schema.desas).values({
    name: 'Desa Mekarjaya',
    address: 'Jl. Raya Mekarjaya No. 1',
  }).returning();

  console.log('✅ Created desas:', desa1.name, desa2.name);

  const [rt1] = await db.insert(schema.rts).values({
    desaId: desa1.id,
    name: 'RT 01',
    rtNumber: 1,
    rwNumber: 1,
  }).returning();

  const [rt2] = await db.insert(schema.rts).values({
    desaId: desa1.id,
    name: 'RT 02',
    rtNumber: 2,
    rwNumber: 1,
  }).returning();

  await db.insert(schema.rts).values({
    desaId: desa2.id,
    name: 'RT 01',
    rtNumber: 1,
    rwNumber: 1,
  });

  console.log('✅ Created RTs');

  const adminRtHash = await hash('AdminRT123!', hashOptions);

  await db.insert(schema.users).values({
    username: 'adminrt01',
    passwordHash: adminRtHash,
    name: 'Admin RT 01 Sukamaju',
    role: 'admin_rt',
    rtId: rt1.id,
    isActive: true,
  });

  const wargaHash = await hash('Warga123!', hashOptions);

  await db.insert(schema.users).values({
    username: 'warga01',
    passwordHash: wargaHash,
    name: 'Warga RT 01',
    role: 'warga',
    rtId: rt1.id,
    isActive: true,
  });

  console.log('✅ Created demo users (adminrt01, warga01)');

  await db.insert(schema.cameras).values([
    {
      rtId: rt1.id,
      name: 'Kamera Pos RT 01',
      rtspUrl: 'rtsp://admin:admin123@192.168.1.100:554/stream1',
      location: 'Pos RT 01 Sukamaju',
      status: 'offline',
      createdById: superadminId,
    },
    {
      rtId: rt1.id,
      name: 'Kamera Jalan Utama RT 01',
      rtspUrl: 'rtsp://admin:admin123@192.168.1.101:554/stream1',
      location: 'Jalan Utama RT 01',
      status: 'offline',
      createdById: superadminId,
    },
    {
      rtId: rt2.id,
      name: 'Kamera Pos RT 02',
      rtspUrl: 'rtsp://admin:admin123@192.168.1.102:554/stream1',
      location: 'Pos RT 02 Sukamaju',
      status: 'offline',
      createdById: superadminId,
    },
  ]);

  console.log('✅ Created demo cameras');

  console.log('🎉 Seed completed successfully!');
  
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
