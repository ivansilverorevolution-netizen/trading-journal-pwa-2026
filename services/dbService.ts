import { supabase } from './supabaseClient';
import { Trade, Trader, AppUser } from '../types';

export const dbService = {
  isCloudEnabled: () => true,

  getCurrentUser: (): AppUser | null => {
    const user = localStorage.getItem('academy_user');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: any) => {
    if (user) {
      localStorage.setItem('academy_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('academy_user');
    }
  },

  // Operaciones de Trades - Mapeo exacto a tu SQL
  fetchTrades: async (): Promise<Trade[]> => {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        traders (nombre)
      `)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      trader_id: t.trader_id.toString(),
      fecha_entrada: t.fecha,
      activo: t.activo,
      direccion: t.direccion,
      resultado_estado: t.estado,
      resultado_r: parseFloat(t.ratio_rb),
      sesion: t.sesion,
      estrategia: t.estrategia,
      nota_trader: t.notas,
      created_at: t.created_at,
      trader_name: t.traders?.nombre
    })) as unknown as Trade[];
  },

  getTrades: (): Trade[] => [],

  saveTrade: async (trade: Partial<Trade>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada o no válida");

    const tradeData = {
      id: trade.id || crypto.randomUUID(),
      user_id: user.id,
      trader_id: parseInt(trade.trader_id || "0"),
      fecha: trade.fecha_entrada,
      activo: trade.activo,
      direccion: trade.direccion,
      estado: trade.resultado_estado || 'Pendiente',
      ratio_rb: trade.resultado_r || 0,
      sesion: trade.sesion,
      estrategia: trade.estrategia,
      notas: trade.nota_trader,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('trades')
      .upsert(tradeData);

    if (error) throw error;
  },

  deleteTrade: async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  fetchTraders: async (): Promise<Trader[]> => {
    const { data, error } = await supabase
      .from('traders')
      .select('*')
      .order('nombre');

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id.toString(),
      user_id: t.user_id,
      nombre: t.nombre,
      correo_electronico: t.correo,
      rol: t.rol,
      activo: true,
      created_at: t.insertado_en,
      updated_at: t.updated_at
    })) as Trader[];
  },

  getTraders: (): Trader[] => [],

  saveTrader: async (trader: Partial<Trader>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const traderData = {
      user_id: user.id,
      nombre: trader.nombre,
      correo: trader.correo_electronico,
      rol: trader.rol,
      updated_at: new Date().toISOString()
    };

    let error;
    if (trader.id) {
      const { error: e } = await supabase
        .from('traders')
        .update(traderData)
        .eq('id', parseInt(trader.id));
      error = e;
    } else {
      const { error: e } = await supabase
        .from('traders')
        .insert([traderData]);
      error = e;
    }

    if (error) throw error;
  },

  deleteTrader: async (id: string) => {
    const { error } = await supabase
      .from('traders')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
  }
};