import { Trader, Trade, AppUser } from '../types';

const STORAGE_KEYS = {
  TRADERS: 'academy_traders_local',
  TRADES: 'academy_trades_local',
  USER: 'current_user'
};

export const dbService = {
  isCloudEnabled(): boolean {
    return false;
  },

  getCurrentUser(): AppUser | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("User parse error", error);
      return null;
    }
  },

  getTraders(): Trader[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const data = localStorage.getItem(STORAGE_KEYS.TRADERS);
    const traders: Trader[] = data ? JSON.parse(data) : [];
    return traders.filter((t: Trader) => t.user_id === user.id);
  },

  saveTrader(traderData: Partial<Trader>): Trader {
    const user = this.getCurrentUser();
    const userId = user?.id || 'default-user';
    
    const newTrader: Trader = {
      id: traderData.id || crypto.randomUUID(),
      user_id: userId,
      nombre: traderData.nombre || 'New Member',
      correo_electronico: traderData.correo_electronico || '',
      rol: traderData.rol || 'alumno',
      activo: traderData.activo ?? true,
      created_at: traderData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allTradersData = localStorage.getItem(STORAGE_KEYS.TRADERS);
    let allTraders: Trader[] = allTradersData ? JSON.parse(allTradersData) : [];
    
    const index = allTraders.findIndex((t: Trader) => t.id === newTrader.id);
    if (index > -1) {
      allTraders[index] = newTrader;
    } else {
      allTraders.push(newTrader);
    }

    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(allTraders));
    return newTrader;
  },

  deleteTrader(id: string): void {
    const allTradersData = localStorage.getItem(STORAGE_KEYS.TRADERS);
    if (!allTradersData) return;
    const allTraders: Trader[] = JSON.parse(allTradersData);
    const filtered = allTraders.filter((t: Trader) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(filtered));
  },

  getTrades(): Trade[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    const traders = this.getTraders();
    const data = localStorage.getItem(STORAGE_KEYS.TRADES);
    const trades: Trade[] = data ? JSON.parse(data) : [];
    
    return trades
      .filter((t: Trade) => t.user_id === user.id)
      .map((trade: Trade) => ({
        ...trade,
        trader_name: traders.find((tr: Trader) => tr.id === trade.trader_id)?.nombre || 'Unknown'
      }));
  },

  saveTrade(tradeData: Partial<Trade>): Trade {
    const user = this.getCurrentUser();
    const userId = user?.id || 'default-user';

    const newTrade: Trade = {
      ...tradeData as Trade,
      id: tradeData.id || crypto.randomUUID(),
      user_id: userId,
      created_at: tradeData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allTradesData = localStorage.getItem(STORAGE_KEYS.TRADES);
    let allTrades: Trade[] = allTradesData ? JSON.parse(allTradesData) : [];
    
    const index = allTrades.findIndex((t: Trade) => t.id === newTrade.id);
    if (index > -1) {
      allTrades[index] = newTrade;
    } else {
      allTrades.push(newTrade);
    }

    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(allTrades));
    return newTrade;
  },

  deleteTrade(id: string): void {
    const allTradesData = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (!allTradesData) return;
    const allTrades: Trade[] = JSON.parse(allTradesData);
    const filtered = allTrades.filter((t: Trade) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(filtered));
  },

  initializeDefaultData(userId: string): void {
    const traders = this.getTraders();
    if (traders.length === 0) {
      this.saveTrader({
        nombre: 'ADMIN ACADEMIA',
        rol: 'analista_senior',
        activo: true,
        user_id: userId
      });
    }
  }
};