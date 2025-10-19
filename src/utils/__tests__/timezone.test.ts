import { describe, it, expect } from 'vitest';
import { getNowInMS, createDateInMS, addMinutes, isSameDay } from '../timezone';

describe('Timezone Utilities', () => {
  it('deve criar data corretamente em GMT-4', () => {
    const date = createDateInMS('2025-01-15', '09:00');
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(0);
  });

  it('deve adicionar minutos corretamente', () => {
    const start = createDateInMS('2025-01-15', '09:00');
    const end = addMinutes(start, 90);
    expect(end.getHours()).toBe(10);
    expect(end.getMinutes()).toBe(30);
  });

  it('deve identificar mesmo dia corretamente', () => {
    const date1 = createDateInMS('2025-01-15', '09:00');
    const date2 = createDateInMS('2025-01-15', '16:00');
    expect(isSameDay(date1, date2)).toBe(true);
  });

  it('deve retornar horário atual em GMT-4', () => {
    const now = getNowInMS();
    expect(now).toBeInstanceOf(Date);
  });
});