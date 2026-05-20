import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TelefoneInput, CpfCnpjInput, StatusBadge, CurrencyInput, DataInput, Btn } from '../components/ui';

describe('TelefoneInput', () => {
  it('formata DDD corretamente', () => {
    const onChange = jest.fn();
    render(<TelefoneInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '11' } });
    expect(onChange).toHaveBeenCalledWith('11');
  });

  it('formata número fixo (10 dígitos) como (XX) XXXX-XXXX', () => {
    const onChange = jest.fn();
    render(<TelefoneInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1134567890' } });
    expect(onChange).toHaveBeenCalledWith('(11) 3456-7890');
  });

  it('formata celular (11 dígitos) como (XX) XXXXX-XXXX', () => {
    const onChange = jest.fn();
    render(<TelefoneInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '11987654321' } });
    expect(onChange).toHaveBeenCalledWith('(11) 98765-4321');
  });

  it('ignora caracteres não numéricos', () => {
    const onChange = jest.fn();
    render(<TelefoneInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc11987654321xyz' } });
    expect(onChange).toHaveBeenCalledWith('(11) 98765-4321');
  });
});

describe('CpfCnpjInput', () => {
  it('formata CPF (11 dígitos)', () => {
    const onChange = jest.fn();
    render(<CpfCnpjInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12345678901' } });
    expect(onChange).toHaveBeenCalledWith('123.456.789-01');
  });

  it('formata CNPJ (14 dígitos)', () => {
    const onChange = jest.fn();
    render(<CpfCnpjInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12345678000195' } });
    expect(onChange).toHaveBeenCalledWith('12.345.678/0001-95');
  });

  it('limita a 14 dígitos', () => {
    const onChange = jest.fn();
    render(<CpfCnpjInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '123456789001234567' } });
    const received = (onChange.mock.calls[0][0] as string).replace(/\D/g, '');
    expect(received.length).toBeLessThanOrEqual(14);
  });
});

describe('StatusBadge', () => {
  it('renderiza badge "Aprovado"', () => {
    render(<StatusBadge status="aprovado" />);
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });

  it('renderiza badge "Rascunho" para status desconhecido', () => {
    render(<StatusBadge status="desconhecido" />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it.each([
    ['aprovado',  'Aprovado'],
    ['enviado',   'Enviado'],
    ['aguardando','Aguardando'],
    ['recusado',  'Recusado'],
    ['rascunho',  'Rascunho'],
  ])('exibe label correto para status "%s"', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('CurrencyInput', () => {
  it('exibe placeholder quando valor é zero e não focado', () => {
    render(<CurrencyInput value={0} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
  });

  it('formata valor como moeda quando não focado', () => {
    render(<CurrencyInput value={1500} onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('1.500,00')).toBeInTheDocument();
  });

  it('chama onChange com valor numérico correto', () => {
    const onChange = jest.fn();
    render(<CurrencyInput value={0} onChange={onChange} />);
    const input = screen.getByPlaceholderText('0,00');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '150000' } });
    expect(onChange).toHaveBeenCalledWith(1500);
  });
});

describe('DataInput', () => {
  it('formata data no estilo dd/mm/aaaa', () => {
    const onChange = jest.fn();
    render(<DataInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '15052026' } });
    expect(onChange).toHaveBeenCalledWith('2026-05-15');
  });
});

describe('Btn', () => {
  it('renderiza como botão primário', () => {
    render(<Btn variant="primary">Salvar</Btn>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('chama onClick ao clicar', () => {
    const onClick = jest.fn();
    render(<Btn onClick={onClick}>Clique</Btn>);
    fireEvent.click(screen.getByText('Clique'));
    expect(onClick).toHaveBeenCalled();
  });
});
