import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginScreen } from './pages/LoginScreen';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { UserDashboard } from './pages/UserDashboard';
import { HSADashboard } from './pages/HSADashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { useUser } from './context/UserContext';

function ProtectedRoute({ children, role, userRole }) {
  if (userRole !== role) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const { user, userRole, logout } = useUser();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        userRole ? <Navigate to={`/${userRole}`} /> : <LoginScreen onBack={() => window.location.href = '/'} />
      } />
      <Route path="/onboarding" element={<OnboardingFlow onBack={() => window.location.href = '/'} />} />
      <Route path="/user" element={<ProtectedRoute role="user" userRole={userRole}><UserDashboard user={user} onLogout={logout} /></ProtectedRoute>} />
      <Route path="/hsa" element={<ProtectedRoute role="hsa" userRole={userRole}><HSADashboard hsa={user} onLogout={logout} /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin" userRole={userRole}><AdminDashboard onLogout={logout} /></ProtectedRoute>} />
    </Routes>
  );
}
