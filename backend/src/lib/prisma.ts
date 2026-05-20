import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shutdown = async (signal: string) => {
  console.log(`${signal} recebido — desconectando Prisma...`);
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default prisma;
