// src/App.tsx - VERSÃO COM HEARTBEAT INTEGRADO
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Schedule } from './pages/Schedule';
import { Packages } from './pages/Packages';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { useSessionHeartbeat } from './hooks/useSessionHeartbeat';
import { useAuth } from './contexts/AuthContext';

// Componente separado para gerenciar heartbeat global
const HeartbeatManager: React.FC = () => {
  const { user, session } = useAuth();
  
  // Heartbeat global - monitora a sessão em toda a aplicação
  useSessionHeartbeat({
    heartbeatInterval: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL) || 30000,
    inactivityTimeout: Number(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000,
    enabled: !!user && !session?.user?.app_metadata?.disableHeartbeat, // Só ativa quando há usuário logado
    enableBackgroundMode: true,
    debugMode: import.meta.env.DEV,
    onSessionExpired: async () => {
      console.log('[HeartbeatManager] Sessão expirada detectada');
      // O AuthContext já lida com o logout, então não precisamos fazer nada aqui
    }
  });

  return null; // Componente invisível
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <div className="App">
              {/* Componente invisível que gerencia o heartbeat */}
              <HeartbeatManager />
              
              <Routes>
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="agenda" element={<Schedule />} />
                        <Route path="reservas" element={<Packages />} />
                        <Route path="cadastros" element={<Settings />} />
                        <Route path="usuarios" element={<UserManagement />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
              
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
