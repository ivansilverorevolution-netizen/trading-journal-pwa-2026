
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { 
  Edit3, Search, TrendingUp, TrendingDown, Trash2, Loader2, User, 
  AlertTriangle, Calendar, FileText, Clock, Table, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Zap, MessageSquare, Award, Target
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SESSIONS } from '../constants';

interface TradeListProps {
  onEdit: (trade: Trade) => void;
  filterTraderId?: string;
}

const TradeList: React.FC<TradeListProps> = ({ onEdit, filterTraderId = 'all' }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [localTraderId, setLocalTraderId] = useState<string>(filterTraderId);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const formatR = (val: any) => {
    return parseFloat(Number(val).toFixed(2)).toString();
  };

  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dbService.fetchTrades({
        traderId: localTraderId,
        session: selectedSession,
        startDate: startDate,
        endDate: endDate,
        searchTerm: searchTerm,
        page: currentPage,
        pageSize: pageSize
      });
      setTrades(response.trades);
      setTotalRecords(response.totalCount);
      setSelectedIds(new Set());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [localTraderId, selectedSession, startDate, endDate, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    dbService.fetchTraders().then(setTraders);
    loadTrades();
  }, [loadTrades]);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const response = await dbService.fetchTrades({
        traderId: localTraderId,
        session: selectedSession,
        startDate: startDate,
        endDate: endDate,
        searchTerm: searchTerm,
      });
      
      const allFilteredTrades = response.trades;
      if (allFilteredTrades.length === 0) return;

      const doc = new jsPDF({ orientation: 'landscape' });
      const traderName = localTraderId === 'all' ? 'CONSOLIDADO GLOBAL' : (traders.find(t => t.id === localTraderId)?.nombre || 'CUENTA');
      
      const initialCapital = localTraderId === 'all' 
        ? traders.reduce((sum, t) => sum + (t.capital_inicial || 0), 0)
        : (traders.find(t => t.id === localTraderId)?.capital_inicial || 0);

      const totalPnl = allFilteredTrades.reduce((sum, t) => sum + (t.monto_riesgo || 0), 0);
      const yieldPercent = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
      const finalBalance = initialCapital + totalPnl;

      let feedback = "";
      let feedbackColor: [number, number, number] = [15, 23, 42];
      
      if (yieldPercent > 0) {
        feedback = `¡FELICITACIONES! Has logrado un rendimiento del ${yieldPercent.toFixed(2)}%. Tu disciplina y respeto por el plan de trading están dando frutos. Mantén el enfoque y no caigas en exceso de confianza.`;
        feedbackColor = [16, 185, 129]; 
      } else if (yieldPercent < 0) {
        feedback = `RECOMENDACIÓN: El periodo cierra con un drawdown del ${Math.abs(yieldPercent).toFixed(2)}%. Es vital revisar tus reglas de salida y control emocional. No operes por venganza; protege tu capital como prioridad número uno.`;
        feedbackColor = [244, 63, 94]; 
      } else {
        feedback = `ESTADO NEUTRAL: Has terminado el periodo en equilibrio (Break Even). Sigue trabajando en tu consistencia, las mejores oportunidades vendrán si preservas tu capital correctamente.`;
      }

      // Encabezado Estilizado
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 300, 45, 'F');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("AUDITORÍA DE TRADING PROFESIONAL", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`CUENTA: ${traderName.toUpperCase()}  |  FECHA INFORME: ${new Date().toLocaleDateString()}`, 14, 32);
      doc.text(`TRADING SIN FRONTERAS - TERMINAL DE AUDITORÍA v2.5`, 14, 38);

      // Resumen Ejecutivo
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text("RESUMEN EJECUTIVO", 14, 60);

      const statsX = 14;
      const statsY = 65;
      
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(statsX, statsY, 65, 30, 3, 3, 'FD');
      doc.roundedRect(statsX + 70, statsY, 65, 30, 3, 3, 'FD');
      doc.roundedRect(statsX + 140, statsY, 65, 30, 3, 3, 'FD');
      doc.roundedRect(statsX + 210, statsY, 65, 30, 3, 3, 'FD');

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("CAPITAL INICIAL", statsX + 5, statsY + 8);
      doc.text("PROFIT / LOSS", statsX + 75, statsY + 8);
      doc.text("RENDIMIENTO (ROI)", statsX + 145, statsY + 8);
      doc.text("BALANCE FINAL", statsX + 215, statsY + 8);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`$${initialCapital.toLocaleString()}`, statsX + 5, statsY + 20);
      doc.setTextColor(totalPnl >= 0 ? 16 : 244, totalPnl >= 0 ? 185 : 63, totalPnl >= 0 ? 129 : 94);
      doc.text(`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`, statsX + 75, statsY + 20);
      doc.text(`${yieldPercent >= 0 ? '+' : ''}${yieldPercent.toFixed(2)}%`, statsX + 145, statsY + 20);
      doc.setTextColor(15, 23, 42);
      doc.text(`$${finalBalance.toLocaleString()}`, statsX + 215, statsY + 20);

      // BLOQUE DE FEEDBACK CORREGIDO (MULTILÍNEA Y MÁRGENES DE SEGURIDAD)
      doc.setFontSize(9);
      const marginSafety = 14;
      const maxWidth = 265; // Margen derecho garantizado
      const splitFeedback = doc.splitTextToSize(feedback, maxWidth);
      const feedbackLineCount = splitFeedback.length;
      const feedbackBoxHeight = (feedbackLineCount * 5) + 12;
      const feedbackBoxY = 105;
      
      // Caja de fondo para el feedback
      doc.setFillColor(30, 41, 59); // Fondo Slate Oscuro para contraste pro
      doc.roundedRect(marginSafety, feedbackBoxY, 269, feedbackBoxHeight, 4, 4, 'F');
      
      doc.setFont('helvetica', 'bolditalic');
      doc.setTextColor(255, 255, 255); // Texto blanco sobre fondo oscuro
      doc.text(splitFeedback, marginSafety + 5, feedbackBoxY + 8);

      // Tabla de Operaciones - Posicionada debajo del feedback dinámico
      autoTable(doc, {
        startY: feedbackBoxY + feedbackBoxHeight + 10,
        head: [['FECHA', 'ACTIVO', 'DIRECCIÓN', 'SESIÓN', 'ESTRATEGIA', 'CUENTA', 'RATIO R', 'P&L (USD)', 'ESTADO']],
        body: allFilteredTrades.map(t => [
          t.fecha_entrada,
          t.activo.toUpperCase(),
          t.direccion.toUpperCase(),
          t.sesion?.toUpperCase(),
          t.estrategia?.toUpperCase() || '-',
          t.trader_name || '-',
          `1 : ${formatR(t.resultado_r)}`,
          `$${t.monto_riesgo?.toFixed(2)}`,
          t.resultado_estado?.toUpperCase() || 'PENDIENTE'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          7: { fontStyle: 'bold', halign: 'right' },
          8: { fontStyle: 'bold', halign: 'center' }
        }
      });

      doc.save(`Auditoria_${traderName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      setToast({ message: "Informe PDF exportado correctamente", type: 'success' });
    } catch (e) { 
      console.error(e);
      setToast({ message: "Error al generar informe", type: 'error' });
    } finally { setLoading(false); }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const response = await dbService.fetchTrades({
        traderId: localTraderId,
        session: selectedSession,
        startDate: startDate,
        endDate: endDate,
        searchTerm: searchTerm
      });
      const allFilteredTrades = response.trades;
      if (allFilteredTrades.length === 0) return;
      const headers = ['Fecha', 'Activo', 'Direccion', 'Sesion', 'Estrategia', 'Cuenta', 'Ratio_R', 'PnL_USD', 'Estado'];
      const rows = allFilteredTrades.map(t => [t.fecha_entrada, t.activo, t.direccion, t.sesion, t.estrategia || '-', t.trader_name || '-', formatR(t.resultado_r), t.monto_riesgo?.toFixed(2), t.resultado_estado]);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Auditoria_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
    } catch (err) { setToast({ message: "Error al exportar CSV", type: 'error' }); }
    finally { setLoading(false); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trades.length && trades.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(trades.map(t => t.id)));
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async (ids: string[]) => {
    setConfirmDeleteIds(null);
    try {
      await dbService.deleteTrades(ids);
      loadTrades();
      setToast({ message: `${ids.length} Registro(s) borrados`, type: 'success' });
      setSelectedIds(new Set());
    } catch (err) { setToast({ message: 'Error en servidor', type: 'error' }); }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white font-black text-xs uppercase tracking-widest`}>
          {toast.message}
        </div>
      )}

      {confirmDeleteIds && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-sm w-full border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black mb-2 dark:text-white uppercase italic">¿Confirmar eliminación?</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">Esta acción es irreversible en la base de datos.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleDelete(confirmDeleteIds)} className="bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase text-xs tracking-widest">ELIMINAR AHORA</button>
              <button onClick={() => setConfirmDeleteIds(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border border-white/10">
          <div className="flex items-center gap-4 px-2">
            <div className="bg-blue-600 h-8 w-8 rounded-xl flex items-center justify-center font-black text-sm">{selectedIds.size}</div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">Seleccionados</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest">Deseleccionar</button>
            <button onClick={() => setConfirmDeleteIds(Array.from(selectedIds))} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Trash2 size={14} /> Eliminar Lote
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Search size={12} /> Activo</label>
            <input className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12} /> Cuenta</label>
            <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" value={localTraderId} onChange={e => setLocalTraderId(e.target.value)}>
              <option value="all">TODAS</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Clock size={12} /> Sesión</label>
            <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
              <option value="all">TODAS</option>
              {SESSIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={12} /> Desde</label>
            <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={12} /> Hasta</label>
            <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={handleExportPDF} className="bg-rose-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-rose-700" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
          </button>
          <button onClick={handleExportCSV} className="bg-slate-800 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-700" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Table size={14} />} CSV
          </button>
          <button onClick={() => { setSearchTerm(''); setLocalTraderId('all'); setSelectedSession('all'); setStartDate(''); setEndDate(''); setCurrentPage(1); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-xl font-black text-[10px] uppercase">LIMPIAR</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1300px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 w-12 text-center">
                  <button onClick={toggleSelectAll} className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedIds.size === trades.length && trades.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>{selectedIds.size === trades.length && trades.length > 0 && <Check size={14} className="text-white" />}</button>
                </th>
                <th className="px-6 py-5">Fecha / Activo</th>
                <th className="px-6 py-5">Dirección</th>
                <th className="px-6 py-5">Sesión</th>
                <th className="px-6 py-5">Estrategia</th>
                <th className="px-6 py-5">Contexto / Notas</th>
                <th className="px-6 py-5">Cuenta</th>
                <th className="px-6 py-5 text-right">Ratio R</th>
                <th className="px-6 py-5 text-right">P&L Neto (USD)</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={11} className="py-20 text-center"><Loader2 size={32} className="animate-spin text-blue-600 mx-auto" /></td></tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className={`transition-colors group ${selectedIds.has(trade.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => toggleSelectOne(trade.id)} className={`w-5 h-5 rounded-md border-2 mx-auto transition-all flex items-center justify-center ${selectedIds.has(trade.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>{selectedIds.has(trade.id) && <Check size={14} className="text-white" />}</button>
                    </td>
                    <td className="px-6 py-5"><div className="font-black text-slate-900 dark:text-white uppercase italic">{trade.activo}</div><div className="text-[10px] text-slate-400 font-bold">{trade.fecha_entrada}</div></td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${trade.direccion === 'Compra' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                        {trade.direccion === 'Compra' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trade.direccion === 'Compra' ? 'COMPRA' : 'VENTA'}
                      </span>
                    </td>
                    <td className="px-6 py-5"><span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black rounded-lg uppercase italic">{trade.sesion}</span></td>
                    <td className="px-6 py-5"><div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400"><Zap size={12} className="text-blue-500" /> {trade.estrategia || '-'}</div></td>
                    <td className="px-6 py-5 max-w-[200px]">{trade.nota_trader ? <p className="text-[11px] font-medium text-slate-500 italic line-clamp-2">"{trade.nota_trader}"</p> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-5"><div className="text-xs font-bold text-slate-600 dark:text-slate-400">{trade.trader_name}</div></td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">1 : {formatR(trade.resultado_r)}</td>
                    <td className={`px-6 py-5 text-right font-black text-lg italic ${trade.monto_riesgo && trade.monto_riesgo < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${Math.abs(trade.monto_riesgo || 0).toLocaleString()}</td>
                    <td className="px-6 py-5 text-center"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${trade.resultado_estado === 'Ganadora' ? 'bg-emerald-500 text-white' : trade.resultado_estado === 'Perdedora' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{trade.resultado_estado}</span></td>
                    <td className="px-6 py-5 text-right flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity"><button onClick={() => onEdit(trade)} className="p-2 hover:text-blue-500"><Edit3 size={18} /></button><button onClick={() => setConfirmDeleteIds([trade.id])} className="p-2 hover:text-rose-500"><Trash2 size={18} /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-black text-slate-500 uppercase">Total: {totalRecords}</span>
          <div className="flex items-center bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-3 text-slate-500 disabled:opacity-20"><ChevronLeft size={16} /></button>
            <span className="px-6 text-xs font-black italic">{currentPage} / {Math.max(1, totalPages)}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-3 text-slate-500 disabled:opacity-20"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeList;
