
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trader, TraderRole, Trade } from '../types';
import { Plus, User, Trash2, Edit2, Loader2, Wallet, DollarSign, Percent, Info, AlertTriangle } from 'lucide-react';
import { ROLES } from '../constants';

const TraderList: React.FC = () => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Trader>>({
    nombre: '',
    correo_electronico: '',
    rol: 'alumno',
    capital_inicial: undefined, // En blanco
    metodo_calculo: 'valor_r',
    valor_r: undefined, // En blanco
    riesgo_porcentaje: undefined // En blanco
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [traderData, tradeData] = await Promise.all([
        dbService.fetchTraders(),
        dbService.fetchTrades()
      ]);
      setTraders(traderData);
      setTrades(tradeData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const traderStats = useMemo(() => {
    return traders.map(trader => {
      const traderTrades = trades.filter(t => t.trader_id === trader.id);
      const totalR = traderTrades.reduce((sum, t) => sum + (t.resultado_r || 0), 0);
      
      let pnlUsd = 0;
      if (trader.metodo_calculo === 'valor_r') {
        pnlUsd = totalR * (trader.valor_r || 0);
      } else {
        const montoRiesgo = (trader.capital_inicial || 0) * ((trader.riesgo_porcentaje || 0) / 100);
        pnlUsd = totalR * montoRiesgo;
      }

      const rendimiento = trader.capital_inicial > 0 ? (pnlUsd / trader.capital_inicial) * 100 : 0;

      return {
        ...trader,
        totalR,
        pnlUsd,
        rendimiento,
        capitalActual: (trader.capital_inicial || 0) + pnlUsd,
        numTrades: traderTrades.length
      };
    });
  }, [traders, trades]);

  const globalSummary = useMemo(() => {
    const totalCapitalInicial = traderStats.reduce((sum, s) => sum + (s.capital_inicial || 0), 0);
    const totalPnlUsd = traderStats.reduce((sum, s) => sum + s.pnlUsd, 0);
    const totalRendimiento = totalCapitalInicial > 0 ? (totalPnlUsd / totalCapitalInicial) * 100 : 0;

    return {
      totalCapitalInicial,
      totalPnlUsd,
      totalRendimiento
    };
  }, [traderStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.saveTrader({ ...formData, id: editingId || undefined });
      await load();
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      alert('Error al guardar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (trader: Trader) => {
    setEditingId(trader.id);
    setFormData({
      nombre: trader.nombre,
      correo_electronico: trader.correo_electronico,
      rol: trader.rol,
      capital_inicial: trader.capital_inicial,
      metodo_calculo: trader.metodo_calculo,
      valor_r: trader.valor_r,
      riesgo_porcentaje: trader.riesgo_porcentaje
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await dbService.deleteTrader(id);
      setTraders(prev => prev.filter(t => t.id !== id));
      setTrades(prev => prev.filter(t => t.trader_id !== id));
    } catch (err: any) {
      alert('Error al eliminar: ' + (err.message || 'Error inesperado.'));
      await load();
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8 pb-12 relative transition-colors">
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3">¿Borrar cuenta?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-10 font-medium leading-relaxed">
              Esta acción eliminará la cuenta y todos sus registros financieros asociados. No se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleDelete(confirmDeleteId)}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-600/20"
              >
                ELIMINAR DEFINITIVAMENTE
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight italic uppercase">Cuentas</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestión financiera de capitales y fondeos.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ nombre: '', correo_electronico: '', rol: 'alumno', capital_inicial: undefined, metodo_calculo: 'valor_r', valor_r: undefined, riesgo_porcentaje: undefined });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2"
        >
          {showForm ? 'CANCELAR' : <><Plus size={20} /> AÑADIR CUENTA</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Wallet size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Capital Total</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">${globalSummary.totalCapitalInicial.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <DollarSign size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">P&L Global</span>
          </div>
          <p className={`text-2xl font-black ${globalSummary.totalPnlUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {globalSummary.totalPnlUsd >= 0 ? '+' : ''}${globalSummary.totalPnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Percent size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Retorno Promedio</span>
          </div>
          <p className={`text-2xl font-black ${globalSummary.totalRendimiento >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {globalSummary.totalRendimiento.toFixed(2)}%
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-blue-500/10 shadow-2xl animate-in slide-in-from-top duration-500 overflow-hidden relative transition-colors">
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nombre de la Cuenta</label>
                <input required placeholder="Ej: Vantage Principal" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Email Vinculado</label>
                <input required type="email" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.correo_electronico} onChange={e => setFormData({...formData, correo_electronico: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Rol / Tipo</label>
                <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as TraderRole})}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Capital Inicial (USD)</label>
                  <input type="number" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white" value={formData.capital_inicial ?? ''} onChange={e => setFormData({...formData, capital_inicial: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Método P&L</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormData({...formData, metodo_calculo: 'valor_r'})} className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.metodo_calculo === 'valor_r' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'}`}>Valor 1R</button>
                    <button type="button" onClick={() => setFormData({...formData, metodo_calculo: 'riesgo_porcentaje'})} className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.metodo_calculo === 'riesgo_porcentaje' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'}`}>% Riesgo</button>
                  </div>
                </div>
              </div>
              
              {formData.metodo_calculo === 'valor_r' ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Monto de 1R (USD)</label>
                  <input type="number" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white" placeholder="Ej: 10" value={formData.valor_r ?? ''} onChange={e => setFormData({...formData, valor_r: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
                </div>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">% de Riesgo por Operación</label>
                  <input type="number" step="0.1" required className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white" placeholder="Ej: 0.5" value={formData.riesgo_porcentaje ?? ''} onChange={e => setFormData({...formData, riesgo_porcentaje: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="submit" disabled={saving} className="bg-slate-900 dark:bg-blue-600 text-white px-12 py-5 rounded-[2rem] text-lg font-black hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-2xl flex items-center gap-3">
                  {saving ? <Loader2 className="animate-spin" size={24} /> : (editingId ? 'ACTUALIZAR' : 'GUARDAR')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading && traders.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {traderStats.map(trader => (
            <div key={trader.id} className={`bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800 transition-all group overflow-hidden flex flex-col ${deletingIds.has(trader.id) ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <div className="p-8 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500"><User size={28} /></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">{trader.nombre}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{trader.rol.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled={deletingIds.has(trader.id)} onClick={() => handleEdit(trader)} className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-colors"><Edit2 size={18} /></button>
                  <button 
                    disabled={deletingIds.has(trader.id)} 
                    onClick={() => setConfirmDeleteId(trader.id)} 
                    className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-colors"
                  >
                    {deletingIds.has(trader.id) ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capital Inicial</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100">${trader.capital_inicial.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">P&L Acumulado</p>
                  <p className={`text-lg font-black ${trader.pnlUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trader.pnlUsd >= 0 ? '+' : ''}${trader.pnlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rendimiento Total</p>
                    <p className={`text-2xl font-black ${trader.rendimiento >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trader.rendimiento.toFixed(2)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-sm ${trader.pnlUsd >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{trader.pnlUsd >= 0 ? 'EN PROFIT' : 'EN DRAWDOWN'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3"><Info size={14} className="text-blue-500" /><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{trader.metodo_calculo === 'valor_r' ? `Cálculo: $${trader.valor_r} por 1R` : `Riesgo: ${trader.riesgo_porcentaje}%`}</span></div>
                <span className="text-[10px] font-black text-slate-400">{trader.numTrades} Operaciones</span>
              </div>
            </div>
          ))}
          {traderStats.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 font-bold italic">No hay cuentas registradas. Empieza añadiendo una.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TraderList;
