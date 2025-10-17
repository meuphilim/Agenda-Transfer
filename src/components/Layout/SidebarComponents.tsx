import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '../../lib/utils';

// ==================== CONTEXT ====================

interface SidebarContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// ==================== PROVIDER ====================

interface SidebarProviderProps {
  children: ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: SidebarProviderProps) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

// ==================== SIDEBAR ROOT ====================

interface SidebarProps {
  children: ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}

export const SidebarRoot = ({ children, open, setOpen, animate }: SidebarProps) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

// ==================== SIDEBAR BODY ====================

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<'div'>)} />
    </>
  );
};

// ==================== DESKTOP SIDEBAR ====================

const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        'h-screen p-4 hidden md:flex md:flex-col bg-white shadow-lg border-r border-gray-200 flex-shrink-0',
        className
      )}
      animate={{
        width: animate ? (open ? '256px' : '80px') : '256px',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ==================== MOBILE SIDEBAR ====================

const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Header Mobile */}
      <div
        className={cn(
          'h-16 px-4 flex flex-row md:hidden items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg'
        )}
        {...props}
      >
        <h1 className="text-xl font-bold text-white">TourManager</h1>
        <button
          onClick={() => setOpen(!open)}
          className="text-white p-2 hover:bg-blue-800 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Menu Lateral Mobile */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              className={cn(
                'fixed h-full w-64 inset-y-0 left-0 bg-white shadow-2xl z-50 flex flex-col md:hidden',
                className
              )}
            >
              {/* Botão Fechar */}
              <div className="flex items-center justify-end h-16 px-4">
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 p-2 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};