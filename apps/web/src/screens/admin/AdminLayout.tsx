import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { token, user, logout } = useAdminAuth();
  const navigate = useNavigate();

  if (!token) return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-56 bg-gray-900 p-4 flex flex-col">
        <h2 className="mb-6 text-lg font-bold text-white">Altenheim Admin</h2>
        <nav className="flex flex-col gap-2 flex-1">
          <Link to="/admin/residents" className="rounded-lg p-3 text-gray-300 hover:bg-gray-700">
            👥 {t('admin.residents')}
          </Link>
          <Link to="/admin/schedules" className="rounded-lg p-3 text-gray-300 hover:bg-gray-700">
            📅 {t('admin.schedules')}
          </Link>
          <Link to="/admin/notifications" className="rounded-lg p-3 text-gray-300 hover:bg-gray-700">
            🔔 {t('admin.notifications')}
          </Link>
        </nav>
        <div className="border-t border-gray-700 pt-4">
          <p className="mb-2 text-sm text-gray-400">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-gray-700 p-2 text-sm text-gray-300 hover:bg-gray-600"
          >
            {t('admin.logout')}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}
