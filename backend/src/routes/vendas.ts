import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const vendas = await prisma.venda.findMany({
    include: { pagamentos: true, ordensServico: { select: { id: true, numero: true, status: true } } },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(vendas);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const v = await prisma.venda.findUnique({
    where: { id: req.params.id },
    include: { pagamentos: true, ordensServico: true },
  });
  if (!v) { res.status(404).json({ erro: 'Venda não encontrada' }); return; }
  res.json(v);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { orcamentoId, orcamentoNumero, clienteId, clienteNome, contato,
          desconto, impostos, subtotal, total, observacoes, criadoEm } = req.body;

  const ultimo = await prisma.venda.findFirst({ orderBy: { numero: 'desc' } });
  const n = ultimo ? parseInt(ultimo.numero.replace('VND-', ''), 10) + 1 : 1;
  const numero = `VND-${String(n).padStart(4, '0')}`;

  const v = await prisma.venda.create({
    data: {
      numero, orcamentoId, orcamentoNumero, clienteId, clienteNome, contato: contato || '',
      desconto: Number(desconto) || 0, impostos: Number(impostos) || 0,
      subtotal: Number(subtotal) || 0, total: Number(total) || 0,
      observacoes: observacoes || '', criadoEm: criadoEm || new Date().toISOString().slice(0, 10),
      situacao: 'pendente',
    },
    include: { pagamentos: true },
  });
  res.status(201).json(v);
});

router.post('/:id/pagamentos', async (req: AuthRequest, res: Response) => {
  const { descricao, valor, vencimento, pago } = req.body;
  const pg = await prisma.pagamentoVenda.create({
    data: {
      vendaId: req.params.id, descricao: descricao || '', valor: Number(valor) || 0,
      vencimento: vencimento || '', pago: pago === true,
    },
  });

  // Recalcula situação da venda
  const venda = await prisma.venda.findUnique({
    where: { id: req.params.id }, include: { pagamentos: true },
  });
  if (venda) {
    const totalPago = venda.pagamentos.reduce((s, p) => s + (p.pago ? p.valor : 0), 0);
    const situacao = totalPago === 0 ? 'pendente' : totalPago >= venda.total ? 'quitado' : 'parcial';
    await prisma.venda.update({ where: { id: req.params.id }, data: { situacao } });
  }
  res.status(201).json(pg);
});

router.patch('/pagamentos/:pgId', async (req: AuthRequest, res: Response) => {
  const { pago } = req.body;
  const pg = await prisma.pagamentoVenda.update({
    where: { id: req.params.pgId }, data: { pago: pago === true },
  });

  const venda = await prisma.venda.findUnique({
    where: { id: pg.vendaId }, include: { pagamentos: true },
  });
  if (venda) {
    const totalPago = venda.pagamentos.reduce((s, p) => s + (p.pago ? p.valor : 0), 0);
    const situacao = totalPago === 0 ? 'pendente' : totalPago >= venda.total ? 'quitado' : 'parcial';
    await prisma.venda.update({ where: { id: pg.vendaId }, data: { situacao } });
  }
  res.json(pg);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.venda.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Venda não encontrada' }); }
});

export default router;
