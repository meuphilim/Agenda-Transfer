// src/hooks/usePageVisibility.ts
import { useState, useEffect } from 'react';

/**
 * Hook para detectar visibilidade da página
 * Útil para pausar/retomar operações quando usuário troca de aba
 * 
 * @returns isVisible - true se página está visível
 * 
 * @example
 * ```tsx
 * const isVisible = usePageVisibility();
 * 
 * useEffect(() => {
 *   if (isVisible) {
 *     // Página voltou ao foco - atualizar dados
 *     fetchData();
 *   }
 * }, [isVisible]);
 * ```
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (import.meta.env.DEV) {
        console.log('[PageVisibility]', visible ? '👀 Visível' : '📱 Oculta');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}