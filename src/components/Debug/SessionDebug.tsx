// src/components/Debug/SessionDebug.tsx (apenas para dev)
import { useSessionMonitor } from '../../hooks/useSessionMonitor';

export const SessionDebug: React.FC = () => {
  const { isAuthenticated, expiresAt, timeUntilExpiry, isExpired } = useSessionMonitor();

  if (import.meta.env.PROD) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono z-50">
      <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
      <div>Expira: {expiresAt ? new Date(expiresAt).toLocaleTimeString() : 'N/A'}</div>
      <div>Falta: {timeUntilExpiry ? formatTime(timeUntilExpiry) : 'N/A'}</div>
      <div>Expirado: {isExpired ? '⚠️' : '✅'}</div>
    </div>
  );
}
