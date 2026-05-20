import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../components/Login';

jest.mock('../api', () => ({
  authApi: { login: jest.fn() },
}));

import { authApi } from '../api';

const emailInput = () => screen.getByPlaceholderText('seu@email.com');
const senhaInput = () => screen.getByPlaceholderText('••••••••');
const btnEntrar  = () => screen.getByRole('button', { name: 'Entrar' });

describe('Login', () => {
  beforeEach(() => { (authApi.login as jest.Mock).mockReset(); });

  it('renderiza tela de login', () => {
    render(<Login onLogin={jest.fn()} />);
    expect(screen.getByText('Entrar na plataforma')).toBeInTheDocument();
    expect(emailInput()).toBeInTheDocument();
    expect(senhaInput()).toBeInTheDocument();
  });

  it('exibe erro ao submeter sem preencher campos', () => {
    render(<Login onLogin={jest.fn()} />);
    fireEvent.click(btnEntrar());
    expect(screen.getByText('Preencha e-mail e senha.')).toBeInTheDocument();
  });

  it('exibe erro ao falhar no login da API', async () => {
    (authApi.login as jest.Mock).mockRejectedValueOnce(new Error('Credenciais inválidas'));
    render(<Login onLogin={jest.fn()} />);
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } });
    fireEvent.change(senhaInput(), { target: { value: '123' } });
    fireEvent.click(btnEntrar());
    await waitFor(() => expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument());
  });

  it('chama onLogin com sucesso', async () => {
    const onLogin = jest.fn();
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      token: 'tok', usuario: { id: 'u1', nome: 'Admin', email: 'a@b.com', role: 'admin' },
    });
    render(<Login onLogin={onLogin} />);
    fireEvent.change(emailInput(), { target: { value: 'a@b.com' } });
    fireEvent.change(senhaInput(), { target: { value: '123' } });
    fireEvent.click(btnEntrar());
    await waitFor(() => expect(onLogin).toHaveBeenCalled());
  });
});
