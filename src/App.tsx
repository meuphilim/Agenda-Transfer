import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { Packages } from './pages/Packages';
import { Agencies } from './pages/Agencies';
import { Vehicles } from './pages/Vehicles';
import { Attractions } from './pages/Attractions';
import { Drivers } from './pages/Drivers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<Schedule />} />
                <Route path="/reservas" element={<Packages />} />
                <Route path="/agencias" element={<Agencies />} />
                <Route path="/veiculos" element={<Vehicles />} />
                <Route path="/atrativos" element={<Attractions />} />
                <Route path="/motoristas" element={<Drivers />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
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
  );
}

export default App;