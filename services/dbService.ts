
import { supabase } from './supabaseClient';
import { Trade, Trader, AppUser, OperationType, InstrumentType } from '../types';

const FINANCIAL_SETTINGS_KEY = 'academy_trader_financial_settings';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

const formatIdForDb = (id: string | number | undefined | null) => {
  if (id === null || id === undefined) return null;
  const strId = id.toString().trim();
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

  fetchTrades: async (): Promise<Trade[]> => {
    const { data, error } = await supabase
      .from('trades')
      .select('*, traders(nombre)')
      .order('fecha', { ascending: false });

    if (error) throw error;

    return (data || []).map(t => {
      const tradeDate = t.fecha ? new Date(t.fecha) : new Date();
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dia_semana = days[tradeDate.getDay()];
      const virtualData = parseVirtualData(t.notas);

      return {
        id: t.id.toString(),
        user_id: t.user_id,
        trader_id: t.trader_id?.toString() || "",
        fecha_entrada: t.fecha ? t.fecha.split('T')[0] : '',
        hora_entrada: t.fecha ? t.fecha.split('T')[1]?.substring(0, 5) : '',
        horario_entrada: t.sesion || 'Londres',
        dia_semana: dia_semana,
        activo: t.activo || 'Sin Activo',
        tipo_operativa: (t.tipo_operativa as OperationType) || 'operativa_propia',
        tipo_instrumento: (t.tipo_instrumento as InstrumentType) || 'FX',
        direccion: t.direccion || 'Compra',
        resultado_estado: t.estado || 'Pendiente',
        resultado_r: parseFloat(t.ratio_rb || "0"),
        monto_riesgo: parseFloat(virtualData.monto_riesgo ?? "0"),
        precio_entrada: parseFloat(virtualData.precio_entrada ?? "0"),
        stop_loss: parseFloat(virtualData.stop_loss ?? "0"),
        take_profit_1: parseFloat(virtualData.take_profit_1 ?? "0"),
        resultado_dinero: parseFloat(t.ratio_rb || "0") * parseFloat(virtualData.monto_riesgo ?? "0"),
        sesion: t.sesion || 'Londres',
        estrategia: t.estrategia || '',
        nota_trader: t.notas?.includes('__END_VIRTUAL__') ? t.notas.split('__END_VIRTUAL__')[1].trim() : (t.notas || ''),
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at,
        trader_name: t.traders?.nombre || 'Desconocido'
      } as Trade;
    });
  },

  saveTrade: async (trade: Partial<Trade>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión expirada.");

    const virtualPayload = {
      monto_riesgo: trade.monto_riesgo || 0,
      precio_entrada: trade.precio_entrada || 0,
      stop_loss: trade.stop_loss || 0,
      take_profit_1: trade.take_profit_1 || 0
    };

    const virtualString = `__VIRTUAL_DATA__:${JSON.stringify(virtualPayload)}__END_VIRTUAL__`;
    const finalNotas = `${virtualString}\n${trade.nota_trader || ''}`;

    const tradeData: any = {
      user_id: user.id,
      trader_id: trade.trader_id ? formatIdForDb(trade.trader_id) : null, 
      fecha: `${trade.fecha_entrada}T${trade.hora_entrada}:00`,
      activo: trade.activo,
      direccion: trade.direccion,
      estado: trade.resultado_estado || 'Pendiente',
      ratio_rb: trade.resultado_r || 0,
      sesion: trade.sesion,
      estrategia: trade.estrategia,
      notas: finalNotas,
      updated_at: new Date().toISOString()
    };

    if (trade.id) {
      const { error } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', formatIdForDb(trade.id));
      if (error) throw error;
    } else {
      // Intentar enviar ID manual si es UUID, o dejar nulo si es Serial
      // Para mayor robustez ante el error del usuario, generamos uno si no existe
      tradeData.id = generateUUID();
      const { error } = await supabase.from('trades').insert([tradeData]);
      if (error) throw error;
    }
  },

  fetchTraders: async (): Promise<Trader[]> => {
    const { data: traderData, error: traderError } = await supabase.from('traders').select('*').order('nombre');
    if (traderError) throw traderError;

    const { data: tradeData, error: tradeError } = await supabase.from('trades').select('trader_id, ratio_rb, notas');
    if (tradeError) throw tradeError;

    const localSettings = getLocalFinancialSettings();

    return (traderData || []).map(t => {
      const idStr = t.id.toString();
      const settings = localSettings[idStr] || {};
      const initialCap = settings.capital_inicial !== undefined ? settings.capital_inicial : (t.capital_inicial || 0);
      
      const traderTrades = (tradeData || []).filter(tr => tr.trader_id?.toString() === idStr);
      
      const totalProfit = traderTrades.reduce((acc, tr) => {
        const vData = parseVirtualData(tr.notas);
        const rValue = parseFloat(tr.ratio_rb || "0");
        const riskAmount = parseFloat(vData.monto_riesgo || "0");
        return acc + (rValue * riskAmount);
      }, 0);

      return {
        id: idStr,
        user_id: t.user_id,
        nombre: t.nombre,
        correo_electronico: t.correo,
        rol: t.rol,
        activo: true,
        capital_inicial: initialCap,
        capital_actual: initialCap + totalProfit,
        metodo_calculo: settings.metodo_calculo || 'valor_r',
        valor_r: settings.valor_r !== undefined ? settings.valor_r : 10,
        riesgo_porcentaje: settings.riesgo_porcentaje !== undefined ? settings.riesgo_porcentaje : 1,
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at
      } as Trader;
    });
  },

  saveTrader: async (trader: Partial<Trader>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const basicTraderData: any = {
      user_id: user.id,
      nombre: trader.nombre,
      correo: trader.correo_electronico,
      rol: trader.rol,
      updated_at: new Date().toISOString()
    };

    if (trader.id) {
      const { error } = await supabase
        .from('traders')
        .update(basicTraderData)
        .eq('id', formatIdForDb(trader.id));
      if (error) throw error;
      saveLocalFinancialSettings(trader.id.toString(), trader);
    } else {
      basicTraderData.id = generateUUID();
      const { data, error } = await supabase
        .from('traders')
        .insert([basicTraderData])
        .select()
        .single();
      
      if (error) throw error;
      if (data && data.id) {
        saveLocalFinancialSettings(data.id.toString(), trader);
      }
    }
  },

  deleteTrade: async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', formatIdForDb(id));
    if (error) throw error;
    return true;
  },

  deleteTrader: async (id: string) => {
    const safeId = formatIdForDb(id);
    await supabase.from('trades').delete().eq('trader_id', safeId);
    const { error } = await supabase.from('traders').delete().eq('id', safeId);
    if (error) throw error;
    return true;
  }
};
