import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, AuthRequest } from '../middleware/auth';
import { validar, clienteSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const clientes = await prisma.cliente.findMany({ orderBy: { nome: 'asc' } });
  res.json(clientes);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const c = await prisma.cliente.findUnique({ where: { id: req.params.id } });
  if (!c) { res.status(404).json({ erro: 'Cliente não encontrado' }); return; }
  res.json(c);
});

router.post('/', validar(clienteSchema), async (req: AuthRequest, res: Response) => {
  const { id, nome, email, telefone, empresa, cnpj, cpf, endereco, criadoEm } = req.body;
  try {
    const c = await prisma.cliente.create({
      data: { ...(id ? { id } : {}), nome, email, telefone, empresa, cnpj, cpf, endereco,
              criadoEm: criadoEm || new Date().toISOString().slice(0, 10) },
    });
    res.status(201).json(c);
  } catch (e: any) { res.status(500).json({ erro: e.message || 'Erro ao criar cliente' }); }
});

router.put('/:id', validar(clienteSchema), async (req: AuthRequest, res: Response) => {
  const { nome, email, telefone, empresa, cnpj, cpf, endereco } = req.body;
  try {
    const c = await prisma.cliente.update({
      where: { id: req.params.id },
      data: { nome, email, telefone, empresa, cnpj, cpf, endereco },
    });
    res.json(c);
  } catch { res.status(404).json({ erro: 'Cliente não encontrado' }); }
});

router.delete('/:id', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Cliente não encontrado' }); }
});

export default router;
