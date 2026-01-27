
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader, SessionType, DirectionType, ResultStatusType } from '../types';
import { 
  Save, ChevronLeft, Loader2, Wallet, DollarSign, Clock, Zap, 
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown, MinusCircle,
  Hash, Layout, Activity, PenTool, Flame
} from 'lucide-react';
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [formData, setFormData] = useState<Partial<Trade>>({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    sesion: (editTrade?.sesion as SessionType) || 'Londres',
    direccion: (editTrade?.direccion as DirectionType) || 'Compra',
    activo: editTrade?.activo || '',
    estrategia: editTrade?.estrategia || '',
    nota_trader: editTrade?.nota_trader || '',
    monto_riesgo: editTrade ? (editTrade.monto_riesgo || undefined) : undefined, 
    resultado_r: editTrade ? (editTrade.resultado_r || undefined) : undefined, 
    resultado_estado: editTrade?.resultado_estado || 'Pendiente',
    trader_id: defaultTraderId, 
    ...editTrade
  });

  useEffect(() => {
    const loadTraders = async () => {
      try {
        const data = await dbService.fetchTraders();
        setTraders(data);
        if (!formData.trader_id && !editTrade && data.length > 0) {
          setFormData(prev => ({ ...prev, trader_id: defaultTraderId || data[0].id }));
        }
      } catch (err) { console.error(err); }
    };
    loadTraders();
  }, [editTrade, defaultTraderId]);

  const selectedTrader = useMemo(() => {
    return traders.find(t => t.id === formData.trader_id);
  }, [traders, formData.trader_id]);

  const getEffectiveR = (val: number | undefined): number => {
    if (val === undefined) return 0;
    const abs = Math.abs(val);
    if (abs < 1) return val;
    return Number(((abs - 1) * 10 * Math.sign(val)).toFixed(2));
  };

  // Efecto para calcular P&L basado en R si la cuenta es de Valor Fijo
  useEffect(() => {
    if (selectedTrader && selectedTrader.metodo_calculo === 'valor_r') {
      const effectiveRatio = getEffectiveR(formData.resultado_r);
      const valorFijo = selectedTrader.valor_r || 0;
      const calculatedPnl = effectiveRatio * valorFijo;
      
      if (formData.monto_riesgo !== calculatedPnl) {
        setFormData(prev => ({ 
          ...prev, 
          monto_riesgo: calculatedPnl,
          // El estado se sincroniza con el P&L calculado
          resultado_estado: calculatedPnl > 0 ? 'Ganadora' : (calculatedPnl < 0 ? 'Perdedora' : 'BE')
        }));
      }
    }
  }, [selectedTrader, formData.resultado_r]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const numValue = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : undefined;
    
    setFormData(prev => {
      const nextData = { ...prev, [name]: numValue !== undefined ? numValue : value };
      
      // LOGICA SOLICITADA: El estado solo se distingue por el P&L NETO (monto_riesgo)
      if (name === 'monto_riesgo' && numValue !== undefined) {
        if (numValue > 0) nextData.resultado_estado = 'Ganadora';
        else if (numValue < 0) nextData.resultado_estado = 'Perdedora';
        else if (numValue === 0) nextData.resultado_estado = 'BE';
      }
      return nextData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activo || !formData.trader_id) return;
    setLoading(true);
    try {
      await dbService.saveTrade(formData);
      setShowSuccessToast(true);
      setTimeout(() => { setShowSuccessToast(false); onSuccess(); }, 1200);
    } catch (err: any) { alert(err.message); setLoading(false); }
  };

  const status = formData.resultado_estado;

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-10 duration-500">
           <div className="bg-slate-900 text-white px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/10">
              <div className="bg-emerald-500 p-1.5 rounded-full"><CheckCircle2 size={18} /></div>
              <p className="font-black uppercase tracking-[0.2em] text-[10px]">Trade Sincronizado Exitosamente</p>
           </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-4">
           <button 
             onClick={onCancel}
             className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
           >
             <ChevronLeft size={20} />
           </button>
           <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Terminal de Auditoría</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Registro de Ejecución Profesional</p>
           </div>
        </div>
        
        {selectedTrader && (
          <div className="hidden sm:flex items-center gap-3 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 px-5 py-2.5 rounded-2xl">
             <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Wallet size={14} /></div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase leading-none">Cuenta Activa</span>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">{selectedTrader.nombre}</span>
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-8">
               <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500"><Hash size={18} /></div>
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Identificación del Activo</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Símbolo Operado</label>
                 <div className="relative group">
                    <Layout className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                      name="activo" required placeholder="NAS100, EURUSD..." 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-6 py-5 text-xl font-black uppercase italic outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white" 
                      value={formData.activo || ''} onChange={handleChange} 
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cuenta de Auditoría</label>
                 <select 
                   name="trader_id" required 
                   className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700 dark:text-slate-200" 
                   value={formData.trader_id || ''} onChange={handleChange}
                 >
                   {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
                 </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center gap-3 mb-8">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500"><Activity size={18} /></div>
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Parámetros de Ejecución</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-3">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dirección del Mercado</label>
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                     {DIRECTIONS.map(dir => (
                       <button 
                         key={dir} type="button" 
                         onClick={() => setFormData({...formData, direccion: dir as DirectionType})} 
                         className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                           formData.direccion === dir 
                             ? dir === 'Compra' 
                               ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                               : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                             : 'text-slate-400 hover:text-slate-600'
                         }`}
                       >
                         {dir === 'Compra' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                         {dir === 'Compra' ? 'LONG' : 'SHORT'}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Horario</label>
                    <div className="relative">
                       <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                       <select 
                         name="sesion" required 
                         className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase outline-none text-slate-700 dark:text-slate-200" 
                         value={formData.sesion || ''} onChange={handleChange}
                       >
                         {SESSIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Estrategia</label>
                    <div className="relative">
                       <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                       <input 
                         name="estrategia" placeholder="ICT, SMC..." 
                         className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-[10px] font-black uppercase outline-none text-slate-700 dark:text-slate-200" 
                         value={formData.estrategia || ''} onChange={handleChange} 
                       />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500"><PenTool size={18} /></div>
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Bitácora Psicológica</h3>
             </div>
             <textarea 
               name="nota_trader" rows={3} 
               placeholder="¿Cómo te sentiste? ¿Hubo errores de ejecución o psicológicos?" 
               className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-6 text-sm font-medium text-slate-600 dark:text-slate-400 outline-none resize-none transition-all" 
               value={formData.nota_trader || ''} onChange={handleChange} 
             />
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-700 flex flex-col justify-between min-h-[500px] relative overflow-hidden group ${
            status === 'Ganadora' 
              ? 'bg-emerald-600 border-emerald-400/50' 
              : status === 'Perdedora' 
                ? 'bg-rose-600 border-rose-400/50' 
                : 'bg-slate-900 border-slate-800'
          }`}>
             <Flame className={`absolute -right-8 -top-8 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-1000 ${status === 'Pendiente' ? 'hidden' : 'block'}`} size={200} />
             
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] italic">Panel de Resultados</h3>
                  <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20 text-white ${status === 'Ganadora' ? 'bg-white/10' : ''}`}>
                    {status}
                  </div>
               </div>

               <div className="space-y-10">
                  <div className="space-y-4">
                     <label className="text-white/50 text-[9px] font-black uppercase tracking-[0.2em] ml-2">Ratio R (Notación 1.X)</label>
                     <div className="relative">
                        <input 
                          type="number" step="0.1" name="resultado_r" 
                          placeholder="1.1" 
                          className="w-full bg-white/10 border border-white/10 rounded-[2rem] py-10 text-6xl font-black text-center text-white outline-none focus:bg-white/20 transition-all italic placeholder:text-white/20" 
                          value={formData.resultado_r === undefined ? '' : formData.resultado_r} onChange={handleChange} 
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
                          Métrica: {getEffectiveR(formData.resultado_r)}R
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-white/50 text-[9px] font-black uppercase tracking-[0.2em] ml-2">P&L Neto (Signo determina Estado)</label>
                     <div className="relative group/pnl">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={24} />
                        <input 
                          type="number" step="0.01" name="monto_riesgo" 
                          required={!selectedTrader?.metodo_calculo} 
                          readOnly={selectedTrader?.metodo_calculo === 'valor_r'} 
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-3xl pl-14 pr-6 py-6 text-2xl font-black text-white outline-none focus:bg-white/10 transition-all italic" 
                          value={formData.monto_riesgo === undefined ? '' : formData.monto_riesgo} onChange={handleChange} 
                        />
                        {selectedTrader?.metodo_calculo === 'valor_r' && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2">
                             <CheckCircle2 className="text-white/40" size={18} />
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             </div>

             <div className="relative z-10 mt-10">
                <div className="p-5 bg-black/20 rounded-[2rem] border border-white/5 backdrop-blur-sm flex items-start gap-4 mb-6">
                   <div className="bg-white/10 p-2 rounded-xl text-white"><AlertCircle size={16} /></div>
                   <p className="text-white/60 text-[10px] font-medium leading-relaxed uppercase">
                     {status === 'Ganadora' 
                       ? "Resultado Positivo. Beneficio neto detectado." 
                       : status === 'Perdedora' 
                         ? "Resultado Negativo. Pérdida neta detectada." 
                         : "Operación en equilibrio (Break Even) o pendiente."}
                   </p>
                </div>

                <button 
                  type="submit" disabled={loading} 
                  className="w-full bg-white text-slate-900 hover:bg-blue-50 py-6 rounded-[2rem] font-black text-lg transition-all active:scale-[0.97] shadow-2xl flex items-center justify-center gap-4 uppercase italic tracking-tighter"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  {loading ? 'Confirmando...' : (editTrade ? 'Actualizar Audit' : 'Confirmar Auditoría')}
                </button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;
