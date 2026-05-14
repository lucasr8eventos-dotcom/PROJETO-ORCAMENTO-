export type OrcamentoStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'aguardando';

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
}

export type Section = 'dashboard' | 'orcamentos' | 'novo-orcamento' | 'clientes' | 'produtos' | 'agenda' | 'tarefas' | 'configuracoes';
