import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, AuthRequest } from '../middleware/auth';
import { validar, orcamentoSchema, orcamentoStatusSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

function calcTotais(itens: { quantidade: number; valorUnitario: number }[], desconto: number, impostos: number) {
  const subtotal = Math.round(itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0) * 100) / 100;
  const descontoVal = Math.round(subtotal * desconto) / 100;
  const impostosVal = Math.round((subtotal - descontoVal) * impostos) / 100;
  return { subtotal, total: Math.round((subtotal - descontoVal + impostosVal) * 100) / 100 };
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

router.post('/', validar(orcamentoSchema), async (req: AuthRequest, res: Response) => {
  const { clienteId, clienteNome, contato, status, itens, desconto, impostos,
          observacoes, validade, criadoEm } = req.body;
  const { subtotal, total } = calcTotais(itens, desconto, impostos);

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const ultimo = await prisma.orcamento.findFirst({ orderBy: { numero: 'desc' } });
    const numero = proximoNumero(ultimo?.numero ?? null);
    try {
      const o = await prisma.orcamento.create({
        data: {
          numero, clienteId, clienteNome, contato,
          status, desconto, impostos, observacoes, validade,
          criadoEm: criadoEm || new Date().toISOString().slice(0, 10),
          subtotal, total,
          itens: { create: itens.map((i: any) => ({
            descricao: i.descricao, quantidade: i.quantidade,
            valorUnitario: i.valorUnitario, periodo: i.periodo || null,
          })) },
        },
        include: { itens: true },
      });
      res.status(201).json(o);
      return;
    } catch (e: any) {
      if (e.code === 'P2002' && tentativa < 4) continue;
      res.status(500).json({ erro: e.message || 'Erro ao criar orçamento' });
      return;
    }
  }
});

router.put('/:id', validar(orcamentoSchema), async (req: AuthRequest, res: Response) => {
  const { clienteId, clienteNome, contato, status, itens, desconto, impostos,
          observacoes, validade } = req.body;
  const { subtotal, total } = calcTotais(itens, desconto, impostos);
  try {
    await prisma.orcamentoItem.deleteMany({ where: { orcamentoId: req.params.id } });
    const o = await prisma.orcamento.update({
      where: { id: req.params.id },
      data: {
        clienteId, clienteNome, contato, status, desconto, impostos,
        observacoes, validade, subtotal, total,
        itens: { create: itens.map((i: any) => ({
          descricao: i.descricao, quantidade: i.quantidade,
          valorUnitario: i.valorUnitario, periodo: i.periodo || null,
        })) },
      },
      include: { itens: true },
    });
    res.json(o);
  } catch { res.status(404).json({ erro: 'Orçamento não encontrado' }); }
});

router.patch('/:id/status', validar(orcamentoStatusSchema), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  try {
    const o = await prisma.orcamento.update({
      where: { id: req.params.id }, data: { status }, include: { itens: true },
    });
    res.json(o);
  } catch { res.status(404).json({ erro: 'Orçamento não encontrado' }); }
});

router.delete('/:id', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.orcamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Orçamento não encontrado' }); }
});

export default router;
