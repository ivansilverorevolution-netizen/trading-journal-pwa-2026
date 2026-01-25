
import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { History, Zap, ShieldCheck, CalendarDays, TrendingUp, Target, Landmark } from 'lucide-react';

interface PerformanceAnalyticsProps {
  trades: Trade[];
  riskAmount?: number; 
  accountBalance?: number; 
  riskPercentage?: number; 
}

type PeriodType = 'diario' | 'semanal' | 'mensual' | 'anual';

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ 
  trades, 
  riskAmount = 0,
  accountBalance = 0,
  riskPercentage = 0 // Cambiado de 1 a 0
}) => {
  const [period, setPeriod] = useState<PeriodType>('semanal');

  const stats = useMemo(() => {
    const rDecimal = (riskPercentage || 0) / 100; // Cambiado de 1 a 0
    const capitalBase = accountBalance || 0;
    
    // Si la cuenta no tiene capital, la proyección es cero absoluto
    if (capitalBase === 0) {
      return { 
        projectionValue: 0, 
        periodList: [], 
        consistencyScore: 0, 
        avgWinrate: 0, 
        totalPnlWindow: 0,
        consistencyData: [{ name: 'N/A', value: 100, fill: '#f1f5f9' }],
        winrateData: [{ name: 'N/A', value: 100, fill: '#f1f5f9' }]
      };
    }

    const effectiveRisk = riskAmount > 0 ? riskAmount : (capitalBase * rDecimal);

    let projectionValue = 0;
    if (period === 'diario') {
      projectionValue = effectiveRisk;
    } else if (period === 'semanal') {
      projectionValue = capitalBase * Math.pow(1 + rDecimal, 5) - capitalBase;
    } else if (period === 'mensual') {
      projectionValue = capitalBase * Math.pow(1 + rDecimal, 20) - capitalBase;
    } else if (period === 'anual') {
      projectionValue = capitalBase * Math.pow(1 + rDecimal, 240) - capitalBase;
    }

    if (!trades.length) return { 
      projectionValue, 
      periodList: [], 
      consistencyScore: 0, 
      avgWinrate: 0, 
      totalPnlWindow: 0,
      consistencyData: [{ name: 'N/A', value: 100, fill: '#f1f5f9' }],
      winrateData: [{ name: 'N/A', value: 100, fill: '#f1f5f9' }]
    };

    const grouped: Record<string, { total: number, wins: number, pnlUsd: number, totalR: number }> = {};

    trades.forEach(t => {
      const date = new Date(t.fecha_entrada + 'T12:00:00');
      let key = '';
      
      if (period === 'diario') {
        key = t.fecha_entrada;
      } else if (period === 'semanal') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        key = `W${weekNo} - ${d.getFullYear()}`;
      } else if (period === 'mensual') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        key = `${months[date.getMonth()]} ${date.getFullYear()}`;
      } else {
        key = `${date.getFullYear()}`;
      }

      if (!grouped[key]) grouped[key] = { total: 0, wins: 0, pnlUsd: 0, totalR: 0 };
      grouped[key].total++;
      if (t.resultado_estado === 'Ganadora') grouped[key].wins++;
      grouped[key].pnlUsd += (t.monto_riesgo || 0);
      grouped[key].totalR += (t.resultado_r || 0);
    });

    const periodList = Object.entries(grouped)
      .map(([name, val]) => ({
        name,
        winrate: val.total > 0 ? Math.round((val.wins / val.total) * 100) : 0,
        pnl: val.pnlUsd,
        totalR: val.totalR,
        tradesCount: val.total
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-12);

    const positivePeriods = periodList.length > 0 ? periodList.filter(p => p.pnl > 0).length : 0;
    const consistencyScore = periodList.length > 0 ? Math.round((positivePeriods / periodList.length) * 100) : 0;
    const avgWinrate = periodList.length > 0 ? Math.round(periodList.reduce((acc, p) => acc + p.winrate, 0) / periodList.length) : 0;
    const totalPnlWindow = periodList.reduce((acc, p) => acc + p.pnl, 0);

    const consistencyData = [
      { name: 'Profit', value: consistencyScore || 0, fill: '#10b981' },
      { name: 'Loss/BE', value: 100 - (consistencyScore || 0), fill: '#f1f5f9' }
    ];

    const winrateData = [
      { name: 'Wins', value: avgWinrate || 0, fill: '#3b82f6' },
      { name: 'Losses', value: 100 - (avgWinrate || 0), fill: '#f1f5f9' }
    ];

    return { 
      periodList, 
      consistencyScore, 
      avgWinrate, 
      consistencyData, 
      winrateData,
      totalPnlWindow,
      projectionValue,
      numPeriodos: periodList.length
    };
  }, [trades, period, riskAmount, accountBalance, riskPercentage]);

  const formattedProjection = `$${stats.projectionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 18) return 'text-3xl';
    if (len > 14) return 'text-4xl';
    if (len > 11) return 'text-5xl';
    return 'text-6xl';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-500">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/30 dark:bg-slate-800/10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20">
            <History size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Audit de Rendimiento</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Selecciona un periodo para proyectar tu capitalización exponencial
            </p>
          </div>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          {(['diario', 'semanal', 'mensual', 'anual'] as PeriodType[]).map(p => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)} 
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                period === p 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 lg:p-12 flex flex-col lg:flex-row gap-12 items-center animate-in fade-in duration-700">
        
        <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Consistencia</h4>
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">Ciclos Rentables ({period})</p>
            </div>
            <div className="w-36 h-36 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.consistencyData} 
                    cx="50%" cy="50%" 
                    innerRadius={50} 
                    outerRadius={60} 
                    startAngle={90} 
                    endAngle={450} 
                    dataKey="value" 
                    stroke="none" 
                    cornerRadius={10}
                  >
                    {stats.consistencyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-2xl font-black ${stats.consistencyScore >= 60 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                  {stats.consistencyScore}%
                </span>
                <span className="text-[7px] font-black text-slate-400 uppercase">Ratio</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Efectividad</h4>
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">Winrate Promedio</p>
            </div>
            <div className="w-36 h-36 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.winrateData} 
                    cx="50%" cy="50%" 
                    innerRadius={50} 
                    outerRadius={60} 
                    startAngle={90} 
                    endAngle={450} 
                    dataKey="value" 
                    stroke="none" 
                    cornerRadius={10}
                  >
                    {stats.winrateData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-blue-600">
                  {stats.avgWinrate}%
                </span>
                <span className="text-[7px] font-black text-slate-400 uppercase">Efectividad</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-blue-600 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-blue-600/20 relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
             <Zap className="absolute -right-4 -bottom-4 text-white/10 rotate-12 transition-transform group-hover:rotate-0 duration-700 pointer-events-none" size={160} />
             <div className="relative z-10">
               <h4 className="text-[11px] font-black text-blue-100 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Landmark size={14} className="animate-pulse" /> Proyección de Capital
               </h4>
               
               <p className="text-[10px] text-blue-100/70 font-bold uppercase tracking-widest mb-1">
                 ESTIMACIÓN {period.toUpperCase()}
               </p>
               <p className={`${getFontSizeClass(formattedProjection)} font-black italic tracking-tighter transition-all duration-300 break-words`}>
                 {formattedProjection}
               </p>
               
               <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-[10px] font-bold text-blue-100 leading-relaxed uppercase">
                    {period === 'diario' 
                      ? `Basado en 1R sobre $${accountBalance.toLocaleString()}` 
                      : `Crecimiento compuesto (${period}) al ${riskPercentage}%`}
                  </p>
                  <p className="text-[9px] font-black text-blue-200/60 uppercase italic mt-1">
                    {period === 'anual' ? 'Proyección basada en 240 días operativos' : 'Cálculo basado en balance actual'}
                  </p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 gap-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
          Lógica exponencial aplicada sobre el balance actual: <span className="text-blue-500">${accountBalance.toLocaleString()}</span>
        </p>
        <div className="px-4 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
          <Target size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase italic">Proyección de Capitalización Anual Activa</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
