
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
      const tData = dbService.getTrades();
      const trData = dbService.getTraders();
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
      weeklyR: 0, monthlyR: 0, dailyR: 0, consistencyRatio: 0, equityData: [] 
    };

    const winners = filteredTrades.filter(t => t.resultado_estado === 'Ganadora');
    const losers = filteredTrades.filter(t => t.resultado_estado === 'Perdedora');
    
    const winrate = (winners.length / total) * 100;
    const totalR = filteredTrades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    const avgR = totalR / total;

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 mt-2 font-medium">Análisis de rendimiento y rentabilidad de la academia.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Periodo</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                className="text-xs p-2.5 bg-slate-50 rounded-xl outline-none border border-slate-100" 
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                className="text-xs p-2.5 bg-slate-50 rounded-xl outline-none border border-slate-100" 
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Equipo</label>
            <select 
              className="text-xs p-2.5 bg-slate-50 rounded-xl outline-none min-w-[160px] border border-slate-100"
              value={filters.trader}
              onChange={e => setFilters({...filters, trader: e.target.value})}
            >
              <option value="">Todo el Equipo</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setFilters({startDate: '', endDate: '', trader: '', strategy: ''})}
            className="self-end p-2.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl border border-slate-100"
            title="Limpiar filtros"
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
          { label: 'Max Drawdown', value: `-${stats.maxDD.toFixed(2)} R`, icon: <ArrowDownCircle size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Consistencia', value: `${stats.consistencyRatio.toFixed(0)}%`, icon: <Zap size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`${kpi.bg} ${kpi.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner`}>
              {kpi.icon}
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em]">{kpi.label}</p>
            <p className={`text-2xl font-black mt-2 leading-none ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
              <div className="bg-blue-600 w-2 h-2 rounded-full animate-pulse"></div>
              Crecimiento de la Cuenta (R)
            </h3>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Actual</p>
                <p className={`text-base font-black ${stats.totalR >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.totalR >= 0 ? '+' : ''}{stats.totalR.toFixed(2)} R
                </p>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
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
                <YAxis fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 'black', fontSize: '14px' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="r" 
                  name="Beneficio Acumulado"
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorR)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <h3 className="font-black flex items-center gap-3 mb-8 text-lg relative z-10">
              <BarChart3 size={20} className="text-blue-400" />
              Metas de Rendimiento
            </h3>
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Meta Mensual', value: stats.monthlyR, target: 10 },
                { label: 'Meta Semanal', value: stats.weeklyR, target: 2.5 },
                { label: 'Cierre Diario', value: stats.dailyR, target: 0.5 },
              ].map((period, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>{period.label}</span>
                    <span className={period.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {period.value >= 0 ? '+' : ''}{period.value.toFixed(2)} R
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out shadow-lg ${period.value >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                      style={{ width: `${Math.min(100, (Math.abs(period.value) / period.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2.5 rounded-2xl">
                  <Zap size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Expectancia Actual</p>
                  <p className="text-xl font-black">{stats.expectancy.toFixed(3)} R</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h3 className="font-black text-slate-800 flex items-center gap-3 mb-6 text-lg">
              <Scale size={20} className="text-indigo-500" />
              Ratio de Victorias
            </h3>
            <div className="flex items-center justify-between px-2">
               <div className="text-center flex-1">
                 <p className="text-3xl font-black text-emerald-600 leading-none">{filteredTrades.filter(t => t.resultado_estado === 'Ganadora').length}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Win</p>
               </div>
               <div className="w-px h-10 bg-slate-100" />
               <div className="text-center flex-1">
                 <p className="text-3xl font-black text-rose-600 leading-none">{filteredTrades.filter(t => t.resultado_estado === 'Perdedora').length}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Loss</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h3 className="font-black text-lg flex items-center gap-3 text-white">
                  {/* Fix: Changed 'class' to 'className' and camelCased stroke attributes */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                  Historial Reciente
              </h3>
              <button 
                onClick={() => onNavigate?.('registrar')}
                className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <PlusCircle size={14} />
                Nuevo Registro
              </button>
          </div>
          {filteredTrades.length === 0 ? (
            <div className="p-12 text-center text-slate-600 font-bold italic text-sm">
                Aún no has registrado operaciones en esta sesión local.
            </div>
          ) : (
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Activo</th>
                    <th className="px-4 py-3">Resultado</th>
                    <th className="px-4 py-3">Ratio R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTrades.slice(-5).reverse().map((trade) => (
                    <tr key={trade.id} className="text-slate-300">
                      <td className="px-4 py-3 font-bold">{trade.activo}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${trade.resultado_estado === 'Ganadora' ? 'bg-emerald-50/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {trade.resultado_estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black">{trade.resultado_r?.toFixed(2)} R</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
            <User size={20} className="text-slate-400" />
            Ranking por Rentabilidad
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">Equipo Academy</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Nombre Miembro</th>
                <th className="px-8 py-5 text-center">Consistencia</th>
                <th className="px-8 py-5">R Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {traderRanking.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {tr.nombre.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700">{tr.nombre}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${tr.consistency >= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                          style={{ width: `${tr.consistency}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{tr.consistency.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className={`px-8 py-5 font-black text-base ${tr.r >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {tr.r >= 0 ? '+' : ''}{tr.r.toFixed(2)} R
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
