import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Agenda } from './pages/Agenda';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { FinanceManagement } from './pages/FinanceManagement';

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="cadastros" element={<Settings />} />
                    <Route path="usuarios" element={<UserManagement />} />
                    <Route path="financeiro" element={<FinanceManagement />} />
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
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
