
export type TraderRole = 'analista_senior' | 'analista_junior' | 'alumno' | 'mentor';

export interface AppUser {
  id: string;
  nombre_academia: string;
  email: string;
  password?: string;
  created_at: string;
}

export interface Trader {
  id: string;
  user_id: string; // Relación con el dueño de la cuenta
  nombre: string;
  correo_electronico: string;
  rol: TraderRole;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type SessionType = 'Londres' | 'Nueva York' | 'Asia' | 'Extra' | 'Nueva York PM';
export type OperationType = 'senal_equipo' | 'operativa_propia' | 'alumno';
export type InstrumentType = 'FX' | 'Indice' | 'Cripto' | 'Materia prima';
export type DirectionType = 'Largo' | 'Corto';
export type ResultStatusType = 'Ganadora' | 'Perdedora' | 'BE' | 'Parcial';

export interface Trade {
  id: string;
  user_id: string; // Relación con el dueño de la cuenta
  trader_id: string;
  fecha_entrada: string;
  hora_entrada: string;
  horario_entrada: string; // Nuevo campo para visualización
  dia_semana: string;      // Nuevo campo automático
  fecha_cierre?: string;
  hora_cierre?: string;
  sesion: SessionType;
  tipo_operativa: OperationType;
  activo: string;
  tipo_instrumento: InstrumentType;
  direccion: DirectionType;
  precio_entrada: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2?: number;
  take_profit_3?: number;
  resultado_estado?: ResultStatusType;
  resultado_r?: number;
  resultado_dinero?: number;
  estrategia: string;
  timeframe_setup: string;
  descripcion_analisis?: string;
  link_grafico?: string;
  gestion_trade?: string;
  error_principal?: string;
  nota_trader?: string;
  created_at: string;
  updated_at: string;
  
  // Joined property
  trader_name?: string;
}
