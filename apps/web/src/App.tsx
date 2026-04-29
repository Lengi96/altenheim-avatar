import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResidentProvider } from './context/ResidentContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import IdleScreen from './screens/IdleScreen';
import ConversationScreen from './screens/ConversationScreen';
import VideoScreen from './screens/VideoScreen';
import GamesScreen from './screens/GamesScreen';
import MusicScreen from './screens/MusicScreen';
import AdminLogin from './screens/admin/AdminLogin';
import AdminLayout from './screens/admin/AdminLayout';
import AdminResidents from './screens/admin/AdminResidents';
import AdminSchedules from './screens/admin/AdminSchedules';
import AdminNotifications from './screens/admin/AdminNotifications';
import ReminderOverlay from './components/ReminderOverlay';
import OfflineBanner from './components/OfflineBanner';

export default function App() {
  return (
    <BrowserRouter>
      <ResidentProvider>
        <ReminderOverlay />
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<IdleScreen />} />
          <Route path="/conversation" element={<ConversationScreen />} />
          <Route path="/video" element={<VideoScreen />} />
          <Route path="/games" element={<GamesScreen />} />
          <Route path="/music" element={<MusicScreen />} />
          <Route path="/admin/login" element={<AdminAuthProvider><AdminLogin /></AdminAuthProvider>} />
          <Route path="/admin" element={<AdminAuthProvider><AdminLayout /></AdminAuthProvider>}>
            <Route index element={<Navigate to="/admin/residents" replace />} />
            <Route path="residents" element={<AdminResidents />} />
            <Route path="schedules" element={<AdminSchedules />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Routes>
      </ResidentProvider>
    </BrowserRouter>
  );
}
