import { Orcamento, Cliente, Produto, Tarefa, Evento, Usuario, Venda, OrdemServico } from './types';
import { v4 as uuid } from 'uuid';
import { format, addDays } from 'date-fns';

const hoje = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export const clientesIniciais: Cliente[] = [
  { id: 'c1', nome: 'Eventos Prime Ltda', email: 'contato@eventosprime.com.br', telefone: '(11) 99234-5678', empresa: 'Eventos Prime Ltda', cnpj: '12.345.678/0001-90', cpf: '', endereco: 'Av. Paulista, 1000 - São Paulo/SP', criadoEm: '2026-01-10' },
  { id: 'c2', nome: 'Construtora Vega S/A', email: 'orcamentos@vega.com.br', telefone: '(11) 3456-7890', empresa: 'Construtora Vega S/A', cnpj: '98.765.432/0001-11', cpf: '', endereco: 'Rua Augusta, 500 - São Paulo/SP', criadoEm: '2026-02-03' },
  { id: 'c3', nome: 'Clínica Saúde Total', email: 'admin@saudetotal.com.br', telefone: '(11) 98765-4321', empresa: 'Clínica Saúde Total', cnpj: '55.444.333/0001-22', cpf: '', endereco: 'Rua Oscar Freire, 200 - São Paulo/SP', criadoEm: '2026-02-20' },
  { id: 'c4', nome: 'Studio Creative Co.', email: 'studio@creativeco.com.br', telefone: '(11) 97654-3210', empresa: 'Studio Creative Co.', cnpj: '77.888.999/0001-33', cpf: '', endereco: 'Vila Madalena, 80 - São Paulo/SP', criadoEm: '2026-03-05' },
  { id: 'c5', nome: 'Farmácias Bem Estar', email: 'compras@bemestar.com.br', telefone: '(11) 3210-9876', empresa: 'Farmácias Bem Estar', cnpj: '11.222.333/0001-44', cpf: '', endereco: 'Av. Brigadeiro Faria Lima, 300 - São Paulo/SP', criadoEm: '2026-03-15' },
];

export const produtosIniciais: Produto[] = [
  { id: 'p1', nome: 'Sistema de Som Pro', categoria: 'Áudio', preco: 850, unidade: 'diária', estoque: 14, tipo: 'produto', ativo: true },
  { id: 'p2', nome: 'Projetor HD 4K', categoria: 'Vídeo', preco: 1200, unidade: 'diária', estoque: 8, tipo: 'produto', ativo: true },
  { id: 'p3', nome: 'Mesa de Luz LED', categoria: 'Iluminação', preco: 650, unidade: 'diária', estoque: 20, tipo: 'produto', ativo: true },
  { id: 'p4', nome: 'Consultoria / hora', categoria: 'Serviço', preco: 280, unidade: 'hora', estoque: null, tipo: 'servico', ativo: true },
  { id: 'p5', nome: 'Instalação Elétrica', categoria: 'Serviço', preco: 450, unidade: 'serviço', estoque: null, tipo: 'servico', ativo: true },
  { id: 'p6', nome: 'Gerador 100kVA', categoria: 'Energia', preco: 1800, unidade: 'diária', estoque: 4, tipo: 'produto', ativo: true },
];

