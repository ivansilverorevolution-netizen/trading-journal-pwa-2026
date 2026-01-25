
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader, SessionType, DirectionType } from '../types';
import { Save, ChevronLeft, Loader2, DollarSign, Target, HelpCircle, TrendingUp, TrendingDown, Minus, MessageSquare, PlusCircle } from 'lucide-react';
import { DIRECTIONS, SESSIONS } from '../constants';

interface TradeFormProps {
  editTrade?: Trade;
  defaultTraderId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ editTrade, defaultTraderId, onSuccess, onCancel }) => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<Trade>>({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    sesion: (editTrade?.sesion as SessionType) || 'Londres',
    direccion: 'Compra' as DirectionType,
    activo: '',
    estrategia: editTrade?.estrategia || 'Scalping',
    nota_trader: editTrade?.nota_trader || '',
    resultado_r: editTrade?.resultado_r,
    monto_riesgo: editTrade?.monto_riesgo, // Usado como P&L Dinero
    trader_id: defaultTraderId, 
    ...editTrade
  });

  useEffect(() => {
    dbService.fetchTraders().then(setTraders).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activo || !formData.trader_id) { alert('Faltan campos obligatorios'); return; }
    setLoading(true);
    try { await dbService.saveTrade(formData); onSuccess(); } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  // Lógica de detección automática visual basada en el MONTO USD primero, luego en el Ratio
  const autoStatus = useMemo(() => {
    const monto = Number(formData.monto_riesgo);
    const ratio = Number(formData.resultado_r);
    
    // Prioridad 1: Monto Directo
    if (!isNaN(monto) && formData.monto_riesgo !== undefined && formData.monto_riesgo !== 0) {
      if (monto > 0) return { label: 'GANADORA (USD+)', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-200', icon: <TrendingUp size={16}/> };
      if (monto < 0) return { label: 'PERDEDORA (USD-)', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-200', icon: <TrendingDown size={16}/> };
    }

    // Prioridad 2: Ratio R
    if (!isNaN(ratio) && formData.resultado_r !== undefined) {
      if (ratio > 0) return { label: 'GANADORA (R+)', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-200', icon: <TrendingUp size={16}/> };
      if (ratio < 0) return { label: 'PERDEDORA (R-)', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-200', icon: <TrendingDown size={16}/> };
      if (ratio === 0) return { label: 'BREAK EVEN (BE)', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-200', icon: <Minus size={16}/> };
    }

    return { label: 'PENDIENTE', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: <HelpCircle size={16}/> };
  }, [formData.monto_riesgo, formData.resultado_r]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-5xl mx-auto mb-20 animate-in zoom-in-95">
      <div className="bg-slate-900 px-10 py-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="text-white p-3 hover:bg-white/10 rounded-2xl transition-all border border-white/5"><ChevronLeft size={24} /></button>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Auditar Operativa Directa</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Detección Automática de Profit/Loss habilitada</p>
          </div>
        </div>
        <div className={`px-5 py-2 rounded-2xl border ${autoStatus.bg} ${autoStatus.border} flex items-center gap-3 transition-all duration-500`}>
          <div className={autoStatus.color}>{autoStatus.icon}</div>
          <span className={`text-xs font-black uppercase tracking-tighter ${autoStatus.color}`}>{autoStatus.label}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* LADO IZQUIERDO: Configuración */}
          <div className="md:col-span-5 space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuenta de Auditoría</label>
              <select name="trader_id" required className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white transition-all" value={formData.trader_id || ''} onChange={handleChange}>
                <option value="">Selecciona una cuenta...</option>
                {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sesión Operativa</label>
                <select name="sesion" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold text-xs dark:text-white" value={formData.sesion} onChange={handleChange}>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo Orden</label>
                <select name="direccion" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold text-xs dark:text-white" value={formData.direccion} onChange={handleChange}>
                  <option value="Compra">COMPRA (BUY)</option>
                  <option value="Venta">VENTA (SELL)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activo Auditado</label>
              <div className="relative">
                <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input name="activo" required placeholder="NAS100 / GOLD / EURUSD" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 pl-12 pr-4 py-4 rounded-2xl text-xs font-black uppercase dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.activo || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contexto Psicológico / Bitácora</label>
              <textarea name="nota_trader" rows={4} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl text-xs font-medium italic dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="¿Por qué entraste? Emociones, confirmaciones..." value={formData.nota_trader || ''} onChange={handleChange} />
            </div>
          </div>

          {/* LADO DERECHO: Resultados (DINERO Y R) */}
          <div className="md:col-span-7 space-y-8">
             
             {/* RESULTADO DINERO (NUEVO) */}
             <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado Neto (USD)</label>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic">Afecta Capital Directo</span>
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={24} /></div>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="monto_riesgo" 
                    placeholder="Monto USD (Ej: 100 o -50)" 
                    className={`w-full bg-slate-50 dark:bg-slate-800 border p-8 pl-14 rounded-[2.5rem] text-5xl font-black transition-all outline-none focus:ring-8 ${Number(formData.monto_riesgo) > 0 ? 'text-emerald-500 border-emerald-200 focus:ring-emerald-100/50' : Number(formData.monto_riesgo) < 0 ? 'text-rose-500 border-rose-200 focus:ring-rose-100/50' : 'text-slate-400 border-slate-200'}`} 
                    value={formData.monto_riesgo || ''} 
                    onChange={handleChange} 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-bold px-6 text-center italic">El sistema detectará automáticamente si es GANANCIA (+) o PÉRDIDA (-) al ingresar el monto.</p>
             </div>

             <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ratio R (Opcional)</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="number" step="0.1" name="resultado_r" placeholder="Ej: 3" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 pl-12 pr-4 py-4 rounded-2xl text-xl font-black dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10" value={formData.resultado_r || ''} onChange={handleChange} />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center shadow-xl">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Estatus Automático</p>
                   <p className={`text-sm font-black italic tracking-tighter uppercase ${autoStatus.color}`}>{autoStatus.label}</p>
                </div>
             </div>

             <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-3xl flex items-start gap-4">
                <HelpCircle size={20} className="text-blue-500 shrink-0 mt-1" />
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                  TIP AUDITORÍA: Si ingresas un monto positivo, se suma a tu capital. Si ingresas un monto negativo (usando el signo -), se resta automáticamente. El sistema audita la cuenta en tiempo real.
                </p>
             </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-blue-600 text-white py-8 rounded-[2rem] font-black text-xl uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 hover:bg-slate-800 dark:hover:bg-blue-700 transition-all border-b-8 border-slate-950 dark:border-blue-800">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={28} />}
          FINALIZAR AUDITORÍA AUTOMÁTICA
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
