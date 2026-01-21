import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trader, TraderRole } from '../types';
import { Plus, User, Mail, Shield, CheckCircle2, XCircle, Trash2, Edit2, Loader2 } from 'lucide-react';
import { ROLES } from '../constants';

const TraderList: React.FC = () => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Trader>>({
    nombre: '',
    correo_electronico: '',
    rol: 'alumno',
    activo: true
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dbService.fetchTraders();
      setTraders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.saveTrader({ ...formData, id: editingId || undefined });
      await load();
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', correo_electronico: '', rol: 'alumno', activo: true });
    } catch (err) {
      alert('Error al guardar trader');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este trader?')) {
      setSaving(true);
      try {
        await dbService.deleteTrader(id);
        await load();
      } catch (err) {
        alert('Error al eliminar');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEdit = (trader: Trader) => {
    setEditingId(trader.id);
    setFormData({
      nombre: trader.nombre,
      correo_electronico: trader.correo_electronico,
      rol: trader.rol,
      activo: trader.activo
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Equipo en la Nube</h2>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ nombre: '', correo_electronico: '', rol: 'alumno', activo: true });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          {showForm ? 'Cancelar' : <><Plus size={18} /> Añadir Miembro</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl border border-blue-200 shadow-2xl animate-in slide-in-from-top duration-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Profesional</label>
              <input 
                required
                type="email"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.correo_electronico}
                onChange={e => setFormData({...formData, correo_electronico: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Rol en Academia</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value as TraderRole})}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : (editingId ? 'ACTUALIZAR' : 'GUARDAR')}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {traders.map(trader => (
            <div key={trader.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(trader)}
                  className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(trader.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-start justify-between mb-6">
                <div className="bg-slate-100 p-4 rounded-2xl text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-transparent group-hover:shadow-blue-600/20">
                  <User size={28} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> ACTIVO
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 leading-tight mb-4">{trader.nombre}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                  <Mail size={16} className="text-blue-500" />
                  <span className="truncate">{trader.correo_electronico}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                  <Shield size={16} className="text-indigo-500" />
                  <span className="capitalize font-black text-slate-700">
                    {trader.rol.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {traders.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
              <p className="text-slate-400 font-bold italic">Tu equipo aparecerá aquí. Comienza añadiendo al primer analista.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TraderList;