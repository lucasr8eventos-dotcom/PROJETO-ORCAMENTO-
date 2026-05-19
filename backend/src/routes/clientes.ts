import { Router } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, clienteSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', asyncHandler(async (_req, res) => {
  const clientes = await prisma.cliente.findMany({ orderBy: { nome: 'asc' } });
  res.json(clientes);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const c = await prisma.cliente.findUnique({ where: { id: req.params.id } });
  if (!c) { res.status(404).json({ erro: 'Cliente não encontrado' }); return; }
  res.json(c);
}));

router.post('/', validar(clienteSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { nome, email, telefone, empresa, cnpj, cpf, endereco, criadoEm } = req.body;
  const c = await prisma.cliente.create({
    data: { nome, email, telefone, empresa, cnpj, cpf, endereco,
            criadoEm: criadoEm || new Date().toISOString().slice(0, 10) },
  });
  res.status(201).json(c);
}));

router.put('/:id', validar(clienteSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { nome, email, telefone, empresa, cnpj, cpf, endereco } = req.body;
  try {
    const c = await prisma.cliente.update({
      where: { id: req.params.id },
      data: { nome, email, telefone, empresa, cnpj, cpf, endereco },
    });
    res.json(c);
  } catch { res.status(404).json({ erro: 'Cliente não encontrado' }); }
}));

router.delete('/:id', apenasAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Cliente não encontrado' }); }
}));

export default router;
