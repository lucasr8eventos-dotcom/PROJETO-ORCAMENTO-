import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validar = (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      const erros = r.error.errors.map(e => `${e.path.join('.') || 'body'}: ${e.message}`).join('; ');
      res.status(400).json({ erro: erros });
      return;
    }
    req.body = r.data;
    next();
  };

const optStr = (max = 500) => z.string().max(max).optional().default('');
const isoDateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato AAAA-MM-DD').optional();

export const clienteSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, 'Nome obrigatório').max(200),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional().default(''),
  telefone: optStr(30),
  empresa: optStr(200),
  cnpj: optStr(20),
  cpf: optStr(20),
  endereco: optStr(),
  criadoEm: isoDateStr,
});

export const produtoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatório').max(200),
  categoria: optStr(100),
  preco: z.coerce.number().min(0, 'Preço deve ser >= 0').default(0),
  unidade: z.string().max(50).default('unidade'),
  estoque: z.coerce.number().int().min(0).nullable().optional(),
  tipo: z.enum(['produto', 'servico']).default('produto'),
  ativo: z.boolean().default(true),
});

const lineItemSchema = z.object({
  descricao: z.string().trim().min(1, 'Descrição obrigatória'),
  quantidade: z.coerce.number().int().positive('Quantidade deve ser >= 1'),
  valorUnitario: z.coerce.number().min(0, 'Valor unitário deve ser >= 0'),
  periodo: z.string().nullable().optional(),
});

const STATUS_ORC = ['rascunho', 'enviado', 'aguardando', 'aprovado', 'recusado'] as const;

export const orcamentoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente obrigatório'),
  clienteNome: optStr(200),
  contato: optStr(200),
  status: z.enum(STATUS_ORC).default('rascunho'),
  itens: z.array(lineItemSchema).default([]),
  desconto: z.coerce.number().min(0).max(100).default(0),
  impostos: z.coerce.number().min(0).max(100).default(0),
  observacoes: optStr(2000),
  validade: optStr(20),
  criadoEm: isoDateStr,
});

export const orcamentoStatusSchema = z.object({
  status: z.enum(STATUS_ORC),
});

export const vendaSchema = z.object({
  orcamentoId: z.string().optional(),
  orcamentoNumero: optStr(50),
  clienteId: z.string().optional(),
  clienteNome: optStr(200),
  contato: optStr(200),
  desconto: z.coerce.number().min(0).default(0),
  impostos: z.coerce.number().min(0).default(0),
  subtotal: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  observacoes: optStr(2000),
  criadoEm: isoDateStr,
});

export const vendaUpdateSchema = z.object({
  contato: z.string().optional(),
  observacoes: z.string().optional(),
  situacao: z.enum(['pendente', 'parcial', 'quitado', 'cancelado']).optional(),
  editavel: z.boolean().optional(),
  pagamentos: z.array(z.object({
    descricao: z.string().trim().min(1, 'Descrição obrigatória'),
    valor: z.coerce.number().min(0),
    vencimento: z.string(),
    pago: z.boolean().default(false),
  })).default([]),
});

export const pagamentoSchema = z.object({
  descricao: z.string().trim().min(1, 'Descrição obrigatória'),
  valor: z.coerce.number().min(0),
  vencimento: z.string(),
  pago: z.boolean().default(false),
});

export const togglePagamentoSchema = z.object({
  pago: z.boolean(),
});

export const osSchema = z.object({
  vendaId: z.string().optional(),
  vendaNumero: optStr(50),
  orcamentoNumero: optStr(50),
  clienteId: z.string().optional(),
  clienteNome: optStr(200),
  contato: optStr(200),
  enderecoEvento: optStr(),
  dataMontagem: optStr(20),
  dataRetirada: optStr(20),
  horarioInicio: optStr(10),
  horarioFim: optStr(10),
  equipe: optStr(),
  motorista: optStr(200),
  observacoesOperacionais: optStr(2000),
  itens: z.array(lineItemSchema).default([]),
  criadoEm: isoDateStr,
});

export const osUpdateSchema = z.object({
  enderecoEvento: z.string().optional(),
  dataMontagem: z.string().optional(),
  dataRetirada: z.string().optional(),
  horarioInicio: z.string().optional(),
  horarioFim: z.string().optional(),
  equipe: z.string().optional(),
  motorista: z.string().optional(),
  observacoesOperacionais: z.string().optional(),
  status: z.string().optional(),
});

export const eventoSchema = z.object({
  titulo: z.string().trim().min(1, 'Título obrigatório').max(200),
  data: optStr(20),
  horaInicio: optStr(10),
  horaFim: optStr(10),
  tipo: z.string().max(50).default('evento'),
  descricao: optStr(2000),
  concluido: z.boolean().default(false),
});

export const usuarioCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatório').max(200),
  email: z.string().email('E-mail inválido').toLowerCase(),
  senha: z.string().min(4, 'Senha deve ter ao menos 4 caracteres').max(100),
  role: z.enum(['admin', 'operacional']).default('operacional'),
});

export const usuarioUpdateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatório').max(200),
  email: z.string().email('E-mail inválido').toLowerCase(),
  senha: z.string().min(4).max(100).optional(),
  role: z.enum(['admin', 'operacional']).optional(),
  ativo: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export const pdfBase64Schema = z.object({
  orcamentoId: z.string().min(1, 'orcamentoId obrigatório'),
  orcamentoNumero: z.string().optional(),
  versao: z.coerce.number().int().min(1).default(1),
  base64: z.string().min(1, 'base64 obrigatório'),
});
