/**
 * Timezone utilities para garantir consistência em GMT-4 (Mato Grosso do Sul)
 */

const MS_TIMEZONE = 'America/Campo_Grande'; // GMT-4 (horário de MS)

/**
 * Obtém a data/hora atual em GMT-4
 */
export const getNowInMS = (): Date => {
  const now = new Date();
  const msTime = new Date(
    now.toLocaleString('en-US', { timeZone: MS_TIMEZONE })
  );
  return msTime;
};

/**
 * Cria um Date object a partir de data e hora no fuso GMT-4
 * @param dateStr - String no formato ISO (YYYY-MM-DD)
 * @param timeStr - String no formato HH:mm
 */
export const createDateInMS = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Criar uma string de data local e depois converter para um objeto Date
  // Esta abordagem evita problemas com a interpretação de fuso horário do construtor Date
  const localDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

  // Para garantir que a data seja tratada como local, não UTC
  return new Date(localDateString);
};


/**
 * Adiciona minutos a uma data
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

/**
 * Formata uma data para exibição no padrão brasileiro
 */
export const formatDateBR = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formata hora para exibição (HH:mm)
 */
export const formatTimeBR = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Verifica se duas datas são do mesmo dia
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Obtém início do dia (00:00)
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Obtém fim do dia (23:59:59)
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};