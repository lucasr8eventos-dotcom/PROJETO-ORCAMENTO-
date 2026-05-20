import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existe = await prisma.usuario.findUnique({ where: { email: 'admin@opsuite.com' } });
  if (existe) { console.log('Seed: admin já existe, pulando.'); return; }

  const hash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@opsuite.com',
      senha: hash,
      role: 'admin',
      ativo: true,
      criadoEm: new Date().toISOString().slice(0, 10),
    },
  });
  console.log('Seed: usuário admin criado — email: admin@opsuite.com | senha: admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
