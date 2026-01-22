import React, { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, AlertCircle, BarChart3, Mail, Lock, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!academyName) throw new Error("El nombre de la academia es obligatorio.");
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              academy_name: academyName,
              display_name: email.split('@')[0] 
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          if (data.session) {
            onLogin({
              id: data.user.id,
              nombre_academia: academyName,
              email: email,
              created_at: data.user.created_at
            });
          } else {
            setError("¡Registro exitoso! Verifica tu email para activar tu cuenta.");
            setIsRegistering(false);
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw new Error("Credenciales inválidas. Revisa tu email y contraseña.");

        if (data.user && data.session) {
          onLogin({
            id: data.user.id,
            nombre_academia: data.user.user_metadata?.academy_name || "Mi Academia",
            email: data.user.email || email,
            created_at: data.user.created_at
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Fondo Animado de Gradientes Modernos */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse delay-1000"></div>
      
      {/* Patrón de Red Sutil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-lg z-10">
        {/* Logo y Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] mb-8 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] scale-0 group-hover:scale-100 transition-transform duration-500"></div>
            <BarChart3 size={48} className="text-white relative z-10" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-3 uppercase italic">TradeControl</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-blue-500/50"></div>
            <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px]">Institutional Academy Suite</p>
            <div className="h-px w-8 bg-blue-500/50"></div>
          </div>
        </div>

        {/* Card de Login con Glassmorphism */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-700">
          {/* Brillo interior sutil */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-in shake duration-500">
                <AlertCircle size={18} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-5">
              {isRegistering && (
                <div className="space-y-2 group animate-in slide-in-from-left-4 duration-300">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nombre de tu Academia</label>
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                    <input 
                      required={isRegistering}
                      type="text"
                      className="w-full bg-slate-900/50 border border-white/5 pl-14 pr-6 py-5 rounded-[1.5rem] text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-600 font-bold"
                      placeholder="Ej: High Frequency Academy"
                      value={academyName}
                      onChange={e => setAcademyName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input 
                    required
                    type="email"
                    className="w-full bg-slate-900/50 border border-white/5 pl-14 pr-6 py-5 rounded-[1.5rem] text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-600 font-bold"
                    placeholder="nombre@academia.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Contraseña de Acceso</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-900/50 border border-white/5 pl-14 pr-14 py-5 rounded-[1.5rem] text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-600 font-bold"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="group w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-6 rounded-[1.5rem] shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span className="tracking-tight">{isRegistering ? 'CREAR MI CUENTA AHORA' : 'ENTRAR AL TERMINAL'}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-[11px] font-black text-slate-500 hover:text-blue-400 transition-all uppercase tracking-[0.25em] flex items-center justify-center gap-2 mx-auto"
            >
              <span className="w-8 h-px bg-slate-800"></span>
              {isRegistering ? '¿Ya eres miembro? Iniciar Sesión' : '¿Nuevo Analista? Registrar Academia'}
              <span className="w-8 h-px bg-slate-800"></span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
           <div className="flex items-center gap-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
              <LogIn size={14} className="text-blue-500" />
              Acceso Seguro SSL-AES 256
           </div>
           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">TradeControl Terminal v3.0.0 — © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;