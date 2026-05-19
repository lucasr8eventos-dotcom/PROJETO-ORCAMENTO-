import { Router } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, vendaSchema, vendaUpdateSchema, pagamentoSchema, togglePagamentoSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', asyncHandler(async (_req, res) => {
  const vendas = await prisma.venda.findMany({
    include: {
      pagamentos: true,
      ordensServico: { select: { id: true, numero: true, status: true } },
      orcamento: { include: { itens: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(vendas);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const v = await prisma.venda.findUnique({
    where: { id: req.params.id },
    include: { pagamentos: true, ordensServico: true },
  });
  if (!v) { res.status(404).json({ erro: 'Venda não encontrada' }); return; }
  res.json(v);
}));

router.post('/', validar(vendaSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { orcamentoId, orcamentoNumero, clienteId, clienteNome, contato,
          desconto, impostos, subtotal, total, observacoes, criadoEm } = req.body;

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const rows = await prisma.$queryRaw<{ numero: string }[]>`
      SELECT numero FROM vendas
      ORDER BY CAST(REGEXP_REPLACE(numero, '[^0-9]', '', 'g') AS INTEGER) DESC LIMIT 1
    `;
    const ultimo = rows[0]?.numero;
    const n = ultimo ? parseInt(ultimo.replace('VND-', ''), 10) + 1 : 1;
    const numero = `VND-${String(n).padStart(4, '0')}`;
    try {
      const v = await prisma.venda.create({
        data: {
          numero, orcamentoId, orcamentoNumero, clienteId, clienteNome, contato,
          desconto, impostos, subtotal, total, observacoes,
          criadoEm: criadoEm || new Date().toISOString().slice(0, 10),
          situacao: 'pendente',
        },
        include: { pagamentos: true, orcamento: { include: { itens: true } } },
      });
      res.status(201).json(v);
      return;
    } catch (e: any) {
      if (e.code === 'P2002' && tentativa < 4) continue;
      throw e;
    }
  }
}));

router.put('/:id', validar(vendaUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { contato, observacoes, situacao, editavel, pagamentos } = req.body;
  try {
    const v = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.pagamentoVenda.deleteMany({ where: { vendaId: req.params.id } });
      return tx.venda.update({
        where: { id: req.params.id },
        data: {
          contato: contato ?? undefined,
          observacoes: observacoes ?? undefined,
          situacao: situacao ?? undefined,
          editavel: editavel ?? undefined,
          pagamentos: { create: pagamentos.map((p: { descricao: string; valor: number; vencimento: string; pago: boolean; pagoEm?: string }) => ({
            descricao: p.descricao, valor: p.valor, vencimento: p.vencimento, pago: p.pago,
            pagoEm: p.pagoEm ?? null,
          })) },
        },
        include: { pagamentos: true, orcamento: { include: { itens: true } } },
      });
    });
    res.json(v);
  } catch { res.status(404).json({ erro: 'Venda não encontrada' }); }
}));

router.post('/:id/pagamentos', validar(pagamentoSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { descricao, valor, vencimento, pago } = req.body;
  try {
    const pg = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const novo = await tx.pagamentoVenda.create({
        data: { vendaId: req.params.id, descricao, valor, vencimento, pago },
      });
      const venda = await tx.venda.findUnique({
        where: { id: req.params.id }, include: { pagamentos: true },
      });
      if (venda) {
        const totalPago = venda.pagamentos.reduce((s: number, p: { pago: boolean; valor: number }) => s + (p.pago ? p.valor : 0), 0);
        const situacao = totalPago === 0 ? 'pendente' : totalPago >= venda.total ? 'quitado' : 'parcial';
        await tx.venda.update({ where: { id: req.params.id }, data: { situacao } });
      }
      return novo;
    });
    res.status(201).json(pg);
  } catch { res.status(500).json({ erro: 'Erro ao criar pagamento' }); }
}));

router.patch('/pagamentos/:pgId', validar(togglePagamentoSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { pago } = req.body;
  try {
    const pg = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const atualizado = await tx.pagamentoVenda.update({
        where: { id: req.params.pgId }, data: { pago },
      });
      const venda = await tx.venda.findUnique({
        where: { id: atualizado.vendaId }, include: { pagamentos: true },
      });
      if (venda) {
        const totalPago = venda.pagamentos.reduce((s: number, p: { pago: boolean; valor: number }) => s + (p.pago ? p.valor : 0), 0);
        const situacao = totalPago === 0 ? 'pendente' : totalPago >= venda.total ? 'quitado' : 'parcial';
        await tx.venda.update({ where: { id: atualizado.vendaId }, data: { situacao } });
      }
      return atualizado;
    });
    res.json(pg);
  } catch { res.status(404).json({ erro: 'Pagamento não encontrado' }); }
}));

router.delete('/:id', apenasAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    await prisma.venda.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Venda não encontrada' }); }
}));

export default router;
