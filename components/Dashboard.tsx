
import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import PerformanceAnalytics from './PerformanceAnalytics';
import { 
  TrendingUp, Loader2, Activity, Wallet, ChevronDown, ListFilter, Target, 
  ArrowUpRight, ArrowDownRight, Clock, PieChart as PieIcon, Zap, CheckCircle2,
  CalendarDays, ChevronRight, Moon, Sun, Sunrise, Sunset, BarChart3, FileText
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';

interface DashboardProps {
  onNavigate?: (view: string) => void;
  onEdit?: (trade: Trade) => void;
  defaultFilterId?: string;
  onFilterChange?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEdit, defaultFilterId = 'all', onFilterChange }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraderId, setSelectedTraderId] = useState<string>(defaultFilterId);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tradeData, traderData] = await Promise.all([
          dbService.fetchTrades(),
          dbService.fetchTraders()
        ]);
        setTrades(tradeData.trades);
        setTraders(traderData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const relevantTraders = selectedTraderId === 'all' ? traders : traders.filter(t => t.id === selectedTraderId);
    const relevantTrades = (selectedTraderId === 'all' ? trades : trades.filter(t => t.trader_id === selectedTraderId))
      .sort((a, b) => new Date(a.fecha_entrada).getTime() - new Date(b.fecha_entrada).getTime());

    const totalCapitalInicial = relevantTraders.reduce((sum, t) => sum + (t.capital_inicial || 0), 0);
    const totalCapitalActual = relevantTraders.reduce((sum, t) => sum + (t.capital_actual || t.capital_inicial || 0), 0);
    const totalPnlUsd = totalCapitalActual - totalCapitalInicial;
    const totalYield = totalCapitalInicial > 0 ? (totalPnlUsd / totalCapitalInicial) * 100 : 0;

    const total = relevantTrades.length;
    const wins = relevantTrades.filter(t => t.resultado_estado === 'Ganadora').length;
    const winrate = total > 0 ? (wins / total) * 100 : 0;
    
    const totalR = relevantTrades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    const expectancy = total > 0 ? totalR / total : 0;

    const strategyMap: Record<string, number> = {};
    relevantTrades.forEach(t => {
      const s = t.estrategia || 'Sin Definir';
      strategyMap[s] = (strategyMap[s] || 0) + 1;
    });
    const strategyData = Object.entries(strategyMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    let riskPerTrade = 0;
    let dailyTarget = 0;
    let todayPnl = 0;
    let isCompoundEnabled = false;
    let currentRiskPercentage = 0;

    if (selectedTraderId !== 'all' && relevantTraders.length > 0) {
      const trader = relevantTraders[0];
      isCompoundEnabled = trader.metodo_calculo === 'riesgo_porcentaje';
      currentRiskPercentage = trader.riesgo_porcentaje || 0;
      
      todayPnl = relevantTrades
        .filter(t => t.fecha_entrada === todayStr)
        .reduce((sum, t) => sum + (t.monto_riesgo || 0), 0);

      const openingBalanceHoy = (trader.capital_actual || 0) - todayPnl;

      if (isCompoundEnabled) {
        const percent = currentRiskPercentage / 100;
        dailyTarget = openingBalanceHoy * percent;
      } else {
        dailyTarget = trader.valor_r || 0;
      }
      
      riskPerTrade = dailyTarget;
    }

    const isGoalMet = dailyTarget > 0 && todayPnl >= (dailyTarget - 0.01);
    const dailyProgress = dailyTarget > 0 ? Math.min(100, Math.max(0, (todayPnl / dailyTarget) * 100)) : 0;

    let runningBalance = totalCapitalInicial;
    const equityData = relevantTrades.map(t => {
      runningBalance += (t.monto_riesgo || 0);
      return { fecha: t.fecha_entrada, balance: runningBalance };
    });

    return {
      total, winrate, totalPnlUsd, totalCapitalActual, totalYield, expectancy,
      relevantTrades, equityData, riskPerTrade, dailyTarget, todayPnl, isGoalMet, dailyProgress, isCompoundEnabled,
      currentRiskPercentage, strategyData,
      currentContext: selectedTraderId === 'all' ? 'Consolidado Global' : (relevantTraders[0]?.nombre || 'Cuenta')
    };
  }, [trades, traders, selectedTraderId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Iniciando Terminal Analítica...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Dashboard Operativo</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
               {stats.currentContext} — Análisis de Capital
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative min-w-[280px]">
            <select 
              value={selectedTraderId}
              onChange={(e) => { setSelectedTraderId(e.target.value); onFilterChange?.(e.target.value); }}
              className="appearance-none pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs font-black uppercase tracking-widest outline-none shadow-xl focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer dark:text-white w-full italic"
            >
              <option value="all">CONSOLIDADO GLOBAL</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
            </select>
            <ListFilter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
            <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* MONITOR DE PLAN DIARIO */}
      {selectedTraderId !== 'all' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
           <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden ${stats.isGoalMet ? 'bg-emerald-600 border-emerald-500 shadow-2xl shadow-emerald-500/30' : 'bg-[#0f172a] border-slate-800 shadow-2xl shadow-slate-950'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-8 relative z-10">
                 <div>
                    <div className="flex items-center gap-3 mb-6">
                       <div className={`p-3 rounded-2xl ${stats.isGoalMet ? 'bg-white/20 text-white' : 'bg-blue-600/20 text-blue-400'}`}>
                          <Zap size={22} className={stats.isGoalMet ? 'animate-bounce' : 'animate-pulse'} />
                       </div>
                       <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Estatus de Capitalización (Meta del Día)</h3>
                    </div>
                    
                    <p className={`text-7xl font-black italic tracking-tighter transition-all ${stats.isGoalMet ? 'text-white' : 'text-blue-500'}`}>
                       {stats.isGoalMet ? 'OBJETIVO CUMPLIDO' : `$${stats.todayPnl.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                    </p>
                    
                    <div className="mt-8 space-y-1">
                       <p className="text-[11px] font-black uppercase text-white tracking-widest opacity-80">
                          META PARA HOY: <span className="text-white">${stats.dailyTarget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-end">
                    <div className={`w-28 h-28 rounded-full border-[6px] flex items-center justify-center transition-all duration-1000 ${stats.isGoalMet ? 'border-white bg-white/10' : 'border-blue-600/30 bg-blue-600/10'}`}>
                       <span className="text-2xl font-black text-white">{Math.round(stats.dailyProgress)}%</span>
                    </div>
                    {stats.isGoalMet && <CheckCircle2 size={36} className="text-white mt-4 animate-in zoom-in-125" />}
                 </div>
              </div>

              <div className="mt-12 w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                 <div 
                    className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)] ${stats.isGoalMet ? 'bg-white' : 'bg-blue-600'}`}
                    style={{ width: `${stats.dailyProgress}%` }}
                 />
              </div>
           </div>
        </div>
      )}

      {/* MÉTRICAS FLASH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Capital Operativo</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">${stats.totalCapitalActual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="mt-4 flex items-center gap-2">
             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${stats.totalYield >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                Rendimiento: {stats.totalYield.toFixed(1)}%
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Ganancia Total</p>
          <p className={`text-3xl font-black italic tracking-tighter ${stats.totalPnlUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.totalPnlUsd >= 0 ? '+' : '-'}${Math.abs(stats.totalPnlUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
             {stats.totalPnlUsd >= 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
             Histórico Acumulado
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Expectativa (R)</p>
          <p className="text-3xl font-black text-blue-600 italic tracking-tighter">+{parseFloat(stats.expectancy.toFixed(2))}R</p>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
             <Target size={14} className="text-blue-500" />
             Consistencia Ejecución
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Efectividad</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stats.winrate.toFixed(1)}%</p>
          <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
             <Activity size={14} className="text-indigo-500" />
             {stats.total} Auditorías
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* EQUITY CURVE */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-5">
               <div className="bg-blue-600 text-white p-4 rounded-[1.5rem] shadow-xl shadow-blue-600/20"><TrendingUp size={24} /></div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Curva de Equidad</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolución dinámica del portafolio</p>
               </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} hide={stats.equityData.length > 30} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ESTRATEGIAS */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-blue-600"><BarChart3 size={20} /></div>
            <div>
               <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Metodología</h3>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.strategyData} layout="vertical" margin={{ left: -10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b' }} width={80} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={25}>
                  {stats.strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="xl:col-span-12">
         <PerformanceAnalytics 
           trades={stats.relevantTrades} 
           riskAmount={stats.riskPerTrade} 
           accountBalance={stats.totalCapitalActual}
           riskPercentage={stats.currentRiskPercentage}
         />
      </div>

    </div>
  );
};

export default Dashboard;
