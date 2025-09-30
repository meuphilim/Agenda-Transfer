import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  clientName: string;
  startTime: string;
  endTime?: string;
  attractionName: string;
}

interface FormatMessageProps {
  driverName: string;
  date: string;
  activities: Activity[];
}

export const formatScheduleMessage = ({
  driverName,
  date,
  activities,
}: FormatMessageProps): string => {
  const formattedDate = format(new Date(date), "dd/MM/yyyy", { locale: ptBR });

  // Ordenar atividades por horário
  const sortedActivities = [...activities].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Formatar lista de atividades
  const activitiesText = sortedActivities
    .map((activity, index) => `${index > 0 ? '\n' : ''}Cliente: ${activity.clientName.toUpperCase()}
Passeio: ${activity.attractionName}
Horário de saída: ${activity.startTime}${activity.endTime ? `
Horário de término: ${activity.endTime}` : ''}`)
    .join('\n');

  return `Olá ${driverName}

Segue a confirmação de transporte:
Data: ${formattedDate}
${activitiesText}

Por favor, confirmar o recebimento e a programação.`;
}