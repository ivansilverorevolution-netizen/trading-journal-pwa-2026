
import React, { useMemo, useState, useEffect } from 'react';
import { 
  LineChart, 
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { 
  TrendingUp, 
  Percent, 
  Hash, 
  Scale, 
  Filter, 
  Target, 
  ArrowDownCircle, 
  Calendar, 
  User,
  Zap,
  BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    trader: '',
    strategy: ''
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
    return trades
      .filter(t => {
        if (filters.startDate && t.fecha_entrada < filters.startDate) return false;
        if (filters.endDate && t.fecha_entrada > filters.endDate) return false;
        if (filters.trader && t.trader_id !== filters.trader) return false;
        if (filters.strategy && t.estrategia !== filters.strategy) return false;
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
      weeklyR: 0, monthlyR: 0, dailyR: 0, consistencyRatio: 0 
    };

    const winners = filteredTrades.filter(t => t.resultado_estado === 'Ganadora');
    const losers = filteredTrades.filter(t => t.resultado_estado === 'Perdedora');
    
    const winrate = (winners.length / total) * 100;
    const totalR = filteredTrades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    const avgR = totalR / total;

    const avgWin = winners.length > 0 ? winners.reduce((acc, t) => acc + (t.resultado_r || 0), 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((acc, t) => acc + (t.resultado_r || 0), 0) / losers.length) : 0;
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
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const dailyR = filteredTrades.filter(t => t.fecha_entrada === today).reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    const weeklyR = filteredTrades.filter(t => t.fecha_entrada >= weekAgo).reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    const monthlyR = filteredTrades.filter(t => t.fecha_entrada >= monthAgo).reduce((acc, t) => acc + (t.resultado_r || 0), 0);

    return { total, winrate, totalR, avgR, expectancy, maxDD, equityData, weeklyR, monthlyR, dailyR, consistencyRatio };
  }, [filteredTrades]);

  const traderRanking = useMemo(() => {
    return traders.map(trader => {
      const tTrades = filteredTrades.filter(t => t.trader_id === trader.id);
      const tTotalR = tTrades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
      const tWinrate = tTrades.length > 0 ? (tTrades.filter(t => t.resultado_estado === 'Ganadora').length / tTrades.length) * 100 : 0;
      
      const tDays: Record<string, number> = {};
      tTrades.forEach(t => { tDays[t.fecha_entrada] = (tDays[t.fecha_entrada] || 0) + (t.resultado_r || 0); });
      const tDayValues = Object.values(tDays);
      const tPosDays = tDayValues.filter(v => v > 0).length;
      const tConsistency = tDayValues.length > 0 ? (tPosDays / tDayValues.length) * 100 : 0;

      return {
        id: trader.id,
        nombre: trader.nombre,
        total: tTrades.length,
        r: tTotalR,
        wr: tWinrate,
        avg: tTrades.length > 0 ? tTotalR / tTrades.length : 0,
        consistency: tConsistency
      };
    }).sort((a, b) => b.r - a.r);
  }, [traders, filteredTrades]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 mt-1 font-medium">Análisis de rendimiento y rentabilidad de la academia.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Filtrar Fecha</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                className="text-xs p-2 bg-slate-50 rounded-lg outline-none border border-slate-100" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                className="text-xs p-2 bg-slate-50 rounded-lg outline-none border border-slate-100" 
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Elegir Miembro</label>
            <select 
              className="text-xs p-2 bg-slate-50 rounded-lg outline-none min-w-[140px] border border-slate-100"
              value={filters.trader}
              onChange={e => setFilters({...filters, trader: e.target.value})}
            >
              <option value="">Todo el Equipo</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setFilters({startDate: '', endDate: '', trader: '', strategy: ''})}
            className="self-end p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Limpiar filtros"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Operaciones', value: stats.total, icon: <Hash size={20}/>, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Acierto (WR)', value: `${stats.winrate.toFixed(1)}%`, icon: <Percent size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ratio R/B Total', value: `${stats.totalR.toFixed(2)} R`, icon: <TrendingUp size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expectativa (R)', value: `${stats.expectancy.toFixed(2)}`, icon: <Target size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Racha Negativa', value: `-${stats.maxDD.toFixed(2)} R`, icon: <ArrowDownCircle size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Nivel Disciplina', value: `${stats.consistencyRatio.toFixed(0)}%`, icon: <Zap size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
              {kpi.icon}
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              Evolución del Ratio R/B
            </h3>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Hoy (R)</p>
                <p className={`text-sm font-bold ${stats.dailyR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.dailyR >= 0 ? '+' : ''}{stats.dailyR.toFixed(2)} R
                </p>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityData}>
                <defs>
                  <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="trade" hide />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="r" 
                  name="Ratio R"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorR)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-blue-400" />
              Ratio R/B por Tiempo
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Este Mes', value: stats.monthlyR, target: 10 },
                { label: 'Esta Semana', value: stats.weeklyR, target: 2.5 },
                { label: 'Día de Hoy', value: stats.dailyR, target: 0.5 },
              ].map((period, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{period.label}</span>
                    <span className={period.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {period.value >= 0 ? '+' : ''}{period.value.toFixed(2)} R
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${period.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, (Math.abs(period.value) / period.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-xl">
                  <Zap size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Ratio R Promedio/Op.</p>
                  <p className="text-lg font-bold">{stats.expectancy.toFixed(3)} R</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Scale size={18} className="text-indigo-500" />
              Efectividad Real
            </h3>
            <div className="flex items-center justify-between">
               <div className="text-center flex-1">
                 <p className="text-2xl font-black text-emerald-600">{filteredTrades.filter(t => t.resultado_estado === 'Ganadora').length}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Ganadas</p>
               </div>
               <div className="w-px h-10 bg-slate-100" />
               <div className="text-center flex-1">
                 <p className="text-2xl font-black text-rose-600">{filteredTrades.filter(t => t.resultado_estado === 'Perdedora').length}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Perdidas</p>
               </div>
               <div className="w-px h-10 bg-slate-100" />
               <div className="text-center flex-1">
                 <p className="text-2xl font-black text-slate-400">{filteredTrades.filter(t => t.resultado_estado === 'BE' || t.resultado_estado === 'Parcial').length}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Neutras</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <User size={18} className="text-slate-400" />
            Clasificación por Ratio R/B Acumulado
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Nombre Miembro</th>
                <th className="px-6 py-4">Total Op.</th>
                <th className="px-6 py-4">% Acierto</th>
                <th className="px-6 py-4">Ratio R/B Total</th>
                <th className="px-6 py-4">Ratio Promedio</th>
                <th className="px-6 py-4">Nivel Disciplina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {traderRanking.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700">{tr.nombre}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{tr.total}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${tr.wr >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tr.wr.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-black ${tr.r >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {tr.r >= 0 ? '+' : ''}{tr.r.toFixed(2)} R
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {tr.avg.toFixed(2)} R/op
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[60px]">
                        <div 
                          className={`h-full rounded-full ${tr.consistency >= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                          style={{ width: `${tr.consistency}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{tr.consistency.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {traderRanking.length === 0 && (
            <div className="p-10 text-center text-slate-400 italic">No hay datos de miembros registrados aún.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
