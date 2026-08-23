/**
 * Script untuk mengganti username & password admin Bless Canteen
 * 
 * Cara menjalankan:
 * npx tsx scripts/change-admin-credentials.ts
 * 
 * Atau dengan parameter:
 * npx tsx scripts/change-admin-credentials.ts --username=adminbaru --password=passwordbaru
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Default values
let newUsername = 'BlessCanteenAdmin';
let newPassword = '231200Imanuel';

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--username' && args[i + 1]) {
    newUsername = args[i + 1];
    i++;
  }
  if (args[i] === '--password' && args[i + 1]) {
    newPassword = args[i + 1];
    i++;
  }
}

async function main() {
  console.log('🔐 Mengubah kredensial admin...\n');
  
  // Hash password baru
  const hashedPassword = await hash(newPassword, 10);
  
  try {
    // Cek apakah admin sudah ada
    const existingAdmin = await prisma.admin.findFirst();
    
    if (existingAdmin) {
      // Update admin yang ada
      const updated = await prisma.admin.update({
        where: { id: existingAdmin.id },
        data: {
          username: newUsername,
          password: hashedPassword
        }
      });
      
      console.log('✅ Kredensial admin berhasil diupdate!');
      console.log(`\n📋 Detail Login Baru:`);
      console.log(`   🆔 Username: ${updated.username}`);
      console.log(`   🔑 Password: ${newPassword}`);
      console.log(`   👤 Nama: ${updated.name}`);
      console.log(`\n⚠️  Simpan informasi ini dengan aman!`);
      
    } else {
      // Buat admin baru jika belum ada
      const created = await prisma.admin.create({
        data: {
          username: newUsername,
          password: hashedPassword,
          name: 'Administrator',
          role: 'admin'
        }
      });
      
      console.log('✅ Admin baru berhasil dibuat!');
      console.log(`\n📋 Detail Login:`);
      console.log(`   🆔 Username: ${created.username}`);
      console.log(`   🔑 Password: ${newPassword}`);
      console.log(`\n⚠️  Simpan informasi ini dengan aman!`);
    }
    
    // Tampilkan semua admin di database
    const allAdmins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`\n📊 Semua Admin di Database (${allAdmins.length}):`);
    allAdmins.forEach((admin, idx) => {
      console.log(`   ${idx + 1}. ${admin.username} (${admin.name}) - dibuat ${admin.createdAt.toLocaleDateString('id-ID')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
