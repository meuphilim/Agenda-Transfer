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

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="App">
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
