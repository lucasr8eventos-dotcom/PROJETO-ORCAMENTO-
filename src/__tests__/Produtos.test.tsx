import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Produtos from '../components/Produtos';
import { Produto } from '../types';

const produtos: Produto[] = [
  { id: 'p1', nome: 'Projetor HD', categoria: 'Vídeo',  preco: 1200, unidade: 'diária', estoque: 8,    tipo: 'produto', ativo: true  },
  { id: 'p2', nome: 'Consultoria', categoria: 'Serviço', preco: 280,  unidade: 'hora',   estoque: null, tipo: 'servico', ativo: true  },
  { id: 'p3', nome: 'Mesa LED',    categoria: 'Luz',     preco: 650,  unidade: 'diária', estoque: 20,   tipo: 'produto', ativo: false },
];

describe('Produtos', () => {
  it('renderiza todos os produtos', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Projetor HD')).toBeInTheDocument();
    expect(screen.getByText('Consultoria')).toBeInTheDocument();
    expect(screen.getByText('Mesa LED')).toBeInTheDocument();
  });

  it('aba "Produtos" filtra apenas produtos físicos', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Produtos'));
    expect(screen.getByText('Projetor HD')).toBeInTheDocument();
    expect(screen.queryByText('Consultoria')).not.toBeInTheDocument();
  });

  it('aba "Serviços" filtra apenas serviços', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Serviços'));
    expect(screen.getByText('Consultoria')).toBeInTheDocument();
    expect(screen.queryByText('Projetor HD')).not.toBeInTheDocument();
  });

  it('busca filtra por nome', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar...'), { target: { value: 'Projetor' } });
    expect(screen.getByText('Projetor HD')).toBeInTheDocument();
    expect(screen.queryByText('Consultoria')).not.toBeInTheDocument();
  });

  it('abre modal de novo produto', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo item'));
    expect(screen.getByText('Novo produto / serviço')).toBeInTheDocument();
  });

  it('exibe alerta se salvar sem nome', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo item'));
    fireEvent.click(screen.getByText('Criar item'));
    expect(window.alert).toHaveBeenCalledWith('Nome obrigatório');
  });

  it('chama onSalvar com produto preenchido', () => {
    const onSalvar = jest.fn();
    render(<Produtos produtos={produtos} onSalvar={onSalvar} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo item'));
    fireEvent.change(screen.getByPlaceholderText('Ex: Projetor HD 4K'), { target: { value: 'Novo Produto' } });
    fireEvent.click(screen.getByText('Criar item'));
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Novo Produto' }));
  });

  it('campo Estoque oculto para tipo Serviço', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Novo item'));
    const tipoSelect = screen.getByDisplayValue('Produto');
    fireEvent.change(tipoSelect, { target: { value: 'servico' } });
    expect(screen.queryByLabelText('Estoque')).not.toBeInTheDocument();
  });

  it('abre modal de edição ao clicar no produto', () => {
    render(<Produtos produtos={produtos} onSalvar={jest.fn()} onDelete={jest.fn()} />);
    fireEvent.click(screen.getByText('Projetor HD'));
    expect(screen.getByText('Editar item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Projetor HD')).toBeInTheDocument();
  });
});
