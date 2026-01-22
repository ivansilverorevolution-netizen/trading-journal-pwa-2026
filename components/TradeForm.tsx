
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader, SessionType, DirectionType } from '../types';
import { Save, ChevronLeft, Loader2, Info, Wallet, DollarSign, Target, ShieldAlert, HelpCircle } from 'lucide-react';
import { DIRECTIONS } from '../constants';

interface TradeFormProps {
  editTrade?: Trade;
  defaultTraderId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ editTrade, defaultTraderId, onSuccess, onCancel }) => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRRHelp, setShowRRHelp] = useState(false);

  const [formData, setFormData] = useState<Partial<Trade>>({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    sesion: 'Londres' as SessionType,
    direccion: 'Compra' as DirectionType,
    activo: '',
    monto_riesgo: undefined, // En blanco por defecto
    precio_entrada: undefined, // En blanco por defecto
    stop_loss: undefined, // En blanco por defecto
    take_profit_1: undefined, // En blanco por defecto
    resultado_r: undefined, // En blanco por defecto
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activo || !formData.trader_id || formData.precio_entrada === undefined) {
      alert('Activo, Cuenta y Precio de Entrada son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await dbService.saveTrade(formData);
      onSuccess();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-4xl mx-auto mb-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-white bg-white/10 p-2.5 rounded-xl hover:bg-white/20 transition-all"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-black text-white tracking-tight">{editTrade ? 'Editar Auditoría' : 'Nueva Operativa Real'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-4">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20"><Info size={20} /></div>
          <div>
            <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest mb-1">Cálculo de Gestión Profesional</p>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400 font-medium leading-relaxed italic">
              El sistema actualizará el capital real de la cuenta seleccionada basándose en el Ratio Riesgo-Beneficio y el monto arriesgado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Wallet size={12} className="text-blue-500" /> Seleccionar Cuenta
              </label>
              <select name="trader_id" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20" value={formData.trader_id || ''} onChange={handleChange}>
                <option value="">Selecciona...</option>
                {traders.map(t => <option key={t.id} value={t.id}>{t.nombre} (${t.capital_actual?.toLocaleString()})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Orden</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  {DIRECTIONS.map(dir => (
                    <button 
                      key={dir}
                      type="button"
                      onClick={() => setFormData({...formData, direccion: dir as DirectionType})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.direccion === dir ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-400'}`}
                    >
                      {dir === 'Compra' ? '📈 Compra' : '📉 Venta'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Activo</label>
                <input name="activo" required placeholder="EURUSD, BTC..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white" value={formData.activo} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto en Riesgo (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                  <input type="number" name="monto_riesgo" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-5 py-3 font-black text-slate-900 dark:text-white" value={formData.monto_riesgo ?? ''} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio Entrada</label>
                <input type="number" step="0.00001" name="precio_entrada" required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white" value={formData.precio_entrada ?? ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <ShieldAlert size={12} className="text-rose-500" /> Stop Loss
                </label>
                <input type="number" step="0.00001" name="stop_loss" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white" value={formData.stop_loss ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Target size={12} className="text-emerald-500" /> Take Profit
                </label>
                <input type="number" step="0.00001" name="take_profit_1" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white" value={formData.take_profit_1 ?? ''} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ratio Riesgo-Beneficio (R)</label>
                <button type="button" onClick={() => setShowRRHelp(!showRRHelp)} className="text-blue-500 flex items-center gap-1 text-[9px] font-black uppercase"><HelpCircle size={12}/> ¿Qué es esto?</button>
              </div>
              
              {showRRHelp && (
                <div className="bg-blue-600 text-white p-5 rounded-[2rem] text-[11px] font-medium leading-relaxed animate-in slide-in-from-right-4">
                  <p className="font-black mb-2 uppercase tracking-widest">💡 Calidad de la Operación</p>
                  Indica cuántas veces lo que arriesgás podés ganar.<br/>
                  • <span className="font-black">1:1</span> → Arriesgás $10 para ganar $10<br/>
                  • <span className="font-black">1:2</span> → Arriesgás $10 para ganar $20<br/>
                  • <span className="font-black">1:3</span> → Arriesgás $10 para ganar $30
                </div>
              )}

              <input 
                type="number" step="0.1" name="resultado_r" 
                placeholder="Ej: 2.5"
                className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl px-8 py-6 text-2xl font-black text-blue-600 dark:text-blue-400 outline-none focus:ring-4 focus:ring-blue-500/10 text-center"
                value={formData.resultado_r ?? ''} 
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado Final</label>
              <select name="resultado_estado" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 font-black text-slate-900 dark:text-white" value={formData.resultado_estado || ''} onChange={handleChange}>
                <option value="">⏱️ Pendiente de Cierre</option>
                <option value="Ganadora">✅ Operación Ganadora</option>
                <option value="Perdedora">❌ Operación Perdedora</option>
                <option value="BE">🛡️ Break Even (Cero)</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[2rem] font-black text-lg transition-all active:scale-95 shadow-2xl shadow-slate-900/30 flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin" /> : <Save />}
          FINALIZAR Y CALCULAR AUDITORÍA
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
