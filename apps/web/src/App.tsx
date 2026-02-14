import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ResidentLoginPage from './pages/ResidentLoginPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/resident" element={<ResidentLoginPage />} />
        <Route path="*" element={<Navigate to="/resident" replace />} />
      </Routes>
    );
  }

  if (role === 'resident') {
    return (
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    );
  }

  // Staff: admin, caregiver, family
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
