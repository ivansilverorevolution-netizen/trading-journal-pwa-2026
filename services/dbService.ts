
import { Trader, Trade, AppUser } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE (PROPORCIONADA POR EL USUARIO) ---
const SUPABASE_URL = 'https://zrpfulkklnjnkrvuiwbo.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_ElIgYT9fhZ-8oMFB-O1Pow_hycvPm9m';

const TRADERS_KEY = 'academy_traders_v3';
const TRADES_KEY = 'academy_trades_v3';

// Inicialización segura del cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const dbService = {
  isCloudEnabled(): boolean {
    return !!SUPABASE_URL && !!SUPABASE_KEY && SUPABASE_KEY.startsWith('sb_');
  },

  getCurrentUserId(): string {
    const userStr = localStorage.getItem('academy_auth_user');
    if (!userStr) return 'anonymous';
    try {
      return JSON.parse(userStr).id;
    } catch {
      return 'anonymous';
    }
  },

  // Sincronización robusta: Intenta bajar datos pero no bloquea si falla
  async syncFromCloud(): Promise<void> {
    if (!this.isCloudEnabled()) return;
    const userId = this.getCurrentUserId();
    if (userId === 'anonymous') return;
    
    try {
      // Nota: Si las tablas no existen en Supabase, esto devolverá error 404
      const [tradersRes, tradesRes] = await Promise.all([
        supabase.from('traders').select('*').eq('user_id', userId),
        supabase.from('trades').select('*').eq('user_id', userId)
      ]);
      
      if (!tradersRes.error && tradersRes.data) {
        localStorage.setItem(TRADERS_KEY, JSON.stringify(tradersRes.data));
      }
      if (!tradesRes.error && tradesRes.data) {
        localStorage.setItem(TRADES_KEY, JSON.stringify(tradesRes.data));
      }
    } catch (e) {
      console.error("Error de sincronización con la nube. Usando datos locales.", e);
    }
  },

  async initializeMockData(userId: string) {
    try {
      const existingTraders = await this.getTraders();
      if (existingTraders.length === 0) {
        const names = ['ADMIN ACADEMIA', 'ANALISTA SENIOR'];
        for (const name of names) {
          await this.saveTrader({
            nombre: name,
            rol: name.includes('ADMIN') ? 'analista_senior' : 'mentor',
            activo: true
          });
        }
      }
    } catch (e) {
      console.error("Error inicializando datos:", e);
    }
  },

  // Gestión de Miembros
  async getTraders(): Promise<Trader[]> {
    const userId = this.getCurrentUserId();
    
    // Intentar obtener de nube primero
    if (this.isCloudEnabled() && userId !== 'anonymous') {
      try {
        const { data, error } = await supabase.from('traders').select('*').eq('user_id', userId);
        if (!error && data) {
          localStorage.setItem(TRADERS_KEY, JSON.stringify(data));
          return data;
        }
      } catch (e) {}
    }

    // Fallback local
    const data = localStorage.getItem(TRADERS_KEY);
    const allTraders: Trader[] = data ? JSON.parse(data) : [];
    return allTraders.filter(t => t.user_id === userId);
  },

  async saveTrader(trader: Partial<Trader>): Promise<Trader> {
    const userId = this.getCurrentUserId();
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

    // 1. Guardar localmente siempre (inmediato)
    const allData = localStorage.getItem(TRADERS_KEY);
    const traders: Trader[] = allData ? JSON.parse(allData) : [];
    const index = traders.findIndex(t => t.id === newTrader.id);
    if (index > -1) traders[index] = newTrader;
    else traders.push(newTrader);
    localStorage.setItem(TRADERS_KEY, JSON.stringify(traders));

    // 2. Intentar guardar en nube de fondo
    if (this.isCloudEnabled() && userId !== 'anonymous') {
      try {
        await supabase.from('traders').upsert(newTrader);
      } catch (e) {
        console.warn("No se pudo persistir en la nube, guardado localmente.");
      }
    }

    return newTrader;
  },

  async deleteTrader(id: string): Promise<void> {
    const userId = this.getCurrentUserId();
    
    // Local
    const data = localStorage.getItem(TRADERS_KEY);
    const traders: Trader[] = data ? JSON.parse(data) : [];
    localStorage.setItem(TRADERS_KEY, JSON.stringify(traders.filter(t => t.id !== id)));

    // Nube
    if (this.isCloudEnabled() && userId !== 'anonymous') {
      try {
        await supabase.from('traders').delete().eq('id', id);
      } catch (e) {}
    }
  },

  // Gestión de Operaciones
  async getTrades(): Promise<Trade[]> {
    const userId = this.getCurrentUserId();
    const traders = await this.getTraders();
    
    if (this.isCloudEnabled() && userId !== 'anonymous') {
      try {
        const { data, error } = await supabase.from('trades').select('*').eq('user_id', userId);
        if (!error && data) {
          localStorage.setItem(TRADES_KEY, JSON.stringify(data));
          return data.map(trade => ({
            ...trade,
            trader_name: traders.find(t => t.id === trade.trader_id)?.nombre || 'Desconocido'
          }));
        }
      } catch (e) {}
    }

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
    const userId = this.getCurrentUserId();
    const newTrade: Trade = {
      ...trade as Trade,
      id: trade.id || crypto.randomUUID(),
      user_id: userId,
      created_at: trade.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Local
    const allData = localStorage.getItem(TRADES_KEY);
    const trades: Trade[] = allData ? JSON.parse(allData) : [];
    const index = trades.findIndex(t => t.id === newTrade.id);
    if (index > -1) trades[index] = newTrade;
    else trades.push(newTrade);
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));

    // Nube
    if (this.isCloudEnabled() && userId !== 'anonymous') {
      try {
        await supabase.from('trades').upsert(newTrade);
      } catch (e) {}
    }

    return newTrade;
  },

  async deleteTrade(id: string): Promise<void> {
    const userId = this.getCurrentUserId();
    
    const data = localStorage.getItem(TRADES_KEY);
    const trades: Trade[] = data ? JSON.parse(data) : [];
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades.filter(t => t.id !== id)));

    if (this.isCloudEnabled() && userId !== 'anonymous') {
      try {
        await supabase.from('trades').delete().eq('id', id);
      } catch (e) {}
    }
  }
};
