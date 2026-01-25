
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Wallet, Percent, CalendarDays, ArrowRight, Table as TableIcon, ChartBar, Info, Award, Target, Zap } from 'lucide-react';

const CompoundCalculator: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState<number | undefined>(undefined);
  const [dailyRate, setDailyRate] = useState<number | undefined>(undefined);
  const [days, setDays] = useState<number | undefined>(undefined);

  const projection = useMemo(() => {
    if (initialCapital === undefined || dailyRate === undefined || days === undefined || days <= 0) {
      return null;
    }

    let currentBalance = initialCapital;
    const data = [];
    const tableData = [];

    for (let i = 0; i <= days; i++) {
      if (i === 0) {
        data.push({ day: 0, balance: initialCapital });
      } else {
        const profit = currentBalance * (dailyRate / 100);
        const startBalance = currentBalance;
        currentBalance += profit;
        
        const totalGrowthPercent = ((currentBalance - initialCapital) / initialCapital) * 100;

        data.push({ day: i, balance: parseFloat(currentBalance.toFixed(2)) });
        tableData.push({
          day: i,
          start: startBalance.toFixed(2),
          profit: profit.toFixed(2),
          end: currentBalance.toFixed(2),
          growth: totalGrowthPercent.toFixed(1)
        });
      }
    }

    return { 
      chartData: data, 
      tableData: tableData.reverse(),
      finalBalance: currentBalance,
      totalProfit: currentBalance - initialCapital,
      roi: ((currentBalance - initialCapital) / initialCapital) * 100
    };
  }, [initialCapital, dailyRate, days]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Proyector Exponencial</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
            <Target size={14} className="text-blue-500" /> Ingeniería de Capital v2.0
          </p>
        </div>
        {projection && (
          <div className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-600/20 animate-in slide-in-from-right">
            <Zap size={18} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase opacity-70 leading-none">Crecimiento Final</span>
              <span className="text-sm font-black italic">+{projection.roi.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* NIVEL SUPERIOR: Configuración y Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PARÁMETROS (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4 mb-6">
              <Calculator size={18} className="text-blue-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Configuración</h3>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital Inicial (USD)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 5000"
                  value={initialCapital === undefined ? '' : initialCapital} 
                  onChange={(e) => setInitialCapital(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Retorno Diario (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Ej: 1.5"
                  value={dailyRate === undefined ? '' : dailyRate} 
                  onChange={(e) => setDailyRate(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Días Operativos</label>
                <input 
                  type="number" 
                  placeholder="Ej: 20"
                  value={days === undefined ? '' : days} 
                  onChange={(e) => setDays(e.target.value === '' ? undefined : parseInt(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-lg font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className={`mt-8 p-6 rounded-[2rem] transition-all duration-500 ${projection ? 'bg-slate-900 dark:bg-blue-600 shadow-xl shadow-blue-600/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
               <p className={`text-[10px] font-black uppercase tracking-widest ${projection ? 'text-blue-100' : 'text-slate-400'}`}>Objetivo Final</p>
               <p className={`text-2xl font-black mt-1 ${projection ? 'text-white' : 'text-slate-300 dark:text-slate-600 italic'}`}>
                 {projection ? `$${projection.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '---'}
               </p>
            </div>
          </div>
        </div>

        {/* GRÁFICO (Col 8) */}
        <div className="lg:col-span-8">
          {!projection ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] h-full flex flex-col items-center justify-center p-12 text-center gap-4 transition-colors">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl shadow-sm">
                <ChartBar size={32} className="text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic">Esperando Entrada de Datos</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Completa el formulario para visualizar la proyección</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col animate-in zoom-in-95 duration-500 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500"><TrendingUp size={20} /></div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Tendencia de Capital</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganancia Neta</p>
                  <p className="text-xl font-black text-emerald-600">+${projection.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projection.chartData}>
                    <defs>
                      <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} tickLine={false} 
                      tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}}
                    />
                    <YAxis 
                      axisLine={false} tickLine={false} 
                      tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fill="url(#colorCurve)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NIVEL INFERIOR: Desglose Diario Ancho Completo */}
      <div className="w-full">
        {!projection ? (
          <div className="bg-slate-50 dark:bg-slate-900/30 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center">
             <Info size={24} className="mx-auto text-slate-300 mb-3" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">El desglose diario aparecerá aquí una vez calculada la proyección</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 transition-colors">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TableIcon size={20} className="text-slate-400" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Desglose Detallado por Jornada</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Proyección Activa</span>
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                  <tr>
                    <th className="px-8 py-5">Jornada</th>
                    <th className="px-8 py-5">Balance Apertura</th>
                    <th className="px-8 py-5">Beneficio ({dailyRate}%)</th>
                    <th className="px-8 py-5">Progreso Acum.</th>
                    <th className="px-8 py-5 text-right">Balance Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {projection.tableData.map((row) => (
                    <tr key={row.day} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-xs font-black text-slate-400 group-hover:text-blue-500 transition-colors">DÍA {row.day}</span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-300">
                        ${parseFloat(row.start).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-emerald-600">+${parseFloat(row.profit).toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Capitalización</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                          {row.growth}% ROI
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-base font-black text-slate-900 dark:text-white italic">
                          ${parseFloat(row.end).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <Award size={20} className="text-amber-500" />
                 <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                   Proyección basada en reinversión total del beneficio diario.
                 </p>
              </div>
              <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                 <span className="text-[10px] font-black text-blue-600 uppercase">Auditado x TradeControl Engine</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default CompoundCalculator;
