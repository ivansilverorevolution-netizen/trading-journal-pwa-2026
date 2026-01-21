
import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldCheck, TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { dbService } from '../services/dbService';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Artificial delay to simulate a real login without network blocking
    setTimeout(async () => {
      try {
        if (isRegister) {
          if (!academyName.trim()) throw new Error("El nombre de la academia es obligatorio");
          
          const newUser: AppUser = {
            id: crypto.randomUUID(),
            nombre_academia: academyName,
            email: email,
            created_at: new Date().toISOString()
          };
          
          // Initialize local data for the new user
          await dbService.initializeMockData(newUser.id);
          onLogin(newUser);
        } else {
          // Mock login: any credentials work for now in local mode
          const user: AppUser = {
            id: 'local-session-id',
            nombre_academia: 'Mi Academia Local',
            email: email,
            created_at: new Date().toISOString()
          };
          onLogin(user);
        }
      } catch (err: any) {
        setError(err.message || 'Error al procesar la solicitud.');
      } finally {
        setLoading(false);
      }
    }, 500);
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
          <p className="text-slate-400 mt-2 font-medium">Internal Performance Hub (Modo Local)</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="flex bg-slate-800/50 p-1 rounded-2xl mb-8">
            <button 
              disabled={loading}
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isRegister ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Entrar
            </button>
            <button 
              disabled={loading}
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isRegister ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Academia</label>
                <input 
                  required
                  disabled={loading}
                  className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                  placeholder="Alpha Trading Academy"
                  value={academyName}
                  onChange={e => setAcademyName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <input 
                required
                type="email"
                disabled={loading}
                className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <input 
                  required
                  disabled={loading}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-800/50 border border-slate-700 p-4 pr-12 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-xs font-bold bg-rose-400/10 p-3 rounded-xl border border-rose-400/20 text-center">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (isRegister ? <UserPlus size={20} /> : <LogIn size={20} />)}
              {loading ? 'Procesando...' : (isRegister ? 'Crear Perfil Academy' : 'Acceder')}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase tracking-[0.2em]">
          <ShieldCheck size={12} className="inline mr-1 mb-0.5" /> Almacenamiento Local Seguro
        </p>
      </div>
    </div>
  );
};

export default Login;
