import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FormatMessageProps {
  driverName: string;
  clientName: string;
  date: string;
  startTime: string;
  tourStartTime?: string;
  attractions: string[];
}

export const formatScheduleMessage = ({
  driverName,
  clientName,
  date,
  startTime,
  tourStartTime,
  attractions,
}: FormatMessageProps) => {
  const formattedDate = format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  const attractionsText = attractions.join(' + ');

  return `Olá ${driverName}

Segue a confirmação de transporte:
Data: ${formattedDate}
Cliente: ${clientName.toUpperCase()}
Horário de saída: ${startTime}${tourStartTime ? `\nHorário de início do passeio: ${tourStartTime}` : ''}
Passeio: ${attractionsText}

Por favor, confirmar o recebimento e a programação.`;
};