import React, { useState } from 'react';
import { LogIn, TrendingUp, ShieldCheck } from 'lucide-react';
import { AppUser } from '../types';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const user: AppUser = {
        id: crypto.randomUUID(),
        nombre_academia: 'Trading Academy Academy',
        email: email,
        created_at: new Date().toISOString()
      };
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/20 mb-6">
            <TrendingUp size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Trading Academy</h1>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Hub de Alto Rendimiento (Modo Local)</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <input 
                required
                type="email"
                className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <input 
                required
                type="password"
                className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
            >
              <LogIn size={20} />
              Entrar Ahora
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase tracking-[0.2em]">
          <ShieldCheck size={12} className="inline mr-1 mb-0.5" /> 100% Privacidad Local
        </p>
      </div>
    </div>
  );
};

export default Login;