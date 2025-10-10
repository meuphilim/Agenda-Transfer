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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <div className="App">
              {/* ✅ ESTRUTURA OTIMIZADA - Rotas sem wildcard desnecessário */}
              <Routes>
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route index element={<Dashboard />} />
                          <Route path="agenda" element={<Schedule />} />
                          <Route path="reservas" element={<Packages />} />
                          <Route path="cadastros" element={<Settings />} />
                          <Route path="usuarios" element={<UserManagement />} />
                          
                          {/* ✅ Rota 404 para rotas não encontradas */}
                          <Route
                            path="*"
                            element={
                              <div className="flex items-center justify-center min-h-screen bg-gray-50">
                                <div className="text-center">
                                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    Página não encontrada
                                  </h2>
                                  <p className="text-gray-600 mb-6">
                                    A página que você está procurando não existe.
                                  </p>
                                  <a
                                    href="/"
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Voltar ao Início
                                  </a>
                                </div>
                              </div>
                            }
                          />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>

              {/* ✅ Toast Container Otimizado */}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                limit={3} // ✅ Limita número de toasts simultâneos
                style={{ zIndex: 9999 }} // ✅ Garante que toasts fiquem acima de tudo
              />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
