import React, { useMemo, useState, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import AiAnalysis from './AiAnalysis';
import { 
  TrendingUp, 
  Percent, 
  Hash, 
  Scale, 
  Filter, 
  Target, 
  ArrowDownCircle, 
  Zap,
  BarChart3,
  PlusCircle,
  User
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    trader: '',
    strategy: ''
  });

  useEffect(() => {
    const fetchData = () => {
      setTrades(dbService.getTrades());
      setTraders(dbService.getTraders());
    };
    fetchData();
  }, []);

  const filteredTrades = useMemo(() => {
    return trades
      .filter(t => {
        if (filters.startDate && t.fecha_entrada < filters.startDate) return false;
        if (filters.endDate && t.fecha_entrada > filters.endDate) return false;
        if (filters.trader && t.trader_id !== filters.trader) return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.fecha_entrada} ${a.hora_entrada}`).getTime();
        const dateB = new Date(`${b.fecha_entrada} ${b.hora_entrada}`).getTime();
        return dateA - dateB;
      });
  }, [trades, filters]);

  const stats = useMemo(() => {
    const total = filteredTrades.length;
    if (total === 0) return { 
      total: 0, winrate: 0, totalR: 0, avgR: 0, expectancy: 0, maxDD: 0, 
      weeklyR: 0, monthlyR: 0, dailyR: 0, consistencyRatio: 0, equityData: [] 
    };

    const winners = filteredTrades.filter(t => t.resultado_estado === 'Ganadora');
    const losers = filteredTrades.filter(t => t.resultado_estado === 'Perdedora');
    
    const winrate = (winners.length / total) * 100;
    const totalR = filteredTrades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    
    const avgWin = winners.length > 0 ? winners.reduce((acc, t) => acc + (t.resultado_r || 0), 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((acc, t) => acc + (t.resultado_r || 0), 0) / losers.length) : 1;
    const expectancy = ((winrate / 100) * avgWin) - ((1 - winrate / 100) * avgLoss);

    let peak = 0;
    let maxDD = 0;
    let currentEquity = 0;
    const equityData = filteredTrades.map((t, i) => {
      currentEquity += (t.resultado_r || 0);
      if (currentEquity > peak) peak = currentEquity;
      const dd = peak - currentEquity;
      if (dd > maxDD) maxDD = dd;
      return { trade: i + 1, r: currentEquity, date: t.fecha_entrada };
    });

    const days: Record<string, number> = {};
    filteredTrades.forEach(t => {
      days[t.fecha_entrada] = (days[t.fecha_entrada] || 0) + (t.resultado_r || 0);
    });
    const dayValues = Object.values(days);
    const posDays = dayValues.filter(v => v > 0).length;
    const consistencyRatio = dayValues.length > 0 ? (posDays / dayValues.length) * 100 : 0;

    const today = new Date().toISOString().split('T')[0];
    const dailyR = filteredTrades.filter(t => t.fecha_entrada === today).reduce((acc, t) => acc + (t.resultado_r || 0), 0);

    return { total, winrate, totalR, expectancy, maxDD, equityData, dailyR, consistencyRatio };
  }, [filteredTrades]);

  const traderRanking = useMemo(() => {
    return traders.map(trader => {
      const tTrades = trades.filter(t => t.trader_id === trader.id);
      const tTotalR = tTrades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
      return { id: trader.id, nombre: trader.nombre, r: tTotalR, total: tTrades.length };
    }).sort((a, b) => b.r - a.r);
  }, [traders, trades]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 mt-2 font-medium">Análisis de rendimiento basado en tu historial local.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <select 
            className="text-xs p-2.5 bg-slate-50 rounded-xl outline-none min-w-[160px] border border-slate-100"
            value={filters.trader}
            onChange={e => setFilters({...filters, trader: e.target.value})}
          >
            <option value="">Todo el Equipo</option>
            {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <button 
            onClick={() => setFilters({startDate: '', endDate: '', trader: '', strategy: ''})}
            className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl border border-slate-100"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <AiAnalysis stats={stats} />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-5">
        {[
          { label: 'Operaciones', value: stats.total, icon: <Hash size={20}/>, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Winrate', value: `${stats.winrate.toFixed(1)}%`, icon: <Percent size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'R Total', value: `${stats.totalR.toFixed(2)} R`, icon: <TrendingUp size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expectativa', value: `${stats.expectancy.toFixed(2)}`, icon: <Target size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Max DD', value: `-${stats.maxDD.toFixed(2)} R`, icon: <ArrowDownCircle size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg mb-8">
            <TrendingUp size={20} className="text-blue-600" />
            Crecimiento de la Cuenta (R)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityData}>
                <defs>
                  <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="trade" hide />
                <YAxis fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="r" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-black flex items-center gap-3 mb-6 text-lg">
              <BarChart3 size={20} className="text-blue-400" />
              Ranking Academy
            </h3>
            <div className="space-y-4">
              {traderRanking.slice(0, 5).map((tr, i) => (
                <div key={tr.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold text-xs">{i + 1}</span>
                    <span className="font-bold text-sm">{tr.nombre}</span>
                  </div>
                  <span className={`font-black text-sm ${tr.r >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tr.r >= 0 ? '+' : ''}{tr.r.toFixed(1)} R
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => onNavigate?.('registrar')}
            className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlusCircle size={20} />
            NUEVO REGISTRO
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;