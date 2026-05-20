import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);
  expect(screen.getByText('OpSuite')).toBeInTheDocument();
  expect(screen.getByText('Entrar na plataforma')).toBeInTheDocument();
});
