// src/AppRoutes.tsx
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { FinanceManagement } from './pages/FinanceManagement';
import CompanyProfilePage from './pages/CompanyProfile';
import { AgencyRegister } from './pages/AgencyRegister';
import { AgencyOnboarding } from './pages/AgencyOnboarding';
import { AgencyPortal } from './pages/AgencyPortal';
import { Login } from './components/Auth/Login';
import { useEffect } from 'react';
import { FullScreenLoader } from './components/Common/FullScreenLoader';

export const AppRoutes = () => {
    const { profile, loading, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && user) {
            const isAgency = !!profile?.agency_id;
            const isStaff = !isAgency;

            // Se for staff, não for admin, e estiver na rota de agência, redireciona para o dashboard
            if (isStaff && !profile?.is_admin && (location.pathname.startsWith('/agency-portal') || location.pathname.startsWith('/agency-register'))) {
                navigate('/');
            }
            // Se for agência e não estiver no portal, redireciona para o portal
            if (isAgency && !location.pathname.startsWith('/agency-portal')) {
                navigate('/agency-portal');
            }
        }
    }, [loading, user, profile, navigate, location.pathname]);

    // Renderiza o login para usuários não autenticados
    if (loading) {
        return <FullScreenLoader message="Inicializando aplicação..." />;
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/agency-register" element={<AgencyRegister />} />
                <Route path="/cadastro-agencia" element={<AgencyOnboarding />} />
                <Route path="*" element={<Login />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/agency-portal" element={
              <ProtectedRoute>
                <AgencyPortal />
              </ProtectedRoute>
            } />

            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="cadastros" element={<Settings />} />
                    <Route path="usuarios" element={<UserManagement />} />
                    <Route path="financeiro" element={<FinanceManagement />} />
                    <Route path="perfil-empresa" element={<CompanyProfilePage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
        </Routes>
    );
}
