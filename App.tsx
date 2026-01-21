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
  const [user, setUser] = useState<AppUser | null>(dbService.getCurrentUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const handleLogin = (newUser: AppUser) => {
    localStorage.setItem('current_user', JSON.stringify(newUser));
    dbService.initializeDefaultData(newUser.id);
    setUser(newUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user');
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