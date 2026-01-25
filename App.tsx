
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeForm from './components/TradeForm';
import TraderList from './components/TraderList';
import CompoundCalculator from './components/CompoundCalculator';
import Login from './components/Login';
import InstallBanner from './components/InstallBanner';
import { dbService } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { AppUser, Trade } from './types';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editTrade, setEditTrade] = useState<Trade | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [dashboardFilterId, setDashboardFilterId] = useState<string>('all');

  useEffect(() => {
    // Aplicar tema guardado inmediatamente al iniciar la app para evitar destellos
    const savedTheme = localStorage.getItem('tradecontrol_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Escuchar cambios de sesión en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const academyUser = dbService.getCurrentUser();
        setUser({
          id: session.user.id,
          nombre_academia: academyUser?.nombre_academia || session.user.user_metadata?.academy_name || 'Mi Academia',
          email: session.user.email || '',
          created_at: session.user.created_at
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const academyUser = dbService.getCurrentUser();
        setUser({
          id: session.user.id,
          nombre_academia: academyUser?.nombre_academia || session.user.user_metadata?.academy_name || 'Mi Academia',
          email: session.user.email || '',
          created_at: session.user.created_at
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (loggedUser: AppUser) => {
    dbService.setCurrentUser(loggedUser);
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dbService.setCurrentUser(null);
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setEditTrade(undefined);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditTrade(trade);
    setCurrentView('registrar');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Cargando TradeControl...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <InstallBanner />
      <Layout 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        user={user}
        onLogout={handleLogout}
      >
        {currentView === 'dashboard' && (
          <Dashboard 
            onNavigate={handleNavigate} 
            onEdit={handleEditTrade} 
            defaultFilterId={dashboardFilterId}
            onFilterChange={(id) => setDashboardFilterId(id)}
          />
        )}
        
        {currentView === 'operaciones' && (
          <TradeList onEdit={handleEditTrade} />
        )}
        
        {currentView === 'registrar' && (
          <TradeForm 
            editTrade={editTrade}
            defaultTraderId={dashboardFilterId !== 'all' ? dashboardFilterId : undefined}
            onSuccess={() => {
              setEditTrade(undefined);
              setCurrentView('dashboard');
            }}
            onCancel={() => {
              setEditTrade(undefined);
              setCurrentView('dashboard');
            }}
          />
        )}
        
        {currentView === 'traders' && <TraderList />}

        {currentView === 'proyecciones' && <CompoundCalculator />}
      </Layout>
    </div>
  );
}
