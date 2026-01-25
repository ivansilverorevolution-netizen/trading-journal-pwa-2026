
import { supabase } from './supabaseClient';
import { Trade, Trader, AppUser } from '../types';

const FINANCIAL_SETTINGS_KEY = 'academy_trader_financial_settings';

const getLocalFinancialSettings = () => {
  const data = localStorage.getItem(FINANCIAL_SETTINGS_KEY);
  return data ? JSON.parse(data) : {};
};

const saveLocalFinancialSettings = (id: string, settings: any) => {
  const current = getLocalFinancialSettings();
  current[id] = { ...current[id], ...settings };
  localStorage.setItem(FINANCIAL_SETTINGS_KEY, JSON.stringify(current));
};

/**
 * Normaliza el ID para Supabase.
 * Intenta convertir a número si la base de datos usa bigint, 
 * de lo contrario lo mantiene como string (UUID).
 */
const prepareId = (id: any) => {
  if (!id) return null;
  const s = String(id).trim();
  if (s.startsWith('local_')) return null;
  // Si parece un número puro (ID autoincremental de Supabase)
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
};

const parseVirtualData = (notas: string | null) => {
  if (!notas) return {};
  try {
    if (notas.startsWith('__VIRTUAL_DATA__:')) {
      const jsonStr = notas.split('__VIRTUAL_DATA__:')[1].split('__END_VIRTUAL__')[0];
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.warn("Error parsing virtual data", e);
  }
  return {};
};

export const dbService = {
  isCloudEnabled: () => true,

  getCurrentUser: (): AppUser | null => {
    const user = localStorage.getItem('academy_user');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: any) => {
    if (user) localStorage.setItem('academy_user', JSON.stringify(user));
    else localStorage.removeItem('academy_user');
  },

  // ELIMINAR UN TRADE
  deleteTrade: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada. Por favor, logueate de nuevo.");

    const safeId = prepareId(id);
    if (!safeId) return true;

    const { data, error } = await supabase
      .from('trades')
      .delete()
      .eq('id', safeId)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("No se pudo eliminar el registro. Puede que ya no exista o no tengas permisos.");
    }
    return true;
  },

  // ELIMINAR TRADES EN MASA
  deleteTradesBulk: async (ids: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada");

    const safeIds = ids.map(prepareId).filter(i => i !== null);
    if (safeIds.length === 0) return true;

    const { data, error } = await supabase
      .from('trades')
      .delete()
      .in('id', safeIds)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("No se borró nada. Verifica si eres el autor de estas operaciones.");
    }
    return true;
  },

  // ELIMINAR CUENTA (TRADER)
  deleteTrader: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada");

    const safeId = prepareId(id);
    if (!safeId) return true;

    const { data, error } = await supabase
      .from('traders')
      .delete()
      .eq('id', safeId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      if (error.code === '23503') {
        throw new Error("No se puede eliminar la cuenta porque tiene operaciones vinculadas. Elimina las operaciones primero o activa CASCADE en Supabase.");
      }
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Fallo al eliminar: Registro no encontrado o permiso denegado.");
    }

    // Limpieza local
    const settings = getLocalFinancialSettings();
    if (settings[String(id)]) {
      delete settings[String(id)];
      localStorage.setItem(FINANCIAL_SETTINGS_KEY, JSON.stringify(settings));
    }

    return true;
  },

  fetchTrades: async (params?: { 
    traderId?: string, 
    session?: string, 
    startDate?: string, 
    endDate?: string, 
    searchTerm?: string,
    page?: number,
    pageSize?: number
  }): Promise<{ trades: Trade[], totalCount: number }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Acceso denegado");

    let query = supabase
      .from('trades')
      .select('*, traders(nombre)', { count: 'exact' })
      .eq('user_id', user.id);

    if (params?.traderId && params.traderId !== 'all') {
      const safeTraderId = prepareId(params.traderId);
      if (safeTraderId) query = query.eq('trader_id', safeTraderId);
    }
    
    if (params?.session && params.session !== 'all') query = query.eq('sesion', params.session);
    if (params?.startDate) query = query.gte('fecha', `${params.startDate}T00:00:00`);
    if (params?.endDate) query = query.lte('fecha', `${params.endDate}T23:59:59`);
    if (params?.searchTerm) query = query.ilike('activo', `%${params.searchTerm}%`);

    query = query.order('fecha', { ascending: false });

    if (params?.page !== undefined && params?.pageSize !== undefined) {
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { 
      trades: (data || []).map(t => {
        const virtualData = parseVirtualData(t.notas);
        return {
          id: String(t.id),
          trader_id: String(t.trader_id || ""),
          fecha_entrada: t.fecha ? t.fecha.split('T')[0] : '',
          hora_entrada: t.fecha ? t.fecha.split('T')[1]?.substring(0, 5) : '',
          activo: t.activo || 'Sin Activo',
          direccion: t.direccion || 'Compra',
          resultado_estado: t.estado || 'Pendiente',
          resultado_r: parseFloat(t.ratio_rb || "0"),
          monto_riesgo: parseFloat(virtualData.monto_riesgo ?? t.monto_riesgo ?? "0"), 
          sesion: t.sesion || 'Londres',
          trader_name: t.traders?.nombre || 'Desconocido',
          estrategia: virtualData.estrategia || '',
          nota_trader: virtualData.nota_trader || ''
        } as any;
      }), 
      totalCount: count || 0 
    };
  },

  fetchTraders: async (): Promise<Trader[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sin sesión");

    const { data: traderData, error: traderError } = await supabase
      .from('traders')
      .select('id, nombre, user_id')
      .eq('user_id', user.id)
      .order('nombre');
    
    if (traderError) throw traderError;

    const { data: tradeData } = await supabase
      .from('trades')
      .select('trader_id, monto_riesgo, notas')
      .eq('user_id', user.id);

    const localSettings = getLocalFinancialSettings();

    return (traderData || []).map(t => {
      const idStr = String(t.id);
      const s = localSettings[idStr] || {};
      const traderTrades = (tradeData || []).filter(tr => String(tr.trader_id) === idStr);
      const totalProfit = traderTrades.reduce((acc, tr) => {
        const vData = parseVirtualData(tr.notas);
        return acc + parseFloat(vData.monto_riesgo ?? tr.monto_riesgo ?? "0");
      }, 0);

      return {
        id: idStr,
        user_id: t.user_id,
        nombre: t.nombre || s.nombre || 'Sin Nombre',
        capital_inicial: Number(s.capital_inicial || 0),
        capital_actual: Number(s.capital_inicial || 0) + totalProfit,
        metodo_calculo: s.metodo_calculo || 'valor_r',
        valor_r: Number(s.valor_r || 0),
        riesgo_porcentaje: Number(s.riesgo_porcentaje || 0),
        rol: s.rol || 'alumno',
        activo: true
      } as Trader;
    });
  },

  saveTrade: async (trade: Partial<Trade>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada");

    const virtualData = {
      monto_riesgo: trade.monto_riesgo,
      estrategia: trade.estrategia,
      nota_trader: trade.nota_trader
    };
    
    const payload = {
      user_id: user.id,
      trader_id: prepareId(trade.trader_id),
      fecha: trade.fecha_entrada && trade.hora_entrada ? `${trade.fecha_entrada}T${trade.hora_entrada}:00` : new Date().toISOString(),
      activo: trade.activo,
      direccion: trade.direccion,
      estado: trade.resultado_estado || 'Pendiente',
      ratio_rb: trade.resultado_r,
      monto_riesgo: trade.monto_riesgo,
      sesion: trade.sesion,
      notas: `__VIRTUAL_DATA__:${JSON.stringify(virtualData)}__END_VIRTUAL__`
    };

    const safeId = prepareId(trade.id);
    if (safeId) {
      const { error } = await supabase.from('trades').update(payload).eq('id', safeId).eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('trades').insert([payload]);
      if (error) throw error;
    }
    return true;
  },

  saveTrader: async (trader: Partial<Trader>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada.");

    const payload = {
      user_id: user.id,
      nombre: trader.nombre,
      updated_at: new Date().toISOString()
    };

    const existingId = prepareId(trader.id);
    if (existingId) {
      const { error } = await supabase.from('traders').update(payload).eq('id', existingId).eq('user_id', user.id);
      if (error) throw error;
      saveLocalFinancialSettings(String(existingId), trader);
    } else {
      const { data, error } = await supabase.from('traders').insert([payload]).select('id');
      if (error) throw error;
      if (data && data[0]) saveLocalFinancialSettings(String(data[0].id), trader);
    }
    return true;
  }
};
