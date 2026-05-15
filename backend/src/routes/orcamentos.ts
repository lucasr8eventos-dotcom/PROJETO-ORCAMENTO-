import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(autenticar);

function calcTotais(itens: { quantidade: number; valorUnitario: number }[], desconto: number, impostos: number) {
  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const descontoVal = subtotal * desconto / 100;
  const impostosVal = (subtotal - descontoVal) * impostos / 100;
  return { subtotal, total: subtotal - descontoVal + impostosVal };
}

function proximoNumero(atual: string | null) {
  if (!atual) return 'ORÇ-0001';
  const n = parseInt(atual.replace('ORÇ-', ''), 10);
  return `ORÇ-${String(n + 1).padStart(4, '0')}`;
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  const orcamentos = await prisma.orcamento.findMany({
    include: { itens: true },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(orcamentos);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const o = await prisma.orcamento.findUnique({
    where: { id: req.params.id },
    include: { itens: true, pdfs: true },
  });
  if (!o) { res.status(404).json({ erro: 'Orçamento não encontrado' }); return; }
  res.json(o);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { clienteId, clienteNome, contato, status, itens = [], desconto = 0, impostos = 0,
          observacoes, validade, criadoEm } = req.body;
  if (!clienteId) { res.status(400).json({ erro: 'Cliente obrigatório' }); return; }

  const ultimo = await prisma.orcamento.findFirst({ orderBy: { numero: 'desc' } });
  const numero = proximoNumero(ultimo?.numero ?? null);
  const { subtotal, total } = calcTotais(itens, desconto, impostos);

  const o = await prisma.orcamento.create({
    data: {
      numero, clienteId, clienteNome: clienteNome || '', contato: contato || '',
      status: status || 'rascunho', desconto: Number(desconto), impostos: Number(impostos),
      observacoes: observacoes || '', validade: validade || '',
      criadoEm: criadoEm || new Date().toISOString().slice(0, 10),
      subtotal, total,
      itens: {
        create: itens.map((i: any) => ({
          descricao: i.descricao, quantidade: Number(i.quantidade),
          valorUnitario: Number(i.valorUnitario), periodo: i.periodo || null,
        })),
      },
    },
    include: { itens: true },
  });
  res.status(201).json(o);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { clienteId, clienteNome, contato, status, itens = [], desconto = 0,
          impostos = 0, observacoes, validade } = req.body;
  if (!clienteId) { res.status(400).json({ erro: 'Cliente obrigatório' }); return; }
  const { subtotal, total } = calcTotais(itens, desconto, impostos);

  try {
    await prisma.orcamentoItem.deleteMany({ where: { orcamentoId: req.params.id } });
    const o = await prisma.orcamento.update({
      where: { id: req.params.id },
      data: {
        clienteId, clienteNome: clienteNome || '', contato: contato || '',
        status: status || 'rascunho', desconto: Number(desconto), impostos: Number(impostos),
        observacoes: observacoes || '', validade: validade || '', subtotal, total,
        itens: {
          create: itens.map((i: any) => ({
            descricao: i.descricao, quantidade: Number(i.quantidade),
            valorUnitario: Number(i.valorUnitario), periodo: i.periodo || null,
          })),
        },
      },
      include: { itens: true },
    });
    res.json(o);
  } catch { res.status(404).json({ erro: 'Orçamento não encontrado' }); }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!status) { res.status(400).json({ erro: 'Status obrigatório' }); return; }
  try {
    const o = await prisma.orcamento.update({ where: { id: req.params.id }, data: { status } });
    res.json(o);
  } catch { res.status(404).json({ erro: 'Orçamento não encontrado' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.orcamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Orçamento não encontrado' }); }
});

export default router;
