import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade } from '../types';
import TradeList from './TradeList';
import { 
  TrendingUp, 
  Percent, 
  Target, 
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
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    if (trades.length === 0) return { 
      total: 0, winrate: 0, todayWinrate: 0, weekWinrate: 0, monthWinrate: 0,
      sessionData: [], traderData: []
    };

    const total = trades.length;
    const wins = trades.filter(t => t.resultado_estado === 'Ganadora').length;
    const winrate = (wins / total) * 100;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const calcWin = (list: Trade[]) => {
      if (list.length === 0) return 0;
      return (list.filter(t => t.resultado_estado === 'Ganadora').length / list.length) * 100;
    };

    const sessionMap: Record<string, { total: number, wins: number }> = {
      'Asia': { total: 0, wins: 0 },
      'Londres': { total: 0, wins: 0 },
      'Nueva York': { total: 0, wins: 0 },
      'Nueva York PM': { total: 0, wins: 0 }
    };

    const traderMap: Record<string, { total: number, wins: number }> = {};

    trades.forEach(t => {
      if (sessionMap[t.sesion]) {
        sessionMap[t.sesion].total++;
        if (t.resultado_estado === 'Ganadora') sessionMap[t.sesion].wins++;
      }
      const name = t.trader_name || 'Desconocido';
      if (!traderMap[name]) traderMap[name] = { total: 0, wins: 0 };
      traderMap[name].total++;
      if (t.resultado_estado === 'Ganadora') traderMap[name].wins++;
    });

    return {
      total, winrate,
      todayWinrate: calcWin(trades.filter(t => t.fecha_entrada === todayStr)),
      weekWinrate: calcWin(trades.filter(t => new Date(t.fecha_entrada) >= oneWeekAgo)),
      monthWinrate: calcWin(trades.filter(t => new Date(t.fecha_entrada) >= firstDayOfMonth)),
      sessionData: Object.entries(sessionMap).map(([name, data]) => ({
        name, winrate: data.total > 0 ? (data.wins / data.total) * 100 : 0
      })),
      traderData: Object.entries(traderMap).map(([name, data]) => ({
        name, winrate: (data.wins / data.total) * 100, total: data.total
      })).sort((a, b) => b.winrate - a.winrate)
    };
  }, [trades]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Performance Hub</h2>
          <p className="text-slate-500 font-medium">Estadísticas avanzadas libres de IA.</p>
        </div>
        <button onClick={() => onNavigate?.('registrar')} className="bg-blue-600 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
          <PlusCircle size={20} /> NUEVA OPERACIÓN
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Efectividad Hoy', value: `${stats.todayWinrate.toFixed(0)}%`, icon: <Activity size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Semanal', value: `${stats.weekWinrate.toFixed(0)}%`, icon: <Calendar size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Mensual', value: `${stats.monthWinrate.toFixed(0)}%`, icon: <TrendingUp size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Winrate Global', value: `${stats.winrate.toFixed(1)}%`, icon: <Percent size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>{kpi.icon}</div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-600"><Clock size={20} /></div>
            <h3 className="text-xl font-black text-slate-800">Efectividad por Sesión</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sessionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="winrate" radius={[8, 8, 0, 0]} barSize={40}>
                  {stats.sessionData.map((e, i) => <Cell key={i} fill={e.winrate >= 50 ? '#10b981' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-600"><User size={20} /></div>
            <h3 className="text-xl font-black text-slate-800">Ranking Traders</h3>
          </div>
          <div className="space-y-4">
            {stats.traderData.map((trader, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-800">{trader.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{trader.total} ops</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600">{trader.winrate.toFixed(1)}%</p>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${trader.winrate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-800">Últimas Operaciones</h3>
        <TradeList onEdit={onEdit || (() => {})} />
      </div>
    </div>
  );
};

export default Dashboard;
