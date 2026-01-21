import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader, SessionType, DirectionType } from '../types';
import { 
  SESSIONS, 
  DIRECTIONS, 
  STATUSES 
} from '../constants';
import { Save, ChevronLeft, Trash2, Info, Target, Clock, ClipboardCheck, Loader2, Users, Calendar } from 'lucide-react';

interface TradeFormProps {
  editTrade?: Trade;
  onSuccess: () => void;
  onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ editTrade, onSuccess, onCancel }) => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(false);
  
  const getDayName = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00'); // Midday to avoid timezone shifts
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
  };

  const [formData, setFormData] = useState<Partial<Trade>>({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    dia_semana: getDayName(new Date().toISOString().split('T')[0]),
    sesion: 'Londres' as SessionType,
    tipo_operativa: 'operativa_propia',
    tipo_instrumento: 'FX',
    direccion: 'Largo' as DirectionType,
    activo: '',
    precio_entrada: 0,
    stop_loss: 0,
    take_profit_1: 0,
    estrategia: '',
    resultado_estado: undefined,
    resultado_r: 0,
    nota_trader: '',
    ...editTrade
  });

  useEffect(() => {
    const loadTraders = async () => {
      try {
        const data = await dbService.fetchTraders();
        setTraders(data);
        if (!formData.trader_id && data.length > 0) {
          setFormData(prev => ({ ...prev, trader_id: data[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadTraders();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      };
      
      // Auto-update day name if date changes
      if (name === 'fecha_entrada') {
        newData.dia_semana = getDayName(value);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activo || !formData.trader_id) {
      alert('Por favor completa los campos obligatorios y selecciona un trader.');
      return;
    }
    
    setLoading(true);
    try {
      await dbService.saveTrade(formData);
      onSuccess();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (editTrade && confirm('¿Eliminar esta operación definitivamente?')) {
      setLoading(true);
      try {
        await dbService.deleteTrade(editTrade.id);
        onSuccess();
      } catch (err) {
        alert('Error al eliminar');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto mb-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-white bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors" type="button">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-white">
            {editTrade ? 'Editar Registro' : 'Nueva Operación'}
          </h2>
        </div>
        {editTrade && (
          <button 
            onClick={handleDelete}
            disabled={loading}
            className="text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-500/10 rounded-xl transition-all"
            type="button"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users size={14} /> Responsable
          </h3>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">Miembro que ejecuta *</label>
            <select 
              name="trader_id"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={formData.trader_id || ''}
              onChange={handleChange}
            >
              <option value="">Seleccionar Miembro...</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Info size={14} /> Datos Generales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Activo / Par *</label>
              <input 
                name="activo" 
                placeholder="Ej: EURUSD, BTC" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.activo || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Estrategia</label>
              <input 
                name="estrategia" 
                placeholder="Ej: Liquidez..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.estrategia || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Ejecución y Sesión
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-bold text-slate-600 ml-1">Fecha Entrada</label>
              <input 
                type="date"
                name="fecha_entrada"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.fecha_entrada}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Horario Entrada</label>
              <input 
                type="time"
                name="hora_entrada"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.hora_entrada}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Día (Auto)</label>
              <input 
                type="text"
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 outline-none capitalize"
                value={formData.dia_semana || ''}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Sesión</label>
              <select 
                name="sesion"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.sesion}
                onChange={handleChange}
              >
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Dirección</label>
              <select 
                name="direccion"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.direccion}
                onChange={handleChange}
              >
                {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} /> Niveles de Precio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Precio Entrada *</label>
              <input 
                type="number"
                step="any"
                name="precio_entrada"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.precio_entrada}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Stop Loss</label>
              <input 
                type="number"
                step="any"
                name="stop_loss"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.stop_loss}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Take Profit</label>
              <input 
                type="number"
                step="any"
                name="take_profit_1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.take_profit_1}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ClipboardCheck size={14} /> Resultado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Estado</label>
              <select 
                name="resultado_estado"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.resultado_estado || ''}
                onChange={handleChange}
              >
                <option value="">Abierta</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Ratio R</label>
              <input 
                type="number"
                step="0.01"
                name="resultado_r"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.resultado_r}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <div className="pt-6 flex gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors"
          >
            CANCELAR
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {editTrade ? 'ACTUALIZAR' : 'GUARDAR'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;