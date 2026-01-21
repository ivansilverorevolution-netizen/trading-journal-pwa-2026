import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade } from '../types';
import TradeList from './TradeList';
import { 
  TrendingUp, 
  Percent, 
  Hash, 
  Target, 
  Zap,
  PlusCircle,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (view: string) => void;
  onEdit?: (trade: Trade) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEdit }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setTrades(dbService.getTrades());
  }, []);

  const handleRefresh = async () => {
    setSyncing(true);
    const updatedTrades = await dbService.fetchTrades();
    setTrades(updatedTrades);
    setSyncing(false);
  };

  const stats = useMemo(() => {
    const total = trades.length;
    if (total === 0) return { 
      total: 0, winrate: 0, totalR: 0, expectancy: 0, consistencyRatio: 0
    };

    const winners = trades.filter(t => t.resultado_estado === 'Ganadora');
    const winrate = (winners.length / total) * 100;
    const totalR = trades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    
    const avgWin = winners.length > 0 ? winners.reduce((acc, t) => acc + (t.resultado_r || 0), 0) / winners.length : 0;
    const losers = trades.filter(t => t.resultado_estado === 'Perdedora');
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((acc, t) => acc + (t.resultado_r || 0), 0) / losers.length) : 1;
    const expectancy = ((winrate / 100) * avgWin) - ((1 - winrate / 100) * avgLoss);

    const days: Record<string, number> = {};
    trades.forEach(t => {
      days[t.fecha_entrada] = (days[t.fecha_entrada] || 0) + (t.resultado_r || 0);
    });
    const dayValues = Object.values(days);
    const posDays = dayValues.filter(v => v > 0).length;
    const consistencyRatio = dayValues.length > 0 ? (posDays / dayValues.length) * 100 : 0;

    return { total, winrate, totalR, expectancy, consistencyRatio };
  }, [trades]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard General</h2>
          <p className="text-slate-500 mt-2 font-medium">Rendimiento sincronizado con la nube.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 transition-all hover:border-blue-200 active:scale-95"
            disabled={syncing}
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => onNavigate?.('registrar')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
          >
            <PlusCircle size={20} />
            NUEVA OPERACIÓN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Operaciones', value: stats.total, icon: <Hash size={20}/>, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Winrate', value: `${stats.winrate.toFixed(1)}%`, icon: <Percent size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'R Total', value: `${stats.totalR.toFixed(2)} R`, icon: <TrendingUp size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expectativa', value: `${stats.expectancy.toFixed(2)}`, icon: <Target size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Consistencia', value: `${stats.consistencyRatio.toFixed(0)}%`, icon: <Zap size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
              {kpi.icon}
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-800">Operaciones Recientes</h3>
        <TradeList onEdit={onEdit || (() => {})} />
      </div>
    </div>
  );
};

export default Dashboard;