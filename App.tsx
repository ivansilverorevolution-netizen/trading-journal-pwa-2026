
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import TraderList from './components/TraderList';
import Login from './components/Login';
import { Trade, AppUser } from './types';
import { supabase, dbService } from './services/dbService';

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const syncData = async () => {
    if (dbService.isCloudEnabled()) {
      setIsSyncing(true);
      try {
        await dbService.syncFromCloud();
      } catch (e) {
        console.warn("Fallo en sincronización inicial, continuando con datos locales.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Verificar sesión activa de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const currentUser: AppUser = {
            id: session.user.id,
            nombre_academia: session.user.user_metadata?.nombre_academia || 'Mi Academia',
            email: session.user.email || '',
            created_at: session.user.created_at || new Date().toISOString()
          };
          localStorage.setItem('academy_auth_user', JSON.stringify(currentUser));
          setUser(currentUser);
          await syncData();
        } else {
          // 2. Fallback local para rapidez
          const stored = localStorage.getItem('academy_auth_user');
          if (stored) {
            setUser(JSON.parse(stored));
          }
        }
      } catch (e) {
        console.error("Error en el arranque de la app:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();

    // Listener de auth para detectar cierres de sesión externos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('academy_auth_user');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (newUser: AppUser) => {
    setUser(newUser);
    localStorage.setItem('academy_auth_user', JSON.stringify(newUser));
    await syncData();
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('academy_auth_user');
    setUser(null);
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Iniciando Sistema...</p>
    </div>
  );

  if (isSyncing) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
      <div className="relative w-24 h-24">
         <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-white font-black tracking-[0.3em] uppercase text-sm">Sincronizando Nube</p>
        <p className="text-slate-500 text-[10px] font-bold uppercase">Esto solo tomará unos segundos...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Login onLogin={handleLogin} />;
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

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      user={user} 
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
