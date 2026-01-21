import React, { useState } from 'react';
import { LogIn, TrendingUp, ShieldCheck, Loader2, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

    // Validaciones básicas
    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      setLoading(false);
      return;
    }

    if (isRegistering && !academyName) {
      setError("El nombre de la academia es obligatorio para registrarse.");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
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
          // Si el registro devuelve sesión (confirmación de email desactivada)
          if (data.session) {
            onLogin({
              id: data.user.id,
              nombre_academia: academyName,
              email: email,
              created_at: data.user.created_at
            });
          } else {
            // Si requiere confirmación de email
            setError("¡Registro exitoso! Por favor, verifica tu correo electrónico para activar tu cuenta.");
            setIsRegistering(false);
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error("Email o contraseña incorrectos.");
          }
          throw signInError;
        }

        if (data.user && data.session) {
          onLogin({
            id: data.user.id,
            nombre_academia: data.user.user_metadata?.academy_name || academyName || "Mi Academia",
            email: data.user.email || email,
            created_at: data.user.created_at
          });
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      // Traducción amigable de errores comunes de Supabase
      let message = err.message;
      if (message.includes('API key')) message = "Error de conexión con el servidor (API Key).";
      if (message.includes('User already registered')) message = "Este correo ya está registrado.";
      if (message.includes('Password should be')) message = "La contraseña debe tener al menos 6 caracteres.";
      
      setError(message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
      {/* Luces de fondo dinámicas */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl shadow-2xl shadow-blue-500/20 mb-6 group">
            <TrendingUp size={40} className="text-white group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-1">TSF Academy</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[9px]">
            {isRegistering ? 'Crea tu perfil profesional' : 'Acceso al Performance Hub'}
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl text-xs font-bold border ${
                error.includes("exitoso") || error.includes("verifica") 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              } animate-in slide-in-from-top-2`}>
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {isRegistering && (
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 group-focus-within:text-blue-400 transition-colors">Nombre Academia</label>
                <input 
                  required={isRegistering}
                  type="text"
                  className="w-full bg-slate-800/30 border border-white/5 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                  placeholder="Ej: Trading Sin Fronteras"
                  value={academyName}
                  onChange={e => setAcademyName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5 group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 group-focus-within:text-blue-400 transition-colors">Email Corporativo</label>
              <input 
                required
                type="email"
                className="w-full bg-slate-800/30 border border-white/5 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 group-focus-within:text-blue-400 transition-colors">Contraseña</label>
              <div className="relative">
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-800/30 border border-white/5 p-4 pr-12 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[9px] text-slate-600 ml-2">Mínimo 6 caracteres</p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isRegistering ? (
                <><UserPlus size={20} /> CREAR CUENTA</>
              ) : (
                <><LogIn size={20} /> ENTRAR AHORA</>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-[10px] font-black text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-[0.2em]"
            >
              {isRegistering ? '¿Ya eres miembro? Inicia Sesión' : '¿Nuevo en la academia? Regístrate aquí'}
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 text-slate-600 opacity-30 grayscale">
           <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.2em]">
              <ShieldCheck size={12} /> Enterprise Security
           </div>
           <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
           <div className="text-[8px] font-bold uppercase tracking-[0.2em]">
              TSF HUB v2.5.2
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;