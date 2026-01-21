
import { Trader, Trade, AppUser } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIGURATION (DISABLED) ---
const SUPABASE_URL = 'https://zrpfulkklnjnkrvuiwbo.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_ElIgYT9fhZ-8oMFB-O1Pow_hycvPm9m';

const TRADERS_KEY = 'academy_traders_v3';
const TRADES_KEY = 'academy_trades_v3';

// Client kept for type safety if needed, but not used for network calls
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const dbService = {
  isCloudEnabled(): boolean {
    // FORCE FALSE: Completely disable cloud features as requested
    return false;
  },

  async getCurrentUserId(): Promise<string | null> {
    const stored = localStorage.getItem('academy_auth_user');
    if (stored) {
      const user = JSON.parse(stored);
      return user.id;
    }
    return 'local-default-user';
  },

  async syncFromCloud(): Promise<void> {
    // No-op: Cloud sync is disabled
    return Promise.resolve();
  },

  async initializeMockData(userId: string) {
    try {
      const traders = await this.getTraders();
      if (traders.length === 0) {
        await this.saveTrader({
          nombre: 'ADMIN ACADEMIA',
          rol: 'analista_senior',
          activo: true
        });
      }
    } catch (e) {
      console.error("Error initializing local data:", e);
    }
  },

  async getTraders(): Promise<Trader[]> {
    const userId = await this.getCurrentUserId();
    const data = localStorage.getItem(TRADERS_KEY);
    const allTraders: Trader[] = data ? JSON.parse(data) : [];
    return allTraders.filter(t => t.user_id === userId);
  },

  async saveTrader(trader: Partial<Trader>): Promise<Trader> {
    const userId = await this.getCurrentUserId() || 'local-default-user';

    const newTrader: Trader = {
      id: trader.id || crypto.randomUUID(),
      user_id: userId,
      nombre: trader.nombre || 'Nuevo Miembro',
      correo_electronico: trader.correo_electronico || '',
      rol: trader.rol || 'alumno',
      activo: trader.activo !== undefined ? trader.activo : true,
      created_at: trader.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allData = localStorage.getItem(TRADERS_KEY);
    const traders: Trader[] = allData ? JSON.parse(allData) : [];
    const index = traders.findIndex(t => t.id === newTrader.id);
    if (index > -1) traders[index] = newTrader;
    else traders.push(newTrader);
    localStorage.setItem(TRADERS_KEY, JSON.stringify(traders));

    return newTrader;
  },

  async deleteTrader(id: string): Promise<void> {
    const data = localStorage.getItem(TRADERS_KEY);
    const traders: Trader[] = data ? JSON.parse(data) : [];
    localStorage.setItem(TRADERS_KEY, JSON.stringify(traders.filter(t => t.id !== id)));
  },

  async getTrades(): Promise<Trade[]> {
    const userId = await this.getCurrentUserId();
    const traders = await this.getTraders();
    
    const data = localStorage.getItem(TRADES_KEY);
    const allTrades: Trade[] = data ? JSON.parse(data) : [];
    return allTrades
      .filter(t => t.user_id === userId)
      .map(trade => ({
        ...trade,
        trader_name: traders.find(t => t.id === trade.trader_id)?.nombre || 'Desconocido'
      }));
  },

  async saveTrade(trade: Partial<Trade>): Promise<Trade> {
    const userId = await this.getCurrentUserId() || 'local-default-user';

    const newTrade: Trade = {
      ...trade as Trade,
      id: trade.id || crypto.randomUUID(),
      user_id: userId,
      created_at: trade.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allData = localStorage.getItem(TRADES_KEY);
    const trades: Trade[] = allData ? JSON.parse(allData) : [];
    const index = trades.findIndex(t => t.id === newTrade.id);
    if (index > -1) trades[index] = newTrade;
    else trades.push(newTrade);
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));

    return newTrade;
  },

  async deleteTrade(id: string): Promise<void> {
    const data = localStorage.getItem(TRADES_KEY);
    const trades: Trade[] = data ? JSON.parse(data) : [];
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades.filter(t => t.id !== id)));
  }
};
