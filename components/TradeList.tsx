
import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/dbService';
import { Trade, Trader } from '../types';
import { SESSIONS } from '../constants';
import { 
  Edit3, Trash2, Loader2, FileText, Table, 
  ChevronLeft, ChevronRight, CheckCircle, AlertTriangle 
} from 'lucide-react';

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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dbService.fetchTrades({
        traderId: localTraderId,
        session: selectedSession,
        startDate,
        endDate,
        searchTerm,
        page: currentPage,
        pageSize
      });
      setTrades(response.trades);
      setTotalRecords(response.totalCount);
      setSelectedIds(new Set());
    } catch (err) { 
      console.error(err);
      setToast({ message: "Error al cargar datos", type: 'error' });
    }
    finally { setLoading(false); }
  }, [localTraderId, selectedSession, startDate, endDate, searchTerm, currentPage, pageSize]);

  useEffect(() => {
    dbService.fetchTraders().then(setTraders).catch(console.error);
    loadTrades();
  }, [loadTrades]);

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteIndividual = async (id: string) => {
    if (!window.confirm('¿Eliminar definitivamente de la nube?')) return;
    
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await dbService.deleteTrade(id);
      setToast({ message: "Eliminado con éxito", type: 'success' });
      await loadTrades(); 
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeletingIds(prev => {
        const n = new Set(prev); n.delete(id); return n;
      });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`¿Borrar definitivamente los ${selectedIds.size} registros seleccionados?`)) return;
    setIsBulkDeleting(true);
    try {
      await dbService.deleteTradesBulk(Array.from(selectedIds));
      setToast({ message: "Registros eliminados correctamente", type: 'success' });
      await loadTrades();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsBulkDeleting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl text-white font-black text-[10px] uppercase flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10 sticky top-4 z-40 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4 ml-2">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black">{selectedIds.size}</div>
             <span className="text-[10px] font-black uppercase tracking-widest">Registros Seleccionados</span>
          </div>
          <button 
            onClick={handleDeleteSelected} 
            disabled={isBulkDeleting}
            className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all active:scale-95"
          >
            {isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Confirmar Borrado
          </button>
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 items-end">
          <div className="lg:col-span-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activo</label>
            <input className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none font-bold text-xs dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="lg:col-span-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuenta</label>
            <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl font-bold text-xs dark:text-white" value={localTraderId} onChange={e => setLocalTraderId(e.target.value)}>
              <option value="all">TODAS</option>
              {traders.map(t => <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>)}
            </select>
          </div>
          <button onClick={() => loadTrades()} className="lg:col-span-1 bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-colors">Filtrar</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 w-12"></th>
                <th className="px-6 py-5">Activo / Fecha</th>
                <th className="px-6 py-5">Dirección</th>
                <th className="px-6 py-5 text-right">Monto USD</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center text-xs font-black uppercase text-slate-400 animate-pulse">Sincronizando...</td></tr>
              ) : trades.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-xs font-black uppercase text-slate-400 italic">Sin datos</td></tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(trade.id) ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => toggleSelectOne(trade.id)} className={`w-5 h-5 rounded border-2 transition-all ${selectedIds.has(trade.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-700'}`}>
                        {selectedIds.has(trade.id) && <span className="text-white text-[10px]">✓</span>}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 dark:text-white uppercase">{trade.activo}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{trade.fecha_entrada}</div>
                    </td>
                    <td className="px-6 py-5"><span className={`text-[10px] font-black uppercase ${trade.direccion === 'Compra' ? 'text-emerald-500' : 'text-rose-500'}`}>{trade.direccion}</span></td>
                    <td className={`px-6 py-5 text-right font-black ${trade.monto_riesgo < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>${trade.monto_riesgo?.toLocaleString()}</td>
                    <td className="px-6 py-5 text-center"><span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${trade.resultado_estado === 'Ganadora' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{trade.resultado_estado}</span></td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onEdit(trade)} className="p-2 text-slate-400 hover:text-blue-500"><Edit3 size={18} /></button>
                        <button 
                          disabled={deletingIds.has(trade.id)}
                          onClick={() => handleDeleteIndividual(trade.id)} 
                          className={`p-2 transition-all ${deletingIds.has(trade.id) ? 'text-slate-200' : 'text-slate-400 hover:text-rose-600'}`}
                        >
                          {deletingIds.has(trade.id) ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-5 flex items-center justify-between border-t dark:border-slate-800">
          <div className="text-[10px] font-black text-slate-500 uppercase">Registros: {totalRecords}</div>
          <div className="flex items-center gap-3">
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700" disabled={currentPage === 1}><ChevronLeft size={16} /></button>
             <span className="text-xs font-black dark:text-white">{currentPage} / {Math.max(1, totalPages)}</span>
             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700" disabled={currentPage === totalPages || totalPages === 0}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeList;
