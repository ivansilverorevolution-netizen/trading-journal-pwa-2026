
import React, { useMemo, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { 
  TrendingUp, Loader2, Wallet, ChevronDown, Target, 
  Clock, Zap, CheckCircle2, Award, 
  BarChart3, Landmark, ArrowUpRight,
  Briefcase, Activity, CalendarDays, Rocket, PieChart as PieIcon,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  onNavigate?: (view: string) => void;
  onEdit?: (trade: Trade) => void;
  defaultFilterId?: string;
  onFilterChange?: (id: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#06b6d4'];

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

  const getEffectiveR = (val: any): number => {
    const n = parseFloat(val || 0);
    const abs = Math.abs(n);
    if (abs < 1) return n;
    return Number(((abs - 1) * 10 * Math.sign(n)).toFixed(2));
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const relevantTraders = selectedTraderId === 'all' ? traders : traders.filter(t => t.id === selectedTraderId);
    const relevantTrades = (selectedTraderId === 'all' ? trades : trades.filter(t => t.trader_id === selectedTraderId))
      .sort((a, b) => new Date(a.fecha_entrada).getTime() - new Date(b.fecha_entrada).getTime());

    const total = relevantTrades.length;
    const winsTotal = relevantTrades.filter(t => t.resultado_estado === 'Ganadora').length;
    const winrateTotal = total > 0 ? (winsTotal / total) * 100 : 0;

    const totalCapitalInicial = relevantTraders.reduce((sum, t) => sum + (t.capital_inicial || 0), 0);
    const totalCapitalActual = relevantTraders.reduce((sum, t) => sum + (t.capital_actual || t.capital_inicial || 0), 0);
    const totalPnlUsd = totalCapitalActual - totalCapitalInicial;
    
    const totalR = relevantTrades.reduce((acc, t) => acc + getEffectiveR(t.resultado_r), 0);
    const expectancy = total > 0 ? totalR / total : 0;

    const todayPnl = relevantTrades
      .filter(t => t.fecha_entrada === todayStr)
      .reduce((sum, t) => sum + (t.monto_riesgo || 0), 0);

    // LÓGICA DE ACTUALIZACIÓN DIARIA:
    // El objetivo se calcula sobre el capital que tenías al EMPEZAR el día (Capital Actual - PnL de hoy)
    const capitalAperturaDia = totalCapitalActual - todayPnl;

    let dailyTarget = 0;
    let avgRiskPercent = 0;
    let isFixedMethod = false;

    if (selectedTraderId === 'all') {
      traders.forEach(trader => {
        const traderTodayPnl = relevantTrades
            .filter(t => t.trader_id === trader.id && t.fecha_entrada === todayStr)
            .reduce((sum, t) => sum + (t.monto_riesgo || 0), 0);
        
        const traderCapitalApertura = (trader.capital_actual || trader.capital_inicial) - traderTodayPnl;

        if (trader.metodo_calculo === 'valor_r') {
          dailyTarget += (trader.valor_r || 0);
        } else {
          dailyTarget += traderCapitalApertura * ((trader.riesgo_porcentaje || 1) / 100);
        }
      });
      avgRiskPercent = capitalAperturaDia > 0 ? (dailyTarget / capitalAperturaDia) : 0.01;
    } else if (relevantTraders.length > 0) {
      const trader = relevantTraders[0];
      isFixedMethod = trader.metodo_calculo === 'valor_r';
      
      const traderCapitalApertura = (trader.capital_actual || trader.capital_inicial) - todayPnl;

      dailyTarget = isFixedMethod 
        ? (trader.valor_r || 0)
        : traderCapitalApertura * ((trader.riesgo_porcentaje || 1) / 100);
      avgRiskPercent = (trader.riesgo_porcentaje || 1) / 100;
    }

    const isGoalMet = dailyTarget > 0 && todayPnl >= (dailyTarget - 0.001);

    const calcProjection = (numDays: number) => {
        if (isFixedMethod && selectedTraderId !== 'all') {
            return dailyTarget * numDays;
        }
        return totalCapitalActual * Math.pow(1 + avgRiskPercent, numDays) - totalCapitalActual;
    };

    const projections = {
        diaria: dailyTarget,
        semanal: calcProjection(5),
        mensual: calcProjection(20),
        anual: calcProjection(240)
    };

    let runningBalance = totalCapitalInicial;
    const equityData = relevantTrades.length > 0 
      ? relevantTrades.map(t => {
          runningBalance += (t.monto_riesgo || 0);
          return { fecha: t.fecha_entrada, balance: runningBalance };
        })
      : [{ fecha: todayStr, balance: totalCapitalInicial }];

    const sessionMetrics: Record<string, number> = {};
    relevantTrades.forEach(t => {
      const s = (t.sesion || 'Londres').toUpperCase();
      sessionMetrics[s] = (sessionMetrics[s] || 0) + 1;
    });
    const sessionChartData = Object.entries(sessionMetrics).map(([name, value]) => ({ name, value }));

    const assetMetrics: Record<string, number> = {};
    relevantTrades.forEach(t => {
      const a = (t.activo || 'Otro').toUpperCase();
      assetMetrics[a] = (assetMetrics[a] || 0) + 1;
    });
    const assetChartData = Object.entries(assetMetrics)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);

    const winrateChartData = [
      { name: 'Wins', value: winsTotal, fill: '#10b981' },
      { name: 'Losses', value: total - winsTotal, fill: '#f43f5e' }
    ];

    return {
      total, winrate: winrateTotal, totalPnlUsd, totalCapitalActual, expectancy,
      equityData, dailyTarget, todayPnl, isGoalMet, projections, 
      winrateChartData, sessionChartData, assetChartData,
      currentContext: selectedTraderId === 'all' ? 'ACADEMIA GLOBAL' : (relevantTraders[0]?.nombre || 'CUENTA'),
      fechaHoy: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    };
  }, [trades, traders, selectedTraderId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="bg-blue-600/10 p-6 rounded-[2rem] border border-blue-600/20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Terminal...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER DE CONTROL ACTUALIZADO CON FECHA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-xl flex flex-col">
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Status de Auditoría</span>
              <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">{stats.currentContext}</h2>
           </div>
           
           <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <Calendar className="text-blue-500" size={16} />
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{stats.fechaHoy}</span>
           </div>
           
           {stats.isGoalMet && (
             <div className="flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-full shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Meta Diaria Alcanzada</span>
             </div>
           )}
        </div>
        
        <div className="relative group w-full lg:w-72">
           <select 
             value={selectedTraderId}
             onChange={(e) => { setSelectedTraderId(e.target.value); onFilterChange?.(e.target.value); }}
             className="w-full pl-6 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase outline-none shadow-sm dark:text-white tracking-widest appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
           >
             <option value="all">CONSOLIDADO GLOBAL</option>
             {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
           </select>
           <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Capital Líquido', val: `$${stats.totalCapitalActual.toLocaleString()}`, icon: <Wallet size={16}/>, color: 'text-slate-900 dark:text-white' },
          { label: 'P&L Acumulado', val: `${stats.totalPnlUsd >= 0 ? '+' : '-'}$${Math.abs(stats.totalPnlUsd).toLocaleString()}`, icon: <TrendingUp size={16}/>, color: stats.totalPnlUsd >= 0 ? 'text-emerald-500' : 'text-rose-500' },
          { label: 'Expectativa R', val: `${stats.expectancy.toFixed(2)} R`, icon: <Activity size={16}/>, color: 'text-blue-500' },
          { label: 'Total Auditorías', val: stats.total, icon: <Briefcase size={16}/>, color: 'text-slate-500' }
        ].map((m, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">{m.label}</p>
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400">{m.icon}</div>
            </div>
            <p className={`text-xl font-black italic tracking-tighter ${m.color}`}>{m.val}</p>
          </div>
        ))}
      </div>

      {/* SECCIÓN: PROYECCIONES AUTOMÁTICAS */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/20"><Rocket size={20} /></div>
           <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Proyecciones de Crecimiento</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Metas calculadas según tu gestión de riesgo real configurada</p>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Objetivo Diario', val: stats.projections.diaria, icon: <Target className="text-blue-500" />, period: stats.isGoalMet ? 'COMPLETADO' : 'Restante Hoy' },
             { label: 'Meta Semanal', val: stats.projections.semanal, icon: <CalendarDays className="text-emerald-500" />, period: 'Próximos 5 Días' },
             { label: 'Meta Mensual', val: stats.projections.mensual, icon: <Landmark className="text-amber-500" />, period: 'Próximos 20 Días' },
             { label: 'Meta Anual', val: stats.projections.anual, icon: <TrendingUp className="text-indigo-500" />, period: 'Proyección 240 Días' }
           ].map((p, i) => (
             <div key={i} className={`p-6 rounded-[2rem] border transition-all duration-500 ${i === 0 && stats.isGoalMet ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between mb-3">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">{p.label}</span>
                   {i === 0 && stats.isGoalMet ? <CheckCircle2 className="text-emerald-500" size={16} /> : p.icon}
                </div>
                <p className={`text-2xl font-black italic tracking-tighter ${i === 0 && stats.isGoalMet ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                  ${p.val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className={`text-[8px] font-black uppercase mt-1 italic ${i === 0 && stats.isGoalMet ? 'text-emerald-500' : 'text-slate-400'}`}>{p.period}</p>
             </div>
           ))}
        </div>
      </div>

      {/* BLOQUE CENTRAL: EQUITY CURVE + WINRATE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* GRÁFICO DE EQUITY */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-600/20"><BarChart3 size={20} /></div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Histórico de Capitalización</h3>
             </div>
             <div className="text-right">
                <p className={`text-xs font-black uppercase ${stats.todayPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {stats.todayPnl >= 0 ? '+' : ''}${stats.todayPnl.toFixed(2)} Hoy
                </p>
             </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="fecha" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', fontSize: '10px' }} 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={4} fill="url(#colorEquity)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WINRATE ANILLO */}
        <div className="xl:col-span-4 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <Zap className="absolute -right-8 -top-8 text-white/5 rotate-12" size={180} />
          
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest italic mb-6">Eficiencia de Ejecución</h3>
            <div className="flex items-center gap-8">
               <div className="h-32 w-32 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={stats.winrateChartData} 
                        innerRadius={35} outerRadius={50} paddingAngle={5} 
                        dataKey="value" stroke="none" cornerRadius={10}
                      >
                        {stats.winrateChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black italic">{stats.winrate.toFixed(0)}%</span>
                  </div>
               </div>
               <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                     <span className="text-[9px] font-bold text-slate-400 uppercase">Profit</span>
                     <span className="text-xs font-black text-emerald-400">{stats.winrateChartData[0].value}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                     <span className="text-[9px] font-bold text-slate-400 uppercase">Loss</span>
                     <span className="text-xs font-black text-rose-400">{stats.winrateChartData[1].value}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
             <button 
                onClick={() => onNavigate?.('registrar')}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
             >
               AUDITAR TRADE <ArrowUpRight size={14}/>
             </button>
          </div>
        </div>
      </div>

      {/* FILA INFERIOR: SESIONES Y ACTIVOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SESIONES */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-8">
           <div className="h-40 w-40 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.sessionChartData} 
                    innerRadius={45} outerRadius={60} paddingAngle={2} 
                    dataKey="value" stroke="none" cornerRadius={5}
                  >
                    {stats.sessionChartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <Clock className="text-slate-300 mb-1" size={16} />
                 <span className="text-[8px] font-black text-slate-400 uppercase">Horarios</span>
              </div>
           </div>
           
           <div className="flex-1 space-y-4 w-full">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic mb-2">Efectividad x Sesión</h4>
              {stats.sessionChartData.length > 0 ? stats.sessionChartData.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">{s.name}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-400">{s.value} Trades</span>
                </div>
              )) : <p className="text-[10px] font-black text-slate-300 uppercase italic">Sin data horaria</p>}
           </div>
        </div>

        {/* ACTIVOS */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-8">
           <div className="h-40 w-40 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.assetChartData} 
                    innerRadius={45} outerRadius={60} paddingAngle={2} 
                    dataKey="value" stroke="none" cornerRadius={5}
                  >
                    {stats.assetChartData.map((_, index) => <Cell key={index} fill={COLORS[(index + 2) % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <PieIcon className="text-slate-300 mb-1" size={16} />
                 <span className="text-[8px] font-black text-slate-400 uppercase">Activos</span>
              </div>
           </div>
           
           <div className="flex-1 space-y-4 w-full">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic mb-2">Top Símbolos Auditados</h4>
              {stats.assetChartData.length > 0 ? stats.assetChartData.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }}></div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">{a.name}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-400">{Math.round((a.value/stats.total)*100)}%</span>
                </div>
              )) : <p className="text-[10px] font-black text-slate-300 uppercase italic">Sin data de activos</p>}
           </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
