import { useEffect } from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import BottomNavigation from './components/BottomNavigation/BottomNavigation.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AppRoutes from './routes.jsx';
import useTranslation from './i18n/useTranslation.js';

export default function App() {
  const { user, loading } = useAuth();
  const { language, t } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('brand.documentTitle');
  }, [language, t]);

  if (loading) return <LoadingScreen message={t('voice.loadingCustomers')} />;
  if (!user) return <Login />;

  return (
    <div className="app-shell">
      <Navbar user={user} />
      <main className="app-main">
        <AppRoutes />
      </main>
      <BottomNavigation />
    </div>
  );
}
