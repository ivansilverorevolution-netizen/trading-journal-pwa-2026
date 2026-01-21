
import { Trade, Trader, AppUser } from '../types';

const STORAGE_KEYS = {
  TRADES: 'academy_trades',
  TRADERS: 'academy_traders',
  USER: 'academy_user'
};

// Servicio de persistencia local utilizando localStorage
export const dbService = {
  isCloudEnabled: () => false,
  
  // Obtiene el usuario actual de la sesión local
  getCurrentUser: (): AppUser | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  // Guarda o elimina el usuario de la sesión actual
  setCurrentUser: (user: AppUser | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // Recupera todas las operaciones registradas
  getTrades: (): Trade[] => {
    const trades = localStorage.getItem(STORAGE_KEYS.TRADES);
    const parsedTrades: Trade[] = trades ? JSON.parse(trades) : [];
    const traders = dbService.getTraders();
    
    // Enriquecer cada operación con el nombre del trader correspondiente
    return parsedTrades.map(t => ({
      ...t,
      trader_name: traders.find(tr => tr.id === t.trader_id)?.nombre || 'Desconocido'
    }));
  },

  // Crea una nueva operación o actualiza una existente
  saveTrade: (trade: Partial<Trade>) => {
    const trades = dbService.getTrades();
    if (trade.id) {
      const index = trades.findIndex(t => t.id === trade.id);
      if (index !== -1) {
        trades[index] = { ...trades[index], ...trade, updated_at: new Date().toISOString() } as Trade;
      }
    } else {
      const newTrade = {
        ...trade,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Trade;
      trades.push(newTrade);
    }
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  },

  // Elimina una operación por su ID
  deleteTrade: (id: string) => {
    const trades = dbService.getTrades();
    const filtered = trades.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(filtered));
  },

  // Recupera la lista de todos los miembros del equipo
  getTraders: (): Trader[] => {
    const traders = localStorage.getItem(STORAGE_KEYS.TRADERS);
    return traders ? JSON.parse(traders) : [];
  },

  // Registra un nuevo miembro o edita uno existente
  saveTrader: (trader: Partial<Trader>) => {
    const traders = dbService.getTraders();
    if (trader.id) {
      const index = traders.findIndex(t => t.id === trader.id);
      if (index !== -1) {
        traders[index] = { ...traders[index], ...trader, updated_at: new Date().toISOString() } as Trader;
      }
    } else {
      const newTrader = {
        ...trader,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Trader;
      traders.push(newTrader);
    }
    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(traders));
  },

  // Elimina un miembro del equipo
  deleteTrader: (id: string) => {
    const traders = dbService.getTraders();
    const filtered = traders.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(filtered));
  },

  // Inicializa datos de prueba si el almacenamiento está vacío
  initializeDefaultData: () => {
    if (!localStorage.getItem(STORAGE_KEYS.TRADERS)) {
      const defaultTraders: Trader[] = [
        {
          id: crypto.randomUUID(),
          user_id: 'default',
          nombre: 'Mentor Principal',
          correo_electronico: 'admin@academy.com',
          rol: 'mentor',
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.TRADERS, JSON.stringify(defaultTraders));
    }
  }
};