export const orcamentosIniciais: Orcamento[] = [
  {
    id: 'o1', numero: 'ORÇ-0047', clienteId: 'c1', clienteNome: 'Eventos Prime Ltda', contato: 'Maria Santos',
    status: 'aprovado', desconto: 5, impostos: 0, observacoes: 'Pagamento em 30 dias.',
    criadoEm: fmt(addDays(hoje, -3)), validade: fmt(addDays(hoje, 11)),
    itens: [
      { id: 'i1', descricao: 'Sistema de Som Pro', quantidade: 2, valorUnitario: 850, periodo: '3 dias' },
      { id: 'i2', descricao: 'Mesa de Luz LED', quantidade: 4, valorUnitario: 650, periodo: '3 dias' },
    ],
    subtotal: 4300, total: 4085,
  },
  {
    id: 'o2', numero: 'ORÇ-0046', clienteId: 'c2', clienteNome: 'Construtora Vega S/A', contato: 'Carlos Vega',
    status: 'aguardando', desconto: 0, impostos: 6, observacoes: 'Verificar prazo de entrega.',
    criadoEm: fmt(addDays(hoje, -4)), validade: fmt(addDays(hoje, 10)),
    itens: [
      { id: 'i3', descricao: 'Gerador 100kVA', quantidade: 2, valorUnitario: 1800, periodo: '4 dias' },
      { id: 'i4', descricao: 'Instalação Elétrica', quantidade: 3, valorUnitario: 450 },
    ],
    subtotal: 14400, total: 15264,
  },
  {
    id: 'o3', numero: 'ORÇ-0045', clienteId: 'c3', clienteNome: 'Clínica Saúde Total', contato: 'Ana Costa',
    status: 'enviado', desconto: 0, impostos: 0, observacoes: '',
    criadoEm: fmt(addDays(hoje, -5)), validade: fmt(addDays(hoje, 9)),
    itens: [
      { id: 'i5', descricao: 'Projetor HD 4K', quantidade: 3, valorUnitario: 1200, periodo: '2 dias' },
      { id: 'i6', descricao: 'Consultoria / hora', quantidade: 8, valorUnitario: 280 },
    ],
    subtotal: 5840, total: 5840,
  },
  {
    id: 'o4', numero: 'ORÇ-0044', clienteId: 'c4', clienteNome: 'Studio Creative Co.', contato: 'Pedro Lima',
    status: 'recusado', desconto: 10, impostos: 0, observacoes: 'Cliente solicitou renegociação.',
    criadoEm: fmt(addDays(hoje, -6)), validade: fmt(addDays(hoje, 8)),
    itens: [
      { id: 'i7', descricao: 'Consultoria / hora', quantidade: 6, valorUnitario: 280 },
    ],
    subtotal: 1680, total: 1512,
  },
  {
    id: 'o5', numero: 'ORÇ-0043', clienteId: 'c5', clienteNome: 'Farmácias Bem Estar', contato: 'Lucia Fernandes',
    status: 'aprovado', desconto: 0, impostos: 0, observacoes: 'Contrato assinado.',
    criadoEm: fmt(addDays(hoje, -7)), validade: fmt(addDays(hoje, 7)),
    itens: [
      { id: 'i8', descricao: 'Sistema de Som Pro', quantidade: 4, valorUnitario: 850, periodo: '3 dias' },
      { id: 'i9', descricao: 'Mesa de Luz LED', quantidade: 6, valorUnitario: 650, periodo: '3 dias' },
    ],
    subtotal: 7300, total: 7300,
  },
];

export const tarefasIniciais: Tarefa[] = [
  { id: 't1', titulo: 'Enviar orçamento #0046 para Construtora Vega', prioridade: 'alta', concluida: false, responsavel: 'Admin', prazo: fmt(addDays(hoje, 1)) },
  { id: 't2', titulo: 'Confirmar logística para evento dia 16', prioridade: 'alta', concluida: false, responsavel: 'Operacional', prazo: fmt(addDays(hoje, 3)) },
  { id: 't3', titulo: 'Atualizar tabela de preços — Áudio', prioridade: 'media', concluida: false, responsavel: 'Admin', prazo: fmt(addDays(hoje, 5)) },
  { id: 't4', titulo: 'Cadastrar novo fornecedor elétrico', prioridade: 'baixa', concluida: true, responsavel: 'Admin', prazo: fmt(hoje) },
  { id: 't5', titulo: 'Revisar contratos de locação — maio', prioridade: 'media', concluida: false, responsavel: 'Admin', prazo: fmt(addDays(hoje, 7)) },
];

export const eventosIniciais: Evento[] = [
  { id: 'e1', titulo: 'Montagem Eventos Prime', data: fmt(hoje), horaInicio: '08:00', horaFim: '12:00', tipo: 'evento', descricao: 'Montagem completa do sistema AV', concluido: false },
  { id: 'e2', titulo: 'Reunião equipe operacional', data: fmt(hoje), horaInicio: '14:00', horaFim: '15:00', tipo: 'reuniao', descricao: '', concluido: false },
  { id: 'e3', titulo: 'Entrega equipamentos Vega', data: fmt(addDays(hoje, 1)), horaInicio: '09:00', horaFim: '11:30', tipo: 'entrega', descricao: 'Gerador + equipe de instalação', concluido: false },
  { id: 'e4', titulo: 'Visita técnica Clínica Saúde', data: fmt(addDays(hoje, 2)), horaInicio: '10:00', horaFim: '12:00', tipo: 'evento', descricao: '', concluido: false },
  { id: 'e5', titulo: 'Follow-up orçamentos pendentes', data: fmt(addDays(hoje, 2)), horaInicio: '16:00', horaFim: '17:00', tipo: 'reuniao', descricao: '', concluido: false },
  { id: 'e6', titulo: 'Desmontagem Eventos Prime', data: fmt(addDays(hoje, 3)), horaInicio: '07:00', horaFim: '11:00', tipo: 'entrega', descricao: '', concluido: false },
];

export const usuariosIniciais: Usuario[] = [
  { id: uuid(), nome: 'Administrador', email: 'admin@empresa.com', senha: 'admin123', role: 'admin', ativo: true, criadoEm: fmt(hoje) },
];

