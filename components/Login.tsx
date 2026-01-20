
import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldCheck, TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { supabase, dbService } from '../services/dbService';

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

    try {
      if (isRegister) {
        // Registro en Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre_academia: academyName,
            }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          const newUser: AppUser = {
            id: data.user.id,
            nombre_academia: academyName,
            email: email,
            created_at: new Date().toISOString()
          };
          await dbService.initializeMockData(newUser.id);
          onLogin(newUser);
        }
      } else {
        // Inicio de sesión en Supabase Auth
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        if (data.user) {
          const user: AppUser = {
            id: data.user.id,
            nombre_academia: data.user.user_metadata?.nombre_academia || 'Mi Academia',
            email: email,
            created_at: data.user.created_at || new Date().toISOString()
          };
          onLogin(user);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/20 mb-6">
            <TrendingUp size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Trading Academy</h1>
          <p className="text-slate-400 mt-2 font-medium">Internal Performance Hub</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="flex bg-slate-800/50 p-1 rounded-2xl mb-8">
            <button 
              disabled={loading}
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isRegister ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Entrar
            </button>
            <button 
              disabled={loading}
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isRegister ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Registrar Academia
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre de la Academia</label>
                <input 
                  required
                  disabled={loading}
                  className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                  placeholder="Ej: Alpha Trading Academy"
                  value={academyName}
                  onChange={e => setAcademyName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <input 
                required
                type="email"
                disabled={loading}
                className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                placeholder="admin@academy.com"
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
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors p-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="text-rose-400 text-xs font-bold bg-rose-400/10 p-3 rounded-xl border border-rose-400/20 text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (isRegister ? <UserPlus size={20} /> : <LogIn size={20} />)}
              {loading ? 'Procesando...' : (isRegister ? 'Crear Cuenta Academy' : 'Iniciar Sesión')}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8 flex items-center justify-center gap-2">
          <ShieldCheck size={14} /> Acceso seguro y sincronizado en la nube
        </p>
      </div>
    </div>
  );
};

export default Login;
