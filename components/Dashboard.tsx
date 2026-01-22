
import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import TradeList from './TradeList';
import PerformanceAnalytics from './PerformanceAnalytics';
import { 
  TrendingUp, Percent, PlusCircle, Loader2, Calendar, Clock, User, Activity, Wallet, DollarSign, ChevronDown, ShieldCheck, Layers, ListFilter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
        setTrades(tradeData);
        setTraders(traderData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const relevantTraders = selectedTraderId === 'all' ? traders : traders.filter(t => t.id === selectedTraderId);
    const relevantTrades = selectedTraderId === 'all' ? trades : trades.filter(t => t.trader_id === selectedTraderId);

    const totalCapitalInicial = relevantTraders.reduce((sum, t) => sum + t.capital_inicial, 0);
    const totalCapitalActual = relevantTraders.reduce((sum, t) => sum + (t.capital_actual || t.capital_inicial), 0);
    const totalPnlUsd = totalCapitalActual - totalCapitalInicial;
    const totalYield = totalCapitalInicial > 0 ? (totalPnlUsd / totalCapitalInicial) * 100 : 0;

    const total = relevantTrades.length;
    const wins = relevantTrades.filter(t => t.resultado_estado === 'Ganadora').length;
    const winrate = total > 0 ? (wins / total) * 100 : 0;

    const sessionMap: Record<string, { total: number, wins: number }> = {
      'Asia': { total: 0, wins: 0 },
      'Londres': { total: 0, wins: 0 },
      'Nueva York': { total: 0, wins: 0 },
      'Nueva York PM': { total: 0, wins: 0 }
    };
    relevantTrades.forEach(t => {
      if (sessionMap[t.sesion]) {
        sessionMap[t.sesion].total++;
        if (t.resultado_estado === 'Ganadora') sessionMap[t.sesion].wins++;
      }
    });

    return {
      total, winrate, totalPnlUsd, totalCapitalActual, totalYield,
      relevantTrades,
      sessionData: Object.entries(sessionMap).map(([name, data]) => ({
        name, winrate: data.total > 0 ? (data.wins / data.total) * 100 : 0
      })),
      currentContext: selectedTraderId === 'all' ? 'Todas las Cuentas' : (relevantTraders[0]?.nombre || 'Cuenta Seleccionada')
    };
  }, [trades, traders, selectedTraderId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">TERMINAL ANALÍTICA</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
            <Activity size={14} className="text-blue-500" /> Monitoreo de Rendimiento Institucional
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <select 
              value={selectedTraderId}
              onChange={(e) => { setSelectedTraderId(e.target.value); onFilterChange?.(e.target.value); }}
              className="appearance-none pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="all">CONSOLIDADO GLOBAL</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
            </select>
            <ListFilter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none" />
          </div>
          <button onClick={() => onNavigate?.('registrar')} className="bg-blue-600 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl hover:bg-blue-500 transition-all active:scale-95">
            <PlusCircle size={20} /> NUEVA OPERATIVA
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-white -rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <Wallet size={80} />
          </div>
          <div className="flex items-center gap-3 text-blue-400 mb-2 relative z-10">
             <Wallet size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Capital Actual</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">${stats.totalCapitalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-tighter italic relative z-10">Balance en Cartera Real</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-800/30">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
             <DollarSign size={16} className="text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">P&L Neto Acumulado</span>
          </div>
          <p className={`text-4xl font-black ${stats.totalPnlUsd >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.totalPnlUsd >= 0 ? '+' : ''}${stats.totalPnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase">Beneficio Total Neto</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-blue-200 dark:hover:border-blue-800/30">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
             <Percent size={16} className="text-blue-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">Efectividad Real</span>
          </div>
          <p className={`text-4xl font-black ${stats.winrate >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.winrate.toFixed(1)}%
          </p>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase">Winrate de Auditoría</p>
        </div>
      </div>

      {/* Analytics Area */}
      <div className="space-y-8">
        <PerformanceAnalytics trades={stats.relevantTrades} />

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full"></div>
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-blue-600/10 p-3 rounded-2xl text-blue-600">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Winrate por Sesión Operativa</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribución de éxito por franja horaria</p>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sessionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                  unit="%"
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }} 
                  contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#0f172a', color: 'white', padding: '16px' }}
                />
                <Bar dataKey="winrate" radius={[14, 14, 14, 14]} barSize={60}>
                  {stats.sessionData.map((e, i) => (
                    <Cell key={i} fill={e.winrate >= 50 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bitácora - FULL WIDTH SECTION */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 dark:bg-slate-800 p-3 rounded-2xl text-white">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Bitácora de Operaciones</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial completo de auditorías real-time</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-2xl flex items-center gap-3">
             <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.1em]">{stats.total} AUDITORÍAS REGISTRADAS</span>
          </div>
        </div>

        <div className="w-full">
          <TradeList onEdit={onEdit || (() => {})} filterTraderId={selectedTraderId} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
