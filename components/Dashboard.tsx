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
  Loader2,
  Calendar,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface DashboardProps {
  onNavigate?: (view: string) => void;
  onEdit?: (trade: Trade) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEdit }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dbService.fetchTrades();
        setTrades(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = trades.length;
    if (total === 0) return { 
      total: 0, winrate: 0, totalR: 0, expectancy: 0, consistencyRatio: 0, 
      todayWinrate: 0, weekWinrate: 0, monthWinrate: 0,
      sessionData: [], traderData: []
    };

    const winners = trades.filter(t => t.resultado_estado === 'Ganadora');
    const winrate = (winners.length / total) * 100;
    const totalR = trades.reduce((acc, t) => acc + (t.resultado_r || 0), 0);
    
    // Time-based calculations
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const calcWinrate = (tradeList: Trade[]) => {
      if (tradeList.length === 0) return 0;
      const wins = tradeList.filter(t => t.resultado_estado === 'Ganadora').length;
      return (wins / tradeList.length) * 100;
    };

    const todayTrades = trades.filter(t => t.fecha_entrada === todayStr);
    const weekTrades = trades.filter(t => new Date(t.fecha_entrada) >= oneWeekAgo);
    const monthTrades = trades.filter(t => new Date(t.fecha_entrada) >= firstDayOfMonth);

    // Session-based Winrate
    const sessionMap: Record<string, { total: number, wins: number }> = {
      'Asia': { total: 0, wins: 0 },
      'Londres': { total: 0, wins: 0 },
      'Nueva York': { total: 0, wins: 0 },
      'Nueva York PM': { total: 0, wins: 0 },
      'Extra': { total: 0, wins: 0 }
    };

    trades.forEach(t => {
      if (sessionMap[t.sesion]) {
        sessionMap[t.sesion].total++;
        if (t.resultado_estado === 'Ganadora') sessionMap[t.sesion].wins++;
      }
    });

    const sessionData = Object.entries(sessionMap)
      .filter(([_, data]) => data.total > 0)
      .map(([name, data]) => ({
        name,
        winrate: parseFloat(((data.wins / data.total) * 100).toFixed(1)),
        total: data.total
      }));

    // Trader Winrate
    const traderMap: Record<string, { total: number, wins: number }> = {};
    trades.forEach(t => {
      const name = t.trader_name || 'Desconocido';
      if (!traderMap[name]) traderMap[name] = { total: 0, wins: 0 };
      traderMap[name].total++;
      if (t.resultado_estado === 'Ganadora') traderMap[name].wins++;
    });

    const traderData = Object.entries(traderMap).map(([name, data]) => ({
      name,
      winrate: parseFloat(((data.wins / data.total) * 100).toFixed(1)),
      total: data.total
    })).sort((a, b) => b.winrate - a.winrate);

    return { 
      total, 
      winrate, 
      totalR, 
      todayWinrate: calcWinrate(todayTrades),
      weekWinrate: calcWinrate(weekTrades),
      monthWinrate: calcWinrate(monthTrades),
      sessionData,
      traderData
    };
  }, [trades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Performance Hub</h2>
          <p className="text-slate-500 mt-2 font-medium">Estadísticas avanzadas de rentabilidad operativa.</p>
        </div>
        
        <button 
          onClick={() => onNavigate?.('registrar')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <PlusCircle size={20} />
          NUEVA OPERACIÓN
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Efectividad Hoy', value: `${stats.todayWinrate.toFixed(0)}%`, icon: <Activity size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Efectividad Semanal', value: `${stats.weekWinrate.toFixed(0)}%`, icon: <Calendar size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Efectividad Mensual', value: `${stats.monthWinrate.toFixed(0)}%`, icon: <TrendingUp size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Winrate Global', value: `${stats.winrate.toFixed(1)}%`, icon: <Percent size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Session Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
              <Clock size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Efectividad por Sesión (%)</h3>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="winrate" radius={[8, 8, 0, 0]} barSize={40}>
                  {stats.sessionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.winrate >= 50 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trader Performance */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                <User size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Top Miembros</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basado en Winrate</span>
          </div>

          <div className="space-y-5">
            {stats.traderData.length > 0 ? stats.traderData.slice(0, 5).map((trader, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{trader.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{trader.total} ops totales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${trader.winrate >= 50 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {trader.winrate}%
                  </p>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${trader.winrate >= 50 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                      style={{ width: `${trader.winrate}%` }}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-400 italic text-sm">No hay datos de traders registrados.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-800">Operaciones Recientes</h3>
        <TradeList onEdit={onEdit || (() => {})} />
      </div>
    </div>
  );
};

export default Dashboard;