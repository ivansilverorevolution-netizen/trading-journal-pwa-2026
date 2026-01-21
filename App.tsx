
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
  const [isLoading, setIsLoading] = useState(false); // Requisito 4: false por defecto
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const startSession = (sessionUser: any) => {
    const appUser: AppUser = {
      id: sessionUser.id,
      nombre_academia: sessionUser.user_metadata?.nombre_academia || 'Mi Academia',
      email: sessionUser.email || '',
      created_at: sessionUser.created_at || new Date().toISOString()
    };
    
    // Establecemos el usuario inmediatamente para desbloquear la UI
    setUser(appUser);
    localStorage.setItem('academy_auth_user', JSON.stringify(appUser));
    
    // Sincronización en segundo plano (No bloquea el renderizado)
    if (dbService.isCloudEnabled()) {
      dbService.syncFromCloud().catch(e => {
        console.warn("Sincronización silenciosa fallida, usando caché local.", e);
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true); // Activamos carga solo durante la verificación
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          startSession(session.user);
        } else {
          // Intentar recuperar de cache local si no hay sesión para evitar flash de login
          const stored = localStorage.getItem('academy_auth_user');
          if (stored) {
             const cachedUser = JSON.parse(stored);
             // Solo permitimos si hay datos válidos, pero el login real lo maneja Supabase
             // Si queremos ser estrictos con la sesión, dejamos setUser(null)
             setUser(null); 
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false); // Requisito 5: Siempre se libera
      }
    };

    initAuth();

    // Suscripción a cambios de estado de autenticación
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

  // Pantalla de carga mínima y optimizada
  if (isLoading && !user) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Verificando Credenciales...</p>
    </div>
  );

  // Requisito 1: Si no hay sesión, Login inmediatamente
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

  // Requisito 2: Si hay sesión, Dashboard (a través del renderView)
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
