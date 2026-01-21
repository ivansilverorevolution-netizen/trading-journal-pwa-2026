
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Safety timeout to show login if loading takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const startSession = async (sessionUser: any) => {
    const appUser: AppUser = {
      id: sessionUser.id,
      nombre_academia: sessionUser.user_metadata?.nombre_academia || 'Mi Academia',
      email: sessionUser.email || '',
      created_at: sessionUser.created_at || new Date().toISOString()
    };
    setUser(appUser);
    localStorage.setItem('academy_auth_user', JSON.stringify(appUser));
    
    // Sincronización automática de datos en la nube
    if (dbService.isCloudEnabled()) {
      setIsSyncing(true);
      try {
        await dbService.syncFromCloud();
      } catch (e) {
        console.warn("Fallo sincronización, usando caché local.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await startSession(session.user);
        } else {
          // Fallback local por si se perdió la conexión pero hay datos previos
          const stored = localStorage.getItem('academy_auth_user');
          if (stored) {
             // Verificamos si realmente hay una sesión activa, si no limpiamos
             setUser(null);
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Suscripción a cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await startSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('academy_auth_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (newUser: AppUser) => {
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Cargando Perfil...</p>
    </div>
  );

  if (isSyncing) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
      <div className="relative w-24 h-24">
         <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-white font-black tracking-[0.3em] uppercase text-sm">Actualizando Bitácora</p>
        <p className="text-slate-500 text-[10px] font-bold uppercase">Sincronizando con la nube...</p>
      </div>
    </div>
  );

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