export const vendasIniciais: Venda[] = [
  {
    id: 'v1', numero: 'VND-0001', orcamentoId: 'o1', orcamentoNumero: 'ORÇ-0047',
    clienteId: 'c1', clienteNome: 'Eventos Prime Ltda', contato: 'Maria Santos',
    itens: [
      { id: 'vi1', descricao: 'Sistema de Som Pro', quantidade: 2, valorUnitario: 850, periodo: '3 dias' },
      { id: 'vi2', descricao: 'Mesa de Luz LED', quantidade: 4, valorUnitario: 650, periodo: '3 dias' },
    ],
    desconto: 5, impostos: 0, subtotal: 4300, total: 4085,
    observacoes: 'Pagamento em 30 dias.', criadoEm: fmt(addDays(hoje, -3)),
    situacao: 'pendente', pagamentos: [],
  },
  {
    id: 'v2', numero: 'VND-0002', orcamentoId: 'o5', orcamentoNumero: 'ORÇ-0043',
    clienteId: 'c5', clienteNome: 'Farmácias Bem Estar', contato: 'Lucia Fernandes',
    itens: [
      { id: 'vi3', descricao: 'Sistema de Som Pro', quantidade: 4, valorUnitario: 850, periodo: '3 dias' },
      { id: 'vi4', descricao: 'Mesa de Luz LED', quantidade: 6, valorUnitario: 650, periodo: '3 dias' },
    ],
    desconto: 0, impostos: 0, subtotal: 7300, total: 7300,
    observacoes: 'Contrato assinado.', criadoEm: fmt(addDays(hoje, -7)),
    situacao: 'pendente', pagamentos: [],
  },
];

export const ordensServicoIniciais: OrdemServico[] = [
  {
    id: 'os1', numero: 'OS-0001', vendaId: 'v1', vendaNumero: 'VND-0001', orcamentoNumero: 'ORÇ-0047',
    clienteId: 'c1', clienteNome: 'Eventos Prime Ltda', contato: 'Maria Santos',
    enderecoEvento: '', dataMontagem: '', dataRetirada: '', horarioInicio: '', horarioFim: '',
    equipe: '', motorista: '',
    itens: [
      { id: 'oi1', descricao: 'Sistema de Som Pro', quantidade: 2, valorUnitario: 850, periodo: '3 dias' },
      { id: 'oi2', descricao: 'Mesa de Luz LED', quantidade: 4, valorUnitario: 650, periodo: '3 dias' },
    ],
    observacoesOperacionais: 'Pagamento em 30 dias.', status: 'pendente', criadoEm: fmt(addDays(hoje, -3)),
  },
  {
    id: 'os2', numero: 'OS-0002', vendaId: 'v2', vendaNumero: 'VND-0002', orcamentoNumero: 'ORÇ-0043',
    clienteId: 'c5', clienteNome: 'Farmácias Bem Estar', contato: 'Lucia Fernandes',
    enderecoEvento: '', dataMontagem: '', dataRetirada: '', horarioInicio: '', horarioFim: '',
    equipe: '', motorista: '',
    itens: [
      { id: 'oi3', descricao: 'Sistema de Som Pro', quantidade: 4, valorUnitario: 850, periodo: '3 dias' },
      { id: 'oi4', descricao: 'Mesa de Luz LED', quantidade: 6, valorUnitario: 650, periodo: '3 dias' },
    ],
    observacoesOperacionais: 'Contrato assinado.', status: 'pendente', criadoEm: fmt(addDays(hoje, -7)),
  },
];

export function proximoNumeroVenda(vendas: Venda[]): string {
  const nums = vendas.map(v => parseInt(v.numero.replace('VND-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `VND-${String(next).padStart(4, '0')}`;
}

export function proximoNumeroOS(ordens: OrdemServico[]): string {
  const nums = ordens.map(o => parseInt(o.numero.replace('OS-', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `OS-${String(next).padStart(4, '0')}`;
}

export function calcularSituacaoVenda(pagamentos: Venda['pagamentos']): Venda['situacao'] {
  if (!pagamentos.length) return 'pendente';
  const totalPago = pagamentos.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
  const totalGeral = pagamentos.reduce((s, p) => s + p.valor, 0);
  if (totalPago === 0) return 'pendente';
  if (totalPago >= totalGeral) return 'quitado';
  return 'parcial';
}

export function calcularTotais(orc: Pick<Orcamento, 'itens' | 'desconto' | 'impostos'>): { subtotal: number; total: number } {
  const subtotal = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const descontoVal = subtotal * orc.desconto / 100;
  const impostosVal = (subtotal - descontoVal) * orc.impostos / 100;
  return { subtotal, total: subtotal - descontoVal + impostosVal };
}

export function loadData<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch { return defaults; }
}

export function saveData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}
