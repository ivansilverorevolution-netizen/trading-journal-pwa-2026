import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeForm from './components/TradeForm';
import TraderList from './components/TraderList';
import Login from './components/Login';
import { dbService } from './services/dbService';
import { AppUser, Trade } from './types';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editTrade, setEditTrade] = useState<Trade | undefined>(undefined);

  useEffect(() => {
    dbService.initializeDefaultData();
    const currentUser = dbService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogin = (loggedUser: AppUser) => {
    setUser(loggedUser);
    dbService.setCurrentUser(loggedUser);
  };

  const handleLogout = () => {
    setUser(null);
    dbService.setCurrentUser(null);
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={handleNavigate} 
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && <Dashboard onNavigate={handleNavigate} onEdit={handleEditTrade} />}
      
      {currentView === 'operaciones' && (
        <TradeList onEdit={handleEditTrade} />
      )}
      
      {currentView === 'registrar' && (
        <TradeForm 
          editTrade={editTrade}
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
    </Layout>
  );
}