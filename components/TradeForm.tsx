import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { 
  SESSIONS, 
  DIRECTIONS, 
  STATUSES 
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
    activo: '',
    precio_entrada: 0,
    stop_loss: 0,
    take_profit_1: 0,
    estrategia: '',
    resultado_estado: undefined,
    resultado_r: 0,
    ...editTrade
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activo || !formData.precio_entrada) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }
    
    // Auto-assign first trader if not set for local mode simplicity
    const dataToSave = {
      ...formData,
      trader_id: formData.trader_id || (traders.length > 0 ? traders[0].id : 'default')
    };

    dbService.saveTrade(dataToSave);
    onSuccess();
  };

  const handleDelete = () => {
    if (editTrade && confirm('¿Eliminar esta operación definitivamente?')) {
      dbService.deleteTrade(editTrade.id);
      onSuccess();
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
            className="text-rose-400 hover:text-rose-300 p-2 hover:bg-rose-500/10 rounded-xl transition-all"
            type="button"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Info size={14} /> Datos Generales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Activo / Par *</label>
              <input 
                name="activo" 
                placeholder="Ej: EURUSD, BTC, Gold" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.activo || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 ml-1">Estrategia</label>
              <input 
                name="estrategia" 
                placeholder="Ej: Liquidez, Orderblock..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.estrategia || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-