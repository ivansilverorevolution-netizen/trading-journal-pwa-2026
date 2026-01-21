import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeForm from './components/TradeForm';
import TraderList from './components/TraderList';
import Login from './components/Login';
import { dbService } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { AppUser, Trade } from './types';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editTrade, setEditTrade] = useState<Trade | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        dbService.setCurrentUser(session.user);
        setUser(dbService.getCurrentUser());
        refreshData();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        dbService.setCurrentUser(session.user);
        setUser(dbService.getCurrentUser());
        refreshData();
      } else {
        dbService.setCurrentUser(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = async () => {
    await dbService.fetchTrades();
    await dbService.fetchTraders();
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
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