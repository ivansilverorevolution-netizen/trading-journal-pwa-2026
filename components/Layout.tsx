
import React from 'react';
import { NAVIGATION } from '../constants';
import { LogOut, User, Cloud, CloudOff, ShieldCheck } from 'lucide-react';
import { AppUser } from '../types';
import { dbService } from '../services/dbService';

interface LayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: AppUser;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, user, onLogout, children }) => {
  const isCloud = dbService.isCloudEnabled();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <ShieldCheck size={20} className="text-blue-500" />
           <h1 className="text-xl font-bold tracking-tight truncate max-w-[150px]">{user.nombre_academia}</h1>
        </div>
        <button onClick={onLogout} className="text-slate-400"><LogOut size={20}/></button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 border-r border-slate-800 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="bg-blue-600/10 p-2 rounded-xl">
                <ShieldCheck size={24} className="text-blue-500" />
             </div>
             <h1 className="text-xl font-black text-white tracking-tighter truncate leading-tight">{user.nombre_academia}</h1>
          </div>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] ml-1">Internal Performance Hub</p>
        </div>
        
        <div className="px-6 mb-4">
          <div className="bg-slate-800/40 p-3 rounded-2xl flex items-center gap-3 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl text-white shadow-lg shadow-blue-900/20">
                <User size={16} />
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.email}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Pro Academy User</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          {NAVIGATION.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                currentView === item.path 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <span className={`${currentView === item.path ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
                {item.icon}
              </span>
              <span className="font-bold text-sm">{item.name}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          {/* Cloud Sync Status */}
          <div className={`flex items-center gap-3 mb-6 p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider ${isCloud ? 'text-emerald-400 bg-emerald-500/5' : 'text-amber-400 bg-amber-500/5'}`}>
            {isCloud ? <Cloud size={14} /> : <CloudOff size={14} />}
            {isCloud ? 'Sincronizado' : 'Modo Local'}
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-slate-500 hover:text-rose-400 font-bold text-sm transition-colors py-2 group"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            Cerrar Sesión
          </button>
          <p className="text-[9px] text-slate-700 font-bold mt-4 uppercase tracking-[0.1em] text-center italic">© 2025 ACADEMY SYNC PRO</p>
        </div>
      </aside>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 px-2 shadow-2xl">
        {NAVIGATION.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all ${
              currentView === item.path ? 'text-blue-600 scale-110' : 'text-slate-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
