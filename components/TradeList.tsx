
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { Edit3, Search, TrendingUp, TrendingDown, Trash2, Loader2, User, AlertTriangle, CheckCircle, Calendar, XCircle, ChevronDown, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TradeListProps {
  onEdit: (trade: Trade) => void;
  filterTraderId?: string;
}

const TradeList: React.FC<TradeListProps> = ({ onEdit, filterTraderId = 'all' }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [localTraderId, setLocalTraderId] = useState<string>(filterTraderId);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tradeData, traderData] = await Promise.all([
        dbService.fetchTrades(),
        dbService.fetchTraders()
      ]);
      setTrades(tradeData);
      setTraders(traderData);
    } catch (err) {
      console.error("Error loading trades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setLocalTraderId(filterTraderId);
  }, [filterTraderId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await dbService.deleteTrade(id);
      setTrades(prev => prev.filter(t => t.id !== id));
      setToast({ message: "Operativa eliminada correctamente", type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Error al eliminar la operativa', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTrades = useMemo(() => {
    let result = trades;
    if (localTraderId !== 'all') {
      result = result.filter(t => t.trader_id === localTraderId);
    }
    if (startDate) {
      result = result.filter(t => t.fecha_entrada >= startDate);
    }
    if (endDate) {
      result = result.filter(t => t.fecha_entrada <= endDate);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.activo.toLowerCase().includes(lowerSearch) || 
        t.trader_name?.toLowerCase().includes(lowerSearch)
      );
    }
    return [...result].sort((a, b) => new Date(a.fecha_entrada).getTime() - new Date(b.fecha_entrada).getTime());
  }, [trades, searchTerm, localTraderId, startDate, endDate]);

  const handleExportCSV = () => {
    if (filteredTrades.length === 0) return;

    const headers = ['FECHA', 'HORA', 'ACTIVO', 'CUENTA', 'DIRECCION', 'RIESGO_USD', 'RATIO_R', 'BENEFICIO_USD', 'ESTADO'];
    const rows = filteredTrades.map(t => [
      t.fecha_entrada, t.hora_entrada, t.activo, t.trader_name || 'Desconocido', t.direccion,
      t.monto_riesgo?.toFixed(2) || '0.00', t.resultado_r?.toFixed(2) || '0.00',
      t.resultado_dinero?.toFixed(2) || '0.00', t.resultado_estado || 'Pendiente'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Plan_Trading_Excel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: "Excel exportado correctamente", type: 'success' });
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const handleExportPDF = () => {
    if (filteredTrades.length === 0) return;

    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const traderName = localTraderId === 'all' ? 'Consolidado Global' : (traders.find(t => t.id === localTraderId)?.nombre || 'Cuenta');
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      doc.setFontSize(28);
      doc.setTextColor(15, 23, 42); 
      doc.setFont('helvetica', 'bold');
      doc.text("PLAN DE TRADING", 14, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); 
      doc.text(`AUDITORÍA CRONOLÓGICA DETALLADA - ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`CUENTA SELECCIONADA: ${traderName.toUpperCase()}`, 14, 35);

      const groupedData: any = {};
      filteredTrades.forEach(trade => {
        const d = new Date(trade.fecha_entrada + 'T12:00:00'); // Evitar problemas de timezone
        const year = d.getFullYear();
        const month = months[d.getMonth()];
        const week = `Semana ${getWeekNumber(d)}`;
        
        if (!groupedData[year]) groupedData[year] = {};
        if (!groupedData[year][month]) groupedData[year][month] = {};
        if (!groupedData[year][month][week]) groupedData[year][month][week] = [];
        
        groupedData[year][month][week].push(trade);
      });

      let currentY = 45;

      Object.keys(groupedData).sort().forEach(year => {
        if (currentY > 180) { doc.addPage(); currentY = 20; }
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`AÑO ${year}`, 14, currentY);
        currentY += 10;

        Object.keys(groupedData[year]).forEach(month => {
          if (currentY > 190) { doc.addPage(); currentY = 20; }
          doc.setFontSize(14);
          doc.setTextColor(51, 65, 85);
          doc.text(`Mes: ${month}`, 14, currentY);
          currentY += 8;

          Object.keys(groupedData[year][month]).forEach(week => {
            if (currentY > 200) { doc.addPage(); currentY = 20; }
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(`${week}`, 20, currentY);
            currentY += 5;

            const tradesInWeek = groupedData[year][month][week];
            const tableData = tradesInWeek.map((t: Trade) => [
              t.fecha_entrada,
              t.activo,
              t.direccion,
              `$ ${t.monto_riesgo?.toFixed(2)}`,
              `${t.resultado_r?.toFixed(2)} R`,
              `$ ${t.resultado_dinero?.toFixed(2)}`,
              t.resultado_estado?.toUpperCase() || 'PENDIENTE'
            ]);

            autoTable(doc, {
              startY: currentY,
              head: [['FECHA', 'ACTIVO', 'DIRECCIÓN', 'RIESGO (USD)', 'RATIO R', 'P&L (USD)', 'ESTADO']],
              body: tableData,
              theme: 'striped',
              headStyles: { fillColor: [15, 23, 42], fontSize: 8, halign: 'center' },
              styles: { fontSize: 8, cellPadding: 3 },
              columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'center' } },
              didParseCell: (data: any) => {
                if (data.section === 'body' && data.column.index === 6) {
                  const status = String(data.cell.raw);
                  if (status === 'GANADORA') data.cell.styles.textColor = [16, 185, 129]; 
                  if (status === 'PERDEDORA') data.cell.styles.textColor = [244, 63, 94]; 
                }
              }
            });

            const lastTable = (doc as any).lastAutoTable;
            if (lastTable && lastTable.cursor && typeof lastTable.cursor.y === 'number') {
              currentY = lastTable.cursor.y + 12;
            } else {
              currentY += (tableData.length * 8) + 15;
            }
          });
          currentY += 5;
        });
        currentY += 10;
      });

      doc.addPage();
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text("RESUMEN DE RENDIMIENTO TOTAL", 14, 30);
      
      const totalPnl = filteredTrades.reduce((sum, t) => sum + (t.resultado_dinero || 0), 0);
      const totalR = filteredTrades.reduce((sum, t) => sum + (t.resultado_r || 0), 0);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Operaciones Registradas: ${filteredTrades.length}`, 14, 45);
      doc.text(`Multiplicador R Acumulado: ${totalR.toFixed(2)} R`, 14, 55);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const pnlColor = totalPnl >= 0 ? [16, 185, 129] : [244, 63, 94];
      doc.setTextColor(pnlColor[0], pnlColor[1], pnlColor[2]);
      doc.text(`BALANCE FINAL NETO: $ ${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, 70);

      doc.save(`Plan_Trading_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
      setToast({ message: "PDF 'Plan de Trading' generado correctamente", type: 'success' });
    } catch (err) {
      console.error("PDF Error:", err);
      setToast({ message: "Error crítico al generar PDF. Revise la consola.", type: 'error' });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocalTraderId('all');
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative transition-all">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">¿Borrar registro?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 font-medium">Esta acción no se puede deshacer de la base de datos.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleDelete(confirmDeleteId)} className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl hover:bg-rose-700 active:scale-95 shadow-lg shadow-rose-600/20">ELIMINAR</button>
              <button onClick={() => setConfirmDeleteId(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl hover:bg-slate-200 active:scale-95">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Search size={12} /> Activo</label>
            <input className="w-full pl-5 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" placeholder="EURUSD..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12} /> Cuenta</label>
            <div className="relative">
              <select className="w-full appearance-none pl-5 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs cursor-pointer" value={localTraderId} onChange={e => setLocalTraderId(e.target.value)}>
                <option value="all">TODAS</option>
                {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={12} /> Desde</label>
            <input type="date" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={12} /> Hasta</label>
            <input type="date" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <button onClick={handleExportPDF} disabled={filteredTrades.length === 0} className="flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95">
            <FileText size={14} /> EXPORTAR PDF
          </button>

          <button onClick={handleExportCSV} disabled={filteredTrades.length === 0} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95">
            <Download size={14} /> EXCEL (CSV)
          </button>

          <button onClick={clearFilters} className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
            <XCircle size={14} /> RESET
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && trades.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={30} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-center">Fecha / Activo</th>
                  <th className="px-6 py-5">Cuenta</th>
                  <th className="px-6 py-5">Entrada / SL / TP</th>
                  <th className="px-6 py-5 text-right">Riesgo</th>
                  <th className="px-6 py-5 text-right">Ratio R</th>
                  <th className="px-6 py-5 text-right">Beneficio USD</th>
                  <th className="px-6 py-5 text-center">Estado</th>
                  <th className="px-6 py-5 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-medium">
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {trade.direccion === 'Compra' ? 
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shadow-sm"><TrendingUp size={14}/></div> : 
                          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 shadow-sm"><TrendingDown size={14}/></div>
                        }
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm uppercase">{trade.activo}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{trade.fecha_entrada}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500"><User size={12} /></div>
                        {trade.trader_name || 'Desconocido'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> E: {trade.precio_entrada?.toFixed(5)}</div>
                        <div className="text-[10px] font-bold text-rose-500/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> S: {trade.stop_loss?.toFixed(5)}</div>
                        <div className="text-[10px] font-bold text-emerald-500/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> T: {trade.take_profit_1?.toFixed(5)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-700 dark:text-slate-200">{formatCurrency(trade.monto_riesgo)}</td>
                    <td className={`px-6 py-5 text-right font-black ${trade.resultado_r && trade.resultado_r > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.resultado_r?.toFixed(2)} R</td>
                    <td className={`px-6 py-5 text-right font-black ${(trade.resultado_dinero || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(trade.resultado_dinero)}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                        trade.resultado_estado === 'Ganadora' ? 'bg-emerald-500 text-white' : 
                        trade.resultado_estado === 'Perdedora' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>{trade.resultado_estado || 'Pendiente'}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(trade)} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all"><Edit3 size={18} /></button>
                        <button onClick={() => setConfirmDeleteId(trade.id)} className="p-2.5 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeList;
