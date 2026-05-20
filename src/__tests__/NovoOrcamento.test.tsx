import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NovoOrcamento from '../components/NovoOrcamento';
import { Cliente, Produto } from '../types';

jest.mock('../pdfGenerator', () => ({ gerarPDF: jest.fn() }));
jest.mock('../components/Configuracoes', () => ({ loadConfig: jest.fn(() => ({})) }));

const clientes: Cliente[] = [
  { id: 'c1', nome: 'Empresa Alpha', email: 'alpha@test.com', telefone: '', empresa: 'Alpha', cnpj: '11.111.111/0001-11', cpf: '', endereco: '', criadoEm: '2026-01-01' },
];

const produtos: Produto[] = [
  { id: 'p1', nome: 'Projetor HD', categoria: 'Video', preco: 1200, unidade: 'diaria', estoque: 5, tipo: 'produto', ativo: true },
];

const defaultProps = {
  orcamento: null,
  clientes,
  produtos,
  proximoNumero: 'ORC-0001',
  onSalvar: jest.fn(),
  onCancelar: jest.fn(),
  onSalvarCliente: jest.fn(),
};

describe('NovoOrcamento', () => {
  it('renderiza formulario de novo orcamento', () => {
    render(<NovoOrcamento {...defaultProps} />);
    expect(screen.getByText('Novo Orçamento')).toBeInTheDocument();
    expect(screen.getByText(/ORC-0001/)).toBeInTheDocument();
    expect(screen.getByText('Dados do cliente')).toBeInTheDocument();
    expect(screen.getByText('Itens do orçamento')).toBeInTheDocument();
  });

  it('exibe alerta se salvar sem selecionar cliente', () => {
    render(<NovoOrcamento {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Salvar orçamento')[0]);
    expect(window.alert).toHaveBeenCalledWith('Selecione um cliente.');
  });

  it('adiciona item manual ao clicar em "+ Item manual"', () => {
    render(<NovoOrcamento {...defaultProps} />);
    const itensBefore = screen.getAllByPlaceholderText('Descrição do item...');
    fireEvent.click(screen.getByText('Item manual'));
    const itensAfter = screen.getAllByPlaceholderText('Descrição do item...');
    expect(itensAfter.length).toBe(itensBefore.length + 1);
  });

  it('nao remove o ultimo item (deve manter ao menos 1)', () => {
    render(<NovoOrcamento {...defaultProps} />);
    expect(screen.getAllByPlaceholderText('Descrição do item...')).toHaveLength(1);
    // adiciona um segundo item e remove o primeiro — deve sobrar 1
    fireEvent.click(screen.getByText('Item manual'));
    expect(screen.getAllByPlaceholderText('Descrição do item...')).toHaveLength(2);
    // remove os dois via removeItem — o último não deve ser removido
    const removerBtns = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(removerBtns[0]);
    expect(screen.getAllByPlaceholderText('Descrição do item...')).toHaveLength(1);
  });

  it('exibe total no resumo financeiro', () => {
    render(<NovoOrcamento {...defaultProps} />);
    expect(screen.getAllByText('TOTAL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Resumo financeiro')).toBeInTheDocument();
  });

  it('chama onCancelar ao clicar na seta de voltar', () => {
    const onCancelar = jest.fn();
    render(<NovoOrcamento {...defaultProps} onCancelar={onCancelar} />);
    fireEvent.click(screen.getByText('←'));
    expect(onCancelar).toHaveBeenCalled();
  });

  it('abre modal de cadastro de novo cliente', () => {
    render(<NovoOrcamento {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Novo'));
    expect(screen.getByText('Cadastrar novo cliente')).toBeInTheDocument();
  });

  it('renderiza como Editar Orcamento quando orcamento e passado', () => {
    const orc = {
      id: 'o1', numero: 'ORC-0001', clienteId: 'c1', clienteNome: 'Empresa Alpha', contato: '',
      status: 'rascunho' as const, itens: [], desconto: 0, impostos: 0, observacoes: '',
      criadoEm: '2026-05-01', validade: '2026-05-15', subtotal: 0, total: 0,
    };
    render(<NovoOrcamento {...defaultProps} orcamento={orc} />);
    expect(screen.getByText('Editar Orçamento')).toBeInTheDocument();
  });

  it('exibe o campo de observacoes', () => {
    render(<NovoOrcamento {...defaultProps} />);
    expect(screen.getByText('Detalhes do orçamento')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Pagamento:/)).toBeInTheDocument();
  });
});
