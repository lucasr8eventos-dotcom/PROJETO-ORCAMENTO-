import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import { Orcamento } from '../types';

const hoje = new Date().toISOString().slice(0, 10);

const orcamentos: Orcamento[] = [
  {
    id: 'o1', numero: 'ORÇ-0001', clienteId: 'c1', clienteNome: 'Alpha Ltda', contato: '',
    status: 'aprovado', desconto: 0, impostos: 0, observacoes: '', criadoEm: hoje, validade: hoje,
    itens: [], subtotal: 2000, total: 2000,
  },
  {
    id: 'o2', numero: 'ORÇ-0002', clienteId: 'c2', clienteNome: 'Beta SA', contato: '',
    status: 'aguardando', desconto: 0, impostos: 0, observacoes: '', criadoEm: hoje, validade: hoje,
    itens: [], subtotal: 1500, total: 1500,
  },
  {
    id: 'o3', numero: 'ORÇ-0003', clienteId: 'c3', clienteNome: 'Gama ME', contato: '',
    status: 'recusado', desconto: 0, impostos: 0, observacoes: '', criadoEm: hoje, validade: hoje,
    itens: [], subtotal: 800, total: 800,
  },
];

describe('Dashboard', () => {
  it('renderiza os cards de resumo do mês', () => {
    render(<Dashboard orcamentos={orcamentos} onVerOrcamentos={jest.fn()} onEditar={jest.fn()} />);
    expect(screen.getAllByText(/Aprovados/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Previstos/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Recusados/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Total do mês/)).toBeInTheDocument();
  });

  it('exibe últimos orçamentos na tabela', () => {
    render(<Dashboard orcamentos={orcamentos} onVerOrcamentos={jest.fn()} onEditar={jest.fn()} />);
    expect(screen.getByText('Alpha Ltda')).toBeInTheDocument();
    expect(screen.getByText('Beta SA')).toBeInTheDocument();
    expect(screen.getByText('Gama ME')).toBeInTheDocument();
  });

  it('chama onVerOrcamentos ao clicar em "Ver todos"', () => {
    const onVer = jest.fn();
    render(<Dashboard orcamentos={orcamentos} onVerOrcamentos={onVer} onEditar={jest.fn()} />);
    fireEvent.click(screen.getByText('Ver todos →'));
    expect(onVer).toHaveBeenCalled();
  });

  it('chama onEditar ao clicar em um orçamento', () => {
    const onEditar = jest.fn();
    render(<Dashboard orcamentos={orcamentos} onVerOrcamentos={jest.fn()} onEditar={onEditar} />);
    fireEvent.click(screen.getByText('Alpha Ltda'));
    expect(onEditar).toHaveBeenCalledWith(orcamentos[0]);
  });

  it('renderiza corretamente com lista vazia', () => {
    render(<Dashboard orcamentos={[]} onVerOrcamentos={jest.fn()} onEditar={jest.fn()} />);
    expect(screen.getByText(/Taxa de conversão/)).toBeInTheDocument();
    expect(screen.getByText('Ticket médio aprovados')).toBeInTheDocument();
  });
});
