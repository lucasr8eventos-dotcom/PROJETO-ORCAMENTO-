import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

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

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, email, telefone, empresa, cnpj, cpf, endereco, criadoEm } = req.body;
  if (!nome) { res.status(400).json({ erro: 'Nome obrigatório' }); return; }
  const c = await prisma.cliente.create({
    data: { nome, email: email || '', telefone: telefone || '', empresa: empresa || '',
            cnpj: cnpj || '', cpf: cpf || '', endereco: endereco || '',
            criadoEm: criadoEm || new Date().toISOString().slice(0, 10) },
  });
  res.status(201).json(c);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, email, telefone, empresa, cnpj, cpf, endereco } = req.body;
  if (!nome) { res.status(400).json({ erro: 'Nome obrigatório' }); return; }
  try {
    const c = await prisma.cliente.update({
      where: { id: req.params.id },
      data: { nome, email: email || '', telefone: telefone || '', empresa: empresa || '',
              cnpj: cnpj || '', cpf: cpf || '', endereco: endereco || '' },
    });
    res.json(c);
  } catch { res.status(404).json({ erro: 'Cliente não encontrado' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Cliente não encontrado' }); }
});

export default router;
