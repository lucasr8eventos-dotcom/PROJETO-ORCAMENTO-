import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Orcamentos from '../components/Orcamentos';
import { Orcamento, Cliente } from '../types';

jest.mock('../pdfGenerator', () => ({ gerarPDF: jest.fn() }));

const hoje = new Date().toISOString().slice(0, 10);

const orcamentos: Orcamento[] = [
  {
    id: 'o1', numero: 'ORÇ-0001', clienteId: 'c1', clienteNome: 'Empresa Alpha', contato: 'João',
    status: 'aprovado', desconto: 0, impostos: 0, observacoes: '', criadoEm: hoje, validade: hoje,
    itens: [{ id: 'i1', descricao: 'Item A', quantidade: 2, valorUnitario: 500 }],
    subtotal: 1000, total: 1000,
  },
  {
    id: 'o2', numero: 'ORÇ-0002', clienteId: 'c2', clienteNome: 'Empresa Beta', contato: 'Maria',
    status: 'aguardando', desconto: 0, impostos: 0, observacoes: '', criadoEm: hoje, validade: hoje,
    itens: [{ id: 'i2', descricao: 'Item B', quantidade: 1, valorUnitario: 800 }],
    subtotal: 800, total: 800,
  },
  {
    id: 'o3', numero: 'ORÇ-0003', clienteId: 'c3', clienteNome: 'Empresa Gama', contato: '',
    status: 'recusado', desconto: 0, impostos: 0, observacoes: '', criadoEm: hoje, validade: hoje,
    itens: [{ id: 'i3', descricao: 'Item C', quantidade: 3, valorUnitario: 200 }],
    subtotal: 600, total: 600,
  },
];

const clientes: Cliente[] = [];
const vendas: any[] = [];

const defaultProps = {
  orcamentos,
  clientes,
  vendas,
  onNovo: jest.fn(),
  onEditar: jest.fn(),
  onDelete: jest.fn(),
  onStatusChange: jest.fn(),
  onDuplicar: jest.fn(),
};

describe('Orcamentos', () => {
  it('renderiza todos os orçamentos do mês', () => {
    render(<Orcamentos {...defaultProps} />);
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
    expect(screen.getByText('Empresa Gama')).toBeInTheDocument();
  });

  it('exibe status badges corretos', () => {
    render(<Orcamentos {...defaultProps} />);
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();
    expect(screen.getByText('Recusado')).toBeInTheDocument();
  });

  it('chama onNovo ao clicar em "Novo orçamento"', () => {
    const onNovo = jest.fn();
    render(<Orcamentos {...defaultProps} onNovo={onNovo} />);
    fireEvent.click(screen.getByText('+ Novo orçamento'));
    expect(onNovo).toHaveBeenCalled();
  });

  it('chama onEditar ao clicar na linha do orçamento', () => {
    const onEditar = jest.fn();
    render(<Orcamentos {...defaultProps} onEditar={onEditar} />);
    fireEvent.click(screen.getByText('Empresa Alpha'));
    expect(onEditar).toHaveBeenCalledWith(orcamentos[0]);
  });

  it('filtra por card "Aprovados"', () => {
    render(<Orcamentos {...defaultProps} />);
    const cardAprovado = screen.getByText(/Aprovados \(/);
    fireEvent.click(cardAprovado);
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Empresa Gama')).not.toBeInTheDocument();
  });

  it('filtra por card "Recusados"', () => {
    render(<Orcamentos {...defaultProps} />);
    fireEvent.click(screen.getByText(/Recusados \(/));
    expect(screen.getByText('Empresa Gama')).toBeInTheDocument();
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument();
  });

  it('filtra por card "Previstos" (aguardando/enviado/rascunho)', () => {
    render(<Orcamentos {...defaultProps} />);
    fireEvent.click(screen.getByText(/Previstos \(/));
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument();
  });

  it('abre menu de ações e chama onDelete após confirmação', () => {
    const onDelete = jest.fn();
    render(<Orcamentos {...defaultProps} onDelete={onDelete} />);
    const botoes = screen.getAllByRole('button', { name: /Ações/ });
    fireEvent.click(botoes[0]);
    fireEvent.click(screen.getByText('🗑️ Excluir orçamento'));
    // PR #6 adicionou modal de confirmação
    expect(screen.getByText('Excluir orçamento?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onDelete).toHaveBeenCalledWith('o1');
  });

  it('chama onDuplicar pelo menu de ações', () => {
    const onDuplicar = jest.fn();
    render(<Orcamentos {...defaultProps} onDuplicar={onDuplicar} />);
    const botoes = screen.getAllByRole('button', { name: /Ações/ });
    fireEvent.click(botoes[0]);
    fireEvent.click(screen.getByText('📋 Duplicar orçamento'));
    expect(onDuplicar).toHaveBeenCalledWith(orcamentos[0]);
  });
});
