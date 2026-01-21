
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import TraderList from './components/TraderList';
import Login from './components/Login';
import InstallBanner from './components/InstallBanner';
import { Trade, AppUser } from './types';
import { supabase, dbService } from './services/dbService';

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const startSession = (sessionUser: any) => {
    const appUser: AppUser = {
      id: sessionUser.id,
      nombre_academia: sessionUser.user_metadata?.nombre_academia || 'Mi Academia',
      email: sessionUser.email || '',
      created_at: sessionUser.created_at || new Date().toISOString()
    };
    
    setUser(appUser);
    localStorage.setItem('academy_auth_user', JSON.stringify(appUser));
    
    // Background sync - non-blocking
    if (dbService.isCloudEnabled()) {
      dbService.syncFromCloud().catch(e => {
        console.warn("Background sync failed, using local cache.", e);
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Solo activamos carga si no hay un usuario ya en el estado para evitar bloqueos
      if (!user) {
        setIsLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            startSession(session.user);
          } else {
            setUser(null);
          }
        } catch (e) {
          console.error("Auth init error:", e);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        startSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('academy_auth_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (newUser: AppUser) => {
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('academy_auth_user');
    setCurrentView('dashboard');
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setCurrentView('registrar');
  };

  const handleFormSuccess = () => {
    setEditingTrade(undefined);
    setCurrentView('operaciones');
  };

  // Solo mostrar pantalla de carga si estamos verificando y no tenemos usuario
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Verificando Credenciales...</p>
      </div>
    );
  }

  // Si no hay sesión, Login inmediatamente
  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <InstallBanner />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'registrar':
        return (
          <TradeForm 
            editTrade={editingTrade} 
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setEditingTrade(undefined);
              setCurrentView('operaciones');
            }} 
          />
        );
      case 'operaciones':
        return <TradeList onEdit={handleEditTrade} />;
      case 'traders':
        return <TraderList />;
      default:
        return <Dashboard />;
    }
  };

  // Si hay sesión activa, Dashboard
  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      user={user} 
      onLogout={handleLogout}
    >
      {renderView()}
      <InstallBanner />
    </Layout>
  );
};

export default App;
