import React, { useState } from 'react';
import { LogIn, TrendingUp, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre_academia: academyName || 'Mi Academia' }
          }
        });
        if (signUpError) throw signUpError;
        alert('Registro exitoso. Por favor revisa tu email si se requiere confirmación o inicia sesión.');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
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
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Hub de Alto Rendimiento (Supabase Auth)</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Academia</label>
                <input 
                  required
                  type="text"
                  className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Ej: Wolf Trading Academy"
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />)}
              {isSignUp ? 'Crear Cuenta' : 'Entrar Ahora'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
             <button 
               onClick={() => setIsSignUp(!isSignUp)}
               className="text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors"
             >
               {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
             </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-[10px] mt-8 uppercase tracking-[0.2em]">
          <ShieldCheck size={12} className="inline mr-1 mb-0.5" /> Seguridad Cifrada con Supabase
        </p>
      </div>
    </div>
  );
};

export default Login;