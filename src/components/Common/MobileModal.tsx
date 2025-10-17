import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const MobileModal = ({ isOpen, onClose, title, children, footer }: MobileModalProps) => {
  // Verificação para evitar erro de "window is not defined" no lado do servidor
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay (Desktop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:block fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{
              opacity: 0,
              scale: isMobile ? 1 : 0.95,
              x: isMobile ? '100%' : 0
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              scale: isMobile ? 1 : 0.95,
              x: isMobile ? '100%' : 0
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut'
            }}
            className={cn(
              // Mobile: Full screen
              "fixed inset-0 bg-white z-50",
              // Desktop: Centered modal
              "md:fixed md:inset-auto md:flex md:items-center md:justify-center md:p-4 md:bg-transparent"
            )}
          >
            <div className={cn(
              "h-full flex flex-col",
              "md:bg-white md:rounded-lg md:shadow-xl md:max-w-2xl md:w-full md:max-h-[90vh]"
            )}>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {children}
              </div>

              {/* Footer (se houver) */}
              {footer && (
                <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white sticky bottom-0">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};