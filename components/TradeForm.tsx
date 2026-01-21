import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader, SessionType, DirectionType } from '../types';
import { SESSIONS, DIRECTIONS, STATUSES } from '../constants';
import { Save, ChevronLeft, Trash2, Info, Target, Clock, ClipboardCheck, Loader2, Users } from 'lucide-react';

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
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
  };

  const [formData, setFormData] = useState<Partial<Trade>>({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    dia_semana: getDayName(new Date().toISOString().split('T')[0]),
    sesion: 'Londres' as SessionType,
    direccion: 'Largo' as DirectionType,
    activo: '',
    precio_entrada: 0,
    stop_loss: 0,
    take_profit_1: 0,
    resultado_r: 0,
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
      } catch (err) { console.error(err); }
    };
    loadTraders();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'number' ? parseFloat(value) : value };
      if (name === 'fecha_entrada') newData.dia_semana = getDayName(value);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activo || !formData.trader_id) return alert('Campos obligatorios incompletos');
    setLoading(true);
    try {
      await dbService.saveTrade(formData);
      onSuccess();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto mb-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-white bg-white/10 p-2 rounded-xl" type="button"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-black text-white">{editTrade ? 'Editar Registro' : 'Nueva Operación'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Miembro</h3>
          <select name="trader_id" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.trader_id || ''} onChange={handleChange}>
            <option value="">Seleccionar...</option>
            {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Activo *</label>
            <input name="activo" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.activo} onChange={handleChange} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Sesión</label>
            <select name="sesion" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.sesion} onChange={handleChange}>
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Fecha</label>
            <input type="date" name="fecha_entrada" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.fecha_entrada} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Horario</label>
            <input type="time" name="hora_entrada" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.hora_entrada} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Día</label>
            <input type="text" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 capitalize" value={formData.dia_semana} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Dirección</label>
            <select name="direccion" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.direccion} onChange={handleChange}>
              {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Estado</label>
            <select name="resultado_estado" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" value={formData.resultado_estado || ''} onChange={handleChange}>
              <option value="">Abierta</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {editTrade ? 'ACTUALIZAR' : 'GUARDAR'}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
