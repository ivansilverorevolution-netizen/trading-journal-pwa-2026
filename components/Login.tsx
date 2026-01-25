
import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, BarChart3, Mail, Lock, User, ChevronRight, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { academy_name: displayName || email.split('@')[0] } }
        });
        if (signUpError) throw signUpError;
        if (data.session) onLogin({ id: data.user!.id, nombre_academia: displayName, email, created_at: data.user!.created_at });
        else { setError("Registro exitoso. Verifica tu email."); setIsRegistering(false); }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLogin({ id: data.user.id, nombre_academia: data.user.user_metadata?.academy_name || "Usuario", email: data.user.email!, created_at: data.user.created_at });
      }
    } catch (err: any) {
      setError(err.message || 'Error de acceso');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-blue-600/10 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-600/20">
            <BarChart3 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">TradeControl</h1>
          <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[9px]">Trading Sin Fronteras</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tu Firma / Nombre</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required type="text" className="w-full bg-slate-900/50 border border-white/5 pl-12 pr-4 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Iván Silvero" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input required type="email" className="w-full bg-slate-900/50 border border-white/5 pl-12 pr-4 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input required type={showPassword ? "text" : "password"} className="w-full bg-slate-900/50 border border-white/5 pl-12 pr-12 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isRegistering ? 'REGISTRARSE' : 'ACCEDER AL TERMINAL'} <ChevronRight size={18} /></>}
            </button>
          </form>

          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-[10px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest">
            {isRegistering ? '¿Ya tienes cuenta? Entrar' : '¿Nuevo Analista? Registrarse'}
          </button>
        </div>

        <div className="text-center space-y-2 opacity-50">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Trading Sin Fronteras — Desarrollado por Iván Silvero
          </p>
          <div className="flex justify-center gap-4 text-[8px] font-black text-slate-600 uppercase">
            <span>Seguridad SSL</span>
            <span>AES-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
