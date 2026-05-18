import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, AuthRequest } from '../middleware/auth';
import { validar, produtoSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const produtos = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
  res.json(produtos);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const p = await prisma.produto.findUnique({ where: { id: req.params.id } });
  if (!p) { res.status(404).json({ erro: 'Produto não encontrado' }); return; }
  res.json(p);
});

router.post('/', validar(produtoSchema), async (req: AuthRequest, res: Response) => {
  const { nome, categoria, preco, unidade, estoque, tipo, ativo } = req.body;
  try {
    const p = await prisma.produto.create({
      data: { nome, categoria, preco, unidade, estoque: estoque ?? null, tipo, ativo },
    });
    res.status(201).json(p);
  } catch (e: any) { res.status(500).json({ erro: e.message || 'Erro ao criar produto' }); }
});

router.put('/:id', validar(produtoSchema), async (req: AuthRequest, res: Response) => {
  const { nome, categoria, preco, unidade, estoque, tipo, ativo } = req.body;
  try {
    const p = await prisma.produto.update({
      where: { id: req.params.id },
      data: { nome, categoria, preco, unidade, estoque: estoque ?? null, tipo, ativo },
    });
    res.json(p);
  } catch { res.status(404).json({ erro: 'Produto não encontrado' }); }
});

router.delete('/:id', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.produto.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Produto não encontrado' }); }
});

export default router;
