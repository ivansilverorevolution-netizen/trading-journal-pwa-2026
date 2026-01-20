
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { Download, Edit3, Filter, Search, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { STATUSES, SESSIONS } from '../constants';

interface TradeListProps {
  onEdit: (trade: Trade) => void;
}

const TradeList: React.FC<TradeListProps> = ({ onEdit }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    trader: '',
    session: '',
    asset: '',
    strategy: '',
    type: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const [tData, trData] = await Promise.all([
        dbService.getTrades(),
        dbService.getTraders()
      ]);
      setTrades(tData);
      setTraders(trData);
    };
    fetchData();
  }, []);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (filters.startDate && t.fecha_entrada < filters.startDate) return false;
      if (filters.endDate && t.fecha_entrada > filters.endDate) return false;
      if (filters.trader && t.trader_id !== filters.trader) return false;
      if (filters.session && t.sesion !== filters.session) return false;
      if (filters.asset && !t.activo.toLowerCase().includes(filters.asset.toLowerCase())) return false;
      if (filters.strategy && t.estrategia !== filters.strategy) return false;
      if (filters.type && t.tipo_operativa !== filters.type) return false;
      return true;
    }).sort((a, b) => {
      const dateA = new Date(`${a.fecha_entrada} ${a.hora_entrada}`).getTime();
      const dateB = new Date(`${b.fecha_entrada} ${b.hora_entrada}`).getTime();
      return dateB - dateA;
    });
  }, [trades, filters]);

  const exportToCSV = () => {
    const headers = ['Fecha', 'Hora', 'Miembro', 'Activo', 'Direccion', 'Sesion', 'Estrategia', 'Resultado', 'Ratio R/B'];
    const rows = filteredTrades.map(t => [
      t.fecha_entrada,
      t.hora_entrada,
      t.trader_name,
      t.activo,
      t.direccion,
      t.sesion,
      t.estrategia,
      t.resultado_estado || 'Pendiente',
      t.resultado_r || 0
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historial_operaciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Ganadora': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Perdedora': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'BE': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Parcial': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const getDirectionIcon = (dir: string) => {
    return dir === 'Largo' ? (
      <TrendingUp size={14} className="text-emerald-500" />
    ) : (
      <TrendingDown size={14} className="text-rose-500" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Diario de Operaciones</h2>
          <p className="text-slate-500 font-medium">Lista completa de todas las entradas registradas.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} />
            Descargar Historial
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
          <Search size={16} className="text-slate-400" />
          <input 
            placeholder="Buscar mercado..." 
            className="bg-transparent text-sm font-medium outline-none min-w-[120px]"
            value={filters.asset}
            onChange={e => setFilters({...filters, asset: e.target.value})}
          />
        </div>
        
        <div className="h-6 w-px bg-slate-100 hidden md:block" />

        <select 
          className="text-sm font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
          value={filters.trader}
          onChange={e => setFilters({...filters, trader: e.target.value})}
        >
          <option value="">Cualquier Miembro</option>
          {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>

        <select 
          className="text-sm font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
          value={filters.session}
          onChange={e => setFilters({...filters, session: e.target.value})}
        >
          <option value="">Sesión</option>
          {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex-1" />

        <button 
          onClick={() => setFilters({startDate: '', endDate: '', trader: '', session: '', asset: '', strategy: '', type: ''})}
          className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
        >
          Limpiar Todo
        </button>
      </div>

      <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Fecha / Hora</th>
              <th className="px-6 py-4">Miembro</th>
              <th className="px-6 py-4">Mercado</th>
              <th className="px-6 py-4">Estrategia</th>
              <th className="px-6 py-4">Ratio (R:B)</th>
              <th className="px-6 py-4">Resultado</th>
              <th className="px-6 py-4 text-right">Editar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-sm">{trade.fecha_entrada}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{trade.hora_entrada}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-700">{trade.trader_name}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-white transition-colors">
                      {getDirectionIcon(trade.direccion)}
                    </div>
                    <span className="font-black text-sm text-slate-900">{trade.activo}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase">
                    {trade.estrategia}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <div className={`text-sm font-black ${trade.resultado_r && trade.resultado_r > 0 ? 'text-emerald-600' : trade.resultado_r && trade.resultado_r < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {trade.resultado_r ? (trade.resultado_r > 0 ? `+${trade.resultado_r}` : trade.resultado_r) : '0.00'} R
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase border ${getStatusColor(trade.resultado_estado)}`}>
                    {trade.resultado_estado || 'Esperando...'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onEdit(trade)}
                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredTrades.map(trade => (
          <div 
            key={trade.id} 
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
            onClick={() => onEdit(trade)}
          >
            <div className="flex gap-4 items-center">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${trade.resultado_estado === 'Ganadora' ? 'bg-emerald-50 text-emerald-600' : trade.resultado_estado === 'Perdedora' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                 {getDirectionIcon(trade.direccion)}
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{trade.activo}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{trade.estrategia}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    {trade.fecha_entrada} • {trade.trader_name}
                  </div>
               </div>
            </div>
            <div className="text-right">
              <div className={`font-black text-lg ${trade.resultado_r && trade.resultado_r > 0 ? 'text-emerald-600' : trade.resultado_r && trade.resultado_r < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {trade.resultado_r ? (trade.resultado_r > 0 ? `+${trade.resultado_r}` : trade.resultado_r) : '0'}
              </div>
              <ChevronRight size={18} className="text-slate-300 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeList;
