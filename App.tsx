
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import TraderList from './components/TraderList';
import Login from './components/Login';
import InstallBanner from './components/InstallBanner';
import { Trade, AppUser } from './types';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  useEffect(() => {
    // Immediate check of local storage for session
    const checkSession = () => {
      const stored = localStorage.getItem('academy_auth_user');
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse local session", error);
          localStorage.removeItem('academy_auth_user');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = (newUser: AppUser) => {
    setUser(newUser);
    localStorage.setItem('academy_auth_user', JSON.stringify(newUser));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
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

  // Immediate rendering of Login if no user is present
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Cargando...</p>
      </div>
    );
  }

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
