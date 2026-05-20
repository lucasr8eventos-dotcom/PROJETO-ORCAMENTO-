-- Fix default role from 'operador' to 'operacional'
ALTER TABLE "usuarios" ALTER COLUMN "role" SET DEFAULT 'operacional';

-- Make OrdemServico.clienteId optional
ALTER TABLE "ordens_servico" ALTER COLUMN "clienteId" DROP NOT NULL;
