import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginScreen } from './pages/LoginScreen';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { UserDashboard } from './pages/UserDashboard';
import { HSADashboard } from './pages/HSADashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { useState } from 'react';

function ProtectedRoute({ children, role, userRole }) {
  if (userRole !== role) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = (role, data) => {
    setUserRole(role);
    setUser(data);
  };

  const handleLogout = () => {
    setUserRole(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          userRole ? <Navigate to={`/${userRole}`} /> : <LoginScreen onLogin={handleLogin} onBack={() => window.location.href = '/'} />
        } />
        <Route path="/onboarding" element={<OnboardingFlow onComplete={() => window.location.href = '/login'} onBack={() => window.location.href = '/'} />} />
        <Route path="/user" element={<ProtectedRoute role="user" userRole={userRole}><UserDashboard user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/hsa" element={<ProtectedRoute role="hsa" userRole={userRole}><HSADashboard hsa={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin" userRole={userRole}><AdminDashboard onLogout={handleLogout} /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
