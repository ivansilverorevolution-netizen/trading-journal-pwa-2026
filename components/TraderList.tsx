
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trader, Trade } from '../types';
import { Plus, Trash2, Edit2, Loader2, Wallet, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const TraderList: React.FC = () => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Trader>>({
    nombre: '', capital_inicial: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const traderData = await dbService.fetchTraders();
      const tradeData = await dbService.fetchTrades();
      setTraders(traderData || []);
      setTrades(tradeData.trades || []);
      setError(null);
    } catch (err: any) { 
      setError(`Error de sincronización: ${err.message}`);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const traderStats = useMemo(() => {
    return traders.map(trader => {
      const traderTrades = trades.filter(t => String(t.trader_id) === String(trader.id));
      const pnlUsd = traderTrades.reduce((sum, t) => sum + (t.monto_riesgo || 0), 0);
      const rendimiento = trader.capital_inicial > 0 ? (pnlUsd / trader.capital_inicial) * 100 : 0;
      return { 
        ...trader, 
        pnlUsd, 
        rendimiento, 
        capitalActual: (trader.capital_inicial || 0) + pnlUsd 
      };
    });
  }, [traders, trades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;
    setIsSaving(true);
    try {
      await dbService.saveTrader({ ...formData, id: editingId || undefined });
      setEditingId(null);
      setShowForm(false);
      setSuccess("Datos guardados en la nube");
      await loadData();
    } catch (err: any) { 
      setError(err.message); 
    }
    finally { setIsSaving(false); setTimeout(() => setSuccess(null), 3000); }
  };

  const handleDelete = async (id: string) => {
    const trader = traders.find(t => t.id === id);
    if (!window.confirm(`⚠️ ADVERTENCIA: ¿Borrar definitivamente la cuenta "${trader?.nombre}"? Se perderán todas sus operaciones históricas.`)) return;
    
    setIsDeletingId(id);
    setError(null);
    
    try {
      await dbService.deleteTrader(id);
      setSuccess(`Cuenta "${trader?.nombre}" eliminada correctamente.`);
      await loadData(); // Recargar lista real
    } catch (err: any) { 
      setError(err.message);
      console.error(err);
    } finally {
      setIsDeletingId(null);
      setTimeout(() => { setError(null); setSuccess(null); }, 6000);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Cuentas Auditadas</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Control de auditoría en tiempo real</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { setEditingId(null); setFormData({ nombre: '', capital_inicial: 0 }); setShowForm(true); }} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            Nueva Cuenta
          </button>
        )}
      </div>

      {(error || success) && (
        <div className={`p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 border ${error ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
           {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
           <div className="flex-1 text-[10px] font-black uppercase tracking-widest">{error || success}</div>
           <button onClick={() => {setError(null); setSuccess(null);}} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95">
          <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-400">×</button>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alias de la Cuenta</label>
                 <input required placeholder="Ej: Cuenta Fondeada" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Balance Inicial (USD)</label>
                 <input type="number" step="0.01" required placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl font-black dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.capital_inicial || ''} onChange={e => setFormData({...formData, capital_inicial: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl text-xs font-black uppercase shadow-xl transition-all">
              {isSaving ? <Loader2 className="animate-spin inline" /> : 'Guardar en Auditoría'}
            </button>
          </form>
        </div>
      )}

      {loading && traders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Sincronizando Nube...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {traderStats.map(trader => (
            <div key={trader.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-10 shadow-sm group relative overflow-hidden transition-all hover:border-blue-200 dark:hover:border-blue-900">
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600/10 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500"><Wallet size={24}/></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic dark:text-white tracking-tighter">{trader.nombre}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ESTADO: AUDITADA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => { setEditingId(trader.id); setFormData(trader); setShowForm(true); }} className="p-3 text-slate-400 hover:text-blue-500 rounded-xl transition-all"><Edit2 size={18}/></button>
                   <button 
                     onClick={() => handleDelete(trader.id)} 
                     disabled={isDeletingId === trader.id}
                     className={`p-3 transition-all rounded-xl ${isDeletingId === trader.id ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                   >
                     {isDeletingId === trader.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                   </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-10 relative z-10">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Balance Final</p>
                    <p className="text-3xl font-black italic dark:text-white tracking-tighter">${trader.capitalActual?.toLocaleString()}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Rendimiento</p>
                    <p className={`text-3xl font-black italic tracking-tighter ${trader.rendimiento >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {trader.rendimiento?.toFixed(1)}%
                    </p>
                 </div>
              </div>
            </div>
          ))}
          {traders.length === 0 && !loading && (
             <div className="lg:col-span-2 py-20 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No hay cuentas activas en la auditoría</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TraderList;
