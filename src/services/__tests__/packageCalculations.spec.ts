import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { calculatePackageFinancials } from '../packageCalculations';

// Mocking the Supabase client for vitest
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const supabaseMock = supabase as { from: vi.Mock };

describe('calculatePackageFinancials', () => {
  const selectMock = vi.fn().mockReturnThis();
  const eqMock = vi.fn().mockReturnThis();
  const gteMock = vi.fn().mockReturnThis();
  const lteMock = vi.fn(); // Final call in the chain for expenses
  const singleMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.from.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      eq: eqMock,
    });
    eqMock.mockReturnValue({
      single: singleMock,
      gte: gteMock,
    });
    gteMock.mockReturnValue({
      lte: lteMock,
    });
  });

  it('should correctly calculate financials with all components', async () => {
    const mockPackageData = {
      id: 'pkg-1', valor_diaria_servico: 100, considerar_diaria_motorista: true, driver_id: 'drv-1', vehicle_id: 'vhc-1', start_date: '2023-10-01', end_date: '2023-10-02',
      drivers: { valor_diaria_motorista: 50 },
      package_attractions: [
        { scheduled_date: '2023-10-01', considerar_valor_net: true, attractions: { name: 'Attraction 1', valor_net: 200 } },
        { scheduled_date: '2023-10-02', considerar_valor_net: false, attractions: { name: 'Attraction 2', valor_net: 0 } },
      ],
    };
    const mockVehicleExpenses = [{ description: 'Fuel', amount: 75, category: 'combustivel', date: '2023-10-01' }];

    singleMock.mockResolvedValue({ data: mockPackageData, error: null });
    lteMock.mockResolvedValue({ data: mockVehicleExpenses, error: null });

    const result = await calculatePackageFinancials('pkg-1');

    expect(result.totalRevenue).toBe(300); // 100 (service) + 200 (NET)
    expect(result.totalCosts).toBe(175);   // 100 (driver) + 75 (vehicle)
    expect(result.grossMargin).toBe(125);
  });

  it('should not include driver cost if disabled', async () => {
    const mockPackageData = {
      id: 'pkg-2', valor_diaria_servico: 100, considerar_diaria_motorista: false, driver_id: 'drv-1', vehicle_id: null, start_date: '2023-10-01', end_date: '2023-10-01',
      drivers: { valor_diaria_motorista: 50 },
      package_attractions: [ { scheduled_date: '2023-10-01', considerar_valor_net: false, attractions: { name: 'Attraction 1', valor_net: 0 } } ],
    };

    singleMock.mockResolvedValue({ data: mockPackageData, error: null });
    lteMock.mockResolvedValue({ data: [], error: null }); // No vehicle expenses

    const result = await calculatePackageFinancials('pkg-2');

    expect(result.totalRevenue).toBe(100);
    expect(result.totalCosts).toBe(0);
    expect(result.grossMargin).toBe(100);
  });

  it('should handle packages with no vehicle expenses', async () => {
    const mockPackageData = {
      id: 'pkg-3', valor_diaria_servico: 0, considerar_diaria_motorista: true, driver_id: 'drv-1', vehicle_id: 'vhc-1', start_date: '2023-10-01', end_date: '2023-10-01',
      drivers: { valor_diaria_motorista: 50 },
      package_attractions: [ { scheduled_date: '2023-10-01', considerar_valor_net: true, attractions: { name: 'Attraction 1', valor_net: 300 } } ],
    };

    singleMock.mockResolvedValue({ data: mockPackageData, error: null });
    lteMock.mockResolvedValue({ data: [], error: null });

    const result = await calculatePackageFinancials('pkg-3');

    expect(result.totalRevenue).toBe(300);
    expect(result.totalCosts).toBe(50);
    expect(result.totalVehicleExpenses).toBe(0);
    expect(result.grossMargin).toBe(250);
  });
});