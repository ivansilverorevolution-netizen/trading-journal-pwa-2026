
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeForm from './components/TradeForm';
import TraderList from './components/TraderList';
import Login from './components/Login';
import InstallBanner from './components/InstallBanner';
import { dbService } from './services/dbService';
import { AppUser, Trade } from './types';

// Componente raíz que orquestra la navegación y el estado de la sesión
export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editTrade, setEditTrade] = useState<Trade | undefined>(undefined);

  // Carga inicial de sesión y preparación de base de datos local
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
  };

  // Redirigir a login si no hay sesión activa
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Renderizado dinámico basado en la navegación lateral
  return (
    <Layout 
      currentView={currentView} 
      onNavigate={(view) => {
        setCurrentView(view);
        setEditTrade(undefined);
      }} 
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && <Dashboard />}
      
      {currentView === 'operaciones' && (
        <TradeList onEdit={(trade) => {
          setEditTrade(trade);
          setCurrentView('registrar');
        }} />
      )}
      
      {currentView === 'registrar' && (
        <TradeForm 
          editTrade={editTrade}
          onSuccess={() => {
            setEditTrade(undefined);
            setCurrentView('operaciones');
          }}
          onCancel={() => {
            setEditTrade(undefined);
            setCurrentView('operaciones');
          }}
        />
      )}
      
      {currentView === 'traders' && <TraderList />}
      
      {/* Utilidad para facilitar la instalación de la aplicación como PWA */}
      <InstallBanner />
    </Layout>
  );
}
