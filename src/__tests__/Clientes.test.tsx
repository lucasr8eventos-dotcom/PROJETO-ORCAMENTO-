import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Clientes from '../components/Clientes';
import { Cliente } from '../types';

const clientes: Cliente[] = [
  { id: 'c1', nome: 'Ana Silva',   email: 'ana@test.com',    telefone: '(11) 99999-1111', empresa: 'Empresa A', cnpj: '11.111.111/0001-11', cpf: '', endereco: 'Rua A, 1', criadoEm: '2026-01-10' },
  { id: 'c2', nome: 'Bruno Costa', email: 'bruno@test.com',  telefone: '(11) 98888-2222', empresa: 'Empresa B', cnpj: '22.222.222/0001-22', cpf: '', endereco: 'Rua B, 2', criadoEm: '2026-02-15' },
];

describe('Clientes', () => {
  it('renderiza lista de clientes', () => {
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
  });

  it('filtra clientes pela busca', () => {
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    const busca = screen.getByPlaceholderText('Buscar cliente...');
    fireEvent.change(busca, { target: { value: 'Bruno' } });
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
  });

  it('mostra mensagem quando busca não encontra resultado', () => {
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar cliente...'), { target: { value: 'xyz-inexistente' } });
    expect(screen.getByText('Nenhum cliente encontrado')).toBeInTheDocument();
  });

  it('abre modal de novo cliente', () => {
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo cliente'));
    expect(screen.getByText('Novo cliente', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nome completo')).toBeInTheDocument();
  });

  it('exibe alerta se salvar sem nome', () => {
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo cliente'));
    fireEvent.click(screen.getByText('Criar cliente'));
    expect(window.alert).toHaveBeenCalledWith('Nome obrigatório');
  });

  it('chama onSalvar com novo cliente preenchido', () => {
    const onSalvar = jest.fn();
    render(<Clientes clientes={clientes} onSalvar={onSalvar} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo cliente'));
    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'Carlos Novo' } });
    fireEvent.change(screen.getByPlaceholderText('email@empresa.com'), { target: { value: 'carlos@test.com' } });
    fireEvent.click(screen.getByText('Criar cliente'));
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Carlos Novo', email: 'carlos@test.com' }));
  });

  it('abre modal de edição ao clicar no cliente', () => {
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(screen.getByText('Editar cliente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ana Silva')).toBeInTheDocument();
  });

  it('chama onDelete ao excluir cliente', () => {
    const onDelete = jest.fn();
    render(<Clientes clientes={clientes} onSalvar={jest.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.click(screen.getByText('Excluir'));
    expect(onDelete).toHaveBeenCalledWith('c1');
  });
});
