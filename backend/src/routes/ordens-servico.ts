import { Router } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, osSchema, osUpdateSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', asyncHandler(async (req, res) => {
  const { vendaId } = req.query;
  const os = await prisma.ordemServico.findMany({
    where: vendaId ? { vendaId: String(vendaId) } : undefined,
    include: { itens: true },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(os);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const os = await prisma.ordemServico.findUnique({
    where: { id: req.params.id }, include: { itens: true },
  });
  if (!os) { res.status(404).json({ erro: 'OS não encontrada' }); return; }
  res.json(os);
}));

router.post('/', validar(osSchema), asyncHandler(async (req: AuthRequest, res) => {
  const {
    vendaId, vendaNumero, orcamentoNumero, clienteId, clienteNome, contato,
    enderecoEvento, dataMontagem, dataRetirada, horarioInicio, horarioFim,
    equipe, motorista, observacoesOperacionais, itens, criadoEm,
  } = req.body;

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const rows = await prisma.$queryRaw<{ numero: string }[]>`
      SELECT numero FROM ordens_servico
      ORDER BY CAST(REGEXP_REPLACE(numero, '[^0-9]', '', 'g') AS INTEGER) DESC LIMIT 1
    `;
    const ultimo = rows[0]?.numero;
    const n = ultimo ? parseInt(ultimo.replace('OS-', ''), 10) + 1 : 1;
    const numero = `OS-${String(n).padStart(4, '0')}`;
    try {
      const os = await prisma.ordemServico.create({
        data: {
          numero, vendaId, vendaNumero, orcamentoNumero, clienteId,
          clienteNome, contato, enderecoEvento, dataMontagem, dataRetirada,
          horarioInicio, horarioFim, equipe, motorista, observacoesOperacionais,
          status: 'pendente',
          criadoEm: criadoEm || new Date().toISOString().slice(0, 10),
          itens: { create: itens.map((i: any) => ({
            descricao: i.descricao, quantidade: i.quantidade,
            valorUnitario: i.valorUnitario, periodo: i.periodo || null,
          })) },
        },
        include: { itens: true },
      });
      res.status(201).json(os);
      return;
    } catch (e: any) {
      if (e.code === 'P2002' && tentativa < 4) continue;
      throw e;
    }
  }
}));

router.put('/:id', validar(osUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const {
    enderecoEvento, dataMontagem, dataRetirada, horarioInicio, horarioFim,
    equipe, motorista, observacoesOperacionais, status,
  } = req.body;
  try {
    const os = await prisma.ordemServico.update({
      where: { id: req.params.id },
      data: {
        enderecoEvento, dataMontagem, dataRetirada, horarioInicio, horarioFim,
        equipe, motorista, observacoesOperacionais,
        status: status || 'pendente',
      },
      include: { itens: true },
    });
    res.json(os);
  } catch { res.status(404).json({ erro: 'OS não encontrada' }); }
}));

router.delete('/:id', apenasAdmin, asyncHandler(async (req: AuthRequest, res) => {
  try {
    await prisma.ordemServico.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'OS não encontrada' }); }
}));

export default router;
