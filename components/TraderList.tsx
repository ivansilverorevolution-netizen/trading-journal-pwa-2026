
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Trader, TraderRole } from '../types';
import { Plus, User, Mail, Shield, CheckCircle2, XCircle, Trash2, Edit2 } from 'lucide-react';
import { ROLES } from '../constants';

const TraderList: React.FC = () => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Trader>>({
    nombre: '',
    correo_electronico: '',
    rol: 'alumno',
    activo: true
  });

  // Fix: dbService.getTraders() is synchronous, call setTraders directly
  useEffect(() => {
    setTraders(dbService.getTraders());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.saveTrader({ ...formData, id: editingId || undefined });
    const updated = dbService.getTraders();
    setTraders(updated);
    setShowForm(false);
    setEditingId(null);
    setFormData({ nombre: '', correo_electronico: '', rol: 'alumno', activo: true });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este trader? Esta acción no se puede deshacer.')) {
      await dbService.deleteTrader(id);
      const updated = dbService.getTraders();
      setTraders(updated);
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
        <h2 className="text-2xl font-bold text-slate-800">Equipo de Trading</h2>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ nombre: '', correo_electronico: '', rol: 'alumno', activo: true });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          {showForm ? 'Cancelar' : 'Añadir Miembro'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-lg animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Nombre</label>
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Correo</label>
              <input 
                required
                type="email"
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.correo_electronico}
                onChange={e => setFormData({...formData, correo_electronico: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Rol</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value as TraderRole})}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-900 text-white p-2 rounded-lg text-sm font-bold">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {traders.map(trader => (
          <div key={trader.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group relative">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(trader)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => handleDelete(trader.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-100 p-3 rounded-full text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <User size={24} />
              </div>
              <div className="flex items-center gap-1.5">
                {trader.activo ? (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> ACTIVO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle size={10} /> INACTIVO
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{trader.nombre}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Mail size={14} />
                <span className="truncate">{trader.correo_electronico}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Shield size={14} />
                <span className="capitalize font-medium text-slate-700">
                  {trader.rol.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TraderList;
