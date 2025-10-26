import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FinanceTable } from '../FinanceTable';
import { PackageWithRelations } from '../../../services/financeApi';

// Mock data
const mockPackages: PackageWithRelations[] = [
  {
    id: '1',
    title: 'Pacote Teste 1',
    client_name: 'Cliente 1',
    agencies: { id: 'a1', name: 'Agência 1' },
    start_date: '2023-10-01',
    valor_receita_total: 1000,
    valor_diaria_servico_calculado: 200,
    valor_net_receita: 800,
    valor_custo_total: 500,
    valor_diaria_motorista_calculado: 300,
    valor_despesas_veiculo: 200,
    valor_margem_bruta: 500,
    percentual_margem: 50,
    status_pagamento: 'pago',
  } as PackageWithRelations,
  {
    id: '2',
    title: 'Pacote Teste 2',
    client_name: 'Cliente 2',
    agencies: { id: 'a2', name: 'Agência 2' },
    start_date: '2023-10-02',
    valor_receita_total: 800,
    valor_diaria_servico_calculado: 100,
    valor_net_receita: 700,
    valor_custo_total: 900,
    valor_diaria_motorista_calculado: 400,
    valor_despesas_veiculo: 500,
    valor_margem_bruta: -100,
    percentual_margem: -12.5,
    status_pagamento: 'pendente',
  } as PackageWithRelations,
];

describe('FinanceTable', () => {
  it('renders correctly with given packages in desktop view', () => {
    render(<FinanceTable packages={mockPackages} loading={false} onEdit={() => {}} />);

    const desktopTable = screen.getByRole('table');

    expect(within(desktopTable).getByText('Pacote / Cliente')).toBeInTheDocument();
    expect(within(desktopTable).getByText('Receita Total')).toBeInTheDocument();

    const row1 = within(desktopTable).getByText('Pacote Teste 1').closest('tr');
    expect(within(row1!).getByText('Cliente 1')).toBeInTheDocument();
    expect(within(row1!).getByText('R$ 1.000,00')).toBeInTheDocument();

    const positiveMarginBadge = within(row1!).getByText(/R\$\s*500,00.*50\.0%/).parentElement;
    expect(positiveMarginBadge).toHaveClass('text-green-800');

    const row2 = within(desktopTable).getByText('Pacote Teste 2').closest('tr');
    const negativeMarginBadge = within(row2!).getByText(/-R\$\s*100,00.*-12\.5%/).parentElement;
    expect(negativeMarginBadge).toHaveClass('text-red-800');
  });

  it('shows loading state correctly', () => {
    render(<FinanceTable packages={[]} loading={true} onEdit={() => {}} />);
    // O spinner é renderizado com um 'role' para acessibilidade.
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state correctly', () => {
    render(<FinanceTable packages={[]} loading={false} onEdit={() => {}} />);
    expect(screen.getByText('Nenhum pacote encontrado')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEditMock = vi.fn();
    render(<FinanceTable packages={[mockPackages[0]]} loading={false} onEdit={onEditMock} />);

    const editButton = screen.getByTestId('edit-button-1');
    fireEvent.click(editButton);

    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onEditMock).toHaveBeenCalledWith(mockPackages[0]);
  });
});