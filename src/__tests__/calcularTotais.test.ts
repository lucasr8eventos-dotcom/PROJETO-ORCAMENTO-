import { calcularTotais } from '../data';

describe('calcularTotais', () => {
  it('calcula subtotal corretamente com múltiplos itens', () => {
    const result = calcularTotais({
      itens: [
        { id: '1', descricao: 'A', quantidade: 2, valorUnitario: 100 },
        { id: '2', descricao: 'B', quantidade: 3, valorUnitario: 200 },
      ],
      desconto: 0,
      impostos: 0,
    });
    expect(result.subtotal).toBe(800);
    expect(result.total).toBe(800);
  });

  it('aplica desconto corretamente', () => {
    const result = calcularTotais({
      itens: [{ id: '1', descricao: 'A', quantidade: 1, valorUnitario: 1000 }],
      desconto: 10,
      impostos: 0,
    });
    expect(result.subtotal).toBe(1000);
    expect(result.total).toBe(900);
  });

  it('aplica impostos sobre o valor já descontado', () => {
    const result = calcularTotais({
      itens: [{ id: '1', descricao: 'A', quantidade: 1, valorUnitario: 1000 }],
      desconto: 10,
      impostos: 10,
    });
    expect(result.subtotal).toBe(1000);
    expect(result.total).toBe(990);
  });

  it('retorna total zero com lista de itens vazia', () => {
    const result = calcularTotais({ itens: [], desconto: 0, impostos: 0 });
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('sem desconto e sem imposto: total igual ao subtotal', () => {
    const result = calcularTotais({
      itens: [{ id: '1', descricao: 'X', quantidade: 5, valorUnitario: 300 }],
      desconto: 0,
      impostos: 0,
    });
    expect(result.total).toBe(result.subtotal);
    expect(result.total).toBe(1500);
  });

  it('desconto 100% resulta em total zero (sem imposto)', () => {
    const result = calcularTotais({
      itens: [{ id: '1', descricao: 'X', quantidade: 1, valorUnitario: 500 }],
      desconto: 100,
      impostos: 0,
    });
    expect(result.total).toBe(0);
  });
});
