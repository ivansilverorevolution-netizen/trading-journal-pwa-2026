
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trader, TraderRole, Trade } from '../types';
import { Plus, User, Trash2, Edit2, Loader2, Wallet, DollarSign, Percent, Info, AlertTriangle, Save } from 'lucide-react';
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
    capital_inicial: undefined, 
    metodo_calculo: 'riesgo_porcentaje',
    valor_r: undefined, 
    riesgo_porcentaje: undefined 
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
      setTrades(tradeData.trades);
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

    return { totalCapitalInicial, totalPnlUsd, totalRendimiento };
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
      capital_inicial: trader.capital_inicial === 0 ? undefined : trader.capital_inicial,
      metodo_calculo: trader.metodo_calculo,
      valor_r: trader.valor_r === 0 ? undefined : trader.valor_r,
      riesgo_porcentaje: trader.riesgo_porcentaje === 0 ? undefined : trader.riesgo_porcentaje
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-12 relative transition-colors">
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-sm w-full p-10 border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-3 italic uppercase">¿Borrar cuenta?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-10 font-medium">Se eliminarán todos los registros financieros asociados.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { dbService.deleteTrader(confirmDeleteId).then(load); setConfirmDeleteId(null); }} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl">ELIMINAR</button>
              <button onClick={() => setConfirmDeleteId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-5 rounded-2xl">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight italic uppercase">Gestión de Cuentas</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-widest mt-1">Configuración del Interés Compuesto Automático</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { setEditingId(null); setShowForm(true); }}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} /> NUEVA CUENTA
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-top duration-500">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Header Formulario */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{editingId ? 'Editar Parámetros' : 'Registrar Nueva Cuenta'}</h3>
               <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Identificador</label>
                <input required placeholder="Ej: Cuenta Fondeo 100K" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Operativo</label>
                <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none" value={formData.rol || 'alumno'} onChange={e => setFormData({...formData, rol: e.target.value as TraderRole})}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital Inicial (USD)</label>
                <input type="number" required placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white" value={formData.capital_inicial === undefined ? '' : formData.capital_inicial} onChange={e => setFormData({...formData, capital_inicial: e.target.value === '' ? undefined : parseFloat(e.target.value)})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Método P&L</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, metodo_calculo: 'valor_r'})} 
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.metodo_calculo === 'valor_r' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md border border-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Valor 1R
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, metodo_calculo: 'riesgo_porcentaje'})} 
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.metodo_calculo === 'riesgo_porcentaje' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    % Riesgo
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {formData.metodo_calculo === 'valor_r' ? 'Monto fijo de 1R (USD)' : '% de Riesgo por Operación'}
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder={formData.metodo_calculo === 'valor_r' ? 'Monto en dólares por trade' : 'Ej: 1.0 (para el 1% del capital)'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white" 
                  value={formData.metodo_calculo === 'valor_r' ? (formData.valor_r || '') : (formData.riesgo_porcentaje || '')} 
                  onChange={e => {
                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    if (formData.metodo_calculo === 'valor_r') setFormData({...formData, valor_r: val});
                    else setFormData({...formData, riesgo_porcentaje: val});
                  }} 
                />
                <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-2 ml-1">
                   {formData.metodo_calculo === 'riesgo_porcentaje' ? '💡 El sistema usará este % sobre el balance actual para proyectar el interés compuesto.' : '💡 El sistema usará un monto fijo por cada unidad de beneficio (R).'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-50 dark:border-slate-800">
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-[#0f172a] hover:bg-black text-white px-16 py-5 rounded-[1.5rem] text-sm font-black tracking-widest transition-all active:scale-95 shadow-2xl flex items-center gap-3 uppercase"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                GUARDAR
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && traders.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {traderStats.map(trader => (
            <div key={trader.id} className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
              <div className="p-8 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500"><User size={24} /></div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none uppercase italic">{trader.nombre}</h3>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{trader.rol.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(trader)} className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => setConfirmDeleteId(trader.id)} className="p-3 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capital Actual</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100">${trader.capitalActual.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Crecimiento</p>
                  <p className={`text-lg font-black ${trader.rendimiento >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trader.rendimiento >= 0 ? '+' : ''}{trader.rendimiento.toFixed(2)}%</p>
                </div>
              </div>

              <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2"><Info size={12} className="text-blue-500" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{trader.metodo_calculo === 'valor_r' ? `FIJO: $${trader.valor_r}` : `RIESGO: ${trader.riesgo_porcentaje}%`}</span></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trader.numTrades} Trades Auditados</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TraderList;
