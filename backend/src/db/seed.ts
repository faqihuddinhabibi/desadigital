import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';
import * as schema from './schema.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://desadigital:secret@localhost:5432/desadigital';

async function seed() {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  const passwordHash = await hash('Admin123!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const [superadmin] = await db.insert(schema.users).values({
    username: 'superadmin',
    passwordHash,
    name: 'Super Admin',
    role: 'superadmin',
    isActive: true,
  }).returning();

  console.log('✅ Created superadmin:', superadmin.username);

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

  const [rt3] = await db.insert(schema.rts).values({
    desaId: desa2.id,
    name: 'RT 01',
    rtNumber: 1,
    rwNumber: 1,
  }).returning();

  console.log('✅ Created RTs:', rt1.name, rt2.name, rt3.name);

  const adminRtHash = await hash('AdminRT123!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const [adminRt1] = await db.insert(schema.users).values({
    username: 'adminrt01',
    passwordHash: adminRtHash,
    name: 'Admin RT 01 Sukamaju',
    role: 'admin_rt',
    rtId: rt1.id,
    isActive: true,
  }).returning();

  console.log('✅ Created admin RT:', adminRt1.username);

  const wargaHash = await hash('Warga123!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const [warga1] = await db.insert(schema.users).values({
    username: 'warga01',
    passwordHash: wargaHash,
    name: 'Warga RT 01',
    role: 'warga',
    rtId: rt1.id,
    isActive: true,
  }).returning();

  console.log('✅ Created warga:', warga1.username);

  await db.insert(schema.cameras).values([
    {
      rtId: rt1.id,
      name: 'Kamera Pos RT 01',
      rtspUrl: 'rtsp://admin:admin123@192.168.1.100:554/stream1',
      location: 'Pos RT 01 Sukamaju',
      status: 'offline',
      createdById: superadmin.id,
    },
    {
      rtId: rt1.id,
      name: 'Kamera Jalan Utama RT 01',
      rtspUrl: 'rtsp://admin:admin123@192.168.1.101:554/stream1',
      location: 'Jalan Utama RT 01',
      status: 'offline',
      createdById: superadmin.id,
    },
    {
      rtId: rt2.id,
      name: 'Kamera Pos RT 02',
      rtspUrl: 'rtsp://admin:admin123@192.168.1.102:554/stream1',
      location: 'Pos RT 02 Sukamaju',
      status: 'offline',
      createdById: superadmin.id,
    },
  ]);

  console.log('✅ Created cameras');

  console.log('🎉 Seed completed successfully!');
  
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
