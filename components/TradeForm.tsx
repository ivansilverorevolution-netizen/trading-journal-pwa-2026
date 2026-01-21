
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader, SessionType, OperationType, InstrumentType, DirectionType, ResultStatusType } from '../types';
import { 
  SESSIONS, 
  OP_TYPES, 
  INSTRUMENTS, 
  DIRECTIONS, 
  TIMEFRAMES, 
  STATUSES,
  GESTION_TYPES,
  ERROR_TYPES 
} from '../constants';
import { Save, ChevronLeft, Trash2, Info, Target, Clock } from 'lucide-react';

interface TradeFormProps {
  editTrade?: Trade;
  onSuccess: () => void;
  onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ editTrade, onSuccess, onCancel }) => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [formData, setFormData] = useState<Partial<Trade>>({
    fecha_entrada: new Date().toISOString().split('T')[0],
    hora_entrada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    sesion: 'Londres',
    tipo_operativa: 'operativa_propia',
    tipo_instrumento: 'FX',
    direccion: 'Largo',
    timeframe_setup: 'M15',
    estrategia: '',
    ...editTrade
  });

  // Fix: dbService.getTraders() is synchronous, so we call setTraders directly
  useEffect(() => {
    setTraders(dbService.getTraders());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trader_id || !formData.activo || !formData.precio_entrada) {
      alert('Por favor completa los campos obligatorios marcados con *');
      return;
    }
    await dbService.saveTrade(formData);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto mb-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-white p-1 hover:bg-slate-800 rounded transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-white">
            {editTrade ? 'Editar Registro' : 'Registrar Nueva Operación'}
          </h2>
        </div>
        {editTrade && (
          <button 
            // Fix: dbService.deleteTrade() is synchronous, call onSuccess immediately after
            onClick={() => {
              if (confirm('¿Eliminar esta operación del historial?')) {
                dbService.deleteTrade(editTrade.id);
                onSuccess();
              }
            }}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Info size={14} /> Información del Analista
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Miembro que opera *</label>
              <select 
                name="trader_id" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.trader_id || ''}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Persona</option>
                {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Mercado / Activo *</label>
              <input 
                name="activo" 
                placeholder="Ej: EURUSD, Oro, Bitcoin" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.activo || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Target size={14} /> Contexto y Estrategia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Estrategia Aplicada</label>
              <input 
                name="estrategia" 
                placeholder="Ej: Reacción en POI, Breaker..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.estrategia || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Sesión de Operativa</label>
              <select 
                name="sesion" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" 
                value={formData.sesion} 
                onChange={handleChange}
              >
                {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Tipo de Compra/Venta</label>
              <select name="direccion" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={formData.direccion} onChange={handleChange}>
                {DIRECTIONS.map(d => <option key={d} value={d}>{d === 'Largo' ? 'Compra (Largo)' : 'Venta (Corto)'}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Origen de la idea</label>
              <select name="tipo_operativa" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={formData.tipo_operativa} onChange={handleChange}>
                {OP_TYPES.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Precio de Entrada *</label>
              <input type="number" step="0.00000001" name="precio_entrada" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={formData.precio_entrada || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Tope de Pérdida (SL) *</label>
              <input type="number" step="0.00000001" name="stop_loss" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={formData.stop_loss || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Meta de Ganancia (TP) *</label>
              <input type="number" step="0.00000001" name="take_profit_1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={formData.take_profit_1 || ''} onChange={handleChange} required />
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} className="text-emerald-500" /> Resultado Final
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Estado del Cierre</label>
              <select name="resultado_estado" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm" value={formData.resultado_estado || ''} onChange={handleChange}>
                <option value="">Aún en progreso...</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Ratio Riesgo Beneficio (R)</label>
              <input type="number" step="0.01" name="resultado_r" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Ej: 1.1, 1.2, 1.3 o -1.0" value={formData.resultado_r || ''} onChange={handleChange} />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
        >
          <Save size={20} />
          {editTrade ? 'Guardar Cambios' : 'Guardar Operación'}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;
