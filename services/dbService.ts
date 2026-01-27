
import { supabase } from './supabaseClient';
import { Trade, Trader, AppUser, OperationType, InstrumentType } from '../types';

const FINANCIAL_SETTINGS_KEY = 'academy_trader_financial_settings';

const getLocalFinancialSettings = () => {
  const data = localStorage.getItem(FINANCIAL_SETTINGS_KEY);
  return data ? JSON.parse(data) : {};
};

const saveLocalFinancialSettings = (traderId: string, settings: any) => {
  if (!traderId) return;
  const allSettings = getLocalFinancialSettings();
  allSettings[traderId] = {
    capital_inicial: Number(settings.capital_inicial) || 0,
    metodo_calculo: settings.metodo_calculo || 'valor_r',
    valor_r: Number(settings.valor_r) || 0,
    riesgo_porcentaje: Number(settings.riesgo_porcentaje) || 0
  };
  localStorage.setItem(FINANCIAL_SETTINGS_KEY, JSON.stringify(allSettings));
};

const formatIdForDb = (id: any) => {
  if (id === null || id === undefined || id === '' || id === 'all') return null;
  const strId = String(id).trim();
  if (/^\d+$/.test(strId)) return parseInt(strId, 10);
  return strId;
};

const parseVirtualData = (notas: string | null) => {
  if (!notas) return {};
  try {
    if (notas.startsWith('__VIRTUAL_DATA__:')) {
      const jsonStr = notas.split('__VIRTUAL_DATA__:')[1].split('__END_VIRTUAL__')[0];
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    try { return JSON.parse(notas || '{}'); } catch { return {}; }
  }
  return {};
};

const cleanPayload = (obj: any) => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
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
    if (!user) return { trades: [], totalCount: 0 };

    let query = supabase
      .from('trades')
      .select('*, traders(nombre)', { count: 'exact' })
      .eq('user_id', user.id);

    if (params?.traderId && params.traderId !== 'all') {
      const tid = formatIdForDb(params.traderId);
      if (tid) query = query.eq('trader_id', tid);
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

    const mappedTrades = (data || []).map(t => {
      const virtualData = parseVirtualData(t.notas);
      return {
        id: t.id.toString(),
        trader_id: t.trader_id?.toString() || "",
        fecha_entrada: t.fecha ? t.fecha.split('T')[0] : '',
        activo: t.activo || 'S/A',
        direccion: t.direccion || 'Compra',
        resultado_estado: t.estado || 'Pendiente',
        resultado_r: parseFloat(t.ratio_rb || virtualData.ratio_rb || "0"),
        monto_riesgo: parseFloat(virtualData.monto_riesgo || "0"), 
        sesion: t.sesion || 'Londres',
        trader_name: t.traders?.nombre || 'Desconocido',
        estrategia: t.estrategia || '',
        nota_trader: t.notas?.includes('__END_VIRTUAL__') ? t.notas.split('__END_VIRTUAL__')[1].trim() : (t.notas || '')
      } as any;
    });

    return { trades: mappedTrades, totalCount: count || 0 };
  },

  saveTrade: async (trade: Partial<Trade>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada.");

    const tId = formatIdForDb(trade.trader_id);
    if (!tId) throw new Error("Debe seleccionar una cuenta válida.");

    const virtualPayload = {
      monto_riesgo: trade.monto_riesgo || 0,
      ratio_rb: trade.resultado_r || 0
    };

    const payload: any = cleanPayload({
      user_id: user.id,
      trader_id: tId,
      fecha: `${trade.fecha_entrada}T${trade.hora_entrada || '00:00'}:00`,
      activo: trade.activo,
      direccion: trade.direccion,
      estado: trade.resultado_estado || 'Pendiente',
      sesion: trade.sesion || 'Londres',
      estrategia: trade.estrategia || '',
      ratio_rb: trade.resultado_r || 0,
      notas: `__VIRTUAL_DATA__:${JSON.stringify(virtualPayload)}__END_VIRTUAL__\n${trade.nota_trader || ''}`
    });

    const existingId = formatIdForDb(trade.id);
    if (existingId) { 
      const { error } = await supabase.from('trades').update(payload).eq('id', existingId);
      if (error) throw error;
    } else {
      // Intento 1: Sin ID (para que la DB lo genere)
      const { error: err1 } = await supabase.from('trades').insert(payload);
      
      // Si falla por restricción NOT NULL (error 23502), reintentamos con UUID
      if (err1) {
        if (err1.code === '23502') {
          const { error: err2 } = await supabase.from('trades').insert({ ...payload, id: crypto.randomUUID() });
          if (err2) throw err2;
        } else {
          throw err1;
        }
      }
    }
  },

  fetchTraders: async (): Promise<Trader[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: traderData, error: traderError } = await supabase
      .from('traders')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre');
    
    if (traderError) throw traderError;

    const { data: tradeData } = await supabase.from('trades').select('trader_id, notas').eq('user_id', user.id);
    const localSettings = getLocalFinancialSettings();

    return (traderData || []).map(t => {
      const idStr = t.id.toString();
      const s = localSettings[idStr] || {};
      const initialCap = Number(s.capital_inicial || 0);
      const totalProfit = (tradeData || [])
        .filter(tr => tr.trader_id?.toString() === idStr)
        .reduce((acc, tr) => acc + parseFloat(parseVirtualData(tr.notas).monto_riesgo ?? "0"), 0);

      return {
        id: idStr,
        user_id: t.user_id,
        nombre: t.nombre,
        correo_electronico: t.correo || '',
        rol: t.rol || 'alumno',
        capital_inicial: initialCap,
        capital_actual: initialCap + totalProfit,
        metodo_calculo: s.metodo_calculo || 'valor_r',
        valor_r: s.valor_r || 0,
        riesgo_porcentaje: s.riesgo_porcentaje || 0,
        activo: true,
        created_at: t.created_at || '',
        updated_at: t.updated_at || ''
      } as Trader;
    });
  },

  saveTrader: async (trader: Partial<Trader>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Acceso denegado");

    const payload: any = cleanPayload({
      user_id: user.id,
      nombre: trader.nombre,
      correo: trader.correo_electronico || '',
      rol: trader.rol || 'alumno'
    });

    const tid = formatIdForDb(trader.id);
    if (tid) {
      const { error } = await supabase.from('traders').update(payload).eq('id', tid).eq('user_id', user.id);
      if (error) throw error;
      saveLocalFinancialSettings(String(tid), trader);
    } else {
      // Estrategia adaptativa para Traders
      const { data, error: err1 } = await supabase.from('traders').insert(payload).select();
      
      if (err1) {
        if (err1.code === '23502') {
          const newId = crypto.randomUUID();
          const { data: d2, error: err2 } = await supabase.from('traders').insert({ ...payload, id: newId }).select();
          if (err2) throw err2;
          if (d2 && d2[0]) saveLocalFinancialSettings(String(d2[0].id), trader);
        } else {
          throw err1;
        }
      } else if (data && data[0]) {
        saveLocalFinancialSettings(String(data[0].id), trader);
      }
    }
    return true;
  },

  deleteTrade: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada");
    const { data, error } = await supabase.from('trades').delete().eq('id', formatIdForDb(id)).eq('user_id', user.id).select();
    if (error) throw error;
    return true;
  },

  deleteTrades: async (ids: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada");
    const { data, error } = await supabase.from('trades').delete().in('id', ids.map(id => formatIdForDb(id))).eq('user_id', user.id).select();
    if (error) throw error;
    return true;
  },

  deleteTrader: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada");
    const safeId = formatIdForDb(id);
    await supabase.from('trades').delete().eq('trader_id', safeId).eq('user_id', user.id);
    const { data, error } = await supabase.from('traders').delete().eq('id', safeId).eq('user_id', user.id).select();
    if (error) throw error;
    const settings = getLocalFinancialSettings();
    if (settings[String(id)]) {
      delete settings[String(id)];
      localStorage.setItem(FINANCIAL_SETTINGS_KEY, JSON.stringify(settings));
    }
    return true;
  }
};
