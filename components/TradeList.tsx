import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trade } from '../types';
import { Edit3, Search, TrendingUp, TrendingDown, Trash2, Loader2, User } from 'lucide-react';

interface TradeListProps {
  onEdit: (trade: Trade) => void;
}

const TradeList: React.FC<TradeListProps> = ({ onEdit }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dbService.fetchTrades();
      setTrades(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta operación definitivamente?')) {
      setLoading(true);
      try {
        await dbService.deleteTrade(id);
        await load();
      } catch (err) {
        alert('Error al eliminar');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredTrades = useMemo(() => {
    return trades
      .filter(t => 
        t.activo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.trader_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [trades, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-slate-900">Historial Cloud</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
            placeholder="Activo o Trader..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading && trades.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={30} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Activo</th>
                  <th className="px-6 py-4">Trader</th>
                  <th className="px-6 py-4">Ratio R</th>
                  <th className="px-6 py-4">Resultado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{trade.fecha_entrada}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trade.direccion === 'Largo' ? <TrendingUp size={14} className="text-emerald-500"/> : <TrendingDown size={14} className="text-rose-500"/>}
                        <span className="font-black text-slate-900">{trade.activo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <User size={12} className="text-blue-500" />
                        {trade.trader_name || 'Desconocido'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-black ${trade.resultado_r && trade.resultado_r > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {trade.resultado_r?.toFixed(2)} R
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        trade.resultado_estado === 'Ganadora' ? 'bg-emerald-50 text-emerald-600' : 
                        trade.resultado_estado === 'Perdedora' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {trade.resultado_estado || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => onEdit(trade)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(trade.id)} 
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTrades.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No hay operaciones que coincidan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeList;