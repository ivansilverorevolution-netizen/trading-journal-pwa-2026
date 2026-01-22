
import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Calendar, Target, TrendingUp, BarChart2, ChevronRight, Activity } from 'lucide-react';

interface PerformanceAnalyticsProps {
  trades: Trade[];
}

type PeriodType = 'diario' | 'semanal' | 'mensual' | 'anual';

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ trades }) => {
  const [period, setPeriod] = useState<PeriodType>('mensual');

  const stats = useMemo(() => {
    const grouped: Record<string, { total: number, wins: number, pnl: number }> = {};

    trades.forEach(t => {
      const date = new Date(t.fecha_entrada);
      let key = '';

      if (period === 'diario') {
        key = t.fecha_entrada;
      } else if (period === 'semanal') {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `Sem ${weekNum} - ${date.getFullYear()}`;
      } else if (period === 'mensual') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      } else {
        key = `${date.getFullYear()}`;
      }

      if (!grouped[key]) grouped[key] = { total: 0, wins: 0, pnl: 0 };
      grouped[key].total++;
      if (t.resultado_estado === 'Ganadora') grouped[key].wins++;
      grouped[key].pnl += (t.resultado_r || 0);
    });

    const data = Object.entries(grouped).map(([name, val]) => ({
      name,
      efectividad: val.total > 0 ? Math.round((val.wins / val.total) * 100) : 0,
      trades: val.total,
      pnl: parseFloat(val.pnl.toFixed(2))
    })).reverse(); // Ordenar cronológicamente si vienen de fetchTrades order desc

    return data.slice(-12); // Mostrar los últimos 12 registros del periodo
  }, [trades, period]);

  const currentPeriodStats = useMemo(() => {
    if (stats.length === 0) return { avgWinrate: 0, totalTrades: 0, bestPeriod: '-' };
    const avgWinrate = stats.reduce((acc, s) => acc + s.efectividad, 0) / stats.length;
    const totalTrades = stats.reduce((acc, s) => acc + s.trades, 0);
    const best = [...stats].sort((a, b) => b.efectividad - a.efectividad)[0];
    return { avgWinrate, totalTrades, bestPeriod: best.name };
  }, [stats]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Efectividad Temporal</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis transaccional por periodos</p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          {(['diario', 'semanal', 'mensual', 'anual'] as PeriodType[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                period === p 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats}>
                <defs>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }}
                  unit="%"
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="efectividad" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorEff)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <Activity size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Efectividad Media</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{currentPeriodStats.avgWinrate.toFixed(1)}%</p>
            <div className="mt-3 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${currentPeriodStats.avgWinrate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <TrendingUp size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Mejor Periodo</span>
            </div>
            <p className="text-lg font-black text-emerald-600 uppercase italic">{currentPeriodStats.bestPeriod}</p>
          </div>

          <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-600/20">
            <div className="flex items-center gap-2 text-blue-100 mb-1">
              <BarChart2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Muestra Analizada</span>
            </div>
            <p className="text-2xl font-black">{currentPeriodStats.totalTrades} Operaciones</p>
            <p className="text-blue-200 text-[10px] font-bold mt-1 uppercase">Datos históricos procesados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
