import { Trade, Trader, AppUser } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  TRADES: 'academy_trades',
  TRADERS: 'academy_traders',
  USER: 'academy_user'
};

export const dbService = {
  isCloudEnabled: () => true,

  getCurrentUser: (): AppUser | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: any) => {
    if (user) {
      const appUser: AppUser = {
        id: user.id,
        email: user.email || '',
        nombre_academia: user.user_metadata?.nombre_academia || 'Mi Academia',
        created_at: user.created_at || new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(appUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TRADES);
      localStorage.removeItem(STORAGE_KEYS.TRADERS);
    }
  },

  // Fetch all trades for current user from Supabase
  fetchTrades: async (): Promise<Trade[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching trades:', error);
      const local = localStorage.getItem(STORAGE_KEYS.TRADES);
      return local ? JSON.parse(local) : [];
    }

    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(data));
    return data || [];
  },

  getTrades: (): Trade[] => {
    const local = localStorage.getItem(STORAGE_KEYS.TRADES);
    return local ? JSON.parse(local) : [];
  },

  saveTrade: async (trade: Partial<Trade>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth user');

    const tradeData = {
      ...trade,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    let result;
    if (trade.id) {
      result = await supabase.from('trades').update(tradeData).eq('id', trade.id);
    } else {
      result = await supabase.from('trades').insert([{ ...tradeData, id: crypto.randomUUID(), created_at: new Date().toISOString() }]);
    }

    if (result.error) console.error('Supabase save error:', result.error);
    
    // Always update local for responsiveness
    const trades = dbService.getTrades();
    if (trade.id) {
      const idx = trades.findIndex(t => t.id === trade.id);
      if (idx !== -1) trades[idx] = { ...trades[idx], ...tradeData } as Trade;
    } else {
      trades.push({ ...tradeData, id: result.data?.[0]?.id || crypto.randomUUID() } as Trade);
    }
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  },

  deleteTrade: async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (error) console.error('Supabase delete error:', error);

    const trades = dbService.getTrades();
    const filtered = trades.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(filtered));
  },

  fetchTraders: async (): Promise<Trader[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('traders')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching traders:', error);
      const local = localStorage.getItem(STORAGE_KEYS.TRADERS);
      return local ? JSON.parse(local) : [];
    }

    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(data));
    return data || [];
  },

  getTraders: (): Trader[] => {
    const local = localStorage.getItem(STORAGE_KEYS.TRADERS);
    return local ? JSON.parse(local) : [];
  },

  saveTrader: async (trader: Partial<Trader>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth user');

    const traderData = {
      ...trader,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    if (trader.id) {
      await supabase.from('traders').update(traderData).eq('id', trader.id);
    } else {
      await supabase.from('traders').insert([{ ...traderData, id: crypto.randomUUID(), created_at: new Date().toISOString() }]);
    }

    const traders = dbService.getTraders();
    if (trader.id) {
      const idx = traders.findIndex(t => t.id === trader.id);
      if (idx !== -1) traders[idx] = { ...traders[idx], ...traderData } as Trader;
    } else {
      traders.push({ ...traderData, id: crypto.randomUUID() } as Trader);
    }
    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(traders));
  },

  deleteTrader: async (id: string) => {
    await supabase.from('traders').delete().eq('id', id);
    const traders = dbService.getTraders();
    const filtered = traders.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(filtered));
  },

  initializeDefaultData: () => {
    // No longer strictly needed with Supabase but kept for structure
  }
};