import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

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

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, categoria, preco, unidade, estoque, tipo, ativo } = req.body;
  if (!nome) { res.status(400).json({ erro: 'Nome obrigatório' }); return; }
  const p = await prisma.produto.create({
    data: {
      nome, categoria: categoria || '', preco: Number(preco) || 0,
      unidade: unidade || 'unidade', estoque: estoque != null ? Number(estoque) : null,
      tipo: tipo || 'produto', ativo: ativo !== false,
    },
  });
  res.status(201).json(p);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, categoria, preco, unidade, estoque, tipo, ativo } = req.body;
  if (!nome) { res.status(400).json({ erro: 'Nome obrigatório' }); return; }
  try {
    const p = await prisma.produto.update({
      where: { id: req.params.id },
      data: {
        nome, categoria: categoria || '', preco: Number(preco) || 0,
        unidade: unidade || 'unidade', estoque: estoque != null ? Number(estoque) : null,
        tipo: tipo || 'produto', ativo: ativo !== false,
      },
    });
    res.json(p);
  } catch { res.status(404).json({ erro: 'Produto não encontrado' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.produto.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Produto não encontrado' }); }
});

export default router;
