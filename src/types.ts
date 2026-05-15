export type OrcamentoStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'aguardando';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'operacional';
  ativo: boolean;
  criadoEm: string;
}

export interface LineItem {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  periodo?: string;
}

export interface Orcamento {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  contato: string;
  status: OrcamentoStatus;
  itens: LineItem[];
  desconto: number;
  impostos: number;
  observacoes: string;
  criadoEm: string;
  validade: string;
  subtotal: number;
  total: number;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cnpj: string;
  cpf: string;
  endereco: string;
  criadoEm: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade: string;
  estoque: number | null;
  tipo: 'produto' | 'servico';
  ativo: boolean;
}

export interface Tarefa {
  id: string;
  titulo: string;
  prioridade: 'alta' | 'media' | 'baixa';
  concluida: boolean;
  responsavel: string;
  prazo: string;
}

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: 'evento' | 'reuniao' | 'entrega' | 'outro';
  descricao: string;
  concluido: boolean;
}

export type SituacaoVenda = 'pendente' | 'parcial' | 'quitado' | 'cancelado';

export interface PagamentoVenda {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  pagoEm?: string;
}

export interface Venda {
  id: string;
  numero: string;
  orcamentoId: string;
  orcamentoNumero: string;
  clienteId: string;
  clienteNome: string;
  contato: string;
  itens: LineItem[];
  desconto: number;
  impostos: number;
  subtotal: number;
  total: number;
  observacoes: string;
  criadoEm: string;
  situacao: SituacaoVenda;
  pagamentos: PagamentoVenda[];
  editavel?: boolean;
}

export type OSStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';

export interface OrdemServico {
  id: string;
  numero: string;
  vendaId: string;
  vendaNumero: string;
  orcamentoNumero: string;
  clienteId: string;
  clienteNome: string;
  contato: string;
  enderecoEvento: string;
  dataMontagem: string;
  dataRetirada: string;
  horarioInicio: string;
  horarioFim: string;
  equipe: string;
  motorista: string;
  itens: LineItem[];
  observacoesOperacionais: string;
  status: OSStatus;
  criadoEm: string;
}

export type Section = 'dashboard' | 'orcamentos' | 'novo-orcamento' | 'clientes' | 'produtos' | 'agenda' | 'vendas' | 'ordens-servico' | 'configuracoes' | 'usuarios';
