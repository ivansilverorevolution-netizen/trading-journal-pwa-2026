
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
  user_id: string;
  nombre: string;
  correo_electronico: string;
  rol: TraderRole;
  activo: boolean;
  capital_inicial: number;
  capital_actual?: number; // Calculado dinámicamente
  metodo_calculo: 'valor_r' | 'riesgo_porcentaje';
  valor_r: number;
  riesgo_porcentaje: number;
  created_at: string;
  updated_at: string;
}

export type SessionType = 'Londres' | 'Nueva York' | 'Asia' | 'Extra' | 'Nueva York PM';
export type OperationType = 'senal_equipo' | 'operativa_propia' | 'alumno';
export type InstrumentType = 'FX' | 'Indice' | 'Cripto' | 'Materia prima';
export type DirectionType = 'Compra' | 'Venta';
// Fixed: Added 'Pendiente' to ResultStatusType to fix assignment error in TradeForm and align with dbService usage.
export type ResultStatusType = 'Ganadora' | 'Perdedora' | 'BE' | 'Parcial' | 'Pendiente';

export interface Trade {
  id: string;
  user_id: string;
  trader_id: string;
  fecha_entrada: string;
  hora_entrada: string;
  horario_entrada: string;
  dia_semana: string;
  fecha_cierre?: string;
  hora_cierre?: string;
  sesion: SessionType;
  tipo_operativa: OperationType;
  activo: string;
  tipo_instrumento: InstrumentType;
  direccion: DirectionType;
  
  // Campos Financieros Simplificados
  monto_riesgo: number; // USD ganados/perdidos
  resultado_estado?: ResultStatusType;
  resultado_r?: number; // El multiplicador R (ej: 2.5)
  
  estrategia: string;
  nota_trader?: string;
  created_at: string;
  updated_at: string;
  trader_name?: string;
}